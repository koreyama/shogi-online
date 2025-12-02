import React from 'react';
import { CardDisplay } from './CardDisplay';
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
    isManaChargeMode?: boolean;
    onManaCharge?: (cardId: string) => void;
    selectedCardIds?: string[];
}

export const Hand: React.FC<HandProps> = ({ cardIds, onPlayCard, onDiscard, isMyTurn, currentMp, cardsData, canDiscard, isManaChargeMode, onManaCharge, selectedCardIds = [] }) => {
    return (
        <div className={`${styles.handContainer} ${isManaChargeMode ? styles.manaChargeMode : ''}`}>
            {cardIds.map((cardId, index) => {
                const card = cardsData[cardId];
                const canPlay = isMyTurn && card && currentMp >= card.cost;
                const canCharge = isMyTurn && isManaChargeMode;
                const isSelected = selectedCardIds.includes(cardId);

                return (
                    <div key={`${cardId}-${index}`} className={styles.cardWrapper}>
                        <CardDisplay
                            card={card}
                            onClick={() => {
                                if (isManaChargeMode && onManaCharge) {
                                    onManaCharge(cardId);
                                } else if (canPlay) {
                                    onPlayCard(cardId);
                                }
                            }}
                            disabled={!canPlay && !isManaChargeMode}
                            size="small"
                            className={`${isManaChargeMode ? styles.chargeTarget : ''} ${isSelected ? styles.selected : ''}`}
                        />
                        {isMyTurn && canDiscard && onDiscard && !isManaChargeMode && (
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
