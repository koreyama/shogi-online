'use client';

import React, { useState, useEffect } from 'react';
import { CATEGORIES, Category, calculateScore } from './scoring';
import styles from './Yacht.module.css';

const MAX_ROLLS = 3;

const CATEGORY_LABELS: Record<Category, string> = {
    'Ones': '1の目 (Ones)',
    'Twos': '2の目 (Twos)',
    'Threes': '3の目 (Threes)',
    'Fours': '4の目 (Fours)',
    'Fives': '5の目 (Fives)',
    'Sixes': '6の目 (Sixes)',
    'Choice': 'チョイス',
    '4 of a Kind': 'フォーカード',
    'Full House': 'フルハウス',
    'S. Straight': 'S.ストレート',
    'L. Straight': 'L.ストレート',
    'Yacht': 'ヨット'
};

// 3D Dice Component
const Die = ({ value, held, rolling, onClick, disabled }: { value: number, held: boolean, rolling: boolean, onClick: () => void, disabled: boolean }) => {
    // Required rotation to bring Face N to Front:
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
                {/* Construct all 6 faces */}
                {[1, 6, 3, 4, 5, 2].map((faceVal) => {
                    // Map faceVal to CSS class
                    let faceClass = '';
                    if (faceVal === 1) faceClass = styles.front;
                    if (faceVal === 6) faceClass = styles.back;
                    if (faceVal === 3) faceClass = styles.right;
                    if (faceVal === 4) faceClass = styles.left;
                    if (faceVal === 5) faceClass = styles.top;
                    if (faceVal === 2) faceClass = styles.bottom;

                    // Pips generation
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


export default function YachtGame() {
    const [dice, setDice] = useState<number[]>([1, 1, 1, 1, 1]);
    const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
    const [rollsLeft, setRollsLeft] = useState<number>(3);
    const [scores, setScores] = useState<Partial<Record<Category, number>>>({});
    const [gameOver, setGameOver] = useState<boolean>(false);
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
        rollDice([false, false, false, false, false]);
    };

    const rollDice = (currentHeld: boolean[]) => {
        setIsRolling(true);
        // Force delay for animation
        setTimeout(() => {
            setDice(prev => prev.map((d, i) => currentHeld[i] ? d : Math.floor(Math.random() * 6) + 1));
            setRollsLeft(prev => prev - 1);
            setIsRolling(false);
        }, 600);
    };

    const handleRollClick = () => {
        if (gameOver || rollsLeft <= 0 || isRolling) return;
        rollDice(held);
    };

    const toggleHold = (index: number) => {
        if (gameOver || rollsLeft === MAX_ROLLS && !isRolling) return;
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

    // Score Calculations
    const upperSectionCategories: Category[] = ['Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes'];
    const upperSectionScore = upperSectionCategories.reduce((acc, cat) => acc + (scores[cat] || 0), 0);
    const bonus = upperSectionScore >= 63 ? 35 : 0;
    const totalScore = Object.values(scores).reduce((a, b) => (a || 0) + (b || 0), 0) + bonus;

    // Remaining needed for bonus
    const isUpperSectionComplete = upperSectionCategories.every(cat => scores[cat] !== undefined);

    const hasRolledAtLeastOnce = rollsLeft < MAX_ROLLS;

    return (
        <div className={styles.container}>
            {/* Game Area */}
            <div className={styles.game_area}>
                {/* Dice */}
                <div className={`${styles.dice_stage} ${isRolling ? styles.rolling : ''}`}>
                    {dice.map((value, i) => (
                        <Die
                            key={i}
                            value={value}
                            held={held[i]}
                            rolling={isRolling && !held[i]}
                            onClick={() => toggleHold(i)}
                            disabled={gameOver || isRolling || !hasRolledAtLeastOnce}
                        />
                    ))}
                </div>

                <div className={styles.controls}>
                    <p className={styles.instruction_text}>
                        {gameOver ? "ゲーム終了" :
                            rollsLeft === 3 ? "ロールして開始" :
                                held.includes(true) ? "クリックでホールド解除" : "ダイスをクリックしてホールド"}
                    </p>
                    <button
                        onClick={handleRollClick}
                        disabled={gameOver || rollsLeft <= 0 || isRolling}
                        className={styles.roll_btn}
                    >
                        {rollsLeft > 0 ? `ロール (${rollsLeft})` : '役を選択'}
                    </button>
                </div>
            </div>

            {/* Score Card */}
            <div className={styles.score_card}>
                <div className={styles.score_header}>
                    <div className={styles.score_title}>ヨット スコア</div>
                    <div className={styles.total_score}>{totalScore}</div>
                </div>

                <div className={styles.category_list}>
                    {CATEGORIES.map((cat, index) => {
                        const isTaken = scores[cat] !== undefined;
                        const potentialScore = calculateScore(cat, dice);

                        return (
                            <React.Fragment key={cat}>
                                {/* Bonus Row Display after 6th item */}
                                {index === 6 && (
                                    <>
                                        <div className={styles.divider}></div>
                                        <div className={styles.bonus_row}>
                                            <span>ボーナス (63点以上)</span>
                                            <span>{isUpperSectionComplete ? (bonus > 0 ? '+35' : '0') : `${upperSectionScore}/63`}</span>
                                        </div>
                                        <div className={styles.divider}></div>
                                    </>
                                )}

                                <button
                                    onClick={() => handleCategoryClick(cat)}
                                    disabled={isTaken || gameOver || isRolling || !hasRolledAtLeastOnce}
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
                                            : (gameOver || isRolling || !hasRolledAtLeastOnce ? styles.points_potential : styles.points_potential_active)
                                        }
                                    `}>
                                        {isTaken ? scores[cat] : (gameOver || isRolling || !hasRolledAtLeastOnce ? '-' : potentialScore)}
                                    </span>
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>

                {gameOver && (
                    <div className={styles.game_over_panel}>
                        <p className={styles.game_over_title}>ゲームセット！</p>
                        <div style={{ fontSize: '3rem', fontWeight: '900', color: '#3b82f6', marginBottom: '1rem' }}>{totalScore}点</div>
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
