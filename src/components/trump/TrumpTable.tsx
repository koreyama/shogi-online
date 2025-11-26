import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './TrumpTable.module.css';
import { Card } from './Card';
import { TrumpPlayer, Card as CardType } from '@/lib/trump/types';

interface TrumpTableProps {
    players: TrumpPlayer[];
    myId: string;
    hands: Record<string, CardType[]>; // playerId -> cards
    fieldCards: CardType[];
    turnPlayerId: string;
    onCardClick?: (card: CardType) => void;
    selectedCards?: CardType[];
    playableCards?: CardType[]; // Added
    isRevolution: boolean;
}

export const TrumpTable: React.FC<TrumpTableProps> = ({
    players,
    myId,
    hands,
    fieldCards,
    turnPlayerId,
    onCardClick,
    selectedCards = [],
    playableCards = [], // Added
    isRevolution
}) => {
    // Determine positions relative to "me" (bottom)
    const myIndex = players.findIndex(p => p.id === myId);
    const rotatedPlayers = [
        ...players.slice(myIndex),
        ...players.slice(0, myIndex)
    ];

    const getPositionClass = (index: number, total: number) => {
        if (index === 0) return styles.bottom;
        if (total === 2) return styles.top;
        if (total === 3) {
            if (index === 1) return styles.left;
            if (index === 2) return styles.right;
        }
        if (total === 4) {
            if (index === 1) return styles.left;
            if (index === 2) return styles.top;
            if (index === 3) return styles.right;
        }
        return styles.top; // Fallback
    };

    return (
        <div className={`${styles.table} ${isRevolution ? styles.revolutionMode : ''}`}>
            <AnimatePresence>
                {isRevolution && (
                    <motion.div
                        className={styles.revolutionIndicator}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        transition={{ duration: 0.5, type: "spring" }}
                    >
                        革命中
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Center Field */}
            <div className={styles.centerArea}>
                <div className={styles.fieldCards}>
                    <AnimatePresence mode='popLayout'>
                        {fieldCards.map((card, i) => (
                            <motion.div
                                key={`${card.suit}-${card.rank}-${i}`}
                                initial={{ opacity: 0, y: -50, scale: 0.5 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 50, scale: 0.5 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                style={{ marginLeft: i > 0 ? -40 : 0, zIndex: i }}
                            >
                                <Card card={card} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Players */}
            {rotatedPlayers.map((player, index) => {
                const isMe = player.id === myId;
                const isTurn = player.id === turnPlayerId;
                const hand = hands[player.id] || [];
                const positionClass = getPositionClass(index, players.length);

                return (
                    <div key={player.id} className={`${styles.playerArea} ${positionClass}`}>
                        <motion.div
                            className={`${styles.playerName} ${isTurn ? styles.activePlayer : ''}`}
                            animate={{
                                scale: isTurn ? 1.1 : 1,
                                boxShadow: isTurn ? "0 0 20px rgba(255, 215, 0, 0.6)" : "0 4px 6px rgba(0, 0, 0, 0.1)"
                            }}
                        >
                            {player.name}
                            {isTurn && (
                                <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                >
                                    ⏳
                                </motion.span>
                            )}
                        </motion.div>

                        <div className={`${styles.hand} ${!isMe ? styles.opponent : ''}`}>
                            <AnimatePresence mode='popLayout'>
                                {hand.map((card, i) => {
                                    const isSelected = selectedCards.some(c => c.suit === card.suit && c.rank === card.rank);
                                    // Check if playable (only for me)
                                    // If playableCards is empty (e.g. not my turn), maybe show all as disabled? 
                                    // Or if it's not my turn, playableCards might be empty.
                                    // Let's assume if playableCards is passed, we use it.
                                    // If it's not my turn, maybe we shouldn't dim them? Or dim all?
                                    // User wants "only playable cards selectable".
                                    // So if it's my turn, dim unplayable.
                                    // If not my turn, maybe dim all or just disable interaction.
                                    // Let's rely on the passed playableCards array.

                                    const isPlayable = !isMe || (playableCards.length === 0 ? false : playableCards.some(pc => pc.suit === card.suit && pc.rank === card.rank));

                                    // Wait, if playableCards is empty, it means NO cards are playable? Or feature not used?
                                    // If I pass [] when it's not my turn, then all cards become unplayable. That's correct.
                                    // But if I pass [] when it IS my turn (e.g. no valid moves), then all unplayable. Correct.
                                    // But what if I haven't implemented logic yet?
                                    // I should make sure I pass a valid list in page.tsx.

                                    return (
                                        <motion.div
                                            key={isMe ? `${card.suit}-${card.rank}` : `opponent-card-${i}`}
                                            className={styles.cardWrapper}
                                            layout
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0, y: -50 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        >
                                            <Card
                                                card={isMe ? card : null}
                                                isSelected={isSelected}
                                                isPlayable={isPlayable}
                                                onClick={() => isMe && isPlayable && onCardClick && onCardClick(card)}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
