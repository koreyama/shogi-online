'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

import Link from 'next/link';
import { pianoEngine, InstrumentType } from '@/lib/piano/AudioEngine';
import { SONGS, Song, NoteData } from '@/lib/piano/songs';
import HideChatBot from '@/components/HideChatBot';
import styles from './page.module.css';

// Note Data for C3 to C5 (Same range)
const NOTES = [
    { note: 'C3', type: 'white', label: 'Z' },
    { note: 'C#3', type: 'black', label: 'S' },
    { note: 'D3', type: 'white', label: 'X' },
    { note: 'D#3', type: 'black', label: 'D' },
    { note: 'E3', type: 'white', label: 'C' },
    { note: 'F3', type: 'white', label: 'V' },
    { note: 'F#3', type: 'black', label: 'G' },
    { note: 'G3', type: 'white', label: 'B' },
    { note: 'G#3', type: 'black', label: 'H' },
    { note: 'A3', type: 'white', label: 'N' },
    { note: 'A#3', type: 'black', label: 'J' },
    { note: 'B3', type: 'white', label: 'M' },

    { note: 'C4', type: 'white', label: 'Q' },
    { note: 'C#4', type: 'black', label: '2' },
    { note: 'D4', type: 'white', label: 'W' },
    { note: 'D#4', type: 'black', label: '3' },
    { note: 'E4', type: 'white', label: 'E' },
    { note: 'F4', type: 'white', label: 'R' },
    { note: 'F#4', type: 'black', label: '5' },
    { note: 'G4', type: 'white', label: 'T' },
    { note: 'G#4', type: 'black', label: '6' },
    { note: 'A4', type: 'white', label: 'Y' },
    { note: 'A#4', type: 'black', label: '7' },
    { note: 'B4', type: 'white', label: 'U' },
    { note: 'C5', type: 'white', label: 'I' },
];

