'use client';

import React, { useState, useEffect } from 'react';
import { generateSecret, checkGuess, GuessRecord } from './utils';
import styles from './HitAndBlow.module.css';

const DIGIT_COUNT = 4;
const MAX_ATTEMPTS = 10;

export default function HitAndBlowGame() {
    const [secret, setSecret] = useState<string>('');
    const [currentGuess, setCurrentGuess] = useState<string>('');
    const [history, setHistory] = useState<GuessRecord[]>([]);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [won, setWon] = useState<boolean>(false);

    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = () => {
        setSecret(generateSecret(DIGIT_COUNT));
        setCurrentGuess('');
        setHistory([]);
        setGameOver(false);
        setWon(false);
    };

    const handleDigitClick = (digit: string) => {
        if (gameOver || currentGuess.length >= DIGIT_COUNT) return;
        if (currentGuess.includes(digit)) return; // No duplicates allowed
        setCurrentGuess((prev) => prev + digit);
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
                            <h2 className={styles.game_over_win}>勝利！</h2>
                        ) : (
                            <h2 className={styles.game_over_loss}>ゲームオーバー</h2>
                        )}
                        <p className={styles.secret_reveal}>正解: <span className={styles.secret_code}>{secret}</span></p>
                        <button
                            onClick={startNewGame}
                            className={styles.play_again_btn}
                        >
                            もう一度遊ぶ
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className={styles.instruction}>4桁の数字を当ててください（重複なし）</p>
                        <div className={styles.attempts_info}>
                            <span className={styles.attempts_label}>残り試行回数:</span>
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
                    <div className={styles.header_hit}>ヒット</div>
                    <div className={styles.header_blow}>ブロー</div>
                </div>
                {history.map((record, index) => (
                    <div key={index} className={styles.history_row}>
                        <div className={styles.guess_text}>{record.guess}</div>
                        <div className={`${styles.result_badge} ${styles.hit_badge}`}>{record.result.hit}</div>
                        <div className={`${styles.result_badge} ${styles.blow_badge}`}>{record.result.blow}</div>
                    </div>
                ))}
                {history.length === 0 && !gameOver && (
                    <div className={styles.empty_history}>
                        <span className={styles.empty_history_placeholder}>? ? ? ?</span>
                        <span className={styles.empty_history_text}>最初の予想を入力してください...</span>
                    </div>
                )}
            </div>

            {/* Input Display */}
            <div className={styles.input_display}>
                <div className={styles.input_slots}>
                    {Array.from({ length: DIGIT_COUNT }).map((_, i) => (
                        <div key={i} className={`${styles.slot} ${i < currentGuess.length ? styles.slot_filled : ''}`}>
                            {currentGuess[i] || '.'}
                        </div>
                    ))}
                </div>
            </div>

            {/* Keypad */}
            {!gameOver && (
                <div className={styles.keypad_container}>
                    <div className={styles.key_grid}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => {
                            const isUsed = currentGuess.includes(num.toString());
                            return (
                                <button
                                    key={num}
                                    onClick={() => handleDigitClick(num.toString())}
                                    disabled={isUsed}
                                    className={`${styles.num_key} ${isUsed ? styles.num_key_disabled : ''}`}
                                >
                                    {num}
                                </button>
                            );
                        })}
                    </div>
                    <div className={styles.action_row}>
                        <button
                            onClick={handleBackspace}
                            className={`${styles.action_btn} ${styles.delete_btn}`}
                        >
                            <span>⌫</span> 削除
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={currentGuess.length !== DIGIT_COUNT}
                            className={`${styles.action_btn} ${currentGuess.length === DIGIT_COUNT ? styles.enter_btn : styles.enter_btn_disabled}`}
                        >
                            決定 ↵
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
