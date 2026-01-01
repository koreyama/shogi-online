export type InstrumentType =
    | 'acoustic_grand_piano'
    | 'electric_guitar_jazz'
    | 'string_ensemble_1'
    | 'violin'
    | 'cello'
    | 'trumpet'
    | 'flute'
    | 'alto_sax'
    | 'church_organ'
    | 'choir_aahs'
    | 'lead_1_square'
    | 'sitar'
    | 'steel_drums'
    | 'koto'; // Koto might not be in the standard list, I'll fallback or use a similar one if not found, but Koto is in GM (107).

const BASE_URL = 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM';

export class PianoSynthesizer {
    public audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private reverbNode: ConvolverNode | null = null;
    private dryGain: GainNode | null = null;
    private wetGain: GainNode | null = null;

    private buffers: Map<string, AudioBuffer> = new Map(); // key: "instrument_note"
    private activeSources: Map<string, { source: AudioBufferSourceNode, gain: GainNode }> = new Map();

    private currentInstrument: InstrumentType = 'acoustic_grand_piano';
    public isLoading: boolean = false;
    private loadedInstruments: Set<InstrumentType> = new Set();

    // Callbacks
    public onLoadProgress: ((progress: number) => void) | null = null;
    public onLoadComplete: (() => void) | null = null;

    constructor() { }

    private initContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 2.0; // Boosted initial volume
            this.masterGain.connect(this.audioContext.destination);

            // Reverb Setup
            this.dryGain = this.audioContext.createGain();
            this.wetGain = this.audioContext.createGain();
            this.reverbNode = this.audioContext.createConvolver();

            this.dryGain.connect(this.masterGain);
            this.reverbNode.connect(this.wetGain);
            this.wetGain.connect(this.masterGain);

            this.setupReverbImpulse();
            this.updateReverbMix(0.3);

