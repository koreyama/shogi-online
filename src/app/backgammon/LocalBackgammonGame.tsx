'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';
import { BackgammonBoard } from '@/components/BackgammonBoard';
import { GameState, getInitialState, rollDice, isValidMove, applyMove, Move, hasPossibleMoves } from '@/lib/backgammon/engine';
import { getBestMoveSequence } from '@/lib/backgammon/ai';

interface LocalBackgammonGameProps {
    onBack: () => void;
}

export default function LocalBackgammonGame({ onBack }: LocalBackgammonGameProps) {
    const [gameState, setGameState] = useState<GameState>(getInitialState());
    const [myColor] = useState<number>(1); // Player is always White (1)

    // AI Status
    const [isAiThinking, setIsAiThinking] = useState(false);
    // Message
    const [message, setMessage] = useState("Your turn");

    // AI Turn Handler
    useEffect(() => {
        if (gameState.turn !== myColor && !gameState.winner && !isAiThinking) {
            // CPU Turn (Black)
            if (gameState.dice.length === 0) {
                // Needs to roll
                setTimeout(() => {
                    handleAiRoll();
                }, 1000);
            } else {
                // Needs to move
                setIsAiThinking(true);
                setTimeout(() => {
                    handleAiMove();
                    setIsAiThinking(false);
                }, 1500);
            }
        }
    }, [gameState, isAiThinking]);

    const handleAiRoll = () => {
        const dice = rollDice();
        setGameState(prev => ({
            ...prev,
            dice
        }));
        setMessage("CPU Rolled " + dice.join(", "));
    };

    const handleAiMove = () => {
        // Compute best moves
        const moves = getBestMoveSequence(gameState);

        if (moves.length === 0) {
            // No moves possible -> Pass
            setMessage("CPU Pass");
            setTimeout(() => {
                switchTurn();
            }, 1000);
            return;
        }

        // Apply all moves in sequence for visual? 
        // Or just jump? Let's jump for now or apply one by one if we had animation.
        // Applying all at once for simplicity, but state updates need to be functional.

        let newState = gameState;
        for (const mv of moves) {
            newState = applyMove(newState, mv);
        }

        setGameState(newState);

        // Check if turn ended (no dice left)
        if (newState.dice.length === 0) {
            switchTurn(newState);
        } else {
            // If dice left but no moves? (Should be covered by getBestMoveSequence returning partial if blocked)
            // But if getBestMoveSequence handled everything, we should switch turn if dice are empty.
            // If dice not empty but blocked, handle pass separately?
            // "applyMove" removes dice used.

            if (!hasPossibleMoves(newState)) {
                switchTurn(newState);
            } else {
                // If AI decided not to use all dice? (Should not happen with validSeqs logic)
                switchTurn(newState);
            }
        }
    };

    const switchTurn = (currentState = gameState) => {
        setGameState(prev => ({
            ...currentState,
            turn: prev.turn === 1 ? 2 : 1,
            dice: []
        }));

        if (currentState.turn === 1) setMessage("CPU Turn");
        else setMessage("Your Turn");
    };

    // User Actions
    const handleRoll = () => {
        if (gameState.turn !== myColor) return;
        if (gameState.dice.length > 0) return;

        const dice = rollDice();
        let newState = { ...gameState, dice };

        setGameState(newState);
        setMessage("Rolled " + dice.join(", "));

        // Auto-pass check if rolled but blocked immediately
        if (!hasPossibleMoves(newState)) {
            setTimeout(() => {
                alert("No legal moves!");
                switchTurn(newState);
            }, 500);
        }
    };

    const handleUserMove = (from: number | "bar", to: number | "off") => {
        if (gameState.turn !== myColor) return;

        // Find valid die for this move
        // We need to know WHICH die matches the distance.
        // Dist logic:
        // White (1): to - from = -die. OR bar->24-die. OR off

        let usedDie = -1;

        // Try to match move with a die
        for (const die of gameState.dice) {
            if (isValidMove(gameState, from, to, die)) {
                usedDie = die;
                break;
            }
        }

        if (usedDie === -1) {
            console.log("Invalid move");
            return;
        }

        const move: Move = { from, to, dieValue: usedDie };
        const newState = applyMove(gameState, move);

        setGameState(newState);

        // Check turn end
        if (newState.dice.length === 0) {
            setTimeout(() => switchTurn(newState), 500);
        } else {
            if (!hasPossibleMoves(newState)) {
                setTimeout(() => {
                    alert("No more moves possible.");
                    switchTurn(newState);
                }, 500);
            }
        }
    };

    const handlePass = () => {
        if (gameState.turn !== myColor) return;
        switchTurn();
    };

    return (
        <div className={styles.gameContainer} style={{ maxWidth: '1200px' }}>
            <div className={styles.header}>
                <button onClick={onBack} className={styles.secondaryBtn} style={{ padding: '0.5rem 1rem' }}>Exit</button>
                <h1 className={styles.compactTitle}>Backgammon (VS CPU)</h1>
                <div style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{message}</div>
            </div>

            <BackgammonBoard
                gameState={gameState as any}
                myColor={myColor}
                onRoll={handleRoll}
                onMove={handleUserMove}
                onPass={handlePass}
            />

            {gameState.winner && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>{gameState.winner} Wins!</h2>
                        <button onClick={onBack} className={styles.primaryBtn}>Back to Menu</button>
                    </div>
                </div>
            )}
        </div>
    );
}
