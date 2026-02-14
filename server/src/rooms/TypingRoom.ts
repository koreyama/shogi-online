
import { Room, Client } from "colyseus";
import { Schema, MapSchema, type } from "@colyseus/schema";
import { TYPING_WORDS } from "../lib/typing/data";

export class TypingPlayer extends Schema {
    @type("string") name: string = "";
    @type("string") id: string = "";
    @type("number") score: number = 0; // Total successful keystrokes or words
    @type("string") currentWord: string = "";
    @type("string") currentKana: string = "";
    @type("number") charIndex: number = 0; // How many chars typed in current word
    @type("number") wpm: number = 0;
    @type("boolean") isReady: boolean = false;
    @type("boolean") isHost: boolean = false;
    @type("boolean") finished: boolean = false;
}

export class TypingState extends Schema {
    @type("string") phase: string = "waiting"; // waiting, battle, finished
    @type({ map: TypingPlayer }) players = new MapSchema<TypingPlayer>();
    @type("number") gauge: number = 0; // -100 (P2 Win) to 100 (P1 Win). 0 is neutral.
    @type("number") timeRemaining: number = 180;
    @type("string") winnerId: string = "";
}

export class TypingRoom extends Room<TypingState> {
    maxClients = 2;
    timerInterval: any;

    onCreate(options: any) {
        this.setState(new TypingState());

        this.onMessage("start", (client) => {
            const player = this.state.players.get(client.sessionId);
            if (player && player.isHost && this.state.phase === "waiting") {
                this.startGame();
            }
        });

        this.onMessage("type", (client, message: { damage: number }) => {
            if (this.state.phase !== "battle") return;

            // In this 'optimistic' design, client sends damage when they finish a word or char.
            // For now, let's assume client sends 'damage' = 1 per char, or bonus per word.
            // We verify purely by trusting client for MVP latency.
            // Ideally we should track word progress on server too, but let's stick to the plan:
            // "Client judges -> sends damage"

            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            // Identify Player 1 vs Player 2
            // P1 pushes Positive (+), P2 pushes Negative (-)
            const clientIds = Array.from(this.state.players.keys());
            const isP1 = (client.sessionId === clientIds[0]);

            const direction = isP1 ? 1 : -1;
            const scrollAmount = message.damage * direction;

            this.state.gauge += scrollAmount;

            // Clamp gauge with buffer for win check
            if (this.state.gauge >= 100) {
                this.finishGame(clientIds[0]);
            } else if (this.state.gauge <= -100) {
                this.finishGame(clientIds[1]);
            }

            // Update score
            player.score += message.damage;
        });

        // Handle "ready" status if we want strict sync start, but "start" message is enough for now.
    }

    onJoin(client: Client, options: any) {
        const player = new TypingPlayer();
        player.id = client.sessionId;
        player.name = options.name || `Player ${this.clients.length + 1}`;
        player.isHost = (this.clients.length === 1);
        this.state.players.set(client.sessionId, player);

        console.log(`${player.name} joined TypingRoom!`);
    }

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);
        if (this.state.players.size === 0) {
            if (this.timerInterval) clearInterval(this.timerInterval);
        }
    }

    onDispose() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    startGame() {
        this.state.phase = "battle";
        this.state.gauge = 0;
        this.state.timeRemaining = 180;

        // Assign initial words? 
        // Client can pick random words from shared local data, 
        // OR Server sends seed. Let's rely on Shared Data + Random for MVP.

        this.broadcast("game_start", { startTime: Date.now() });

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.state.timeRemaining--;
            if (this.state.timeRemaining <= 0) {
                this.finishGameByTime();
            }
        }, 1000);
    }

    finishGame(winnerId: string) {
        this.state.phase = "finished";
        this.state.winnerId = winnerId;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.broadcast("game_over", { winnerId });
    }

    finishGameByTime() {
        // Check gauge
        let winnerId = "";
        if (this.state.gauge > 0) {
            // P1 Win
            const p1 = Array.from(this.state.players.values()).find((p, i) => i === 0); // Logic relies on insertion order? MapSchema preserves order?
            // Safer to use keys array
            const ids = Array.from(this.state.players.keys());
            winnerId = ids[0];
        } else if (this.state.gauge < 0) {
            // P2 Win
            const ids = Array.from(this.state.players.keys());
            winnerId = ids[1] || "";
        } else {
            winnerId = "draw";
        }
        this.finishGame(winnerId);
    }
}
