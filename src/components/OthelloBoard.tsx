import React from 'react';
import styles from './OthelloBoard.module.css';
import { BoardState, Coordinates } from '@/lib/othello/types';

interface OthelloBoardProps {
    board: BoardState;
    validMoves: Coordinates[];
    onCellClick: (x: number, y: number) => void;
    lastMove?: Coordinates;
}

export const OthelloBoard: React.FC<OthelloBoardProps> = ({ board, validMoves, onCellClick, lastMove }) => {
    return (
        <div className={styles.board}>
            {board.map((row, y) => (
                <div key={y} className={styles.row}>
                    {row.map((cell, x) => {
                        const isValid = validMoves.some(m => m.x === x && m.y === y);
                        const isLastMove = lastMove?.x === x && lastMove?.y === y;

                        return (
                            <div
                                key={`${x}-${y}`}
                                className={`${styles.cell} ${isValid ? styles.valid : ''} ${isLastMove ? styles.lastMove : ''}`}
                                onClick={() => onCellClick(x, y)}
                            >
                                {cell && (
                                    <div className={`${styles.stone} ${styles[cell]}`}></div>
                                )}
                                {isValid && <div className={styles.hint}></div>}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};
