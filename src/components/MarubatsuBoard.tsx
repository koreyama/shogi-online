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
                let content = null;

                if (cell === 1) { // O
                    content = (
                        <svg viewBox="0 0 100 100" style={{ width: '80%', height: '80%' }}>
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#e53e3e" strokeWidth="15" />
                        </svg>
                    );
                } else if (cell === 2) { // X
                    content = (
                        <svg viewBox="0 0 100 100" style={{ width: '80%', height: '80%' }}>
                            <line x1="20" y1="20" x2="80" y2="80" stroke="#3182ce" strokeWidth="15" strokeLinecap="round" />
                            <line x1="80" y1="20" x2="20" y2="80" stroke="#3182ce" strokeWidth="15" strokeLinecap="round" />
                        </svg>
                    );
                }

                return (
                    <div
                        key={index}
                        className={styles.cell}
                        onClick={() => !disabled && cell === 0 && onCellClick(index)}
                    >
                        {content}
                    </div>
                );
            })}
        </div>
    );
};
