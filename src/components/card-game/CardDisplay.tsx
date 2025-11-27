import React from 'react';
import { Card } from '@/lib/card-game/types';
import { IconSwords, IconShield, IconStaff, IconPotion, IconStar } from '@/components/Icons';
import styles from './CardDisplay.module.css';

interface CardDisplayProps {
    card: Card;
    onClick?: () => void;
    size?: 'small' | 'medium' | 'large';
    className?: string;
    disabled?: boolean;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({ card, onClick, size = 'medium', className = '', disabled = false }) => {
    const getIcon = () => {
        switch (card.type) {
            case 'weapon': return <IconSwords size={size === 'small' ? 24 : 48} />;
            case 'armor': return <IconShield size={size === 'small' ? 24 : 48} />;
            case 'magic': return <IconStaff size={size === 'small' ? 24 : 48} />;
            case 'item': return <IconPotion size={size === 'small' ? 24 : 48} />;
            case 'enchantment': return <IconStar size={size === 'small' ? 24 : 48} />;
            default: return <IconStar size={size === 'small' ? 24 : 48} />;
        }
    };

    const getTypeLabel = () => {
        switch (card.type) {
            case 'weapon': return '武器';
            case 'armor': return '防具';
            case 'magic': return '魔法';
            case 'item': return '道具';
            case 'enchantment': return '付与';
            default: return 'その他';
        }
    };

    const getGradient = () => {
        switch (card.type) {
            case 'weapon': return 'linear-gradient(135deg, #fecaca 0%, #ef4444 100%)'; // Red
            case 'armor': return 'linear-gradient(135deg, #bfdbfe 0%, #3b82f6 100%)'; // Blue
            case 'magic': return 'linear-gradient(135deg, #e9d5ff 0%, #a855f7 100%)'; // Purple
            case 'item': return 'linear-gradient(135deg, #bbf7d0 0%, #22c55e 100%)'; // Green
            case 'enchantment': return 'linear-gradient(135deg, #fef08a 0%, #eab308 100%)'; // Yellow
            default: return 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)'; // Gray
        }
    };

    return (
        <div
            className={`${styles.card} ${styles[size]} ${disabled ? styles.disabled : ''} ${className}`}
            onClick={!disabled ? onClick : undefined}
            style={{ '--card-gradient': getGradient() } as React.CSSProperties}
        >
            <div className={styles.header}>
                <span className={styles.cost}>{card.cost} MP</span>
                <span className={styles.name}>{card.name}</span>
            </div>

            <div className={styles.imageArea}>
                {getIcon()}
            </div>

            <div className={styles.body}>
                <div className={styles.type}>{getTypeLabel()}</div>
                <div className={styles.description}>{card.description}</div>
            </div>

            <div className={styles.footer}>
                {card.value > 0 && (
                    <span className={styles.value}>
                        威力: {card.value}
                    </span>
                )}
            </div>
        </div>
    );
};
