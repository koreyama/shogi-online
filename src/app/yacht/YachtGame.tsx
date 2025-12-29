'use client';

import React, { useState, useEffect } from 'react';
import { CATEGORIES, Category, calculateScore } from './scoring';
import styles from './Yacht.module.css';

const MAX_ROLLS = 3;

const CATEGORY_LABELS: Record<Category, string> = {
    'Ones': '1 (Ones)',
    'Twos': '2 (Twos)',
    'Threes': '3 (Threes)',
    'Fours': '4 (Fours)',
    'Fives': '5 (Fives)',
    'Sixes': '6 (Sixes)',
    'Choice': 'Choice',
    '4 of a Kind': '4 Cards',
    'Full House': 'Full House',
    'S. Straight': 'S. Straight',
    'L. Straight': 'L. Straight',
    'Yacht': 'Yacht'
};

const Die = ({ value, held, rolling, onClick, disabled }: { value: number, held: boolean, rolling: boolean, onClick: () => void, disabled: boolean }) => {
    const rotations: Record<number, string> = {
        1: 'rotateX(0deg) rotateY(0deg)',
        6: 'rotateX(0deg) rotateY(180deg)',
        3: 'rotateX(0deg) rotateY(-90deg)',
        4: 'rotateX(0deg) rotateY(90deg)',
        5: 'rotateX(-90deg) rotateY(0deg)',
        2: 'rotateX(90deg) rotateY(0deg)',
    };

    return (
        <div
            className={`${styles.die_wrapper} ${held ? styles.held : ''} ${disabled ? styles.disabled : ''}`}
            onClick={onClick}
        >
            {held && <div className={styles.held_badge}>KEEP</div>}
            <div
                className={styles.die}
                style={{ transform: rotations[value] }}
            >
                {[1, 6, 3, 4, 5, 2].map((faceVal) => {
                    let faceClass = '';
                    if (faceVal === 1) faceClass = styles.front;
                    if (faceVal === 6) faceClass = styles.back;
                    if (faceVal === 3) faceClass = styles.right;
                    if (faceVal === 4) faceClass = styles.left;
                    if (faceVal === 5) faceClass = styles.top;
                    if (faceVal === 2) faceClass = styles.bottom;

                    const pips = Array(faceVal).fill(0);
                    return (
                        <div key={faceVal} className={`${styles.face} ${faceClass}`} data-value={faceVal}>
                            <div className={styles.face_inner}>
                                {pips.map((_, i) => (
                                    <div key={i} className={`${styles.pip} ${faceVal === 1 ? styles.pip_red : ''}`} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface GameState {
    dice: number[];
    held: boolean[];
    rollsLeft: number;
    scores: Partial<Record<Category, number>>;
    isRolling: boolean;
    winner: boolean;
}

export default function YachtGame({ onBack }: { onBack?: () => void }) {
    const [gameState, setGameState] = useState<GameState>({
        dice: [1, 1, 1, 1, 1],
        held: [false, false, false, false, false],
        rollsLeft: MAX_ROLLS,
        scores: {},
        isRolling: false,
        winner: false
    });

    const startNewGame = () => {
        setGameState({
            dice: [1, 1, 1, 1, 1],
            held: [false, false, false, false, false],
            rollsLeft: MAX_ROLLS,
            scores: {},
            isRolling: false,
            winner: false
        });
    };

    const rollDice = () => {
        if (gameState.rollsLeft <= 0 || gameState.isRolling || gameState.winner) return;

        setGameState(prev => ({ ...prev, isRolling: true }));

        setTimeout(() => {
            setGameState(prev => {
                const newDice = prev.dice.map((d, i) => prev.held[i] ? d : Math.floor(Math.random() * 6) + 1);
                return {
                    ...prev,
                    dice: newDice,
                    rollsLeft: prev.rollsLeft - 1,
                    isRolling: false
                };
            });
        }, 600);
    };

    const toggleHold = (index: number) => {
        if (gameState.rollsLeft === MAX_ROLLS || gameState.isRolling || gameState.winner) return;
        const newHeld = [...gameState.held];
        newHeld[index] = !newHeld[index];
        setGameState(prev => ({ ...prev, held: newHeld }));
    };

    const selectCategory = (category: Category) => {
        if (gameState.rollsLeft === MAX_ROLLS || gameState.isRolling || gameState.winner) return;
        if (gameState.scores[category] !== undefined) return;

        const score = calculateScore(category, gameState.dice);
        const newScores = { ...gameState.scores, [category]: score };

        const isGameOver = Object.keys(newScores).length === CATEGORIES.length;

        setGameState(prev => ({
            ...prev,
            scores: newScores,
            dice: [1, 1, 1, 1, 1],
            held: [false, false, false, false, false],
            rollsLeft: MAX_ROLLS,
            winner: isGameOver
        }));
    };

    const calculateTotal = (scores: Partial<Record<Category, number>>) => {
        let total = 0;
        let upperSum = 0;
        const upperCats = ['Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes'];
        Object.entries(scores).forEach(([key, val]) => {
            total += (val as number);
            if (upperCats.includes(key)) upperSum += (val as number);
        });
        if (upperSum >= 63) total += 35;
        return total;
    };

    const upperScore = ['Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes'].reduce((acc, cat) => acc + (gameState.scores[cat as Category] || 0), 0);
    const totalScore = calculateTotal(gameState.scores);

    return (
        <div className={styles.container}>
            <div className={styles.gameLayout}>
                <div className={styles.leftPanel}>
                    <div className={styles.topControls}>
                        <div className={styles.turnIndicator} style={{ flex: 1, color: '#3b82f6' }}>
                            ソロプレイ
                        </div>
                        {onBack && (
                            <button onClick={onBack} className={styles.exit_btn}>
                                退出
                            </button>
                        )}
                    </div>

                    <div className={styles.game_area}>
                        <div className={`${styles.dice_stage} ${gameState.isRolling ? styles.rolling : ''}`}>
                            {gameState.dice.map((val, i) => (
                                <Die
                                    key={i}
                                    value={val}
                                    held={gameState.held[i]}
                                    rolling={gameState.isRolling && !gameState.held[i]}
                                    onClick={() => toggleHold(i)}
                                    disabled={gameState.winner || gameState.isRolling || gameState.rollsLeft === MAX_ROLLS}
                                />
                            ))}
                        </div>
                        <div className={styles.controls}>
                            <button
                                onClick={rollDice}
                                disabled={gameState.winner || gameState.rollsLeft <= 0 || gameState.isRolling}
                                className={styles.roll_btn}
                            >
                                {gameState.rollsLeft > 0 ? `ロール (${gameState.rollsLeft})` : '役を選択'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.rightPanel}>
                    <div className={styles.score_card} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', borderRadius: '1rem' }}>
                        <div className={styles.score_header_small}>
                            スコアシート <span style={{ float: 'right' }}>Total: {totalScore}</span>
                        </div>
                        <div className={styles.score_column} style={{ padding: 0 }}>
                            {CATEGORIES.map((cat, idx) => {
                                const isTaken = gameState.scores[cat] !== undefined;
                                const canPick = !isTaken && gameState.rollsLeft < MAX_ROLLS && !gameState.isRolling && !gameState.winner;
                                const potential = calculateScore(cat, gameState.dice);

                                return (
                                    <React.Fragment key={cat}>
                                        {idx === 6 && (
                                            <div className={styles.bonus_row_small}>
                                                <span>Bonus</span>
                                                <span>{upperScore >= 63 ? '+35' : `${upperScore}/63`}</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => canPick && selectCategory(cat)}
                                            disabled={!canPick}
                                            className={`${styles.category_row} ${isTaken ? styles.category_row_taken : ''} ${canPick ? styles.category_row_active : ''}`}
                                        >
                                            <span className={styles.category_name}>{CATEGORY_LABELS[cat]}</span>
                                            <span className={styles.category_points}>
                                                {isTaken ? gameState.scores[cat] : (canPick ? potential : '-')}
                                            </span>
                                        </button>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {gameState.winner && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 100
                }} className={styles.game_over_panel}>
                    <p className={styles.game_over_title}>ゲーム盤面</p>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        {totalScore}点
                    </div>
                    <button onClick={startNewGame} className={styles.restart_btn}>もう一度遊ぶ</button>
                    {onBack && <button onClick={onBack} className={styles.restart_btn} style={{ background: '#666', marginTop: '0.5rem' }}>メニューへ戻る</button>}
                </div>
            )}
        </div>
    );
}
