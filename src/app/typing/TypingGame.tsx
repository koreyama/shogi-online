'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Typing.module.css';
import { client } from '@/lib/colyseus';
import { Room } from 'colyseus.js';
import { IconBack, IconClock, IconFlame, IconTrophy, IconSkull, IconSwords } from '@/components/Icons';
import { TYPING_WORDS, TypingWord } from '@/lib/typing/data';
import { db } from '@/lib/firebase';
import { ref, set, onDisconnect, remove } from 'firebase/database';

interface TypingGameProps {
    userData: { name: string; id: string };
    mode?: 'create' | 'join';
    roomId?: string;
    password?: string;
    onBack: () => void;
}

// Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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
        // Crisp click sound
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

// ─── Multi-romaji typing engine with deferred completion for ん ───
interface TypingEngineState {
    word: TypingWord;
    chunkIndex: number;
    charIndex: number;
    validPatterns: string[];
    confirmedRomaji: string;
    currentTyped: string;
    currentRemaining: string;
    futureRomaji: string;
    pendingCompletion: string | null; // For ん: 'n' is complete but 'nn' might follow
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

    // ── Case 1: We have a pending completion (e.g., 'n' for ん, waiting to see if 'nn') ──
    if (pendingCompletion !== null) {
        // Try matching longer patterns first
        const stillValid = validPatterns.filter(p => p.length > charIndex && p[charIndex] === key);

        if (stillValid.length > 0) {
            const newCharIndex = charIndex + 1;
            const completedNow = stillValid.find(p => p.length === newCharIndex);

            if (completedNow) {
                // Longer pattern completed (e.g., 'nn' for ん)
                const longerStill = stillValid.filter(p => p.length > newCharIndex);
                if (longerStill.length > 0) {
                    // Even longer patterns exist, defer again
                    return {
                        newState: {
                            ...state, charIndex: newCharIndex, validPatterns: stillValid,
                            pendingCompletion: completedNow,
                            currentTyped: completedNow,
                            currentRemaining: '',
                        },
                        matched: true, wordCompleted: false
                    };
                }
                // Completed! Advance chunk
                const newConfirmed = confirmedRomaji + completedNow;
                const newChunkIndex = chunkIndex + 1;
                const ns = advanceToChunk(word, newChunkIndex, newConfirmed);
                return { newState: ns, matched: true, wordCompleted: newChunkIndex >= word.patterns.length };
            }

            // Not yet completed, continue narrowing
            const bestPattern = stillValid[0];
            return {
                newState: {
                    ...state, charIndex: newCharIndex, validPatterns: stillValid,
                    currentTyped: bestPattern.slice(0, newCharIndex),
                    currentRemaining: bestPattern.slice(newCharIndex),
                },
                matched: true, wordCompleted: false
            };
        }

        // Key doesn't match any longer pattern → use the pending completion
        // Complete the current chunk with the pending pattern, then try the key on the next chunk
        const newConfirmed = confirmedRomaji + pendingCompletion;
        const newChunkIndex = chunkIndex + 1;
        if (newChunkIndex >= word.patterns.length) {
            // Word complete, but the typed key is a "miss" on nothing → just complete
            const ns = advanceToChunk(word, newChunkIndex, newConfirmed);
            // The extra key doesn't match anything, so we return the completed state
            // but don't count this key as matched
            return { newState: ns, matched: true, wordCompleted: true };
        }

        // Try the key against the next chunk
        const nextChunkState = advanceToChunk(word, newChunkIndex, newConfirmed);
        return processKey(nextChunkState, key);
    }

    // ── Case 2: Normal processing ──
    const stillValid = validPatterns.filter(p => p.length > charIndex && p[charIndex] === key);
    if (stillValid.length === 0) return { newState: state, matched: false, wordCompleted: false };

    const newCharIndex = charIndex + 1;
    const completedPattern = stillValid.find(p => p.length === newCharIndex);

    if (completedPattern) {
        // Check if longer alternatives exist
        const longerAlternatives = stillValid.filter(p => p.length > newCharIndex);

        if (longerAlternatives.length > 0) {
            // Defer completion! Store pending and keep matching
            return {
                newState: {
                    ...state,
                    charIndex: newCharIndex,
                    validPatterns: stillValid,
                    pendingCompletion: completedPattern,
                    currentTyped: completedPattern,
                    currentRemaining: '',
                },
                matched: true, wordCompleted: false
            };
        }

        // No longer alternatives → complete chunk
        const newConfirmed = confirmedRomaji + completedPattern;
        const newChunkIndex = chunkIndex + 1;
        const ns = advanceToChunk(word, newChunkIndex, newConfirmed);
        return { newState: ns, matched: true, wordCompleted: newChunkIndex >= word.patterns.length };
    }

