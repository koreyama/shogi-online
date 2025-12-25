import React, { useEffect, useState, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import styles from './page.module.css'; // Reusing existing styles
import { Board } from '@/components/Board';
import { Komadai } from '@/components/Komadai';
import { PlayerInfo } from '@/components/PlayerInfo';
import { Chat } from '@/components/Chat';
import { client } from '@/lib/colyseus';
import { Piece, Player, BoardState, Coordinates, GameState } from '@/lib/shogi/types';
import { getValidMoves, getValidDrops, isForcedPromotion, getLegalMoves } from '@/lib/shogi/rules';
import { canPromote } from '@/lib/shogi/engine';
import { IconBack, IconUndo, IconHourglass } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import { soundManager } from '@/utils/sound';

// Type definitions for Colyseus State (must match Server Schema partially)
interface ShogiSchema {
    players: any; // MapSchema
    board: any;   // ArraySchema
    turn: string;
    handSente: any; // ArraySchema
    handGote: any;  // ArraySchema
    winner: string;
    isCheck: boolean;
    gameStarted: boolean;
}

interface ColyseusShogiGameProps {
    mode: 'random' | 'room';
    roomId?: string; // For joining specific room
}

export default function ColyseusShogiGame({ mode, roomId: targetRoomId }: ColyseusShogiGameProps) {
    const { playerName, isLoaded: playerLoaded } = usePlayer();
    const { loading: authLoading } = useAuth();

    const [gameClient, setGameClient] = useState<Colyseus.Client | null>(null);
    const [room, setRoom] = useState<Colyseus.Room<ShogiSchema> | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [myRole, setMyRole] = useState<Player | null>(null);
    const [sessionId, setSessionId] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');

    // UI Local State
    const [selectedHandPiece, setSelectedHandPiece] = useState<Piece | null>(null);
    const [validMoves, setValidMoves] = useState<Coordinates[]>([]);
    const [showPromotionDialog, setShowPromotionDialog] = useState(false);
    const [pendingMove, setPendingMove] = useState<{ from: Coordinates, to: Coordinates } | null>(null);
    const [playersInfo, setPlayersInfo] = useState<{ sente: string, gote: string }>({ sente: "Waiting...", gote: "Waiting..." });
    const [showDissolvedDialog, setShowDissolvedDialog] = useState(false);


    const [messages, setMessages] = useState<any[]>([]);
    const [localSelectedPos, setLocalSelectedPos] = useState<Coordinates | null>(null);

    const dataEffectCalled = useRef(false);
    const roomRef = useRef<Colyseus.Room<ShogiSchema> | null>(null);

    useEffect(() => {
        if (authLoading || !playerLoaded) return;
        if (dataEffectCalled.current) return;
        dataEffectCalled.current = true;

        const init = async () => {
            try {
                // client is already initialized in lib/colyseus
                setGameClient(client);

                let r: Colyseus.Room<ShogiSchema>;

                try {
                    if (mode === 'room') {
                        if (targetRoomId) {
                            console.log(`Joining Room by ID: ${targetRoomId}`);
                            r = await client.joinById<ShogiSchema>(targetRoomId, { name: playerName || "Player" });
                        } else {
                            console.log("Creating new private room...");
                            r = await client.create<ShogiSchema>("shogi", { name: playerName || "Player", isPrivate: true });
                        }
                    } else {
                        console.log("Joining/Creating Random Match...");
                        r = await client.joinOrCreate<ShogiSchema>("shogi", { name: playerName || "Player" });
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
                console.log("Joined Shogi Room Success:", r.sessionId);

                r.onStateChange((state) => {
                    console.log(`[StateChange] Room: ${r.roomId}`, (state as any).toJSON ? (state as any).toJSON() : state);
                    const mappedState = mapSchemaToState(state);
                    setGameState(mappedState);

                    const players: any = {};
                    state.players.forEach((p: any, key: string) => {
                        players[p.role] = p.name;
                        if (key === r.sessionId) {
                            setMyRole(p.role as Player);
                        }
                    });

                    setPlayersInfo({
                        sente: players.sente || "Waiting...",
                        gote: players.gote || "Waiting..."
                    });

                    if (state.winner) {
                        setStatus('finished');
                    } else if (state.gameStarted) {
                        if (status !== 'playing') {
                            soundManager.playMoveSound();
                        }
                        setStatus('playing');
                    } else {
                        setStatus('waiting');
                    }
                });

                r.onMessage("gameStart", (msg: any) => {
                    console.log("Game Start!", msg);
                    setStatus('playing');
                });

                r.onMessage("gameOver", (msg: any) => {
                    console.log("Game Over!", msg);
                    setStatus('finished');
                    soundManager.playWinSound();
                });

                r.onMessage("serverErrorMessage", (msg: any) => {
                    console.error("Server Error Message (Detail):", JSON.stringify(msg));
                    alert("Server Error: " + (msg.message || "Unknown error"));
                });

                r.onMessage("roomDissolved", (msg: any) => {
                    setShowDissolvedDialog(true);
                });

            } catch (e: any) {
                console.error("Colyseus Error:", e);
                let errorMsg = "サーバーに接続できませんでした。";

                if (e instanceof Error) {
                    errorMsg += " " + e.message;
                } else if (typeof e === 'string') {
                    errorMsg += " " + e;
                } else if (e && e.target && e.target instanceof WebSocket) {
                    errorMsg += " WebSocketの接続に失敗しました。サーバーが起動しているか確認してください。";
                } else {
                    errorMsg += " " + (JSON.stringify(e) === "{}" ? "原因不明のエラー" : JSON.stringify(e));
                }

                setError(errorMsg);
            }
        };
        init();

        return () => {
            if (roomRef.current) {
                console.log("Cleaning up room connection...");
                roomRef.current.leave();
                roomRef.current = null;
            }
        };
    }, [authLoading, playerLoaded]);


    const mapSchemaToState = (state: ShogiSchema): GameState => {
        // Map 1D board to 2D
        const board: BoardState = Array(9).fill(null).map(() => Array(9).fill(null));

        // Colyseus ArraySchema is iteratable
        // Index i corresponds to y * 9 + x? 
        // We pushed 81 items in constructor.

        // Wait, ArraySchema might be dynamic.
        // If we pushed 81 items, we can iterate.
        // However, standard ArraySchema behavior:
        // state.board.forEach((piece, index) => ... )

        // Let's assume standard row-major order: y=0..8, x=0..8
        // index = y * 9 + x

        if (state.board && state.board.length === 81) {
            state.board.forEach((p: any, i: number) => {
                const x = i % 9;
                const y = Math.floor(i / 9);
                if (p.type && p.type !== "empty") {
                    board[y][x] = {
                        type: p.type,
                        owner: p.owner as Player,
                        isPromoted: p.isPromoted,
                        id: p.id || `${x}-${y}`
                    };
                } else {
                    board[y][x] = null;
                }
            });
            // Play sound for turn change if it's my turn
            if (gameState && state.turn !== gameState.turn) {
                soundManager.playMoveSound();
            }
        }

        const mapHand = (schemaHand: any): Piece[] => {
            const res: Piece[] = [];
            if (schemaHand) {
                schemaHand.forEach((p: any) => {
                    res.push({
                        type: p.type,
                        owner: p.owner as Player,
                        isPromoted: p.isPromoted,
                        id: p.id
                    });
                });
            }
            return res;
        };

        return {
            board: board,
            turn: state.turn as Player,
            hands: {
                sente: mapHand(state.handSente),
                gote: mapHand(state.handGote)
            },
            selectedPosition: null, // Logic State doesn't track selection
            history: [], // We are not syncing history yet for simplicity
            winner: state.winner as Player || null,
            isCheck: state.isCheck
        };
    };

    const handleCellClick = (x: number, y: number) => {
        console.log(`[Click] ${x},${y}. Status=${status}, Role=${myRole}, Turn=${gameState?.turn}, ShowProm=${showPromotionDialog}`);
        if (!gameState || !myRole || gameState.turn !== myRole || status !== 'playing') {
            console.log(`[ClickBlocked] ${x},${y}. State=${!!gameState}, MyRole=${myRole}, Turn=${gameState?.turn}, Status=${status}`);
            return;
        }
        if (showPromotionDialog) return;

        const clickedCell = gameState.board[y][x];
        const isOwnPiece = clickedCell?.owner === myRole;
        console.log(`[Click] Cell: type=${clickedCell?.type}, owner=${clickedCell?.owner}, IsOwn=${isOwnPiece}, CurrentSel=${localSelectedPos?.x},${localSelectedPos?.y}`);

        // 1. Handle Drop
        if (selectedHandPiece) {
            console.log(`[Drop] Attempting drop of ${selectedHandPiece.type} to ${x},${y}`);
            if (!clickedCell) {
                // Send Drop
                room?.send("drop", {
                    pieceType: selectedHandPiece.type,
                    to: { x, y }
                });
                setSelectedHandPiece(null);
                setValidMoves([]);
            } else {
                console.log(`[Drop] Target occupied. Switching or Deselecting.`);
                if (isOwnPiece) {
                    // Switch selection handled below? No, return blocks it.
                }
                setSelectedHandPiece(null);
            }
            return;
        }

        // 2. Handle Move or Select
        // We need local selected position state
        if (localSelectedPos) {
            const isTarget = validMoves.some(m => m.x === x && m.y === y);
            console.log(`[Move] IsTarget=${isTarget}. ValidMovesCount=${validMoves.length}`);

            if (isTarget) {
                const from = localSelectedPos;
                const piece = gameState.board[from.y][from.x]!;
                console.log(`[Move] Executing move from ${from.x},${from.y} to ${x},${y} (${piece.type})`);

                if (isForcedPromotion(piece, y)) {
                    handlePromotion(true, { from, to: { x, y } });
                } else if (canPromote(piece, from.y, y)) {
                    setPendingMove({ from, to: { x, y } });
                    setShowPromotionDialog(true);
                } else {
                    handlePromotion(false, { from, to: { x, y } });
                }
                return;
            }
        }

        if (clickedCell && isOwnPiece) {
            console.log(`[Select] Selected own piece at ${x},${y}`);
            setLocalSelectedPos({ x, y });
            setSelectedHandPiece(null);
            const moves = getLegalMoves(gameState.board, clickedCell, { x, y });
            console.log(`[Select] Legal Moves:`, moves);
            setValidMoves(moves);
        } else {
            console.log(`[Deselect] Clicked empty or enemy.`);
            setLocalSelectedPos(null);
            setValidMoves([]);
        }
    };


    const handleHandPieceClick = (piece: Piece) => {
        if (!gameState || !myRole || gameState.turn !== myRole || status !== 'playing') return;
        if (piece.owner !== myRole) return;

        setSelectedHandPiece(piece);
        setLocalSelectedPos(null);

        const drops = getValidDrops(gameState.board, piece, myRole, gameState.hands);
        setValidMoves(drops);
    };

    const handlePromotion = (promote: boolean, move?: { from: Coordinates, to: Coordinates }) => {
        const moveData = move || pendingMove;
        if (!moveData) return;

        console.log(`[Move] Sending to server:`, { from: moveData.from, to: moveData.to, promote });
        room?.send("move", {
            from: moveData.from,
            to: moveData.to,
            promote
        });

        setShowPromotionDialog(false);
        setPendingMove(null);
        setLocalSelectedPos(null);
        setValidMoves([]);
    };

    const handleResign = () => {
        if (!room) return;
        if (confirm("本当に投了しますか？")) {
            room.send("resign");
        }
    };


    if (error) {
        return <div className={styles.main}><p className="text-red-500">{error}</p></div>;
    }

    if (!gameState) {
        return <div className={styles.main}><p>Loading...</p></div>;
    }

    return (
        <div className={styles.main}>
            <div className={styles.header}>
                <button onClick={() => window.location.reload()} className={styles.backButton}><IconBack size={18} /> 終了</button>
                <h1 className={styles.compactTitle}>将棋オンライン</h1>
                <div className="text-xs bg-black/20 p-2 rounded ml-4">
                    ID: <span className="font-mono font-bold">{room?.roomId}</span>
                </div>
                {status === 'playing' && (
                    <button onClick={handleResign} className={styles.resignBtn}>
                        投了
                    </button>
                )}
            </div>

            <div className={styles.gameLayout}>
                <div className={styles.leftPanel}>
                    <div className={styles.playersSection}>
                        <PlayerInfo
                            playerName={playersInfo[myRole === 'sente' ? 'gote' : 'sente']}
                            role={myRole === 'sente' ? 'gote' : 'sente'}
                            isMyTurn={gameState.turn !== myRole}
                            capturedPiecesCount={myRole === 'sente' ? gameState.hands.gote.length : gameState.hands.sente.length}
                        />
                        <PlayerInfo
                            playerName={playersInfo[myRole === 'sente' ? 'sente' : 'gote']}
                            role={myRole!}
                            isMyTurn={gameState.turn === myRole}
                            capturedPiecesCount={myRole === 'sente' ? gameState.hands.sente.length : gameState.hands.gote.length}
                        />
                    </div>
                </div>

                <div className={styles.centerPanel}>
                    <div className={styles.boardArea}>
                        {/* Gote / Top Side */}
                        <div className={styles.goteSide}>
                            <Komadai
                                owner={myRole === 'gote' ? 'sente' : 'gote'}
                                pieces={myRole === 'gote' ? gameState.hands.sente : gameState.hands.gote}
                                onPieceClick={handleHandPieceClick}
                                selectedPieceId={selectedHandPiece?.id || null}
                            />
                            <div className={styles.playerLabel}>{myRole === 'gote' ? '先手' : '後手'}</div>
                        </div>

                        <div className={styles.boardWrapper}>
                            <Board
                                board={gameState.board}
                                selectedPos={localSelectedPos}
                                validMoves={validMoves}
                                onCellClick={handleCellClick}
                                perspective={myRole || 'sente'}
                            />
                        </div>

                        <div className={styles.senteSide}>
                            <Komadai
                                owner={myRole === 'gote' ? 'gote' : 'sente'}
                                pieces={myRole === 'gote' ? gameState.hands.gote : gameState.hands.sente}
                                onPieceClick={handleHandPieceClick}
                                selectedPieceId={selectedHandPiece?.id || null}
                            />
                            <div className={styles.playerLabel}>{myRole === 'gote' ? '後手' : '先手'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            {showPromotionDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <p>成りますか？</p>
                        <div className={styles.modalButtons}>
                            <button onClick={() => handlePromotion(true)} className={styles.primaryBtn}>成る</button>
                            <button onClick={() => handlePromotion(false)} className={styles.secondaryBtn}>成らない</button>
                        </div>
                    </div>
                </div>
            )}

            {status === 'finished' && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>勝負あり！</h2>
                        <p>勝者: {gameState.winner === 'sente' ? '先手' : '後手'}</p>
                        <button onClick={() => window.location.reload()} className={styles.primaryBtn}>もう一度</button>
                    </div>
                </div>
            )}
            {showDissolvedDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>部屋が解散されました</h2>
                        <p>対戦相手が退出しました。</p>
                        <button onClick={() => window.location.reload()} className={styles.primaryBtn}>ホームへ戻る</button>
                    </div>
                </div>
            )}
        </div>
    );
}
