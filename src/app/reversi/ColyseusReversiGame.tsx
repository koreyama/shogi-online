'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import styles from './page.module.css';
import { client } from '@/lib/colyseus';
import { ReversiBoard } from '@/components/ReversiBoard';
import { IconBack } from '@/components/Icons';
import { Chat } from '@/components/Chat';
import { getValidMoves } from '@/lib/reversi/engine';
import { Coordinates } from '@/lib/reversi/types';
import { MatchingWaitingScreen } from '@/components/game/MatchingWaitingScreen';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';

interface ColyseusReversiGameProps {
    mode: 'random' | 'room';
    roomId?: string;
}

// Partial Schema to match Client needs
interface ReversiSchema {
    players: any; // MapSchema
    board: number[]; // ArraySchema<number>
    turn: string;
    winner: string;
    isGameOver: boolean;
    blackCount: number;
    whiteCount: number;
    lastMove: string;
}

export default function ColyseusReversiGame({ mode, roomId: targetRoomId }: ColyseusReversiGameProps) {
    const { playerName, isLoaded: playerLoaded } = usePlayer();
    const { user, loading: authLoading } = useAuth();

    // Core State
    const [room, setRoom] = useState<Colyseus.Room<ReversiSchema> | null>(null);
    const [board, setBoard] = useState<('black' | 'white' | null)[][]>(Array(8).fill(null).map(() => Array(8).fill(null)));
    const [myRole, setMyRole] = useState<'black' | 'white' | 'spectator'>('spectator');
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string>("");

    // Game State
    const [turn, setTurn] = useState<'black' | 'white'>('black');
    const [winner, setWinner] = useState<string | null>(null);
    const [winnerReason, setWinnerReason] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [showDissolvedDialog, setShowDissolvedDialog] = useState(false);
    const [playersInfo, setPlayersInfo] = useState<{ black: string, white: string }>({ black: "Waiting...", white: "Waiting..." });
    const [scores, setScores] = useState({ black: 2, white: 2 });
    const [lastMove, setLastMove] = useState<Coordinates | null>(null);

    // Pass Notification
    const [showPassModal, setShowPassModal] = useState(false);
    const [passPlayer, setPassPlayer] = useState<string | null>(null);

    // Valid Moves (Client side calculation for UI feedback)
    const [validMoves, setValidMoves] = useState<Coordinates[]>([]);

    // Refs
    const dataEffectCalled = useRef(false);
    const roomRef = useRef<Colyseus.Room<ReversiSchema> | null>(null);

    useEffect(() => {
        if (authLoading || !playerLoaded) return;
        if (dataEffectCalled.current) return;
        dataEffectCalled.current = true;

        const connect = async () => {
            try {
                // Fetch User Profile Name dynamically
                let currentName = playerName || "Player";
                if (user?.uid) {
                    try {
                        const { getUserProfile } = await import('@/lib/firebase/users');
                        const profile = await getUserProfile(user.uid);
                        if (profile?.displayName) {
                            currentName = profile.displayName;
                        }
                    } catch (e) {
                        console.warn("Failed to fetch user profile:", e);
                    }
                }

                let r: Colyseus.Room<ReversiSchema>;

                try {
                    if (mode === 'room') {
                        if (targetRoomId) {
                            console.log(`Joining Room by ID: ${targetRoomId}`);
                            r = await client.joinById<ReversiSchema>(targetRoomId, { name: currentName, mode: 'room' });
                        } else {
                            console.log("Creating new private room...");
                            r = await client.create<ReversiSchema>("reversi", { name: currentName, isPrivate: true, mode: 'room' });
                        }
                    } else {
                        console.log("Joining/Creating Random Match...");
                        r = await client.joinOrCreate<ReversiSchema>("reversi", { name: currentName, mode: 'random' });
                    }
                } catch (err: any) {
                    console.error("Matchmaking error:", err);
                    if (err.message && (err.message.includes("not found") || err.message.includes("Room not found"))) {
                        throw new Error("指定されたルームが見つかりませんでした。");
                    }
                    throw err;
                }

                setRoom(r);
                roomRef.current = r;
                setSessionId(r.sessionId);
                console.log("Joined Reversi room:", r.roomId);

                r.onStateChange((state: any) => {
                    // console.log("State Change:", state);
                    try {
                        // Sync Board
                        if (state.board) {
                            const newBoard: ('black' | 'white' | null)[][] = [];
                            for (let i = 0; i < 8; i++) {
                                const row: ('black' | 'white' | null)[] = [];
                                for (let j = 0; j < 8; j++) {
                                    const val = state.board[i * 8 + j];
                                    if (val === 1) row.push('black');
                                    else if (val === 2) row.push('white');
                                    else row.push(null);
                                }
                                newBoard.push(row);
                            }
                            setBoard(newBoard);
                        }

                        // Sync Counts
                        if (typeof state.blackCount === 'number') {
                            setScores({ black: state.blackCount, white: state.whiteCount });
                        }

                        setTurn(state.turn);

                        if (state.lastMove) {
                            // Server constructs lastMove as `${String.fromCharCode(97 + x)}${y + 1}`
                            // e.g. "c4"
                            const file = state.lastMove.charCodeAt(0) - 97;
                            const rank = parseInt(state.lastMove.substring(1)) - 1;
                            setLastMove({ x: file, y: rank });
                        }

                        // Players
                        if (state.players && typeof state.players.forEach === 'function') {
                            const newPlayersInfo = { black: "Waiting...", white: "Waiting..." };
                            let b = false, w = false;

                            state.players.forEach((p: any) => {
                                if (p.color === 'black') {
                                    b = true;
                                    newPlayersInfo.black = p.name || "Unknown";
                                }
                                if (p.color === 'white') {
                                    w = true;
                                    newPlayersInfo.white = p.name || "Unknown";
                                }
                                if (p.id === r.sessionId) {
                                    setMyRole(p.color);
                                }
                            });
                            setPlayersInfo(newPlayersInfo);

                            if (state.isGameOver) {
                                setStatus('finished');
                                setWinner(state.winner);
                            } else if (b && w && !state.isGameOver) {
                                setStatus('playing');
                            } else if (!b || !w) {
                                setStatus('waiting');
                            }
                        }
                    } catch (e) {
                        console.warn("Error updating state", e);
                    }
                });

                r.onMessage("gameStart", (msg: any) => {
                    console.log("Game Started");
                    setStatus('playing');
                });

                r.onMessage("gameOver", (msg: any) => {
                    console.log("Server Game Over:", msg);
                    setStatus('finished');
                    setWinner(msg.winner);
                    if (msg.reason) setWinnerReason(msg.reason);
                });

                r.onMessage("pass", (msg: any) => {
                    setPassPlayer(msg.player === 'black' ? '黒' : '白');
                    setShowPassModal(true);
                    setTimeout(() => setShowPassModal(false), 2000);
                });

                r.onMessage("chat", (msg: any) => {
                    setMessages(prev => [...prev, msg]);
                });

                r.onMessage("serverErrorMessage", (msg: any) => {
                    alert(msg.message);
                });

                r.onMessage("roomDissolved", (msg: any) => {
                    setShowDissolvedDialog(true);
                });

            } catch (e: any) {
                console.warn("Connection failed:", e);
                let errorMsg = "サーバーに接続できませんでした。";
                if (e instanceof Error) errorMsg += " " + e.message;
                else if (typeof e === 'string') errorMsg += " " + e;

                if (JSON.stringify(e).includes("locked")) {
                    errorMsg = "ルームが満員か、ロックされています。";
                }

                setError(errorMsg);
            }
        };

        connect();

        return () => {
            if (roomRef.current) {
                roomRef.current.leave();
                roomRef.current = null;
            }
        };
    }, [mode, targetRoomId, playerName, authLoading, playerLoaded]);

    // Recalculate valid moves whenever board or turn/role changes and match is local
    useEffect(() => {
        if (status === 'playing' && myRole === turn) {
            setValidMoves(getValidMoves(board, myRole));
        } else {
            setValidMoves([]);
        }
    }, [board, turn, myRole, status]);

    const handleCellClick = (x: number, y: number) => {
        if (status !== 'playing') return;
        if (turn !== myRole) { alert("相手の手番です"); return; }

        const isValid = validMoves.some(m => m.x === x && m.y === y);
        if (isValid) {
            room?.send("move", { x, y });
            // Optimistic update omitted; waiting for server state is safer for Reversi flipping
            setValidMoves([]);
        }
    };

    const handleSendMessage = (text: string) => {
        if (room) room.send("chat", { id: `msg-${Date.now()}`, text });
    };

    const handleBackToTop = () => {
        roomRef.current?.leave();
        window.location.reload();
    };

    const handleResign = () => {
        if (confirm("本当に投了しますか？")) {
            room?.send("resign");
        }
    };

    if (error) return <div className={styles.main}><p className="text-red-500">{error}</p><button onClick={() => window.location.reload()} className={styles.secondaryBtn}>再試行</button></div>;

    return (
        <div className={styles.main}>
            {/* Dissolved Dialog */}
            {showDissolvedDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>対戦相手が切断しました</h2>
                        <p>ルームを解散します。</p>
                        <button onClick={handleBackToTop} className={styles.primaryBtn}>ホームへ戻る</button>
                    </div>
                </div>
            )}

            <div className={styles.header}>
                <button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 終了</button>
                {mode === 'room' && room?.roomId && (
                    <div style={{
                        marginLeft: '1rem',
                        padding: '0.3rem 0.8rem',
                        background: '#f1f5f9',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        border: '1px solid #e2e8f0',
                        color: '#4a5568'
                    }}>
                        Room ID: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{room.roomId}</span>
                    </div>
                )}
                {status === 'playing' && myRole !== 'spectator' && (
                    <button onClick={handleResign} className={styles.resignButton} style={{ marginLeft: 'auto', backgroundColor: '#e53e3e', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
                        投了
                    </button>
                )}
            </div>

            <div className={styles.gameLayout}>
                <div className={styles.leftPanel}>
                    <div className={styles.playersSection}>
                        <div className={styles.playerInfo}>
                            <p>相手</p>
                            <p className="font-bold text-lg">
                                {myRole === 'black' ? `${playersInfo.white} (白)` : `${playersInfo.black} (黒)`}
                            </p>
                            <p>石: {myRole === 'black' ? scores.white : scores.black}</p>
                        </div>
                        <div className={styles.playerInfo}>
                            <p>自分</p>
                            <p className="font-bold text-lg">
                                {myRole === 'black' ? `${playersInfo.black} (黒)` : `${playersInfo.white} (白)`}
                            </p>
                            <p>石: {myRole === 'black' ? scores.black : scores.white}</p>
                        </div>
                    </div>
                    <div className={styles.chatSection}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                    </div>
                </div>

                <div className={styles.centerPanel}>
                    <div className={styles.turnIndicator}>
                        {turn === 'black' ? '黒の番' : '白の番'}
                        {turn === myRole && ' (あなた)'}
                    </div>

                    <ReversiBoard
                        board={board}
                        validMoves={validMoves}
                        onCellClick={handleCellClick}
                        lastMove={lastMove ? { x: lastMove.x, y: lastMove.y } : undefined}
                    />

                    {status === 'connecting' && <div className="text-center mt-2">接続中...</div>}
                </div>
            </div>

            {status === 'finished' && !showDissolvedDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>勝負あり！</h2>
                        <p>
                            勝者: {winner === 'black' ? '黒' : winner === 'white' ? '白' : '引き分け'}
                            {winnerReason === 'resignation' && ' (相手の投了)'}
                        </p>
                        <p>{scores.black} - {scores.white}</p>
                        <button onClick={() => window.location.reload()} className={styles.secondaryBtn}>終了</button>
                    </div>
                </div>
            )}

            {(status === 'waiting' || status === 'connecting') && (
                <MatchingWaitingScreen
                    status={status}
                    mode={mode}
                    roomId={room?.roomId}
                    onCancel={handleBackToTop}
                />
            )}

            {showPassModal && (
                <div className={styles.modalOverlay} style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <div className={styles.modal}>
                        <h2>パス</h2>
                        <p>{passPlayer} はパスしました</p>
                    </div>
                </div>
            )}
        </div>
    );
}
