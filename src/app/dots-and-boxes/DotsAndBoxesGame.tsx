'use client';

import React, { useState, useEffect } from 'react';
import styles from './DotsAndBoxes.module.css';

type Player = 1 | 2;
const ROWS = 5;
const COLS = 5;

// Box grid is (ROWS-1) x (COLS-1)
// Horizontal lines: ROWS x (COLS-1)
// Vertical lines: (ROWS-1) x COLS

interface GameState {
    hLines: boolean[][]; // [row][col] - row: 0..4, col: 0..3
    vLines: boolean[][]; // [row][col] - row: 0..3, col: 0..4
    boxes: (Player | null)[][]; // [row][col] - row: 0..3, col: 0..3
    currentPlayer: Player;
    scores: { 1: number; 2: number };
    winner: Player | 0 | null; // 0 for draw
    lastCompletedBoxes: { row: number, col: number }[]; // For animation/highlight
}

export default function DotsAndBoxesGame() {
    const [gameState, setGameState] = useState<GameState | null>(null);

    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = () => {
        const hLines = Array(ROWS).fill(null).map(() => Array(COLS - 1).fill(false));
        const vLines = Array(ROWS - 1).fill(null).map(() => Array(COLS).fill(false));
        const boxes = Array(ROWS - 1).fill(null).map(() => Array(COLS - 1).fill(null));

        setGameState({
            hLines,
            vLines,
            boxes,
            currentPlayer: 1,
            scores: { 1: 0, 2: 0 },
            winner: null,
            lastCompletedBoxes: []
        });
    };

    const checkCompletedBoxes = (
        hLines: boolean[][],
        vLines: boolean[][],
        currentBoxes: (Player | null)[][],
        player: Player
    ): { newBoxes: (Player | null)[][], points: number, completedIndices: { row: number, col: number }[] } => {
        let points = 0;
        const newBoxes = currentBoxes.map(row => [...row]);
        const completedIndices: { row: number, col: number }[] = [];

        for (let r = 0; r < ROWS - 1; r++) {
            for (let c = 0; c < COLS - 1; c++) {
                if (newBoxes[r][c] === null) {
                    // Check if all 4 sides are filled
                    const top = hLines[r][c];
                    const bottom = hLines[r + 1][c];
                    const left = vLines[r][c];
                    const right = vLines[r][c + 1];

                    if (top && bottom && left && right) {
                        newBoxes[r][c] = player;
                        points++;
                        completedIndices.push({ row: r, col: c });
                    }
                }
            }
        }
        return { newBoxes, points, completedIndices };
    };

    const handleLineClick = (type: 'h' | 'v', r: number, c: number) => {
        if (!gameState || gameState.winner !== null) return;

        if (type === 'h') {
            if (gameState.hLines[r][c]) return; // Already taken
        } else {
            if (gameState.vLines[r][c]) return; // Already taken
        }

        const newHLines = gameState.hLines.map(row => [...row]);
        const newVLines = gameState.vLines.map(row => [...row]);

        if (type === 'h') {
            newHLines[r][c] = true;
        } else {
            newVLines[r][c] = true;
        }

        const { newBoxes, points, completedIndices } = checkCompletedBoxes(newHLines, newVLines, gameState.boxes, gameState.currentPlayer);

        const newScores = { ...gameState.scores };
        let nextPlayer = gameState.currentPlayer;

        if (points > 0) {
            newScores[gameState.currentPlayer] += points;
            // Keep turn if scored
        } else {
            nextPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        }

        // Check Win
        const totalBoxes = (ROWS - 1) * (COLS - 1);
        const totalScore = newScores[1] + newScores[2];

        let winner: Player | null | 0 = null;
        if (totalScore === totalBoxes) {
            if (newScores[1] > newScores[2]) winner = 1;
            else if (newScores[2] > newScores[1]) winner = 2;
            else winner = 0; // Draw
        }

        setGameState({
            hLines: newHLines,
            vLines: newVLines,
            boxes: newBoxes,
            currentPlayer: nextPlayer,
            scores: newScores,
            winner: winner,
            lastCompletedBoxes: completedIndices.length > 0 ? completedIndices : []
        });
    };

    if (!gameState) return <div>Loading...</div>;

    const DOT_SPACING = 60;
    const DOT_RADIUS = 8; // Slightly larger for better visual
    const PADDING = 20;

    const isGameOver = gameState.winner !== null;

    return (
        <div className={styles.container}>
            {/* Score Board */}
            <div className={styles.score_board}>
                <div className={`${styles.player_card} ${gameState.currentPlayer === 1 && !isGameOver ? styles.player_card_active + ' ' + styles.p1_active : ''}`}>
                    {gameState.currentPlayer === 1 && !isGameOver && <div className={`${styles.turn_indicator} ${styles.p1_turn}`}>YOUR TURN</div>}
                    <span className={`${styles.player_name} ${styles.p1_name}`}>プレイヤー 1</span>
                    <span className={styles.player_score}>{gameState.scores[1]}</span>
                </div>
                <div className={`${styles.player_card} ${gameState.currentPlayer === 2 && !isGameOver ? styles.player_card_active + ' ' + styles.p2_active : ''}`}>
                    {gameState.currentPlayer === 2 && !isGameOver && <div className={`${styles.turn_indicator} ${styles.p2_turn}`}>YOUR TURN</div>}
                    <span className={`${styles.player_name} ${styles.p2_name}`}>プレイヤー 2</span>
                    <span className={styles.player_score}>{gameState.scores[2]}</span>
                </div>
            </div>

            {isGameOver && (
                <div className={styles.game_over}>
                    <h2 className={styles.winner_text}>
                        {gameState.winner === 0
                            ? "引き分け！"
                            : `プレイヤー ${gameState.winner} の勝利！`
                        }
                    </h2>
                    <button
                        onClick={startNewGame}
                        className={styles.play_again_btn}
                    >
                        もう一度遊ぶ
                    </button>
                </div>
            )}

            {/* Game Board (SVG) */}
            <div className={styles.board_wrapper}>
                <svg
                    width={(COLS - 1) * DOT_SPACING + PADDING * 2}
                    height={(ROWS - 1) * DOT_SPACING + PADDING * 2}
                    style={{ display: 'block' }}
                >
                    <g transform={`translate(${PADDING}, ${PADDING})`}>

                        {/* Boxes (Fill) */}
                        {gameState.boxes.map((row, r) =>
                            row.map((owner, c) => {
                                if (owner === null) return null;
                                return (
                                    <rect
                                        key={`box-${r}-${c}`}
                                        x={c * DOT_SPACING}
                                        y={r * DOT_SPACING}
                                        width={DOT_SPACING}
                                        height={DOT_SPACING}
                                        className={owner === 1 ? styles.box_p1 : styles.box_p2}
                                    />
                                );
                            })
                        )}

                        {/* Horizontal Lines */}
                        {gameState.hLines.map((row, r) =>
                            row.map((isActive, c) => {
                                const isLastCompleted = isActive && gameState.lastCompletedBoxes.some(b => b.row === r && b.col === c);
                                return (
                                    <rect
                                        key={`h-${r}-${c}`}
                                        x={c * DOT_SPACING}
                                        y={r * DOT_SPACING - 6}
                                        width={DOT_SPACING}
                                        height={12}
                                        rx={4}
                                        className={`
                                            ${styles.line}
                                            ${isActive ? styles.line_active : (isGameOver ? '' : styles.line_inactive)}
                                            ${isLastCompleted ? styles.line_last_completed : ''}
                                        `}
                                        fill={isActive ? undefined : 'transparent'}
                                        onClick={() => handleLineClick('h', r, c)}
                                    />
                                );
                            })
                        )}

                        {/* Vertical Lines */}
                        {gameState.vLines.map((row, r) =>
                            row.map((isActive, c) => (
                                <rect
                                    key={`v-${r}-${c}`}
                                    x={c * DOT_SPACING - 6}
                                    y={r * DOT_SPACING}
                                    width={12}
                                    height={DOT_SPACING}
                                    rx={4}
                                    className={`
                                        ${styles.line}
                                        ${isActive ? styles.line_active : (isGameOver ? '' : styles.line_inactive)}
                                    `}
                                    fill={isActive ? undefined : 'transparent'}
                                    onClick={() => handleLineClick('v', r, c)}
                                />
                            ))
                        )}

                        {/* Dots */}
                        {Array(ROWS).fill(0).map((_, r) =>
                            Array(COLS).fill(0).map((_, c) => (
                                <circle
                                    key={`dot-${r}-${c}`}
                                    cx={c * DOT_SPACING}
                                    cy={r * DOT_SPACING}
                                    r={DOT_RADIUS}
                                    className={styles.dot}
                                />
                            ))
                        )}

                    </g>
                </svg>
            </div>

            <div className={styles.instructions}>
                <p>点と点の間をクリックして線を引きます。</p>
                <p>四角形を完成させると<span className={styles.point_highlight}>1ポイント</span>獲得し、<span className={styles.extra_turn_highlight}>もう一度行動</span>できます。</p>
            </div>
        </div>
    );
}
