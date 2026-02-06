'use client';

import React from 'react';
import { Board } from '@/lib/sudoku/types';
import styles from './Sudoku.module.css';

interface SudokuBoardProps {
    board: Board;
    selectedCell: { row: number; col: number } | null;
    onCellClick: (row: number, col: number) => void;
}

export function SudokuBoard({ board, selectedCell, onCellClick }: SudokuBoardProps) {
    const isHighlighted = (row: number, col: number): boolean => {
        if (!selectedCell) return false;
        const { row: sr, col: sc } = selectedCell;

        // Same row, column, or 3x3 box
        if (row === sr || col === sc) return true;

        const boxRow = Math.floor(row / 3);
        const boxCol = Math.floor(col / 3);
        const selectedBoxRow = Math.floor(sr / 3);
        const selectedBoxCol = Math.floor(sc / 3);

        return boxRow === selectedBoxRow && boxCol === selectedBoxCol;
    };

    const isSameNumber = (row: number, col: number): boolean => {
        if (!selectedCell) return false;
        const selectedValue = board[selectedCell.row][selectedCell.col].value;
        if (selectedValue === 0) return false;
        return board[row][col].value === selectedValue;
    };

    return (
        <div className={styles.board}>
            {board.map((row, r) => (
                <div key={r} className={styles.row}>
                    {row.map((cell, c) => {
                        const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                        const highlighted = isHighlighted(r, c);
                        const sameNumber = isSameNumber(r, c);

                        return (
                            <div
                                key={c}
                                className={`
                                    ${styles.cell}
                                    ${cell.isFixed ? styles.fixed : ''}
                                    ${cell.isError ? styles.error : ''}
                                    ${isSelected ? styles.selected : ''}
                                    ${highlighted && !isSelected ? styles.highlighted : ''}
                                    ${sameNumber && !isSelected ? styles.sameNumber : ''}
                                    ${c % 3 === 2 && c !== 8 ? styles.boxBorderRight : ''}
                                    ${r % 3 === 2 && r !== 8 ? styles.boxBorderBottom : ''}
                                `}
                                onClick={() => onCellClick(r, c)}
                            >
                                {cell.value !== 0 ? (
                                    <span className={styles.cellValue}>{cell.value}</span>
                                ) : cell.notes.size > 0 ? (
                                    <div className={styles.notes}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                            <span
                                                key={n}
                                                className={`${styles.note} ${cell.notes.has(n) ? styles.noteActive : ''}`}
                                            >
                                                {cell.notes.has(n) ? n : ''}
                                            </span>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
