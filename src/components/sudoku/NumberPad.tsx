'use client';

import React from 'react';
import styles from './Sudoku.module.css';

interface NumberPadProps {
    onNumberClick: (num: number) => void;
    onClear: () => void;
    onToggleNotes: () => void;
    isNotesMode: boolean;
    disabledNumbers?: Set<number>; // Numbers that are already complete (9 of them placed)
}

export function NumberPad({ onNumberClick, onClear, onToggleNotes, isNotesMode, disabledNumbers = new Set() }: NumberPadProps) {
    return (
        <div className={styles.numberPad}>
            <div className={styles.numberGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                        key={num}
                        className={`${styles.numberBtn} ${disabledNumbers.has(num) ? styles.disabled : ''}`}
                        onClick={() => onNumberClick(num)}
                        disabled={disabledNumbers.has(num)}
                    >
                        {num}
                    </button>
                ))}
            </div>
            <div className={styles.actionButtons}>
                <button
                    className={`${styles.actionBtn} ${isNotesMode ? styles.active : ''}`}
                    onClick={onToggleNotes}
                >
                    ✏️ メモ
                </button>
                <button className={styles.actionBtn} onClick={onClear}>
                    ✕ 消す
                </button>
            </div>
        </div>
    );
}
