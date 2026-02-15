'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './Typing.module.css';
import { TYPING_WORDS, TypingWord } from '@/lib/typing/data';

interface TypingPracticeGameProps {
    onBack: () => void;
}

// ─── SVG Icon Components ───
const IconKeyboard = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" /><line x1="6" y1="8" x2="6" y2="8" /><line x1="10" y1="8" x2="10" y2="8" />
        <line x1="14" y1="8" x2="14" y2="8" /><line x1="18" y1="8" x2="18" y2="8" /><line x1="6" y1="12" x2="6" y2="12" />
        <line x1="10" y1="12" x2="10" y2="12" /><line x1="14" y1="12" x2="14" y2="12" /><line x1="18" y1="12" x2="18" y2="12" />
        <line x1="8" y1="16" x2="16" y2="16" />
    </svg>
);

const IconLeaf = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 2 20 2s-1.7 5.6-6 9.3" /><path d="M4 22c1-6 6-12 6-12" />
    </svg>
);

const IconZap = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

const IconFlame = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
);

const IconTrophy = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" /><path d="M10 22V18a2 2 0 0 1 4 0v4" />
        <rect x="6" y="2" width="12" height="10" rx="2" />
    </svg>
);

const IconArrowLeft = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);

const IconChevronRight = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const IconClock = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);

const IconTarget = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
);

const IconCombo = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

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
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
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
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, t + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.2);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.2);
        });
    }
    playMiss() {
        const ctx = this.getCtx(); if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
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
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.25, t + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.4);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(t + i * 0.12); osc.stop(t + i * 0.12 + 0.4);
        });
    }
}
const typingSound = new TypingSoundManager();

// ─── Multi-romaji engine ───
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
    return {
        word, chunkIndex: 0, charIndex: 0,
        validPatterns: [...firstPatterns],
        confirmedRomaji: '', currentTyped: '',
        currentRemaining: firstPatterns[0],
        futureRomaji: buildFutureRomaji(word, 1),
        pendingCompletion: null,
    };
}

function advanceToChunk(word: TypingWord, ci: number, confirmed: string): TypingEngineState {
    if (ci >= word.patterns.length) {
        return { word, chunkIndex: ci, charIndex: 0, validPatterns: [], confirmedRomaji: confirmed, currentTyped: '', currentRemaining: '', futureRomaji: '', pendingCompletion: null };
    }
    const np = word.patterns[ci];
    return {
        word, chunkIndex: ci, charIndex: 0, validPatterns: [...np],
        confirmedRomaji: confirmed, currentTyped: '', currentRemaining: np[0],
        futureRomaji: buildFutureRomaji(word, ci + 1), pendingCompletion: null,
    };
}

