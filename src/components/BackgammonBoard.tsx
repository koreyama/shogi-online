import React, { useState } from 'react';
import styles from './BackgammonBoard.module.css';

interface Point {
    count: number;
    color: number; // 0: None, 1: White, 2: Black
}

interface GameState {
    board: Point[];
    bar: { white: number; black: number };
    off: { white: number; black: number };
    dice: number[];
    turn: number;
    winner: string;
}

interface BackgammonBoardProps {
    gameState: GameState;
    myColor: number; // 0: Spec, 1: White, 2: Black
    onRoll: () => void;
    onMove: (from: number | "bar", to: number | "off") => void;
    onPass: () => void;
}

export const BackgammonBoard: React.FC<BackgammonBoardProps> = ({
    gameState,
    myColor,
    onRoll,
    onMove,
    onPass
}) => {
    const [selectedPoint, setSelectedPoint] = useState<number | "bar" | null>(null);

    const handlePointClick = (index: number) => {
        // If not my turn, ignore
        if (gameState.turn !== myColor) return;
        if (gameState.dice.length === 0) return;

        // Logic:
        // 1. If nothing selected:
        //    - If own piece, select it. (Check Bar first!)
        // 2. If selected:
        //    - If clicked same, deselect.
        //    - If clicked valid destination, move.

        // Rule: Must move from Bar if chips heavily.
        if (hasChipsOnBar(myColor) && selectedPoint !== "bar") {
            // Can only select Bar
            if (selectedPoint === null) {
                // Auto-select bar if clicked anywhere? Or just ignore board clicks?
                // Better to force user to click Bar.
                return;
            }
        }

        if (selectedPoint === null) {
            // Select
            const p = gameState.board[index];
            if (p.color === myColor && p.count > 0) {
                setSelectedPoint(index);
            }
        } else {
            // Move or Deselect
            if (selectedPoint === index) {
                setSelectedPoint(null);
            } else {
                // Attempt move
                onMove(selectedPoint, index); // Let server validate
                setSelectedPoint(null);
            }
        }
    };

    const handleBarClick = () => {
        if (gameState.turn !== myColor) return;
        if (hasChipsOnBar(myColor)) {
            if (selectedPoint === "bar") setSelectedPoint(null);
            else setSelectedPoint("bar");
        }
    };

    const handleOffClick = () => {
        // Trying to bear off
        if (selectedPoint !== null) {
            onMove(selectedPoint, "off");
            setSelectedPoint(null);
        }
    };

    const hasChipsOnBar = (color: number) => {
        return color === 1 ? gameState.bar.white > 0 : gameState.bar.black > 0;
    };

    const renderPoint = (index: number, isTop: boolean) => {
        const point = gameState.board[index];
        const isSelected = selectedPoint === index;
        // Highlight if valid move? (Complex to check locally without duplicate logic)

        // Triangle Color:
        // Standard: 12-pt is even?
        // Let's alternate based on index.
        const isDark = index % 2 === 1; // Arbitrary pattern

        return (
            <div key={index}
                className={`${styles.point} ${isTop ? '' : styles.pointBottom} ${isSelected ? styles.selected : ''}`}
                onClick={() => handlePointClick(index)}>

                {/* Background Triangle */}
                <div className={`${styles.pointBg} ${isTop ? styles.topPointBg : styles.bottomPointBg} ${isDark ? styles.colorDark : styles.colorLight}`}></div>

                {/* Checkers */}
                {Array.from({ length: Math.min(point.count, 5) }).map((_, i) => (
                    <div key={i} className={`${styles.checker} ${point.color === 1 ? styles.checkerWhite : styles.checkerBlack}`}>
                        {/* Show count if > 5 on top piece? */}
                        {i === 4 && point.count > 5 ? point.count : ''}
                    </div>
                ))}
            </div>
        );
    };

    // Layout Logic
    // Top Row: 12-17 (Left), 18-23 (Right).
    // Bottom Row: 11-6 (Left), 5-0 (Right).
    // Indicies:
    // TopLeft: 12, 13, 14, 15, 16, 17. (Displayed L-R or R-L? 12 needs to be far left.)
    // BottomLeft: 11, 10, 9, 8, 7, 6. (11 far left)

    // Standard Backgammon Board (White moves Anti-CW, Home is Bottom Right):
    // 12---13-14-15-16-17  |Bar|  18-19-20-21-22-23(24)
    // 11---10--9--8--7--6  |Bar|   5--4--3--2--1--0(1)

    // So:
    // Top Left: 12..17 (Left to Right)
    // Top Right: 18..23 (Left to Right)
    // Bottom Left: 11..6 (Left to Right)
    // Bottom Right: 5..0 (Left to Right)

    const renderQuadrant = (indices: number[], isTop: boolean) => {
        return (
            <div className={styles.quadrant}>
                {indices.map(i => renderPoint(i, isTop))}
            </div>
        );
    };

    const isMyTurn = gameState.turn === myColor;

    return (
        <div className={styles.boardContainer}>
            {/* Controls */}
            <div className={styles.controls}>
                <div className={`${styles.turnIndicator} ${gameState.turn === 1 ? styles.turnWhite : styles.turnBlack}`}>
                    {gameState.turn === 1 ? "White's Turn" : "Black's Turn"}
                </div>

                <div className={styles.diceContainer}>
                    {gameState.dice.map((d, i) => (
                        <div key={i} className={styles.die} style={{ transform: `rotate(${i % 2 === 0 ? '5deg' : '-5deg'})` }}>{d}</div>
                    ))}
                </div>

                {isMyTurn && gameState.dice.length === 0 && !gameState.winner && (
                    <button className={styles.btn} onClick={onRoll}>Roll Dice</button>
                )}

                {gameState.dice.length > 0 && isMyTurn && (
                    // Add Pass Button?
                    <button className={styles.btn} style={{ backgroundColor: '#666' }} onClick={onPass}>Pass / Clear</button>
                )}
            </div>

            {/* Board */}
            <div className={styles.board}>
                {/* Main Area */}
                <div className={styles.mainArea}>
                    {/* Left Table */}
                    <div className={styles.leftTable}>
                        {/* Top Left: 12 - 17 */}
                        <div className={`${styles.row} ${styles.topRow}`}>
                            {renderQuadrant([12, 13, 14, 15, 16, 17], true)}
                        </div>
                        {/* Bottom Left: 11 - 6 */}
                        <div className={`${styles.row} ${styles.bottomRow}`}>
                            {renderQuadrant([11, 10, 9, 8, 7, 6], false)}
                        </div>
                    </div>

                    {/* Bar */}
                    <div className={styles.bar} onClick={handleBarClick} style={{
                        boxShadow: isMyTurn && hasChipsOnBar(myColor) ? '0 0 15px 5px rgba(255, 0, 0, 0.5)' : 'none',
                        cursor: isMyTurn && hasChipsOnBar(myColor) ? 'pointer' : 'default'
                    }}>
                        {/* Bar counts */}
                        {isMyTurn && hasChipsOnBar(myColor) && (
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'red', color: 'white', padding: '2px 5px', borderRadius: '4px', fontSize: '0.7rem', whiteSpace: 'nowrap', zIndex: 20, pointerEvents: 'none' }}>
                                ENTER!
                            </div>
                        )}
                        {/* White Bar (Top? or just center?) */}
                        {/* Standard: Pieces on bar sit on the middle strip */}
                        {gameState.bar.white > 0 && (
                            <div className={`${styles.checker} ${styles.checkerWhite} ${selectedPoint === "bar" && myColor === 1 ? styles.selected : ''}`}>
                                {gameState.bar.white}
                            </div>
                        )}
                        <div style={{ flex: 1 }}></div>
                        {gameState.bar.black > 0 && (
                            <div className={`${styles.checker} ${styles.checkerBlack} ${selectedPoint === "bar" && myColor === 2 ? styles.selected : ''}`}>
                                {gameState.bar.black}
                            </div>
                        )}
                    </div>

                    {/* Right Table */}
                    <div className={styles.rightTable}>
                        {/* Top Right: 18 - 23 */}
                        <div className={`${styles.row} ${styles.topRow}`}>
                            {renderQuadrant([18, 19, 20, 21, 22, 23], true)}
                        </div>
                        {/* Bottom Right: 5 - 0 */}
                        <div className={`${styles.row} ${styles.bottomRow}`}>
                            {renderQuadrant([5, 4, 3, 2, 1, 0], false)}
                        </div>
                    </div>
                </div>

                {/* Off Board (Bear off) */}
                <div className={styles.offBoard} onClick={handleOffClick} style={{ cursor: selectedPoint !== null ? 'pointer' : 'default' }}>
                    <div className={styles.offSection}>
                        {/* White Off */}
                        {Array.from({ length: Math.min(gameState.off.white, 15) }).map((_, i) => (
                            <div key={i} className={`${styles.checker} ${styles.checkerWhite}`} style={{ height: '10px', borderRadius: '2px' }}></div>
                        ))}
                    </div>
                    <div className={styles.offSection}>
                        {/* Black Off */}
                        {Array.from({ length: Math.min(gameState.off.black, 15) }).map((_, i) => (
                            <div key={i} className={`${styles.checker} ${styles.checkerBlack}`} style={{ height: '10px', borderRadius: '2px' }}></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
