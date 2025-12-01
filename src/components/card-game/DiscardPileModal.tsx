import React from 'react';
import { CARDS } from '@/lib/card-game/data/cards';
import { CardDisplay } from './CardDisplay';
import styles from './DiscardPileModal.module.css';

interface DiscardPileModalProps {
    cardIds: string[];
    onClose: () => void;
}

export const DiscardPileModal: React.FC<DiscardPileModalProps> = ({ cardIds, onClose }) => {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>墓地 (Discard Pile)</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>
                <div className={styles.content}>
                    {cardIds.length === 0 ? (
                        <div className={styles.empty}>墓地にカードはありません</div>
                    ) : (
                        <div className={styles.grid}>
                            {cardIds.map((id, index) => (
                                <div key={`${id}-${index}`} className={styles.cardWrapper}>
                                    <CardDisplay card={CARDS[id]} size="small" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
