
import { Room, Client } from "colyseus";
import { Schema, MapSchema, type } from "@colyseus/schema";
import { QUIZ_DATA, QuizQuestion } from "../lib/quiz/data";

export class QuizPlayer extends Schema {
    @type("string") name: string = "";
    @type("number") score: number = 0;
    @type("boolean") answered: boolean = false;
    @type("boolean") isCorrect: boolean = false;
    @type("number") answerTime: number = 0; // Time taken to answer
    @type("boolean") isReady: boolean = false;
    @type("boolean") isHost: boolean = false;
}

export class QuizState extends Schema {
    @type("string") phase: string = "waiting"; // waiting, question, result, finished
    @type({ map: QuizPlayer }) players = new MapSchema<QuizPlayer>();
    @type("number") currentQuestionIndex: number = 0;
    @type("number") timeRemaining: number = 0;
    @type("string") questionText: string = "";
    @type("string") questionCategory: string = "";
    @type("number") answerLength: number = 0;
    @type("string") correctAnswer: string = ""; // Send to client only in result phase? Or send hashed? For now sending plain for simplicity.
    @type("string") choices: string = ""; // JSON string of shuffled characters
    @type("string") selectedGenre: string = "すべて";
}

export class QuizRoom extends Room<QuizState> {
    maxClients = 6;
    questions: QuizQuestion[] = [];
    currentQuestion: QuizQuestion | null = null;
    timerInterval: any;

