import React from 'react';
import { PlayerState, Card as CardType } from '@/lib/card-game/types';
import { CARDS } from '@/lib/card-game/data/cards';
import { AVATARS } from '@/lib/card-game/data/avatars';
import styles from './PlayerStatus.module.css';

interface PlayerStatusProps {
    player: PlayerState;
    isOpponent?: boolean;
}

export const PlayerStatus: React.FC<PlayerStatusProps> = ({ player, isOpponent }) => {
    const avatar = AVATARS[player.avatarId];
    const hpPercent = (player.hp / player.maxHp) * 100;
    const mpPercent = (player.mp / player.maxMp) * 100;

    const getCardName = (id?: string) => id ? CARDS[id].name : 'なし';

    const weapon = player.equipment?.weapon ? CARDS[player.equipment.weapon] : null;
    const armor = player.equipment?.armor ? CARDS[player.equipment.armor] : null;
    const enchantment = player.equipment?.enchantment ? CARDS[player.equipment.enchantment] : null;

    const atk = weapon ? weapon.value : 0;
    const def = armor ? armor.value : 0;

    return (
        <div className={`${styles.container} ${isOpponent ? styles.opponent : ''}`}>
            <div className={styles.avatar}>
                <div className={styles.avatarImage}>{avatar.name[0]}</div>
                <div className={styles.name}>{player.name}</div>
                <div className={styles.avatarName}>{avatar.name}</div>
            </div>

            <div className={styles.stats}>
                <div className={styles.barContainer}>
                    <div className={styles.label}>HP {player.hp}/{player.maxHp}</div>
                    <div className={styles.hpBar}>
                        <div className={styles.hpFill} style={{ width: `${hpPercent}%` }}></div>
                    </div>
                </div>

                <div className={styles.barContainer}>
                    <div className={styles.label}>MP {player.mp}/{player.maxMp}</div>
                    <div className={styles.mpBar}>
                        <div className={styles.mpFill} style={{ width: `${mpPercent}%` }}></div>
                    </div>
                </div>

                <div className={styles.equipment}>
                    <div className={styles.statRow}>
                        <span className={styles.statLabel}>攻撃力:</span>
                        <span className={styles.statValue}>{atk}</span>
                        {weapon && <span className={styles.equipName}>({weapon.name})</span>}
                    </div>
                    <div className={styles.statRow}>
                        <span className={styles.statLabel}>防御力:</span>
                        <span className={styles.statValue}>{def}</span>
                        {armor && <span className={styles.equipName}>({armor.name})</span>}
                    </div>
                    {enchantment && (
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>付与:</span>
                            <span className={styles.equipName}>{enchantment.name}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
