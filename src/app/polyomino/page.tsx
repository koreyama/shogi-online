'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/GameMenu.module.css'; // Use Shared Styles
import gameStyles from './Polyomino.module.css'; // Keep game-specific styles
import { PolyominoEngine } from './polyomino-engine';
import { GameState, Piece, PlayerColor, Point } from './polyomino-types';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue, update, get, onChildAdded, onDisconnect, off } from 'firebase/database';
import { IconBack, IconDice, IconKey, IconRobot, IconHourglass } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { Chat } from '@/components/Chat';

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

export default function PolyominoPage() {
    const router = useRouter();
    const { playerName: savedName, savePlayerName, isLoaded } = usePlayer();
    const [engine] = useState(() => new PolyominoEngine());
    const [gameState, setGameState] = useState<GameState>(engine.getState());

    // Online State
    const [roomId, setRoomId] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<'P1' | 'P2' | null>(null);
    const [status, setStatus] = useState<'setup' | 'initial' | 'waiting' | 'playing' | 'finished'>('setup');
    const [playerId, setPlayerId] = useState<string>('');
    const [joinMode, setJoinMode] = useState<'random' | 'room' | 'ai' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [opponentName, setOpponentName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Chat
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // Interaction State
    const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
    const [hoverPos, setHoverPos] = useState<Point | null>(null);
    const [matrix, setMatrix] = useState<number[][] | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showRules, setShowRules] = useState(false);

    // --- Init & Auth ---
    useEffect(() => {
        setPlayerId(Math.random().toString(36).substring(2, 15));
    }, []);

    useEffect(() => {
        if (isLoaded && savedName) {
            setPlayerName(savedName);
            setStatus('initial');
        }
    }, [isLoaded, savedName]);

    // --- Firebase Logic ---
    useEffect(() => {
        if (roomId === 'ai-match') {
            // Local AI
        } else if (roomId) {
            setMessages([]);
        }
    }, [roomId]);

    // Cleanup
    useEffect(() => {
        if (!roomId || !myRole || roomId === 'ai-match') return;

        const roomRef = ref(db, `polyomino_rooms/${roomId}`);
        const unsubscribeRoom = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            if (data.P1 && data.P2) {
                if (status !== 'playing' && status !== 'finished') {
                    setStatus('playing');
                }
                if (myRole === 'P1') setOpponentName(data.P2.name);
                if (myRole === 'P2') setOpponentName(data.P1.name);
            }
        });

        const movesRef = ref(db, `polyomino_rooms/${roomId}/moves`);
        const unsubscribeMoves = onChildAdded(movesRef, (snapshot) => {
            const moveData = snapshot.val();
            if (!moveData) return;
            const success = engine.placePiece(moveData.pieceId, moveData.shape, moveData.position);
            if (success) {
                setGameState({ ...engine.getState() });
            }
        });

        const chatRef = ref(db, `polyomino_rooms/${roomId}/chat`);
        const unsubscribeChat = onChildAdded(chatRef, (snapshot) => {
            const msg = snapshot.val();
            if (msg) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        });

        const myPlayerRef = ref(db, `polyomino_rooms/${roomId}/${myRole}`);
        onDisconnect(myPlayerRef).remove();

        return () => {
            unsubscribeRoom();
            unsubscribeMoves();
            off(movesRef);
            off(chatRef);
            off(roomRef);
            onDisconnect(myPlayerRef).cancel();
        };
    }, [roomId, myRole, engine]);

    // --- Matchmaking ---
    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerName.trim()) {
            savePlayerName(playerName.trim());
            setStatus('initial');
        }
    };

    const joinRandomGame = async () => {
        setIsLoading(true);
        try {
            const roomsRef = ref(db, 'polyomino_rooms');
            const snapshot = await get(roomsRef);
            const rooms = snapshot.val();
            let foundRoomId = null;

            if (rooms) {
                for (const [id, room] of Object.entries(rooms) as [string, any][]) {
                    if (!room.P1 && !room.P2) {
                        set(ref(db, `polyomino_rooms/${id}`), null);
                        continue;
                    }
                    if ((room.P1 && !room.P2) || (!room.P1 && room.P2)) {
                        foundRoomId = id;
                        break;
                    }
                }
            }

            if (foundRoomId) {
                const room = rooms[foundRoomId];
                if (!room.P2) {
                    await update(ref(db, `polyomino_rooms/${foundRoomId}/P2`), { name: playerName, id: playerId });
                    setRoomId(foundRoomId);
                    setMyRole('P2');
                } else {
                    await update(ref(db, `polyomino_rooms/${foundRoomId}/P1`), { name: playerName, id: playerId });
                    setRoomId(foundRoomId);
                    setMyRole('P1');
                }
            } else {
                const newRoomRef = push(roomsRef);
                const newRoomId = newRoomRef.key!;
                const isP1 = Math.random() < 0.5;
                if (isP1) {
                    await set(newRoomRef, { P1: { name: playerName, id: playerId }, P2: null });
                    setMyRole('P1');
                } else {
                    await set(newRoomRef, { P1: null, P2: { name: playerName, id: playerId } });
                    setMyRole('P2');
                }
                setRoomId(newRoomId);
                setStatus('waiting');
            }
        } catch (error) {
            console.error(error);
            alert("エラーが発生しました。");
        } finally {
            setIsLoading(false);
        }
    };

    const joinRoomGame = async () => {
        if (!customRoomId.trim()) return;
        setIsLoading(true);
        try {
            const rid = customRoomId.trim();
            const roomRef = ref(db, `polyomino_rooms/${rid}`);
            const snapshot = await get(roomRef);
            const room = snapshot.val();

            if (!room) {
                const isP1 = Math.random() < 0.5;
                if (isP1) {
                    await set(roomRef, { P1: { name: playerName, id: playerId }, P2: null });
                    setMyRole('P1');
                } else {
                    await set(roomRef, { P1: null, P2: { name: playerName, id: playerId } });
                    setMyRole('P2');
                }
                setRoomId(rid);
                setStatus('waiting');
            } else if (!room.P2) {
                await update(ref(db, `polyomino_rooms/${rid}/P2`), { name: playerName, id: playerId });
                setRoomId(rid);
                setMyRole('P2');
            } else if (!room.P1) {
                await update(ref(db, `polyomino_rooms/${rid}/P1`), { name: playerName, id: playerId });
                setRoomId(rid);
                setMyRole('P1');
            } else {
                alert('満員です');
            }
        } catch (error) {
            console.error(error);
            alert("エラーが発生しました。");
        } finally {
            setIsLoading(false);
        }
    };

    const startLocalGame = () => {
        setMyRole('P1');
        setOpponentName('CPU');
        setRoomId('ai-match');
        setStatus('playing');
    };


    // --- AI Logic (Local Only) ---
    useEffect(() => {
        if (roomId !== 'ai-match' || gameState.isGameOver || gameState.currentPlayer !== 'P2') return;

        const timer = setTimeout(() => {
            const move = engine.calculateBestMove('P2');
            if (move) {
                engine.placePiece(move.pieceId, move.shape, move.position);
                setGameState({ ...engine.getState() });
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [gameState, roomId]);

    // --- Interaction ---
    const handleSelectPiece = (piece: Piece) => {
        if (gameState.isGameOver) return;
        if (roomId !== 'ai-match' && gameState.currentPlayer !== myRole) return;

        const playerHand = gameState.currentPlayer === 'P1' ? gameState.hands.P1 : gameState.hands.P2;
        if (!playerHand.find(p => p.id === piece.id)) {
            return;
        }

        if (selectedPieceId === piece.id) {
            setSelectedPieceId(null);
            setMatrix(null);
        } else {
            setSelectedPieceId(piece.id);
            setMatrix(piece.shape);
        }
    };

    const handleRotate = (e: KeyboardEvent | React.MouseEvent) => {
        if (!selectedPieceId || !matrix) return;
        e.preventDefault();
        const rotated = PolyominoEngine.rotate(matrix);
        setMatrix(rotated);
    };

    const handleFlip = (e: KeyboardEvent | React.MouseEvent) => {
        if (!selectedPieceId || !matrix) return;
        e.preventDefault();
        const flipped = PolyominoEngine.flip(matrix);
        setMatrix(flipped);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedPieceId) return;
            if (e.code === 'Space' || e.code === 'KeyR') handleRotate(e);
            if (e.code === 'KeyF') handleFlip(e);
            if (e.code === 'Escape') {
                setSelectedPieceId(null);
                setMatrix(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPieceId, matrix]);

    const handleBoardClick = (x: number, y: number) => {
        if (!selectedPieceId || !matrix || gameState.isGameOver) return;
        if (roomId !== 'ai-match' && gameState.currentPlayer !== myRole) return;

        const isValid = engine.isValidMove(matrix, { x, y }, gameState.currentPlayer);
        if (!isValid) return;

        if (roomId === 'ai-match') {
            const success = engine.placePiece(selectedPieceId, matrix, { x, y });
            if (success) {
                setGameState({ ...engine.getState() });
                setSelectedPieceId(null);
                setMatrix(null);
            }
        } else if (roomId) {
            push(ref(db, `polyomino_rooms/${roomId}/moves`), {
                pieceId: selectedPieceId,
                shape: matrix,
                position: { x, y },
                player: myRole
            });
            setSelectedPieceId(null);
            setMatrix(null);
        }
    };

    const handleSendMessage = (text: string) => {
        if (roomId === 'ai-match') {
            setMessages(prev => [...prev, { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() }]);
        } else if (roomId) {
            push(ref(db, `polyomino_rooms/${roomId}/chat`), { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() });
        }
    };

    const toggleRules = () => setShowRules(!showRules);

    const handleBackToTop = () => {
        // Reset online state if needed
        router.push('/');
    };


    // --- Render ---

    if (status === 'setup') {
        return (
            <main className={styles.main}>
                <div className={styles.setupContainer}>
                    <h1 className={styles.title}>BLOCK TERRITORY</h1>
                    <form onSubmit={handleNameSubmit} className={styles.setupForm}>
                        <input
                            type="text"
                            value={playerName}
                            onChange={e => setPlayerName(e.target.value)}
                            placeholder="プレイヤー名"
                            className={styles.input}
                            required
                        />
                        <button type="submit" className={styles.primaryBtn}>次へ</button>
                    </form>
                </div>
            </main>
        );
    }

    if (status === 'initial') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={styles.gameContainer}>
                    <h1 className={styles.title}>BLOCK TERRITORY</h1>
                    {!joinMode ? (
                        <div className={styles.modeSelection}>
                            <button onClick={joinRandomGame} className={styles.modeBtn}>
                                <IconDice size={48} color="#2e7d32" /><span className={styles.modeBtnTitle}>ランダム</span>
                            </button>
                            <button onClick={() => setJoinMode('room')} className={styles.modeBtn}>
                                <IconKey size={48} color="#2e7d32" /><span className={styles.modeBtnTitle}>ルーム</span>
                            </button>
                            <button onClick={startLocalGame} className={styles.modeBtn}>
                                <IconRobot size={48} color="#2e7d32" /><span className={styles.modeBtnTitle}>CPU対戦</span>
                            </button>
                        </div>
                    ) : joinMode === 'random' ? (
                        <div className={styles.joinSection}>
                            <p>マッチング中...</p>
                            <div className={styles.waitingAnimation}><IconHourglass size={64} color="#2e7d32" /></div>
                            <button onClick={() => setJoinMode(null)} className={styles.secondaryBtn} style={{ marginTop: '1rem' }}>キャンセル</button>
                        </div>
                    ) : (
                        <div className={styles.joinSection}>
                            <input
                                type="text"
                                value={customRoomId}
                                onChange={e => setCustomRoomId(e.target.value)}
                                placeholder="ルームIDを入力"
                                className={styles.input}
                            />
                            <button onClick={joinRoomGame} className={styles.primaryBtn} style={{ position: 'static' }}>参加 / 作成</button>
                            <button onClick={() => setJoinMode(null)} className={styles.secondaryBtn}>戻る</button>
                        </div>
                    )}
                </div>

                <div className={styles.contentSection}>
                    <h2 className={styles.contentTitle}>ルールと遊び方</h2>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>♟️</span>
                            <h3 className={styles.sectionTitle}>ゲームの目的</h3>
                        </div>
                        <p className={styles.textBlock}>
                            ブロックテリトリーは、手持ちのピースを盤面に配置し、より多くのマス目を埋めたプレイヤーが勝利する陣取りゲームです。<br />
                            すべてのピースを使い切るか、置ける場所がなくなるとゲーム終了です。
                        </p>
                    </div>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>📜</span>
                            <h3 className={styles.sectionTitle}>配置ルール</h3>
                        </div>
                        <div className={styles.cardGrid}>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>1. スタート位置</span>
                                <p className={styles.cardText}>最初のピースは、自分の色のマーク（角のマス）を埋めるように配置しなければなりません。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>2. 角をつなぐ</span>
                                <p className={styles.cardText}>2手目以降は、すでに置かれた自分のピースの「角（かど）」と新しいピースの「角」が接するように置きます。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>3. 辺は禁止</span>
                                <p className={styles.cardText}>自分のピースの「辺」同士が接してはいけません。相手のピースとは辺で接しても構いません。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>4. パス</span>
                                <p className={styles.cardText}>置けるピースがない場合はパスとなります。両者がパスするとゲーム終了です。</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>💡</span>
                            <h3 className={styles.sectionTitle}>勝利のコツ</h3>
                        </div>
                        <ul className={styles.list}>
                            <li className={styles.listItem}><strong>中央を目指せ:</strong> 序盤は盤面の中央に向かって伸ばすことで、展開の選択肢を増やしましょう。</li>
                            <li className={styles.listItem}><strong>相手をブロック:</strong> 相手の進行方向を塞ぐように置くことで、相手のエリア拡大を阻止できます。</li>
                            <li className={styles.listItem}><strong>大きなピースから:</strong> 置きにくい大きな形（5マスなど）は、スペースがある序盤のうちに使ってしまいましょう。</li>
                            <li className={styles.listItem}><strong>小さなピースは温存:</strong> 終盤の狭い隙間に入り込むために、1〜3マスのピースは残しておくと有利です。</li>
                        </ul>
                    </div>
                </div>
            </main>
        );
    }

    if (status === 'waiting') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={styles.gameContainer}>
                    <h1>待機中...</h1>
                    <div className={styles.waitingAnimation}><IconHourglass size={64} color="#2e7d32" /></div>
                    <p>ルームID: <span className={styles.roomId}>{roomId}</span></p>
                </div>
            </main>
        );
    }

    // PLAYING STATUS
    return (
        <main className={styles.main}>
            <div className={styles.header}><button onClick={() => window.location.reload()} className={styles.backButton}><IconBack size={18} /> 終了</button></div>

            <div className={gameStyles.game_layout} style={{ justifyContent: 'center', marginTop: '1rem' }}>
                {/* Left Panel: Hands P1 & P2 (Reorganized) OR Standard Left Panel? 
                    Reversi uses Left Panel for Chat/Players, Center for Board.
                    Block Territory uses Hands on sides. 
                    Let's adapt: Center = Board, Sides = Hands?
                    Or adhere to Reversi layout: Left = Chat/Info, Center = Game.
                    But Hands need to be visible.
                    Let's put Hands IN the Center Panel above/below board?
                    OR keep the `gameStyles` layout but wrapped in `main`.
                */}

                {/* Keep original game layout logic but wrapped */}
                <div className={gameStyles.game_layout}>
                    {/* P1 Hand */}
                    <HandView
                        player="P1"
                        pieces={gameState.hands.P1}
                        isActive={gameState.currentPlayer === 'P1' && (roomId === 'ai-match' || myRole === 'P1')}
                        selectedId={selectedPieceId}
                        onSelect={handleSelectPiece}
                    />

                    {/* Center Board & Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className={gameStyles.status_panel} style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
                                <div className={`${gameStyles.current_turn} ${gameStyles.text_p1}`} style={{ opacity: gameState.currentPlayer === 'P1' ? 1 : 0.5 }}>
                                    P1: {gameState.projectedScore.P1}
                                </div>
                                <div className={`${gameStyles.current_turn} ${gameStyles.text_p2}`} style={{ opacity: gameState.currentPlayer === 'P2' ? 1 : 0.5 }}>
                                    P2: {gameState.projectedScore.P2}
                                </div>
                            </div>
                            {gameState.isGameOver && <div style={{ color: 'red', fontWeight: 'bold' }}>GAME OVER</div>}
                        </div>

                        <div
                            className={gameStyles.board}
                            onMouseLeave={() => setHoverPos(null)}
                        >
                            {gameState.board.map((row, r) => (
                                row.map((cellOwner, c) => {
                                    let className = gameStyles.cell;
                                    if (cellOwner === 'P1') className += ` ${gameStyles.cell_p1}`;
                                    if (cellOwner === 'P2') className += ` ${gameStyles.cell_p2}`;

                                    let startAttr = undefined;
                                    if (r === 4 && c === 4) startAttr = 'P1';
                                    if (r === 9 && c === 9) startAttr = 'P2';

                                    if (selectedPieceId && matrix && hoverPos) {
                                        const relativeR = r - hoverPos.y;
                                        const relativeC = c - hoverPos.x;
                                        if (relativeR >= 0 && relativeR < matrix.length &&
                                            relativeC >= 0 && relativeC < matrix[0].length) {
                                            if (matrix[relativeR][relativeC] === 1) {
                                                const isValid = engine.isValidMove(matrix, hoverPos, gameState.currentPlayer);
                                                className += isValid ? ` ${gameStyles.cell_valid}` : ` ${gameStyles.cell_invalid}`;
                                            }
                                        }
                                    }

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

                        <div className={gameStyles.controls_hint} style={{ visibility: selectedPieceId ? 'visible' : 'hidden', marginTop: '1rem' }}>
                            [SPACE] Rotate | [F] Flip
                        </div>
                    </div>

                    {/* P2 Hand */}
                    <HandView
                        player="P2"
                        pieces={gameState.hands.P2}
                        isActive={gameState.currentPlayer === 'P2' && (roomId === 'ai-match' || myRole === 'P2')}
                        selectedId={selectedPieceId}
                        onSelect={handleSelectPiece}
                    />
                </div>

                {/* Chat Panel - Floating or below? */}
                {/* Reversi has a Left Panel for chat. We are using full width for game. 
                     Let's put Chat below game for mobile/desktop commonality in this layout 
                     OR stick to Reversi's 2-column if possible.
                     But 2 hands + board is wide.
                     Let's put Chat in a togglable sidebar or bottom block.
                     For now, bottom block logic is safest.
                 */}
                <div style={{ marginTop: '2rem', width: '100%', maxWidth: '500px' }}>
                    <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                </div>
            </div>
        </main>
    );
}

