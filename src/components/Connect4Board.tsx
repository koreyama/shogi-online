import React from 'react';
import styles from './Connect4Board.module.css';
import { Board, Player, Coordinates } from '@/lib/connect4/types';

interface Connect4BoardProps {
    board: Board;
    onColumnClick: (col: number) => void;
    turn: Player;
    isMyTurn: boolean;
    winner: Player | 'draw' | null;
    winningLine: Coordinates[] | null;
    myRole: Player | null;
}

export default function Connect4Board({
    board,
    onColumnClick,
    turn,
    isMyTurn,
    winner,
    winningLine,
    myRole
}: Connect4BoardProps) {
    const handleColumnClick = (col: number) => {
        if (!isMyTurn || winner) return;
        onColumnClick(col);
    };

    const isWinningCell = (r: number, c: number) => {
        if (!winningLine) return false;
        return winningLine.some(coord => coord.row === r && coord.col === c);
    };

    return (
        <div className={styles.boardContainer}>
            <div className={styles.board}>
                {board[0].map((_, colIndex) => (
                    <div
                        key={colIndex}
                        className={`${styles.column} ${isMyTurn && !winner ? (myRole === 'red' ? styles.hoverRed : styles.hoverYellow) : ''}`}
                        onClick={() => handleColumnClick(colIndex)}
                    >
                        {board.map((row, rowIndex) => (
                            <div key={`${rowIndex}-${colIndex}`} className={styles.cell}>
                                {row[colIndex] && (
                                    <div
                                        className={`${styles.piece} ${row[colIndex] === 'red' ? styles.red : styles.yellow} ${isWinningCell(rowIndex, colIndex) ? styles.winningPiece : ''}`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
