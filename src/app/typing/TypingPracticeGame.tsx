'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    playRankReveal() {
        const ctx = this.getCtx(); if (!ctx) return;
        const t = ctx.currentTime;
        [523, 659, 784, 1047].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.25, t + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.4);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(t + i * 0.12); osc.stop(t + i * 0.12 + 0.4);
        });
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
        const newConfirmed = confirmedRomaji + pendingCompletion;
        const newChunkIndex = chunkIndex + 1;
        if (newChunkIndex >= word.patterns.length) {
            const ns = advanceToChunk(word, newChunkIndex, newConfirmed);
            return { newState: ns, matched: true, wordCompleted: true };
        }
        const nextChunkState = advanceToChunk(word, newChunkIndex, newConfirmed);
        return processKey(nextChunkState, key);
    }

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

// ─── Difficulty Configuration ───
type Difficulty = 'easy' | 'normal' | 'hard';

interface DifficultyConfig {
    label: string;
    emoji: string;
    description: string;
    color: string;
    gradient: string;
    minKana: number;
    maxKana: number;
    duration: number;          // seconds
    scorePerKey: number;
    comboBonus: number;        // extra per combo level
    wordBonus: number;         // bonus per word completed
    ranks: { score: number; rank: string; color: string }[];
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
    easy: {
        label: 'かんたん',
        emoji: '🍵',
        description: '短い単語でウォーミングアップ！\n初心者におすすめ',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981, #059669)',
        minKana: 2,
        maxKana: 5,
        duration: 60,
        scorePerKey: 10,
        comboBonus: 2,
        wordBonus: 50,
        ranks: [
            { score: 3000, rank: 'S', color: '#fbbf24' },
            { score: 2000, rank: 'A', color: '#f97316' },
            { score: 1200, rank: 'B', color: '#3b82f6' },
            { score: 600, rank: 'C', color: '#6b7280' },
        ]
    },
    normal: {
        label: 'ふつう',
        emoji: '🍜',
        description: '中くらいの単語に挑戦！\n腕試しにちょうどいい難易度',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        minKana: 5,
        maxKana: 9,
        duration: 60,
        scorePerKey: 12,
        comboBonus: 3,
        wordBonus: 80,
        ranks: [
            { score: 4000, rank: 'S', color: '#fbbf24' },
            { score: 2500, rank: 'A', color: '#f97316' },
            { score: 1500, rank: 'B', color: '#3b82f6' },
            { score: 800, rank: 'C', color: '#6b7280' },
        ]
    },
    hard: {
        label: 'むずかしい',
        emoji: '🔥',
        description: '長文・ことわざ・専門用語！\n上級者向けチャレンジ',
        color: '#ef4444',
        gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
        minKana: 9,
        maxKana: 999,
        duration: 90,
        scorePerKey: 15,
        comboBonus: 5,
        wordBonus: 120,
        ranks: [
            { score: 5000, rank: 'S', color: '#fbbf24' },
            { score: 3500, rank: 'A', color: '#f97316' },
            { score: 2000, rank: 'B', color: '#3b82f6' },
            { score: 1000, rank: 'C', color: '#6b7280' },
        ]
    }
};

function getRank(score: number, config: DifficultyConfig): { rank: string; color: string } {
    for (const r of config.ranks) {
        if (score >= r.score) return r;
    }
    return { rank: 'D', color: '#9ca3af' };
}

