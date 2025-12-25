'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import ChessBoard from '@/components/ChessBoard';
import ColyseusChessGame from './ColyseusChessGame'; // Refresh
import { Chat } from '@/components/Chat';
import { createInitialState, executeMove, isValidMove } from '@/lib/chess/engine';
import { GameState, Player, Coordinates } from '@/lib/chess/types';
import { getBestMove } from '@/lib/chess/ai';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue, update, get, onChildAdded, onDisconnect, off } from 'firebase/database';
import { IconBack, IconDice, IconKey, IconRobot, IconHourglass } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

export default function ChessPage() {
    const router = useRouter();
    const { playerName: savedName, savePlayerName, isLoaded } = usePlayer();
    const [mounted, setMounted] = useState(false);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPos, setSelectedPos] = useState<Coordinates | null>(null);
    const [validMoves, setValidMoves] = useState<Coordinates[]>([]);

    // Online State
    const [roomId, setRoomId] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<Player | null>(null);
    const [status, setStatus] = useState<'setup' | 'initial' | 'waiting' | 'playing' | 'finished'>('setup');
    const [playerId, setPlayerId] = useState<string>('');

    // Player State
    const [playerName, setPlayerName] = useState('');
    const [opponentName, setOpponentName] = useState('');
    const [joinMode, setJoinMode] = useState<'random' | 'room' | 'ai' | 'colyseus_random' | 'colyseus_room' | 'colyseus_room_active' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        setMounted(true);
        setPlayerId(Math.random().toString(36).substring(2, 15));
    }, []);

    useEffect(() => {
        if (isLoaded && savedName) {
            setPlayerName(savedName);
            setStatus('initial');
        }
    }, [isLoaded, savedName]);

    useEffect(() => {
        if (roomId === 'ai-match') {
            setGameState(createInitialState());
            setStatus('playing');
            setMessages([]);
        } else if (roomId) {
            setGameState(null);
            setMessages([]);
        }
    }, [roomId]);

    // Firebase Listener
    useEffect(() => {
        if (!roomId || !myRole || roomId === 'ai-match') return;

        const roomRef = ref(db, `chess_rooms/${roomId}`);

        const unsubscribeRoom = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            if (data.white && data.black) {
                if (status !== 'playing' && status !== 'finished') {
                    setStatus('playing');
                    setGameState(prev => prev || createInitialState());
                }
                if (myRole === 'white') setOpponentName(data.black.name);
                if (myRole === 'black') setOpponentName(data.white.name);
            }

            if (data.winner) {
                setGameState(prev => prev ? ({ ...prev, winner: data.winner }) : null);
                setStatus('finished');
            } else {
                if (status === 'finished') {
                    setStatus('playing');
                    setGameState(createInitialState());
                    setMessages([]);
                }
            }
        });

        const movesRef = ref(db, `chess_rooms/${roomId}/moves`);
        const unsubscribeMoves = onChildAdded(movesRef, (snapshot) => {
            const moveData = snapshot.val();
            if (!moveData) return;

            setGameState(prev => {
                const currentState = prev || createInitialState();
                return executeMove(currentState, moveData.from, moveData.to);
            });
        });

        const chatRef = ref(db, `chess_rooms/${roomId}/chat`);
        const unsubscribeChat = onChildAdded(chatRef, (snapshot) => {
            const msg = snapshot.val();
            if (msg) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        });

        const rematchRef = ref(db, `chess_rooms/${roomId}/rematch`);
        const unsubscribeRematch = onValue(rematchRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.white && data.black) {
                if (myRole === 'white') {
                    set(ref(db, `chess_rooms/${roomId}/moves`), null);
                    set(ref(db, `chess_rooms/${roomId}/chat`), null);
                    set(ref(db, `chess_rooms/${roomId}/winner`), null);
                    set(ref(db, `chess_rooms/${roomId}/rematch`), null);
                }
            }
        });

        const myPlayerRef = ref(db, `chess_rooms/${roomId}/${myRole}`);
        onDisconnect(myPlayerRef).remove();

        return () => {
            unsubscribeRoom();
            unsubscribeMoves();
            off(movesRef);
            off(chatRef);
            off(roomRef);
            off(rematchRef);
            onDisconnect(myPlayerRef).cancel();
        };
    }, [roomId, myRole]);

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerName.trim()) {
            savePlayerName(playerName.trim());
            setStatus('initial');
        }
    };

    const joinRandomGame = async () => {
        setIsLoading(true);
        try {
            const roomsRef = ref(db, 'chess_rooms');
            const snapshot = await get(roomsRef);
            const rooms = snapshot.val();
            let foundRoomId = null;

            if (rooms) {
                for (const [id, room] of Object.entries(rooms) as [string, any][]) {
                    if (!room.white && !room.black) {
                        set(ref(db, `chess_rooms/${id}`), null);
                        continue;
                    }
                    if ((room.white && !room.black) || (!room.white && room.black)) {
                        foundRoomId = id;
                        break;
                    }
                }
            }

            if (foundRoomId) {
                const room = rooms[foundRoomId];
                if (!room.black) {
                    await update(ref(db, `chess_rooms/${foundRoomId}/black`), { name: playerName, id: playerId });
                    setRoomId(foundRoomId);
                    setMyRole('black');
                } else {
                    await update(ref(db, `chess_rooms/${foundRoomId}/white`), { name: playerName, id: playerId });
                    setRoomId(foundRoomId);
                    setMyRole('white');
                }
            } else {
                const newRoomRef = push(roomsRef);
                const newRoomId = newRoomRef.key!;
                const isWhite = Math.random() < 0.5;

                if (isWhite) {
                    await set(newRoomRef, { white: { name: playerName, id: playerId }, black: null });
                    setMyRole('white');
                } else {
                    await set(newRoomRef, { white: null, black: { name: playerName, id: playerId } });
                    setMyRole('black');
                }
                setRoomId(newRoomId);
                setStatus('waiting');
            }
        } catch (error) {
            console.error(error);
            alert("エラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    const joinRoomGame = async () => {
        if (!customRoomId.trim()) return;
        setIsLoading(true);
        try {
            const rid = customRoomId.trim();
            const roomRef = ref(db, `chess_rooms/${rid}`);
            const snapshot = await get(roomRef);
            const room = snapshot.val();

            if (!room) {
                const isWhite = Math.random() < 0.5;
                if (isWhite) {
                    await set(roomRef, { white: { name: playerName, id: playerId }, black: null });
                    setMyRole('white');
                } else {
                    await set(roomRef, { white: null, black: { name: playerName, id: playerId } });
                    setMyRole('black');
                }
                setRoomId(rid);
                setStatus('waiting');
            } else if (!room.black) {
                await update(ref(db, `chess_rooms/${rid}/black`), { name: playerName, id: playerId });
                setRoomId(rid);
                setMyRole('black');
            } else if (!room.white) {
                await update(ref(db, `chess_rooms/${rid}/white`), { name: playerName, id: playerId });
                setRoomId(rid);
                setMyRole('white');
            } else {
                alert('満員です');
            }
        } catch (error) {
            console.error(error);
            alert("エラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    const startAIGame = () => {
        setMyRole('white');
        setOpponentName('AI');
        setRoomId('ai-match');
    };

    // AI Logic
    useEffect(() => {
        if (roomId !== 'ai-match' || !gameState || gameState.turn !== 'black' || status !== 'playing') return;

        const timer = setTimeout(() => {
            const bestMove = getBestMove(gameState, 'black');
            if (bestMove) {
                const newState = executeMove(gameState, bestMove.from, bestMove.to);
                setGameState(newState);
                if (newState.winner) setStatus('finished');
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [gameState, roomId, status]);

    const handleCellClick = (x: number, y: number) => {
        if (!gameState || !myRole || gameState.turn !== myRole || status !== 'playing') return;

        const piece = gameState.board[y][x];

        // 駒選択
        if (piece && piece.player === myRole) {
            setSelectedPos({ x, y });
            // 有効な移動先を計算
            const moves: Coordinates[] = [];
            for (let dy = 0; dy < 8; dy++) {
                for (let dx = 0; dx < 8; dx++) {
                    if (isValidMove(gameState, { x, y }, { x: dx, y: dy })) {
                        moves.push({ x: dx, y: dy });
                    }
                }
            }
            setValidMoves(moves);
            return;
        }

        // 移動実行
        if (selectedPos) {
            const isValid = validMoves.some(m => m.x === x && m.y === y);
            if (isValid) {
                if (roomId === 'ai-match') {
                    const newState = executeMove(gameState, selectedPos, { x, y });
                    setGameState(newState);
                    if (newState.winner) setStatus('finished');
                } else {
                    push(ref(db, `chess_rooms/${roomId}/moves`), { from: selectedPos, to: { x, y } });
                }
                setSelectedPos(null);
                setValidMoves([]);
            } else {
                // 無効な移動先をクリックした場合、選択解除
                setSelectedPos(null);
                setValidMoves([]);
            }
        }
    };

    const handleSendMessage = (text: string) => {
        if (roomId === 'ai-match') {
            setMessages(prev => [...prev, { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() }]);
            return;
        }
        if (roomId) {
            push(ref(db, `chess_rooms/${roomId}/chat`), { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() });
        }
    };

    const handleBackToTop = () => {
        if (roomId && myRole && roomId !== 'ai-match') {
            const myPlayerRef = ref(db, `chess_rooms/${roomId}/${myRole}`);
            set(myPlayerRef, null);
            onDisconnect(myPlayerRef).cancel();
        }
        router.push('/');
    };

    const handleRematch = () => {
        if (roomId === 'ai-match') {
            setGameState(createInitialState());
            setStatus('playing');
            setMessages([]);
        } else if (roomId && myRole) {
            update(ref(db, `chess_rooms/${roomId}/rematch`), { [myRole]: true });
        }
    };

    if (!mounted) return <div className={styles.main}>Loading...</div>;

    if (status === 'setup') {
        return (
            <main className={styles.main}>
                <div className={styles.setupContainer}>
                    <h1 className={styles.title}>チェス</h1>
                    <form onSubmit={handleNameSubmit} className={styles.setupForm}>
                        <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="プレイヤー名" className={styles.input} required />
                        <button type="submit" className={styles.primaryBtn}>次へ</button>
                    </form>
                </div>
            </main>
        );
    }

    if (joinMode === 'colyseus_random') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={() => setJoinMode(null)} className={styles.backButton}>戻る</button></div>
                <ColyseusChessGame mode="random" userData={{ name: playerName, id: playerId }} />
            </main>
        );
    }

    if (joinMode === 'colyseus_room_active') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={() => setJoinMode(null)} className={styles.backButton}>戻る</button></div>
                <ColyseusChessGame mode="room" roomId={customRoomId || undefined} userData={{ name: playerName, id: playerId }} />
            </main>
        );
    }

    if (joinMode === 'colyseus_room') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={() => setJoinMode(null)} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={styles.gameContainer}>
                    <h1 className={styles.title}>ルーム対戦</h1>

                    <div className={styles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', width: '100%', maxWidth: '340px' }}>
                            {/* Create Section */}
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button
                                    onClick={() => { setCustomRoomId(''); setJoinMode('colyseus_room_active'); }}
                                    className={styles.primaryBtn}
                                    style={{ width: '100%', background: 'linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', padding: '1rem' }}
                                >
                                    ルーム作成（ID自動発行）
                                </button>
                            </div>

                            <div style={{ position: 'relative', height: '1px', background: 'rgba(0,0,0,0.1)', width: '100%' }}>
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#f7fafc', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
                            </div>

                            {/* Join Section */}
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={customRoomId}
                                        onChange={(e) => setCustomRoomId(e.target.value)}
                                        placeholder="6桁のID"
                                        className={styles.input}
                                        maxLength={10}
                                        style={{ flex: 1, letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.1rem' }}
                                        inputMode="numeric"
                                    />
                                    <button
                                        onClick={() => { if (customRoomId) setJoinMode('colyseus_room_active'); }}
                                        className={styles.primaryBtn}
                                        style={{ width: 'auto', padding: '0 2rem', fontSize: '1rem', whiteSpace: 'nowrap' }}
                                        disabled={!customRoomId}
                                    >
                                        参加
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (status === 'initial') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>

                <div className={styles.gameContainer}>
                    <h1 className={styles.title}>チェス</h1>
                    {!joinMode ? (
                        <div className={styles.modeSelection}>
                            <button onClick={() => setJoinMode('colyseus_random')} className={styles.modeBtn}>
                                <IconDice size={48} color="#2b6cb0" />
                                <span className={styles.modeBtnTitle}>オンライン対戦</span>
                            </button>
                            <button onClick={() => setJoinMode('colyseus_room')} className={styles.modeBtn}>
                                <IconKey size={48} color="#2b6cb0" />
                                <span className={styles.modeBtnTitle}>ルーム対戦</span>
                            </button>
                            <button onClick={startAIGame} className={styles.modeBtn}>
                                <IconRobot size={48} color="#2b6cb0" />
                                <span className={styles.modeBtnTitle}>AI対戦</span>
                            </button>
                        </div>
                    ) : joinMode === 'random' ? (
                        <div className={styles.joinSection}><p>マッチング中...</p><button onClick={() => setJoinMode(null)} className={styles.secondaryBtn}>キャンセル</button></div>
                    ) : (
                        <div className={styles.joinSection}>
                            <input type="text" value={customRoomId} onChange={e => setCustomRoomId(e.target.value)} placeholder="ルームID" className={styles.input} />
                            <button onClick={joinRoomGame} className={styles.primaryBtn}>参加/作成</button>
                            <button onClick={() => setJoinMode(null)} className={styles.secondaryBtn}>戻る</button>
                        </div>
                    )}
                </div>

                {/* AdSense Content Section */}
                <div className={styles.contentSection}>
                    <h2 className={styles.contentTitle}>チェスの世界へようこそ</h2>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>♔</span>
                            <h3 className={styles.sectionTitle}>チェスの歴史と起源</h3>
                        </div>
                        <p className={styles.textBlock}>
                            チェスの起源は、紀元前6世紀頃のインドの「チャトランガ」にあると言われています。
                            これがペルシャ、イスラム世界を経てヨーロッパに伝わり、ルネサンス期に現在のルールの原型が完成しました。
                            「王様のゲーム」とも呼ばれ、世界中で最も普及しているボードゲームの一つであり、スポーツとしても認知されています。
                        </p>
                    </div>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>♟️</span>
                            <h3 className={styles.sectionTitle}>基本ルール</h3>
                        </div>
                        <div className={styles.cardGrid}>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>1. 勝利条件</span>
                                <p className={styles.cardText}>相手のキングを攻撃し、逃げ場のない状態（チェックメイト）にすれば勝ちです。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>2. 駒の動き</span>
                                <p className={styles.cardText}>6種類の駒（キング、クイーン、ルーク、ビショップ、ナイト、ポーン）にはそれぞれ決まった動きがあります。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>3. 特殊ルール</span>
                                <p className={styles.cardText}>キャスリング（王の入城）、アンパッサン（ポーンの特殊な取り方）、プロモーション（昇格）などがあります。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>4. 引き分け</span>
                                <p className={styles.cardText}>ステイルメイト（動ける駒がないがチェックされていない状態）などは引き分けになります。</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>🧠</span>
                            <h3 className={styles.sectionTitle}>勝つためのセオリー</h3>
                        </div>
                        <p className={styles.textBlock}>
                            チェスには長い歴史の中で培われた多くの「定跡（オープニング）」や戦術があります。
                        </p>
                        <div className={styles.highlightBox}>
                            <span className={styles.highlightTitle}>中央を支配せよ</span>
                            <p className={styles.textBlock} style={{ marginBottom: 0 }}>
                                盤面の中央（d4, d5, e4, e5の4マス）は最も重要なエリアです。
                                ここをポーンや駒で支配することで、駒の活動範囲が広がり、攻守に有利に働きます。
                            </p>
                        </div>
                        <ul className={styles.list}>
                            <li className={styles.listItem}>
                                <strong>駒を展開する</strong><br />
                                序盤はナイトやビショップを前に出し、キャスリングをしてキングの安全を確保しましょう。同じ駒を何度も動かすのは手損になります。
                            </li>
                            <li className={styles.listItem}>
                                <strong>キングの安全</strong><br />
                                キングが中央に居座り続けるのは危険です。早めにキャスリングを行い、ポーンの壁で守りましょう。
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        );
    }

    if (status === 'waiting') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={styles.gameContainer}>
                    <h1>待機中...</h1>
                    <div className={styles.waitingAnimation}><IconHourglass size={64} color="#2b6cb0" /></div>
                    <p>ルームID: <span className={styles.roomId}>{roomId}</span></p>
                </div>
            </main>
        );
    }


    return (
        <main className={styles.main}>
            <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 終了</button></div>
            <div className={styles.gameLayout}>
                <div className={styles.leftPanel}>
                    <div className={styles.playersSection}>
                        <div className={styles.playerInfo}>
                            <p>{opponentName || '相手'}</p>
                            <p>{myRole === 'white' ? '黒 (後手)' : '白 (先手)'}</p>
                        </div>
                        <div className={styles.playerInfo}>
                            <p>{playerName} (自分)</p>
                            <p>{myRole === 'white' ? '白 (先手)' : '黒 (後手)'}</p>
                        </div>
                    </div>
                    <div className={styles.chatSection}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                    </div>
                </div>
                <div className={styles.centerPanel}>
                    <div className={styles.turnIndicator}>
                        {gameState?.turn === 'white' ? '白の番' : '黒の番'}
                        {gameState?.turn === myRole && ' (あなた)'}
                    </div>
                    <ChessBoard
                        board={gameState!.board}
                        onCellClick={handleCellClick}
                        selectedPos={selectedPos}
                        validMoves={validMoves}
                        turn={gameState!.turn}
                        isMyTurn={gameState!.turn === myRole}
                        winner={gameState!.winner}
                        myRole={myRole}
                    />
                </div>
            </div>
            {gameState?.winner && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>勝負あり！</h2>
                        <p>勝者: {gameState.winner === 'white' ? '白' : gameState.winner === 'black' ? '黒' : '引き分け'}</p>
                        <button onClick={handleRematch} className={styles.primaryBtn}>再戦</button>
                        <button onClick={handleBackToTop} className={styles.secondaryBtn}>終了</button>
                    </div>
                </div>
            )}


        </main>
    );
}
