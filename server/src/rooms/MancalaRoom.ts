import { Room, Client } from "colyseus";
import { MancalaState, MancalaPlayer } from "./schema/MancalaState";

const PITS_PER_PLAYER = 6;
const TOTAL_PITS = 14;
const FIRST_STORE = 6;
const SECOND_STORE = 13;

export class MancalaRoom extends Room<MancalaState> {
    maxClients = 2;

    onCreate(options: any) {
        this.setState(new MancalaState());

        // 6-digit numeric ID
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();

        if (options.isPrivate) {
            this.setPrivate(true);
        }

        this.onMessage("chat", (client, message: any) => {
            this.broadcast("chat", message);
        });

        this.onMessage("move", (client, pitIndex: number) => {
            if (!this.state.gameStarted || this.state.isGameOver) return;

            const player = this.state.players.get(client.sessionId);
            if (!player || player.role !== this.state.turn) return;

            this.handleMove(pitIndex);
        });
    }

    onJoin(client: Client, options: any) {
        const count = this.clients.length;
        const role = count === 1 ? "first" : "second";

        const player = new MancalaPlayer();
        player.id = client.sessionId;
        player.name = options.name || "Player";
        player.role = role;
        this.state.players.set(client.sessionId, player);

        if (count === 2) {
            this.state.gameStarted = true;
            this.broadcast("gameStart");
        }
    }

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);
        if (this.state.gameStarted && !this.state.isGameOver) {
            this.broadcast("roomDissolved");
            this.disconnect();
        }
    }

    handleMove(index: number) {
        if (!this.isValidMove(index)) return;

        let seeds = this.state.board[index];
        this.state.board[index] = 0;

        let currentIndex = index;
        const myStore = this.state.turn === 'first' ? FIRST_STORE : SECOND_STORE;
        const opponentStore = this.state.turn === 'first' ? SECOND_STORE : FIRST_STORE;

        while (seeds > 0) {
            currentIndex = (currentIndex + 1) % TOTAL_PITS;

            // 相手のストアはスキップ
            if (currentIndex === opponentStore) continue;

            this.state.board[currentIndex]++;
            seeds--;
        }

        // 最後の種が自分のストアに入ったらもう一度
        let nextTurn = this.state.turn;
        if (currentIndex !== myStore) {
            // 最後の種が自分の空のポケットに入り、かつ対面に種がある場合 -> 横取り
            const isMySide = this.state.turn === 'first'
                ? (currentIndex >= 0 && currentIndex < PITS_PER_PLAYER)
                : (currentIndex > FIRST_STORE && currentIndex < SECOND_STORE);

            if (isMySide && this.state.board[currentIndex] === 1) {
                const oppositeIndex = TOTAL_PITS - 2 - currentIndex;
                if (this.state.board[oppositeIndex] > 0) {
                    this.state.board[myStore] += this.state.board[oppositeIndex] + 1;
                    this.state.board[oppositeIndex] = 0;
                    this.state.board[currentIndex] = 0;
                }
            }
            nextTurn = this.state.turn === 'first' ? 'second' : 'first';
        }

        // ゲーム終了判定
        const firstSideEmpty = Array.from(this.state.board).slice(0, PITS_PER_PLAYER).every(seeds => seeds === 0);
        const secondSideEmpty = Array.from(this.state.board).slice(FIRST_STORE + 1, SECOND_STORE).every(seeds => seeds === 0);

        if (firstSideEmpty || secondSideEmpty) {
            this.state.isGameOver = true;
            // 残りの種をそれぞれのストアへ移動
            for (let i = 0; i < PITS_PER_PLAYER; i++) {
                this.state.board[FIRST_STORE] += this.state.board[i];
                this.state.board[i] = 0;
            }
            for (let i = FIRST_STORE + 1; i < SECOND_STORE; i++) {
                this.state.board[SECOND_STORE] += this.state.board[i];
                this.state.board[i] = 0;
            }

            if (this.state.board[FIRST_STORE] > this.state.board[SECOND_STORE]) this.state.winner = 'first';
            else if (this.state.board[FIRST_STORE] < this.state.board[SECOND_STORE]) this.state.winner = 'second';
            else this.state.winner = 'draw';
        } else {
            this.state.turn = nextTurn;
        }
    }

    isValidMove(index: number): boolean {
        // 自分の側のポケットかチェック
        if (this.state.turn === 'first') {
            if (index < 0 || index >= PITS_PER_PLAYER) return false;
        } else {
            if (index <= FIRST_STORE || index >= SECOND_STORE) return false;
        }

        // 種があるかチェック
        return this.state.board[index] > 0;
    }
}