    // Not completed, continue narrowing
    const bestPattern = stillValid[0];
    return {
        newState: {
            ...state,
            charIndex: newCharIndex,
            validPatterns: stillValid,
            currentTyped: bestPattern.slice(0, newCharIndex),
            currentRemaining: bestPattern.slice(newCharIndex),
            pendingCompletion: null,
        },
        matched: true, wordCompleted: false
    };
}

const GAME_DURATION = 180;

export default function TypingGame({ userData, mode = 'create', roomId, password, onBack }: TypingGameProps) {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [phase, setPhase] = useState<string>('waiting');
    const [gauge, setGauge] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
    const [winnerId, setWinnerId] = useState('');
    const [players, setPlayers] = useState<any[]>([]);

    const [engine, setEngine] = useState<TypingEngineState | null>(null);
    const [nextWord, setNextWord] = useState<TypingWord | null>(null);
    const [combo, setCombo] = useState(0);
    const [totalTyped, setTotalTyped] = useState(0);
    const [missCount, setMissCount] = useState(0);
    const [wordsCleared, setWordsCleared] = useState(0);

    const roomRef = useRef<Room | null>(null);
    const wordQueueRef = useRef<TypingWord[]>([]);

    // Filter valid words (must have patterns)
    const validWords = React.useMemo(() => TYPING_WORDS.filter(w => w.patterns.length > 0 && w.patterns.every(p => p.length > 0)), []);

    const pickNext = useCallback(() => {
        if (wordQueueRef.current.length === 0) {
            wordQueueRef.current = shuffleArray(validWords);
        }
        return wordQueueRef.current.pop()!;
    }, [validWords]);

    // Connect to Colyseus
    useEffect(() => {
        let ignore = false;
        if (roomRef.current) return;

        const connect = async () => {
            await new Promise(r => setTimeout(r, 50));
            if (ignore) return;
            try {
                const options = { name: userData.name, password };
                let r: Room;
                if (mode === 'join' && roomId) {
                    r = await client.joinById(roomId, options);
                } else {
                    r = await client.joinOrCreate('typing', options);
                }
                if (ignore) { if (r) r.leave(); return; }

                roomRef.current = r;
                setConnected(true);

                r.onStateChange((state: any) => {
                    setPhase(state.phase);
                    setGauge(state.gauge);
                    setTimeRemaining(state.timeRemaining);
                    setWinnerId(state.winnerId || '');
                    const pList: any[] = [];
                    state.players.forEach((p: any, sessionId: string) => {
                        pList.push({ name: p.name, score: p.score, isHost: p.isHost, sessionId, me: sessionId === r.sessionId });
                    });
                    setPlayers(pList);

                    const myPlayer = pList.find(p => p.sessionId === r.sessionId);
                    if ((myPlayer?.isHost || mode === 'create') && r.roomId) {
                        const fbRoomRef = ref(db, `typing_rooms/${r.roomId}`);
                        set(fbRoomRef, {
                            roomId: r.roomId, hostId: userData.id, hostName: userData.name,
                            status: state.phase === 'waiting' ? 'waiting' : 'playing',
                            playerCount: pList.length, isLocked: !!password, createdAt: Date.now()
                        }).catch(() => { });
                        onDisconnect(fbRoomRef).remove().catch(() => { });
                    }
                });

                r.onMessage("game_start", () => {
                    // Reset queue on start
                    wordQueueRef.current = shuffleArray(validWords);

                    const w = pickNext();
                    setEngine(initEngine(w));
                    setNextWord(pickNext());
                    setCombo(0);
                    setTotalTyped(0);
                    setMissCount(0);
                    setWordsCleared(0);
                });
            } catch (e: any) {
                setError(e.message || '接続に失敗しました');
            }
        };
        connect();
        return () => {
            ignore = true;
            if (roomRef.current?.roomId) { remove(ref(db, `typing_rooms/${roomRef.current.roomId}`)).catch(() => { }); }
            roomRef.current?.leave();
            roomRef.current = null;
        };
    }, [validWords, pickNext, userData.name, password, mode, roomId]);

    // Key handler
    useEffect(() => {
        if (phase !== 'battle' || !engine) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.length > 1) return;
            const key = e.key.toLowerCase();
            if (key.length !== 1) return;

            const { newState, matched, wordCompleted } = processKey(engine, key);

            if (matched) {
                typingSound.playType();
                setTotalTyped(prev => prev + 1);
                roomRef.current?.send("type", { damage: 1 });

                if (wordCompleted) {
                    typingSound.playWordComplete();
                    const nw = nextWord!;
                    setEngine(initEngine(nw));
                    setNextWord(pickNext());
                    setCombo(prev => prev + 1);
                    setWordsCleared(prev => prev + 1);
                    roomRef.current?.send("type", { damage: 3 });
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
    }, [phase, engine, nextWord, pickNext]);

    const handleStart = () => { roomRef.current?.send("start"); };

    const mySessionId = roomRef.current?.sessionId;
    const isP1 = players.length > 0 && players[0]?.sessionId === mySessionId;
    const opponentPlayer = players.find(p => !p.me);
    const mePlayer = players.find(p => p.me);
    // Gauge: -100 to 100. P1 pushes positive, P2 pushes negative.
    // For display: convert to 0-100 where 50 is center
    const gaugePercent = isP1 ? (50 + gauge / 2) : (50 - gauge / 2);
    const gaugeForMe = isP1 ? gauge : -gauge; // positive = winning

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    if (error) {
        return (
            <div className={styles.main}>
                <div className={styles.errorContainer}>
                    <h1 style={{ color: '#ef4444', fontSize: '1.5rem', marginBottom: '1rem' }}>接続エラー</h1>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>{error}</p>
                    <button className={styles.actionButton} onClick={onBack}>戻る</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.main}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={onBack}>
                    <IconBack size={16} /> 退出
                </button>
                <div className={styles.timer}><IconClock size={18} style={{ marginRight: 4 }} /> {formatTime(timeRemaining)}</div>
                <div className={styles.roomTag}>
                    {roomRef.current?.roomId ? `ID: ${roomRef.current.roomId.slice(0, 6)}` : ''}
                </div>
            </div>

            {/* Improved Gauge */}
            <div className={styles.gaugeSection}>
                <div className={styles.gaugePlayerLeft}>
                    <span className={styles.gaugePlayerName}>{mePlayer?.name || 'あなた'}</span>
                    <span className={styles.gaugePlayerScore}>{mePlayer?.score || 0} pts</span>
                </div>
                <div className={styles.gaugeContainer}>
                    <div className={styles.gaugeTrack}>
                        <div className={styles.gaugeFillLeft} style={{ width: `${Math.max(0, Math.min(100, gaugePercent))}%` }} />
                        <div className={styles.gaugeFillRight} style={{ width: `${Math.max(0, Math.min(100, 100 - gaugePercent))}%` }} />
                        <div className={styles.gaugeCenterLine} />
                        <div className={styles.gaugeCursor} style={{ left: `${Math.max(2, Math.min(98, gaugePercent))}%` }} />
                    </div>
                    <div className={styles.gaugeLabels}>
                        <span>⬅ あなた</span>
                        <span style={{ color: gaugeForMe > 10 ? '#22c55e' : gaugeForMe < -10 ? '#ef4444' : '#94a3b8', fontWeight: 700 }}>
                            {gaugeForMe > 0 ? `+${gaugeForMe}` : gaugeForMe}
                        </span>
                        <span>相手 ➡</span>
                    </div>
                </div>
                <div className={styles.gaugePlayerRight}>
                    <span className={styles.gaugePlayerName}>{opponentPlayer?.name || '相手'}</span>
                    <span className={styles.gaugePlayerScore}>{opponentPlayer?.score || 0} pts</span>
                </div>
            </div>

            {/* Battle Area */}
            {phase === 'battle' && engine && (
                <div className={styles.battleArea}>
                    <div className={styles.wordArea}>
                        <div className={styles.displayWord} style={{ fontSize: engine.word.display.length > 5 ? '2.5rem' : '3.5rem' }}>{engine.word.display}</div>
                        <div className={styles.kanaReading}>{engine.word.kana}</div>
                        <div className={styles.romajiLine}>
                            <span className={styles.romajiTyped} style={{ fontSize: engine.currentTyped.length + engine.currentRemaining.length + engine.futureRomaji.length > 25 ? '1.1rem' : '1.5rem' }}>{engine.confirmedRomaji}</span>
                            <span className={styles.romajiTyped} style={{ fontSize: engine.currentTyped.length + engine.currentRemaining.length + engine.futureRomaji.length > 25 ? '1.1rem' : '1.5rem' }}>{engine.currentTyped}</span>
                            <span className={styles.romajiRemaining} style={{ fontSize: engine.currentTyped.length + engine.currentRemaining.length + engine.futureRomaji.length > 25 ? '1.1rem' : '1.5rem' }}>{engine.currentRemaining}</span>
                            <span className={styles.romajiRemaining} style={{ fontSize: engine.currentTyped.length + engine.currentRemaining.length + engine.futureRomaji.length > 25 ? '1.1rem' : '1.5rem' }}>{engine.futureRomaji}</span>
                        </div>
                    </div>

                    {nextWord && (
                        <div className={styles.nextHint}>NEXT: {nextWord.display}</div>
                    )}

                    <div className={styles.statsBar}>
                        <span className={styles.statCombo}><IconFlame size={20} color="#f59e0b" /> {combo} combo</span>
                        <span className={styles.statScore}>Score: {mePlayer?.score || 0}</span>
                        <span className={styles.statMiss}>Miss: {missCount}</span>
                    </div>
                </div>
            )}

            {/* Waiting */}
            {phase === 'waiting' && (
                <div className={styles.overlay}>
                    <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
                        <button className={styles.backBtn} onClick={onBack}>
                            <IconBack size={16} /> 退出
                        </button>
                    </div>
                    <h1 className={styles.overlayTitle}><IconSwords size={32} style={{ marginRight: 8 }} /> Typing Battle</h1>
                    <div className={styles.roomIdBox}>Room: {roomRef.current?.roomId || '---'}</div>
                    <div className={styles.playerList}>
                        {players.map(p => (
                            <div key={p.sessionId} className={styles.playerCard}>
                                <span>{p.me ? '⭐ ' : ''}{p.name}</span>
                                {p.isHost && <span className={styles.hostTag}>HOST</span>}
                            </div>
                        ))}
                        {players.length < 2 && (
                            <div className={styles.playerCard} style={{ opacity: 0.4 }}>対戦相手を待っています...</div>
                        )}
                    </div>
                    {mePlayer?.isHost ? (
                        <button className={styles.actionButton} onClick={handleStart} disabled={players.length < 2}>
                            {players.length < 2 ? '対戦相手を待っています...' : 'ゲーム開始！'}
                        </button>
                    ) : (
                        <p style={{ color: '#94a3b8', marginTop: '1rem' }}>ホストがゲームを開始するのを待っています...</p>
                    )}
                </div>
            )}

            {/* Result */}
            {phase === 'finished' && (
                <div className={styles.overlay}>
                    <div className={winnerId === mySessionId ? styles.resultWin : (winnerId === 'draw' ? styles.resultDraw : styles.resultLose)}>
                        {winnerId === mySessionId ? <><IconTrophy size={48} /> 勝利！</> : (winnerId === 'draw' ? '🤝 引き分け' : <><IconSkull size={48} /> 敗北...</>)}
                    </div>
                    <div className={styles.resultGrid}>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>スコア</span><span className={styles.resultValue}>{mePlayer?.score || 0}</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>正確率</span><span className={styles.resultValue}>{totalTyped + missCount > 0 ? Math.floor((totalTyped / (totalTyped + missCount)) * 100) : 0}%</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>平均速度</span><span className={styles.resultValue}>{Math.floor(totalTyped / Math.max((180 - timeRemaining) / 60, 0.01))} kpm</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>クリア単語</span><span className={styles.resultValue}>{wordsCleared}</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>タイプ数</span><span className={styles.resultValue}>{totalTyped}</span></div>
                        <div className={styles.resultItem}><span className={styles.resultLabel}>ミス</span><span className={styles.resultValue}>{missCount}</span></div>
                    </div>
                    <button className={styles.actionButton} onClick={onBack}>ロビーに戻る</button>
                </div>
            )}
        </div>
    );
}
