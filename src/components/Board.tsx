import React from 'react';
import styles from './Board.module.css';
import { BoardState, Coordinates, Piece as PieceType, Player } from '@/lib/shogi/types';
import { Piece } from './Piece';

type BoardProps = {
    board: BoardState;
    selectedPos: Coordinates | null;
    validMoves: Coordinates[];
    onCellClick: (x: number, y: number) => void;
    lastMove?: { from: Coordinates | 'hand'; to: Coordinates };
    perspective?: Player; // 'sente' or 'gote' - determines board orientation
};

export const Board: React.FC<BoardProps> = ({
    board,
    selectedPos,
    validMoves,
    onCellClick,
    lastMove,
    perspective = 'sente'
}) => {
    // Helper to check if a cell is a valid move target
    const isValidMove = (x: number, y: number) => {
        return validMoves.some(m => m.x === x && m.y === y);
    };

    const isLastMoveTo = (x: number, y: number) => {
        return lastMove?.to.x === x && lastMove?.to.y === y;
    };

    return (
        <div className={styles.boardContainer}>
            <div
                className={styles.board}
                style={{
                    transform: perspective === 'gote' ? 'rotate(180deg)' : 'none'
                }}
            >

                {board.map((row, y) =>
                    row.map((cell, x) => {
                        const isSelected = selectedPos?.x === x && selectedPos?.y === y;
                        const isTarget = isValidMove(x, y);

                        return (
                            <div
                                key={`${x}-${y}`}
                                className={`
                    ${styles.cell} 
                    ${isTarget ? styles.validMove : ''}
                    ${isLastMoveTo(x, y) ? styles.lastMove : ''}
                  `}
                                onClick={() => onCellClick(x, y)}
                            >


                                {cell && (
                                    <Piece
                                        piece={cell}
                                        isSelected={isSelected}
                                        isLastMove={isLastMoveTo(x, y)}
                                    />
                                )}

                                {isTarget && !cell && (
                                    <div className={styles.moveIndicator} />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
