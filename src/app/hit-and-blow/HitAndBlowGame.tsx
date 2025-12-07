'use client';

import React, { useState, useEffect, useRef } from 'react';
import { generateSecret, checkGuess, GuessRecord, COLORS } from './utils';
import styles from './HitAndBlow.module.css';
import { db } from '@/lib/firebase';
import { ref, onValue, update, set, push, get, child } from 'firebase/database';

const DIGIT_COUNT = 4;
const MAX_ATTEMPTS = 10;

interface HitAndBlowGameProps {
    roomId?: string | null;
    myRole?: 'P1' | 'P2' | null;
    onLeave?: () => void;
}

export default function HitAndBlowGame({ roomId, myRole, onLeave }: HitAndBlowGameProps) {
    const [secret, setSecret] = useState<string>('');
    const [currentGuess, setCurrentGuess] = useState<string>('');
    const [history, setHistory] = useState<GuessRecord[]>([]);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [won, setWon] = useState<boolean>(false);
    const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);

    // Multiplayer specific
    const [turn, setTurn] = useState<'P1' | 'P2'>('P1');
    const [winner, setWinner] = useState<'P1' | 'P2' | null>(null);
    const [opponentName, setOpponentName] = useState('Opponent');

    // For auto-scroll
    const historyEndRef = useRef<HTMLDivElement>(null);

    // Initial Start
    useEffect(() => {
        if (!roomId) {
            // Single Player
            startNewGame(allowDuplicates);
        }
    }, [roomId]);

    // Multiplayer Sync
    useEffect(() => {
        if (!roomId || !myRole) return;

        const roomRef = ref(db, `hit_and_blow_rooms/${roomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            if (data.secret) setSecret(data.secret);
            if (data.history) setHistory(data.history);
            else setHistory([]);

            if (data.turn) setTurn(data.turn);
            if (data.winner) {
                setWinner(data.winner);
                setGameOver(true);
                setWon(data.winner === myRole);
            }
            if (data.allowDuplicates !== undefined) setAllowDuplicates(data.allowDuplicates);

            // Opponent Name
            const oppRole = myRole === 'P1' ? 'P2' : 'P1';
            if (data[oppRole]?.name) setOpponentName(data[oppRole].name);
        });

        return () => unsubscribe();
    }, [roomId, myRole]);

    useEffect(() => {
        if (historyEndRef.current) {
            historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history]);

    const startNewGame = async (duplicates: boolean = allowDuplicates) => {
        if (roomId) {
            // Only P1 can restart? Or disable restart in MP?
            // Usually Rematch logic. For now, let's just allow reset if P1.
            if (myRole === 'P1') {
                const newSecret = generateSecret(DIGIT_COUNT, duplicates);
                await update(ref(db, `hit_and_blow_rooms/${roomId}`), {
                    secret: newSecret,
                    history: [],
                    turn: 'P1',
                    winner: null,
                    allowDuplicates: duplicates
                });
            }
        } else {
            setSecret(generateSecret(DIGIT_COUNT, duplicates));
            setCurrentGuess('');
            setHistory([]);
            setGameOver(false);
            setWon(false);
            setWinner(null);
        }
    };

    const handleModeToggle = () => {
        const newMode = !allowDuplicates;
        setAllowDuplicates(newMode);
        startNewGame(newMode);
    };

    const handleColorClick = (colorInitial: string) => {
        if (gameOver || currentGuess.length >= DIGIT_COUNT) return;
        if (roomId && turn !== myRole) return; // Not my turn
        if (!allowDuplicates && currentGuess.includes(colorInitial)) return;
        setCurrentGuess((prev) => prev + colorInitial);
    };

    const handleBackspace = () => {
        if (gameOver) return;
        setCurrentGuess((prev) => prev.slice(0, -1));
    };

    const handleSubmit = async () => {
        if (gameOver || currentGuess.length !== DIGIT_COUNT) return;
        if (roomId && turn !== myRole) return;

        const result = checkGuess(secret, currentGuess);
        const newRecord = { guess: currentGuess, result, player: myRole || 'P1' }; // Add player field to record

        if (roomId) {
            // Firebase Update
            const newHistory = [...history, newRecord];
            const nextTurn = turn === 'P1' ? 'P2' : 'P1';
            let updates: any = {
                history: newHistory,
                turn: nextTurn
            };

            if (result.hit === DIGIT_COUNT) {
                updates.winner = myRole;
            }

            await update(ref(db, `hit_and_blow_rooms/${roomId}`), updates);
            setCurrentGuess('');
        } else {
            // Single Player
            const newHistory = [...history, newRecord];
            setHistory(newHistory);
            setCurrentGuess('');

            if (result.hit === DIGIT_COUNT) {
                setWon(true);
                setGameOver(true);
            } else if (newHistory.length >= MAX_ATTEMPTS) {
                setGameOver(true);
            }
        }
    };

    const isMyTurn = !roomId || turn === myRole;

    return (
        <div className={styles.container}>
            {/* Header info for Multiplayer */}
            {roomId && (
                <div style={{ marginBottom: '1rem', width: '100%', textAlign: 'center', background: '#edf2f7', padding: '0.5rem', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', color: isMyTurn ? '#2e7d32' : '#718096' }}>
                        {winner ? (winner === myRole ? 'YOU WIN!' : 'LOSE...') : isMyTurn ? 'あなたの番です' : `${opponentName}の番です`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>Room: {roomId}</div>
                </div>
            )}

            {roomId && opponentName === 'Opponent' && (
                <div className={styles.waiting_overlay}>
                    <div className={styles.spinner}></div>
                    <p>対戦相手を待っています...</p>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>Room ID: {roomId}</p>
                </div>
            )}

            {/* Mode Toggle (Only P1 or Single) */}
            {(!roomId || myRole === 'P1') && (
                <div className={styles.mode_toggle_container}>
                    <label className={styles.toggle_label}>
                        <input
                            type="checkbox"
                            checked={allowDuplicates}
                            onChange={handleModeToggle}
                            disabled={!!roomId && history.length > 0} // Lock if game started
                        />
                        重複ありモード
                    </label>
                </div>
            )}

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
                            onClick={() => startNewGame()}
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
                            const isUsed = !allowDuplicates && currentGuess.includes(char);
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
