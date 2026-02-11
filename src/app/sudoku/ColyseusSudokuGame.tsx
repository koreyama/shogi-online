'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Client, Room } from 'colyseus.js';
import { SudokuBoard } from '@/components/sudoku/SudokuBoard';
import { NumberPad } from '@/components/sudoku/NumberPad';
import { IconBack } from '@/components/Icons';
import styles from '@/styles/GameMenu.module.css';
import sudokuStyles from '@/components/sudoku/Sudoku.module.css';
import { Board, Cell } from '@/lib/sudoku/types';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';

const getColyseusUrl = () => {
    if (process.env.NEXT_PUBLIC_COLYSEUS_URL) {
        return process.env.NEXT_PUBLIC_COLYSEUS_URL;
    }
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'ws://localhost:2567';
    }
    return 'wss://shogi-online-server.onrender.com';
};

interface Props {
    roomId?: string;
    options?: any;
    onLeave: () => void;
}

interface PlayerData {
    id: string;
    name: string;
    isReady: boolean;
    status: string;
    progress: number;
    finishTime: number;
    puzzle: number[];
    boardValues: number[];
    solution: number[];
}

export function ColyseusSudokuGame({ roomId, options, onLeave }: Props) {
    const { user } = useAuth();
    const { playerName } = usePlayer();

    const [room, setRoom] = useState<Room | null>(null);
    const [players, setPlayers] = useState<Map<string, PlayerData>>(new Map());
    const [gameStatus, setGameStatus] = useState<string>('waiting');
    const [mySessionId, setMySessionId] = useState<string>('');
    const [winnerId, setWinnerId] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [time, setTime] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [isNotesMode, setIsNotesMode] = useState(false);
    const [displayRoomId, setDisplayRoomId] = useState<string>('');

    const clientRef = useRef<Client | null>(null);
    const roomRef = useRef<Room | null>(null);

    // Connect to room
    useEffect(() => {
        const connect = async () => {
            try {
                const client = new Client(getColyseusUrl());
                clientRef.current = client;

                let r: Room;
                const joinOptions = {
                    playerId: user?.uid,
                    name: playerName || 'Guest',
                    difficulty: options?.difficulty || 'EASY',
                };

                if (roomId) {
                    r = await client.joinById(roomId, joinOptions);
                } else if (options?.create) {
                    r = await client.create('sudoku_room', joinOptions);
                } else {
                    r = await client.joinOrCreate('sudoku_room', joinOptions);
                }

                setRoom(r);
                roomRef.current = r;
                setMySessionId(r.sessionId);
                setDisplayRoomId(r.roomId);
                setupRoomListeners(r);
            } catch (e: any) {
                console.error('Join failed:', e);
                setError(e.message || 'Failed to join room');
            }
        };

        connect();

        return () => {
            roomRef.current?.leave();
        };
    }, [roomId, options, user?.uid, playerName]);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameStatus === 'playing' && startTime > 0) {
            interval = setInterval(() => {
                setTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameStatus, startTime]);

    const setupRoomListeners = (r: Room) => {
        r.state.listen("status", (value: string) => {
            setGameStatus(value);
        });

        r.state.listen("startTime", (value: number) => {
            setStartTime(value);
        });

        r.state.listen("winnerId", (value: string) => {
            setWinnerId(value);
        });

        r.state.players.onAdd((player: any, sessionId: string) => {
            updatePlayer(sessionId, player);

            player.listen("isReady", () => updatePlayer(sessionId, player));
            player.listen("status", () => updatePlayer(sessionId, player));
            player.listen("progress", () => updatePlayer(sessionId, player));
            player.listen("finishTime", () => updatePlayer(sessionId, player));

            player.puzzle.onChange(() => updatePlayer(sessionId, player));
            player.boardValues.onChange(() => updatePlayer(sessionId, player));
            player.solution.onChange(() => updatePlayer(sessionId, player));
        });

        r.state.players.onRemove((player: any, sessionId: string) => {
            setPlayers(prev => {
                const next = new Map(prev);
                next.delete(sessionId);
                return next;
            });
        });

        r.onMessage("winner", (data: { winnerId: string; winnerName: string }) => {
            setWinnerId(data.winnerId);
        });

        r.onMessage("notification", (data: { message: string }) => {
            alert(data.message);
        });
    };

    const updatePlayer = (sessionId: string, player: any) => {
        setPlayers(prev => {
            const next = new Map(prev);
            next.set(sessionId, {
                id: player.id,
                name: player.name,
                isReady: player.isReady,
                status: player.status,
                progress: player.progress,
                finishTime: player.finishTime,
                puzzle: [...player.puzzle],
                boardValues: [...player.boardValues],
                solution: [...player.solution],
            });
            return next;
        });
    };

    const toggleReady = () => {
        room?.send("ready");
    };

    const handleCellClick = (row: number, col: number) => {
        if (gameStatus !== 'playing') return;
        setSelectedCell({ row, col });
    };

    const handleNumberClick = (num: number) => {
        if (!room || !selectedCell || gameStatus !== 'playing') return;
        const index = selectedCell.row * 9 + selectedCell.col;

        // Check if it's a clue (can't modify)
        const me = players.get(mySessionId);
        if (me && me.puzzle[index] !== 0) return;

        room.send("place", { index, value: num });
    };

    const handleClear = () => {
        if (!room || !selectedCell || gameStatus !== 'playing') return;
        const index = selectedCell.row * 9 + selectedCell.col;

        const me = players.get(mySessionId);
        if (me && me.puzzle[index] !== 0) return;

        room.send("place", { index, value: 0 });
    };

    // Convert player data to Board format
    const getBoard = (playerData: PlayerData): Board => {
        const board: Board = [];
        for (let r = 0; r < 9; r++) {
            const row: Cell[] = [];
            for (let c = 0; c < 9; c++) {
                const idx = r * 9 + c;
                const isFixed = playerData.puzzle[idx] !== 0;
                const value = playerData.boardValues[idx] || 0;

                // Check for conflicts
                let isError = false;
                if (value !== 0 && value !== playerData.solution[idx]) {
                    isError = true;
                }

                row.push({
                    value,
                    isFixed,
                    isError,
                    notes: new Set(),
                });
            }
            board.push(row);
        }
        return board;
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const me = players.get(mySessionId);
    const opponents = [...players.entries()].filter(([sid]) => sid !== mySessionId);

    // Error state
    if (error) {
        return (
            <main className={styles.main}>
                <div className={styles.gameContainer}>
                    <h2>エラー</h2>
                    <p>{error}</p>
                    <button className={styles.primaryBtn} onClick={onLeave}>戻る</button>
                </div>
            </main>
        );
    }

    // Lobby state
    if (gameStatus === 'waiting') {
        return (
            <main className={styles.main}>
                <div className={sudokuStyles.header}>
                    <button onClick={onLeave} className={sudokuStyles.backButton}>
                        <IconBack size={18} /> 退出
                    </button>
                    <div className={sudokuStyles.headerContent}>
                        <h1 className={sudokuStyles.title}>数独バトル</h1>
                        <p className={sudokuStyles.subtitle}>ルームID: {displayRoomId}</p>
                    </div>
                    <div style={{ width: '80px' }} />
                </div>

                <div className={styles.gameContainer}>
                    <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '100%' }}>
                        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>対戦ロビー</h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>プレイヤー</h3>
                            {[...players.values()].map((p, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem',
                                    background: '#f8fafc',
                                    borderRadius: '8px',
                                    marginBottom: '0.5rem',
                                }}>
                                    <span style={{ fontWeight: p.id === me?.id ? 700 : 400 }}>
                                        {p.name} {p.id === me?.id ? '(あなた)' : ''}
                                    </span>
                                    <span style={{
                                        color: p.isReady ? '#22c55e' : '#94a3b8',
                                        fontWeight: 600,
                                    }}>
                                        {p.isReady ? '準備完了' : '待機中'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {players.size < 2 && (
                            <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '1rem' }}>
                                相手を待っています...
                            </p>
                        )}

                        <button
                            className={styles.primaryBtn}
                            onClick={toggleReady}
                            style={{ width: '100%' }}
                        >
                            {me?.isReady ? '待機に戻す' : '準備完了'}
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    // Playing or finished
    return (
        <main className={styles.main}>
            <div className={sudokuStyles.header}>
                <button onClick={onLeave} className={sudokuStyles.backButton}>
                    <IconBack size={18} /> 退出
                </button>
                <div className={sudokuStyles.headerContent}>
                    <h1 className={sudokuStyles.title}>数独バトル</h1>
                    <p className={sudokuStyles.subtitle}>⏱️ {formatTime(time)}</p>
                </div>
                <div style={{ width: '80px' }} />
            </div>

            <div className={sudokuStyles.gameContainer}>
                {/* Opponent Progress */}
                {opponents.length > 0 && (
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: '1rem',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}>
                        {opponents.map(([sid, p]) => (
                            <div key={sid} style={{
                                background: p.status === 'finished' ? '#dcfce7' : '#f1f5f9',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '12px',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{p.name}</div>
                                <div style={{
                                    width: '120px',
                                    height: '8px',
                                    background: '#e2e8f0',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        width: `${p.progress}%`,
                                        height: '100%',
                                        background: p.status === 'finished' ? '#22c55e' : '#3b82f6',
                                        transition: 'width 0.3s',
                                    }} />
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                                    {p.progress}%
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* My Board */}
                {me && me.boardValues.length === 81 && (
                    <>
                        <SudokuBoard
                            board={getBoard(me)}
                            selectedCell={selectedCell}
                            onCellClick={handleCellClick}
                        />

                        {gameStatus === 'playing' && (
                            <NumberPad
                                onNumberClick={handleNumberClick}
                                onClear={handleClear}
                                onToggleNotes={() => setIsNotesMode(!isNotesMode)}
                                isNotesMode={isNotesMode}
                            />
                        )}
                    </>
                )}

                {/* Win Modal */}
                {gameStatus === 'finished' && winnerId && (
                    <div className={sudokuStyles.modalOverlay}>
                        <div className={sudokuStyles.modal}>
                            <h2>{winnerId === me?.id ? '🎉 勝利！' : '😢 敗北...'}</h2>
                            <p>タイム: {formatTime(time)}</p>
                            <button onClick={onLeave}>メニューへ</button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
