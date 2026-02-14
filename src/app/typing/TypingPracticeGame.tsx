'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './Typing.module.css';
import { TYPING_WORDS, TypingWord } from '@/lib/typing/data';

interface TypingPracticeGameProps {
    onBack: () => void;
}

// ─── Typing Sound System ───
class TypingSoundManager {
    private ctx: AudioContext | null = null;
    getCtx(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        return this.ctx;
    }
    playType() {
        const ctx = this.getCtx(); if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200 + Math.random() * 300, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.04);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.07);
    }
    playWordComplete() {
        const ctx = this.getCtx(); if (!ctx) return;
        const t = ctx.currentTime;
        [660, 880, 1100].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, t + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.2);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.2);
        });
    }
    playMiss() {
        const ctx = this.getCtx(); if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.08);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.12);
    }
}
const typingSound = new TypingSoundManager();

// ─── Multi-romaji engine with deferred completion for ん ───
interface TypingEngineState {
    word: TypingWord;
    chunkIndex: number;
    charIndex: number;
    validPatterns: string[];
    confirmedRomaji: string;
    currentTyped: string;
    currentRemaining: string;
    futureRomaji: string;
    pendingCompletion: string | null;
}

function buildFutureRomaji(word: TypingWord, fromChunk: number): string {
    return word.patterns.slice(fromChunk).map(p => p[0]).join('');
}

function initEngine(word: TypingWord): TypingEngineState {
    const firstPatterns = word.patterns[0] || [''];
    const defaultPattern = firstPatterns[0];
    return {
        word, chunkIndex: 0, charIndex: 0,
        validPatterns: [...firstPatterns],
        confirmedRomaji: '',
        currentTyped: '',
        currentRemaining: defaultPattern,
        futureRomaji: buildFutureRomaji(word, 1),
        pendingCompletion: null,
    };
}

function advanceToChunk(word: TypingWord, newChunkIndex: number, newConfirmed: string): TypingEngineState {
    if (newChunkIndex >= word.patterns.length) {
        return {
            word, chunkIndex: newChunkIndex, charIndex: 0, validPatterns: [],
            confirmedRomaji: newConfirmed, currentTyped: '', currentRemaining: '',
            futureRomaji: '', pendingCompletion: null,
        };
    }
    const nextPatterns = word.patterns[newChunkIndex];
    const nextDefault = nextPatterns[0];
    return {
        word, chunkIndex: newChunkIndex, charIndex: 0,
        validPatterns: [...nextPatterns],
        confirmedRomaji: newConfirmed,
        currentTyped: '',
        currentRemaining: nextDefault,
        futureRomaji: buildFutureRomaji(word, newChunkIndex + 1),
        pendingCompletion: null,
    };
}

function processKey(state: TypingEngineState, key: string): { newState: TypingEngineState, matched: boolean, wordCompleted: boolean } {
    const { word, chunkIndex, charIndex, validPatterns, confirmedRomaji, pendingCompletion } = state;

    // Case 1: Pending completion (e.g., 'n' for ん, waiting for 'nn')
    if (pendingCompletion !== null) {
        const stillValid = validPatterns.filter(p => p.length > charIndex && p[charIndex] === key);

        if (stillValid.length > 0) {
            const newCharIndex = charIndex + 1;
            const completedNow = stillValid.find(p => p.length === newCharIndex);

            if (completedNow) {
                const longerStill = stillValid.filter(p => p.length > newCharIndex);
                if (longerStill.length > 0) {
                    return {
                        newState: { ...state, charIndex: newCharIndex, validPatterns: stillValid, pendingCompletion: completedNow, currentTyped: completedNow, currentRemaining: '' },
                        matched: true, wordCompleted: false
                    };
                }
                const newConfirmed = confirmedRomaji + completedNow;
                const newChunkIndex = chunkIndex + 1;
                const ns = advanceToChunk(word, newChunkIndex, newConfirmed);
                return { newState: ns, matched: true, wordCompleted: newChunkIndex >= word.patterns.length };
            }

            const bestPattern = stillValid[0];
            return {
                newState: { ...state, charIndex: newCharIndex, validPatterns: stillValid, currentTyped: bestPattern.slice(0, newCharIndex), currentRemaining: bestPattern.slice(newCharIndex) },
                matched: true, wordCompleted: false
            };
        }

        // Use pending completion, try key on next chunk
        const newConfirmed = confirmedRomaji + pendingCompletion;
        const newChunkIndex = chunkIndex + 1;
        if (newChunkIndex >= word.patterns.length) {
            const ns = advanceToChunk(word, newChunkIndex, newConfirmed);
            return { newState: ns, matched: true, wordCompleted: true };
        }
        const nextChunkState = advanceToChunk(word, newChunkIndex, newConfirmed);
        return processKey(nextChunkState, key);
    }

    // Case 2: Normal processing
    const stillValid = validPatterns.filter(p => p.length > charIndex && p[charIndex] === key);
    if (stillValid.length === 0) return { newState: state, matched: false, wordCompleted: false };

    const newCharIndex = charIndex + 1;
    const completedPattern = stillValid.find(p => p.length === newCharIndex);

    if (completedPattern) {
        const longerAlternatives = stillValid.filter(p => p.length > newCharIndex);
        if (longerAlternatives.length > 0) {
            return {
                newState: { ...state, charIndex: newCharIndex, validPatterns: stillValid, pendingCompletion: completedPattern, currentTyped: completedPattern, currentRemaining: '' },
                matched: true, wordCompleted: false
            };
        }
        const newConfirmed = confirmedRomaji + completedPattern;
        const newChunkIndex = chunkIndex + 1;
        const ns = advanceToChunk(word, newChunkIndex, newConfirmed);
        return { newState: ns, matched: true, wordCompleted: newChunkIndex >= word.patterns.length };
    }

    const bestPattern = stillValid[0];
    return {
        newState: { ...state, charIndex: newCharIndex, validPatterns: stillValid, currentTyped: bestPattern.slice(0, newCharIndex), currentRemaining: bestPattern.slice(newCharIndex), pendingCompletion: null },
        matched: true, wordCompleted: false
    };
}

