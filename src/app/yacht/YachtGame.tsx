import React, { useState, useEffect } from 'react';
import { CATEGORIES, Category, calculateScore } from './scoring';
import styles from './Yacht.module.css';
import { db } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';

const MAX_ROLLS = 3;

const CATEGORY_LABELS: Record<Category, string> = {
    'Ones': '1 (Ones)',
    'Twos': '2 (Twos)',
    'Threes': '3 (Threes)',
    'Fours': '4 (Fours)',
    'Fives': '5 (Fives)',
    'Sixes': '6 (Sixes)',
    'Choice': 'Choice',
    '4 of a Kind': '4 Cards',
    'Full House': 'Full House',
    'S. Straight': 'S. Straight',
    'L. Straight': 'L. Straight',
    'Yacht': 'Yacht'
};

// 3D Dice Component
const Die = ({ value, held, rolling, onClick, disabled }: { value: number, held: boolean, rolling: boolean, onClick: () => void, disabled: boolean }) => {
    // Required rotation to bring Face N to Front:
    const rotations: Record<number, string> = {
        1: 'rotateX(0deg) rotateY(0deg)',
        6: 'rotateX(0deg) rotateY(180deg)',
        3: 'rotateX(0deg) rotateY(-90deg)',
        4: 'rotateX(0deg) rotateY(90deg)',
        5: 'rotateX(-90deg) rotateY(0deg)',
        2: 'rotateX(90deg) rotateY(0deg)',
    };

    return (
        <div
            className={`${styles.die_wrapper} ${held ? styles.held : ''} ${disabled ? styles.disabled : ''}`}
            onClick={onClick}
        >
            {held && <div className={styles.held_badge}>KEEP</div>}
            <div
                className={styles.die}
                style={{ transform: rotations[value] }}
            >
                {/* Construct all 6 faces */}
                {[1, 6, 3, 4, 5, 2].map((faceVal) => {
                    let faceClass = '';
                    if (faceVal === 1) faceClass = styles.front;
                    if (faceVal === 6) faceClass = styles.back;
                    if (faceVal === 3) faceClass = styles.right;
                    if (faceVal === 4) faceClass = styles.left;
                    if (faceVal === 5) faceClass = styles.top;
                    if (faceVal === 2) faceClass = styles.bottom;

                    const pips = Array(faceVal).fill(0);

                    return (
                        <div key={faceVal} className={`${styles.face} ${faceClass}`} data-value={faceVal}>
                            <div className={styles.face_inner}>
                                {pips.map((_, i) => (
                                    <div key={i} className={`${styles.pip} ${faceVal === 1 ? styles.pip_red : ''}`} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface GameState {
    dice: number[];
    held: boolean[];
    rollsLeft: number;
    scoresP1: Partial<Record<Category, number>>;
    scoresP2: Partial<Record<Category, number>>;
    turn: 'P1' | 'P2';
    isRolling: boolean;
    winner: 'P1' | 'P2' | 'Draw' | null;
}

interface YachtGameProps {
    roomId?: string | null;
    myRole?: 'P1' | 'P2' | null;
}

export default function YachtGame({ roomId, myRole }: YachtGameProps) {
    // Local State (mirrors Firebase in MP)
    const [gameState, setGameState] = useState<GameState>({
        dice: [1, 1, 1, 1, 1],
        held: [false, false, false, false, false],
        rollsLeft: MAX_ROLLS,
        scoresP1: {},
        scoresP2: {},
        turn: 'P1',
        isRolling: false,
        winner: null
    });

    // Opponent Name Sync
    const [opponentName, setOpponentName] = useState('Opponent');

    useEffect(() => {
        if (!roomId || !myRole) return;

        const roomRef = ref(db, `yacht_rooms/${roomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            if (data.gameState) {
                setGameState(data.gameState);
            }

            // Sync opponent name
            const oppRole = myRole === 'P1' ? 'P2' : 'P1';
            if (data[oppRole]?.name) setOpponentName(data[oppRole].name);
        });

        return () => unsubscribe();
    }, [roomId, myRole]);

    const updateGameState = async (newState: Partial<GameState>) => {
        // Optimistic update
        setGameState(prev => ({ ...prev, ...newState }));

        if (roomId) {
            // Push to Firebase
            await update(ref(db, `yacht_rooms/${roomId}/gameState`), newState);
        }
    };

    const startNewGame = async () => {
        const initialState: GameState = {
            dice: [1, 1, 1, 1, 1],
            held: [false, false, false, false, false],
            rollsLeft: MAX_ROLLS,
            scoresP1: {},
            scoresP2: {},
            turn: 'P1',
            isRolling: false,
            winner: null
        };

        if (roomId) {
            // Only P1 can restart in MP usually, or simplistic restart overwrites
            if (myRole === 'P1') {
                await update(ref(db, `yacht_rooms/${roomId}`), { gameState: initialState });
            }
        } else {
            setGameState(initialState);
            // resetTurn is implied in initial state
            // But we might want to auto-roll initially? No, wait for user.
            rollDice([false, false, false, false, false], initialState); // Auto roll first? standard is user clicks.
            // Actually, resetTurn does roll.
            // Let's NOT auto roll here, user clicks 'Roll'.
            // But existing code called resetTurn which called rollDice. 
            // Let's align with existing: resetTurn calls rollDice.
            // Wait, if I call resetTurn, it updates state.
            // Just set initial state and let user click Roll. 
        }
    };

    const rollDice = (currentHeld: boolean[], stateToUse = gameState) => {
        updateGameState({ isRolling: true });

        // Force delay for animation
        setTimeout(async () => {
            const newDice = stateToUse.dice.map((d, i) => currentHeld[i] ? d : Math.floor(Math.random() * 6) + 1);
            const newRollsLeft = stateToUse.rollsLeft - 1;

            // In MP, we must do this calculation locally then push result
            // (If we rely on server, we need Cloud Functions, but here P2P style logic via Client is fine)

            await updateGameState({
                dice: newDice,
                rollsLeft: newRollsLeft,
                isRolling: false
            });
        }, 600);
    };

    const handleRollClick = () => {
        if (gameState.winner || gameState.rollsLeft <= 0 || gameState.isRolling) return;
        if (roomId && myRole && gameState.turn !== myRole) return; // Not my turn

        rollDice(gameState.held);
    };

    const toggleHold = (index: number) => {
        if (gameState.winner || gameState.rollsLeft === MAX_ROLLS && !gameState.isRolling) return;
        if (roomId && myRole && gameState.turn !== myRole) return;

        const newHeld = [...gameState.held];
        newHeld[index] = !newHeld[index];
        updateGameState({ held: newHeld });
    };

    const handleCategoryClick = async (category: Category) => {
        if (gameState.winner || gameState.isRolling) return;
        if (roomId && myRole && gameState.turn !== myRole) return;

        const currentScores = gameState.turn === 'P1' ? gameState.scoresP1 : gameState.scoresP2;
        if (currentScores[category] !== undefined) return; // Already taken

        const score = calculateScore(category, gameState.dice);
        const newScores = { ...currentScores, [category]: score };

        // Update scores
        const newState: Partial<GameState> = {
            [gameState.turn === 'P1' ? 'scoresP1' : 'scoresP2']: newScores
        };

        // Check Game Over (Both players full? or just me full?)
        // In SP: if P1 full -> Over.
        // In MP: if P2 full -> Over. (Assuming P1 went first)

        let nextTurn = gameState.turn === 'P1' ? 'P2' : 'P1';
        if (!roomId) nextTurn = 'P1'; // SP always P1

        const p1Full = Object.keys(gameState.turn === 'P1' ? newScores : gameState.scoresP1).length === CATEGORIES.length;
        const p2Full = Object.keys(gameState.turn === 'P2' ? newScores : gameState.scoresP2).length === CATEGORIES.length;

        if (roomId) {
            if (p1Full && p2Full) {
                // Game Over
                const s1 = calculateTotal(gameState.turn === 'P1' ? newScores : gameState.scoresP1);
                const s2 = calculateTotal(gameState.turn === 'P2' ? newScores : gameState.scoresP2);
                let w: 'P1' | 'P2' | 'Draw' = 'Draw';
                if (s1 > s2) w = 'P1';
                if (s2 > s1) w = 'P2';
                newState.winner = w;
            } else {
                // Next Turn
                newState.turn = nextTurn as 'P1' | 'P2';
                newState.dice = [1, 1, 1, 1, 1];
                newState.held = [false, false, false, false, false];
                newState.rollsLeft = MAX_ROLLS;
                // We do NOT auto roll.
            }
        } else {
            // SP Logic
            if (p1Full) {
                newState.winner = 'P1'; // Just a flag
            } else {
                newState.dice = [1, 1, 1, 1, 1];
                newState.held = [false, false, false, false, false];
                newState.rollsLeft = MAX_ROLLS;
            }
        }

        await updateGameState(newState);
    };

    const calculateTotal = (scores: Partial<Record<Category, number>>) => {
        const upperSectionCategories: Category[] = ['Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes'];
        const upperSectionScore = upperSectionCategories.reduce((acc, cat) => acc + (scores[cat] || 0), 0);
        const bonus = upperSectionScore >= 63 ? 35 : 0;
        return Object.values(scores).reduce((a, b) => (a || 0) + (b || 0), 0) + bonus;
    };

    // Helpers for rendering
    const renderScoreColumn = (player: 'P1' | 'P2', scores: Partial<Record<Category, number>>, isMe: boolean) => {
        const upperSectionCategories: Category[] = ['Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes'];
        const upperSectionScore = upperSectionCategories.reduce((acc, cat) => acc + (scores[cat] || 0), 0);
        const bonus = upperSectionScore >= 63 ? 35 : 0;
        const totalScore = calculateTotal(scores);
        const isUpperSectionComplete = upperSectionCategories.every(cat => scores[cat] !== undefined);

        // Highlight logic
        const canPick = !gameState.winner && !gameState.isRolling && gameState.rollsLeft < MAX_ROLLS &&
            (roomId ? gameState.turn === player && isMe : true);

        return (
            <div className={styles.score_column} style={{ flex: 1, opacity: (roomId && gameState.turn !== player) ? 0.6 : 1 }}>
                <div className={styles.score_header_small}>
                    {player === 'P1' ? (roomId && myRole === 'P1' ? 'あなた' : (roomId ? opponentName : 'Player')) : (roomId && myRole === 'P2' ? 'あなた' : opponentName)}
                    <span style={{ float: 'right' }}>{totalScore}</span>
                </div>

                {CATEGORIES.map((cat, index) => {
                    const isTaken = scores[cat] !== undefined;
                    const potentialScore = calculateScore(cat, gameState.dice);

                    return (
                        <React.Fragment key={cat}>
                            {index === 6 && (
                                <div className={styles.bonus_row_small}>
                                    <span>Bonus</span>
                                    <span>{isUpperSectionComplete ? (bonus > 0 ? '+35' : '0') : `${upperSectionScore}/63`}</span>
                                </div>
                            )}

                            <button
                                onClick={() => isMe && canPick ? handleCategoryClick(cat) : undefined}
                                disabled={!isMe || !canPick || isTaken}
                                className={`
                                        ${styles.category_row}
                                        ${isTaken ? styles.category_row_taken : ''}
                                        ${(isMe && canPick && !isTaken) ? styles.category_row_active : ''}
                                    `}
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.9rem' }} // Compact
                            >
                                <span className={styles.category_name}>{CATEGORY_LABELS[cat]}</span>
                                <span className={styles.category_points}>
                                    {isTaken ? scores[cat] : (isMe && canPick ? potentialScore : '-')}
                                </span>
                            </button>
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    const hasRolledAtLeastOnce = gameState.rollsLeft < MAX_ROLLS;
    const isMyTurn = roomId ? gameState.turn === myRole : true;

    return (
        <div className={styles.container}>
            {/* Turn Indicator */}
            {roomId && (
                <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: isMyTurn ? '#3b82f6' : '#9ca3af' }}>
                    {isMyTurn ? "あなたの番です" : `${opponentName}の番です`}
                </div>
            )}

            {/* Game Area */}
            <div className={styles.game_area}>
                {/* Dice */}
                <div className={`${styles.dice_stage} ${gameState.isRolling ? styles.rolling : ''}`}>
                    {gameState.dice.map((value, i) => (
                        <Die
                            key={i}
                            value={value}
                            held={gameState.held[i]}
                            rolling={gameState.isRolling && !gameState.held[i]}
                            onClick={() => isMyTurn ? toggleHold(i) : undefined}
                            disabled={!isMyTurn || gameState.winner !== null || gameState.isRolling || !hasRolledAtLeastOnce}
                        />
                    ))}
                </div>

                <div className={styles.controls}>
                    <p className={styles.instruction_text}>
                        {gameState.winner ? "ゲーム終了" :
                            (isMyTurn
                                ? (gameState.rollsLeft === 3 ? "ロールして開始" : (gameState.held.includes(true) ? "クリックでホールド解除" : "ダイスをクリックしてホールド"))
                                : `${opponentName}が思考中...`
                            )
                        }
                    </p>
                    <button
                        onClick={handleRollClick}
                        disabled={!isMyTurn || gameState.winner !== null || gameState.rollsLeft <= 0 || gameState.isRolling}
                        className={styles.roll_btn}
                    >
                        {gameState.rollsLeft > 0 ? `ロール (${gameState.rollsLeft})` : '役を選択'}
                    </button>
                </div>
            </div>

            {/* Score Card Container */}
            <div className={styles.score_card} style={{ display: 'flex', gap: '1rem', flexDirection: 'row', minWidth: roomId ? '600px' : '300px' }}>
                {renderScoreColumn('P1', gameState.scoresP1, roomId ? myRole === 'P1' : true)}

                {roomId && (
                    <>
                        <div style={{ width: '1px', background: '#ccc' }}></div>
                        {renderScoreColumn('P2', gameState.scoresP2, myRole === 'P2')}
                    </>
                )}
            </div>

            {gameState.winner && (
                <div className={styles.game_over_panel}>
                    <p className={styles.game_over_title}>ゲームセット！</p>
                    {roomId ? (
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            {gameState.winner === 'Draw' ? '引き分け' :
                                (gameState.winner === myRole ? 'あなたの勝ち！' : `${opponentName}の勝ち`)}
                        </div>
                    ) : (
                        <div style={{ fontSize: '3rem', fontWeight: '900', color: '#3b82f6', marginBottom: '1rem' }}>
                            {calculateTotal(gameState.scoresP1)}点
                        </div>
                    )}

                    {(roomId ? myRole === 'P1' : true) && (
                        <button onClick={startNewGame} className={styles.restart_btn}>
                            もう一度遊ぶ
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
