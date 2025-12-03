import React from 'react';
import styles from './MinesweeperBoard.module.css';
import { Board } from '@/lib/minesweeper/types';

interface MinesweeperBoardProps {
    board: Board;
    onCellClick: (r: number, c: number) => void;
    onCellRightClick: (e: React.MouseEvent, r: number, c: number) => void;
}

export const MinesweeperBoard: React.FC<MinesweeperBoardProps> = ({ board, onCellClick, onCellRightClick }) => {
    const getCellContent = (cell: any) => {
        if (cell.isFlagged) return '🚩';
        if (!cell.isRevealed) return '';
        if (cell.isMine) return '💣';
        if (cell.neighborMines > 0) return cell.neighborMines;
        return '';
    };

    const getCellClass = (cell: any) => {
        const classes = [styles.cell];
        if (cell.isRevealed) classes.push(styles.revealed);
        if (cell.isMine && cell.isRevealed) classes.push(styles.mine);
        if (cell.isFlagged) classes.push(styles.flagged);
        if (cell.isRevealed && cell.neighborMines > 0) classes.push(styles[`val${cell.neighborMines}`]);
        return classes.join(' ');
    };

    return (
        <div className={styles.board} onContextMenu={(e) => e.preventDefault()}>
            {board.map((row, r) => (
                <div key={r} className={styles.row}>
                    {row.map((cell, c) => (
                        <div
                            key={`${r}-${c}`}
                            className={getCellClass(cell)}
                            onClick={() => onCellClick(r, c)}
                            onContextMenu={(e) => onCellRightClick(e, r, c)}
                        >
                            {getCellContent(cell)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