function processKey(state: TypingEngineState, key: string): { newState: TypingEngineState; matched: boolean; wordCompleted: boolean } {
    const { word, chunkIndex, charIndex, validPatterns, confirmedRomaji, pendingCompletion } = state;

    if (pendingCompletion !== null) {
        const sv = validPatterns.filter(p => p.length > charIndex && p[charIndex] === key);
        if (sv.length > 0) {
            const nci = charIndex + 1;
            const done = sv.find(p => p.length === nci);
            if (done) {
                const longer = sv.filter(p => p.length > nci);
                if (longer.length > 0) return { newState: { ...state, charIndex: nci, validPatterns: sv, pendingCompletion: done, currentTyped: done, currentRemaining: '' }, matched: true, wordCompleted: false };
                const nc = confirmedRomaji + done;
                const nextCI = chunkIndex + 1;
                return { newState: advanceToChunk(word, nextCI, nc), matched: true, wordCompleted: nextCI >= word.patterns.length };
            }
            const bp = sv[0];
            return { newState: { ...state, charIndex: nci, validPatterns: sv, currentTyped: bp.slice(0, nci), currentRemaining: bp.slice(nci) }, matched: true, wordCompleted: false };
        }
        const nc = confirmedRomaji + pendingCompletion;
        const nextCI = chunkIndex + 1;
        if (nextCI >= word.patterns.length) return { newState: advanceToChunk(word, nextCI, nc), matched: true, wordCompleted: true };
        return processKey(advanceToChunk(word, nextCI, nc), key);
    }

    const sv = validPatterns.filter(p => p.length > charIndex && p[charIndex] === key);
    if (sv.length === 0) return { newState: state, matched: false, wordCompleted: false };
    const nci = charIndex + 1;
    const done = sv.find(p => p.length === nci);
    if (done) {
        const longer = sv.filter(p => p.length > nci);
        if (longer.length > 0) return { newState: { ...state, charIndex: nci, validPatterns: sv, pendingCompletion: done, currentTyped: done, currentRemaining: '' }, matched: true, wordCompleted: false };
        const nc = confirmedRomaji + done;
        const nextCI = chunkIndex + 1;
        return { newState: advanceToChunk(word, nextCI, nc), matched: true, wordCompleted: nextCI >= word.patterns.length };
    }
    const bp = sv[0];
    return { newState: { ...state, charIndex: nci, validPatterns: sv, currentTyped: bp.slice(0, nci), currentRemaining: bp.slice(nci), pendingCompletion: null }, matched: true, wordCompleted: false };
}

// ─── Difficulty Configuration ───
type Difficulty = 'easy' | 'normal' | 'hard';

interface DifficultyConfig {
    label: string;
    description: string;
    color: string;
    gradient: string;
    bgGradient: string;
    icon: React.ReactNode;
    minKana: number;
    maxKana: number;
    duration: number;
    scorePerKey: number;
    comboBonus: number;
    wordBonus: number;
    ranks: { score: number; rank: string; color: string; label: string }[];
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
    easy: {
        label: 'かんたん', description: '短い単語でウォーミングアップ',
        color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)',
        bgGradient: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
        icon: <IconLeaf size={28} color="#10b981" />,
        minKana: 2, maxKana: 5, duration: 60,
        scorePerKey: 10, comboBonus: 2, wordBonus: 50,
        ranks: [
            { score: 5000, rank: 'S', color: '#eab308', label: '神' },
            { score: 3500, rank: 'A', color: '#f97316', label: '達人' },
            { score: 2000, rank: 'B', color: '#3b82f6', label: '上級' },
            { score: 1000, rank: 'C', color: '#64748b', label: '初級' },
        ]
    },
    normal: {
        label: 'ふつう', description: '中くらいの単語で実力テスト',
        color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        bgGradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
        icon: <IconZap size={28} color="#3b82f6" />,
        minKana: 5, maxKana: 9, duration: 60,
        scorePerKey: 12, comboBonus: 3, wordBonus: 80,
        ranks: [
            { score: 6000, rank: 'S', color: '#eab308', label: '神' },
            { score: 4000, rank: 'A', color: '#f97316', label: '達人' },
            { score: 2500, rank: 'B', color: '#3b82f6', label: '上級' },
            { score: 1200, rank: 'C', color: '#64748b', label: '初級' },
        ]
    },
    hard: {
        label: 'むずかしい', description: '長文・ことわざ・専門用語に挑戦',
        color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
        bgGradient: 'linear-gradient(135deg, #fef2f2, #fecaca)',
        icon: <IconFlame size={28} color="#ef4444" />,
        minKana: 9, maxKana: 999, duration: 90,
        scorePerKey: 15, comboBonus: 5, wordBonus: 120,
        ranks: [
            { score: 8000, rank: 'S', color: '#eab308', label: '神' },
            { score: 5500, rank: 'A', color: '#f97316', label: '達人' },
            { score: 3000, rank: 'B', color: '#3b82f6', label: '上級' },
            { score: 1500, rank: 'C', color: '#64748b', label: '初級' },
        ]
    }
};