    onCreate(options: any) {
        this.setState(new QuizState());

        this.onMessage("selectGenre", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player && player.isHost) {
                this.state.selectedGenre = message.genre || "すべて";
            }
        });

        this.onMessage("start", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (this.state.phase === "waiting" && player && player.isHost) {
                this.startGame();
            }
        });

        this.onMessage("answer", (client, message) => {
            // message.answer: string (full kana string)
            this.handleAnswer(client, message.answer);
        });

        this.onMessage("restart", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player && player.isHost) {
                this.resetGame();
            }
        });

        this.onMessage("next", (client, message) => {
            // Debug or admin force next
        });
    }

    resetGame() {
        this.questions = [];
        this.currentQuestion = null;
        this.state.currentQuestionIndex = 0;
        this.state.phase = "waiting";
        this.state.timeRemaining = 0;
        this.state.questionText = "";
        this.state.questionCategory = "";
        this.state.answerLength = 0;
        this.state.correctAnswer = "";
        this.state.choices = "";

        // Reset player scores/states
        this.state.players.forEach(p => {
            p.score = 0;
            p.answered = false;
            p.isCorrect = false;
            p.answerTime = 0;
            p.isReady = false;
        });

        this.broadcast("reset");
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    onJoin(client: Client, options: any) {
        console.log("QuizRoom join:", client.sessionId, options.name);
        const player = new QuizPlayer();
        player.name = options.name || "Player";
        player.isHost = this.state.players.size === 0; // First player is host
        this.state.players.set(client.sessionId, player);
    }

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);

        // If during question phase, check if remaining players have all answered
        if (this.state.phase === "question") {
            // If no players left, do nothing (onDispose will handle it)
            if (this.state.players.size === 0) return;

            const allAnswered = Array.from(this.state.players.values()).every(p => p.answered);
            if (allAnswered) {
                this.endRound();
            }
        }
    }

    onDispose() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    startGame() {
        // Filter by genre
        let availableQuestions = [...QUIZ_DATA];
        if (this.state.selectedGenre !== "すべて") {
            availableQuestions = availableQuestions.filter(q => q.category === this.state.selectedGenre);
        }

        // If no questions found for genre (should not happen with correct UI), fallback to all
        if (availableQuestions.length === 0) {
            availableQuestions = [...QUIZ_DATA];
        }

        // Init 10 random questions
        const shuffled = availableQuestions.sort(() => 0.5 - Math.random());
        this.questions = shuffled.slice(0, 10);
        this.state.currentQuestionIndex = 0;
        this.state.phase = "starting";
        this.state.timeRemaining = 3; // 3 seconds countdown

        // Broadcast start
        this.broadcast("start");

        // Countdown for starting
        let startCount = 3;
        const startTimer = setInterval(() => {
            startCount--;
            this.state.timeRemaining = startCount;
            if (startCount <= 0) {
                clearInterval(startTimer);
                this.nextQuestion();
            }
        }, 1000);
    }

    nextQuestion() {
        if (this.state.currentQuestionIndex >= this.questions.length) {
            this.finishGame();
            return;
        }

        const q = this.questions[this.state.currentQuestionIndex];
        this.currentQuestion = q;
        this.state.currentQuestionIndex++;

        // Reset player states for new round
        this.state.players.forEach(p => {
            p.answered = false;
            p.isCorrect = false;
            p.answerTime = 0;
        });

        this.state.questionText = q.question;
        this.state.questionCategory = q.category;

        // Normalize to ensure consistent char counting
        const normRuby = q.ruby.normalize('NFC');
        q.ruby = normRuby;

        this.state.answerLength = q.ruby.length;
        this.state.correctAnswer = ""; // Hide answer initially

        // Generate choice tiles
        // 1. Correct chars
        const correctChars = q.ruby.split('');
        // 2. Dummy chars (random hiragana)
        const hiragana = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
        const dummyCount = 12 - correctChars.length; // Ensure 12 tiles total usually
        const dummies = [];
        for (let i = 0; i < Math.max(0, dummyCount); i++) {
            dummies.push(hiragana[Math.floor(Math.random() * hiragana.length)]);
        }
        const combined = [...correctChars, ...dummies].sort(() => 0.5 - Math.random());
        console.log(`Question: ${q.question}, Ruby: ${q.ruby}, Generated Choices: ${JSON.stringify(combined)}`);

        // Safety check to ensure all answer chars are present (detect untypical chars)
        const missing = correctChars.filter(c => !combined.includes(c));
        if (missing.length > 0) {
            console.error(`CRITICAL: Missing characters for answer! Ruby: ${q.ruby}, Missing: ${missing.join(',')}`);
            // Fallback: force add missing
            combined.push(...missing);
        }

        this.state.choices = JSON.stringify(combined);

        this.state.phase = "question";
        this.state.timeRemaining = 15; // Reduced to 15s for better pacing? Or keep 20? Let's keep 20 or user preference. keeping 15 for faster pace

        // Timer
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.state.timeRemaining--;
            if (this.state.timeRemaining <= 0) {
                this.endRound();
            }
        }, 1000);
    }

    handleAnswer(client: Client, answer: string) {
        if (this.state.phase !== "question") return;

        const player = this.state.players.get(client.sessionId);
        if (!player || player.answered) return;

        player.answered = true;

        // Exact match check
        if (this.currentQuestion && answer === this.currentQuestion.ruby) {
            player.isCorrect = true;
            const bonus = Math.max(0, this.state.timeRemaining * 10);
            player.score += (100 + bonus);
            player.answerTime = 15 - this.state.timeRemaining;
        } else {
            player.isCorrect = false;
        }

        // Check if all answered
        const allAnswered = Array.from(this.state.players.values()).every(p => p.answered);
        if (allAnswered) {
            this.endRound();
        }
    }

    endRound() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.state.phase = "result";
        this.state.correctAnswer = this.currentQuestion?.answer || "";
        this.state.timeRemaining = 5; // Result display time

        // Countdown for next question
        this.timerInterval = setInterval(() => {
            this.state.timeRemaining--;
            if (this.state.timeRemaining <= 0) {
                clearInterval(this.timerInterval);
                this.nextQuestion();
            }
        }, 1000);
    }

    finishGame() {
        this.state.phase = "finished";
        if (this.timerInterval) clearInterval(this.timerInterval);
    }
}
