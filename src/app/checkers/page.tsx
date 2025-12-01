'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue, update, get, onChildAdded, onDisconnect, off } from 'firebase/database';
import { IconBack, IconDice, IconKey, IconRobot, IconHourglass } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import styles from './page.module.css';
import { Chat } from '@/components/Chat';
import CheckersBoard from '@/components/CheckersBoard';
import { createInitialState, getValidMoves, move } from '@/lib/checkers/engine';
import { getBestMove } from '@/lib/checkers/ai';
import { GameState, Move, Player, Position } from '@/lib/checkers/types';

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

export default function CheckersPage() {
    const router = useRouter();
    const { playerId, playerName, isLoaded } = usePlayer();
    const [gameState, setGameState] = useState<GameState>(createInitialState());
    const [roomId, setRoomId] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<Player | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [status, setStatus] = useState<string>('初期化中...');
    const [selectedPos, setSelectedPos] = useState<Position | null>(null);
    const [opponentName, setOpponentName] = useState<string>('');

    // AI State
    const [isAiThinking, setIsAiThinking] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;
        setStatus('ゲームモードを選択してください');
    }, [isLoaded]);

    // Cleanup
    useEffect(() => {
        if (roomId && roomId !== 'ai-match') {
            const roomRef = ref(db, `checkers_rooms/${roomId}`);
            const disconnectRef = onDisconnect(roomRef);
            disconnectRef.cancel(); // Cancel previous disconnect logic if any

            // We don't delete room on unmount to allow reconnect, but we could mark as inactive
            return () => {
                off(roomRef);
                off(ref(db, `checkers_rooms/${roomId}/moves`));
                off(ref(db, `checkers_rooms/${roomId}/chat`));
            };
        }
    }, [roomId]);

    // AI Logic
    useEffect(() => {
        if (roomId !== 'ai-match' || gameState.winner || gameState.turn === 'red') return; // AI is Black

        const timer = setTimeout(() => {
            setIsAiThinking(true);
            const bestMove = getBestMove(gameState, 'black');
            if (bestMove) {
                const nextState = move(gameState, bestMove);
                setGameState(nextState);
            }
            setIsAiThinking(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [gameState, roomId]);

    // Firebase Sync
    useEffect(() => {
        if (!roomId || roomId === 'ai-match') return;

        const movesRef = ref(db, `checkers_rooms/${roomId}/moves`);
        const unsubscribe = onChildAdded(movesRef, (snapshot) => {
            const moveAction = snapshot.val();
            setGameState(prev => move(prev, moveAction));
        });

        const chatRef = ref(db, `checkers_rooms/${roomId}/chat`);
        const chatUnsub = onChildAdded(chatRef, (snapshot) => {
            setMessages(prev => [...prev, snapshot.val()]);
        });

        // Listen for opponent name
        const roomRef = ref(db, `checkers_rooms/${roomId}`);
        const roomUnsub = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                if (myRole === 'red' && data.blackName) setOpponentName(data.blackName);
                if (myRole === 'black' && data.redName) setOpponentName(data.redName);
            }
        });

        return () => {
            unsubscribe();
            chatUnsub();
            roomUnsub();
        };
    }, [roomId, myRole]);

    const createRoom = async () => {
        const roomRef = push(ref(db, 'checkers_rooms'));
        const id = roomRef.key!;
        await set(roomRef, {
            created: Date.now(),
            red: playerId,
            redName: playerName,
            black: null,
            status: 'waiting'
        });
        setRoomId(id);
        setMyRole('red');
        setStatus('対戦相手を待っています...');

        // Listen for opponent
        onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.black) {
                setStatus('対戦開始！');
            }
        });
    };

    const joinRandomGame = async () => {
        const roomsRef = ref(db, 'checkers_rooms');
        const snapshot = await get(roomsRef);
        let foundRoomId = null;

        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const room = child.val();
                if (room.status === 'waiting' && !room.black) {
                    foundRoomId = child.key;
                }
            });
        }

        if (foundRoomId) {
            await update(ref(db, `checkers_rooms/${foundRoomId}`), {
                black: playerId,
                blackName: playerName,
                status: 'playing'
            });
            setRoomId(foundRoomId);
            setMyRole('black');
            setStatus('対戦開始！');
        } else {
            createRoom();
        }
    };

    const startAiGame = () => {
        setRoomId('ai-match');
        setMyRole('red');
        setOpponentName('AI');
        setGameState(createInitialState());
        setStatus('AI対戦開始！');
    };

    const handleCellClick = (r: number, c: number) => {
        if (gameState.winner || (roomId !== 'ai-match' && gameState.turn !== myRole)) return;
        if (isAiThinking) return;

        const piece = gameState.board[r][c];
        const isMyPiece = piece && piece.owner === (roomId === 'ai-match' ? 'red' : myRole);

        // If multi-jump is active, can only select the active piece
        if (gameState.activePiece) {
            if (r !== gameState.activePiece.r || c !== gameState.activePiece.c) return;
            setSelectedPos({ r, c });
            return;
        }

        if (isMyPiece) {
            setSelectedPos({ r, c });
        } else if (selectedPos) {
            // Try to move
            const validMoves = getValidMoves(gameState, gameState.turn);
            const moveAction = validMoves.find(m =>
                m.from.r === selectedPos.r &&
                m.from.c === selectedPos.c &&
                m.to.r === r &&
                m.to.c === c
            );

            if (moveAction) {
                if (roomId === 'ai-match') {
                    setGameState(move(gameState, moveAction));
                } else {
                    push(ref(db, `checkers_rooms/${roomId}/moves`), moveAction);
                }
                setSelectedPos(null);
            }
        }
    };

    const handleSendMessage = (text: string) => {
        if (!roomId || roomId === 'ai-match') return;
        const msg: ChatMessage = {
            id: Date.now().toString(),
            sender: playerName,
            text,
            timestamp: Date.now()
        };
        push(ref(db, `checkers_rooms/${roomId}/chat`), msg);
    };

    const handleBackToTop = () => {
        router.push('/');
    };

    const validMoves = getValidMoves(gameState, gameState.turn);

    if (!roomId) {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={styles.gameContainer}>
                    <h1 className={styles.title}>チェッカー (Checkers)</h1>
                    <div className={styles.modeSelection}>
                        <button className={styles.modeBtn} onClick={joinRandomGame}>
                            <IconDice size={48} color="#805ad5" />
                            <span className={styles.modeBtnTitle}>ランダムマッチ</span>
                        </button>
                        <button className={styles.modeBtn} onClick={() => {
                            const id = prompt('ルームIDを入力:');
                            if (id) {
                                setRoomId(id);
                                update(ref(db, `checkers_rooms/${id}`), { black: playerId, blackName: playerName, status: 'playing' });
                                setMyRole('black');
                            }
                        }}>
                            <IconKey size={48} color="#805ad5" />
                            <span className={styles.modeBtnTitle}>ルーム入室</span>
                        </button>
                        <button className={styles.modeBtn} onClick={startAiGame}>
                            <IconRobot size={48} color="#805ad5" />
                            <span className={styles.modeBtnTitle}>AI対戦</span>
                        </button>
                    </div>
                </div>

                {/* AdSense Content Section */}
                <div className={styles.contentSection}>
                    <h2 className={styles.contentTitle}>チェッカー（ドラフツ）の遊び方</h2>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>🏁</span>
                            <h3 className={styles.sectionTitle}>世界中で愛される伝統ゲーム</h3>
                        </div>
                        <p className={styles.textBlock}>
                            チェッカー（Checkers）、またはドラフツ（Draughts）は、古代エジプトに起源を持つとも言われる非常に古いボードゲームです。
                            斜めに動いて相手を飛び越すというダイナミックな動きと、「強制ジャンプ」という独特のルールが、スリリングな展開を生み出します。
                            欧米ではチェスと並んで非常に人気があります。
                        </p>
                    </div>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>📏</span>
                            <h3 className={styles.sectionTitle}>基本ルール</h3>
                        </div>
                        <div className={styles.cardGrid}>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>1. 移動</span>
                                <p className={styles.cardText}>駒は斜め前方に1マスずつ進めます。黒いマスの上だけを移動します。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>2. ジャンプ（捕獲）</span>
                                <p className={styles.cardText}>隣に相手の駒があり、その奥が空いている場合、飛び越えて相手の駒を取ることができます。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>3. 強制ジャンプ</span>
                                <p className={styles.cardText}>取れる駒がある場合は、必ず取らなければなりません（マスト・ジャンプ）。これがチェッカーの最大の特徴です。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>4. キング（成る）</span>
                                <p className={styles.cardText}>一番奥の列まで進むと「キング」になり、斜め後ろにも進めるようになります。</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>🧠</span>
                            <h3 className={styles.sectionTitle}>勝つためのコツ</h3>
                        </div>
                        <p className={styles.textBlock}>
                            チェッカーは「強制ジャンプ」をいかに利用するかが勝負の分かれ目です。
                        </p>
                        <div className={styles.highlightBox}>
                            <span className={styles.highlightTitle}>相手にわざと取らせる</span>
                            <p className={styles.textBlock} style={{ marginBottom: 0 }}>
                                「強制ジャンプ」のルールを利用して、あえて自分の駒を相手に取らせ、その隙に自分が有利な位置に移動したり、逆に相手の駒をまとめて取ったりする「サクリファイス（捨て駒）」戦術が有効です。
                            </p>
                        </div>
                        <ul className={styles.list}>
                            <li className={styles.listItem}>
                                <strong>中央を支配する</strong><br />
                                盤面の中央に駒を集めることで、左右どちらにも動きやすくなり、相手の動きを制限できます。
                            </li>
                            <li className={styles.listItem}>
                                <strong>キングを作る</strong><br />
                                キングは後ろにも動けるため、非常に強力です。序盤から積極的にキング作りを目指しましょう。
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        );
    }

    if (status === 'waiting' || status === '対戦相手を待っています...') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={styles.gameContainer}>
                    <h1>待機中...</h1>
                    <div className={styles.waitingAnimation}><IconHourglass size={64} color="#805ad5" /></div>
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
                            <p>{myRole === 'red' ? '黒 (Black)' : '赤 (Red)'}</p>
                        </div>
                        <div className={styles.playerInfo}>
                            <p>{playerName} (自分)</p>
                            <p>{myRole === 'red' ? '赤 (Red)' : '黒 (Black)'}</p>
                        </div>
                    </div>
                    <div className={styles.chatSection}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                    </div>
                </div>

                <div className={styles.centerPanel}>
                    <div className={styles.turnIndicator}>
                        {gameState.turn === 'red' ? '赤の番' : '黒の番'}
                        {gameState.turn === myRole && ' (あなた)'}
                    </div>
                    <CheckersBoard
                        board={gameState.board}
                        turn={gameState.turn}
                        myRole={myRole}
                        validMoves={validMoves}
                        onCellClick={handleCellClick}
                        selectedPos={selectedPos}
                        lastMove={gameState.history[gameState.history.length - 1] || null}
                    />
                    {gameState.mustJump && <p style={{ color: '#fc8181', marginTop: '1rem', fontWeight: 'bold' }}>※ 強制ジャンプが必要です</p>}
                </div>
            </div>

            {gameState.winner && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>勝負あり！</h2>
                        <p>勝者: {gameState.winner === 'draw' ? '引き分け' : (gameState.winner === 'red' ? '赤' : '黒')}</p>
                        <button onClick={handleBackToTop} className={styles.primaryBtn}>終了</button>
                    </div>
                </div>
            )}


        </main>
    );
}
