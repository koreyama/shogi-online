import React from 'react';
import { Card } from '@/lib/card-game/types';
import { IconSwords, IconShield, IconStaff, IconPotion, IconStar, IconBow, IconAxe, IconHammer, IconSpear, IconDagger, IconFire, IconWater, IconWind, IconEarth, IconHoly, IconDark, IconScroll, IconRing, IconBoot } from '@/components/Icons';
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
        const iconSize = size === 'small' ? 24 : 48;
        const name = card.name;

        // Weapon Specifics
        if (card.type === 'weapon') {
            if (name.includes('弓') || name.includes('ボウ')) return <IconBow size={iconSize} />;
            if (name.includes('斧') || name.includes('アックス')) return <IconAxe size={iconSize} />;
            if (name.includes('ハンマー') || name.includes('メイス')) return <IconHammer size={iconSize} />;
            if (name.includes('槍') || name.includes('スピア') || name.includes('ランス')) return <IconSpear size={iconSize} />;
            if (name.includes('短剣') || name.includes('ダガー') || name.includes('ナイフ') || name.includes('刃')) return <IconDagger size={iconSize} />;
            if (name.includes('鎌') || name.includes('サイズ')) return <IconDagger size={iconSize} />; // Scythe as dagger for now or add scythe
            return <IconSwords size={iconSize} />; // Default Sword
        }

        // Armor Specifics
        if (card.type === 'armor') {
            if (name.includes('ローブ') || name.includes('衣')) return <IconScroll size={iconSize} />; // Robe looks like cloth/scroll? Or maybe just shield for now.
            // Let's stick to Shield for all armors for consistency unless we have a specific armor icon.
            return <IconShield size={iconSize} />;
        }

        // Magic Specifics (Element based)
        if (card.type === 'magic') {
            if (card.element === 'fire') return <IconFire size={iconSize} />;
            if (card.element === 'water') return <IconWater size={iconSize} />;
            if (card.element === 'wind') return <IconWind size={iconSize} />;
            if (card.element === 'earth') return <IconEarth size={iconSize} />;
            if (card.element === 'holy') return <IconHoly size={iconSize} />;
            if (card.element === 'dark') return <IconDark size={iconSize} />;
            if (name.includes('シールド')) return <IconShield size={iconSize} />;
            if (name.includes('バーサク')) return <IconAxe size={iconSize} />;
            return <IconStaff size={iconSize} />;
        }

        // Item Specifics
        if (card.type === 'item') {
            if (name.includes('砥石')) return <IconSwords size={iconSize} />;
            if (name.includes('煙玉')) return <IconWind size={iconSize} />;
            return <IconPotion size={iconSize} />;
        }

        // Enchantment Specifics
        if (card.type === 'enchantment') {
            if (name.includes('指輪') || name.includes('リング')) return <IconRing size={iconSize} />;
            if (name.includes('ブーツ') || name.includes('靴')) return <IconBoot size={iconSize} />;
            if (name.includes('強化')) return <IconStar size={iconSize} />;
            return <IconStar size={iconSize} />;
        }

        return <IconStar size={iconSize} />;
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

    const elementClass = styles[card.element] || styles.none;
    const rarityClass = styles[card.rarity] || styles.common;

    return (
        <div
            className={`${styles.card} ${styles[size]} ${elementClass} ${rarityClass} ${disabled ? styles.disabled : ''} ${className}`}
            onClick={!disabled ? onClick : undefined}
        >
            <div className={styles.header}>
                <span className={styles.cost}>{card.cost} MP</span>
                <span className={styles.name}>{card.name}</span>
            </div>

            <div className={styles.imageArea}>
                {getIcon()}
            </div>

            <div className={styles.body}>
                <div className={styles.type}>{getTypeLabel()} - {card.element !== 'none' ? card.element.toUpperCase() : '無属性'}</div>
                <div className={styles.description}>{card.description}</div>
            </div>

            <div className={styles.footer}>
                {card.value > 0 && (
                    <span className={styles.value}>
                        {card.type === 'armor' ? '防御' : card.type === 'item' ? '効果' : '威力'}: {card.value}
                    </span>
                )}
                {card.durability !== undefined && (
                    <span className={styles.value}>
                        耐久: {card.durability}
                    </span>
                )}
            </div>
        </div>
    );
};
