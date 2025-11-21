import React from 'react';
import styles from './Komadai.module.css';
import { Piece as PieceType, Player } from '@/lib/shogi/types';
import { Piece } from './Piece';

type KomadaiProps = {
    owner: Player;
    pieces: PieceType[];
    onPieceClick: (piece: PieceType) => void;
    selectedPieceId: string | null;
};

export const Komadai: React.FC<KomadaiProps> = ({
    owner,
    pieces,
    onPieceClick,
    selectedPieceId
}) => {
    // Group pieces by type
    const groupedPieces = pieces.reduce((acc, piece) => {
        if (!acc[piece.type]) acc[piece.type] = [];
        acc[piece.type].push(piece);
        return acc;
    }, {} as Record<string, PieceType[]>);

    // Order for display
    const order = ['rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn'];

    return (
        <div className={`${styles.komadai} ${owner === 'gote' ? styles.gote : styles.sente}`}>
            <div className={styles.stand}>
                {order.map(type => {
                    const group = groupedPieces[type];
                    if (!group) return null;

                    const piece = group[0];
                    const count = group.length;
                    const isSelected = selectedPieceId === piece.id;

                    return (
                        <div key={type} className={styles.pieceGroup} onClick={() => onPieceClick(piece)}>
                            <div className={styles.pieceContainer}>
                                <Piece piece={piece} isSelected={isSelected} />
                                {count > 1 && <span className={styles.count}>{count}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
