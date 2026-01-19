'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import styles from './page.module.css';
import { client } from '@/lib/colyseus';
import { Chess } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';
import { IconBack } from '@/components/Icons';
import { Chat } from '@/components/Chat';
import { MatchingWaitingScreen } from '@/components/game/MatchingWaitingScreen';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';

// Helper to map chess.js board to our UI Board format
const mapChessJsBoardToUI = (chess: Chess) => {
    const rawBoard = chess.board();
    const typeMap: Record<string, string> = {
        'p': 'pawn', 'r': 'rook', 'n': 'knight', 'b': 'bishop', 'q': 'queen', 'k': 'king'
    };
    const colorMap: Record<string, string> = {
        'w': 'white', 'b': 'black'
    };

    return rawBoard.map(row => row.map(cell => {
        if (!cell) return null;
        return {
            type: typeMap[cell.type],
            player: colorMap[cell.color],
            hasMoved: false
        };
    }));
};

interface ColyseusChessGameProps {
    mode: 'random' | 'room';
    roomId?: string;
}

interface ChessSchema {
    players: any; // MapSchema
    fen: string;
    turn: string;
    winner: string;
    isGameOver: boolean;
    lastMove: string;
    isCheck: boolean;
}

export default function ColyseusChessGame({ mode, roomId: targetRoomId }: ColyseusChessGameProps) {
    const { playerName, isLoaded: playerLoaded } = usePlayer();
    const { user, loading: authLoading } = useAuth();

    // Core State
    const [room, setRoom] = useState<Colyseus.Room<ChessSchema> | null>(null);
    const [chess] = useState(new Chess()); // Single instance
    const [board, setBoard] = useState<any>(mapChessJsBoardToUI(chess));
    const [myRole, setMyRole] = useState<'white' | 'black' | 'spectator'>('spectator');
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string>("");

    // Game State
    const [selectedPos, setSelectedPos] = useState<{ x: number, y: number } | null>(null);
    const [validMoves, setValidMoves] = useState<{ x: number, y: number }[]>([]);
    const [turn, setTurn] = useState<'white' | 'black'>('white');
    const [winner, setWinner] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [showDissolvedDialog, setShowDissolvedDialog] = useState(false);
    const [playersInfo, setPlayersInfo] = useState<{ white: string, black: string }>({ white: "Waiting...", black: "Waiting..." });
    const [inCheck, setInCheck] = useState(false);

    // Refs
    const dataEffectCalled = useRef(false);
    const roomRef = useRef<Colyseus.Room<ChessSchema> | null>(null);

    useEffect(() => {
        if (authLoading || !playerLoaded) return;
        if (dataEffectCalled.current) return;
        dataEffectCalled.current = true;

        const connect = async () => {
            try {
                // Fetch User Profile Name dynamically (like Shogi)
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

                let r: Colyseus.Room<ChessSchema>;

                try {
                    if (mode === 'room') {
                        if (targetRoomId) {
                            console.log(`Joining Room by ID: ${targetRoomId}`);
                            r = await client.joinById<ChessSchema>(targetRoomId, { name: currentName, mode: 'room' });
                        } else {
                            console.log("Creating new private room...");
                            r = await client.create<ChessSchema>("chess", { name: currentName, isPrivate: true, mode: 'room' });
                        }
                    } else {
                        console.log("Joining/Creating Random Match...");
                        r = await client.joinOrCreate<ChessSchema>("chess", { name: currentName, mode: 'random' });
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
                console.log("Joined Chess room:", r.roomId);

                // Initial State Sync is handled by onStateChange immediately usually, 
                // but we can manually trigger if needed. Shogi relies on onStateChange.

                r.onStateChange((state: any) => {
                    // console.log("State Change:", state);
                    try {
                        // Sync FEN
                        if (state.fen) {
                            const currentFen = chess.fen();
                            if (currentFen !== state.fen) {
                                // Validate FEN
                                if (!state.fen || typeof state.fen !== 'string') {
                                    console.warn("Invalid FEN from server:", state.fen);
                                } else {
                                    try {
                                        chess.load(state.fen);
                                        setBoard(mapChessJsBoardToUI(chess));
                                    } catch (e) {
                                        console.warn("Failed to load FEN:", state.fen, e);
                                    }
                                }
                            }
                            setInCheck(state.isCheck || chess.inCheck());
                        }

                        setTurn(state.turn === 'w' ? 'white' : 'black');

                        // Players
                        if (state.players && typeof state.players.forEach === 'function') {
                            const newPlayersInfo = { white: "Waiting...", black: "Waiting..." };
                            let w = false, b = false;

                            state.players.forEach((p: any) => {
                                if (p.color === 'w') {
                                    w = true;
                                    newPlayersInfo.white = p.name || "Unknown";
                                }
                                if (p.color === 'b') {
                                    b = true;
                                    newPlayersInfo.black = p.name || "Unknown";
                                }
                                if (p.id === r.sessionId) {
                                    setMyRole(p.color === 'w' ? 'white' : p.color === 'b' ? 'black' : 'spectator');
                                }
                            });
                            setPlayersInfo(newPlayersInfo);

                            // Status
                            if (state.isGameOver) {
                                setStatus('finished');
                                setWinner(state.winner === 'w' ? 'white' : state.winner === 'b' ? 'black' : 'draw');
                            } else if (w && b) {
                                setStatus('playing');
                            } else {
                                setStatus('waiting');
                            }
                        }
                    } catch (e) {
                        console.warn("Error in onStateChange:", e);
                    }
                });

                r.onMessage("gameStart", (msg: any) => {
                    console.log("Game Started");
                    setStatus('playing');
                });

                r.onMessage("gameOver", (msg: any) => {
                    console.log("Server Game Over:", msg);
                    setStatus('finished');
                    setWinner(msg.winner === 'w' ? 'white' : msg.winner === 'b' ? 'black' : 'draw');
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

    const handleCellClick = (x: number, y: number) => {
        if (status === 'connecting') return;
        if (status === 'waiting') { alert("対戦相手を待っています"); return; }
        if (myRole === 'spectator') { alert("観戦モードです"); return; }
        if (status !== 'playing') return;
        if (turn !== myRole) { alert("相手の手番です"); return; }

        const uiPiece = board[y][x];
        const isMyPiece = uiPiece?.player === myRole;

        // 1. Select
        if (isMyPiece) {
            setSelectedPos({ x, y });
            const rank = 8 - y;
            const file = String.fromCharCode(97 + x);
            const square = `${file}${rank}` as any;

            const moves = chess.moves({ square, verbose: true });
            const validCoords = moves.map(m => {
                const tx = m.to.charCodeAt(0) - 97;
                const ty = 8 - parseInt(m.to[1]);
                return { x: tx, y: ty };
            });
            setValidMoves(validCoords);
            return;
        }

        // 2. Move
        if (selectedPos) {
            const isTarget = validMoves.some(m => m.x === x && m.y === y);
            if (isTarget) {
                const fromRank = 8 - selectedPos.y;
                const fromFile = String.fromCharCode(97 + selectedPos.x);
                const toRank = 8 - y;
                const toFile = String.fromCharCode(97 + x);
                const from = `${fromFile}${fromRank}`;
                const to = `${toFile}${toRank}`;

                room?.send("move", { from, to });

                // Optimistic Update
                try {
                    chess.move({ from, to, promotion: 'q' });
                    setBoard(mapChessJsBoardToUI(chess));
                    setInCheck(chess.inCheck());

                    if (chess.isGameOver()) {
                        // Wait for server state usually, but local check is fine
                        // setStatus('finished'); // Let server confirm
                    }
                } catch (e) {
                    console.warn("Client move error", e);
                }

                setSelectedPos(null);
                setValidMoves([]);
            } else {
                setSelectedPos(null);
                setValidMoves([]);
            }
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

            {status !== 'waiting' && status !== 'connecting' && (
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
            )}

            <div className={styles.gameLayout}>
                <div className={styles.leftPanel}>
                    <div className={styles.playersSection}>
                        <div className={styles.playerInfo}>
                            <p>相手</p>
                            <p className="font-bold text-lg">
                                {myRole === 'white' ? `${playersInfo.black} (黒)` : `${playersInfo.white} (白)`}
                            </p>
                        </div>
                        <div className={styles.playerInfo}>
                            <p>自分</p>
                            <p className="font-bold text-lg">
                                {myRole === 'white' ? `${playersInfo.white} (白)` : `${playersInfo.black} (黒)`}
                            </p>
                        </div>
                    </div>
                    <div className={styles.chatSection}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                    </div>
                </div>

                <div className={styles.centerPanel}>
                    {/* Piece Legend */}
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        width: '100%',
                        maxWidth: '600px'
                    }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center' }}>駒の役割 (Piece Legend)</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '1.5rem' }}>♚</span> キング (王)</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '1.5rem' }}>♛</span> クイーン (妃)</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '1.5rem' }}>♜</span> ルーク (城)</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '1.5rem' }}>♝</span> ビショップ (僧)</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '1.5rem' }}>♞</span> ナイト (騎士)</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '1.5rem' }}>♟</span> ポーン (歩兵)</div>
                        </div>
                    </div>

                    <div className={styles.turnIndicator}>
                        {turn === 'white' ? '白の番' : '黒の番'}
                        {turn === myRole && ' (あなた)'}
                    </div>
                    {inCheck && !winner && <div className="text-red-500 font-bold text-xl mb-2 animate-pulse">王手！ (Check!)</div>}
                    <div className={styles.boardWrapper}>
                        <ChessBoard
                            board={board}
                            onCellClick={handleCellClick}
                            selectedPos={selectedPos ? { x: selectedPos.x, y: selectedPos.y } : null}
                            validMoves={validMoves}
                            turn={turn}
                            isMyTurn={turn === myRole}
                            winner={winner ? (winner === 'white' ? 'white' : 'black') : null}
                            myRole={myRole === 'spectator' ? 'white' : myRole}
                        />
                    </div>
                    {status === 'connecting' && <div className="text-center mt-2">接続中...</div>}
                </div>
            </div>

            {status === 'finished' && !showDissolvedDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>勝負あり！</h2>
                        <p>勝者: {winner === 'white' ? '白' : winner === 'black' ? '黒' : '引き分け'}</p>
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