            console.log("AudioEngine: Sampler Mode Initialized");
        }
    }

    private setupReverbImpulse() {
        if (!this.audioContext || !this.reverbNode) return;
        // Simple impulse
        const length = this.audioContext.sampleRate * 2.0;
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        const l = impulse.getChannelData(0);
        const r = impulse.getChannelData(1);
        for (let i = 0; i < length; i++) {
            const dec = Math.pow(1 - i / length, 2);
            l[i] = (Math.random() * 2 - 1) * dec;
            r[i] = (Math.random() * 2 - 1) * dec;
        }
        this.reverbNode.buffer = impulse;
    }

    private updateReverbMix(amount: number) {
        if (!this.dryGain || !this.wetGain || !this.audioContext) return;
        const dry = Math.cos(amount * Math.PI / 2);
        const wet = Math.sin(amount * Math.PI / 2);
        this.dryGain.gain.setValueAtTime(dry, this.audioContext.currentTime);
        this.wetGain.gain.setValueAtTime(wet, this.audioContext.currentTime);
    }

    public async loadInstrument(instrument: InstrumentType) {
        this.initContext();
        if (this.loadedInstruments.has(instrument)) {
            this.currentInstrument = instrument;
            if (this.onLoadComplete) this.onLoadComplete();
            return;
        }

        this.isLoading = true;

        try {
            // Fetch the instrument JSON which contains base64 sound data (or separate files)
            // gleitz/midi-js-soundfonts hosts individual JS files that export the data suitable for midi.js
            // But playing directly using Web Audio requires just the raw audio.
            // Actually, querying the json index is easier:
            // https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/{instrument}-mp3.js
            // NOTE: The -mp3.js format puts data in a global variable.
            // Better to use raw MP3 files if available, BUT this repo serves JS wrapped base64 to avoid CORS/formatting issues easily.
            // Let's try parsing the JS (it's essentially JSONP).

            // To be safer and simpler for this environment, let's use a simpler approach if possible.
            // However, grabbing all notes individually is 88 requests.
            // The JSON contains all notes.

            // Strategy: Load as a JavaScript script tag
            // The file executes: MIDI.Soundfont.acoustic_grand_piano = { ... }
            // This sets a global variable we can access.

            const loadScript = (url: string): Promise<any> => {
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = url;
                    script.async = true;
                    script.onload = () => resolve(true);
                    script.onerror = () => reject(new Error(`Script load failed for ${url}`));
                    document.body.appendChild(script);
                    // Cleanup? Maybe keep it or remove it. Removing might be cleaner.
                    // document.body.removeChild(script); 
                });
            };

            // 1. Try Local
            let loaded = false;
            try {
                console.log(`Loading local soundfont script: /soundfonts/${instrument}-mp3.js`);
                await loadScript(`/soundfonts/${instrument}-mp3.js`);
                loaded = true;
            } catch (localErr) {
                console.log("Local script failed, trying CDN...");
                try {
                    await loadScript(`${BASE_URL}/${instrument}-mp3.js`);
                    loaded = true;
                } catch (remoteErr) {
                    console.warn("Remote script also failed.", remoteErr);
                }
            }

            if (!loaded) {
                throw new Error("Could not load soundfont script from local or CDN.");
            }

            // Access Global Data
            // @ts-ignore
            const midiGlobal = (window as any).MIDI;
            if (!midiGlobal || !midiGlobal.Soundfont || !midiGlobal.Soundfont[instrument]) {
                throw new Error("Soundfont loaded but data not found in window.MIDI");
            }

            const noteData = midiGlobal.Soundfont[instrument];

            // Now decode all audio data
            const keys = Object.keys(noteData);
            let loadedCount = 0;

            await Promise.all(keys.map(async (noteName) => {
                const base64Audio = noteData[noteName].split(',')[1];
                if (!base64Audio) return;

                try {
                    const audioData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)).buffer;

                    if (this.audioContext) {
                        const audioBuffer = await this.audioContext.decodeAudioData(audioData);
                        // Map "A0" -> "A0"
                        this.buffers.set(`${instrument}_${noteName}`, audioBuffer);
                    }
                } catch (decodeErr) {
                    console.warn(`Failed to decode note ${noteName}`, decodeErr);
                }

                loadedCount++;
                if (this.onLoadProgress) {
                    this.onLoadProgress(loadedCount / keys.length);
                }
            }));

            this.loadedInstruments.add(instrument);
            this.currentInstrument = instrument;
            console.log(`Instrument loaded: ${instrument}`);

        } catch (e) {
            console.warn("Failed to load instrument soundfont (falling back to synth):", e);
            // Do not throw, do not console.error (triggers overlay)
            // Just ensure we are not "loading" anymore
        } finally {
            this.isLoading = false;
            if (this.onLoadComplete) this.onLoadComplete();
        }
    }

    public resume() {
        this.initContext();
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    public playNote(note: string) {
        this.resume();
        if (!this.audioContext || !this.dryGain || !this.reverbNode) return;

        // Stop existing
        this.stopNote(note);

        const bufferKey = `${this.currentInstrument}_${note}`;
        const buffer = this.buffers.get(bufferKey);

        /* 
           Note Mapping Fallback:
           The soundfont might name notes as "A3", "C#4", "Bb4".
           Our input is "C#4".
           If exact not found, we might need to handle Enharmonics (C# == Db) later.
        */

        // Try finding enharmonic if missing (simple swap for now or just trust the keys)
        // The soundfont usually uses "A0", "Bb0", "B0". It uses 'b' for flats, not '#' for sharps usually.
        let targetKey = bufferKey;
        if (!buffer) {
            // Convert C#4 to Db4
            const sharpToFlat: Record<string, string> = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
            const match = note.match(/^([A-G]#?)(\d+)$/);
            if (match) {
                const pitch = match[1];
                const oct = match[2];
                if (sharpToFlat[pitch]) {
                    targetKey = `${this.currentInstrument}_${sharpToFlat[pitch]}${oct}`;
                }
            }
        }

        const finalBuffer = this.buffers.get(targetKey);
        if (!finalBuffer) {
            // Fallback: Play a simple oscillator if sample is missing
            this.playFallbackNote(note);
            return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = finalBuffer;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);

        source.connect(gainNode);
        gainNode.connect(this.dryGain);
        gainNode.connect(this.reverbNode);

        source.start(0);

        this.activeSources.set(note, { source, gain: gainNode });
    }

    private playFallbackNote(note: string) {
        if (!this.audioContext || !this.dryGain || !this.reverbNode) return;
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const match = note.match(/^([A-G]#?)(-?\d+)$/);
        if (!match) return;

        const key = match[1];
        const octave = parseInt(match[2]);
        const keyIndex = notes.indexOf(key);

        const semitonesFromA4 = (octave - 4) * 12 + (keyIndex - 9);
        const frequency = 440 * Math.pow(2, semitonesFromA4 / 12);

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'triangle';
        osc.frequency.value = frequency;

        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gain);
        gain.connect(this.dryGain);
        gain.connect(this.reverbNode);

        osc.start(now);
        osc.stop(now + 1.0);

        // We don't track synth fallbacks in activeSources for stopNote simplicity in this hybrid mode
    }

    public stopNote(note: string) {
        // With samples, we fade out over a short release time to avoid clicks
        // Or if it's a piano, we let it ring or damp it depending on pedal (not implemented here)
        // Let's implement a standard release.
        if (!this.audioContext) return;

        const active = this.activeSources.get(note);
        if (active) {
            const now = this.audioContext.currentTime;

            // Release envelope
            active.gain.gain.cancelScheduledValues(now);
            active.gain.gain.setValueAtTime(active.gain.gain.value, now);
            active.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3); // 300ms release

            active.source.stop(now + 0.35);

            // Clean up map later or now? doing it now implies we can't re-trigger immediately if logic depends on map existence.
            // But playNote overwrites, so it's fine.
            this.activeSources.delete(note);
        }
    }

    // Metronome (Synthesized)
    public playMetronomeClick(time: number, isAccent: boolean) {
        if (!this.audioContext || !this.masterGain) return;
        const osc = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        osc.frequency.value = isAccent ? 1200 : 800;
        osc.type = 'square';
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(0.5, time + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    public setReverb(amount: number) {
        this.updateReverbMix(amount);
    }

    public setVolume(value: number) {
        if (this.masterGain && this.audioContext) {
            // Boost the value significantly because samples can be quiet
            // Range 0.0 to 1.0 input -> 0.0 to 3.0 output
            const gain = Math.max(0, value) * 3.0;
            this.masterGain.gain.setValueAtTime(gain, this.audioContext.currentTime);
        }
    }
}

export const pianoEngine = new PianoSynthesizer();
