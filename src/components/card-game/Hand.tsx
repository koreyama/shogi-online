import React from 'react';
import { Card } from './Card';
import styles from './Hand.module.css';

import { IconTrash } from '@/components/Icons';

interface HandProps {
    cardIds: string[];
    onPlayCard: (cardId: string) => void;
    onDiscard?: (cardId: string) => void;
    isMyTurn: boolean;
    currentMp: number;
    cardsData: any;
    canDiscard: boolean;
}

export const Hand: React.FC<HandProps> = ({ cardIds, onPlayCard, onDiscard, isMyTurn, currentMp, cardsData, canDiscard }) => {
    return (
        <div className={styles.handContainer}>
            {cardIds.map((cardId, index) => {
                const card = cardsData[cardId];
                const canPlay = isMyTurn && card && currentMp >= card.cost;

                return (
                    <div key={`${cardId}-${index}`} className={styles.cardWrapper}>
                        <Card
                            cardId={cardId}
                            onClick={() => canPlay && onPlayCard(cardId)}
                            disabled={!canPlay}
                        />
                        {isMyTurn && canDiscard && onDiscard && (
                            <button
                                className={styles.discardBtn}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`「${card.name}」を捨ててカードを引きますか？`)) {
                                        onDiscard(cardId);
                                    }
                                }}
                                title="捨ててドロー"
                            >
                                <IconTrash size={16} />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
