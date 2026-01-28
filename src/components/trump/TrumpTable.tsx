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
    onCardClick?: (card: CardType, index: number) => void;
    // selectedIndices removed - usage deprecated
    selectedCards?: CardType[]; // Added support for Card object selection
    playableCards?: CardType[];
    isRevolution: boolean;
}

export const TrumpTable: React.FC<TrumpTableProps> = ({
    players,
    myId,
    hands,
    fieldCards,
    turnPlayerId,
    onCardClick,
    selectedCards = [], // Default empty
    playableCards = [],
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
            // Visual Clockwise: Bottom -> Left -> Right -> Bottom
            // (6 -> 9 -> 3 -> 6)
            if (index === 1) return styles.left;
            if (index === 2) return styles.right;
        }
        if (total === 4) {
            // Visual Clockwise: Bottom -> Left -> Top -> Right
            // (6 -> 9 -> 12 -> 3)
            if (index === 1) return styles.left;
            if (index === 2) return styles.top;
            if (index === 3) return styles.right;
        }
        if (total === 5) {
            if (index === 1) return styles.left;
            if (index === 2) return styles.topLeft;
            if (index === 3) return styles.topRight;
            if (index === 4) return styles.right;
        }
        if (total >= 6) {
            if (index === 1) return styles.leftBottom;
            if (index === 2) return styles.leftTop;
            if (index === 3) return styles.top;
            if (index === 4) return styles.rightTop;
            if (index === 5) return styles.rightBottom;
        }
        return styles.top; // Fallback
    };

    // Window size tracking for dynamic layout
    const [windowWidth, setWindowWidth] = React.useState(1000); // Default to desktop logic initially to match server roughly or avoid huge shift
    React.useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        handleResize(); // Set initial
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 768;
    const CARD_WIDTH = isMobile ? 60 : 100;
    const CONTAINER_MAX_WIDTH = isMobile ? windowWidth * 0.92 : Math.min(windowWidth * 0.8, 900);

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
                    <AnimatePresence>
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

                // --- NEW DYNAMIC CALCULATION ---
                let dynamicMarginLeft = isMobile ? -35 : -50; // Default CSS value

                if (isMe && hand.length > 1) {
                    // Calculate optimal margin to fit all cards
                    // Formula: (count * visibleWidth) + (overlap) <= MaxWidth
                    // Actually: TotalWidth = CardWidth + (Count - 1) * (CardWidth + Margin)
                    // We solve for Margin:
                    // Margin <= [(MaxWidth - CardWidth) / (Count - 1)] - CardWidth

                    const maxMargin = ((CONTAINER_MAX_WIDTH - CARD_WIDTH) / (hand.length - 1)) - CARD_WIDTH;
                    const standardMargin = isMobile ? -25 : -40; // A bit looser than CSS default for better visibility if space allows

                    // Use the tighter of the two constraints (fit container OR standard look)
                    dynamicMarginLeft = Math.min(standardMargin, maxMargin);
                } else if (!isMe) {
                    // For opponents, keep tight overlap
                    dynamicMarginLeft = isMobile ? -45 : -80;
                }
                // -------------------------------

                return (
                    <div key={player.id} className={`${styles.playerArea} ${positionClass}`}>
                        <motion.div
                            className={`${styles.playerName} ${isTurn ? styles.activePlayer : ''}`}
                            animate={{
                                scale: isTurn ? 1.1 : 1,
                                boxShadow: isTurn ? "0 0 20px rgba(255, 215, 0, 0.6)" : "0 4px 6px rgba(0, 0, 0, 0.1)"
                            }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                        >
                            {player.rank && ['daifugo', 'fugou', 'heimin', 'binbou', 'daihinmin'].includes(player.rank) && (
                                <span style={{
                                    fontSize: '0.8rem',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: player.rank === 'daifugo' ? '#FCD34D' : player.rank === 'daihinmin' ? '#1F2937' : '#4B5563',
                                    color: player.rank === 'daifugo' ? '#92400E' : 'white',
                                    fontWeight: 'bold',
                                    border: player.rank === 'daifugo' ? '1px solid #F59E0B' : 'none'
                                }}>
                                    {player.rank === 'daifugo' ? '大富豪' :
                                        player.rank === 'fugou' ? '富豪' :
                                            player.rank === 'heimin' ? '平民' :
                                                player.rank === 'binbou' ? '貧民' : '大貧民'}
                                </span>
                            )}
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
                            <AnimatePresence>
                                {hand.map((card, i) => {
                                    // Check selection by card object content (Suit + Rank)
                                    // This is stable even if hand sorting changes
                                    const isSelected = isMe && selectedCards.some(sc => sc.suit === card.suit && sc.rank === card.rank);

                                    const isPlayable = !isMe || (playableCards.length === 0 ? false : playableCards.some(pc => pc.suit === card.suit && pc.rank === card.rank));

                                    const cardStyle = i === 0 ? { marginLeft: 0 } : { marginLeft: dynamicMarginLeft };

                                    return (
                                        <motion.div
                                            // Ensure uniqueness for multiple Jokers or identical cards
                                            key={`${player.id}-hand-${i}-${card.suit}-${card.rank}`}
                                            className={styles.cardWrapper}
                                            // layout prop removed to prevent crash
                                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                y: isSelected ? -30 : 0
                                            }}
                                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                            transition={{
                                                layout: { type: "spring", stiffness: 300, damping: 30 },
                                                opacity: { duration: 0.2 }
                                            }}
                                            style={{
                                                ...cardStyle,
                                                zIndex: i,
                                                position: 'relative'
                                            }}
                                        >
                                            <Card
                                                card={isMe ? card : null}
                                                isSelected={isSelected}
                                                isPlayable={isPlayable}
                                                onClick={() => isMe && isPlayable && onCardClick && onCardClick(card, i)}
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
