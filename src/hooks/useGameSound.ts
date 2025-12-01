import { useCallback, useRef } from 'react';

export const useGameSound = () => {
    const audioContextRef = useRef<AudioContext | null>(null);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            // @ts-ignore - Handle webkit prefix for older Safari if needed, though mostly standard now
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioContextRef.current = new AudioContextClass();
            }
        }
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return audioContextRef.current;
    }, []);

    const playTone = useCallback((freq: number, type: OscillatorType, duration: number, startTime: number = 0, volume: number = 0.1) => {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

        gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
    }, [getAudioContext]);

    const playCardPlaySound = useCallback(() => {
        // High pitched "pop"
        playTone(800, 'sine', 0.1, 0, 0.1);
        playTone(1200, 'sine', 0.1, 0.05, 0.05);
    }, [playTone]);

    const playEndTurnSound = useCallback(() => {
        // "Ding" / Switch sound
        playTone(400, 'triangle', 0.2, 0, 0.1);
        playTone(600, 'sine', 0.3, 0.1, 0.1);
    }, [playTone]);

    const playWinSound = useCallback(() => {
        // Ascending arpeggio
        const now = 0;
        playTone(523.25, 'sine', 0.2, now, 0.1); // C5
        playTone(659.25, 'sine', 0.2, now + 0.1, 0.1); // E5
        playTone(783.99, 'sine', 0.2, now + 0.2, 0.1); // G5
        playTone(1046.50, 'sine', 0.6, now + 0.3, 0.1); // C6
    }, [playTone]);

    const playLoseSound = useCallback(() => {
        // Descending tone
        const now = 0;
        playTone(300, 'sawtooth', 0.4, now, 0.1);
        playTone(200, 'sawtooth', 0.4, now + 0.3, 0.1);
        playTone(100, 'sawtooth', 0.8, now + 0.6, 0.1);
    }, [playTone]);

    return {
        playCardPlaySound,
        playEndTurnSound,
        playWinSound,
        playLoseSound
    };
};
