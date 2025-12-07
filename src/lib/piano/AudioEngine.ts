export class PianoSynthesizer {
    public audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;

    private activeOscillators: Map<string, { osc: OscillatorNode[], gain: GainNode }> = new Map();
    public activeNotes: Set<string> = new Set();

    constructor() { }

    private initContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.audioContext.destination);
            console.log("AudioEngine: Safe Mode Initialized");
        }
    }

    public getStatus(): string {
        return this.audioContext ? this.audioContext.state : 'uninitialized';
    }

    public resume() {
        this.initContext();
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    private getFrequency(note: string): number {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octaveStr = note.slice(-1);
        const key = note.slice(0, -1);
        const octave = parseInt(octaveStr);
        const keyIndex = notes.indexOf(key);

        if (keyIndex === -1) return 440;
        const semitonesFromA4 = (octave - 4) * 12 + (keyIndex - 9);
        return 440 * Math.pow(2, semitonesFromA4 / 12);
    }

    public playNote(note: string) {
        this.resume();

        if (!this.audioContext || !this.masterGain) return;

        // Cut off previous if same note
        if (this.activeOscillators.has(note)) {
            this.stopNote(note);
        }

        const frequency = this.getFrequency(note);
        const now = this.audioContext.currentTime;

        const osc1 = this.audioContext.createOscillator();
        const noteGain = this.audioContext.createGain();

        // Safe Waveform: Triangle (Better than Square, simpler than custom)
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(frequency, now);

        // Simple Envelope
        // Attack: 0 -> 0.6 in 0.05s
        // Decay/Sustain: 0.6 -> 0.4 in 0.2s
        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.6, now + 0.05);
        noteGain.gain.linearRampToValueAtTime(0.4, now + 0.3);

        // Direct Routing (No Reverb to avoid failure)
        osc1.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc1.start(now);

        this.activeOscillators.set(note, { osc: [osc1], gain: noteGain });
        this.activeNotes.add(note);
    }

    public stopNote(note: string) {
        if (!this.audioContext) return;
        const noteData = this.activeOscillators.get(note);

        if (noteData) {
            const now = this.audioContext.currentTime;
            const release = 0.2;

            // Simple Release
            // Cancel any future scheduled values
            try {
                noteData.gain.gain.cancelScheduledValues(now);
                noteData.gain.gain.setValueAtTime(noteData.gain.gain.value, now);
                noteData.gain.gain.linearRampToValueAtTime(0, now + release);
            } catch (e) {
                // Fallback if float timing is off
                noteData.gain.gain.value = 0;
            }

            noteData.osc.forEach(o => o.stop(now + release + 0.1));

            setTimeout(() => {
                if (this.activeOscillators.get(note) === noteData) {
                    this.activeOscillators.delete(note);
                }
            }, release * 1000 + 100);
        }
        this.activeNotes.delete(note);
    }
}

export const pianoEngine = new PianoSynthesizer();