const KEY_MAP: Record<string, string> = {
    'z': 'C3', 's': 'C#3', 'x': 'D3', 'd': 'D#3', 'c': 'E3', 'v': 'F3', 'g': 'F#3', 'b': 'G3', 'h': 'G#3', 'n': 'A3', 'j': 'A#3', 'm': 'B3',
    'q': 'C4', '2': 'C#4', 'w': 'D4', '3': 'D#4', 'e': 'E4', 'r': 'F4', '5': 'F#4', 't': 'G4', '6': 'G#4', 'y': 'A4', '7': 'A#4', 'u': 'B4', 'i': 'C5'
};

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function PianoPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    // Settings
    const [reverb, setReverb] = useState(0.3);
    const [volume, setVolume] = useState(0.7); // Default UI value (multiplied by 3 in engine)
    const [bpm, setBpm] = useState(100);
    const [isMetronomeOne, setIsMetronomeOn] = useState(false);

    // Sampler State
    const [isLoading, setIsLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);
    const [currentInstrument, setCurrentInstrument] = useState<InstrumentType>('acoustic_grand_piano');

    // Metronome Refs
    const nextNoteTimeRef = useRef(0);
    const timerIDRef = useRef<number | null>(null);
    const beatCountRef = useRef(0);

    // Initial Load
    useEffect(() => {
        setMounted(true);
        loadInstrument('acoustic_grand_piano');
    }, []);

    const loadInstrument = async (type: InstrumentType) => {
        setIsLoading(true);
        setLoadProgress(0);
        setCurrentInstrument(type);

        pianoEngine.onLoadProgress = (p) => setLoadProgress(Math.floor(p * 100));
        pianoEngine.onLoadComplete = () => setIsLoading(false);

        await pianoEngine.loadInstrument(type);
    };

    const resumeAudio = useCallback(() => {
        pianoEngine.resume();
    }, []);

    const playNote = useCallback((note: string) => {
        pianoEngine.playNote(note);
        setActiveNotes(prev => {
            const next = new Set(prev);
            next.add(note);
            return next;
        });
    }, []);

    const stopNote = useCallback((note: string) => {
        pianoEngine.stopNote(note);
        setActiveNotes(prev => {
            const next = new Set(prev);
            next.delete(note);
            return next;
        });
    }, []);

    // Metronome Logic
    const scheduleAudio = useCallback(() => {
        const lookahead = 25.0; // ms
        const scheduleAheadTime = 0.1; // seconds

        if (!isMetronomeOne) return;

        const ctx = pianoEngine.audioContext;
        if (!ctx) return;

        while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
            const isAccent = beatCountRef.current % 4 === 0;
            pianoEngine.playMetronomeClick(nextNoteTimeRef.current, isAccent);
            const secondsPerBeat = 60.0 / bpm;
            nextNoteTimeRef.current += secondsPerBeat;
            beatCountRef.current++;
        }

        timerIDRef.current = window.setTimeout(scheduleAudio, lookahead);
    }, [isMetronomeOne, bpm]);

    useEffect(() => {
        if (isMetronomeOne) {
            pianoEngine.resume();
            if (pianoEngine.audioContext) {
                nextNoteTimeRef.current = pianoEngine.audioContext.currentTime + 0.05;
                beatCountRef.current = 0;
                scheduleAudio();
            }
        } else {
            if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
        }
        return () => {
            if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
        };
    }, [isMetronomeOne, scheduleAudio]);

    useEffect(() => {
        pianoEngine.setReverb(reverb);
    }, [reverb]);

    useEffect(() => {
        pianoEngine.setVolume(volume);
    }, [volume]);

    // MIDI Notification
    const [midiDevice, setMidiDevice] = useState<string | null>(null);

    // MIDI Logic
    useEffect(() => {
        if (!navigator.requestMIDIAccess) {
            console.warn("Web MIDI API not supported in this browser.");
            return;
        }

        let midiAccess: any = null;

        const onMidiMessage = (message: any) => {
            if (!message.data) return;
            const [status, note, velocity] = message.data;
            const command = status & 0xF0;

            // Ignore Active Sensing (0xFE) and Clock (0xF8)
            if (command >= 0xF0) return;

            const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const octave = Math.floor(note / 12) - 1;
            const name = noteNames[note % 12];
            const noteStr = `${name}${octave}`; // e.g. "C#4"

            if (command === 0x90 && velocity > 0) { // Note On
                // Ensure audio context is running (user gesture requirement might block this if first interaction is MIDI)
                if (pianoEngine.audioContext?.state === 'suspended') {
                    pianoEngine.audioContext.resume().catch(console.error);
                }
                resumeAudio();
                playNote(noteStr);
                // Visual feedback for debugging
                console.log(`MIDI Note On: ${noteStr} (Vel: ${velocity})`);
            } else if (command === 0x80 || (command === 0x90 && velocity === 0)) { // Note Off
                stopNote(noteStr);
            }
        };

        const onStateChange = (e: any) => {
            const port = e.port;
            console.log(`MIDI State Change: ${port.name} (${port.state}, ${port.connection})`);
            if (port.type === 'input' && port.state === 'connected' && port.connection === 'open') {
                setMidiDevice(port.name || 'Unknown Device');
            } else if (port.type === 'input' && port.state === 'disconnected') {
                setMidiDevice(null);
            }
        };

        navigator.requestMIDIAccess().then((access) => {
            console.log("MIDI Access Granted");
            midiAccess = access;
            midiAccess.onstatechange = onStateChange;

            // Iterate over inputs and attach listeners
            // Use Array.from because iterator behavior varies across browsers
            const inputs = Array.from(access.inputs.values());

            if (inputs.length > 0) {
                console.log(`Found ${inputs.length} MIDI inputs`);
                setMidiDevice((inputs[0] as any).name || 'MIDI Device Connected');

                inputs.forEach((input: any) => {
                    console.log(`Attaching to MIDI Input: ${input.name}`);
                    input.onmidimessage = onMidiMessage;
                });
            } else {
                console.log("No MIDI inputs found initially.");
            }

        }).catch(err => {
            console.warn("MIDI Access Failed:", err);
        });

        return () => {
            if (midiAccess) {
                midiAccess.onstatechange = null;
                Array.from(midiAccess.inputs.values()).forEach((input: any) => {
                    input.onmidimessage = null;
                });
            }
        };

    }, [playNote, stopNote, resumeAudio]);


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            resumeAudio();
            const note = KEY_MAP[e.key.toLowerCase()];
            if (note) playNote(note);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const note = KEY_MAP[e.key.toLowerCase()];
            if (note) stopNote(note);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [playNote, stopNote, resumeAudio]);

    if (!mounted || authLoading || !user) return null;

    return (
        <div className={styles.container} onClick={resumeAudio}>
            {/* Portrait Overlay */}
            <div className={styles.portraitOverlay}>
                <svg className={styles.rotateIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 4v16M7 4v16M21 12H3" strokeOpacity="0" /> {/* Spacer */}
                    <rect x="5" y="3" width="14" height="18" rx="2" />
                    <path d="M12 7v4l3 3" strokeOpacity="0" />
                </svg>
                <h2>画面を横にしてください</h2>
                <p>Landscape Mode Only</p>
            </div>

            <HideChatBot />
            {/* Loading Overlay */}
            {isLoading && (
                <div className={styles.loadingOverlay}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 500 }}>音源データを読み込み中...</div>
                    <div className={styles.loadingBarContainer}>
                        <div className={styles.loadingBarFill} style={{ width: `${loadProgress}%` }}></div>
                    </div>
                    <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>{loadProgress}%</div>
                </div>
            )}

            <div className={styles.header}>
                <h1 className={styles.title}>Virtual Piano</h1>
                <p className={styles.subtitle}>Simple & Clean</p>
            </div>

            {/* Control Panel */}
            <div className={styles.controlPanel}>
                {/* Home Button */}
                <Link href="/" className={styles.homeButton} title="Home">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                </Link>

                {/* Reverb Control */}
                <div className={styles.controlGroup}>
                    <label className={styles.label}>リバーブ (残響)</label>
                    <input
                        type="range"
                        min="0" max="1" step="0.01"
                        value={reverb}
                        onChange={e => setReverb(parseFloat(e.target.value))}
                        className={styles.slider}
                    />
                </div>

                {/* Volume Control */}
                <div className={styles.controlGroup}>
                    <label className={styles.label}>音量</label>
                    <input
                        type="range"
                        min="0" max="1.5" step="0.05"
                        value={volume}
                        onChange={e => setVolume(parseFloat(e.target.value))}
                        className={styles.slider}
                    />
                </div>

                {/* Instrument Selector */}
                <div className={styles.controlGroup}>
                    <label className={styles.label}>楽器 / 音色</label>
                    <select
                        value={currentInstrument}
                        onChange={(e) => loadInstrument(e.target.value as any)}
                        className={styles.select}
                        disabled={isLoading}
                    >
                        <option value="acoustic_grand_piano">グランドピアノ (Grand Piano)</option>
                        <option value="electric_guitar_jazz">ジャズギター (Jazz Guitar)</option>
                        <option value="string_ensemble_1">ストリングス (Strings)</option>
                        <option value="violin">バイオリン (Violin)</option>
                        <option value="cello">チェロ (Cello)</option>
                        <option value="trumpet">トランペット (Trumpet)</option>
                        <option value="flute">フルート (Flute)</option>
                        <option value="alto_sax">サックス (Saxophone)</option>
                        <option value="church_organ">パイプオルガン (Church Organ)</option>
                        <option value="choir_aahs">合唱 (Choir)</option>
                        <option value="lead_1_square">電子音 (Square Lead)</option>
                        <option value="sitar">シタール (Sitar)</option>
                        <option value="steel_drums">スチールドラム (Steel Drums)</option>
                        <option value="koto">琴 (Koto)</option>
                    </select>
                </div>

                {/* Metronome Control */}
                <div className={styles.controlGroup}>
                    <label className={styles.label}>メトロノーム</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => setIsMetronomeOn(!isMetronomeOne)}
                            className={styles.metronomeButton}
                            style={{
                                background: isMetronomeOne ? '#333' : '#eee',
                                color: isMetronomeOne ? '#fff' : '#999',
                            }}
                            title="Toggle Metronome"
                        >
                            {isMetronomeOne ? '■' : '▶'}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="range"
                                min="40" max="200"
                                value={bpm}
                                onChange={e => setBpm(parseInt(e.target.value))}
                                className={styles.slider}
                            />
                            <span style={{ fontSize: '0.9rem', width: '30px', textAlign: 'right', fontFamily: 'monospace', color: '#555' }}>{bpm}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Piano Chassis */}
            <div className={styles.pianoChassis}>
                <div className={styles.keysContainer}>
                    {NOTES.map((n) => {
                        const isActive = activeNotes.has(n.note);

                        if (n.type === 'white') {
                            return (
                                <div
                                    key={n.note}
                                    onMouseDown={() => { resumeAudio(); playNote(n.note); }}
                                    onMouseUp={() => stopNote(n.note)}
                                    onMouseLeave={() => stopNote(n.note)}
                                    onTouchStart={(e) => { e.preventDefault(); resumeAudio(); playNote(n.note); }}
                                    onTouchEnd={(e) => { e.preventDefault(); stopNote(n.note); }}
                                    className={styles.whiteKey}
                                    style={{
                                        background: isActive ? '#f0f0f0' : '#fff',
                                        borderBottom: isActive ? '2px solid #ddd' : '6px solid #ddd',
                                        transform: isActive ? 'translateY(2px)' : 'none',
                                        color: isActive ? '#333' : '#ddd',
                                        boxShadow: isActive ? 'inset 0 3px 5px rgba(0,0,0,0.05)' : 'none'
                                    }}
                                >
                                    {isActive ? n.note : n.label}
                                </div>
                            );
                        }
                        return null;
                    })}

                    {/* Render Black keys */}
                    {NOTES.map((n, i) => {
                        if (n.type === 'black') {
                            const isActive = activeNotes.has(n.note);
                            const whiteKeysBefore = NOTES.slice(0, i).filter(k => k.type === 'white').length;
                            const leftPos = (whiteKeysBefore * 59) - 18; // Keep fixed px calculation, scroll handles it

                            return (
                                <div
                                    key={n.note}
                                    onMouseDown={() => { resumeAudio(); playNote(n.note); }}
                                    onMouseUp={() => stopNote(n.note)}
                                    onMouseLeave={() => stopNote(n.note)}
                                    onTouchStart={(e) => { e.preventDefault(); resumeAudio(); playNote(n.note); }}
                                    onTouchEnd={(e) => { e.preventDefault(); stopNote(n.note); }}
                                    className={styles.blackKey}
                                    style={{
                                        left: `${leftPos}px`,
                                        background: isActive ? '#444' : '#222',
                                        transform: isActive ? 'translateY(2px)' : 'none',
                                    }}
                                >
                                    {isActive ? '' : n.label}
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>

            <div className={styles.footer}>
                <Link href="/" style={{ color: '#999', textDecoration: 'none', fontSize: '0.8rem', borderBottom: '1px solid #eee' }}>Home</Link>
            </div>

            {/* MIDI Status */}
            <div className={styles.midiStatus}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: midiDevice ? '#48bb78' : '#ddd' }}></div>
                {midiDevice ? `MIDI: ${midiDevice}` : 'MIDI Not Connected'}
            </div>

            {/* Sheet Music Section */}
            <SongPlayer
                playNote={playNote}
                stopNote={stopNote}
                activeNotes={activeNotes}
            />
        </div>
    );
}



function SongPlayer({
    playNote,
    stopNote,
    activeNotes
}: {
    playNote: (n: string) => void,
    stopNote: (n: string) => void,
    activeNotes: Set<string>
}) {
    const [selectedSongId, setSelectedSongId] = useState<string>('');
    const [displayMode, setDisplayMode] = useState<'alpha' | 'solfege'>('solfege');

    // Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentBarIndex, setCurrentBarIndex] = useState(-1);
    const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);

    const selectedSong = SONGS.find(s => s.id === selectedSongId);
    const playbackRef = useRef<{ timeoutId: number | null, activeKey: string | null }>({ timeoutId: null, activeKey: null });

    // Stop playback when song changes or component unmounts
    useEffect(() => {
        return () => stopPlayback();
    }, [selectedSongId]);

    const stopPlayback = () => {
        if (playbackRef.current.timeoutId) {
            window.clearTimeout(playbackRef.current.timeoutId);
        }
        if (playbackRef.current.activeKey) {
            stopNote(playbackRef.current.activeKey);
        }
        playbackRef.current = { timeoutId: null, activeKey: null };
        setIsPlaying(false);
        setCurrentBarIndex(-1);
        setCurrentNoteIndex(-1);
    };

    const handlePlay = () => {
        if (isPlaying) {
            stopPlayback();
            return;
        }

        if (!selectedSong) return;

        setIsPlaying(true);
        setCurrentBarIndex(0);
        setCurrentNoteIndex(0);

        playSequence(0, 0);
    };

    const playSequence = (barIdx: number, noteIdx: number) => {
        if (!selectedSong) return;

        // Check if finished
        if (barIdx >= selectedSong.bars.length) {
            stopPlayback();
            return;
        }

        const bar = selectedSong.bars[barIdx];
        if (noteIdx >= bar.length) {
            // Next bar
            playSequence(barIdx + 1, 0);
            return;
        }

        const note = bar[noteIdx];

        // Visual Update
        setCurrentBarIndex(barIdx);
        setCurrentNoteIndex(noteIdx);

        // Play Sound
        if (note.key) {
            playNote(note.key);
            playbackRef.current.activeKey = note.key;
        }

        // Calculate Duration
        // Duration Denominator: 4 = Quarter. 
        // Beat length = 60 / BPM seconds.
        // Note beats = 4 / duration.
        // Duration ms = beats * beatLength * 1000.

        const bpm = selectedSong.bpm || 100;
        const secondsPerBeat = 60 / bpm;
        const beats = 4 / note.duration;
        const durationMs = beats * secondsPerBeat * 1000;

        // Schedule Note Off (slightly before next note for articulation, e.g. 90%)
        const noteOffTime = durationMs * 0.9;

        // We use setTimeout for the visual sequencer for simplicity (WebAudio scheduling is better for audio, but we need React state sync)

        // Schedule stop sound
        if (note.key) {
            setTimeout(() => {
                stopNote(note.key);
                if (playbackRef.current.activeKey === note.key) playbackRef.current.activeKey = null;
            }, noteOffTime);
        }

        // Schedule next note
        playbackRef.current.timeoutId = window.setTimeout(() => {
            playSequence(barIdx, noteIdx + 1);
        }, durationMs);
    };

    const getNoteOffset = (key: string): number => {
        if (!key) return 0;
        // Basic mapping for Treble Clef (G-clef)
        // E4 is the bottom line (Line 1)
        // Standard staff line spacing defined in CSS (e.g. 10px per step, 20px per line)
        // Let's assume 1 step = 5px (half line space)

        // Note to Step Index (C4 as base)
        // C4 D4 E4 F4 G4 A4 B4 C5 ...
        const steps: Record<string, number> = {
            'C3': -9, 'D3': -8, 'E3': -7, 'F3': -6, 'G3': -5, 'A3': -4, 'B3': -3,
            'C4': -2, 'D4': -1, 'E4': 0, 'F4': 1, 'G4': 2, 'A4': 3, 'B4': 4,
            'C5': 5, 'D5': 6, 'E5': 7, 'F5': 8, 'G5': 9, 'A5': 10, 'B5': 11,
            'C6': 12
        };

        // Handle sharps/flats (simplified to natural for display height)
        const naturalKey = key.replace('#', '').replace('b', '');


        const step = steps[naturalKey] ?? 0;

        // Top-based positioning
        // Base Note E4 (Step 0) is on Bottom Line.
        // Bottom Line is at 84px from Top.
        // We want the CENTER of the note head to be at 84px.
        // Note element is top-aligned.
        // We push it down using margin-top.
        // Note visual structure:
        // .scoreNote { height: 40px } currently.
        // .noteHead { bottom: -5px } -> this was for bottom alignment.

        // Let's rely on the CSS update for .noteHead position to make sense with Top alignment too.
        // Ideally, we want the Note "Center" anchor.
        // If we move the Note box down by X pixels.

        // Let's assume we want to place the Note element such that a specific point aligns with the line.
        // E4 (Step 0) -> Line at 84px.
        // If we want NoteHead center at 84px.

        // Let's refine CSS for NoteHead to be simpler: top: 0?
        // If NoteHead is 10px high. Center is 5px.
        // If we position Note element at top: (84 - 5) = 79px?
        // Let's just output the "Step based value" here and handle fine tuning in CSS or simple math.

        // Step 0 -> 84px center.
        // Step 1 -> 78px center.
        // Value = 84 - (step * 6).

        return 84 - (step * 6);
    };

    return (
        <div className={styles.sheetMusicContainer}>
            <div className={styles.songSelectorRow}>
                <div className={styles.selectorGroup}>
                    <label className={styles.label}>楽譜を選択:</label>
                    <select
                        value={selectedSongId}
                        onChange={(e) => setSelectedSongId(e.target.value)}
                        className={styles.select}
                    >
                        <option value="">-- 曲を選択してください --</option>
                        {SONGS.map(song => (
                            <option key={song.id} value={song.id}>{song.title}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.selectorGroup}>
                    {selectedSong && (
                        <button
                            className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
                            onClick={handlePlay}
                        >
                            {isPlaying ? '■ 停止' : '▶ 再生して練習'}
                        </button>
                    )}
                </div>

                <div className={styles.selectorGroup}>
                    <label className={styles.label}>表示形式:</label>
                    <div className={styles.toggleGroup}>
                        <button
                            className={`${styles.toggleBtn} ${displayMode === 'solfege' ? styles.active : ''}`}
                            onClick={() => setDisplayMode('solfege')}
                        >
                            ドレミ
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${displayMode === 'alpha' ? styles.active : ''}`}
                            onClick={() => setDisplayMode('alpha')}
                        >
                            ABC
                        </button>
                    </div>
                </div>
            </div>

            {selectedSong && (
                <div className={styles.sheetMusicDisplay}>
                    {/* Clef Removed */}
                    <div className={styles.scoreContainer}>
                        {selectedSong.bars.map((bar, barIndex) => (
                            <div key={barIndex} className={styles.measure}>
                                {bar.map((note, noteIndex) => {
                                    const isCurrent = isPlaying && currentBarIndex === barIndex && currentNoteIndex === noteIndex;
                                    const offset = getNoteOffset(note.key);

                                    // Ledger Line Logic Removed
                                    const relativeStep = (offset - 36) / 6;
                                    const stemDown = relativeStep >= 4; // Midline logic kept for stem direction

                                    return (
                                        <div
                                            key={noteIndex}
                                            className={`${styles.scoreNote} ${note.duration === 2 ? styles.half : note.duration === 1 ? styles.whole : ''} ${isCurrent ? styles.activeNote : ''}`}
                                            data-duration={note.duration}
                                            style={{ marginBottom: `${offset}px` }}
                                        >
                                            <div className={styles.noteVisual}>
                                                <span className={styles.noteHead}></span>
                                                {note.duration >= 4 && <span className={`${styles.noteStem} ${stemDown ? styles.stemDown : ''}`}></span>}
                                                {/* Ledger Lines Removed */}
                                            </div>
                                            <div className={styles.noteLabel}>
                                                {displayMode === 'solfege' ? note.solfege : note.display}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className={styles.barLine}></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
