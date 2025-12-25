import React, { useEffect, useState, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import styles from '@/styles/GameMenu.module.css';
import gameStyles from './Polyomino.module.css';
import { client } from '@/lib/colyseus';
import { IconBack } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import { Chat } from '@/components/Chat';
import { PolyominoEngine } from './polyomino-engine';
import { Piece, PlayerColor, Point, BOARD_SIZE } from './polyomino-types';
import { INITIAL_PIECES } from './polyomino-data';

interface Props {
    mode: 'random' | 'room';
    roomId?: string;
}

export default function ColyseusPolyominoGame({ mode, roomId: targetRoomId }: Props) {
    const { playerName, isLoaded: playerLoaded } = usePlayer();
    const { loading: authLoading } = useAuth();
    const [room, setRoom] = useState<Colyseus.Room<any> | null>(null);

    // Game State
    const [board, setBoard] = useState<(PlayerColor | null)[]>(new Array(196).fill(null));
    const [turn, setTurn] = useState<PlayerColor>("P1");
    const [myRole, setMyRole] = useState<PlayerColor | null>(null);
    const [winner, setWinner] = useState<string | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');
    const [hand, setHand] = useState<Piece[]>([]);

    const [playersInfo, setPlayersInfo] = useState({ P1: "待機中...", P2: "待機中..." });
    const [messages, setMessages] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [showDissolvedDialog, setShowDissolvedDialog] = useState(false);

    // Interaction
    const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
    const [matrix, setMatrix] = useState<number[][] | null>(null);
    const [hoverPos, setHoverPos] = useState<Point | null>(null);

    const roomRef = useRef<Colyseus.Room<any> | null>(null);

    useEffect(() => {
        if (authLoading || !playerLoaded) return;

        const init = async () => {
            try {
                let r: Colyseus.Room<any>;
                if (mode === 'room') {
                    if (targetRoomId) {
                        r = await client.joinById(targetRoomId, { name: playerName });
                    } else {
                        r = await client.create("polyomino", { name: playerName, isPrivate: true });
                    }
                } else {
                    r = await client.joinOrCreate("polyomino", { name: playerName });
                }

                setRoom(r);
                roomRef.current = r;

                r.onStateChange((state) => {
                    setBoard(Array.from(state.board).map(c => c === "" ? null : c as PlayerColor));
                    setTurn(state.turn as PlayerColor);
                    setIsGameOver(state.isGameOver);

                    if (state.winner !== "") {
                        setWinner(state.winner);
                        setStatus('finished');
                    } else if (state.gameStarted) {
                        setStatus('playing');
                    } else {
                        setStatus('waiting');
                    }

                    const newPlayersInfo = { P1: "待機中...", P2: "待機中..." };
                    state.players.forEach((p: any, sessionId: string) => {
                        newPlayersInfo[p.role as 'P1' | 'P2'] = p.name;
                        if (sessionId === r.sessionId) {
                            setMyRole(p.role as PlayerColor);
                            const playerHand = Array.from(p.hand).map((h: any) => {
                                return INITIAL_PIECES.find(ip => ip.id === h.id)!;
                            });
                            setHand(playerHand);
                        }
                    });
                    setPlayersInfo(newPlayersInfo);
                });

                r.onMessage("chat", (message) => {
                    setMessages(prev => [...prev, message]);
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

    const handleSelectPiece = (piece: Piece) => {
        if (status !== 'playing' || turn !== myRole) return;
        if (selectedPieceId === piece.id) {
            setSelectedPieceId(null);
            setMatrix(null);
        } else {
            setSelectedPieceId(piece.id);
            setMatrix(piece.shape);
        }
    };

    const handleRotate = () => {
        if (!matrix) return;
        setMatrix(PolyominoEngine.rotate(matrix));
    };

    const handleFlip = () => {
        if (!matrix) return;
        setMatrix(PolyominoEngine.flip(matrix));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedPieceId) return;
            if (e.code === 'Space' || e.code === 'KeyR') handleRotate();
            if (e.code === 'KeyF') handleFlip();
            if (e.code === 'Escape') {
                setSelectedPieceId(null);
                setMatrix(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPieceId, matrix]);

    const handleBoardClick = (x: number, y: number) => {
        if (!room || !selectedPieceId || !matrix || isGameOver || turn !== myRole) return;
        const tempEngine = new PolyominoEngine();
        const currentBoard: PlayerColor[][] = [];
        for (let i = 0; i < BOARD_SIZE; i++) {
            currentBoard.push(board.slice(i * BOARD_SIZE, (i + 1) * BOARD_SIZE).map(c => c || 'P1' /* dummy, fixed below */) as PlayerColor[]);
        }
        // Correctly set board with null support if engine allows, or filter
        (tempEngine as any).state.board = Array.from({ length: BOARD_SIZE }, (_, r) =>
            board.slice(r * BOARD_SIZE, (r + 1) * BOARD_SIZE)
        );

        if (tempEngine.isValidMove(matrix, { x, y }, myRole)) {
            room.send("place", { pieceId: selectedPieceId, shape: matrix, position: { x, y } });
            setSelectedPieceId(null);
            setMatrix(null);
        }
    };

    const handlePass = () => {
        if (!room || turn !== myRole || isGameOver) return;
        room.send("pass");
        setSelectedPieceId(null);
        setMatrix(null);
    };

    const handleBackToTop = () => {
        window.location.reload();
    };

    if (error) return <div className={styles.main}>{error}</div>;
    if (!room) return <div className={styles.container}>読み込み中...</div>;

    if (status === 'waiting' && !isGameOver) {
        return (
            <main className={styles.container}>
                <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
                    <div className={gameStyles.spinner} style={{ marginBottom: '2rem' }}></div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#1e293b' }}>待機中...</h1>
                    <p style={{ fontSize: '1.1rem', color: '#64748b' }}>対戦相手を探しています</p>

                    {mode === 'room' && (
                        <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>友達にこのIDを伝えてください</p>
                            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1rem' }}>Room ID</p>
                            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#06b6d4', letterSpacing: '0.1em' }}>
                                {room.roomId}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        );
    }

    const opponentRole = myRole === 'P1' ? 'P2' : 'P1';

    return (
        <main className={styles.container}>
            <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 終了</button></div>

            <div className={gameStyles.game_layout_wrapper}>
                <div className={gameStyles.side_panel}>
                    <div className={`${gameStyles.hand_container} ${gameStyles['hand_' + opponentRole.toLowerCase()]}`} style={{ opacity: turn === opponentRole ? 1 : 0.5 }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{playersInfo[opponentRole]} (相手)</h3>
                        <p style={{ fontSize: '0.8rem', color: '#666' }}>相手の手番を待っています...</p>
                    </div>
                    <div className={gameStyles.chat_section}>
                        <Chat messages={messages} onSendMessage={(txt) => room.send("chat", { id: Date.now(), sender: playerName, text: txt, timestamp: Date.now() })} myName={playerName} />
                    </div>
                </div>

                <div className={gameStyles.center_panel}>
                    <div className={gameStyles.status_panel}>
                        <div className={gameStyles.current_turn} style={{ backgroundColor: turn === 'P1' ? '#ecfeff' : '#fdf4ff', color: turn === 'P1' ? '#0891b2' : '#c026d3' }}>
                            {turn === 'P1' ? '青' : '赤'}の手番 {turn === myRole && '(あなた)'}
                        </div>
                        {isGameOver && (
                            <div style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '4px' }}>
                                {winner === myRole ? '勝利！' : winner === 'Opponent Disconnected' ? '相手が退出しました' : winner === 'draw' ? '引き分け' : '敗北...'}
                            </div>
                        )}
                    </div>

                    <div className={gameStyles.board_container}>
                        <div className={gameStyles.board} onMouseLeave={() => setHoverPos(null)}>
                            {Array.from({ length: BOARD_SIZE }).map((_, r) => (
                                Array.from({ length: BOARD_SIZE }).map((_, c) => {
                                    const cellOwner = board[r * BOARD_SIZE + c];
                                    let className = gameStyles.cell;
                                    if (cellOwner === 'P1') className += ` ${gameStyles.cell_p1}`;
                                    if (cellOwner === 'P2') className += ` ${gameStyles.cell_p2}`;

                                    if (selectedPieceId && matrix && hoverPos) {
                                        const relativeR = r - hoverPos.y;
                                        const relativeC = c - hoverPos.x;
                                        if (relativeR >= 0 && relativeR < matrix.length && relativeC >= 0 && relativeC < matrix[0].length) {
                                            if (matrix[relativeR][relativeC] === 1) {
                                                const tempEngine = new PolyominoEngine();
                                                (tempEngine as any).state.board = Array.from({ length: BOARD_SIZE }, (_, rowIdx) =>
                                                    board.slice(rowIdx * BOARD_SIZE, (rowIdx + 1) * BOARD_SIZE)
                                                );
                                                const isValid = myRole ? tempEngine.isValidMove(matrix, hoverPos, myRole) : false;
                                                className += isValid ? ` ${gameStyles.cell_valid}` : ` ${gameStyles.cell_invalid}`;
                                            }
                                        }
                                    }

                                    let startAttr = undefined;
                                    if (r === 4 && c === 4) startAttr = 'P1';
                                    if (r === 9 && c === 9) startAttr = 'P2';

                                    return (
                                        <div
                                            key={`${r}-${c}`}
                                            className={className}
                                            data-start={startAttr}
                                            onMouseEnter={() => setHoverPos({ x: c, y: r })}
                                            onClick={() => handleBoardClick(c, r)}
                                        />
                                    );
                                })
                            ))}
                        </div>
                    </div>

                    <div className={gameStyles.controls_hint} style={{ visibility: selectedPieceId ? 'visible' : 'hidden' }}>
                        [Space] 回転 | [F] 反転
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'center' }}>
                            <button onClick={handleRotate} className={styles.secondaryBtn}>回転</button>
                            <button onClick={handleFlip} className={styles.secondaryBtn}>反転</button>
                        </div>
                    </div>

                    {turn === myRole && !isGameOver && (
                        <button onClick={handlePass} className={gameStyles.pass_btn}>パスする (置ける場所がない場合)</button>
                    )}
                </div>

                <div className={gameStyles.side_panel}>
                    <div className={`${gameStyles.hand_container} ${myRole ? gameStyles['hand_' + myRole.toLowerCase()] : ''}`} style={{ opacity: turn === myRole ? 1 : 0.5 }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{playerName} (あなた)</h3>
                        <div className={gameStyles.hand_grid}>
                            {hand.map(p => (
                                <div
                                    key={p.id}
                                    className={`${gameStyles.piece_wrapper} ${selectedPieceId === p.id ? gameStyles.piece_selected : ''}`}
                                    onClick={() => handleSelectPiece(p)}
                                >
                                    <div className={gameStyles.mini_grid} style={{ gridTemplateColumns: `repeat(${p.shape[0].length}, 8px)` }}>
                                        {p.shape.map((row, pr) => row.map((cell, pc) => (
                                            <div key={`${pr}-${pc}`} className={`${gameStyles.mini_cell} ${cell ? (myRole === 'P1' ? gameStyles.p1_color : gameStyles.p2_color) : ''}`} style={{ opacity: cell ? 1 : 0, width: '8px', height: '8px' }} />
                                        )))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {showDissolvedDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>部屋が解散されました</h2>
                        <p>相手が退出したか、接続が切れました。</p>
                        <button onClick={handleBackToTop} className={styles.primaryBtn}>戻る</button>
                    </div>
                </div>
            )}
        </main>
    );
}
