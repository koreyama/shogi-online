import React from 'react';
import { motion } from 'framer-motion';
import styles from './Card.module.css';
import { Card as CardType } from '@/lib/trump/types';
import { getSuitSymbol, getRankSymbol, getCardColor } from '@/lib/trump/deck';

interface CardProps {
    card: CardType | null; // null means face down (back)
    isSelected?: boolean;
    onClick?: () => void;
    style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ card, isSelected, onClick, style }) => {
    if (!card) {
        return (
            <motion.div
                className={`${styles.card} ${styles.back} ${isSelected ? styles.selected : ''}`}
                onClick={onClick}
                style={style}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            />
        );
    }

    const color = getCardColor(card.suit);
    const suitSymbol = getSuitSymbol(card.suit);
    const rankSymbol = getRankSymbol(card.rank);

    return (
        <motion.div
            className={`${styles.card} ${isSelected ? styles.selected : ''}`}
            onClick={onClick}
            style={{ ...style, color }}
            whileHover={{ scale: 1.05, y: -10, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{
                opacity: 1,
                y: isSelected ? -20 : 0,
                scale: isSelected ? 1.05 : 1
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <div className={styles.top}>
                <span>{rankSymbol}</span>
                <span>{suitSymbol}</span>
            </div>

            <div className={styles.center}>
                {card.suit === 'joker' ? (
                    <span className={styles.joker}>JOKER</span>
                ) : (
                    suitSymbol
                )}
            </div>

            <div className={styles.bottom}>
                <span>{rankSymbol}</span>
                <span>{suitSymbol}</span>
            </div>
        </motion.div>
    );
};
