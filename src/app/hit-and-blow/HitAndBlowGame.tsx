'use client';

import React, { useState, useEffect, useRef } from 'react';
import { generateSecret, checkGuess, GuessRecord, COLORS } from './utils';
import styles from './HitAndBlow.module.css';

const DIGIT_COUNT = 4;
const MAX_ATTEMPTS = 10;

export default function SoloHitAndBlowGame() {
    const [secret, setSecret] = useState<string>('');
    const [currentGuess, setCurrentGuess] = useState<string>('');
    const [history, setHistory] = useState<GuessRecord[]>([]);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [won, setWon] = useState<boolean>(false);
    const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);

    const historyEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        startNewGame(allowDuplicates);
    }, []);

    useEffect(() => {
        if (historyEndRef.current) {
            historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history]);

    const startNewGame = (duplicates: boolean = allowDuplicates) => {
        setSecret(generateSecret(DIGIT_COUNT, duplicates));
        setCurrentGuess('');
        setHistory([]);
        setGameOver(false);
        setWon(false);
    };

    const handleModeToggle = () => {
        const newMode = !allowDuplicates;
        setAllowDuplicates(newMode);
        startNewGame(newMode);
    };

    const handleColorClick = (colorInitial: string) => {
        if (gameOver || currentGuess.length >= DIGIT_COUNT) return;
        if (!allowDuplicates && currentGuess.includes(colorInitial)) return;
        setCurrentGuess((prev) => prev + colorInitial);
    };

    const handleBackspace = () => {
        if (gameOver) return;
        setCurrentGuess((prev) => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if (gameOver || currentGuess.length !== DIGIT_COUNT) return;

        const result = checkGuess(secret, currentGuess);
        const newRecord: GuessRecord = { guess: currentGuess, result, player: 'P1' };

        const newHistory = [...history, newRecord];
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '1.5rem' }}>
            {/* Solo Menu / Info */}
            <div className={styles.status_panel}>
                {gameOver ? (
                    <div className={styles.gameOverAnimation}>
                        <h2 className={won ? styles.game_over_win : styles.game_over_loss}>
                            {won ? 'Congratulations!' : 'Game Over'}
                        </h2>
                        <div className={styles.secret_reveal}>
                            正解:
                            <div className={styles.guess_colors}>
                                {secret.split('').map((char, i) => (
                                    <div key={i} className={styles.circle + ' ' + styles[`circle_${char}`]} />
                                ))}
                            </div>
                        </div>
                        <button onClick={() => startNewGame()} className={styles.play_again_btn}>もう一度プレイ</button>
                    </div>
                ) : (
                    <div>
                        <div className={styles.current_turn} style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                            残り回数: {MAX_ATTEMPTS - history.length}
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                            <label style={{ fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <input type="checkbox" checked={allowDuplicates} onChange={handleModeToggle} disabled={history.length > 0} />
                                重複ありモード
                            </label>
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
                                <div key={i} className={`${styles.history_dot} ${styles['circle_' + char]}`} />
                            ))}
                        </div>
                        <div className={`${styles.result_badge} ${styles.hit_badge}`}>{record.result.hit}</div>
                        <div className={`${styles.result_badge} ${styles.blow_badge}`}>{record.result.blow}</div>
                    </div>
                ))}
                {history.length === 0 && !gameOver && <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>履歴がありません</div>}
                <div ref={historyEndRef} />
            </div>

            {/* Input */}
            <div className={styles.input_display}>
                <div className={styles.input_slots}>
                    {Array.from({ length: DIGIT_COUNT }).map((_, i) => {
                        const char = currentGuess[i];
                        return (
                            <div key={i} className={`${styles.slot} ${char ? styles.slot_filled : ''}`}>
                                {char && <div className={`${styles.circle} ${styles['circle_' + char]}`} />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {!gameOver && (
                <div className={styles.keypad_container}>
                    <div className={styles.color_grid}>
                        {COLORS.map((color) => {
                            const char = color[0];
                            const isUsed = !allowDuplicates && currentGuess.includes(char);
                            return (
                                <button key={color} onClick={() => handleColorClick(char)} disabled={isUsed} className={`${styles.color_btn} ${styles[`circle_${char}`]}`} />
                            );
                        })}
                    </div>
                    <div className={styles.action_row}>
                        <button onClick={handleBackspace} className={styles.action_btn}>⌫</button>
                        <button onClick={handleSubmit} disabled={currentGuess.length !== DIGIT_COUNT} className={`${styles.action_btn} ${styles.enter_btn}`}>ENTER</button>
                    </div>
                </div>
            )}
        </div>
    );
}
