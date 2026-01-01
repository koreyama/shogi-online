export class MahjongAudioManager {
    private ctx: AudioContext | null = null;
    private enabled: boolean = true;

    constructor() {
    }

    private getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;

        if (!this.ctx) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContext();
        }

        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(console.error);
        }

        return this.ctx;
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    // 打牌音: 短いクリック/衝撃音
    public playDiscard() {
        if (!this.enabled) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // ノイズっぽい音を作るのは大変なので、短く減衰する高い音で代用
        // あるいは短形波で木片のような音をシミュレート
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }

    // 鳴き (ポン/チー/カン): 注意を引く音
    public playCall() {
        if (!this.enabled) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }

    // リーチ: 緊張感のある音（シュッ！）
    public playRiichi() {
        if (!this.enabled) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }

    // 和了 (ロン/ツモ): 祝福音
    public playWin() {
        if (!this.enabled) return;
        const ctx = this.getContext();
        if (!ctx) return;

        // キラキラ感のあるアルペジオ
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
        let time = ctx.currentTime;

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(time);
            osc.stop(time + 0.5);

            time += 0.05;
        });
    }

    // ドラドラ (未使用だが機能として用意): 低い音
    public playDora() {
        if (!this.enabled) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, ctx.currentTime);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }
}

export const audioManager = new MahjongAudioManager();
