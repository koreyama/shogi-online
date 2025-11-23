import React from 'react';
import styles from './PlayerInfo.module.css';
import { Player } from '@/lib/shogi/types';

interface PlayerInfoProps {
    playerName: string;
    role: Player;
    isMyTurn: boolean;
    capturedPiecesCount: number;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({
    playerName,
    role,
    isMyTurn,
    capturedPiecesCount,
}) => {
    return (
        <div className={`${styles.playerInfo} ${isMyTurn ? styles.activeTurn : ''}`}>
            <div className={styles.playerHeader}>
                <div className={styles.playerName}>
                    {playerName}
                </div>
                <div className={styles.playerRole}>
                    {role === 'sente' ? '☗ 先手' : '☖ 後手'}
                </div>
            </div>
            <div className={styles.playerStats}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>獲得駒:</span>
                    <span className={styles.statValue}>{capturedPiecesCount}</span>
                </div>
                {isMyTurn && (
                    <div className={styles.turnIndicator}>
                        <span className={styles.turnDot}></span>
                        手番
                    </div>
                )}
            </div>
        </div>
    );
};
