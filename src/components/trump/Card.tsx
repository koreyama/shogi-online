import React from 'react';
import { motion } from 'framer-motion';
import styles from './Card.module.css';
import { Card as CardType } from '@/lib/trump/types';
import { getSuitSymbol, getRankSymbol, getCardColor } from '@/lib/trump/deck';

interface CardProps {
    card: CardType | null; // null means face down (back)
    isSelected?: boolean;
    isPlayable?: boolean;
    isBack?: boolean; // Force back face
    width?: number; // Custom width
    onClick?: () => void;
    style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ card, isSelected, isPlayable = true, isBack = false, width, onClick, style }) => {
    const cardStyle = {
        ...style,
        ...(width ? { width: `${width}px`, height: `${width * 1.4}px` } : {})
    };

    if (!card || isBack) {
        return (
            <motion.div
                className={`${styles.card} ${styles.back} ${isSelected ? styles.selected : ''}`}
                onClick={onClick}
                style={cardStyle}
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

    // Adjust font sizes for smaller cards
    const fontSizeStyle = width ? { fontSize: `${width * 0.3}px` } : {};
    const centerFontSizeStyle = width ? { fontSize: `${width * 0.8}px` } : {};

    return (
        <motion.div
            className={`${styles.card} ${isSelected ? styles.selected : ''} ${!isPlayable ? styles.unplayable : ''}`}
            onClick={isPlayable ? onClick : undefined}
            style={{
                ...cardStyle,
                color,
                opacity: isPlayable ? 1 : 0.5,
                filter: isPlayable ? 'none' : 'grayscale(100%)',
                cursor: isPlayable ? 'pointer' : 'not-allowed'
            }}
            whileHover={isPlayable ? { scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" } : {}} // Removed y: -10
            whileTap={isPlayable ? { scale: 0.95 } : {}}
            initial={{ opacity: 0, y: 20 }}
            animate={{
                opacity: isPlayable ? 1 : 0.5,
                // Removed y and scale based on isSelected, parent handles it
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {card.suit !== 'joker' && (
                <div className={styles.top} style={fontSizeStyle}>
                    <span>{rankSymbol}</span>
                    <span>{suitSymbol}</span>
                </div>
            )}

            <div className={styles.center} style={centerFontSizeStyle}>
                {card.suit === 'joker' ? (
                    <span className={styles.jokerIcon}>🃏</span>
                ) : (
                    suitSymbol
                )}
            </div>
            {card.suit !== 'joker' && (
                <div className={styles.bottom} style={fontSizeStyle}>
                    <span>{rankSymbol}</span>
                    <span>{suitSymbol}</span>
                </div>
            )}
        </motion.div>
    );
};