export default function TypingPracticeGame({ onBack }: TypingPracticeGameProps) {
    const [phase, setPhase] = useState<'menu' | 'countdown' | 'playing' | 'finished'>('menu');
    const [difficulty, setDifficulty] = useState<Difficulty>('normal');
    const [engine, setEngine] = useState<TypingEngineState | null>(null);
    const [nextWord, setNextWord] = useState<TypingWord | null>(null);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [totalTyped, setTotalTyped] = useState(0);
    const [missCount, setMissCount] = useState(0);
    const [wordsCompleted, setWordsCompleted] = useState(0);
    const [score, setScore] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(60);
    const [countdown, setCountdown] = useState(3);
    const [showRank, setShowRank] = useState(false);

    const config = DIFFICULTY_CONFIGS[difficulty];

    // Filter words by difficulty
    const wordPool = useMemo(() => {
        const filtered = TYPING_WORDS.filter(w =>
            w.kana.length >= config.minKana && w.kana.length <= config.maxKana && w.patterns.length > 0
        );
        return filtered.length > 0 ? filtered : TYPING_WORDS.filter(w => w.patterns.length > 0);
    }, [config.minKana, config.maxKana]);

    const pickRandom = useCallback(() => wordPool[Math.floor(Math.random() * wordPool.length)], [wordPool]);

    const startGame = (diff: Difficulty) => {
        const cfg = DIFFICULTY_CONFIGS[diff];
        setDifficulty(diff);
        setCombo(0); setMaxCombo(0); setTotalTyped(0); setMissCount(0);
        setWordsCompleted(0); setScore(0); setShowRank(false);
        setTimeRemaining(cfg.duration);
        // We need to wait for wordPool to update, so we filter inline here
        const pool = TYPING_WORDS.filter(w =>
            w.kana.length >= cfg.minKana && w.kana.length <= cfg.maxKana && w.patterns.length > 0
        );
        const actualPool = pool.length > 0 ? pool : TYPING_WORDS.filter(w => w.patterns.length > 0);
        const pick = () => actualPool[Math.floor(Math.random() * actualPool.length)];
        const w = pick();
        setEngine(initEngine(w));
        setNextWord(pick());
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
                if (prev <= 1) {
                    clearInterval(timer);
                    setPhase('finished');
                    setTimeout(() => {
                        setShowRank(true);
                        typingSound.playRankReveal();
                    }, 600);
                    return 0;
                }
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
                setScore(prev => {
                    const comboMul = Math.min(combo, 30);
                    return prev + config.scorePerKey + (comboMul * config.comboBonus);
                });
                if (wordCompleted) {
                    typingSound.playWordComplete();
                    const nw = nextWord!;
                    setEngine(initEngine(nw));
                    setNextWord(pickRandom());
                    setCombo(prev => { const nc = prev + 1; setMaxCombo(mc => Math.max(mc, nc)); return nc; });
                    setWordsCompleted(prev => prev + 1);
                    setScore(prev => prev + config.wordBonus);
                } else {
                    setEngine(newState);
                }
            } else {
                typingSound.playMiss();
                setMissCount(prev => prev + 1);
                setCombo(0);
                setScore(prev => Math.max(0, prev - 5));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase, engine, nextWord, pickRandom, combo, config]);

    const elapsed = config.duration - timeRemaining;
    const wpm = elapsed > 0 ? Math.round((totalTyped / 5) / (elapsed / 60)) : 0;
    const accuracy = totalTyped + missCount > 0 ? Math.round((totalTyped / (totalTyped + missCount)) * 100) : 100;
    const rankInfo = getRank(score, config);
    const progressPercent = ((config.duration - timeRemaining) / config.duration) * 100;

    return (
        <div className={styles.main}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={onBack}>← 戻る</button>
                {phase === 'playing' && (
                    <>
                        <div className={styles.timer} style={{ color: timeRemaining <= 10 ? '#ef4444' : undefined, fontWeight: timeRemaining <= 10 ? 800 : undefined }}>
                            ⏱ {timeRemaining}s
                        </div>
                        <div style={{ color: config.color, fontSize: '0.85rem', fontWeight: 600 }}>
                            {config.emoji} {config.label}
                        </div>
                    </>
                )}
            </div>

            {/* Playing Phase */}
            {phase === 'playing' && engine && (
                <div className={styles.battleArea}>
                    {/* Progress Bar */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                        background: '#1e293b',
                    }}>
                        <div style={{
                            height: '100%', width: `${progressPercent}%`,
                            background: timeRemaining <= 10 ? '#ef4444' : config.gradient,
                            transition: 'width 1s linear, background 0.3s',
                        }} />
                    </div>

                    {/* Score Display */}
                    <div style={{
                        position: 'absolute', top: '16px', right: '24px',
                        textAlign: 'right',
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: config.color, fontFamily: 'monospace' }}>
                            {score.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>SCORE</div>
                    </div>

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
                        <span className={styles.statCombo} style={{ color: combo >= 10 ? '#fbbf24' : combo >= 5 ? '#f97316' : undefined }}>
                            🔥 {combo} combo
                        </span>
                        <span className={styles.statScore}>WPM: {wpm}</span>
                        <span className={styles.statMiss}>正確率: {accuracy}%</span>
                    </div>
                </div>
            )}

            {/* Countdown Phase */}
            {phase === 'countdown' && (
                <div className={styles.overlay}>
                    <div style={{ fontSize: '0.9rem', color: config.color, fontWeight: 700, marginBottom: '0.5rem' }}>
                        {config.emoji} {config.label}コース
                    </div>
                    <div className={styles.countdownNum}>{countdown}</div>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>準備してください...</p>
                </div>
            )}

            {/* Menu Phase - Difficulty Selection */}
            {phase === 'menu' && (
                <div className={styles.overlay}>
                    <h1 className={styles.overlayTitle}>⌨️ タイピング練習</h1>
                    <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem', maxWidth: 440, textAlign: 'center', lineHeight: 1.6 }}>
                        制限時間内にできるだけ多くの単語をタイプして<br />ハイスコアを目指そう！
                    </p>

                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: '1rem',
                        width: '100%', maxWidth: '400px',
                    }}>
                        {(['easy', 'normal', 'hard'] as Difficulty[]).map(diff => {
                            const cfg = DIFFICULTY_CONFIGS[diff];
                            const poolSize = TYPING_WORDS.filter(w =>
                                w.kana.length >= cfg.minKana && w.kana.length <= cfg.maxKana && w.patterns.length > 0
                            ).length;
                            return (
                                <button
                                    key={diff}
                                    onClick={() => startGame(diff)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: `2px solid ${cfg.color}40`,
                                        borderRadius: '16px',
                                        padding: '1.25rem 1.5rem',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        transition: 'all 0.2s',
                                        color: 'inherit', textAlign: 'left',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = `${cfg.color}15`;
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = cfg.color;
                                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = `${cfg.color}40`;
                                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{
                                        fontSize: '2rem', width: '56px', height: '56px',
                                        borderRadius: '14px', background: cfg.gradient,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        {cfg.emoji}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.25rem' }}>
                                            {cfg.label}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                                            {cfg.description}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
                                            ⏱ {cfg.duration}秒 ・ 📝 {poolSize}語
                                        </div>
                                    </div>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" style={{ flexShrink: 0 }}>
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
                            );
                        })}
                    </div>

                    <p style={{ color: '#4a5568', fontSize: '0.75rem', marginTop: '1.5rem', textAlign: 'center', lineHeight: 1.5 }}>
                        💡 「し」= si / shi、「ち」= ti / chi など<br />どんな打ち方でもOK！
                    </p>
                </div>
            )}

            {/* Result Phase */}
            {phase === 'finished' && (
                <div className={styles.overlay}>
                    <div style={{ fontSize: '0.9rem', color: config.color, fontWeight: 700, marginBottom: '0.5rem' }}>
                        {config.emoji} {config.label}コース 結果
                    </div>

                    {/* Rank Badge */}
                    <div style={{
                        width: '120px', height: '120px',
                        borderRadius: '50%',
                        background: showRank ? `${rankInfo.color}20` : '#1e293b',
                        border: `4px solid ${showRank ? rankInfo.color : '#334155'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '1rem',
                        transition: 'all 0.6s ease-out',
                        boxShadow: showRank ? `0 0 40px ${rankInfo.color}30` : 'none',
                    }}>
                        <span style={{
                            fontSize: showRank ? '3.5rem' : '0',
                            fontWeight: 900,
                            color: rankInfo.color,
                            transition: 'all 0.4s ease-out',
                            opacity: showRank ? 1 : 0,
                            transform: showRank ? 'scale(1)' : 'scale(0.3)',
                        }}>
                            {rankInfo.rank}
                        </span>
                    </div>

                    {/* Score */}
                    <div style={{
                        fontSize: '2.5rem', fontWeight: 900, color: '#e2e8f0',
                        fontFamily: 'monospace', marginBottom: '0.25rem',
                    }}>
                        {score.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
                        SCORE
                    </div>

                    {/* Stats Grid */}
                    <div className={styles.resultGrid}>
                        <div className={styles.resultItem}>
                            <span className={styles.resultLabel}>WPM</span>
                            <span className={styles.resultValue}>{wpm}</span>
                        </div>
                        <div className={styles.resultItem}>
                            <span className={styles.resultLabel}>タイプ数</span>
                            <span className={styles.resultValue}>{totalTyped}</span>
                        </div>
                        <div className={styles.resultItem}>
                            <span className={styles.resultLabel}>単語数</span>
                            <span className={styles.resultValue}>{wordsCompleted}</span>
                        </div>
                        <div className={styles.resultItem}>
                            <span className={styles.resultLabel}>最大コンボ</span>
                            <span className={styles.resultValue}>{maxCombo}</span>
                        </div>
                        <div className={styles.resultItem}>
                            <span className={styles.resultLabel}>正確率</span>
                            <span className={styles.resultValue}>{accuracy}%</span>
                        </div>
                        <div className={styles.resultItem}>
                            <span className={styles.resultLabel}>ミス</span>
                            <span className={styles.resultValue}>{missCount}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className={styles.actionButton} onClick={() => startGame(difficulty)}>もう一度</button>
                        <button className={styles.actionButton} style={{ background: '#475569' }} onClick={() => setPhase('menu')}>コース選択</button>
                        <button className={styles.actionButton} style={{ background: '#94a3b8' }} onClick={onBack}>戻る</button>
                    </div>
                </div>
            )}
        </div>
    );
}
