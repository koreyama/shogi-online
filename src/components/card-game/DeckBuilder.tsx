'use client';

import React, { useState } from 'react';
import { CARD_LIST, CARDS } from '@/lib/card-game/data/cards';
import styles from './DeckBuilder.module.css';
import { CardDisplay } from './CardDisplay';

interface DeckBuilderProps {
    onSave: (deckId: string, cardIds: string[], deckName: string) => void;
    onCancel: () => void;
    initialDeck?: {
        id: string;
        name: string;
        cards: string[];
    };
}

export const DeckBuilder: React.FC<DeckBuilderProps> = ({ onSave, onCancel, initialDeck }) => {
    const [deckName, setDeckName] = useState(initialDeck?.name || 'My Deck');
    const [selectedCards, setSelectedCards] = useState<string[]>(initialDeck?.cards || []);
    const [filterType, setFilterType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

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
        const deckId = initialDeck?.id || `deck-${Date.now()}`;
        localStorage.setItem(deckId, JSON.stringify({ name: deckName, cards: selectedCards }));
        onSave(deckId, selectedCards, deckName);
    };

    const filteredCards = CARD_LIST.filter(card => {
        const typeMatch = filterType === 'all' || card.type === filterType;
        const nameMatch = card.name.toLowerCase().includes(searchQuery.toLowerCase());
        return typeMatch && nameMatch;
    });

    // Group selected cards for display
    const groupedDeck = selectedCards.reduce((acc, cardId) => {
        acc[cardId] = (acc[cardId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const [mobileTab, setMobileTab] = useState<'library' | 'deck'>('library');

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

            {/* Mobile Tabs */}
            <div className={styles.mobileTabs}>
                <button
                    className={`${styles.tabButton} ${mobileTab === 'library' ? styles.activeTab : ''}`}
                    onClick={() => setMobileTab('library')}
                >
                    カード一覧
                </button>
                <button
                    className={`${styles.tabButton} ${mobileTab === 'deck' ? styles.activeTab : ''}`}
                    onClick={() => setMobileTab('deck')}
                >
                    デッキ確認 ({selectedCards.length})
                </button>
            </div>

            <div className={styles.builderLayout}>
                {/* Card Library */}
                <div className={`${styles.library} ${mobileTab === 'deck' ? styles.mobileHidden : ''}`}>
                    <div className={styles.filters}>
                        {/* Search Input */}
                        <div className={styles.searchContainer}>
                            <input
                                type="text"
                                placeholder="カード名で検索..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>

                        {/* Mobile Filter Dropdown */}
                        <select
                            className={styles.mobileFilterSelect}
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">全て表示</option>
                            <option value="weapon">武器</option>
                            <option value="armor">防具</option>
                            <option value="magic">魔法</option>
                            <option value="item">雑貨</option>
                            <option value="enchantment">付与</option>
                            <option value="trap">罠</option>
                            <option value="field">フィールド</option>
                        </select>

                        {/* Desktop Filter Buttons */}
                        <div className={styles.desktopFilterButtons}>
                            <button onClick={() => setFilterType('all')} className={filterType === 'all' ? styles.activeFilter : ''}>全て</button>
                            <button onClick={() => setFilterType('weapon')} className={filterType === 'weapon' ? styles.activeFilter : ''}>武器</button>
                            <button onClick={() => setFilterType('armor')} className={filterType === 'armor' ? styles.activeFilter : ''}>防具</button>
                            <button onClick={() => setFilterType('magic')} className={filterType === 'magic' ? styles.activeFilter : ''}>魔法</button>
                            <button onClick={() => setFilterType('item')} className={filterType === 'item' ? styles.activeFilter : ''}>雑貨</button>
                            <button onClick={() => setFilterType('enchantment')} className={filterType === 'enchantment' ? styles.activeFilter : ''}>付与</button>
                            <button onClick={() => setFilterType('trap')} className={filterType === 'trap' ? styles.activeFilter : ''}>罠</button>
                            <button onClick={() => setFilterType('field')} className={filterType === 'field' ? styles.activeFilter : ''}>フィールド</button>
                        </div>
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
                <div className={`${styles.currentDeck} ${mobileTab === 'library' ? styles.mobileHidden : ''}`}>
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
