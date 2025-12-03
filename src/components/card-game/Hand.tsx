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
    onManaCharge?: (index: number) => void;
    selectedCardIndices?: number[];
    freeCardIds?: string[];
}

export const Hand: React.FC<HandProps> = ({ cardIds, onPlayCard, onDiscard, isMyTurn, currentMp, cardsData, canDiscard, isManaChargeMode, onManaCharge, selectedCardIndices = [], freeCardIds = [] }) => {
    return (
        <div className={`${styles.handContainer} ${isManaChargeMode ? styles.manaChargeMode : ''}`}>
            {cardIds.map((cardId, index) => {
                const card = cardsData[cardId];
                const isFree = freeCardIds.includes(cardId);
                const effectiveCost = isFree ? 0 : card.cost;
                const canPlay = isMyTurn && card && currentMp >= effectiveCost;
                const canCharge = isMyTurn && isManaChargeMode;
                const isSelected = selectedCardIndices.includes(index);

                return (
                    <div key={`${cardId}-${index}`} className={styles.cardWrapper}>
                        <CardDisplay
                            card={card}
                            onClick={() => {
                                if (isManaChargeMode && onManaCharge) {
                                    onManaCharge(index);
                                } else if (canPlay) {
                                    onPlayCard(cardId);
                                }
                            }}
                            disabled={!canPlay && !isManaChargeMode}
                            size="small"
                            className={`${isManaChargeMode ? styles.chargeTarget : ''} ${isSelected ? styles.selected : ''}`}
                            overrideCost={isFree ? 0 : undefined}
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
