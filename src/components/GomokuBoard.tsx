import React from 'react';
import styles from './GomokuBoard.module.css';

interface GomokuBoardProps {
    board: number[]; // 1D array of 0, 1(black), 2(white)
    onIntersectionClick: (x: number, y: number) => void;
    lastMove?: { x: number, y: number };
}

export function GomokuBoard({ board, onIntersectionClick, lastMove }: GomokuBoardProps) {
    const size = 15;
    const renderIntersections = () => {
        const intersections = [];
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const index = y * size + x;
                const cellValue = board[index];

                let stoneClass = '';
                if (cellValue === 1) stoneClass = styles.black;
                else if (cellValue === 2) stoneClass = styles.white;

                const isLastMove = lastMove && lastMove.x === x && lastMove.y === y;

                intersections.push(
                    <div
                        key={`${x}-${y}`}
                        className={styles.intersection}
                        onClick={() => onIntersectionClick(x, y)}
                        style={{
                            gridColumn: x + 1,
                            gridRow: y + 1
                        }}
                    >
                        {/* Lines */}
                        <div className={styles.lineHorizontal}></div>
                        <div className={styles.lineVertical}></div>

                        {/* Dot (Hoshi) at specific points */}
                        {((x === 3 || x === 11 || x === 7) && (y === 3 || y === 11 || y === 7)) && (
                            <div className={styles.hoshi}></div>
                        )}

                        {/* Stone */}
                        {stoneClass && (
                            <div className={`${styles.stone} ${stoneClass}`}>
                                {isLastMove && <div className={styles.lastMoveMarker}></div>}
                            </div>
                        )}
                    </div>
                );
            }
        }
        return intersections;
    };

    return (
        <div className={styles.boardContainer}>
            <div className={styles.boardGrid}>
                {renderIntersections()}
            </div>
        </div>
    );
}
