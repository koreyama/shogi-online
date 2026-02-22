import { Room, Client } from "colyseus";
import { Schema, MapSchema, type } from "@colyseus/schema";

export class DrawingPlayer extends Schema {
    @type("string") id: string;
    @type("string") name: string;
    @type("number") score: number = 0;
    @type("boolean") isDrawer: boolean = false;
    @type("boolean") isOnline: boolean = true;
    @type("boolean") isHost: boolean = false;

    constructor(id: string = "", name: string = "") {
        super();
        this.id = id;
        this.name = name;
    }
}

export class DrawingState extends Schema {
    @type({ map: DrawingPlayer }) players = new MapSchema<DrawingPlayer>();
    @type("string") currentDrawer: string = "";
    @type("string") currentWord: string = "";
    @type("string") phase: 'lobby' | 'selecting' | 'drawing' | 'result' = 'lobby';
    @type("string") gameMode: 'quiz' | 'free' = 'quiz';
    @type("number") timeLeft: number = 0;
    @type("number") round: number = 1;
    @type("number") maxRounds: number = 3;
}

// Simple word list for MVP
const WORDS = [
    "Apple", "Banana", "Cat", "Dog", "Elephant", "Fish", "Guitar", "House", "Ice Cream", "Jellyfish",
    "Kite", "Lion", "Moon", "Nest", "Orange", "Pizza", "Queen", "Robot", "Sun", "Tree",
    "Umbrella", "Violin", "Watch", "Xylophone", "Yacht", "Zebra", "Computer", "Phone", "Book", "Car"
];

export class DrawingRoom extends Room<DrawingState> {
    maxClients = 6;
    timerInterval: any;
    selectTimer: any;

    // Simple way to avoid repeating words too soon
    usedWords: Set<string> = new Set();
    wordChoices: string[] = [];


    onCreate(options: any) {
        // ... (existing logging)
        const state = new DrawingState();
        this.setState(state);

        this.onMessage("setGameMode", (client, mode) => {
            if (this.state.phase === 'lobby') {
                this.state.gameMode = mode;
                this.broadcast("message", { SYSTEM: true, text: `Game mode set to: ${mode === 'free' ? 'Free Draw' : 'Quiz'}` });
            }
        });

        this.onMessage("start", (client) => {
            if (this.state.phase === 'lobby' && this.state.players.size >= 1) {
                this.startGame();
            }
        });

        // ... existing selectWord ...

        this.onMessage("draw", (client, data) => {
            // Free mode: anyone can draw
            // Quiz mode: only drawer can draw
            const canDraw = this.state.gameMode === 'free' || (client.sessionId === this.state.currentDrawer && this.state.phase === 'drawing');

            if (canDraw) {
                this.broadcast("draw", data, { except: client });
            }
        });

        this.onMessage("clear", (client) => {
            const canClear = this.state.gameMode === 'free' || (client.sessionId === this.state.currentDrawer && this.state.phase === 'drawing');
            if (canClear) {
                this.broadcast("clear");
            }
        });

        this.onMessage("undo", (client, strokeId) => {
            // Allow undo in free mode or if drawer
            const canUndo = this.state.gameMode === 'free' || (client.sessionId === this.state.currentDrawer && this.state.phase === 'drawing');
            if (canUndo) {
                this.broadcast("undo", strokeId);
            }
        });

        this.onMessage("guess", (client, guess) => {
            if (this.state.gameMode === 'free') {
                // Standard Chat in Free Mode
                this.broadcast("chat", { id: client.sessionId, name: this.state.players.get(client.sessionId)?.name, text: guess });
                return;
            }

            if (this.state.phase === 'drawing' && client.sessionId !== this.state.currentDrawer) {
                // ... (Existing Guess Logic) ...
                if (guess.toLowerCase().trim() === this.state.currentWord.toLowerCase()) {
                    // ... (Correct guess logic) ...
                    const player = this.state.players.get(client.sessionId);
                    if (player) {
                        const points = Math.ceil(this.state.timeLeft * 0.5) + 10;
                        player.score += points;
                        const drawer = this.state.players.get(this.state.currentDrawer);
                        if (drawer) drawer.score += 5;
                        this.broadcast("message", { SYSTEM: true, text: `${player.name} guessed correctly! (+${points})` });
                        this.endTurn();
                    }
                } else {
                    this.broadcast("chat", { id: client.sessionId, name: this.state.players.get(client.sessionId)?.name, text: guess });
                }
            } else {
                this.broadcast("chat", { id: client.sessionId, name: this.state.players.get(client.sessionId)?.name, text: guess });
            }
        });
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined!");
        const player = new DrawingPlayer(client.sessionId, options.name || "Guest");

        // First player is host
        if (this.state.players.size === 0) {
            player.isHost = true;
        }

        this.state.players.set(client.sessionId, player);

        // In Free Mode, everyone is initialized as a drawer if game is running
        if (this.state.gameMode === 'free' && this.state.phase === 'drawing') {
            player.isDrawer = true;
        }
    }

