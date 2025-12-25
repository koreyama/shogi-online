'use client';

import React, { useState, useEffect } from 'react';
import styles from './DotsAndBoxes.module.css';
import { IconRobot, IconUser, IconBack } from '@/components/Icons';

type Player = 1 | 2;
const ROWS = 6;
const COLS = 6;

interface GameState {
    hLines: number[][];
    vLines: number[][];
    boxes: (Player | null)[][];
    currentPlayer: Player;
    scores: { 1: number; 2: number };
    winner: Player | 0 | null;
    lastCompletedBoxes: { row: number, col: number }[];
}

interface DotsAndBoxesGameProps {
    onBack: () => void;
}

export default function DotsAndBoxesGame({ onBack }: DotsAndBoxesGameProps) {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isCpuMode, setIsCpuMode] = useState(true);
    const [isCpuThinking, setIsCpuThinking] = useState(false);

    useEffect(() => {
        startNewGame();
    }, []);

    // CPU Turn Effect
    useEffect(() => {
        if (!gameState || gameState.winner !== null || !isCpuMode || gameState.currentPlayer !== 2) {
            return;
        }

        const timer = setTimeout(() => {
            makeCpuMove();
        }, 600);

        return () => clearTimeout(timer);
    }, [gameState, isCpuMode]);

    const startNewGame = () => {
        const hLines = Array(ROWS).fill(null).map(() => Array(COLS - 1).fill(0));
        const vLines = Array(ROWS - 1).fill(null).map(() => Array(COLS).fill(0));
        const boxes = Array(ROWS - 1).fill(null).map(() => Array(COLS - 1).fill(null));

        const newGame: GameState = {
            hLines,
            vLines,
            boxes,
            currentPlayer: 1,
            scores: { 1: 0, 2: 0 },
            winner: null,
            lastCompletedBoxes: []
        };

        setGameState(newGame);
        setIsCpuThinking(false);
    };

    const checkCompletedBoxes = (
        hLines: number[][],
        vLines: number[][],
        currentBoxes: (Player | null)[][],
        player: Player
    ): { newBoxes: (Player | null)[][], points: number, completedIndices: { row: number, col: number }[] } => {
        let points = 0;
        const newBoxes = currentBoxes.map(row => [...row]);
        const completedIndices: { row: number, col: number }[] = [];

        for (let r = 0; r < ROWS - 1; r++) {
            for (let c = 0; c < COLS - 1; c++) {
                if (newBoxes[r][c] === null) {
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

    const countLines = (hLines: number[][], vLines: number[][], r: number, c: number) => {
        let count = 0;
        if (hLines[r][c] !== 0) count++;
        if (hLines[r + 1][c] !== 0) count++;
        if (vLines[r][c] !== 0) count++;
        if (vLines[r][c + 1] !== 0) count++;
        return count;
    }

    const makeCpuMove = () => {
        if (!gameState) return;
        setIsCpuThinking(true);

        const { hLines, vLines, boxes } = gameState;
        let bestMove: { type: 'h' | 'v', r: number, c: number } | null = null;
        const availableMoves: { type: 'h' | 'v', r: number, c: number }[] = [];

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS - 1; c++) {
                if (hLines[r][c] === 0) availableMoves.push({ type: 'h', r, c });
            }
        }
        for (let r = 0; r < ROWS - 1; r++) {
            for (let c = 0; c < COLS; c++) {
                if (vLines[r][c] === 0) availableMoves.push({ type: 'v', r, c });
            }
        }

        if (availableMoves.length === 0) return;

        // Strategy 1: Score
        for (const move of availableMoves) {
            const tempHLines = hLines.map(row => [...row]);
            const tempVLines = vLines.map(row => [...row]);
            if (move.type === 'h') tempHLines[move.r][move.c] = 2;
            else tempVLines[move.r][move.c] = 2;

            const { points } = checkCompletedBoxes(tempHLines, tempVLines, boxes, 2);
            if (points > 0) {
                bestMove = move;
                break;
            }
        }

        // Strategy 2: Safe move
        if (!bestMove) {
            const safeMoves: typeof availableMoves = [];
            for (const move of availableMoves) {
                const tempHLines = hLines.map(row => [...row]);
                const tempVLines = vLines.map(row => [...row]);
                if (move.type === 'h') tempHLines[move.r][move.c] = 2;
                else tempVLines[move.r][move.c] = 2;

                let givesPoint = false;
                const boxesToCheck: { r: number, c: number }[] = [];
                if (move.type === 'h') {
                    if (move.r > 0) boxesToCheck.push({ r: move.r - 1, c: move.c });
                    if (move.r < ROWS - 1) boxesToCheck.push({ r: move.r, c: move.c });
                } else {
                    if (move.c > 0) boxesToCheck.push({ r: move.r, c: move.c - 1 });
                    if (move.c < COLS - 1) boxesToCheck.push({ r: move.r, c: move.c });
                }

                for (const box of boxesToCheck) {
                    if (countLines(tempHLines, tempVLines, box.r, box.c) === 3) {
                        givesPoint = true;
                        break;
                    }
                }
                if (!givesPoint) safeMoves.push(move);
            }
            if (safeMoves.length > 0) {
                bestMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
            }
        }

        // Strategy 3: Random
        if (!bestMove) {
            bestMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }

        executeMove(bestMove.type, bestMove.r, bestMove.c);
        setIsCpuThinking(false);
    };

    const executeMove = (type: 'h' | 'v', r: number, c: number) => {
        if (!gameState) return;

        const newHLines = gameState.hLines.map(row => [...row]);
        const newVLines = gameState.vLines.map(row => [...row]);

        if (type === 'h') newHLines[r][c] = gameState.currentPlayer;
        else newVLines[r][c] = gameState.currentPlayer;

        const { newBoxes, points, completedIndices } = checkCompletedBoxes(newHLines, newVLines, gameState.boxes, gameState.currentPlayer);

        const newScores = { ...gameState.scores };
        let nextPlayer = gameState.currentPlayer;

        if (points > 0) {
            newScores[gameState.currentPlayer] += points;
        } else {
            nextPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        }

        const totalBoxes = (ROWS - 1) * (COLS - 1);
        const totalScore = newScores[1] + newScores[2];

        let winner: Player | null | 0 = null;
        if (totalScore === totalBoxes) {
            if (newScores[1] > newScores[2]) winner = 1;
            else if (newScores[2] > newScores[1]) winner = 2;
            else winner = 0;
        }

        const newState = {
            hLines: newHLines,
            vLines: newVLines,
            boxes: newBoxes,
            currentPlayer: nextPlayer,
            scores: newScores,
            winner: winner,
            lastCompletedBoxes: completedIndices.length > 0 ? completedIndices : []
        };

        setGameState(newState);
    }

    const handleLineClick = (type: 'h' | 'v', r: number, c: number) => {
        if (!gameState || gameState.winner !== null) return;
        if (isCpuMode && gameState.currentPlayer === 2) return;

        if (type === 'h') {
            if (gameState.hLines[r][c] !== 0) return;
        } else {
            if (gameState.vLines[r][c] !== 0) return;
        }

        executeMove(type, r, c);
    };

    if (!gameState) return null;

    const DOT_SPACING = 50;
    const DOT_RADIUS = 6;
    const PADDING = 20;
    const isGameOver = gameState.winner !== null;

    return (
        <div className={styles.game_layout_wrapper}>
            <div className={styles.side_panel}>
                <button onClick={onBack} className={styles.backButton} style={{ marginBottom: '1rem' }}>
                    <IconBack size={20} /> メニューへ戻る
                </button>

                <div className={styles.status_panel}>
                    {!isGameOver && gameState.scores[1] === 0 && gameState.scores[2] === 0 && (
                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', background: '#f3f4f6', padding: '0.25rem', borderRadius: '2rem' }}>
                            <button
                                onClick={() => { setIsCpuMode(true); startNewGame(); }}
                                style={{
                                    flex: 1, padding: '0.5rem', borderRadius: '2rem', border: 'none',
                                    background: isCpuMode ? '#1f2937' : 'transparent',
                                    color: isCpuMode ? '#fff' : '#4b5563',
                                    fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.8rem'
                                }}
                            >
                                <IconRobot size={14} /> VS CPU
                            </button>
                            <button
                                onClick={() => { setIsCpuMode(false); startNewGame(); }}
                                style={{
                                    flex: 1, padding: '0.5rem', borderRadius: '2rem', border: 'none',
                                    background: !isCpuMode ? '#1f2937' : 'transparent',
                                    color: !isCpuMode ? '#fff' : '#4b5563',
                                    fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.8rem'
                                }}
                            >
                                <IconUser size={14} /> 2P
                            </button>
                        </div>
                    )}

                    <div className={styles.score_board}>
                        <div className={`${styles.player_card} ${gameState.currentPlayer === 1 && !isGameOver ? styles.player_card_active + ' ' + styles.p1_active : ''}`}>
                            <span className={`${styles.player_name} ${styles.p1_name}`}>Player 1</span>
                            <span className={styles.player_score}>{gameState.scores[1]}</span>
                        </div>
                        <div className={`${styles.player_card} ${gameState.currentPlayer === 2 && !isGameOver ? styles.player_card_active + ' ' + styles.p2_active : ''}`}>
                            <span className={`${styles.player_name} ${styles.p2_name}`}>{isCpuMode ? 'CPU' : 'Player 2'}</span>
                            <span className={styles.player_score}>{gameState.scores[2]}</span>
                        </div>
                    </div>

                    {isGameOver && (
                        <div className={styles.game_over} style={{ marginTop: '1rem' }}>
                            <h2 className={styles.winner_text} style={{ fontSize: '1.5rem' }}>
                                {gameState.winner === 0 ? "引き分け!" : `Player ${gameState.winner} の勝ち!`}
                            </h2>
                            <button onClick={() => startNewGame()} className={styles.play_again_btn}>もう一度遊ぶ</button>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.center_panel}>
                <div className={styles.board_wrapper}>
                    <svg
                        width={(COLS - 1) * DOT_SPACING + PADDING * 2}
                        height={(ROWS - 1) * DOT_SPACING + PADDING * 2}
                    >
                        <g transform={`translate(${PADDING}, ${PADDING})`}>
                            {gameState.boxes.map((row, r) => row.map((owner, c) => owner && (
                                <rect key={`box-${r}-${c}`} x={c * DOT_SPACING} y={r * DOT_SPACING} width={DOT_SPACING} height={DOT_SPACING} className={owner === 1 ? styles.box_p1 : styles.box_p2} />
                            )))}
                            {gameState.hLines.map((row, r) => row.map((owner, c) => (
                                <rect key={`h-${r}-${c}`} x={c * DOT_SPACING} y={r * DOT_SPACING - 5} width={DOT_SPACING} height={10} rx={4}
                                    className={`${styles.line} 
                                        ${owner === 1 ? styles.line_p1 : ''} 
                                        ${owner === 2 ? styles.line_p2 : ''} 
                                        ${owner === 0 && !isGameOver ? styles.line_inactive : ''}`}
                                    fill={owner !== 0 ? undefined : 'transparent'} onClick={() => handleLineClick('h', r, c)} />
                            )))}
                            {gameState.vLines.map((row, r) => row.map((owner, c) => (
                                <rect key={`v-${r}-${c}`} x={c * DOT_SPACING - 5} y={r * DOT_SPACING} width={10} height={DOT_SPACING} rx={4}
                                    className={`${styles.line} 
                                        ${owner === 1 ? styles.line_p1 : ''} 
                                        ${owner === 2 ? styles.line_p2 : ''} 
                                        ${owner === 0 && !isGameOver ? styles.line_inactive : ''}`}
                                    fill={owner !== 0 ? undefined : 'transparent'} onClick={() => handleLineClick('v', r, c)} />
                            )))}
                            {Array(ROWS).fill(0).map((_, r) => Array(COLS).fill(0).map((_, c) => (
                                <circle key={`dot-${r}-${c}`} cx={c * DOT_SPACING} cy={r * DOT_SPACING} r={DOT_RADIUS} className={styles.dot} />
                            )))}
                        </g>
                    </svg>
                </div>
                <div className={styles.instructions}>
                    <p>点と点の間をクリックして線を引きます。四角形を完成させるとポイント獲得＆もう一度行動できます。</p>
                </div>
            </div>
        </div>
    );
}
