'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { client } from '@/lib/colyseus';
import { Room } from 'colyseus.js';
import { MarubatsuBoard } from '@/components/MarubatsuBoard';
import { IconHourglass, IconBack } from '@/components/Icons';
import { MatchingWaitingScreen } from '@/components/game/MatchingWaitingScreen';
import { useAuth } from '@/hooks/useAuth';

interface ColyseusMarubatsuGameProps {
    mode: 'random' | 'room';
    roomId?: string;
    playerName: string;
}

export default function ColyseusMarubatsuGame({ mode, roomId: propRoomId, playerName }: ColyseusMarubatsuGameProps) {
    const { loading: authLoading } = useAuth();

    // Core State
    const [room, setRoom] = useState<Room | null>(null);
    const [board, setBoard] = useState<number[]>(Array(9).fill(0));
    const [myRole, setMyRole] = useState<'o' | 'x' | 'spectator'>('spectator'); // o=1, x=2
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');
    const [error, setError] = useState<string | null>(null);

    // Game State
    const [turn, setTurn] = useState<'o' | 'x'>('o');
    const [winner, setWinner] = useState<string | null>(null);
    const [showDissolvedDialog, setShowDissolvedDialog] = useState(false);
    const [playersInfo, setPlayersInfo] = useState<{ o: string, x: string }>({ o: "Waiting...", x: "Waiting..." });

    const roomRef = useRef<Room | null>(null);
    const dataEffectCalled = useRef(false);

    const updateState = (state: any, sessionId: string) => {
        try {
            if (state.board && (Array.isArray(state.board) || (state.board as any).toArray)) {
                setBoard([...state.board]);
            }

            setTurn(state.turn);

            if (state.players) {
                const newPlayersInfo = { o: "Waiting...", x: "Waiting..." };
                let p1 = false, p2 = false;

                const playersList = (state.players instanceof Map || (state.players as any).values)
                    ? Array.from(state.players.values())
                    : Object.values(state.players);

                playersList.forEach((p: any) => {
                    if (p.mark === 'o') {
                        p1 = true;
                        newPlayersInfo.o = p.name || "Unknown";
                    }
                    if (p.mark === 'x') {
                        p2 = true;
                        newPlayersInfo.x = p.name || "Unknown";
                    }
                    if (p.id === sessionId) {
                        setMyRole(p.mark);
                    }
                });
                setPlayersInfo(newPlayersInfo);

                if (state.isGameOver) {
                    setStatus('finished');
                    setWinner(state.winner);
                } else if (p1 && p2 && !state.isGameOver) {
                    setStatus('playing');
                } else if (!p1 || !p2) {
                    setStatus('waiting');
                }
            }
        } catch (e) {
            console.error("Error updating state", e);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (dataEffectCalled.current) return;
        dataEffectCalled.current = true;

        const connect = async (retryCount = 0) => {
            try {
                let r: Room;
                if (mode === 'room') {
                    if (propRoomId) {
                        r = await client.joinById(propRoomId, { name: playerName });
                    } else {
                        r = await client.create("tictactoe", { name: playerName, isPrivate: true });
                    }
                } else {
                    r = await client.joinOrCreate("tictactoe", { name: playerName });
                }

                setRoom(r);
                roomRef.current = r;
                setError(null);

                if (r.state) {
                    updateState(r.state, r.sessionId);
                }

                r.onStateChange((state: any) => {
                    updateState(state, r.sessionId);
                });

                r.onMessage("gameStart", () => {
                    setStatus('playing');
                });

                r.onMessage("gameOver", (msg: any) => {
                    setStatus('finished');
                    setWinner(msg.winner);
                });

                r.onMessage("roomDissolved", () => {
                    setShowDissolvedDialog(true);
                });

            } catch (e: any) {
                console.error("Connection failed", e);
                setError("接続に失敗しました。");
                setStatus('finished');
            }
        };

        connect();

        return () => {
            if (roomRef.current) {
                roomRef.current.leave();
                roomRef.current = null;
                setRoom(null);
            }
        };
    }, [mode, propRoomId, playerName, authLoading]);

    const handleCellClick = (index: number) => {
        if (status !== 'playing') return;
        if (turn !== myRole) { return; }
        room?.send("move", { index });
    };

    const handleBackToTop = () => {
        roomRef.current?.leave();
        window.location.reload();
    };

    if (error) return <div className={styles.main}><p className="text-red-500">{error}</p><button onClick={() => window.location.reload()} className={styles.secondaryBtn}>再試行</button></div>;

    return (
        <div className={styles.gameLayout}>
            {showDissolvedDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>対戦相手が切断しました</h2>
                        <button onClick={handleBackToTop} className={styles.primaryBtn}>ホームへ戻る</button>
                    </div>
                </div>
            )}

            <div className={styles.leftPanel}>
                <div className={styles.playersSection}>
                    {/* Player O */}
                    <div className={`${styles.playerCard} ${turn === 'o' ? styles.playerCardActive : ''}`}>
                        <div className={styles.playerName}>{playersInfo.o}</div>
                        <div className={styles.playerRole}>先手 (〇) {myRole === 'o' && '(あなた)'}</div>
                        {turn === 'o' && <div className={styles.turnBadge}>手番</div>}
                    </div>
                    {/* Player X */}
                    <div className={`${styles.playerCard} ${turn === 'x' ? styles.playerCardActive : ''}`}>
                        <div className={styles.playerName}>{playersInfo.x}</div>
                        <div className={styles.playerRole}>後手 (✕) {myRole === 'x' && '(あなた)'}</div>
                        {turn === 'x' && <div className={styles.turnBadge}>手番</div>}
                    </div>
                </div>
            </div>

            <div className={styles.centerPanel}>
                <MarubatsuBoard
                    board={board}
                    onCellClick={handleCellClick}
                    disabled={status !== 'playing' || turn !== myRole}
                />
                <div style={{ marginTop: '1rem', color: '#718096', fontSize: '0.9rem' }}>
                    ※3つまで。4つ目で古いコマが消えます。
                </div>
                {status === 'connecting' && <div className="text-center mt-2">接続中...</div>}
                {status === 'waiting' && <h3 style={{ marginTop: '1rem' }}>対戦相手を待っています...</h3>}
            </div>

            {status === 'finished' && !showDissolvedDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>勝負あり！</h2>
                        <p>
                            勝者: {winner === 'o' ? '〇 (先手)' : winner === 'x' ? '✕ (後手)' : '引き分け'}
                        </p>
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
        </div>
    );
}
