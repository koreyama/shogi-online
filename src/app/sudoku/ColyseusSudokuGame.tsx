'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Client, Room } from 'colyseus.js';
import { SudokuBoard } from '@/components/sudoku/SudokuBoard';
import { NumberPad } from '@/components/sudoku/NumberPad';
import { IconBack } from '@/components/Icons';
import styles from '@/styles/GameMenu.module.css';
import sudokuStyles from '@/components/sudoku/Sudoku.module.css';
import { Board, Cell } from '@/lib/sudoku/types';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';

interface Props {
    roomId?: string;
    options?: any;
    onLeave: () => void;
}

interface PlayerData {
    id: string;
    sessionId: string;
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
    const { user, loading: authLoading } = useAuth();
    const { playerName, playerId, isLoaded: playerLoaded } = usePlayer();

    const [room, setRoom] = useState<Room | null>(null);
    const [players, setPlayers] = useState<PlayerData[]>([]);
    const [gameStatus, setGameStatus] = useState<string>('waiting');
    const [winnerId, setWinnerId] = useState<string>('');
    const [time, setTime] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [isNotesMode, setIsNotesMode] = useState(false);

    const clientRef = useRef<Client | null>(null);
    const roomRef = useRef<Room | null>(null);
    const connectingRef = useRef(false);

    // Connect to room
    useEffect(() => {
        if (authLoading || !playerLoaded) return;
        if (connectingRef.current || roomRef.current) return;

        const client = new Client(process.env.NEXT_PUBLIC_COLYSEUS_URL || "ws://localhost:2567");
        clientRef.current = client;
        connectingRef.current = true;

        const connect = async () => {
            try {
                let r: Room;
                const joinOptions = {
                    playerId: playerId || user?.uid,
                    name: playerName || 'Guest',
                    difficulty: options?.difficulty || 'EASY',
                };

                if (roomId) {
                    console.log("Joining by ID:", roomId);
                    r = await client.joinById(roomId, joinOptions);
                } else if (options?.create) {
                    console.log("Creating new room...");
                    r = await client.create('sudoku_room', joinOptions);
                } else {
                    // Random Match
                    console.log("Random matching...");
                    try {
                        // First try to join any existing room
                        r = await client.joinOrCreate('sudoku_room', joinOptions);
                        console.log("Joined existing or created new room:", r.roomId);
                    } catch (e: any) {
                        console.log("Matchmaking failed, creating new room:", e);
                        r = await client.create('sudoku_room', joinOptions);
                    }
                }

                roomRef.current = r;
                setRoom(r);
                setupRoomListeners(r);
            } catch (e: any) {
                console.error("Join Error:", e);
                const errorMsg = e.message || JSON.stringify(e);
                if (connectingRef.current) {
                    alert("ルームに参加できませんでした: " + errorMsg);
                    onLeave();
                }
            } finally {
                connectingRef.current = false;
            }
        };
        connect();

        return () => {
            if (roomRef.current) {
                roomRef.current.leave();
                roomRef.current = null;
            }
            connectingRef.current = false;
        };
    }, [roomId, options, playerId, playerName, authLoading, playerLoaded]);

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
        r.onStateChange((state: any) => {
            setGameStatus(state.status);
            setStartTime(state.startTime);
            setWinnerId(state.winnerId || '');

            const pList: PlayerData[] = [];
            state.players.forEach((p: any, sessionId: string) => {
                pList.push({
                    id: p.id,
                    sessionId,
                    name: p.name,
                    isReady: p.isReady,
                    status: p.status,
                    progress: p.progress,
                    finishTime: p.finishTime,
                    puzzle: [...p.puzzle],
                    boardValues: [...p.boardValues],
                    solution: [...p.solution],
                });
            });
            setPlayers(pList);
        });

        r.onMessage("winner", (data: { winnerId: string; winnerName: string }) => {
            setWinnerId(data.winnerId);
        });

