import React, { useEffect, useState, useRef } from 'react';
import { Client, Room } from 'colyseus.js';
import { MinesweeperBoard } from '@/components/MinesweeperBoard';
import { IconBack, IconUser, IconFlag } from '@/components/Icons';
import styles from './page.module.css';
import { Board, Cell } from '@/lib/minesweeper/types';

interface Props {
    roomId?: string;
    options?: any;
    onLeave: () => void;
    myPlayerId: string;
    myPlayerName: string;
}

export function ColyseusMinesweeperGame({ roomId, options, onLeave, myPlayerId, myPlayerName }: Props) {
    const [room, setRoom] = useState<Room | null>(null);
    const [board, setBoard] = useState<Board>([]);
    const [players, setPlayers] = useState<any[]>([]);
    const [myStatus, setMyStatus] = useState<string>('waiting');
    const [gameStatus, setGameStatus] = useState<string>('waiting');
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [amIReady, setAmIReady] = useState(false);

    // Timer
    const [startTime, setStartTime] = useState<number>(0);
    const [time, setTime] = useState(0);

    const clientRef = useRef<Client | null>(null);
    const roomRef = useRef<Room | null>(null);
    const connectingRef = useRef(false);

    // Initial Connection
    useEffect(() => {
        // Prevent double connection in Strict Mode
        if (connectingRef.current || roomRef.current) return;

        const client = new Client(process.env.NEXT_PUBLIC_COLYSEUS_URL || "ws://localhost:2567");
        clientRef.current = client;
        connectingRef.current = true;

        const connect = async () => {
            try {
                let r: Room;
                if (roomId) {
                    console.log("Joining by ID:", roomId);
                    r = await client.joinById(roomId, { playerId: myPlayerId, name: myPlayerName });
                } else if (options?.roomId) {
                    console.log("Joining by Options ID:", options.roomId);
                    r = await client.joinById(options.roomId, { playerId: myPlayerId, name: myPlayerName });
                } else if (options?.create) {
                    console.log("Creating Room with options:", options);
                    r = await client.create("minesweeper_room", { ...options, playerId: myPlayerId, name: myPlayerName });
                } else {
                    // Random / Auto Match
                    console.log("Joining/Creating Random Room with options:", options);
                    try {
                        r = await client.joinOrCreate("minesweeper_room", { ...options, playerId: myPlayerId, name: myPlayerName });
                    } catch (e: any) {
                        if (e.message && e.message.includes("locked")) {
                            console.log("Random match found locked room, creating new one...");
                            r = await client.create("minesweeper_room", { ...options, playerId: myPlayerId, name: myPlayerName });
                        } else {
                            throw e;
                        }
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
            // Cleanup on unmount
            if (roomRef.current) {
                roomRef.current.leave();
                roomRef.current = null;
            }
            connectingRef.current = false;
        };
    }, []);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameStatus === 'playing') {
            interval = setInterval(() => {
                const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
                setTime(elapsed);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameStatus, startTime]);


    const setupRoomListeners = (r: Room) => {
        r.onStateChange((state: any) => {
            setGameStatus(state.status);
            setStartTime(state.startTime);

            // Map Players
            const pList: any[] = [];
            let myP = null;

            state.players.forEach((p: any, sessionId: string) => {
                const playerObj = {
                    id: p.id,
                    sessionId: sessionId,
                    name: p.name,
                    status: p.status,
                    progress: p.progress,
                    isReady: p.isReady,
                    items: p.cellStates,
                    mines: p.mines
                };
                pList.push(playerObj);

                if (sessionId === r.sessionId) {
                    myP = playerObj;
                    setMyStatus(p.status);
                    setAmIReady(p.isReady);

                    // Reconstruct Board for ME
                    if (state.status === 'playing' || state.status === 'finished') {
                        const w = state.width;
                        const h = state.height;
                        const newBoard: Board = [];

                        // If mines not generated yet (e.g. before first click), mines array might be empty or all 0
                        // Client should render "Empty" board in that case.
                        // But p.cellStates is initialized.

                        const hasMines = p.mines && p.mines.length > 0;

                        for (let y = 0; y < h; y++) {
                            const row: Cell[] = [];
                            for (let x = 0; x < w; x++) {
                                const idx = y * w + x;
                                const cellState = p.cellStates[idx]; // 0:Hidden, 1:Revealed, 2:Flagged

                                // Caution: before generation, mines is all 0.
                                // We trust 'isMine' only if generated? 
                                // Actually server logic handles consistency. 
                                // Ideally we trust p.mines[idx] === 1.
                                const isMine = hasMines ? (p.mines[idx] === 1) : false;

                                let neighbors = 0;
                                if (hasMines) {
                                    for (let dy = -1; dy <= 1; dy++) {
                                        for (let dx = -1; dx <= 1; dx++) {
                                            if (dx === 0 && dy === 0) continue;
                                            const nx = x + dx;
                                            const ny = y + dy;
                                            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                                const nid = ny * w + nx;
                                                if (p.mines[nid] === 1) neighbors++;
                                            }
                                        }
                                    }
                                }

                                row.push({
                                    row: y,
                                    col: x,
                                    isMine: isMine,
                                    isRevealed: cellState === 1,
                                    isFlagged: cellState === 2,
                                    neighborMines: neighbors
                                });
                            }
                            newBoard.push(row);
                        }
                        setBoard(newBoard);
                    }
                }
            });
            setPlayers(pList);
        });

        r.onMessage("winner", (msg: any) => {
            setWinnerId(msg.winnerId);
        });

        r.onMessage("notification", (msg: any) => {
            alert(msg.message);
        });
    };

    const handleCellClick = (r: number, c: number) => {
        if (!room) return;
        const width = room.state.width;
        const idx = r * width + c;
        room.send("reveal", { index: idx });
    };

    const handleCellRightClick = (e: React.MouseEvent, r: number, c: number) => {
        e.preventDefault();
        if (!room) return;
        const width = room.state.width;
        const idx = r * width + c;
        room.send("flag", { index: idx });
    };

    const toggleReady = () => {
        room?.send("ready");
    };

    if (!room) return <div className={styles.loading}>接続中...</div>;

    // Waiting Lobby
    if (gameStatus === 'waiting') {
        return (
            <main className={styles.main}>
                <div className={styles.lobbyContainer}>
                    <h1>VS マインスイーパー</h1>

                    <div className={styles.roomIdDisplay}>
                        ID: {room.roomId}
                    </div>
                    <p style={{ marginBottom: '2rem', color: '#718096' }}>このIDを友達に共有してください</p>

                    <div className={styles.lobbyContent}>
                        <div className={styles.playersSection}>
                            <h3>プレイヤー ({players.length}/2)</h3>
                            {players.map(p => (
                                <div key={p.sessionId} className={styles.playerCard}>
                                    <IconUser size={20} /> {p.name}
                                    {p.isReady ? <span style={{ color: '#22c55e', marginLeft: '10px' }}>READY!</span> : <span style={{ color: '#94a3b8', marginLeft: '10px' }}>...</span>}
                                </div>
                            ))}
                            {players.length < 2 && (
                                <div className={styles.playerCard} style={{ opacity: 0.5, borderStyle: 'dashed' }}>
                                    waiting...
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.controls}>
                        <button
                            onClick={toggleReady}
                            className={`${styles.startBtn} ${amIReady ? styles.readyActive : ''}`}
                            style={{ background: amIReady ? '#22c55e' : '#3b82f6' }}
                        >
                            {amIReady ? '準備完了！' : '準備する'}
                        </button>
                        <button onClick={() => { room.leave(); onLeave(); }} className={styles.leaveBtn}>退出</button>
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                        両方のプレイヤーが「準備完了」になるとゲームが開始します
                    </p>
                </div>
            </main>
        );
    }

    // Playing View
    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <button onClick={() => { room.leave(); onLeave(); }} className={styles.backButton}>
                    <IconBack size={20} /> 退出
                </button>
                <div className={styles.timer}>⏱️ {time}秒</div>
            </div>

            {/* Opponent Progress Bars */}
            <div className={styles.vsBar}>
                {players.map(p => (
                    <div key={p.sessionId} className={styles.vsPlayer}>
                        <span>{p.name} {p.id === myPlayerId ? '(You)' : ''}</span>
                        <div className={styles.progressBar}>
                            <div style={{ width: `${p.progress}%`, background: p.status === 'frozen' ? '#3b82f6' : '#22c55e' }} />
                        </div>
                        {p.status === 'frozen' && <span style={{ color: '#3b82f6' }}>❄️ FROZEN!</span>}
                        {p.status === 'finished' && <span style={{ color: '#eab308' }}>🏁 FINISH!</span>}
                    </div>
                ))}
            </div>

            <div className={styles.gameContainer} style={{ position: 'relative' }}>
                {/* Freeze Overlay */}
                {myStatus === 'frozen' && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10,
                        background: 'rgba(0, 100, 255, 0.3)', backdropFilter: 'blur(2px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '2rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        ❄️ FROZEN! (Penalty) ❄️
                    </div>
                )}

                {/* Victory/Defeat Overlay */}
                {gameStatus === 'finished' && winnerId && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20,
                        background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                        color: 'white'
                    }}>
                        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                            {winnerId === myPlayerId ? '🏆 VICTORY! 🏆' : '💀 DEFEAT...'}
                        </h1>
                        <button onClick={() => { room.leave(); onLeave(); }} className={styles.startBtn}>
                            ロビーに戻る
                        </button>
                    </div>
                )}

                <div className={styles.boardWrapper}>
                    <MinesweeperBoard
                        board={board}
                        onCellClick={handleCellClick}
                        onCellRightClick={handleCellRightClick}
                    />
                </div>
            </div>
        </main>
    );
}
