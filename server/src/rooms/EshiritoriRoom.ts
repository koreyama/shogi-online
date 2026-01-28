import { Room, Client } from "colyseus";
import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

// Schema for a single drawing entry in the chain
export class DrawingEntry extends Schema {
    @type("string") playerId: string = "";
    @type("string") playerName: string = "";
    @type("string") targetWord: string = "";  // What they were supposed to draw
    @type("string") guessedWord: string = ""; // What next player guessed
    @type("string") imageData: string = "";   // Base64 canvas snapshot
}

export class EshiritoriPlayer extends Schema {
    @type("string") id: string;
    @type("string") name: string;
    @type("boolean") isHost: boolean = false;
    @type("boolean") isCurrentDrawer: boolean = false;
    @type("boolean") hasDrawn: boolean = false;

    constructor(id: string = "", name: string = "") {
        super();
        this.id = id;
        this.name = name;
    }
}

export class EshiritoriState extends Schema {
    @type({ map: EshiritoriPlayer }) players = new MapSchema<EshiritoriPlayer>();
    @type("string") currentDrawerId: string = "";
    @type("string") phase: string = "lobby";       // lobby, showWord, drawing, guessing, result
    @type("number") timeLeft: number = 0;
    @type("number") turnIndex: number = 0;         // Which player's turn
    @type([DrawingEntry]) drawingHistory = new ArraySchema<DrawingEntry>();
    @type("string") lastImageData: string = "";    // For displaying to guesser
    @type("number") roundsPerPlayer: number = 1;   // Configurable rounds per player
    @type("number") currentRound: number = 1;      // Current round
}

// Starting words for shiritori
const SHIRITORI_WORDS = [
    "りんご", "ごりら", "らっぱ", "ぱんだ", "あめ",
    "あひる", "いぬ", "うさぎ", "えんぴつ", "おにぎり",
    "かめ", "くじら", "くま", "けいさつ", "こあら",
    "さくら", "すいか", "せみ", "たこ", "つき",
    "ねこ", "はな", "ひこうき", "ふね", "まんが"
];

export class EshiritoriRoom extends Room<EshiritoriState> {
    maxClients = 8;
    timerInterval: any;
    playerOrder: string[] = [];
    currentWord: string = "";  // Private - not in synced state