        r.onMessage("notification", (data: { message: string }) => {
            alert(data.message);
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
        const me = players.find(p => p.sessionId === room.sessionId);
        if (me && me.puzzle[index] !== 0) return;
        room.send("place", { index, value: num });
    };

    const handleClear = () => {
        if (!room || !selectedCell || gameStatus !== 'playing') return;
        const index = selectedCell.row * 9 + selectedCell.col;
        const me = players.find(p => p.sessionId === room.sessionId);
        if (me && me.puzzle[index] !== 0) return;
        room.send("place", { index, value: 0 });
    };

    const getBoard = (playerData: PlayerData): Board => {
        const board: Board = [];
        for (let r = 0; r < 9; r++) {
            const row: Cell[] = [];
            for (let c = 0; c < 9; c++) {
                const idx = r * 9 + c;
                const isFixed = playerData.puzzle[idx] !== 0;
                const value = playerData.boardValues[idx] || 0;
                let isError = false;
                if (value !== 0 && value !== playerData.solution[idx]) {
                    isError = true;
                }
                row.push({ value, isFixed, isError, notes: new Set() });
            }
            board.push(row);
        }
        return board;
    };

    // Get opponent board (hide errors - don't reveal solution info)
    const getOpponentBoard = (playerData: PlayerData): Board => {
        const board: Board = [];
        for (let r = 0; r < 9; r++) {
            const row: Cell[] = [];
            for (let c = 0; c < 9; c++) {
                const idx = r * 9 + c;
                const isFixed = playerData.puzzle[idx] !== 0;
                const value = playerData.boardValues[idx] || 0;
                row.push({ value, isFixed, isError: false, notes: new Set() });
            }
            board.push(row);
        }
        return board;
    };

    // Calculate accurate fill percentage (filled empty cells / total empty cells)
    const getFilledPercent = (playerData: PlayerData): number => {
        if (playerData.puzzle.length === 0) return 0;
        let totalEmpty = 0;
        let filledEmpty = 0;
        for (let i = 0; i < 81; i++) {
            if (playerData.puzzle[i] === 0) {
                totalEmpty++;
                if (playerData.boardValues[i] !== 0) {
                    filledEmpty++;
                }
            }
        }
        return totalEmpty === 0 ? 100 : Math.round((filledEmpty / totalEmpty) * 100);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const me = room ? players.find(p => p.sessionId === room.sessionId) : null;
    const opponents = room ? players.filter(p => p.sessionId !== room.sessionId) : [];

    // Loading
    if (!room) return <div className={styles.main} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>接続中...</div>;

    // Lobby
    if (gameStatus === 'waiting') {
        return (
            <main className={styles.main}>
                <div className={sudokuStyles.header}>
                    <button onClick={() => { room.leave(); onLeave(); }} className={sudokuStyles.backButton}>
                        <IconBack size={18} /> 退出
                    </button>
                    <div className={sudokuStyles.headerContent}>
                        <h1 className={sudokuStyles.title}>数独バトル</h1>
                        {(roomId || options?.create) ? (
                            <p className={sudokuStyles.subtitle}>ルームID: {room.roomId}</p>
                        ) : (
                            <p className={sudokuStyles.subtitle}>ランダム対戦</p>
                        )}
                    </div>
                    <div style={{ width: '80px' }} />
                </div>

                <div className={styles.gameContainer}>
                    <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '100%' }}>
                        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>対戦ロビー</h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>プレイヤー ({players.length})</h3>
                            {players.map((p) => (
                                <div key={p.sessionId} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem',
                                    background: '#f8fafc',
                                    borderRadius: '8px',
                                    marginBottom: '0.5rem',
                                }}>
                                    <span style={{ fontWeight: p.sessionId === room.sessionId ? 700 : 400 }}>
                                        {p.name} {p.sessionId === room.sessionId ? '(あなた)' : ''}
                                    </span>
                                    <span style={{
                                        color: p.isReady ? '#22c55e' : '#94a3b8',
                                        fontWeight: 600,
                                    }}>
                                        {p.isReady ? '準備完了' : '待機中'}
                                    </span>
                                </div>
                            ))}
                            {players.length < 2 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    padding: '0.75rem',
                                    background: '#f8fafc',
                                    borderRadius: '8px',
                                    borderStyle: 'dashed',
                                    border: '2px dashed #e2e8f0',
                                    opacity: 0.5,
                                }}>
                                    相手を待っています...
                                </div>
                            )}
                        </div>

                        <button
                            className={styles.primaryBtn}
                            onClick={toggleReady}
                            style={{ width: '100%', background: me?.isReady ? '#22c55e' : '#3b82f6' }}
                        >
                            {me?.isReady ? '準備完了！' : '準備する'}
                        </button>
                        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                            両方のプレイヤーが「準備完了」になるとゲームが開始します
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    const myProgress = me ? getFilledPercent(me) : 0;

    // Playing or finished
    return (
        <main className={styles.main}>
            <div className={sudokuStyles.header}>
                <button onClick={() => { room.leave(); onLeave(); }} className={sudokuStyles.backButton}>
                    <IconBack size={18} /> 退出
                </button>
                <div className={sudokuStyles.headerContent}>
                    <h1 className={sudokuStyles.title}>数独バトル</h1>
                    <p className={sudokuStyles.subtitle}>⏱️ {formatTime(time)}</p>
                </div>
                <div style={{ width: '80px' }} />
            </div>

            <div style={{
                display: 'flex', gap: '2rem', justifyContent: 'center',
                alignItems: 'flex-start', flexWrap: 'wrap',
                padding: '1rem', width: '100%', maxWidth: '1200px', margin: '0 auto',
            }}>
                {/* My Board Section */}
                <div style={{ flex: '1 1 auto', maxWidth: '500px', minWidth: '300px' }}>
                    {/* My Progress Bar */}
                    <div style={{
                        background: '#eff6ff', padding: '0.75rem 1.25rem', borderRadius: '12px',
                        marginBottom: '0.75rem', textAlign: 'center',
                    }}>
                        <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1d4ed8' }}>
                            あなた {me?.name ? `(${me.name})` : ''}
                        </div>
                        <div style={{
                            width: '100%', height: '10px', background: '#dbeafe',
                            borderRadius: '5px', overflow: 'hidden',
                        }}>
                            <div style={{
                                width: `${myProgress}%`, height: '100%',
                                background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                                transition: 'width 0.3s',
                                borderRadius: '5px',
                            }} />
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#3b82f6', marginTop: '0.25rem', fontWeight: 600 }}>
                            {myProgress}%
                        </div>
                    </div>

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
                </div>

                {/* Opponent Board Section */}
                {opponents.length > 0 && opponents.map((opp) => {
                    const oppProgress = getFilledPercent(opp);
                    return (
                        <div key={opp.sessionId} style={{
                            flex: '0 1 auto', maxWidth: '320px', minWidth: '200px',
                            opacity: 0.9,
                        }}>
                            {/* Opponent Progress Bar */}
                            <div style={{
                                background: opp.status === 'finished' ? '#dcfce7' : '#fef3c7',
                                padding: '0.75rem 1.25rem', borderRadius: '12px',
                                marginBottom: '0.75rem', textAlign: 'center',
                            }}>
                                <div style={{
                                    fontWeight: 700, marginBottom: '0.5rem',
                                    color: opp.status === 'finished' ? '#16a34a' : '#d97706',
                                }}>
                                    {opp.name} {opp.status === 'finished' ? '✅' : ''}
                                </div>
                                <div style={{
                                    width: '100%', height: '10px',
                                    background: opp.status === 'finished' ? '#bbf7d0' : '#fde68a',
                                    borderRadius: '5px', overflow: 'hidden',
                                }}>
                                    <div style={{
                                        width: `${oppProgress}%`, height: '100%',
                                        background: opp.status === 'finished'
                                            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                            : 'linear-gradient(90deg, #f59e0b, #d97706)',
                                        transition: 'width 0.3s',
                                        borderRadius: '5px',
                                    }} />
                                </div>
                                <div style={{
                                    fontSize: '0.85rem', marginTop: '0.25rem', fontWeight: 600,
                                    color: opp.status === 'finished' ? '#16a34a' : '#d97706',
                                }}>
                                    {oppProgress}%
                                </div>
                            </div>

                            {/* Opponent's Board (read-only, smaller) */}
                            {opp.boardValues.length === 81 && (
                                <div style={{ transform: 'scale(0.65)', transformOrigin: 'top center' }}>
                                    <SudokuBoard
                                        board={getOpponentBoard(opp)}
                                        selectedCell={null}
                                        onCellClick={() => { }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Win Modal */}
            {gameStatus === 'finished' && winnerId && (
                <div className={sudokuStyles.modalOverlay}>
                    <div className={sudokuStyles.modal}>
                        <h2>{winnerId === me?.id ? '🎉 勝利！' : '😢 敗北...'}</h2>
                        <p>タイム: {formatTime(time)}</p>
                        <button onClick={() => { room.leave(); onLeave(); }}>メニューへ</button>
                    </div>
                </div>
            )}
        </main>
    );
}