    startGame() {
        if (this.state.gameMode === 'free') {
            this.state.phase = 'drawing';
            this.state.timeLeft = 0; // Infinite
            this.state.currentWord = "Free Draw";
            this.state.players.forEach(p => p.isDrawer = true);
            this.broadcast("message", { SYSTEM: true, text: "Free Draw started! Everyone can draw." });
        } else {
            // QUIZ MODE
            this.state.round = 1;
            this.state.players.forEach(p => p.score = 0);

            const playerIds = Array.from(this.state.players.keys());
            this.state.currentDrawer = playerIds[Math.floor(Math.random() * playerIds.length)]; // Random Start

            this.startSelectionPhase();
        }
    }

    // ... existing helpers ...

    nextTurn() {
        if (this.state.gameMode === 'free') return; // No turns in free mode

        const playerIds = Array.from(this.state.players.keys());
        const currentIndex = playerIds.indexOf(this.state.currentDrawer);
        const nextIndex = (currentIndex + 1) % playerIds.length;

        // Simple round increment logic
        if (nextIndex === 0) {
            this.state.round++;
            if (this.state.round > this.state.maxRounds) {
                // Game Over
                this.state.phase = 'result';
                this.broadcast("message", { SYSTEM: true, text: "Game Over! Returning to lobby in 10s..." });
                setTimeout(() => this.resetGame(), 10000);
                return;
            }
        }

        this.state.currentDrawer = playerIds[nextIndex];
        this.startSelectionPhase();
    }
    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
        const player = this.state.players.get(client.sessionId);
        this.state.players.delete(client.sessionId);

        // If drawer left, end turn
        if (this.state.currentDrawer === client.sessionId && (this.state.phase === 'drawing' || this.state.phase === 'selecting')) {
            this.broadcast("message", { SYSTEM: true, text: "Drawer left! Skipping turn." });
            this.endTurn();
        }

        if (this.state.players.size < 2 && this.state.phase !== 'lobby') {
            this.broadcast("message", { SYSTEM: true, text: "Not enough players. Returning to lobby." });
            this.resetGame();
        }

        // Reassign host if needed
        if (player?.isHost && this.state.players.size > 0) {
            const firstPlayer = Array.from(this.state.players.values())[0];
            if (firstPlayer) {
                firstPlayer.isHost = true;
                this.broadcast("message", { SYSTEM: true, text: `${firstPlayer.name} has become the new host.` });
            }
        }
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
        clearInterval(this.timerInterval);
        clearTimeout(this.selectTimer);
    }

    resetGame() {
        this.state.phase = 'lobby';
        this.state.currentDrawer = "";
        this.state.currentWord = "";
        clearInterval(this.timerInterval);
        clearTimeout(this.selectTimer);
    }

    startSelectionPhase() {
        this.state.phase = 'selecting';
        this.state.timeLeft = 15;

        // Update isDrawer flags
        this.state.players.forEach((p, id) => {
            p.isDrawer = (id === this.state.currentDrawer);
        });

        // Generate 3 random words
        this.wordChoices = [];
        for (let i = 0; i < 3; i++) {
            let w = WORDS[Math.floor(Math.random() * WORDS.length)];
            this.wordChoices.push(w);
        }

        const drawerClient = this.clients.find(c => c.sessionId === this.state.currentDrawer);
        if (drawerClient) {
            drawerClient.send("wordChoices", this.wordChoices);
        }

        this.broadcast("message", { SYSTEM: true, text: `Round ${this.state.round}: ${this.state.players.get(this.state.currentDrawer)?.name} is selecting a word.` });

        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            if (this.state.timeLeft <= 0) {
                const autoWord = this.wordChoices[0];
                this.startDrawingPhase(autoWord);
            }
        }, 1000);
    }

    startDrawingPhase(word: string) {
        clearInterval(this.timerInterval);
        this.state.currentWord = word;
        this.state.phase = 'drawing';
        this.state.timeLeft = 60;

        this.broadcast("startDrawing", { drawer: this.state.currentDrawer, length: word.length });

        this.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            if (this.state.timeLeft <= 0) {
                this.broadcast("message", { SYSTEM: true, text: `Time's up! The word was: ${this.state.currentWord}` });
                this.endTurn();
            }
        }, 1000);
    }

    endTurn() {
        clearInterval(this.timerInterval);
        this.state.phase = 'result';
        this.state.timeLeft = 5;

        setTimeout(() => {
            this.nextTurn();
        }, 5000);
    }
}