    onCreate(options: any) {
        const state = new EshiritoriState();
        this.setState(state);

        // Start game (works from lobby or result phase for restart)
        this.onMessage("start", (client) => {
            const player = this.state.players.get(client.sessionId);
            if (player?.isHost && (this.state.phase === "lobby" || this.state.phase === "result") && this.state.players.size >= 2) {
                this.startGame();
            }
        });

        // Drawing stroke broadcast
        this.onMessage("draw", (client, data) => {
            if (client.sessionId === this.state.currentDrawerId && this.state.phase === "drawing") {
                this.broadcast("draw", data, { except: client });
            }
        });

        // Clear canvas
        this.onMessage("clear", (client) => {
            if (client.sessionId === this.state.currentDrawerId && this.state.phase === "drawing") {
                this.broadcast("clear");
            }
        });

        // Undo stroke
        this.onMessage("undo", (client, strokeId) => {
            if (client.sessionId === this.state.currentDrawerId && this.state.phase === "drawing") {
                this.broadcast("undo", strokeId);
            }
        });

        // Chat message
        this.onMessage("chat", (client, data: { text: string }) => {
            const player = this.state.players.get(client.sessionId);
            if (player && data.text && data.text.trim()) {
                this.broadcast("message", {
                    text: `${player.name}: ${data.text.trim()}`,
                    system: false
                });
            }
        });

        // Drawer finishes early and submits canvas snapshot
        this.onMessage("finishDrawing", (client, data: { imageData: string }) => {
            if (client.sessionId === this.state.currentDrawerId && this.state.phase === "drawing") {
                this.endDrawingPhase(data.imageData);
            }
        });

        // Guesser submits their guess
        this.onMessage("submitGuess", (client, data: { guess: string }) => {
            if (this.state.phase === "guessing") {
                // Find next drawer (the guesser)
                const nextDrawerIndex = (this.state.turnIndex + 1) % this.playerOrder.length;
                const nextDrawerId = this.playerOrder[nextDrawerIndex];

                if (client.sessionId === nextDrawerId) {
                    this.processGuess(data.guess);
                }
            }
        });

        // Skip current drawing (drawer can skip early)
        this.onMessage("skipDrawing", (client) => {
            if (client.sessionId === this.state.currentDrawerId &&
                (this.state.phase === "drawing" || this.state.phase === "showWord")) {
                // Request canvas snapshot and end drawing
                const drawerClient = this.clients.find(c => c.sessionId === this.state.currentDrawerId);
                if (drawerClient) {
                    drawerClient.send("requestSnapshot");
                    setTimeout(() => {
                        if (this.state.phase === "drawing") {
                            this.endDrawingPhase("");
                        }
                    }, 1000);
                }
            }
        });

        // Update game settings (host only, during lobby)
        this.onMessage("updateSettings", (client, data: { roundsPerPlayer?: number }) => {
            const player = this.state.players.get(client.sessionId);
            if (player?.isHost && this.state.phase === "lobby") {
                if (data.roundsPerPlayer && data.roundsPerPlayer >= 1 && data.roundsPerPlayer <= 5) {
                    this.state.roundsPerPlayer = data.roundsPerPlayer;
                    this.broadcast("message", { system: true, text: `設定変更: 各プレイヤー${data.roundsPerPlayer}枚ずつ描きます` });
                }
            }
        });
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined eshiritori");
        const player = new EshiritoriPlayer(client.sessionId, options.name || "Guest");

        // First player is host
        if (this.state.players.size === 0) {
            player.isHost = true;
        }

        this.state.players.set(client.sessionId, player);
        this.broadcast("message", { system: true, text: `${player.name}が参加しました` });
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left eshiritori");
        const player = this.state.players.get(client.sessionId);
        const leftPlayerId = client.sessionId;

        if (player) {
            this.broadcast("message", { system: true, text: `${player.name}が退出しました` });
        }

        // Remove from player order BEFORE deleting from state
        const playerOrderIndex = this.playerOrder.indexOf(leftPlayerId);
        if (playerOrderIndex !== -1) {
            this.playerOrder.splice(playerOrderIndex, 1);
            // Adjust turnIndex if needed
            if (playerOrderIndex < this.state.turnIndex) {
                this.state.turnIndex--;
            }
        }

        // Now delete from state
        if (player) {
            this.state.players.delete(leftPlayerId);
        }

        // If less than 2 players and game is running, end game
        if (this.state.players.size < 2 && this.state.phase !== "lobby") {
            this.broadcast("message", { system: true, text: "プレイヤーが足りません。ロビーに戻ります。" });
            this.resetGame();
            return;
        }

        // If current drawer left during game, move to next turn
        if (this.state.currentDrawerId === leftPlayerId &&
            (this.state.phase === "drawing" || this.state.phase === "showWord")) {
            clearInterval(this.timerInterval);
            this.broadcast("message", { system: true, text: "描いていたプレイヤーが退出しました。スキップします。" });

            // Check if there are still players to continue
            if (this.playerOrder.length > 0 && this.state.turnIndex < this.playerOrder.length) {
                this.startShowWordPhase();
            } else if (this.playerOrder.length > 0) {
                this.showResults();
            } else {
                this.resetGame();
            }
            return;
        }

        // If the guesser left during guessing phase, auto-submit guess
        if (this.state.phase === "guessing") {
            const nextDrawerIndex = (this.state.turnIndex + 1) % (this.playerOrder.length + 1); // +1 because we already removed
            // If the guesser was the one who left, auto-submit
            if (leftPlayerId === this.playerOrder[nextDrawerIndex - 1]) {
                clearInterval(this.timerInterval);
                this.processGuess("？");
            }
        }

        // Reassign host if needed
        if (player?.isHost && this.state.players.size > 0) {
            const firstPlayer = Array.from(this.state.players.values())[0];
            if (firstPlayer) {
                firstPlayer.isHost = true;
                this.broadcast("message", { system: true, text: `${firstPlayer.name}が新しいホストになりました` });
            }
        }
    }

    onDispose() {
        console.log("eshiritori room disposing...");
        clearInterval(this.timerInterval);
    }

