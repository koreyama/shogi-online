import React from 'react';
import styles from './Piece.module.css';
import { Piece as PieceType } from '@/lib/shogi/types';

type PieceProps = {
    piece: PieceType;
    onClick?: () => void;
    isSelected?: boolean;
    isLastMove?: boolean;
};

const PIECE_KANJI: Record<string, { normal: string; promoted?: string }> = {
    pawn: { normal: '歩', promoted: 'と' },
    lance: { normal: '香', promoted: '杏' },
    knight: { normal: '桂', promoted: '圭' },
    silver: { normal: '銀', promoted: '全' },
    gold: { normal: '金' },
    bishop: { normal: '角', promoted: '馬' },
    rook: { normal: '飛', promoted: '龍' },
    king: { normal: '王' }, // Will handle Gyoku logic inside component if needed
};

export const Piece: React.FC<PieceProps> = ({ piece, onClick, isSelected, isLastMove }) => {
    const kanji = piece.isPromoted
        ? PIECE_KANJI[piece.type].promoted
        : (piece.type === 'king' && piece.owner === 'sente' ? '玉' : PIECE_KANJI[piece.type].normal);

    return (
        <div
            className={`
        ${styles.piece} 
        ${piece.owner === 'gote' ? styles.gote : ''}
        ${isSelected ? styles.selected : ''}
        ${isLastMove ? styles.lastMove : ''}
        ${piece.isPromoted ? styles.promoted : ''}
      `}
            onClick={onClick}
        >
            <div className={styles.pieceInner}>
                <span className={styles.kanji}>{kanji}</span>
            </div>
        </div>
    );
};
