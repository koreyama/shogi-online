import { Room, Client } from "colyseus";
import { HitBlowState, Player, GuessRecord, GuessResult } from "./HitBlowState";

export class HitBlowRoom extends Room<HitBlowState> {
    maxClients = 2;

    onCreate(options: any) {
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();
        this.setState(new HitBlowState());
        this.state.allowDuplicates = options.allowDuplicates || false;

        this.onMessage("guess", (client, message) => {
            if (!this.state.gameStarted || this.state.isGameOver) return;

            const player = this.state.players.get(client.sessionId);
            if (!player || player.role !== this.state.turn) return;

            const guess = message.guess;
            const result = this.checkHitBlow(this.state.secret, guess);

            const record = new GuessRecord();
            record.guess = guess;
            record.result = new GuessResult();
            record.result.hit = result.hit;
            record.result.blow = result.blow;
            record.player = player.role;
            record.timestamp = Date.now();

            this.state.history.push(record);

            if (result.hit === 4) {
                this.state.isGameOver = true;
                this.state.winner = player.role;
                this.state.statusMessage = `${player.name}が正解を当てました！`;
            } else if (this.state.history.length >= 20) { // Max attempts in multiplayer
                this.state.isGameOver = true;
                this.state.statusMessage = "引き分け（回数制限）";
            } else {
                this.state.turn = this.state.turn === "P1" ? "P2" : "P1";
            }
        });

        this.onMessage("chat", (client, message) => {
            this.broadcast("chat", {
                id: `msg-${Date.now()}`,
                sender: message.sender,
                text: message.text,
                timestamp: Date.now()
            });
        });
    }

    onJoin(client: Client, options: any) {
        const player = new Player();
        player.name = options.name || "Anonymous";

        if (this.state.players.size === 0) {
            player.role = "P1";
        } else {
            player.role = "P2";
            this.state.gameStarted = true;
            this.state.secret = this.generateSecret(4, this.state.allowDuplicates);
            this.state.statusMessage = "対戦開始！";
        }

        this.state.players.set(client.sessionId, player);
    }

    onLeave(client: Client, _consented: boolean) {
        const player = this.state.players.get(client.sessionId);
        if (this.state.gameStarted && !this.state.isGameOver) {
            this.state.isGameOver = true;
            this.state.winner = player?.role === "P1" ? "P2" : "P1";
            this.state.statusMessage = "相手が退出しました";
            this.broadcast("roomDissolved");
        }
        this.state.players.delete(client.sessionId);
    }

    private generateSecret(length: number, allowDuplicates: boolean): string {
        const colors = ['R', 'B', 'G', 'Y', 'P', 'O']; // Red, Blue, Green, Yellow, Pink, Orange
        let secret = '';
        const choices = [...colors];

        for (let i = 0; i < length; i++) {
            const index = Math.floor(Math.random() * (allowDuplicates ? colors.length : choices.length));
            const pool = allowDuplicates ? colors : choices;
            secret += pool[index];
            if (!allowDuplicates) {
                choices.splice(index, 1);
            }
        }
        return secret;
    }

    private checkHitBlow(secret: string, guess: string) {
        let hit = 0;
        let blow = 0;

        const secretArr = secret.split('');
        const guessArr = guess.split('');
        const secretUsed = new Array(secret.length).fill(false);
        const guessUsed = new Array(guess.length).fill(false);

        // Hits
        for (let i = 0; i < guess.length; i++) {
            if (guessArr[i] === secretArr[i]) {
                hit++;
                secretUsed[i] = true;
                guessUsed[i] = true;
            }
        }

        // Blows
        for (let i = 0; i < guess.length; i++) {
            if (guessUsed[i]) continue;
            for (let j = 0; j < secret.length; j++) {
                if (!secretUsed[j] && secretArr[j] === guessArr[i]) {
                    blow++;
                    secretUsed[j] = true;
                    break;
                }
            }
        }

        return { hit, blow };
    }
}
