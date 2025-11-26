import React from 'react';
import styles from './SimpleShogiBoard.module.css';
import { Board, PieceType, Player, Hand } from '@/lib/simple-shogi/types';
import { IconKing, IconRook, IconBishop, IconGold, IconPawn } from './SimpleShogiIcons';

interface SimpleShogiBoardProps {
    board: Board;
    hands: { sente: Hand; gote: Hand };
    turn: Player;
    myRole: Player | null;
    validMoves: any[];
    onCellClick: (r: number, c: number) => void;
    onHandClick: (type: PieceType) => void;
    selectedPos: { r: number, c: number } | null;
    selectedHand: PieceType | null;
    lastMove: any;
}

const PIECE_COMPONENTS: Record<PieceType, React.FC<{ size?: number, color?: string }>> = {
    king: IconKing,
    rook: IconRook,
    bishop: IconBishop,
    gold: IconGold,
    pawn: IconPawn,
};

export default function SimpleShogiBoard({
    board,
    hands,
    turn,
    myRole,
    validMoves,
    onCellClick,
    onHandClick,
    selectedPos,
    selectedHand,
    lastMove
}: SimpleShogiBoardProps) {

    const isSente = myRole === 'sente' || !myRole;

    const displayBoard = isSente ? board : [...board].reverse().map(row => [...row].reverse());

    const getCellClass = (r: number, c: number) => {
        const actualR = isSente ? r : 3 - r;
        const actualC = isSente ? c : 2 - c;

        let className = styles.cell;

        let isValid = false;
        if (selectedPos) {
            isValid = validMoves.some(m =>
                !m.isDrop &&
                m.from.r === selectedPos.r &&
                m.from.c === selectedPos.c &&
                m.to.r === actualR &&
                m.to.c === actualC
            );
        } else if (selectedHand) {
            isValid = validMoves.some(m =>
                m.isDrop &&
                m.type === selectedHand &&
                m.to.r === actualR &&
                m.to.c === actualC
            );
        }

        if (isValid) {
            className += ` ${styles.validMove}`;
        }

        if (selectedPos && selectedPos.r === actualR && selectedPos.c === actualC) {
            className += ` ${styles.selected}`;
        }

        if (lastMove && lastMove.to.r === actualR && lastMove.to.c === actualC) {
            className += ` ${styles.lastMove}`;
        }

        return className;
    };

    const handleCellClick = (r: number, c: number) => {
        const actualR = isSente ? r : 3 - r;
        const actualC = isSente ? c : 2 - c;
        onCellClick(actualR, actualC);
    };

    const renderPiece = (type: PieceType) => {
        const Component = PIECE_COMPONENTS[type];
        return <Component size={40} />;
    };

    const renderHand = (player: Player) => {
        const hand = hands[player];
        return (
            <div className={styles.hand}>
                {(Object.keys(hand) as PieceType[]).map(type => {
                    const count = hand[type] || 0;
                    if (count === 0) return null;
                    return (
                        <div
                            key={type}
                            className={`${styles.handPiece} ${selectedHand === type && turn === player ? styles.selected : ''}`}
                            onClick={() => player === myRole && onHandClick(type)}
                        >
                            {renderPiece(type)}
                            {count > 1 && <span className={styles.count}>{count}</span>}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={styles.boardContainer}>
            {/* Opponent Area */}
            <div className={styles.playerArea}>
                <div className={styles.playerName}>{myRole === 'sente' ? '後手 (Gote)' : '先手 (Sente)'}</div>
                {renderHand(myRole === 'sente' ? 'gote' : 'sente')}
            </div>

            {/* Board */}
            <div className={styles.board}>
                {displayBoard.map((row, r) => (
                    row.map((piece, c) => (
                        <div
                            key={`${r}-${c}`}
                            className={getCellClass(r, c)}
                            onClick={() => handleCellClick(r, c)}
                        >
                            {piece && (
                                <span className={`${styles.piece} ${piece.owner === 'gote' ? styles.gotePiece : ''}`}>
                                    {renderPiece(piece.type)}
                                </span>
                            )}
                        </div>
                    ))
                ))}
            </div>

            {/* My Area */}
            <div className={styles.playerArea}>
                {renderHand(myRole || 'sente')}
                <div className={styles.playerName}>{myRole === 'sente' ? '先手 (Sente)' : '後手 (Gote)'}</div>
            </div>
        </div>
    );
}