const PRACTICE_DURATION = 60;

export default function TypingPracticeGame({ onBack }: TypingPracticeGameProps) {
    const [phase, setPhase] = useState<'idle' | 'countdown' | 'playing' | 'finished'>('idle');
    const [engine, setEngine] = useState<TypingEngineState | null>(null);
    const [nextWord, setNextWord] = useState<TypingWord | null>(null);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [totalTyped, setTotalTyped] = useState(0);
    const [missCount, setMissCount] = useState(0);
    const [wordsCompleted, setWordsCompleted] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(PRACTICE_DURATION);
    const [countdown, setCountdown] = useState(3);

    const pickRandom = useCallback(() => TYPING_WORDS[Math.floor(Math.random() * TYPING_WORDS.length)], []);

    const startGame = () => {
        setCombo(0); setMaxCombo(0); setTotalTyped(0); setMissCount(0); setWordsCompleted(0); setTimeRemaining(PRACTICE_DURATION);
        const w = pickRandom();
        setEngine(initEngine(w));
        setNextWord(pickRandom());
        setCountdown(3);
        setPhase('countdown');

        let count = 3;
        const timer = setInterval(() => {
            count--;
            setCountdown(count);
            if (count <= 0) { clearInterval(timer); setPhase('playing'); }
        }, 1000);
    };

    useEffect(() => {
        if (phase !== 'playing') return;
        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) { clearInterval(timer); setPhase('finished'); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [phase]);

    useEffect(() => {
        if (phase !== 'playing' || !engine) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.length > 1) return;
            const key = e.key.toLowerCase();
            if (key.length !== 1) return;

            const { newState, matched, wordCompleted } = processKey(engine, key);
            if (matched) {
                typingSound.playType();
                setTotalTyped(prev => prev + 1);
                if (wordCompleted) {
                    typingSound.playWordComplete();
                    const nw = nextWord!;
                    setEngine(initEngine(nw));
                    setNextWord(pickRandom());
                    setCombo(prev => { const nc = prev + 1; setMaxCombo(mc => Math.max(mc, nc)); return nc; });
                    setWordsCompleted(prev => prev + 1);
                } else {
                    setEngine(newState);
                }
            } else {
                typingSound.playMiss();
                setMissCount(prev => prev + 1);
                setCombo(0);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase, engine, nextWord, pickRandom]);

    const elapsed = PRACTICE_DURATION - timeRemaining;
    const wpm = elapsed > 0 ? Math.round((totalTyped / 5) / (elapsed / 60)) : 0;
    const accuracy = totalTyped + missCount > 0 ? Math.round((totalTyped / (totalTyped + missCount)) * 100) : 100;

    return (
        <div className={styles.main}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={onBack}>← 戻る</button>
                <div className={styles.timer}>⏱ {timeRemaining}s</div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>練習モード</div>
            </div>

            {phase === 'playing' && engine && (
                <div className={styles.battleArea}>
                    <div className={styles.wordArea}>
                        <div className={styles.displayWord}>{engine.word.display}</div>
                        <div className={styles.kanaReading}>{engine.word.kana}</div>
                        <div className={styles.romajiLine}>
                            <span className={styles.romajiTyped}>{engine.confirmedRomaji}</span>
                            <span className={styles.romajiTyped}>{engine.currentTyped}</span>
                            <span className={styles.romajiRemaining}>{engine.currentRemaining}</span>
                            <span className={styles.romajiRemaining}>{engine.futureRomaji}</span>
                        </div>
                    </div>
                    {nextWord && <div className={styles.nextHint}>NEXT: {nextWord.display}</div>}
                    <div className={styles.statsBar}>
                        <span className={styles.statCombo}>🔥 {combo} combo</span>
                        <span className={styles.statScore}>WPM: {wpm}</span>
                        <span className={styles.statMiss}>正確率: {accuracy}%</span>
                    </div>
                </div>
            )}

            {phase === 'countdown' && (
                <div className={styles.overlay}>
                    <div className={styles.countdownNum}>{countdown}</div>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>準備してください...</p>
                </div>
            )}

            {phase === 'idle' && (
                <div className={styles.overlay}>
                    <h1 className={styles.overlayTitle}>⌨️ タイピング練習</h1>
                    <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1rem', maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
                        60秒間でできるだけ多くの単語をタイプしよう！<br />
                        「し」= si / shi、「ち」= ti / chi など<br />どんな打ち方でもOK！
                    </p>
                    <button className={styles.actionButton} onClick={startGame}>スタート！</button>
                </div>
            )}

            {phase === 'finished' && (
                <div className={styles.overlay}>
                    <div className={styles.resultWin}>⌨️ 結果発表</div>
                    <div className={styles.resultGrid}>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>WPM</span><span className={styles.resultValue}>{wpm}</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>Typed</span><span className={styles.resultValue}>{totalTyped}</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>Words</span><span className={styles.resultValue}>{wordsCompleted}</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>Max Combo</span><span className={styles.resultValue}>{maxCombo}</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>Accuracy</span><span className={styles.resultValue}>{accuracy}%</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>Miss</span><span className={styles.resultValue}>{missCount}</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className={styles.actionButton} onClick={startGame}>もう一度</button>
                        <button className={styles.actionButton} style={{ background: '#94a3b8' }} onClick={onBack}>戻る</button>
                    </div>
                </div>
            )}
        </div>
    );
}
