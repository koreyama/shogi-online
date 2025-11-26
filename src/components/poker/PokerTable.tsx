import React from 'react';
import styles from './PokerTable.module.css';
import { Card as CardType } from '@/lib/trump/types';
import { Card } from '@/components/trump/Card';
import { PokerPlayer, PokerGameState } from '@/lib/poker/types';

interface PokerTableProps {
    gameState: PokerGameState;
    myId: string;
}

export const PokerTable: React.FC<PokerTableProps> = ({ gameState, myId }) => {
    const players = gameState.players ? Object.values(gameState.players).sort((a, b) => a.id.localeCompare(b.id)) : [];

    // Helper to get position class
    const getPositionClass = (playerId: string) => {
        const myIndex = players.findIndex(p => p.id === myId);
        const targetIndex = players.findIndex(p => p.id === playerId);

        // Rotate so myId is always bottom (index 0 relative)
        const relativeIndex = (targetIndex - myIndex + players.length) % players.length;

        if (players.length === 2) {
            if (relativeIndex === 0) return styles.bottom;
            return styles.top;
        }

        // For 3-4 players
        if (relativeIndex === 0) return styles.bottom;
        if (relativeIndex === 1) return styles.left;
        if (relativeIndex === 2 && players.length === 4) return styles.top;
        if (relativeIndex === 2 && players.length === 3) return styles.right;
        if (relativeIndex === 3) return styles.right;

        return styles.bottom; // Fallback
    };

    return (
        <div className={styles.table}>
            <div className={styles.communityCards}>
                {(gameState.communityCards || []).map((card, i) => (
                    <div key={i} className={styles.cardWrapper}>
                        <Card card={card} width={60} />
                    </div>
                ))}
            </div>

            <div className={styles.potInfo}>
                <div>POT: ${gameState.pot}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{(gameState.phase || '').toUpperCase()}</div>
            </div>

            {players.map(player => (
                <div
                    key={player.id}
                    className={`${styles.player} ${getPositionClass(player.id)} ${gameState.turnPlayerId === player.id ? styles.active : ''} ${!player.isActive ? styles.folded : ''} ${(gameState.winners || []).includes(player.id) ? styles.winner : ''}`}
                >
                    <div className={styles.playerInfo}>
                        <div className={styles.playerName}>{player.name}</div>
                        <div className={styles.chips}>${player.chips}</div>
                    </div>

                    <div className={styles.cards}>
                        {(player.hand || []).map((card, i) => (
                            <div key={i} className={styles.cardWrapper}>
                                {(player.id === myId || gameState.phase === 'showdown') ? (
                                    <Card card={card} width={60} />
                                ) : (
                                    <Card card={{ suit: 'spade', rank: 'A' }} isBack width={60} />
                                )}
                            </div>
                        ))}
                    </div>

                    {player.isDealer && <div className={styles.dealerButton}>D</div>}
                    {player.currentBet > 0 && <div className={styles.currentBet}>${player.currentBet}</div>}
                    {player.lastAction && <div style={{ position: 'absolute', top: -20, background: 'white', padding: '2px 5px', borderRadius: 5, fontSize: '0.7rem', color: 'black' }}>{player.lastAction.toUpperCase()}</div>}
                </div>
            ))}
        </div>
    );
};
