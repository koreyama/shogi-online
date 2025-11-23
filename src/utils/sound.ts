class SoundManager {
    private context: AudioContext | null = null;
    private isMuted: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            // AudioContextの初期化はユーザーインタラクション後に行う必要があるため、
            // ここではインスタンス作成のみ
        }
    }

    private getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;

        if (!this.context) {
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.context;
    }

    public playMoveSound() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const t = ctx.currentTime;

        // 1. 打撃音 (Attack) - ノイズ成分
        const bufferSize = ctx.sampleRate * 0.1; // 0.1秒
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // 指数減衰するホワイトノイズ
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.01));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // フィルタで木の硬さを表現
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, t); // 中心周波数
        filter.Q.value = 1.0;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(1.0, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(t);

        // 2. 共鳴音 (Resonance) - 盤の響き
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        // 少しピッチを下げることで重みを出す
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);

        oscGain.gain.setValueAtTime(0.4, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.15);
    }

    public playCaptureSound() {
        // 駒を取る音（少し重め）
        if (this.isMuted) return;
        this.playMoveSound();
        // 追加の重低音などがあればここで
    }

    public playWinSound() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const t = ctx.currentTime;

        // 勝利のジングル (和音)
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, t + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.2, t + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 1.5);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(t + i * 0.1);
            osc.stop(t + i * 0.1 + 1.5);
        });
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}

export const soundManager = new SoundManager();
