import { Room, Client } from "colyseus";
import { YachtState, Player } from "./schema/YachtState";

const CATEGORIES = [
    'Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes',
    'Choice', '4 of a Kind', 'Full House', 'S. Straight', 'L. Straight', 'Yacht'
];

function calculateScore(category: string, dice: number[]): number {
    const counts = Array(7).fill(0);
    let sum = 0;
    for (const die of dice) {
        counts[die]++;
        sum += die;
    }

    switch (category) {
        case 'Ones': return counts[1] * 1;
        case 'Twos': return counts[2] * 2;
        case 'Threes': return counts[3] * 3;
        case 'Fours': return counts[4] * 4;
        case 'Fives': return counts[5] * 5;
        case 'Sixes': return counts[6] * 6;
        case 'Choice': return sum;
        case '4 of a Kind':
            for (let i = 1; i <= 6; i++) if (counts[i] >= 4) return sum;
            return 0;
        case 'Full House':
            let hasThree = false;
            let hasTwo = false;
            for (let i = 1; i <= 6; i++) {
                if (counts[i] === 3) hasThree = true;
                if (counts[i] === 2) hasTwo = true;
                if (counts[i] === 5) { hasThree = true; hasTwo = true; }
            }
            return (hasThree && hasTwo) ? sum : 0;
        case 'S. Straight':
            let consecutive = 0;
            for (let i = 1; i <= 6; i++) {
                if (counts[i] > 0) consecutive++;
                else consecutive = 0;
                if (consecutive >= 4) return 15;
            }
            return 0;
        case 'L. Straight':
            let consecutiveL = 0;
            for (let i = 1; i <= 6; i++) {
                if (counts[i] > 0) consecutiveL++;
                else consecutiveL = 0;
                if (consecutiveL >= 5) return 30;
            }
            return 0;
        case 'Yacht':
            for (let i = 1; i <= 6; i++) if (counts[i] === 5) return 50;
            return 0;
        default: return 0;
    }
}

function calculateTotal(scores: Map<string, number>) {
    let total = 0;
    let upperSum = 0;
    scores.forEach((val, key) => {
        total += val;
        if (['Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes'].includes(key)) {
            upperSum += val;
        }
    });
    if (upperSum >= 63) total += 35;
    return total;
}

export class YachtRoom extends Room<YachtState> {
    onCreate(options: any) {
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();
        this.maxClients = 2;
        if (options.isPrivate) this.setPrivate(true);

        this.setState(new YachtState());

        this.onMessage("roll", (client) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || player.role !== this.state.turn) return;
            if (this.state.rollsLeft <= 0 || this.state.winner || this.state.isRolling) return;

            this.state.isRolling = true;
            // Broadcast animation start or rely on isRolling

            // Server-side delay for consistency
            setTimeout(() => {
                for (let i = 0; i < 5; i++) {
                    if (!this.state.held[i]) {
                        this.state.dice[i] = Math.floor(Math.random() * 6) + 1;
                    }
                }
                this.state.rollsLeft--;
                this.state.isRolling = false;
            }, 600);
        });

        this.onMessage("toggleHold", (client, index: number) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || player.role !== this.state.turn) return;
            if (this.state.rollsLeft === 3 || this.state.rollsLeft === 0 || this.state.isRolling) return;
            if (index < 0 || index >= 5) return;

            this.state.held[index] = !this.state.held[index];
        });

        this.onMessage("selectCategory", (client, category: string) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || player.role !== this.state.turn) return;
            if (this.state.isRolling || this.state.rollsLeft === 3) return;

            const scores = player.role === 'P1' ? this.state.scoresP1 : this.state.scoresP2;
            if (scores.has(category)) return;

            const score = calculateScore(category, Array.from(this.state.dice));
            scores.set(category, score);

            // Turn change
            if (this.state.scoresP1.size === CATEGORIES.length && this.state.scoresP2.size === CATEGORIES.length) {
                // Game Over
                const s1 = calculateTotal(new Map(this.state.scoresP1));
                const s2 = calculateTotal(new Map(this.state.scoresP2));
                if (s1 > s2) this.state.winner = "P1";
                else if (s2 > s1) this.state.winner = "P2";
                else this.state.winner = "Draw";
                this.broadcast("gameOver", { winner: this.state.winner });
            } else {
                this.state.turn = this.state.turn === "P1" ? "P2" : "P1";
                this.state.rollsLeft = 3;
                for (let i = 0; i < 5; i++) {
                    this.state.dice[i] = 1;
                    this.state.held[i] = false;
                }
            }
        });

        this.onMessage("restart", (client) => {
            if (!this.state.winner) return;
            // Reset state
            this.state.scoresP1.clear();
            this.state.scoresP2.clear();
            this.state.turn = "P1";
            this.state.rollsLeft = 3;
            this.state.winner = "";
            for (let i = 0; i < 5; i++) {
                this.state.dice[i] = 1;
                this.state.held[i] = false;
            }
        });

        this.onMessage("chat", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                this.broadcast("chat", {
                    id: message.id,
                    sender: player.name,
                    text: message.text,
                    timestamp: Date.now()
                });
            }
        });
    }

    onJoin(client: Client, options: any) {
        console.log(`[YachtRoom] ${client.sessionId} joining...`, options);

        // 1. Zombie Purge & Duplicate Purge (by persistent playerId)
        const activeSessionIds = new Set(this.clients.map(c => c.sessionId));
        const incomingPlayerId = options.playerId;

        const toRemove: string[] = [];
        this.state.players.forEach((p, key) => {
            // Remove if session is dead OR if it's the same user (playerId)
            if (!activeSessionIds.has(key) || (incomingPlayerId && p.playerId === incomingPlayerId)) {
                console.log(`[YachtRoom] Purging session ${key} (PlayerId: ${p.playerId})`);
                toRemove.push(key);
            }
        });
        toRemove.forEach(key => this.state.players.delete(key));

        const player = new Player();
        player.id = client.sessionId;
        player.playerId = incomingPlayerId || "";
        player.name = options.name || `Player ${this.state.players.size + 1}`;

        // Explicit role assignment
        if (this.state.players.size === 0) {
            player.role = "P1";
        } else if (this.state.players.size === 1) {
            player.role = "P2";
        } else {
            player.role = "spectator";
        }

        this.state.players.set(client.sessionId, player);

        if (this.state.players.size === 2) {
            this.state.gameStarted = true;
            this.lock();
            this.broadcast("gameStart");
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log(`[YachtRoom] ${client.sessionId} left.`);

        const player = this.state.players.get(client.sessionId);
        const isParticipant = player && (player.role === 'P1' || player.role === 'P2');

        if (player) {
            this.broadcast("chat", {
                id: `system-${Date.now()}`,
                sender: "System",
                text: `${player.name}さんが退出しました。`,
                timestamp: Date.now()
            });
        }

        this.state.players.delete(client.sessionId);

        if (isParticipant) {
            this.state.gameStarted = false;
            this.broadcast("roomDissolved", { reason: "Opponent left the game." });
            this.unlock();

            // Give remaining clients a moment to see the message before closing the room
            this.clock.setTimeout(() => {
                this.clients.forEach(c => {
                    if (c.sessionId !== client.sessionId) {
                        c.leave();
                    }
                });
            }, 1000);
        }
    }
}
