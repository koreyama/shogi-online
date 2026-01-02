'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { pianoEngine, InstrumentType } from '@/lib/piano/AudioEngine';
import HideChatBot from '@/components/HideChatBot';

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

export default function PianoPage() {
    const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);

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
        if (!navigator.requestMIDIAccess) return;

        const onMidiMessage = (message: any) => {
            if (!message.data) return;
            const [status, note, velocity] = message.data;
            const command = status & 0xF0;

            const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const octave = Math.floor(note / 12) - 1;
            const name = noteNames[note % 12];
            const noteStr = `${name}${octave}`; // e.g. "C#4"

            if (command === 0x90 && velocity > 0) { // Note On
                resumeAudio();
                playNote(noteStr);
            } else if (command === 0x80 || (command === 0x90 && velocity === 0)) { // Note Off
                stopNote(noteStr);
            }
        };

        navigator.requestMIDIAccess().then((access) => {
            console.log("MIDI Access Granted");
            const inputs = access.inputs.values();
            for (const input of inputs) {
                input.onmidimessage = onMidiMessage;
                setMidiDevice(input.name || 'Unknown Device');
            }
            access.onstatechange = (e: any) => {
                if (e.port.state === 'connected' && e.port.type === 'input') {
                    setMidiDevice(e.port.name);
                    e.port.onmidimessage = onMidiMessage;
                }
            };
        }).catch(err => {
            console.warn("MIDI Access Failed:", err);
        });

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

    if (!mounted) return null;

    return (
        <div
            onClick={resumeAudio}
            style={{
                width: '100vw',
                height: '100vh',
                background: '#f8f9fa', // Light gray/white background
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#333', // Dark text
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                userSelect: 'none',
                overflow: 'hidden'
            }}
        >
            <HideChatBot />
            {/* Loading Overlay (Light Theme) */}
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.9)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#333'
                }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 500 }}>音源データを読み込み中...</div>
                    <div style={{ width: '300px', height: '4px', background: '#eee', borderRadius: '2px' }}>
                        <div style={{ width: `${loadProgress}%`, height: '100%', background: '#333', transition: 'width 0.1s' }}></div>
                    </div>
                    <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>{loadProgress}%</div>
                </div>
            )}

            <div style={{
                marginBottom: '2.5rem',
                textAlign: 'center'
            }}>
                <h1 style={{
                    margin: 0,
                    fontWeight: '300',
                    letterSpacing: '2px',
                    color: '#111',
                    fontSize: '2rem'
                }}>Virtual Piano</h1>
                <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem', letterSpacing: '1px' }}>Simple & Clean</p>
            </div>

            {/* Control Panel (Minimalist) */}
            <div style={{
                display: 'flex',
                gap: '2.5rem',
                marginBottom: '2rem',
                background: '#fff',
                padding: '1.2rem 2.5rem',
                borderRadius: '50px', // Pill shape
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                alignItems: 'center'
            }}>
                {/* Reverb Control */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.7rem', color: '#999', marginBottom: '0.5rem', fontWeight: 600 }}>リバーブ (残響)</label>
                    <input
                        type="range"
                        min="0" max="1" step="0.01"
                        value={reverb}
                        onChange={e => setReverb(parseFloat(e.target.value))}
                        style={{ width: '80px', cursor: 'pointer', accentColor: '#333' }}
                    />
                </div>

                {/* Volume Control */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid #eee', paddingLeft: '2.5rem' }}>
                    <label style={{ fontSize: '0.7rem', color: '#999', marginBottom: '0.5rem', fontWeight: 600 }}>音量</label>
                    <input
                        type="range"
                        min="0" max="1.5" step="0.05"
                        value={volume}
                        onChange={e => setVolume(parseFloat(e.target.value))}
                        style={{ width: '80px', cursor: 'pointer', accentColor: '#333' }}
                    />
                </div>

                {/* Instrument Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid #eee', paddingLeft: '2.5rem' }}>
                    <label style={{ fontSize: '0.7rem', color: '#999', marginBottom: '0.5rem', fontWeight: 600 }}>楽器 / 音色</label>
                    <select
                        value={currentInstrument}
                        onChange={(e) => loadInstrument(e.target.value as any)}
                        style={{
                            background: 'transparent',
                            color: '#333',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            outline: 'none',
                            cursor: 'pointer',
                            minWidth: '160px'
                        }}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid #eee', paddingLeft: '2.5rem' }}>
                    <label style={{ fontSize: '0.7rem', color: '#999', marginBottom: '0.5rem', fontWeight: 600 }}>メトロノーム</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => setIsMetronomeOn(!isMetronomeOne)}
                            style={{
                                background: isMetronomeOne ? '#333' : '#eee',
                                border: 'none',
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isMetronomeOne ? '#fff' : '#999',
                                fontSize: '0.7rem'
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
                                style={{ width: '80px', cursor: 'pointer', accentColor: '#333' }}
                            />
                            <span style={{ fontSize: '0.9rem', width: '30px', textAlign: 'right', fontFamily: 'monospace', color: '#555' }}>{bpm}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Piano Chassis - Modern Clean */}
            <div style={{
                position: 'relative',
                background: '#fff',
                padding: '30px 20px 20px 20px',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                border: '1px solid #f0f0f0'
            }}>
                {/* No Gold Trim, No Felt, just clean */}

                <div style={{ display: 'flex', position: 'relative', zIndex: 1 }}>
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
                                    style={{
                                        width: '60px',
                                        height: '280px',
                                        background: isActive ? '#f0f0f0' : '#fff',
                                        border: '1px solid #e0e0e0',
                                        borderBottom: isActive ? '2px solid #ddd' : '6px solid #ddd',
                                        borderRadius: '0 0 4px 4px',
                                        marginRight: '-1px',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        zIndex: 1,
                                        transform: isActive ? 'translateY(2px)' : 'none',
                                        transformOrigin: 'top',
                                        transition: 'transform 0.05s ease-out, background 0.1s',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        justifyContent: 'center',
                                        paddingBottom: '20px',
                                        color: isActive ? '#333' : '#ddd',
                                        fontWeight: '500',
                                        fontSize: '0.7rem',
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
                            const leftPos = (whiteKeysBefore * 59) - 18; // Adjusted spacing

                            return (
                                <div
                                    key={n.note}
                                    onMouseDown={() => { resumeAudio(); playNote(n.note); }}
                                    onMouseUp={() => stopNote(n.note)}
                                    onMouseLeave={() => stopNote(n.note)}
                                    onTouchStart={(e) => { e.preventDefault(); resumeAudio(); playNote(n.note); }}
                                    onTouchEnd={(e) => { e.preventDefault(); stopNote(n.note); }}
                                    style={{
                                        position: 'absolute',
                                        left: `${leftPos}px`,
                                        top: 0,
                                        width: '40px',
                                        height: '170px',
                                        background: isActive ? '#444' : '#222',
                                        borderRadius: '0 0 3px 3px',
                                        cursor: 'pointer',
                                        zIndex: 10,
                                        transform: isActive ? 'translateY(2px)' : 'none',
                                        transformOrigin: 'top',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        justifyContent: 'center',
                                        paddingBottom: '15px',
                                        color: '#666',
                                        fontSize: '0.6rem',
                                        transition: 'transform 0.05s ease-out'
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

            <div style={{ marginTop: '50px', display: 'flex', gap: '20px' }}>
                <Link href="/" style={{ color: '#999', textDecoration: 'none', fontSize: '0.8rem', borderBottom: '1px solid #eee' }}>Home</Link>
            </div>

            {/* Simple MIDI Status */}
            <div style={{
                position: 'fixed', bottom: '20px', right: '20px',
                fontSize: '0.8rem', color: midiDevice ? '#48bb78' : '#ccc',
                display: 'flex', alignItems: 'center', gap: '6px'
            }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: midiDevice ? '#48bb78' : '#ddd' }}></div>
                {midiDevice ? `MIDI: ${midiDevice}` : 'MIDI Not Connected'}
            </div>
        </div>
    );
}
