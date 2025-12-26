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
    const [myStatus, setMyStatus] = useState<string>('waiting'); // waiting, playing, frozen, finished
    const [gameStatus, setGameStatus] = useState<string>('waiting');
    const [winnerId, setWinnerId] = useState<string | null>(null);

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
                    r = await client.joinOrCreate("minesweeper_room", { ...options, playerId: myPlayerId, name: myPlayerName });
                }

                roomRef.current = r;
                setRoom(r);
                setupRoomListeners(r);

            } catch (e: any) {
                console.error("Join Error:", e);
                const errorMsg = e.message || JSON.stringify(e);
                // Only alert if we really failed and it wasn't a cleanup/cancel
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
                // Approximate time sync
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
                    items: p.cellStates, // Schema array
                    mines: p.mines // Independent Board
                };
                pList.push(playerObj);

                if (sessionId === r.sessionId) {
                    myP = playerObj;
                    setMyStatus(p.status);

                    // Reconstruct Board for ME
                    // Only if game started
                    if (p.mines && p.mines.length > 0) {
                        const w = state.width;
                        const h = state.height;
                        const newBoard: Board = [];

                        for (let y = 0; y < h; y++) {
                            const row: Cell[] = [];
                            for (let x = 0; x < w; x++) {
                                const idx = y * w + x;
                                const cellState = p.cellStates[idx]; // 0:Hidden, 1:Revealed, 2:Flagged
                                const isMine = p.mines[idx] === 1;

                                // Neighbor count calculation (Client Side)
                                let neighbors = 0;
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

    const startGame = () => {
        room?.send("startGame");
    };

    if (!room) return <div className={styles.loading}>接続中...</div>;

    // Waiting Lobby
    if (gameStatus === 'waiting' || gameStatus === 'finished') {
        const isRandom = !roomId && !options?.roomId && !options?.create;

        if (isRandom && gameStatus === 'waiting') {
            return (
                <main className={styles.main}>
                    <div className={styles.header}>
                        <button onClick={() => { room.leave(); onLeave(); }} className={styles.backButton}>キャンセル</button>
                    </div>
                    <div className={styles.waitingScreen}>
                        <h2>対戦相手を探しています...</h2>
                        <div className={styles.waitingSpinner}></div>
                        <p>マッチング中 (Room: {room.roomId})</p>
                    </div>
                </main>
            );
        }

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
                                    {p.id === winnerId && " 👑 WINNER"}
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
                        <button onClick={startGame} className={styles.startBtn} disabled={players.length < 2}>
                            {gameStatus === 'finished' ? 'もう一度' : 'ゲーム開始'}
                        </button>
                        <button onClick={() => { room.leave(); onLeave(); }} className={styles.leaveBtn}>退出</button>
                    </div>
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
