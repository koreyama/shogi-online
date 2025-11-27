'use client';

import React, { useState } from 'react';
import { CARD_LIST, CARDS } from '@/lib/card-game/data/cards';
import styles from './DeckBuilder.module.css';
import { CardDisplay } from './CardDisplay';

interface DeckBuilderProps {
    onSave: (deckId: string, cardIds: string[]) => void;
    onCancel: () => void;
}

export const DeckBuilder: React.FC<DeckBuilderProps> = ({ onSave, onCancel }) => {
    const [deckName, setDeckName] = useState('My Deck');
    const [selectedCards, setSelectedCards] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<string>('all');

    const [previewCardId, setPreviewCardId] = useState<string | null>(null);

    const DECK_SIZE_LIMIT = 30;

    const handleAddCard = (cardId: string) => {
        if (selectedCards.length >= DECK_SIZE_LIMIT) {
            alert(`デッキ枚数は${DECK_SIZE_LIMIT}枚までです。`);
            return;
        }
        // Limit copies (e.g., 3 copies max)
        const count = selectedCards.filter(id => id === cardId).length;
        if (count >= 3) {
            alert('同じカードは3枚までです。');
            return;
        }
        setSelectedCards([...selectedCards, cardId]);
    };

    const handleRemoveCard = (index: number) => {
        const newDeck = [...selectedCards];
        newDeck.splice(index, 1);
        setSelectedCards(newDeck);
    };

    const handleSave = () => {
        if (selectedCards.length !== DECK_SIZE_LIMIT) {
            alert(`デッキは必ず${DECK_SIZE_LIMIT}枚にしてください。`);
            return;
        }
        const deckId = `deck-${Date.now()}`;
        localStorage.setItem(deckId, JSON.stringify({ name: deckName, cards: selectedCards }));
        onSave(deckId, selectedCards);
    };

    const filteredCards = CARD_LIST.filter(card => filterType === 'all' || card.type === filterType);

    // Group selected cards for display
    const groupedDeck = selectedCards.reduce((acc, cardId) => {
        acc[cardId] = (acc[cardId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className={styles.container}>
            {/* Card Detail Modal */}
            {previewCardId && (
                <div className={styles.modalOverlay} onClick={() => setPreviewCardId(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={{ transform: 'scale(1.5)', transformOrigin: 'center center', marginBottom: '40px' }}>
                            <CardDisplay
                                card={CARDS[previewCardId]}
                                size="large"
                            />
                        </div>
                        <button className={styles.modalCloseBtn} onClick={() => setPreviewCardId(null)}>閉じる</button>
                    </div>
                </div>
            )}

            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <input
                        type="text"
                        value={deckName}
                        onChange={(e) => setDeckName(e.target.value)}
                        className={styles.deckNameInput}
                        placeholder="デッキ名を入力"
                    />
                    <div className={styles.stats}>
                        <span className={selectedCards.length === DECK_SIZE_LIMIT ? styles.complete : ''}>
                            {selectedCards.length}
                        </span>
                        / {DECK_SIZE_LIMIT} 枚
                    </div>
                </div>
                <div className={styles.actions}>
                    <button onClick={onCancel} className={styles.secondaryBtn}>キャンセル</button>
                    <button onClick={handleSave} className={styles.primaryBtn} disabled={selectedCards.length !== DECK_SIZE_LIMIT}>保存</button>
                </div>
            </div>

            <div className={styles.builderLayout}>
                {/* Card Library */}
                <div className={styles.library}>
                    <div className={styles.filters}>
                        <button onClick={() => setFilterType('all')} className={filterType === 'all' ? styles.activeFilter : ''}>全て</button>
                        <button onClick={() => setFilterType('weapon')} className={filterType === 'weapon' ? styles.activeFilter : ''}>武器</button>
                        <button onClick={() => setFilterType('armor')} className={filterType === 'armor' ? styles.activeFilter : ''}>防具</button>
                        <button onClick={() => setFilterType('magic')} className={filterType === 'magic' ? styles.activeFilter : ''}>魔法</button>
                        <button onClick={() => setFilterType('item')} className={filterType === 'item' ? styles.activeFilter : ''}>雑貨</button>
                        <button onClick={() => setFilterType('enchantment')} className={filterType === 'enchantment' ? styles.activeFilter : ''}>付与</button>
                    </div>
                    <div className={styles.cardGrid}>
                        {filteredCards.map(card => {
                            const count = selectedCards.filter(id => id === card.id).length;
                            return (
                                <div
                                    key={card.id}
                                    className={`${styles.cardWrapper} ${count >= 3 ? styles.maxCopies : ''}`}
                                    onClick={() => handleAddCard(card.id)}
                                >
                                    <div
                                        className={styles.infoBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewCardId(card.id);
                                        }}
                                    >
                                        i
                                    </div>
                                    <CardDisplay card={card} size="small" disabled={count >= 3} />
                                    <div className={styles.cardCount}>所持: {count}/3</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Current Deck */}
                <div className={styles.currentDeck}>
                    <h3>デッキ内容 ({selectedCards.length})</h3>
                    <div className={styles.deckList}>
                        {selectedCards.map((cardId, index) => {
                            const card = CARDS[cardId];
                            return (
                                <div key={`${cardId}-${index}`} className={styles.deckItem} onClick={() => handleRemoveCard(index)}>
                                    <div className={styles.deckItemInfo}>
                                        <span className={styles.deckItemCost}>{card.cost}</span>
                                        <span className={styles.deckItemName}>{card.name}</span>
                                    </div>
                                    <span className={styles.removeIcon}>×</span>
                                </div>
                            );
                        })}
                    </div>
                    {/* Summary View */}

                </div>
            </div>
        </div>
    );
};
