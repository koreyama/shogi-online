import React, { useState, useEffect, useCallback } from 'react';
import styles from './DotsAndBoxes.module.css';
import { IconRobot, IconUser } from '@/components/Icons';
import { db } from '@/lib/firebase';
import { ref, onValue, update, set, onDisconnect } from 'firebase/database';

type Player = 1 | 2;
const ROWS = 6;
const COLS = 6;

interface GameState {
    hLines: boolean[][];
    vLines: boolean[][];
    boxes: (Player | null)[][];
    currentPlayer: Player;
    scores: { 1: number; 2: number };
    winner: Player | 0 | null;
    lastCompletedBoxes: { row: number, col: number }[];
}

interface DotsAndBoxesGameProps {
    roomId?: string | null;
    myRole?: 'P1' | 'P2' | null;
}

export default function DotsAndBoxesGame({ roomId, myRole }: DotsAndBoxesGameProps) {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isCpuMode, setIsCpuMode] = useState(true);
    const [isCpuThinking, setIsCpuThinking] = useState(false);
    const [opponentName, setOpponentName] = useState('Opponent');

    useEffect(() => {
        if (!roomId) {
            startNewGame();
        } else {
            setIsCpuMode(false); // Force PvP
            // For P1/P2 in online mode, we wait for Firebase sync (gameState initialized in page.tsx)
        }
    }, [roomId, myRole]);

    // Multiplayer Sync
    useEffect(() => {
        if (!roomId || !myRole) return;

        const roomRef = ref(db, `dots_and_boxes_rooms/${roomId}`);

        // Presence logic: remove self on disconnect to avoid ghost players
        const myRef = ref(db, `dots_and_boxes_rooms/${roomId}/${myRole}`);
        onDisconnect(myRef).remove();

        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            if (data.gameState) {
                setGameState(data.gameState);
            }

            // Sync opponent name
            const oppRole = myRole === 'P1' ? 'P2' : 'P1';
            // If data[oppRole] is missing, it means opponent left or hasn't joined.
            if (data[oppRole]?.name) {
                setOpponentName(data[oppRole].name);
            } else {
                setOpponentName('Opponent'); // Reset if left
            }
        });

        return () => {
            unsubscribe();
            onDisconnect(myRef).cancel(); // Cancel server-side disconnect handler
            set(myRef, null); // Remove self immediately on unmount (navigation/refresh)
        };
    }, [roomId, myRole]);

    // CPU Turn Effect (Only if offline)
    useEffect(() => {
        if (roomId) return; // Disable CPU in Multi
        if (!gameState || gameState.winner !== null || !isCpuMode || gameState.currentPlayer !== 2) {
            return;
        }

        const timer = setTimeout(() => {
            makeCpuMove();
        }, 600);

        return () => clearTimeout(timer);
    }, [gameState, isCpuMode, roomId]);

    const startNewGame = async () => {
        const hLines = Array(ROWS).fill(null).map(() => Array(COLS - 1).fill(false));
        const vLines = Array(ROWS - 1).fill(null).map(() => Array(COLS - 1).fill(false));
        const boxes = Array(ROWS - 1).fill(null).map(() => Array(COLS - 1).fill(null));

        const newGame: GameState = {
            hLines,
            vLines,
            boxes,
            currentPlayer: 1,
            scores: { 1: 0, 2: 0 },
            winner: null,
            lastCompletedBoxes: []
        };

        if (roomId && myRole === 'P1') {
            await update(ref(db, `dots_and_boxes_rooms/${roomId}`), {
                gameState: newGame
            });
        } else if (!roomId) {
            setGameState(newGame);
            setIsCpuThinking(false);
        }
    };

    const checkCompletedBoxes = (
        hLines: boolean[][],
        vLines: boolean[][],
        currentBoxes: (Player | null)[][],
        player: Player
    ): { newBoxes: (Player | null)[][], points: number, completedIndices: { row: number, col: number }[] } => {
        let points = 0;
        const newBoxes = currentBoxes.map(row => [...row]);
        const completedIndices: { row: number, col: number }[] = [];

        for (let r = 0; r < ROWS - 1; r++) {
            for (let c = 0; c < COLS - 1; c++) {
                if (newBoxes[r][c] === null) {
                    const top = hLines[r][c];
                    const bottom = hLines[r + 1][c];
                    const left = vLines[r][c];
                    const right = vLines[r][c + 1];

                    if (top && bottom && left && right) {
                        newBoxes[r][c] = player;
                        points++;
                        completedIndices.push({ row: r, col: c });
                    }
                }
            }
        }
        return { newBoxes, points, completedIndices };
    };

    const countLines = (hLines: boolean[][], vLines: boolean[][], r: number, c: number) => {
        let count = 0;
        if (hLines[r][c]) count++;
        if (hLines[r + 1][c]) count++;
        if (vLines[r][c]) count++;
        if (vLines[r][c + 1]) count++;
        return count;
    }

    const makeCpuMove = () => {
        if (!gameState) return;
        setIsCpuThinking(true);

        const { hLines, vLines, boxes } = gameState;
        let bestMove: { type: 'h' | 'v', r: number, c: number } | null = null;
        const availableMoves: { type: 'h' | 'v', r: number, c: number }[] = [];

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS - 1; c++) {
                if (!hLines[r][c]) availableMoves.push({ type: 'h', r, c });
            }
        }
        for (let r = 0; r < ROWS - 1; r++) {
            for (let c = 0; c < COLS; c++) {
                if (!vLines[r][c]) availableMoves.push({ type: 'v', r, c });
            }
        }

        if (availableMoves.length === 0) return;

        // Strategy 1: Score
        for (const move of availableMoves) {
            const tempHLines = hLines.map(row => [...row]);
            const tempVLines = vLines.map(row => [...row]);
            if (move.type === 'h') tempHLines[move.r][move.c] = true;
            else tempVLines[move.r][move.c] = true;

            const { points } = checkCompletedBoxes(tempHLines, tempVLines, boxes, 2);
            if (points > 0) {
                bestMove = move;
                break;
            }
        }

        // Strategy 2: Safe move
        if (!bestMove) {
            const safeMoves: typeof availableMoves = [];
            for (const move of availableMoves) {
                const tempHLines = hLines.map(row => [...row]);
                const tempVLines = vLines.map(row => [...row]);
                if (move.type === 'h') tempHLines[move.r][move.c] = true;
                else tempVLines[move.r][move.c] = true;

                let givesPoint = false;
                const boxesToCheck: { r: number, c: number }[] = [];
                if (move.type === 'h') {
                    if (move.r > 0) boxesToCheck.push({ r: move.r - 1, c: move.c });
                    if (move.r < ROWS - 1) boxesToCheck.push({ r: move.r, c: move.c });
                } else {
                    if (move.c > 0) boxesToCheck.push({ r: move.r, c: move.c - 1 });
                    if (move.c < COLS - 1) boxesToCheck.push({ r: move.r, c: move.c });
                }

                for (const box of boxesToCheck) {
                    if (countLines(tempHLines, tempVLines, box.r, box.c) === 3) {
                        givesPoint = true;
                        break;
                    }
                }
                if (!givesPoint) safeMoves.push(move);
            }
            if (safeMoves.length > 0) {
                const randBase = Math.floor(Math.random() * safeMoves.length);
                bestMove = safeMoves[randBase];
            }
        }

        // Strategy 3: Random
        if (!bestMove) {
            const randBase = Math.floor(Math.random() * availableMoves.length);
            bestMove = availableMoves[randBase];
        }

        executeMove(bestMove.type, bestMove.r, bestMove.c);
        setIsCpuThinking(false);
    };

    const executeMove = async (type: 'h' | 'v', r: number, c: number) => {
        if (!gameState) return;

        const newHLines = gameState.hLines.map(row => [...row]);
        const newVLines = gameState.vLines.map(row => [...row]);

        if (type === 'h') newHLines[r][c] = true;
        else newVLines[r][c] = true;

        const { newBoxes, points, completedIndices } = checkCompletedBoxes(newHLines, newVLines, gameState.boxes, gameState.currentPlayer);

        const newScores = { ...gameState.scores };
        let nextPlayer = gameState.currentPlayer;

        if (points > 0) {
            newScores[gameState.currentPlayer] += points;
            // Keep turn
        } else {
            nextPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        }

        const totalBoxes = (ROWS - 1) * (COLS - 1);
        const totalScore = newScores[1] + newScores[2];

        let winner: Player | null | 0 = null;
        if (totalScore === totalBoxes) {
            if (newScores[1] > newScores[2]) winner = 1;
            else if (newScores[2] > newScores[1]) winner = 2;
            else winner = 0;
        }

        const newState = {
            hLines: newHLines,
            vLines: newVLines,
            boxes: newBoxes,
            currentPlayer: nextPlayer,
            scores: newScores,
            winner: winner,
            lastCompletedBoxes: completedIndices.length > 0 ? completedIndices : []
        };

        if (roomId) {
            await update(ref(db, `dots_and_boxes_rooms/${roomId}`), {
                gameState: newState
            });
        } else {
            setGameState(newState);
        }
    }

    const handleLineClick = (type: 'h' | 'v', r: number, c: number) => {
        if (!gameState || gameState.winner !== null) return;
        if (isCpuMode && gameState.currentPlayer === 2) return;

        // Multiplayer Turn Check
        if (roomId && myRole) {
            const neededTurn = myRole === 'P1' ? 1 : 2;
            if (gameState.currentPlayer !== neededTurn) return; // Not my turn
        }

        if (type === 'h') {
            if (gameState.hLines[r][c]) return;
        } else {
            if (gameState.vLines[r][c]) return;
        }

        executeMove(type, r, c);
    };

    if (!gameState || !gameState.boxes) {
        return (
            <div className={styles.loader_container}>
                <div className={styles.spinner}></div>
                <p>接続中...</p>
            </div>
        );
    }

    const DOT_SPACING = 50;
    const DOT_RADIUS = 6;
    const PADDING = 20;
    const isGameOver = gameState.winner !== null;

    // Determine name display
    const p1Name = roomId ? (myRole === 'P1' ? 'Me' : opponentName) : 'Player 1';
    const p2Name = roomId ? (myRole === 'P2' ? 'Me' : opponentName) : (isCpuMode ? 'CPU' : 'Player 2');

    return (
        <div className={styles.container}>
            {/* Mode Selection Toggle (Only Offline) */}
            {!roomId && !isGameOver && gameState.scores[1] === 0 && gameState.scores[2] === 0 && (
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', background: '#f3f4f6', padding: '0.5rem', borderRadius: '2rem' }}>
                    <button
                        onClick={() => { setIsCpuMode(true); startNewGame(); }}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '2rem',
                            border: 'none',
                            background: isCpuMode ? '#1f2937' : 'transparent',
                            color: isCpuMode ? '#fff' : '#4b5563',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <IconRobot size={18} /> VS CPU
                    </button>
                    <button
                        onClick={() => { setIsCpuMode(false); startNewGame(); }}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '2rem',
                            border: 'none',
                            background: !isCpuMode ? '#1f2937' : 'transparent',
                            color: !isCpuMode ? '#fff' : '#4b5563',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <IconUser size={18} /> 2 Players
                    </button>
                </div>
            )}

            {/* Score Board */}
            <div className={styles.score_board}>
                <div className={`${styles.player_card} ${gameState.currentPlayer === 1 && !isGameOver ? styles.player_card_active + ' ' + styles.p1_active : ''}`}>
                    {gameState.currentPlayer === 1 && !isGameOver && <div className={`${styles.turn_indicator} ${styles.p1_turn}`}>TURN</div>}
                    <span className={`${styles.player_name} ${styles.p1_name}`}>{p1Name}</span>
                    <span className={styles.player_score}>{gameState.scores[1]}</span>
                </div>
                <div className={`${styles.player_card} ${gameState.currentPlayer === 2 && !isGameOver ? styles.player_card_active + ' ' + styles.p2_active : ''}`}>
                    {gameState.currentPlayer === 2 && !isGameOver && <div className={`${styles.turn_indicator} ${styles.p2_turn}`}>TURN</div>}
                    <span className={`${styles.player_name} ${styles.p2_name}`}>{p2Name}</span>
                    <span className={styles.player_score}>{gameState.scores[2]}</span>
                </div>
            </div>

            {isGameOver && (
                <div className={styles.game_over}>
                    <h2 className={styles.winner_text}>
                        {gameState.winner === 0
                            ? "Draw!"
                            : gameState.winner === 1 ? `${p1Name} Wins!` : `${p2Name} Wins!`
                        }
                    </h2>
                    {(roomId ? myRole === 'P1' : true) && (
                        <button
                            onClick={() => startNewGame()}
                            className={styles.play_again_btn}
                        >
                            もう一度遊ぶ
                        </button>
                    )}
                </div>
            )}

            {/* Game Board (SVG) */}
            <div className={styles.board_wrapper}>
                <svg
                    width={(COLS - 1) * DOT_SPACING + PADDING * 2}
                    height={(ROWS - 1) * DOT_SPACING + PADDING * 2}
                    style={{ display: 'block' }}
                >
                    <g transform={`translate(${PADDING}, ${PADDING})`}>

                        {/* Boxes (Fill) */}
                        {gameState.boxes.map((row, r) =>
                            row.map((owner, c) => {
                                if (owner === null) return null;
                                return (
                                    <rect
                                        key={`box-${r}-${c}`}
                                        x={c * DOT_SPACING}
                                        y={r * DOT_SPACING}
                                        width={DOT_SPACING}
                                        height={DOT_SPACING}
                                        className={owner === 1 ? styles.box_p1 : styles.box_p2}
                                    />
                                );
                            })
                        )}

                        {/* Horizontal Lines */}
                        {gameState.hLines.map((row, r) =>
                            row.map((isActive, c) => {
                                const isLastCompleted = isActive && gameState.lastCompletedBoxes.some(b => b.row === r && b.col === c);
                                return (
                                    <rect
                                        key={`h-${r}-${c}`}
                                        x={c * DOT_SPACING}
                                        y={r * DOT_SPACING - 5}
                                        width={DOT_SPACING}
                                        height={10}
                                        rx={4}
                                        className={`
                                            ${styles.line}
                                            ${isActive ? styles.line_active : (isGameOver ? '' : styles.line_inactive)}
                                            ${isLastCompleted ? styles.line_last_completed : ''}
                                        `}
                                        fill={isActive ? undefined : 'transparent'}
                                        onClick={() => handleLineClick('h', r, c)}
                                    />
                                );
                            })
                        )}

                        {/* Vertical Lines */}
                        {gameState.vLines.map((row, r) =>
                            row.map((isActive, c) => (
                                <rect
                                    key={`v-${r}-${c}`}
                                    x={c * DOT_SPACING - 5}
                                    y={r * DOT_SPACING}
                                    width={10}
                                    height={DOT_SPACING}
                                    rx={4}
                                    className={`
                                        ${styles.line}
                                        ${isActive ? styles.line_active : (isGameOver ? '' : styles.line_inactive)}
                                    `}
                                    fill={isActive ? undefined : 'transparent'}
                                    onClick={() => handleLineClick('v', r, c)}
                                />
                            ))
                        )}

                        {/* Dots */}
                        {Array(ROWS).fill(0).map((_, r) =>
                            Array(COLS).fill(0).map((_, c) => (
                                <circle
                                    key={`dot-${r}-${c}`}
                                    cx={c * DOT_SPACING}
                                    cy={r * DOT_SPACING}
                                    r={DOT_RADIUS}
                                    className={styles.dot}
                                />
                            ))
                        )}

                    </g>
                </svg>
            </div>

            <div className={styles.instructions}>
                <p>点と点の間をクリックして線を引きます。</p>
                <p>四角形を完成させると<span className={styles.point_highlight}>1ポイント</span>獲得し、<span className={styles.extra_turn_highlight}>もう一度行動</span>できます。</p>
            </div>
        </div>
    );
}