// Sub-component: Hand View
const HandView = ({ player, pieces, isActive, selectedId, onSelect }: {
    player: PlayerColor,
    pieces: Piece[],
    isActive: boolean,
    selectedId: string | null,
    onSelect: (p: Piece) => void
}) => {
    return (
        <div className={`${gameStyles.hand_container} ${player === 'P1' ? gameStyles.hand_p1 : gameStyles.hand_p2}`} style={{ opacity: isActive ? 1 : 0.5 }}>
            <h3 style={{ marginBottom: '10px', fontSize: '0.9rem' }}>{player === 'P1' ? 'Player 1' : 'Player 2'}</h3>
            <div className={gameStyles.hand_grid}>
                {pieces.map(p => (
                    <div
                        key={p.id}
                        className={`${gameStyles.piece_wrapper} ${selectedId === p.id ? gameStyles.piece_selected : ''}`}
                        onClick={() => isActive && onSelect(p)}
                    >
                        <MiniPiece shape={p.shape} color={player} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Sub-component: Mini Piece Renderer
const MiniPiece = ({ shape, color }: { shape: number[][], color: PlayerColor }) => {
    const rows = shape.length;
    const cols = shape[0].length;

    return (
        <div
            className={gameStyles.mini_grid}
            style={{
                gridTemplateColumns: `repeat(${cols}, 10px)`,
                gridTemplateRows: `repeat(${rows}, 10px)`
            }}
        >
            {shape.map((row, r) => (
                row.map((cell, c) => (
                    <div
                        key={`${r}-${c}`}
                        className={`${gameStyles.mini_cell} ${cell ? (color === 'P1' ? gameStyles.p1_color : gameStyles.p2_color) : ''}`}
                        style={{ opacity: cell ? 1 : 0 }}
                    />
                ))
            ))}
        </div>
    );
};
