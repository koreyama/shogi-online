'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Client, Room } from 'colyseus.js';
import styles from './page.module.css';
import { GoBoard } from './GoBoard';
import { GoBoard as GoBoardType, StoneColor } from '@/lib/go/types';
import { IconUser } from '@/components/Icons';

interface ColyseusGoGameProps {
    mode: 'random' | 'room';
    roomId?: string;
    userData: { name: string, id: string };
}

export default function ColyseusGoGame({ mode, roomId: propRoomId, userData }: ColyseusGoGameProps) {
    const [room, setRoom] = useState<Room | null>(null);
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');
    const [error, setError] = useState<string | null>(null);

    // Client-side representation of board
    const [board, setBoard] = useState<GoBoardType>({
        size: 19,
        grid: Array(19).fill(null).map(() => Array(19).fill(null)),
        capturedBlack: 0,
        capturedWhite: 0,
        currentColor: 'black',
        history: []
    });

    const [myColor, setMyColor] = useState<StoneColor | 'spectator'>('spectator');
    const [players, setPlayers] = useState<any[]>([]);
    const [result, setResult] = useState<{ winner: string, reason?: string } | null>(null);

    const dataEffectCalled = useRef(false);
    const roomRef = useRef<Room | null>(null);

    useEffect(() => {
        if (dataEffectCalled.current) return;
        dataEffectCalled.current = true;

        const client = new Client(process.env.NEXT_PUBLIC_COLYSEUS_URL || 'ws://localhost:2567');

        const connect = async () => {
            try {
                let r: Room;
                if (mode === 'random') {
                    r = await client.joinOrCreate('go', { name: userData.name });
                } else {
                    if (propRoomId) {
                        r = await client.joinById(propRoomId, { name: userData.name });
                    } else {
                        r = await client.create('go', { name: userData.name, isPrivate: true });
                    }
                }

                setRoom(r);
                roomRef.current = r;
                setupRoomListeners(r);

            } catch (e: any) {
                console.error("Join error:", e);
                if (typeof e === 'object') {
                    console.error("Join error details:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
                }
                setError("Failed to join room: " + (e.message || "Unknown error"));
                setStatus('finished');
            }
        };

        connect();

        return () => {
            if (roomRef.current) {
                roomRef.current.leave();
            }
        };
    }, []);

    const setupRoomListeners = (r: Room) => {
        // Initial Sync
        if (r.state.players) updatePlayersList(r.state, r.sessionId);

        r.onStateChange((state: any) => {
            updateBoardFromState(state);
            updatePlayersList(state, r.sessionId);

            // Check phase
            if (state.phase === 'playing') setStatus('playing');
            if (state.phase === 'finished') {
                setStatus('finished');
                setResult({ winner: state.winner, reason: state.reason });
            }
        });

        r.onMessage("gameStart", () => {
            console.log("Game Start message received");
            setStatus('playing');
        });

        r.onMessage("error", (msg: { message: string }) => {
            alert(msg.message);
        });

        r.onMessage("gameOver", (msg: any) => {
            setStatus('finished');
            setResult(msg);
        });

        r.onMessage("roomDissolved", () => {
            setError("Room dissolved.");
            setStatus('finished');
        });

        r.onLeave((code) => {
            console.log("Disconnected from room. Code:", code);
            setStatus('finished');
            setError("サーバーから切断されました (コード: " + code + ")");
        });
    };

    const updatePlayersList = (state: any, mySessionId: string) => {
        const newPlayers: any[] = [];
        state.players.forEach((p: any, key: string) => {
            const pObj = {
                sessionId: key,
                name: p.name,
                color: p.color,
                captured: p.captured
            };
            newPlayers.push(pObj);

            if (key === mySessionId) {
                setMyColor(p.color);
            }
        });

        // Sort or maintain order if needed, but array is fine
        // Update state blindly to match server truth
        setPlayers(newPlayers);
    };

    const updateBoardFromState = (state: any) => {
        const size = state.boardSize;
        const flatForDisplay = state.grid; // ArraySchema of strings

        const newGrid: (StoneColor | null)[][] = [];
        for (let y = 0; y < size; y++) {
            const row: (StoneColor | null)[] = [];
            for (let x = 0; x < size; x++) {
                const idx = y * size + x;
                const val = flatForDisplay[idx];
                row.push(val === "" ? null : val);
            }
            newGrid.push(row);
        }

        /* 
           Note: capturedBlack/White in GoBoardType are local numbers.
           In schema, players have 'captured' count.
           
           Logic mapping: 
           In engine.ts: 
             nextBoard.capturedWhite += capturedPoints.length (when Black plays)
             -> capturedWhite stores Prisoners held by Black (White stones).
           
           We need to sum up implementation.
           Let's extract from players data if present.
        */

        let capB = 0; // Black Player's prisoners (White stones)
        let capW = 0; // White Player's prisoners (Black stones)

        // Use sync'd players state or access state.players directly if needed.
        // state.players is MapSchema.
        state.players.forEach((p: any) => {
            if (p.color === 'black') capB = p.captured;
            if (p.color === 'white') capW = p.captured;
        });

        setBoard({
            size,
            grid: newGrid,
            currentColor: state.turnColor,
            capturedBlack: capB, // capturedWhite in engine logic (Black's prisoners)
            capturedWhite: capW, // capturedBlack in engine logic
            history: [] // Not synced
        });
    };

    const handleMove = (x: number, y: number) => {
        if (!room) return;
        console.log(`Sending move: (${x}, ${y}). MyColor: ${myColor}, Turn: ${board.currentColor}`);
        room.send("move", { x, y });
    };

    const handlePass = () => {
        if (!room) return;
        room.send("pass");
    };

    const handleResign = () => {
        if (!room) return;
        if (confirm("Are you sure you want to resign?")) {
            room.send("resign");
        }
    };

    const handleCancelEvents = () => {
        room?.leave();
        window.location.reload();
    };

    if (error) {
        return (
            <div className={styles.main}>
                <div className={styles.setupContainer}>
                    <h2 style={{ color: 'red' }}>Error</h2>
                    <p>{error}</p>
                    <button className={styles.modeBtn} onClick={() => window.location.reload()}>Back</button>
                </div>
            </div>
        );
    }

    if (status === 'connecting' || status === 'waiting') {
        return (
            <div className={styles.main}>
                <div className={styles.loadingOverlay}>
                    <div className={styles.loadingSpinner}></div>
                    <p>{status === 'connecting' ? 'ルームに接続中...' : '対戦相手を待っています...'}</p>
                    {/* Only show Room ID if not random mode */}
                    {room && mode !== 'random' && <p className={styles.roomId}>ルームID: {room.roomId}</p>}

                    <button
                        className={styles.secondaryBtn}
                        style={{ marginTop: '20px', padding: '10px 20px' }}
                        onClick={handleCancelEvents}
                    >
                        キャンセル
                    </button>
                </div>
            </div>
        );
    }

    const isMyTurn = board.currentColor === myColor;

    // Find opponent name
    const opponent = players.find(p => p.color !== myColor && p.color !== 'spectator');
    const me = players.find(p => p.color === myColor);

    return (
        <div className={styles.main}>
            <div className={styles.gameContainer}>
                <h1 className={styles.title}>囲碁 Online</h1>

                <div className={styles.gameLayout}>
                    <div className={styles.infoPanel}>
                        <div className={`${styles.turnIndicator} ${isMyTurn ? (myColor === 'black' ? styles.turnBlack : styles.turnWhite) : ''}`}>
                            {isMyTurn ? "あなたの手番" : "相手の手番"}
                        </div>

                        <div className={styles.captured}>
                            <h3>アゲハマ (取った石)</h3>
                            <div className={styles.capturedRow}>
                                <span>あなたの獲得:</span>
                                <span>{myColor === 'black' ? board.capturedBlack : board.capturedWhite}</span>
                            </div>
                            <div className={styles.capturedRow}>
                                <span>相手の獲得:</span>
                                <span>{myColor === 'black' ? board.capturedWhite : board.capturedBlack}</span>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <button className={styles.actionBtn} onClick={handlePass} disabled={!isMyTurn}>パス</button>
                            <button className={`${styles.actionBtn} ${styles.secondaryBtn}`} onClick={handleResign}>投了</button>
                        </div>
                    </div>

                    <GoBoard
                        board={board}
                        myColor={myColor}
                        isMyTurn={isMyTurn}
                        onMove={handleMove}
                    />

                    <div className={styles.infoPanel}>
                        <h3>対局情報</h3>
                        <div className={styles.capturedRow}>
                            <strong>あなた:</strong> <span>{me?.name} ({me?.color === 'black' ? '黒' : '白'})</span>
                        </div>
                        <div className={styles.capturedRow}>
                            <strong>相手:</strong> <span>{opponent?.name || "待機中..."} ({opponent?.color === 'black' ? '黒' : opponent?.color === 'white' ? '白' : '?'})</span>
                        </div>
                    </div>
                </div>
            </div>

            {status === 'finished' && result && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>終局</h2>
                        <p>勝者: {result.winner === 'black' ? '黒' : result.winner === 'white' ? '白' : '引き分け'}</p>
                        {result.reason && <p>理由: {result.reason === 'resignation' ? '投了' : result.reason}</p>}
                        <button className={styles.actionBtn} onClick={() => window.location.reload()}>メニューへ戻る</button>
                    </div>
                </div>
            )}
        </div>
    );
}
