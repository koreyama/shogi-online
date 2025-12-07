import React from 'react';
import styles from './CheckersBoard.module.css';
import { Board, Move, Player, Position } from '@/lib/checkers/types';

interface CheckersBoardProps {
    board: Board;
    turn: Player;
    myRole: Player | null;
    validMoves: Move[];
    onCellClick: (r: number, c: number) => void;
    selectedPos: Position | null;
    lastMove: Move | null;
}

export default function CheckersBoard({
    board,
    turn,
    myRole,
    validMoves,
    onCellClick,
    selectedPos,
    lastMove
}: CheckersBoardProps) {

    // Always show Red at bottom for Red player, Black at bottom for Black player
    // Default Red at bottom
    const isRedView = myRole === 'red' || !myRole;

    const getCellClass = (r: number, c: number) => {
        const isDark = (r + c) % 2 === 1;
        let className = `${styles.cell} ${isDark ? styles.darkCell : styles.lightCell}`;

        // Highlight valid moves for selected piece
        if (selectedPos) {
            const isValid = validMoves.some(m =>
                m.from.r === selectedPos.r &&
                m.from.c === selectedPos.c &&
                m.to.r === r &&
                m.to.c === c
            );
            if (isValid) className += ` ${styles.validMove}`;
        }

        // Highlight last move
        if (lastMove && (
            (lastMove.from.r === r && lastMove.from.c === c) ||
            (lastMove.to.r === r && lastMove.to.c === c)
        )) {
            className += ` ${styles.lastMove}`;
        }

        return className;
    };

    const renderBoard = () => {
        const rows = [];
        for (let r = 0; r < 8; r++) {
            const cols = [];
            for (let c = 0; c < 8; c++) {
                // Adjust coords for view
                const actualR = isRedView ? r : 7 - r;
                const actualC = isRedView ? c : 7 - c;

                const piece = board[actualR][actualC];
                const isSelected = selectedPos?.r === actualR && selectedPos?.c === actualC;

                // Determine if this piece is allowed to move
                const canMove = piece && validMoves.some(m => m.from.r === actualR && m.from.c === actualC);

                // If it's my turn, highlight pieces that MUST be moved (forced jumps or any move if no jump)
                const isMovable = canMove && turn === myRole;

                cols.push(
                    <div
                        key={`${actualR}-${actualC}`}
                        className={getCellClass(actualR, actualC)}
                        onClick={() => onCellClick(actualR, actualC)}
                    >
                        {piece && (
                            <div className={`
                                ${styles.piece} 
                                ${piece.owner === 'red' ? styles.redPiece : styles.blackPiece}
                                ${piece.type === 'king' ? styles.king : ''}
                                ${isSelected ? styles.selected : ''}
                                ${isMovable ? styles.movable : ''}
                            `} />
                        )}
                    </div>
                );
            }
            rows.push(<div key={r} style={{ display: 'contents' }}>{cols}</div>);
        }
        return rows;
    };

    return (
        <div className={styles.boardContainer}>
            <div className={styles.playerArea}>
                <span>{isRedView ? 'Black (Opponent)' : 'Red (Opponent)'}</span>
            </div>

            <div className={styles.board}>
                {renderBoard()}
            </div>

            <div className={styles.playerArea}>
                <span>{isRedView ? 'Red (You)' : 'Black (You)'}</span>
            </div>
        </div>
    );
}
