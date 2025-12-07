import React from 'react';
import styles from './GomokuBoard.module.css';
import { BoardState, Player, BOARD_SIZE } from '@/lib/gomoku/types';

interface GomokuBoardProps {
    board: BoardState;
    onCellClick: (x: number, y: number) => void;
    lastMove?: { x: number, y: number };
    turn: Player;
    isMyTurn: boolean;
    winner: Player | 'draw' | null;
}

const GomokuBoard: React.FC<GomokuBoardProps> = ({
    board,
    onCellClick,
    lastMove,
    turn,
    isMyTurn,
    winner
}) => {
    // 星の位置 (15x15の場合: 3, 7, 11の組み合わせ)
    const hoshiPositions = [
        { x: 3, y: 3 }, { x: 11, y: 3 },
        { x: 3, y: 11 }, { x: 11, y: 11 },
        { x: 7, y: 7 } // 天元
    ];

    const isHoshi = (x: number, y: number) => {
        return hoshiPositions.some(p => p.x === x && p.y === y);
    };

    return (
        <div className={styles.board}>
            {board.map((row, y) => (
                <div key={y} className={styles.row}>
                    {row.map((cell, x) => {
                        const isLastMove = lastMove?.x === x && lastMove?.y === y;

                        return (
                            <div
                                key={`${x}-${y}`}
                                className={styles.cell}
                                onClick={() => isMyTurn && !winner && cell === null ? onCellClick(x, y) : undefined}
                            >
                                {isHoshi(x, y) && <div className={styles.hoshi} />}

                                {cell && (
                                    <div className={`${styles.stone} ${styles[cell]} ${isLastMove ? styles.lastMove : ''}`} />
                                )}

                                {/* ホバー時のプレビュー（PCのみ） */}
                                {!cell && isMyTurn && !winner && (
                                    <div className={`${styles.stone} ${styles[turn]} ${styles.preview}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default GomokuBoard;
