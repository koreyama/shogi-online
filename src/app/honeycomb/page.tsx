'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Chat } from '@/components/Chat';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue, update, get, onChildAdded, onDisconnect, off } from 'firebase/database';
import { IconBack, IconDice, IconKey, IconRobot, IconHourglass } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { getBestMove } from '@/lib/honeycomb/ai';

// Hexagon grid logic
const HEX_SIZE = 25;
const BOARD_RADIUS = 5;

type Hex = { q: number; r: number; s: number };
type Player = 1 | 2; // 1: Blue (First), 2: Red (Second)
type GameState = 'playing' | 'won' | 'lost';

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

export default function HoneycombPage() {
    const router = useRouter();
    const { playerName: savedName, savePlayerName, isLoaded } = usePlayer();
    const [mounted, setMounted] = useState(false);

    // Game State
    const [board, setBoard] = useState<Map<string, Player>>(new Map());
    const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
    const [gameState, setGameState] = useState<GameState>('playing');
    const [winner, setWinner] = useState<Player | null>(null);
    const [winningHexes, setWinningHexes] = useState<string[]>([]);

    // Online State
    const [roomId, setRoomId] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<Player | null>(null);
    const [status, setStatus] = useState<'setup' | 'initial' | 'waiting' | 'playing' | 'finished'>('setup');
    const [playerId, setPlayerId] = useState<string>('');

    // Player State
    const [playerName, setPlayerName] = useState('');
    const [opponentName, setOpponentName] = useState('');
    const [joinMode, setJoinMode] = useState<'random' | 'room' | 'ai' | null>(null);
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

    // Generate grid
    const hexes: Hex[] = [];
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
        const r1 = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS);
        const r2 = Math.min(BOARD_RADIUS, -q + BOARD_RADIUS);
        for (let r = r1; r <= r2; r++) {
            hexes.push({ q, r, s: -q - r });
        }
    }

    const getHexKey = (hex: Hex) => `${hex.q},${hex.r},${hex.s}`;

    // Pointy Top Hex to Pixel
    const hexToPixel = (hex: Hex) => {
        const x = HEX_SIZE * (Math.sqrt(3) * hex.q + Math.sqrt(3) / 2 * hex.r);
        const y = HEX_SIZE * (3. / 2 * hex.r);
        return { x, y };
    };

    const getHexPoints = (size: number) => {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i - 30;
            const angle_rad = Math.PI / 180 * angle_deg;
            points.push(`${size * Math.cos(angle_rad)},${size * Math.sin(angle_rad)}`);
        }
        return points.join(' ');
    };

    // Firebase Logic
    useEffect(() => {
        if (!roomId || !myRole || roomId === 'ai-match') return;

        const roomRef = ref(db, `honeycomb_rooms/${roomId}`);
        const unsubscribeRoom = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            if (data.p1 && data.p2) {
                if (status !== 'playing' && status !== 'finished') {
                    setStatus('playing');
                }
                if (myRole === 1) setOpponentName(data.p2.name);
                if (myRole === 2) setOpponentName(data.p1.name);
            }
        });

        const movesRef = ref(db, `honeycomb_rooms/${roomId}/moves`);
        const unsubscribeMoves = onChildAdded(movesRef, (snapshot) => {
            const move = snapshot.val();
            if (!move) return;

            // Apply move locally
            applyMove(move.q, move.r, move.s, move.player);
        });

        const chatRef = ref(db, `honeycomb_rooms/${roomId}/chat`);
        const unsubscribeChat = onChildAdded(chatRef, (snapshot) => {
            const msg = snapshot.val();
            if (msg) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        });

        const rematchRef = ref(db, `honeycomb_rooms/${roomId}/rematch`);
        const unsubscribeRematch = onValue(rematchRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.p1 && data.p2) {
                if (myRole === 1) {
                    // Reset room
                    set(ref(db, `honeycomb_rooms/${roomId}/moves`), null);
                    set(ref(db, `honeycomb_rooms/${roomId}/chat`), null);
                    set(ref(db, `honeycomb_rooms/${roomId}/rematch`), null);
                }
                resetLocalGame();
            }
        });

        const myPlayerRef = ref(db, `honeycomb_rooms/${roomId}/p${myRole}`);
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

    // AI Turn Effect
    useEffect(() => {
        if (roomId === 'ai-match' && currentPlayer === 2 && gameState === 'playing') {
            const timer = setTimeout(() => {
                makeAIMove();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [roomId, currentPlayer, gameState, board]); // Depend on board to ensure fresh state

    const applyMove = (q: number, r: number, s: number, player: Player) => {
        const key = `${q},${r},${s}`;
        setBoard(prev => {
            if (prev.has(key)) return prev; // Safety: Prevent overwrite

            const newBoard = new Map(prev);
            newBoard.set(key, player);

            // Check win/loss
            const result = checkWinLoss(newBoard, { q, r, s }, player);
            if (result.won) {
                setGameState('won');
                setWinner(player);
                setWinningHexes(result.line);
                if (roomId && roomId !== 'ai-match') setStatus('finished');
            } else if (result.lost) {
                setGameState('lost');
                setWinner(player === 1 ? 2 : 1);
                if (roomId && roomId !== 'ai-match') setStatus('finished');
            } else {
                setCurrentPlayer(player === 1 ? 2 : 1);
            }

            return newBoard;
        });
    };

    const checkWinLoss = (currentBoard: Map<string, Player>, lastMove: Hex, player: Player) => {
        const axes = [
            { q: 1, r: 0, s: -1 },
            { q: 0, r: 1, s: -1 },
            { q: 1, r: -1, s: 0 }
        ];

        let won = false;
        let lost = false;
        let winLine: string[] = [];

        for (const axis of axes) {
            let count = 1;
            let line = [getHexKey(lastMove)];

            // Forward
            let curr = { q: lastMove.q + axis.q, r: lastMove.r + axis.r, s: lastMove.s + axis.s };
            while (currentBoard.get(getHexKey(curr)) === player) {
                count++;
                line.push(getHexKey(curr));
                curr = { q: curr.q + axis.q, r: curr.r + axis.r, s: curr.s + axis.s };
            }

            // Backward
            curr = { q: lastMove.q - axis.q, r: lastMove.r - axis.r, s: lastMove.s - axis.s };
            while (currentBoard.get(getHexKey(curr)) === player) {
                count++;
                line.push(getHexKey(curr));
                curr = { q: curr.q - axis.q, r: curr.r - axis.r, s: curr.s - axis.s };
            }

            if (count >= 4) {
                won = true;
                winLine = line;
                break;
            } else if (count === 3) {
                lost = true;
            }
        }

        return { won, lost, line: winLine };
    };

    const handleHexClick = (hex: Hex) => {
        if (gameState !== 'playing' || status === 'finished') return;
        if (roomId && roomId !== 'ai-match' && currentPlayer !== myRole) return;

        const key = getHexKey(hex);
        if (board.has(key)) return;

        if (roomId === 'ai-match') {
            if (currentPlayer === 1) {
                applyMove(hex.q, hex.r, hex.s, 1);
                // AI is now triggered by useEffect
            }
        } else if (roomId) {
            push(ref(db, `honeycomb_rooms/${roomId}/moves`), { ...hex, player: myRole });
        } else {
            // Local play (fallback/debug)
            applyMove(hex.q, hex.r, hex.s, currentPlayer);
        }
    };

    const makeAIMove = () => {
        // Pass a copy of the board to avoid mutation issues
        const bestMove = getBestMove(new Map(board), 2, BOARD_RADIUS);
        if (bestMove) {
            applyMove(bestMove.q, bestMove.r, bestMove.s, 2);
        }
    };

    const resetLocalGame = () => {
        setBoard(new Map());
        setCurrentPlayer(1);
        setGameState('playing');
        setWinner(null);
        setWinningHexes([]);
        if (roomId === 'ai-match') setStatus('playing');
    };

    // Matchmaking
    const joinRandomGame = async () => {
        const roomsRef = ref(db, 'honeycomb_rooms');
        const snapshot = await get(roomsRef);
        const rooms = snapshot.val();
        let foundRoomId = null;

        if (rooms) {
            for (const [id, room] of Object.entries(rooms) as [string, any][]) {
                if ((room.p1 && !room.p2) || (!room.p1 && room.p2)) {
                    foundRoomId = id;
                    break;
                }
            }
        }

        if (foundRoomId) {
            const room = rooms[foundRoomId];
            if (!room.p2) {
                await update(ref(db, `honeycomb_rooms/${foundRoomId}/p2`), { name: playerName, id: playerId });
                setRoomId(foundRoomId);
                setMyRole(2);
            } else {
                await update(ref(db, `honeycomb_rooms/${foundRoomId}/p1`), { name: playerName, id: playerId });
                setRoomId(foundRoomId);
                setMyRole(1);
            }
        } else {
            const newRoomRef = push(roomsRef);
            const newRoomId = newRoomRef.key!;
            const isP1 = Math.random() < 0.5;
            if (isP1) {
                await set(newRoomRef, { p1: { name: playerName, id: playerId }, p2: null });
                setMyRole(1);
            } else {
                await set(newRoomRef, { p1: null, p2: { name: playerName, id: playerId } });
                setMyRole(2);
            }
            setRoomId(newRoomId);
            setStatus('waiting');
        }
    };

    const joinRoomGame = async () => {
        if (!customRoomId.trim()) return;
        const rid = customRoomId.trim();
        const roomRef = ref(db, `honeycomb_rooms/${rid}`);
        const snapshot = await get(roomRef);
        const room = snapshot.val();

        if (!room) {
            await set(roomRef, { p1: { name: playerName, id: playerId }, p2: null });
            setMyRole(1);
            setRoomId(rid);
            setStatus('waiting');
        } else if (!room.p2) {
            await update(ref(db, `honeycomb_rooms/${rid}/p2`), { name: playerName, id: playerId });
            setMyRole(2);
            setRoomId(rid);
        } else if (!room.p1) {
            await update(ref(db, `honeycomb_rooms/${rid}/p1`), { name: playerName, id: playerId });
            setMyRole(1);
            setRoomId(rid);
        } else {
            alert('満員です');
        }
    };

    const startAIGame = () => {
        setRoomId('ai-match');
        setMyRole(1);
        setOpponentName('AI');
        setStatus('playing');
        resetLocalGame();
    };

    const handleSendMessage = (text: string) => {
        if (roomId === 'ai-match') {
            setMessages(prev => [...prev, { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() }]);
        } else if (roomId) {
            push(ref(db, `honeycomb_rooms/${roomId}/chat`), { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() });
        }
    };

    const handleRematch = () => {
        if (roomId === 'ai-match') {
            resetLocalGame();
        } else if (roomId) {
            update(ref(db, `honeycomb_rooms/${roomId}/rematch`), { [`p${myRole}`]: true });
        }
    };

    const handleBackToTop = () => {
        if (roomId && roomId !== 'ai-match' && myRole) {
            const myPlayerRef = ref(db, `honeycomb_rooms/${roomId}/p${myRole}`);
            set(myPlayerRef, null);
            onDisconnect(myPlayerRef).cancel();
        }
        router.push('/');
    };

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerName.trim()) {
            savePlayerName(playerName.trim());
            setStatus('initial');
        }
    };

    if (!mounted) return <div className={styles.main}>Loading...</div>;

    if (status === 'setup') {
        return (
            <main className={styles.main}>
                <div className={styles.setupContainer}>
                    <h1 className={styles.title}>ハニカム戦略</h1>
                    <form onSubmit={handleNameSubmit} className={styles.setupForm}>
                        <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="プレイヤー名" className={styles.input} required />
                        <button type="submit" className={styles.primaryBtn}>次へ</button>
                    </form>
                </div>
            </main>
        );
    }

    if (status === 'initial') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={() => router.push('/')} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={styles.gameContainer}>
                    <h1 className={styles.title}>ハニカム戦略</h1>
                    {!joinMode ? (
                        <div className={styles.modeSelection}>
                            <button onClick={joinRandomGame} className={styles.modeBtn}><IconDice size={48} color="#d69e2e" /><span className={styles.modeBtnTitle}>ランダム</span></button>
                            <button onClick={() => setJoinMode('room')} className={styles.modeBtn}><IconKey size={48} color="#d69e2e" /><span className={styles.modeBtnTitle}>ルーム</span></button>
                            <button onClick={startAIGame} className={styles.modeBtn}><IconRobot size={48} color="#d69e2e" /><span className={styles.modeBtnTitle}>AI対戦</span></button>
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
            </main>
        );
    }

    if (status === 'waiting') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={styles.gameContainer}>
                    <h1>待機中...</h1>
                    <div className={styles.waitingAnimation}><IconHourglass size={64} color="#d69e2e" /></div>
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
                            <p>{myRole === 1 ? '赤 (後攻)' : '青 (先攻)'}</p>
                        </div>
                        <div className={styles.playerInfo}>
                            <p>{playerName} (自分)</p>
                            <p>{myRole === 1 ? '青 (先攻)' : '赤 (後攻)'}</p>
                        </div>
                    </div>
                    <div className={styles.chatSection}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                    </div>
                </div>
                <div className={styles.centerPanel}>
                    <div className={styles.turnIndicator}>
                        {currentPlayer === 1 ? '青の番' : '赤の番'}
                        {currentPlayer === myRole && ' (あなた)'}
                    </div>
                    <svg width="600" height="500" viewBox="-300 -250 600 500" className={styles.hexGrid}>
                        {hexes.map(hex => {
                            const { x, y } = hexToPixel(hex);
                            const key = getHexKey(hex);
                            const player = board.get(key);
                            const isWinning = winningHexes.includes(key);

                            return (
                                <polygon
                                    key={key}
                                    points={getHexPoints(HEX_SIZE)}
                                    transform={`translate(${x}, ${y})`}
                                    className={`${styles.hex} ${player ? styles[`player${player}`] : ''} ${isWinning ? styles.winning : ''}`}
                                    onClick={() => handleHexClick(hex)}
                                />
                            );
                        })}
                    </svg>
                </div>
            </div>
            {(gameState === 'won' || gameState === 'lost') && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>勝負あり！</h2>
                        <p>
                            {winner === myRole ? 'あなたの勝ち！' : 'あなたの負け...'}
                            <br />
                            {gameState === 'won' ? '(4つ並びました)' : '(3つ並んでしまいました)'}
                        </p>
                        <button onClick={handleRematch} className={styles.primaryBtn}>再戦</button>
                        <button onClick={handleBackToTop} className={styles.secondaryBtn}>終了</button>
                    </div>
                </div>
            )}
        </main>
    );
}
