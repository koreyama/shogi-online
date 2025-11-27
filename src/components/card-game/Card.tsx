import React from 'react';
import { CARDS } from '@/lib/card-game/data/cards';
import styles from './Card.module.css';

interface CardProps {
    cardId: string;
    onClick?: () => void;
    disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({ cardId, onClick, disabled }) => {
    const card = CARDS[cardId];
    if (!card) return <div className={styles.cardError}>Unknown Card</div>;

    const getElementColor = (element: string) => {
        switch (element) {
            case 'fire': return '#e53e3e';
            case 'water': return '#3182ce';
            case 'wind': return '#38a169';
            case 'earth': return '#d69e2e';
            case 'holy': return '#d53f8c';
            case 'dark': return '#4a5568';
            default: return '#718096';
        }
    };

    return (
        <div
            className={`${styles.card} ${disabled ? styles.disabled : ''}`}
            onClick={!disabled ? onClick : undefined}
            data-type={card.type}
        >
            <div className={styles.header}>
                <span className={styles.name}>{card.name}</span>
                <span className={styles.cost}>{card.cost}</span>
            </div>
            <div className={styles.imagePlaceholder}>
                {/* Image would go here */}
                {card.type}
            </div>
            <div className={styles.body}>
                <div className={styles.value}>
                    {card.type === 'weapon' && `ATK: ${card.value}`}
                    {card.type === 'armor' && `DEF: ${card.value}`}
                    {card.type === 'magic' && `PWR: ${card.value}`}
                    {card.type === 'item' && `VAL: ${card.value}`}
                    {card.type === 'enchantment' && `BUFF: ${card.value}`}
                </div>
                <p className={styles.description}>{card.description}</p>
            </div>
        </div>
    );
};
