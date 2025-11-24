import { BoardState, GameState, Player, PITS_PER_PLAYER, INITIAL_SEEDS, TOTAL_PITS, FIRST_STORE, SECOND_STORE } from './types';

export const createInitialState = (): GameState => {
    const board = new Array(TOTAL_PITS).fill(INITIAL_SEEDS);
    board[FIRST_STORE] = 0;
    board[SECOND_STORE] = 0;
    return {
        board,
        turn: 'first',
        winner: null,
        isGameOver: false,
    };
};

export const isValidMove = (state: GameState, index: number): boolean => {
    if (state.isGameOver) return false;

    // 自分の側のポケットかチェック
    if (state.turn === 'first') {
        if (index < 0 || index >= PITS_PER_PLAYER) return false;
    } else {
        if (index <= FIRST_STORE || index >= SECOND_STORE) return false;
    }

    // 種があるかチェック
    return state.board[index] > 0;
};

export const executeMove = (currentState: GameState, index: number): GameState => {
    if (!isValidMove(currentState, index)) return currentState;

    const newBoard = [...currentState.board];
    let seeds = newBoard[index];
    newBoard[index] = 0;

    let currentIndex = index;
    const myStore = currentState.turn === 'first' ? FIRST_STORE : SECOND_STORE;
    const opponentStore = currentState.turn === 'first' ? SECOND_STORE : FIRST_STORE;

    while (seeds > 0) {
        currentIndex = (currentIndex + 1) % TOTAL_PITS;

        // 相手のストアはスキップ
        if (currentIndex === opponentStore) continue;

        newBoard[currentIndex]++;
        seeds--;
    }

    // 終了判定とターン交代ロジック
    let nextTurn = currentState.turn;
    let isGameOver = false;
    let winner = currentState.winner;

    // 最後の種が自分のストアに入ったらもう一度
    if (currentIndex === myStore) {
        // nextTurn is same
    } else {
        // 最後の種が自分の空のポケットに入り、かつ対面に種がある場合 -> 横取り
        const isMySide = currentState.turn === 'first'
            ? (currentIndex >= 0 && currentIndex < PITS_PER_PLAYER)
            : (currentIndex > FIRST_STORE && currentIndex < SECOND_STORE);

        if (isMySide && newBoard[currentIndex] === 1) {
            const oppositeIndex = TOTAL_PITS - 2 - currentIndex;
            if (newBoard[oppositeIndex] > 0) {
                newBoard[myStore] += newBoard[oppositeIndex] + 1;
                newBoard[oppositeIndex] = 0;
                newBoard[currentIndex] = 0;
            }
        }
        nextTurn = currentState.turn === 'first' ? 'second' : 'first';
    }

    // ゲーム終了判定（片側のポケットが全て空になったら）
    const firstSideEmpty = newBoard.slice(0, PITS_PER_PLAYER).every(seeds => seeds === 0);
    const secondSideEmpty = newBoard.slice(FIRST_STORE + 1, SECOND_STORE).every(seeds => seeds === 0);

    if (firstSideEmpty || secondSideEmpty) {
        isGameOver = true;
        // 残りの種をそれぞれのストアへ移動
        for (let i = 0; i < PITS_PER_PLAYER; i++) {
            newBoard[FIRST_STORE] += newBoard[i];
            newBoard[i] = 0;
        }
        for (let i = FIRST_STORE + 1; i < SECOND_STORE; i++) {
            newBoard[SECOND_STORE] += newBoard[i];
            newBoard[i] = 0;
        }

        if (newBoard[FIRST_STORE] > newBoard[SECOND_STORE]) winner = 'first';
        else if (newBoard[FIRST_STORE] < newBoard[SECOND_STORE]) winner = 'second';
        else winner = 'draw';
    }

    return {
        board: newBoard,
        turn: isGameOver ? currentState.turn : nextTurn, // ゲーム終了時はターン更新しない（表示用）
        winner,
        isGameOver,
        lastMove: { index, player: currentState.turn }
    };
};
