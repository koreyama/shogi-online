'use client';

import React, { useState, useEffect, useRef } from 'react';
import { generateSecret, checkGuess, GuessRecord, COLORS } from './utils';
import styles from './HitAndBlow.module.css';

const DIGIT_COUNT = 4;
const MAX_ATTEMPTS = 10;

export default function HitAndBlowGame() {
    const [secret, setSecret] = useState<string>('');
    const [currentGuess, setCurrentGuess] = useState<string>('');
    const [history, setHistory] = useState<GuessRecord[]>([]);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [won, setWon] = useState<boolean>(false);

    // For auto-scroll
    const historyEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        startNewGame();
    }, []);

    useEffect(() => {
        if (historyEndRef.current) {
            historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history]);

    const startNewGame = () => {
        setSecret(generateSecret(DIGIT_COUNT));
        setCurrentGuess('');
        setHistory([]);
        setGameOver(false);
        setWon(false);
    };

    const handleColorClick = (colorInitial: string) => {
        if (gameOver || currentGuess.length >= DIGIT_COUNT) return;
        if (currentGuess.includes(colorInitial)) return; // No duplicates allowed
        setCurrentGuess((prev) => prev + colorInitial);
    };

    const handleBackspace = () => {
        if (gameOver) return;
        setCurrentGuess((prev) => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if (gameOver || currentGuess.length !== DIGIT_COUNT) return;

        const result = checkGuess(secret, currentGuess);
        const newHistory = [...history, { guess: currentGuess, result }];
        setHistory(newHistory);
        setCurrentGuess('');

        if (result.hit === DIGIT_COUNT) {
            setWon(true);
            setGameOver(true);
        } else if (newHistory.length >= MAX_ATTEMPTS) {
            setGameOver(true);
        }
    };

    return (
        <div className={styles.container}>

            {/* Game Status / Result */}
            <div className={styles.status_section}>
                {gameOver ? (
                    <div className={styles.gameOverAnimation}>
                        {won ? (
                            <h2 className={styles.game_over_win}>Excellent!</h2>
                        ) : (
                            <h2 className={styles.game_over_loss}>Game Over</h2>
                        )}
                        <div className={styles.secret_reveal}>
                            正解:
                            <div className={styles.guess_colors}>
                                {secret.split('').map((char, i) => (
                                    <div key={i} className={styles.slot} style={{ width: '2.5rem', height: '2.5rem', border: 'none' }}>
                                        <div className={`${styles.circle} ${styles[`circle_${char}`]}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={startNewGame}
                            className={styles.play_again_btn}
                        >
                            Play Again
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className={styles.instruction}>4色の並びを当ててください</p>
                        <div className={styles.attempts_info}>
                            <span className={styles.attempts_label}>残り回数:</span>
                            <span className={`${styles.attempts_count} ${MAX_ATTEMPTS - history.length <= 3 ? styles.attempts_danger : styles.attempts_safe}`}>
                                {MAX_ATTEMPTS - history.length}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* History */}
            <div className={styles.history_container}>
                <div className={styles.history_header}>
                    <div>予想</div>
                    <div>HIT</div>
                    <div>BLOW</div>
                </div>
                {history.map((record, index) => (
                    <div key={index} className={styles.history_row}>
                        <div className={styles.guess_colors}>
                            {record.guess.split('').map((char, i) => (
                                <div key={i} className={styles.history_dot + ' ' + styles[`circle_${char}`]} />
                            ))}
                        </div>
                        <div className={`${styles.result_badge} ${styles.hit_badge}`}>{record.result.hit}</div>
                        <div className={`${styles.result_badge} ${styles.blow_badge}`}>{record.result.blow}</div>
                    </div>
                ))}
                {history.length === 0 && !gameOver && (
                    <div className={styles.empty_history}>
                        履歴がここに表示されます
                    </div>
                )}
                <div ref={historyEndRef} />
            </div>

            {/* Input Display */}
            <div className={styles.input_display}>
                <div className={styles.input_slots}>
                    {Array.from({ length: DIGIT_COUNT }).map((_, i) => {
                        const char = currentGuess[i];
                        return (
                            <div key={i} className={`${styles.slot} ${char ? styles.slot_filled : ''}`}>
                                {char && <div className={`${styles.circle} ${styles[`circle_${char}`]}`} />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Keypad */}
            {!gameOver && (
                <div className={styles.keypad_container}>
                    <div className={styles.color_grid}>
                        {COLORS.map((color) => {
                            const char = color[0];
                            const isUsed = currentGuess.includes(char);
                            return (
                                <button
                                    key={color}
                                    onClick={() => handleColorClick(char)}
                                    disabled={isUsed}
                                    className={`${styles.color_btn} ${styles[`circle_${char}`]}`}
                                    title={color}
                                />
                            );
                        })}
                    </div>
                    <div className={styles.action_row}>
                        <button
                            onClick={handleBackspace}
                            className={`${styles.action_btn} ${styles.delete_btn}`}
                        >
                            <span style={{ fontSize: '1.2rem' }}>⌫</span>
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={currentGuess.length !== DIGIT_COUNT}
                            className={`${styles.action_btn} ${styles.enter_btn}`}
                        >
                            ENTER
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
