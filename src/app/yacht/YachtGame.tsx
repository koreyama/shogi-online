'use client';

import React, { useState, useEffect } from 'react';
import { CATEGORIES, Category, calculateScore } from './scoring';
import styles from './Yacht.module.css';

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const MAX_ROLLS = 3;

const CATEGORY_LABELS: Record<Category, string> = {
    'Ones': '1の目',
    'Twos': '2の目',
    'Threes': '3の目',
    'Fours': '4の目',
    'Fives': '5の目',
    'Sixes': '6の目',
    'Choice': 'チョイス',
    '4 of a Kind': 'フォーカード',
    'Full House': 'フルハウス',
    'S. Straight': 'S.ストレート',
    'L. Straight': 'L.ストレート',
    'Yacht': 'ヨット'
};

export default function YachtGame() {
    const [dice, setDice] = useState<number[]>([1, 1, 1, 1, 1]);
    const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
    const [rollsLeft, setRollsLeft] = useState<number>(3);
    const [scores, setScores] = useState<Partial<Record<Category, number>>>({});
    const [gameOver, setGameOver] = useState<boolean>(false);

    // Animation state
    const [isRolling, setIsRolling] = useState(false);

    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = () => {
        setScores({});
        setGameOver(false);
        resetTurn();
    };

    const resetTurn = () => {
        setDice([1, 1, 1, 1, 1]);
        setHeld([false, false, false, false, false]);
        setRollsLeft(MAX_ROLLS);
        rollDice([false, false, false, false, false]); // Initial roll
    };

    const rollDice = (currentHeld: boolean[]) => {
        setIsRolling(true);
        // Simple animation effect could be added here
        setTimeout(() => {
            setDice(prev => prev.map((d, i) => currentHeld[i] ? d : Math.floor(Math.random() * 6) + 1));
            setRollsLeft(prev => prev - 1);
            setIsRolling(false);
        }, 300);
    };

    const handleRollClick = () => {
        if (gameOver || rollsLeft <= 0 || isRolling) return;
        rollDice(held);
    };

    const toggleHold = (index: number) => {
        if (gameOver || rollsLeft === MAX_ROLLS && !isRolling) return;

        if (rollsLeft === 3) return; // Should not happen with current logic

        const newHeld = [...held];
        newHeld[index] = !newHeld[index];
        setHeld(newHeld);
    };

    const handleCategoryClick = (category: Category) => {
        if (gameOver || isRolling || scores[category] !== undefined) return;

        const score = calculateScore(category, dice);
        const newScores = { ...scores, [category]: score };
        setScores(newScores);

        if (Object.keys(newScores).length === CATEGORIES.length) {
            setGameOver(true);
        } else {
            resetTurn();
        }
    };

    const totalScore = Object.values(scores).reduce((a, b) => (a || 0) + (b || 0), 0) || 0;

    return (
        <div className={styles.container}>
            {/* Game Area */}
            <div className={styles.game_area}>
                {/* Dice */}
                <div className={styles.dice_container}>
                    {dice.map((value, i) => (
                        <button
                            key={i}
                            onClick={() => toggleHold(i)}
                            disabled={gameOver || isRolling}
                            className={`
                                ${styles.die_btn}
                                ${held[i] ? styles.die_held : ''}
                                ${isRolling && !held[i] ? styles.die_rolling : ''}
                            `}
                        >
                            {DICE_FACES[value]}
                        </button>
                    ))}
                </div>

                <div className={styles.controls}>
                    <p className={styles.instruction_text}>{held.includes(true) ? "クリックしてホールド解除" : "ダイスをクリックしてホールド"}</p>
                    <button
                        onClick={handleRollClick}
                        disabled={gameOver || rollsLeft <= 0 || isRolling}
                        className={styles.roll_btn}
                    >
                        ロール ({rollsLeft})
                    </button>
                </div>
            </div>

            {/* Score Card */}
            <div className={styles.score_card}>
                <div className={styles.score_header}>
                    <h2 className={styles.score_title}>スコアカード</h2>
                    <div className={styles.total_score}>合計: {totalScore}</div>
                </div>
                <div className={styles.category_list}>
                    {CATEGORIES.map((cat, index) => {
                        const isTaken = scores[cat] !== undefined;
                        const potentialScore = calculateScore(cat, dice);
                        const isUpperSection = index < 6;
                        const isBonus = false; // Bonus logic not implemented yet in simple version

                        return (
                            <React.Fragment key={cat}>
                                {index === 6 && <div className={styles.divider}></div>}
                                <button
                                    onClick={() => handleCategoryClick(cat)}
                                    disabled={isTaken || gameOver || isRolling}
                                    className={`
                                        ${styles.category_row}
                                        ${isTaken ? styles.category_row_taken : ''}
                                    `}
                                >
                                    <span className={styles.category_name}>
                                        {CATEGORY_LABELS[cat]}
                                    </span>
                                    <span className={`
                                        ${styles.category_points}
                                        ${isTaken
                                            ? styles.points_taken
                                            : (gameOver || isRolling ? styles.points_potential : styles.points_potential_active)
                                        }
                                    `}>
                                        {isTaken ? scores[cat] : (gameOver || isRolling ? '-' : potentialScore)}
                                    </span>
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>

                {gameOver && (
                    <div className={styles.game_over_panel}>
                        <p className={styles.game_over_title}>ゲーム終了！</p>
                        <button
                            onClick={startNewGame}
                            className={styles.restart_btn}
                        >
                            もう一度遊ぶ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