function getRank(score: number, config: DifficultyConfig): { rank: string; color: string; label: string } {
    for (const r of config.ranks) {
        if (score >= r.score) return r;
    }
    return { rank: 'D', color: '#9ca3af', label: '練習中' };
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

    const wordPool = useMemo(() => {
        const filtered = TYPING_WORDS.filter(w => w.kana.length >= config.minKana && w.kana.length <= config.maxKana && w.patterns.length > 0);
        return filtered.length > 0 ? filtered : TYPING_WORDS.filter(w => w.patterns.length > 0);
    }, [config.minKana, config.maxKana]);

    const pickRandom = useCallback(() => wordPool[Math.floor(Math.random() * wordPool.length)], [wordPool]);

    const startGame = (diff: Difficulty) => {
        const cfg = DIFFICULTY_CONFIGS[diff];
        setDifficulty(diff);
        setCombo(0); setMaxCombo(0); setTotalTyped(0); setMissCount(0);
        setWordsCompleted(0); setScore(0); setShowRank(false);
        setTimeRemaining(cfg.duration);
        const pool = TYPING_WORDS.filter(w => w.kana.length >= cfg.minKana && w.kana.length <= cfg.maxKana && w.patterns.length > 0);
        const actualPool = pool.length > 0 ? pool : TYPING_WORDS.filter(w => w.patterns.length > 0);
        const pick = () => actualPool[Math.floor(Math.random() * actualPool.length)];
        setEngine(initEngine(pick()));
        setNextWord(pick());
        setCountdown(3); setPhase('countdown');
        let count = 3;
        const timer = setInterval(() => { count--; setCountdown(count); if (count <= 0) { clearInterval(timer); setPhase('playing'); } }, 1000);
    };

    useEffect(() => {
        if (phase !== 'playing') return;
        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer); setPhase('finished');
                    setTimeout(() => { setShowRank(true); typingSound.playRankReveal(); }, 600);
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
                setScore(prev => prev + config.scorePerKey + (Math.min(combo, 50) * config.comboBonus));
                if (wordCompleted) {
                    typingSound.playWordComplete();
                    setEngine(initEngine(nextWord!)); setNextWord(pickRandom());
                    setCombo(prev => { const nc = prev + 1; setMaxCombo(mc => Math.max(mc, nc)); return nc; });
                    setWordsCompleted(prev => prev + 1);
                    setScore(prev => prev + config.wordBonus);
                } else {
                    setEngine(newState);
                }
            } else {
                typingSound.playMiss(); setMissCount(prev => prev + 1); setCombo(0);
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

    // ─── Romaji total length for dynamic sizing ───
    const fullRomaji = engine ? (engine.confirmedRomaji + engine.currentTyped + engine.currentRemaining + engine.futureRomaji) : '';
    const romajiLen = fullRomaji.length;
    const romajiFontSize = romajiLen > 35 ? '0.9rem' : romajiLen > 25 ? '1.1rem' : romajiLen > 18 ? '1.4rem' : '1.8rem';

    return (
        <div className={styles.main}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={phase === 'playing' ? () => setPhase('menu') : onBack}>
                    <IconArrowLeft size={16} /> 戻る
                </button>
                {phase === 'playing' && (
                    <>
                        <div className={styles.timer} style={{ color: timeRemaining <= 10 ? '#ef4444' : '#06b6d4' }}>
                            {timeRemaining}s
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: config.color, fontSize: '0.85rem', fontWeight: 700 }}>
                            {config.icon} {config.label}
                        </div>
                    </>
                )}
                {phase === 'menu' && <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>練習モード</div>}
            </div>

            {/* ─── Playing Phase ─── */}
            {phase === 'playing' && engine && (
                <div className={styles.battleArea} style={{ position: 'relative' }}>
                    {/* Progress Bar */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#e2e8f0' }}>
                        <div style={{
                            height: '100%', width: `${progressPercent}%`,
                            background: timeRemaining <= 10 ? '#ef4444' : config.color,
                            transition: 'width 1s linear',
                        }} />
                    </div>

                    {/* Score */}
                    <div style={{ position: 'absolute', top: '16px', right: '24px', textAlign: 'right' }}>
                        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: config.color, fontFamily: "'Courier New', monospace", lineHeight: 1 }}>
                            {score.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', marginTop: '2px' }}>SCORE</div>
                    </div>

                    {/* Word Area */}
                    <div className={styles.wordArea} style={{ maxWidth: '700px' }}>
                        <div className={styles.displayWord} style={{
                            fontSize: engine.word.display.length > 12 ? 'clamp(1.5rem, 5vw, 2.5rem)' : engine.word.display.length > 8 ? 'clamp(2rem, 6vw, 3.5rem)' : undefined
                        }}>
                            {engine.word.display}
                        </div>
                        <div className={styles.kanaReading}>{engine.word.kana}</div>
                        <div style={{
                            fontFamily: "'Courier New', Courier, monospace",
                            fontSize: romajiFontSize,
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            lineHeight: 1.4,
                            wordBreak: 'break-all',
                            overflowWrap: 'break-word',
                            maxWidth: '100%',
                        }}>
                            <span style={{ color: '#06b6d4' }}>{engine.confirmedRomaji}{engine.currentTyped}</span>
                            <span style={{ color: '#cbd5e1' }}>{engine.currentRemaining}{engine.futureRomaji}</span>
                        </div>
                    </div>

                    {/* Next word */}
                    {nextWord && (
                        <div className={styles.nextHint}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>NEXT</span>
                            <span style={{ marginLeft: '8px', color: '#64748b', fontWeight: 600 }}>{nextWord.display}</span>
                        </div>
                    )}

                    {/* Stats Bar */}
                    <div className={styles.statsBar}>
                        <span style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            color: combo >= 10 ? '#eab308' : combo >= 5 ? '#f97316' : '#f59e0b',
                            fontWeight: 700, fontSize: '0.95rem',
                        }}>
                            <IconCombo size={14} color={combo >= 10 ? '#eab308' : '#f59e0b'} />
                            {combo} combo
                        </span>
                        <span className={styles.statScore}>WPM: {wpm}</span>
                        <span style={{ color: accuracy >= 95 ? '#10b981' : accuracy >= 80 ? '#f59e0b' : '#ef4444', fontWeight: 700, fontSize: '0.95rem' }}>
                            {accuracy}%
                        </span>
                    </div>
                </div>
            )}

            {/* ─── Countdown Phase ─── */}
            {phase === 'countdown' && (
                <div className={styles.overlay}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        color: config.color, fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem',
                    }}>
                        {config.icon}
                        <span>{config.label}コース</span>
                    </div>
                    <div className={styles.countdownNum}>{countdown}</div>
                    <p style={{ color: '#94a3b8', fontSize: '1rem' }}>準備してください...</p>
                </div>
            )}

            {/* ─── Menu Phase ─── */}
            {phase === 'menu' && (
                <div className={styles.overlay}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                        <IconKeyboard size={36} color="#06b6d4" />
                        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                            タイピング練習
                        </h1>
                    </div>
                    <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem', textAlign: 'center', lineHeight: 1.6 }}>
                        コースを選んでハイスコアを目指そう
                    </p>

                    {/* Difficulty Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '420px' }}>
                        {(['easy', 'normal', 'hard'] as Difficulty[]).map(diff => {
                            const cfg = DIFFICULTY_CONFIGS[diff];
                            const poolSize = TYPING_WORDS.filter(w => w.kana.length >= cfg.minKana && w.kana.length <= cfg.maxKana && w.patterns.length > 0).length;
                            return (
                                <button key={diff} onClick={() => startGame(diff)} style={{
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    padding: '16px 20px',
                                    background: 'white', border: `1px solid #e2e8f0`, borderRadius: '16px',
                                    cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left',
                                    color: 'inherit', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                }}
                                    onMouseEnter={e => {
                                        const el = e.currentTarget;
                                        el.style.borderColor = cfg.color;
                                        el.style.boxShadow = `0 4px 16px ${cfg.color}18`;
                                        el.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        const el = e.currentTarget;
                                        el.style.borderColor = '#e2e8f0';
                                        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                                        el.style.transform = 'translateY(0)';
                                    }}>
                                    <div style={{
                                        width: '52px', height: '52px', borderRadius: '14px',
                                        background: cfg.bgGradient,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        {cfg.icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>
                                            {cfg.label}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                                            {cfg.description}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '0.7rem', color: '#94a3b8' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <IconClock size={11} color="#94a3b8" /> {cfg.duration}秒
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <IconTarget size={11} color="#94a3b8" /> {poolSize}語
                                            </span>
                                        </div>
                                    </div>
                                    <IconChevronRight size={18} color="#cbd5e1" />
                                </button>
                            );
                        })}
                    </div>

                    <p style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '1.5rem', textAlign: 'center', lineHeight: 1.6 }}>
                        「し」= si / shi、「ち」= ti / chi など、どんな打ち方でもOK
                    </p>
                </div>
            )}

            {/* ─── Result Phase ─── */}
            {phase === 'finished' && (
                <div className={styles.overlay}>
                    {/* Course Label */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        color: config.color, fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem'
                    }}>
                        {config.icon}
                        <span>{config.label}コース</span>
                    </div>

                    {/* Rank Badge */}
                    <div style={{
                        width: '110px', height: '110px', borderRadius: '50%',
                        background: showRank ? `${rankInfo.color}15` : '#f1f5f9',
                        border: `3px solid ${showRank ? rankInfo.color : '#e2e8f0'}`,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        marginBottom: '0.75rem',
                        transition: 'all 0.5s ease-out',
                        boxShadow: showRank ? `0 0 30px ${rankInfo.color}20` : 'none',
                    }}>
                        <span style={{
                            fontSize: showRank ? '3rem' : '0',
                            fontWeight: 900, color: rankInfo.color, lineHeight: 1,
                            transition: 'all 0.4s ease-out',
                            opacity: showRank ? 1 : 0,
                            transform: showRank ? 'scale(1)' : 'scale(0.3)',
                        }}>
                            {rankInfo.rank}
                        </span>
                        {showRank && (
                            <span style={{ fontSize: '0.65rem', color: rankInfo.color, fontWeight: 600, opacity: 0.8 }}>
                                {rankInfo.label}
                            </span>
                        )}
                    </div>

                    {/* Score */}
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', fontFamily: "'Courier New', monospace", lineHeight: 1 }}>
                        {score.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '1.25rem', marginTop: '4px' }}>SCORE</div>

                    {/* Stats */}
                    <div className={styles.resultGrid}>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>WPM</span><span className={styles.resultValue}>{wpm}</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>タイプ数</span><span className={styles.resultValue}>{totalTyped}</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>単語数</span><span className={styles.resultValue}>{wordsCompleted}</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>最大コンボ</span><span className={styles.resultValue}>{maxCombo}</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>正確率</span><span className={styles.resultValue}>{accuracy}%</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>ミス</span><span className={styles.resultValue}>{missCount}</span></div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button className={styles.actionButton} onClick={() => startGame(difficulty)}>もう一度</button>
                        <button className={styles.actionButton} style={{ background: 'linear-gradient(135deg, #64748b, #475569)', boxShadow: '0 4px 15px rgba(100,116,139,0.3)' }} onClick={() => setPhase('menu')}>コース選択</button>
                        <button className={styles.actionButton} style={{ background: 'linear-gradient(135deg, #94a3b8, #64748b)', boxShadow: '0 4px 15px rgba(148,163,184,0.3)' }} onClick={onBack}>戻る</button>
                    </div>
                </div>
            )}
        </div>
    );
}
