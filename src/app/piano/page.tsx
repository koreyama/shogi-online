'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { pianoEngine } from '@/lib/piano/AudioEngine';

// Note Data for C3 to C5
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

    // Ensure audio starts on any interaction
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

    useEffect(() => {
        setMounted(true);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            // Resume audio just in case they haven't clicked yet
            resumeAudio();

            const note = KEY_MAP[e.key.toLowerCase()];
            if (note) {
                playNote(note);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const note = KEY_MAP[e.key.toLowerCase()];
            if (note) {
                stopNote(note);
            }
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
                background: '#1a202c',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontFamily: 'sans-serif',
                userSelect: 'none'
            }}
        >
            <h1 style={{
                marginBottom: '10px',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                fontFamily: '"Times New Roman", serif',
                letterSpacing: '2px',
                color: '#f0f0f0'
            }}>Virtuoso Grand</h1>

            <p style={{ marginBottom: '40px', color: '#888', fontSize: '0.9rem' }}>キーボード演奏: Z~M (低音) / Q~U (高音)</p>

            {/* Piano Chassis */}
            <div style={{
                position: 'relative',
                background: 'linear-gradient(to bottom, #111 0%, #000 100%)',
                padding: '40px 30px 20px 30px',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)',
                border: '1px solid #111'
            }}>
                {/* Red Felt Strip */}
                <div style={{
                    position: 'absolute',
                    top: '35px',
                    left: '30px',
                    right: '30px',
                    height: '8px',
                    background: '#800000',
                    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5)',
                    zIndex: 0
                }} />

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
                                        height: '240px',
                                        background: isActive ? 'linear-gradient(to bottom, #eee 0%, #ddd 100%)' : 'linear-gradient(to bottom, #fff 0%, #f8f8f8 100%)',
                                        border: '1px solid #333',
                                        borderBottom: isActive ? '2px solid #aaa' : '8px solid #ccc',
                                        borderRadius: '0 0 4px 4px',
                                        marginRight: '-1px', // Seamless look
                                        cursor: 'pointer',
                                        position: 'relative',
                                        zIndex: 1,
                                        transform: isActive ? 'translateY(2px) rotateX(-1deg)' : 'none',
                                        transformOrigin: 'top',
                                        transition: 'transform 0.05s, background 0.1s',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        justifyContent: 'center',
                                        paddingBottom: '15px',
                                        color: isActive ? '#3182ce' : '#ccc',
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem',
                                        boxShadow: isActive ? 'inset 0 0 10px rgba(0,0,0,0.1)' : 'inset -1px 0 5px rgba(0,0,0,0.05)'
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
                            // Calculate position based on white keys before it
                            const whiteKeysBefore = NOTES.slice(0, i).filter(k => k.type === 'white').length;
                            const leftPos = (whiteKeysBefore * 59) - 18;

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
                                        height: '140px',
                                        background: isActive ? 'linear-gradient(to bottom, #222 0%, #111 100%)' : 'linear-gradient(45deg, #222 0%, #000 100%)',
                                        border: '1px solid #000',
                                        borderBottom: isActive ? '2px solid #111' : '8px solid #111',
                                        borderRadius: '0 0 4px 4px',
                                        cursor: 'pointer',
                                        zIndex: 10,
                                        transform: isActive ? 'translateY(2px) rotateX(-1deg)' : 'none',
                                        transformOrigin: 'top',
                                        boxShadow: '4px 4px 10px rgba(0,0,0,0.5)',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        justifyContent: 'center',
                                        paddingBottom: '10px',
                                        color: '#555',
                                        fontSize: '0.7rem'
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

            <div style={{ marginTop: '40px', display: 'flex', gap: '20px' }}>
                <Link href="/" style={{ color: '#aaa', textDecoration: 'underline' }}>ホームに戻る</Link>
            </div>
        </div>
    );
}
