'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { GoBoard } from './GoBoard';
import { GoBoard as GoBoardType, StoneColor } from '@/lib/go/types';
import { createInitialBoard, placeStone } from '@/lib/go/engine';
import { getBestMove } from '@/lib/go/ai';

export default function GoAiGame() {
    const [board, setBoard] = useState<GoBoardType>(createInitialBoard(19));
    const [gameStatus, setGameStatus] = useState<'playing' | 'finished'>('playing');
    const [winner, setWinner] = useState<string | null>(null);
    const [consecutivePasses, setConsecutivePasses] = useState(0);

    const handleMove = async (x: number, y: number) => {
        if (gameStatus !== 'playing') return;
        if (board.currentColor !== 'black') return; // Human is Black

        const result = placeStone(board, x, y);
        if (result.success && result.newBoard) {
            setBoard(result.newBoard);
            setConsecutivePasses(0);

            // AI Turn
            setTimeout(() => runAiTurn(result.newBoard!), 500);
        }
    };

    const runAiTurn = (currentBoard: GoBoardType) => {
        const move = getBestMove(currentBoard, 'white');
        if (move === 'pass') {
            handleAiPass(currentBoard);
        } else {
            const result = placeStone(currentBoard, move.x, move.y);
            if (result.success && result.newBoard) {
                setBoard(result.newBoard);
                setConsecutivePasses(0);
            } else {
                // If AI fails valid move (shouldn't happen with getBestMove), pass
                handleAiPass(currentBoard);
            }
        }
    };

    const handlePass = () => {
        if (gameStatus !== 'playing') return;
        if (board.currentColor !== 'black') return;

        // Human passed
        const nextBoard = JSON.parse(JSON.stringify(board));
        nextBoard.currentColor = 'white';
        setBoard(nextBoard);

        const newPassCount = consecutivePasses + 1;
        setConsecutivePasses(newPassCount);

        if (newPassCount >= 2) {
            finishGame(nextBoard);
            return;
        }

        setTimeout(() => runAiTurn(nextBoard), 500);
    };

    const handleAiPass = (currentBoard: GoBoardType) => {
        const nextBoard = JSON.parse(JSON.stringify(currentBoard));
        nextBoard.currentColor = 'black';
        setBoard(nextBoard);

        const newPassCount = consecutivePasses + 1; // Prior passes (human) + this pass
        // Actually, consecutivePasses state update is async, so we need to track carefully.
        // However, standard logic is if previous player passed, and current passes -> end.

        // In local state, we updated setConsecutivePasses(1) when human passed.
        // If AI passes now, it becomes 2.

        // Wait, if Human moves, we reset to 0. 
        // If Human passes -> 1.
        // AI moves -> 0.
        // AI passes -> if prev was 1, then 2 -> End.

        setConsecutivePasses(prev => {
            const count = prev + 1;
            if (count >= 2) {
                finishGame(nextBoard);
            }
            return count;
        });
    };

    const finishGame = (finalBoard: GoBoardType) => {
        setGameStatus('finished');
        // Simple scoring: Area scoring or just count captured + stones on board?
        // Simplified: Count captured only for winner determination in this MVP (or random).
        // Real scoring requires marking dead stones which is complex UI.
        // Let's just say "Game Over" and show captured counts.

        const bScore = finalBoard.capturedBlack; // capturedBlack means Black's prisoners? No, in engine types it's confusing.
        // In engine: "capturedBlack += ..." when White captures. So it is White's prisoners (Black stones).
        // But in ColyseusGoGame we mapped:
        // capturedBlack: capB (Black player's prisoners)
        // Let's stick to engine.ts logic: "capturedBlack" property in GoBoard definition.

        // In engine.ts:
        // if (board.currentColor === 'black') nextBoard.capturedWhite += capturedPoints.length;
        // So capturedWhite property counts WHITE STONES that were captured (by Black).
        // So Black Score ~= capturedWhite.

        const blackScore = finalBoard.capturedWhite;
        const whiteScore = finalBoard.capturedBlack;

        if (blackScore > whiteScore) setWinner('Black');
        else if (whiteScore > blackScore) setWinner('White');
        else setWinner('Draw');
    };

    return (
        <div className={styles.main}>
            <div className={styles.gameContainer}>
                <h1 className={styles.title}>囲碁 vs CPU</h1>

                <div className={styles.gameLayout}>
                    <div className={styles.infoPanel}>
                        <div className={`${styles.turnIndicator} ${board.currentColor === 'black' ? styles.turnBlack : styles.turnWhite}`}>
                            {board.currentColor === 'black' ? "あなたの手番 (黒)" : "CPU思考中... (白)"}
                        </div>

                        <div className={styles.captured}>
                            <h3>アゲハマ (取った石)</h3>
                            <div className={styles.capturedRow}>
                                <span>あなたの獲得:</span>
                                <span>{board.capturedWhite}</span>
                            </div>
                            <div className={styles.capturedRow}>
                                <span>CPUの獲得:</span>
                                <span>{board.capturedBlack}</span>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <button className={styles.actionBtn} onClick={handlePass} disabled={board.currentColor !== 'black'}>パス</button>
                            <button className={`${styles.actionBtn} ${styles.secondaryBtn}`} onClick={() => window.location.reload()}>投了/リセット</button>
                        </div>
                    </div>

                    <GoBoard
                        board={board}
                        myColor="black"
                        isMyTurn={board.currentColor === 'black'}
                        onMove={handleMove}
                    />
                </div>
            </div>

            {gameStatus === 'finished' && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>終局</h2>
                        <p>勝者: {winner === 'Black' ? 'あなた (黒)' : winner === 'White' ? 'CPU (白)' : '引き分け'}</p>
                        <div style={{ margin: '1rem 0' }}>
                            <p>黒のアゲハマ: {board.capturedWhite}</p>
                            <p>白のアゲハマ: {board.capturedBlack}</p>
                        </div>
                        <button className={styles.actionBtn} onClick={() => window.location.reload()}>もう一度遊ぶ</button>
                    </div>
                </div>
            )}
        </div>
    );
}
