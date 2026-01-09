'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { client } from '@/lib/colyseus';
import { Room } from 'colyseus.js';
import { GomokuBoard } from '@/components/GomokuBoard';
import { IconHourglass, IconBack } from '@/components/Icons';
import { Chat } from '@/components/Chat';
import { MatchingWaitingScreen } from '@/components/game/MatchingWaitingScreen';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';

interface ColyseusGomokuGameProps {
    mode: 'random' | 'room';
    roomId?: string;
    playerName: string;
}

export default function ColyseusGomokuGame({ mode, roomId: propRoomId, playerName }: ColyseusGomokuGameProps) {
    // const { playerName, isLoaded: playerLoaded } = usePlayer(); // Removed internal hook
    const playerLoaded = true; // Handled by parent
    const { loading: authLoading } = useAuth();

    // Core State
    const [room, setRoom] = useState<Room | null>(null);
    const [board, setBoard] = useState<number[]>(Array(225).fill(0));
    const [myRole, setMyRole] = useState<'black' | 'white' | 'spectator'>('spectator');
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');
    const [error, setError] = useState<string | null>(null);

    // Game State
    const [turn, setTurn] = useState<'black' | 'white'>('black');
    const [winner, setWinner] = useState<string | null>(null);
    const [winnerReason, setWinnerReason] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [showDissolvedDialog, setShowDissolvedDialog] = useState(false);
    const [playersInfo, setPlayersInfo] = useState<{ black: string, white: string }>({ black: "Waiting...", white: "Waiting..." });
    const [lastMove, setLastMove] = useState<{ x: number, y: number } | undefined>(undefined);

    const roomRef = useRef<Room | null>(null);

    const updateState = (state: any, sessionId: string) => {
        try {
            // Board is ArraySchema<number>
            if (state.board && (Array.isArray(state.board) || (state.board as any).toArray)) {
                setBoard([...state.board]);
            }

            setTurn(state.turn);

            if (state.lastMove) {
                // "h8" -> x=7, y=7 using a=0
                const file = state.lastMove.charCodeAt(0) - 97;
                const rank = parseInt(state.lastMove.substring(1)) - 1;
                setLastMove({ x: file, y: rank });
            }

            if (state.players) {
                const newPlayersInfo = { black: "Waiting...", white: "Waiting..." };
                let b = false, w = false;

                // Handle MapSchema or Object
                const playersList = (state.players instanceof Map || (state.players as any).values)
                    ? Array.from(state.players.values())
                    : Object.values(state.players);

                console.log("Gomoku Players update:", playersList);

                playersList.forEach((p: any) => {
                    if (p.color === 'black') {
                        b = true;
                        newPlayersInfo.black = p.name || "Unknown";
                    }
                    if (p.color === 'white') {
                        w = true;
                        newPlayersInfo.white = p.name || "Unknown";
                    }
                    if (p.id === sessionId) {
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
            console.error("Error updating state", e);
        }
    };

    const dataEffectCalled = useRef(false);

    useEffect(() => {
        if (authLoading || !playerLoaded) return;
        if (dataEffectCalled.current) return;
        dataEffectCalled.current = true;

        const connect = async (retryCount = 0) => {
            console.log(`Gomoku connecting (attempt ${retryCount + 1})...`, { mode, propRoomId, playerName });
            try {
                // Determine room to join
                let r: Room;
                if (mode === 'room') {
                    if (propRoomId) {
                        r = await client.joinById(propRoomId, { name: playerName });
                    } else {
                        r = await client.create("gomoku", { name: playerName, isPrivate: true });
                    }
                } else {
                    r = await client.joinOrCreate("gomoku", { name: playerName });
                }

                setRoom(r);
                roomRef.current = r;
                console.log("Joined Gomoku room:", r.roomId);
                setError(null);

                // Initial State Sync
                if (r.state) {
                    updateState(r.state, r.sessionId);
                }

                // State Listeners
                r.onStateChange((state: any) => {
                    updateState(state, r.sessionId);
                });

                r.onMessage("gameStart", () => {
                    console.log("Game Started");
                    setStatus('playing');
                });

                r.onMessage("gameOver", (msg: any) => {
                    console.log("Server Game Over:", msg);
                    setStatus('finished');
                    setWinner(msg.winner);
                    if (msg.reason) setWinnerReason(msg.reason);
                });

                r.onMessage("chat", (msg: any) => {
                    setMessages(prev => [...prev, msg]);
                });

                r.onMessage("roomDissolved", () => {
                    setShowDissolvedDialog(true);
                });

            } catch (e: any) {
                console.error("Connection failed attempt", retryCount + 1, e);

                let detail = "";
                if (typeof e === 'string') {
                    detail = e;
                } else if (e instanceof Error) {
                    detail = e.message;
                } else if (e && typeof e === 'object') {
                    detail = JSON.stringify(e);
                }

                // Retry logic for specific errors
                if (detail.includes("seat reservation expired")) {
                    if (retryCount < 2) {
                        console.log("Retrying connection...");
                        setError(`接続再試行中... (${retryCount + 1}/2)`);
                        setTimeout(() => connect(retryCount + 1), 2000);
                        return;
                    }
                }

                let msg = "接続に失敗しました。";
                if (detail.includes("locked")) {
                    msg = "ルームが満員か、ロックされています。";
                }

                setError(`${msg} [詳細: ${detail}]`);
                setStatus('finished');
            }
        };

        connect();

        return () => {
            // In Strict Mode with single-run guard, we might NOT want to leave on cleanup immediately
            // or we rely on the component unmounting for real.
            // However, Chess implementation usually DOES leave on cleanup if it stored the room.
            // But since we use dataEffectCalled, let's just leave if we have a room.
            if (roomRef.current) {
                console.log("Leaving room on cleanup");
                roomRef.current.leave();
                roomRef.current = null;
                setRoom(null);
            }
        };
    }, [mode, propRoomId, playerName, authLoading, playerLoaded]);

    const handleIntersectionClick = (x: number, y: number) => {
        if (status !== 'playing') return;
        if (turn !== myRole) { alert("相手の手番です"); return; }

        room?.send("move", { x, y });
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
                {status === 'playing' && myRole !== 'spectator' && (
                    <button onClick={handleResign} className={styles.resignButton} style={{ marginLeft: 'auto', backgroundColor: '#e53e3e', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
                        投了
                    </button>
                )}
            </div>

            <div className={styles.gameLayout}>
                <div className={styles.leftPanel}>
                    <div className={styles.playersSection}>
                        {/* Black Player */}
                        <div className={`${styles.playerCard} ${styles.black} ${turn === 'black' ? styles.playerCardActive : ''}`}>
                            <div className={styles.playerName}>
                                {myRole === 'black' ? playerName : playersInfo.black}
                            </div>
                            <div className={styles.playerRole}>
                                黒 (先手) {myRole === 'black' ? '(あなた)' : ''}
                            </div>
                            {turn === 'black' && <div className={styles.turnBadge}>手番</div>}
                        </div>

                        {/* White Player */}
                        <div className={`${styles.playerCard} ${styles.white} ${turn === 'white' ? styles.playerCardActive : ''}`}>
                            <div className={styles.playerName}>
                                {myRole === 'white' ? playerName : playersInfo.white}
                            </div>
                            <div className={styles.playerRole}>
                                白 (後手) {myRole === 'white' ? '(あなた)' : ''}
                            </div>
                            {turn === 'white' && <div className={styles.turnBadge}>手番</div>}
                        </div>
                    </div>
                    <div className={styles.chatSection}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                    </div>
                </div>

                <div className={styles.centerPanel}>
                    <GomokuBoard
                        board={board}
                        onIntersectionClick={handleIntersectionClick}
                        lastMove={lastMove}
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
                        <button onClick={() => window.location.reload()} className={styles.secondaryBtn}>終了</button>
                    </div>
                </div>
            )}

            {/* Waiting Screen */}
            {(status === 'waiting' || status === 'connecting') && (
                <MatchingWaitingScreen
                    status={status}
                    mode={mode}
                    roomId={room?.roomId}
                    onCancel={handleBackToTop}
                />
            )}
        </div>
    );
}
