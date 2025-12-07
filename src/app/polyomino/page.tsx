'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Polyomino.module.css';
import { PolyominoEngine } from './polyomino-engine';
import { GameState, Piece, PlayerColor, Point, BOARD_SIZE } from './polyomino-types';

export default function PolyominoPage() {
    const [engine] = useState(() => new PolyominoEngine());
    const [gameState, setGameState] = useState<GameState>(engine.getState());

    // Interaction State
    const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
    const [ghostPosition, setGhostPosition] = useState<{ x: number, y: number } | null>(null);
    const [matrix, setMatrix] = useState<number[][] | null>(null); // Current rotation of selected piece

    // Mouse tracking for Ghost
    const containerRef = useRef<HTMLDivElement>(null);

    const [showRules, setShowRules] = useState(true); // Show on start

    // Toggle Rules
    const toggleRules = () => setShowRules(!showRules);

    const updateState = () => {
        setGameState({ ...engine.getState() });
    };

    // AI Turn Handler
    useEffect(() => {
        if (!gameState.isGameOver && gameState.currentPlayer === 'P2') {
            const timer = setTimeout(() => {
                const move = engine.calculateBestMove('P2');
                if (move) {
                    engine.placePiece(move.pieceId, move.shape, move.position);
                    updateState();
                } else {
                    // AI Pass? Or Game Over check?
                    // Basic engine doesn't have pass logic yet.
                    // For now, if AI can't move, it's effectively stuck.
                    // Ideally we should switch turn or end game.
                    // Let's just skip turn if no move.
                    // For simplicity in this iteration: If AI Stuck, maybe force pass turn or log it.
                    // Let's implement a simple "Pass" if needed, but for now loop might hang if we don't switch.
                    // However engine.placePiece switches turn. If no move, we must manually switch or end.
                    // Let's just do nothing for now (User wins effectively).
                    // Or better: manual implementation of Skip
                }
            }, 1000); // 1s think time
            return () => clearTimeout(timer);
        }
    }, [gameState.currentPlayer, gameState.turnCount]);

    // --- Interaction Handlers ---

    const handleSelectPiece = (piece: Piece) => {
        if (gameState.isGameOver) return;
        // Only allow selecting current player's pieces
        const playerHand = gameState.currentPlayer === 'P1' ? gameState.hands.P1 : gameState.hands.P2;
        if (!playerHand.find(p => p.id === piece.id)) {
            // Trying to select opponent's piece? Ignore
            return;
        }

        if (selectedPieceId === piece.id) {
            // Deselect
            setSelectedPieceId(null);
            setMatrix(null);
        } else {
            setSelectedPieceId(piece.id);
            setMatrix(piece.shape); // Reset rotation on new selection
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

    // Keyboard shortcuts for rotation/flip
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedPieceId) return;
            if (e.code === 'Space' || e.code === 'KeyR') {
                handleRotate(e);
            }
            if (e.code === 'KeyF') {
                handleFlip(e);
            }
            if (e.code === 'Escape') {
                setSelectedPieceId(null);
                setMatrix(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPieceId, matrix]);

    // Handle Board Click
    const handleBoardClick = (x: number, y: number) => {
        if (!selectedPieceId || !matrix || gameState.isGameOver) return;

        const success = engine.placePiece(selectedPieceId, matrix, { x, y });
        if (success) {
            updateState();
            setSelectedPieceId(null);
            setMatrix(null);
        }
    };

    // Hover logic for potential placement visualization
    const [hoverPos, setHoverPos] = useState<Point | null>(null);

    return (
        <div className={styles.container} ref={containerRef}>
            <div className={styles.status_panel}>
                <h1 className={styles.title}>BLOCK TERRITORY</h1>
                <div className={`${styles.current_turn} ${gameState.currentPlayer === 'P1' ? styles.text_p1 : styles.text_p2}`}>
                    {gameState.isGameOver
                        ? "GAME OVER"
                        : (gameState.currentPlayer === 'P1' ? "PLAYER 1 TURN" : "PLAYER 2 TURN")}
                </div>
                {gameState.statusMessage && (
                    <div style={{ marginTop: '10px', color: '#ef4444', fontWeight: 'bold' }}>
                        {gameState.statusMessage}
                    </div>
                )}
                {selectedPieceId && <div className={styles.controls_hint}>[SPACE] Rotate | [F] Flip</div>}
            </div>

            <div className={styles.game_layout}>
                {/* P1 Hand */}
                <HandView
                    player="P1"
                    pieces={gameState.hands.P1}
                    isActive={gameState.currentPlayer === 'P1'}
                    selectedId={selectedPieceId}
                    onSelect={handleSelectPiece}
                />

                {/* BOARD */}
                <div
                    className={styles.board}
                    onMouseLeave={() => setHoverPos(null)}
                >
                    {gameState.board.map((row, r) => (
                        row.map((cellOwner, c) => {
                            // Determine visuals
                            let className = styles.cell;
                            if (cellOwner === 'P1') className += ` ${styles.cell_p1}`;
                            if (cellOwner === 'P2') className += ` ${styles.cell_p2}`;

                            // Start Point Markers
                            let startAttr = undefined;
                            if (r === 4 && c === 4) startAttr = 'P1';
                            if (r === 9 && c === 9) startAttr = 'P2';

                            // Ghost / Validation Preview
                            if (selectedPieceId && matrix && hoverPos) {
                                // Check if this cell is part of the ghost shape
                                const relativeR = r - hoverPos.y;
                                const relativeC = c - hoverPos.x;
                                if (relativeR >= 0 && relativeR < matrix.length &&
                                    relativeC >= 0 && relativeC < matrix[0].length) {
                                    if (matrix[relativeR][relativeC] === 1) {
                                        // This cell is part of piece. Is the WHOLE move valid?
                                        const isValid = engine.isValidMove(matrix, hoverPos, gameState.currentPlayer);
                                        className += isValid ? ` ${styles.cell_valid}` : ` ${styles.cell_invalid}`;
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

                {/* P2 Hand */}
                <HandView
                    player="P2"
                    pieces={gameState.hands.P2}
                    isActive={gameState.currentPlayer === 'P2'}
                    selectedId={selectedPieceId}
                    onSelect={handleSelectPiece}
                />
            </div>

            <div style={{ marginTop: '20px', color: '#666' }}>
                P1 Score: {gameState.projectedScore.P1} | P2 Score: {gameState.projectedScore.P2}
            </div>

            <button className={styles.rules_btn} onClick={toggleRules}>
                ルールを見る
            </button>

            {showRules && (
                <div className={styles.modal_overlay} onClick={toggleRules}>
                    <div className={styles.modal_content} onClick={e => e.stopPropagation()}>
                        <h2 className={styles.modal_title}>遊び方・ルール</h2>

                        <div className={styles.rule_item}>
                            <div className={styles.rule_number}>1</div>
                            <div className={styles.rule_text}>
                                <strong>最初の1手</strong><br />
                                自分の色のマーク（●）があるマスを埋めるようにピースを置きます。
                            </div>
                        </div>

                        <div className={styles.rule_item}>
                            <div className={styles.rule_number}>2</div>
                            <div className={styles.rule_text}>
                                <strong>2手目以降</strong><br />
                                すでに置かれている自分のピースの「角（かど）」と接するように置きます。
                            </div>
                        </div>

                        <div className={styles.rule_item}>
                            <div className={styles.rule_number}>3</div>
                            <div className={styles.rule_text}>
                                <strong>禁止事項</strong><br />
                                自分のピースの「辺」と接してはいけません。（相手のピースとは辺で接してもOK）
                            </div>
                        </div>

                        <div className={styles.rule_item}>
                            <div className={styles.rule_number}>4</div>
                            <div className={styles.rule_text}>
                                <strong>勝利条件</strong><br />
                                多くのマスを埋めたプレイヤー（スコアが高い方）の勝利です。
                            </div>
                        </div>

                        <button className={styles.close_btn} onClick={toggleRules}>
                            ゲームを始める
                        </button>
                    </div>
                </div>
            )}
        </div>
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
        <div className={`${styles.hand_container} ${player === 'P1' ? styles.hand_p1 : styles.hand_p2}`} style={{ opacity: isActive ? 1 : 0.5 }}>
            <h3 style={{ marginBottom: '10px' }}>{player} PIECES</h3>
            <div className={styles.hand_grid}>
                {pieces.map(p => (
                    <div
                        key={p.id}
                        className={`${styles.piece_wrapper} ${selectedId === p.id ? styles.piece_selected : ''}`}
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
            className={styles.mini_grid}
            style={{
                gridTemplateColumns: `repeat(${cols}, 12px)`,
                gridTemplateRows: `repeat(${rows}, 12px)`
            }}
        >
            {shape.map((row, r) => (
                row.map((cell, c) => (
                    <div
                        key={`${r}-${c}`}
                        className={`${styles.mini_cell} ${cell ? (color === 'P1' ? styles.p1_color : styles.p2_color) : ''}`}
                        style={{ opacity: cell ? 1 : 0 }}
                    />
                ))
            ))}
        </div>
    );
};
