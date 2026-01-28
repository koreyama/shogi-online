import React from 'react';
import styles from '@/app/marubatsu/page.module.css';

interface MarubatsuBoardProps {
    board: number[];
    onCellClick: (index: number) => void;
    disabled?: boolean;
}

export const MarubatsuBoard: React.FC<MarubatsuBoardProps> = ({ board, onCellClick, disabled }) => {
    return (
        <div className={styles.board}>
            {board.map((cell, index) => {
                let content = '';
                let cellClass = styles.cell;
                if (cell === 1) {
                    content = '〇';
                    cellClass += ` ${styles.o}`;
                } else if (cell === 2) {
                    content = '✕';
                    cellClass += ` ${styles.x}`;
                }

                return (
                    <div
                        key={index}
                        className={cellClass}
                        onClick={() => !disabled && cell === 0 && onCellClick(index)}
                    >
                        {content}
                    </div>
                );
            })}
        </div>
    );
};
