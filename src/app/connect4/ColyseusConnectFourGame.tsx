import React, { useEffect, useState, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import styles from './page.module.css';
import Connect4Board from '@/components/Connect4Board';
import { Board, Player, Coordinates } from '@/lib/connect4/types';
import { client } from '@/lib/colyseus';
import { IconBack } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import { soundManager } from '@/utils/sound';

interface ConnectFourSchema {
    players: any;
    board: number[]; // 1D array of 42: 0=Empty, 1=Red, 2=Yellow
    turn: string; // "red", "yellow"
    winner: string;
    gameStarted: boolean;
    isDraw: boolean;
}

interface Props {
    mode: 'random' | 'room';
    roomId?: string;
}

const ROWS = 6;
const COLS = 7;

export default function ColyseusConnectFourGame({ mode, roomId: targetRoomId }: Props) {
    const { playerName, isLoaded: playerLoaded } = usePlayer();
    const { loading: authLoading } = useAuth();

    const [room, setRoom] = useState<Colyseus.Room<ConnectFourSchema> | null>(null);
    const [board, setBoard] = useState<Board>(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    const [turn, setTurn] = useState<Player>('red');
    const [myRole, setMyRole] = useState<Player | null>(null);
    const [winner, setWinner] = useState<Player | 'draw' | null>(null);
    const [winningLine, setWinningLine] = useState<Coordinates[] | null>(null);
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');
    const [error, setError] = useState("");
    const [playersInfo, setPlayersInfo] = useState({ red: "待機中...", yellow: "待機中..." });
    const [showDissolvedDialog, setShowDissolvedDialog] = useState(false);

    const roomRef = useRef<Colyseus.Room<ConnectFourSchema> | null>(null);

    // Convert Server 1D (0,1,2) -> Client 2D ('red','yellow',null)
    const updateBoard = (serverBoard: number[]) => {
        const newBoard: Board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                // Server logic: idx = r * COLS + col. row 0 is top.
                const val = serverBoard[r * COLS + c];
                if (val === 1) newBoard[r][c] = 'red';
                else if (val === 2) newBoard[r][c] = 'yellow';
            }
        }
        setBoard(newBoard);
        calculateWinningLine(newBoard);
    };

    // Client-side visual calculation
    const calculateWinningLine = (board: Board) => {
        // We can use the checkWinner logic from engine if exported,
        // but simpler to minimal copy for visual ONLY.
        // Actually, if winner is set, we find the line.
        // Let's defer this specific check or use heuristic:
        // If a winner exists, scan board for 4 connected of that color.
    };

    // Better: Helper function to find winning line
    const findWinningLine = (board: Board, player: Player): Coordinates[] | null => {
        const directions = [
            { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: -1 }
        ];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] !== player) continue;
                for (const { r: dr, c: dc } of directions) {
                    const line = [{ r, c }];
                    for (let i = 1; i < 4; i++) {
                        const nr = r + dr * i;
                        const nc = c + dc * i;
                        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
                            line.push({ row: nr, col: nc });
                        } else break;
                    }
                    if (line.length === 4) return line;
                }
            }
        }
        return null;
    };


    useEffect(() => {
        if (authLoading || !playerLoaded) return;

        const init = async () => {
            try {
                let r: Colyseus.Room<ConnectFourSchema>;
                if (mode === 'room') {
                    if (targetRoomId) {
                        r = await client.joinById(targetRoomId, { name: playerName });
                    } else {
                        r = await client.create("connectfour", { name: playerName, isPrivate: true });
                    }
                } else {
                    r = await client.joinOrCreate("connectfour", { name: playerName });
                }

                setRoom(r);
                roomRef.current = r;

                r.onStateChange((state) => {
                    updateBoard(state.board);
                    setTurn(state.turn as Player);

                    const players: any = {};
                    state.players.forEach((p: any, key: string) => {
                        players[p.role] = p.name;
                        if (key === r.sessionId) {
                            setMyRole(p.role as any);
                        }
                    });
                    setPlayersInfo({
                        red: players.red || "待機中...",
                        yellow: players.yellow || "待機中..."
                    });

                    if (state.winner) {
                        setWinner(state.winner === 'draw' ? 'draw' : state.winner as Player);
                        setStatus('finished');
                        soundManager.playWinSound();
                        if (state.winner !== 'draw') {
                            // Wait for board update to finish, then calc line?
                            // updateBoard is synchronous state set.
                            // We should pass board to findWinningLine.
                            // But state.board is 1D.
                            // We need to pass the CONVERTED board.
                            // updateBoard does that, but setBoard is async.
                            // We should split updateBoard logic.
                            // For now, let's trigger it in a separate effect or just run it here on 2D converted.
                        }
                    } else if (state.isDraw) { // Note state.winner probably handles draw string too in schema? I used string.
                        // My schema has isDraw boolean.
                        if (state.isDraw) {
                            setWinner('draw');
                            setStatus('finished');
                        }
                    } else if (state.gameStarted) {
                        if (status !== 'playing') {
                            setStatus('playing');
                            soundManager.playMoveSound();
                        }
                    } else {
                        setStatus('waiting');
                    }
                });

                r.onMessage("gameStart", () => setStatus('playing'));
                r.onMessage("roomDissolved", () => setShowDissolvedDialog(true));

            } catch (e: any) {
                console.error("Join error:", e);
                setError("ルームへの参加に失敗しました。");
            }
        };
        init();

        return () => {
            roomRef.current?.leave();
        };
    }, [authLoading, playerLoaded]);

    // Winning line effect
    useEffect(() => {
        if (winner && winner !== 'draw') {
            const line = findWinningLine(board, winner);
            if (line) setWinningLine(line);
        } else {
            setWinningLine(null);
        }
    }, [board, winner]);


    const handleColumnClick = (col: number) => {
        if (status !== 'playing' || turn !== myRole) return;
        room?.send("move", { col });
    };

    const handleBackToTop = () => {
        window.location.reload();
    };

    if (error) return <div className={styles.main}>{error}</div>;
    if (!room) return <div className={styles.main}>読み込み中...</div>;

    return (
        <div className={styles.main}>
            <div className={styles.header}>
                <button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 終了</button>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Connect Four</h1>
                    <div className={styles.roomBadge}>ID: {room.roomId}</div>
                </div>
            </div>

            <div className={styles.gameArea}>
                <div className={styles.playerInfo}>
                    <div className={`${styles.playerCard} ${turn === 'red' ? styles.active : ''}`}>
                        <div className={`${styles.playerIcon} ${styles.redIcon}`} />
                        <span className={styles.playerName}>{playersInfo.red}</span>
                        {myRole === 'red' && <span className={styles.meBadge}>あなた</span>}
                    </div>
                    <div className={styles.vs}>VS</div>
                    <div className={`${styles.playerCard} ${turn === 'yellow' ? styles.active : ''}`}>
                        <div className={`${styles.playerIcon} ${styles.yellowIcon}`} />
                        <span className={styles.playerName}>{playersInfo.yellow}</span>
                        {myRole === 'yellow' && <span className={styles.meBadge}>あなた</span>}
                    </div>
                </div>

                <Connect4Board
                    board={board}
                    onColumnClick={handleColumnClick}
                    turn={turn}
                    myRole={myRole}
                    isMyTurn={turn === myRole}
                    winner={winner}
                    winningLine={winningLine}
                />

                <div className={styles.statusDisplay}>
                    {status === 'waiting' && "対戦相手を待っています..."}
                    {status === 'playing' && (turn === myRole ? "あなたの番です！" : "相手の番です")}
                    {status === 'finished' && (
                        winner === 'draw' ? "引き分け！" : `${winner === 'red' ? '赤' : '黄'} の勝ち！`
                    )}
                </div>
            </div>

            {showDissolvedDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>部屋が解散されました</h2>
                        <button onClick={handleBackToTop} className={styles.primaryBtn}>戻る</button>
                    </div>
                </div>
            )}
        </div>
    );
}