    startGame() {
        // Set player order
        this.playerOrder = Array.from(this.state.players.keys());

        // Shuffle order
        for (let i = this.playerOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.playerOrder[i], this.playerOrder[j]] = [this.playerOrder[j], this.playerOrder[i]];
        }

        // Reset players
        this.state.players.forEach(p => {
            p.hasDrawn = false;
            p.isCurrentDrawer = false;
        });

        // Clear history
        this.state.drawingHistory.clear();
        // Clear history
        this.state.drawingHistory.clear();
        this.state.turnIndex = 0;
        this.state.currentRound = 1;

        // Pick random starting word
        const startWord = SHIRITORI_WORDS[Math.floor(Math.random() * SHIRITORI_WORDS.length)];
        this.currentWord = startWord;

        this.broadcast("message", { system: true, text: "ゲーム開始！" });
        this.startShowWordPhase();
    }

    startShowWordPhase() {
        const drawerId = this.playerOrder[this.state.turnIndex];
        this.state.currentDrawerId = drawerId;
        this.state.phase = "showWord";
        this.state.timeLeft = 3;

        // Update player states
        this.state.players.forEach((p, id) => {
            p.isCurrentDrawer = (id === drawerId);
        });

        // Send word to drawer
        const drawerClient = this.clients.find(c => c.sessionId === drawerId);
        if (drawerClient) {
            drawerClient.send("showWord", { word: this.currentWord });
        }

        this.broadcast("message", {
            system: true,
            text: `${this.state.players.get(drawerId)?.name}の番です！お題を確認中...`
        });

        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            if (this.state.timeLeft <= 0) {
                this.startDrawingPhase();
            }
        }, 1000);
    }

    startDrawingPhase() {
        clearInterval(this.timerInterval);
        this.state.phase = "drawing";
        this.state.timeLeft = 60;

        this.broadcast("clear"); // Clear canvas for new drawing
        this.broadcast("startDrawing", { drawerId: this.state.currentDrawerId });

        this.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            if (this.state.timeLeft <= 0) {
                // Time up - request canvas snapshot from drawer
                const drawerClient = this.clients.find(c => c.sessionId === this.state.currentDrawerId);
                if (drawerClient) {
                    drawerClient.send("requestSnapshot");
                    // Give 2 seconds for snapshot, then force proceed
                    setTimeout(() => {
                        if (this.state.phase === "drawing") {
                            this.endDrawingPhase("");
                        }
                    }, 2000);
                } else {
                    this.endDrawingPhase("");
                }
            }
        }, 1000);
    }

    endDrawingPhase(imageData: string) {
        clearInterval(this.timerInterval);

        // Save the drawing
        const entry = new DrawingEntry();
        entry.playerId = this.state.currentDrawerId;
        entry.playerName = this.state.players.get(this.state.currentDrawerId)?.name || "?";
        entry.targetWord = this.currentWord;
        entry.imageData = imageData;
        this.state.drawingHistory.push(entry);
        this.state.lastImageData = imageData;

        // Mark player as having drawn
        const drawer = this.state.players.get(this.state.currentDrawerId);
        if (drawer) drawer.hasDrawn = true;

        // Always proceed to guessing phase, even for the last player
        // The game end condition is checked in processGuess
        this.startGuessingPhase();
    }

    startGuessingPhase() {
        this.state.phase = "guessing";
        this.state.timeLeft = 30;

        const nextDrawerIndex = (this.state.turnIndex + 1) % this.playerOrder.length;
        const nextDrawerId = this.playerOrder[nextDrawerIndex];

        // Send drawing to next player
        const nextClient = this.clients.find(c => c.sessionId === nextDrawerId);
        if (nextClient) {
            nextClient.send("showDrawing", {
                imageData: this.state.lastImageData,
                previousDrawer: this.state.players.get(this.state.currentDrawerId)?.name
            });
        }

        this.broadcast("message", {
            system: true,
            text: `${this.state.players.get(nextDrawerId)?.name}が絵を見て推測中...`
        });

        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            if (this.state.timeLeft <= 0) {
                // Auto-submit empty guess
                this.processGuess("？");
            }
        }, 1000);
    }

    processGuess(guess: string) {
        clearInterval(this.timerInterval);

        // Update the last entry with the guess
        const lastEntry = this.state.drawingHistory[this.state.drawingHistory.length - 1];
        if (lastEntry) {
            lastEntry.guessedWord = guess;
        }

        // Determine next word based on last character of guess
        const lastChar = this.getLastChar(guess);
        this.currentWord = guess; // Next person draws what was guessed

        // Move to next turn
        this.state.turnIndex++;

        // Check if round is complete
        if (this.state.turnIndex >= this.playerOrder.length) {
            this.state.turnIndex = 0;
            this.state.currentRound++;

            this.broadcast("message", { system: true, text: `ラウンド ${this.state.currentRound} 開始！` });
        }

        // Check if end of game (should have been caught in endDrawingPhase but just in case)
        if (this.state.currentRound > this.state.roundsPerPlayer) {
            this.showResults();
        } else {
            this.startShowWordPhase();
        }
    }

    getLastChar(word: string): string {
        if (!word || word.length === 0) return "あ";

        // Handle small kana conversion
        const smallToLarge: Record<string, string> = {
            'ぁ': 'あ', 'ぃ': 'い', 'ぅ': 'う', 'ぇ': 'え', 'ぉ': 'お',
            'っ': 'つ', 'ゃ': 'や', 'ゅ': 'ゆ', 'ょ': 'よ', 'ゎ': 'わ',
            'ァ': 'ア', 'ィ': 'イ', 'ゥ': 'ウ', 'ェ': 'エ', 'ォ': 'オ',
            'ッ': 'ツ', 'ャ': 'ヤ', 'ュ': 'ユ', 'ョ': 'ヨ', 'ヮ': 'ワ'
        };

        // Handle long vowel mark
        const longVowelMap: Record<string, string> = {
            'あ': 'あ', 'か': 'あ', 'さ': 'あ', 'た': 'あ', 'な': 'あ', 'は': 'あ', 'ま': 'あ', 'や': 'あ', 'ら': 'あ', 'わ': 'あ',
            'い': 'い', 'き': 'い', 'し': 'い', 'ち': 'い', 'に': 'い', 'ひ': 'い', 'み': 'い', 'り': 'い',
            'う': 'う', 'く': 'う', 'す': 'う', 'つ': 'う', 'ぬ': 'う', 'ふ': 'う', 'む': 'う', 'ゆ': 'う', 'る': 'う',
            'え': 'え', 'け': 'え', 'せ': 'え', 'て': 'え', 'ね': 'え', 'へ': 'え', 'め': 'え', 'れ': 'え',
            'お': 'お', 'こ': 'お', 'そ': 'お', 'と': 'お', 'の': 'お', 'ほ': 'お', 'も': 'お', 'よ': 'お', 'ろ': 'お', 'を': 'お'
        };

        let lastChar = word[word.length - 1];

        // Convert small kana to large
        if (smallToLarge[lastChar]) {
            lastChar = smallToLarge[lastChar];
        }

        // Handle 'ー' (long vowel mark)
        if (lastChar === 'ー' && word.length > 1) {
            const prevChar = word[word.length - 2];
            lastChar = longVowelMap[prevChar] || prevChar;
        }

        return lastChar;
    }

    showResults() {
        clearInterval(this.timerInterval);
        this.state.phase = "result";
        this.state.timeLeft = 0;

        this.broadcast("message", { system: true, text: "ゲーム終了！結果を確認しましょう！" });

        // Results will be shown from drawingHistory on client
    }

    resetGame() {
        clearInterval(this.timerInterval);
        this.state.phase = "lobby";
        this.state.currentDrawerId = "";
        this.currentWord = "";
        this.state.turnIndex = 0;
        this.state.currentRound = 1;
        this.state.lastImageData = "";
        this.state.drawingHistory.clear();
        this.playerOrder = [];

        this.state.players.forEach(p => {
            p.hasDrawn = false;
            p.isCurrentDrawer = false;
        });
    }

    nextTurn() {
        this.state.turnIndex++;
        if (this.state.turnIndex >= this.playerOrder.length) {
            this.showResults();
        } else {
            // Skip to next player's drawing phase
            this.startShowWordPhase();
        }
    }
}
