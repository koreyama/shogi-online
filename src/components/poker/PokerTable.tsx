import React from 'react';
import styles from './PokerTable.module.css';
import { Card as CardType } from '@/lib/trump/types';
import { Card } from '@/components/trump/Card';
import { PokerPlayer, PokerGameState } from '@/lib/poker/types';

interface PokerTableProps {
    gameState: PokerGameState;
    myId: string;
    onNewGame?: () => void;
}

export const PokerTable: React.FC<PokerTableProps> = ({ gameState, myId, onNewGame }) => {
    const players = gameState.players ? Object.values(gameState.players).sort((a, b) => a.id.localeCompare(b.id)) : [];

    // Get position index for each player (relative to current player)
    const getPlayerPosition = (playerId: string): number => {
        const myIndex = players.findIndex(p => p.id === myId);
        const targetIndex = players.findIndex(p => p.id === playerId);
        if (myIndex === -1) return targetIndex;
        return (targetIndex - myIndex + players.length) % players.length;
    };

    // Position mapping based on player count and relative position
    const getPositionStyle = (position: number, totalPlayers: number): React.CSSProperties => {
        // Always put current player at bottom center
        if (position === 0) {
            return { bottom: '15px', left: '50%', transform: 'translateX(-50%)' };
        }

        if (totalPlayers === 2) {
            return { top: '15px', left: '50%', transform: 'translateX(-50%)' };
        }

        if (totalPlayers === 3) {
            if (position === 1) return { top: '25%', left: '8%' };
            if (position === 2) return { top: '25%', right: '8%' };
        }

        if (totalPlayers === 4) {
            if (position === 1) return { top: '50%', left: '15px', transform: 'translateY(-50%)' };
            if (position === 2) return { top: '15px', left: '50%', transform: 'translateX(-50%)' };
            if (position === 3) return { top: '50%', right: '15px', transform: 'translateY(-50%)' };
        }

        return {};
    };

    const renderPlayerSeat = (player: PokerPlayer) => {
        const position = getPlayerPosition(player.id);
        const positionStyle = getPositionStyle(position, players.length);
        const isMe = player.id === myId;
        const isCurrentTurn = gameState.turnPlayerId === player.id;
        const isWinner = (gameState.winners || []).includes(player.id);
        const showCards = isMe || gameState.phase === 'showdown';

        return (
            <div
                key={player.id}
                className={`${styles.playerSeat} ${isCurrentTurn ? styles.activeTurn : ''} ${!player.isActive ? styles.folded : ''} ${isWinner ? styles.winner : ''}`}
                style={positionStyle}
            >
                {/* Player Info */}
                <div className={styles.playerInfo}>
                    <div className={styles.playerName}>
                        {player.name}
                        {player.isDealer && <span className={styles.dealerBadge}>D</span>}
                    </div>
                    <div className={styles.playerChips}>${player.chips}</div>
                    {player.lastAction && (
                        <div className={styles.lastAction}>{player.lastAction.toUpperCase()}</div>
                    )}
                </div>

                {/* Player Cards */}
                <div className={styles.playerCards}>
                    {(player.hand || []).map((card, i) => (
                        <div key={i} className={styles.cardSlot}>
                            <Card
                                card={card}
                                isBack={!showCards}
                                width={45}
                            />
                        </div>
                    ))}
                </div>

                {/* Bet Amount */}
                {player.currentBet > 0 && (
                    <div className={styles.betAmount}>${player.currentBet}</div>
                )}
            </div>
        );
    };

    const isShowdown = gameState.phase === 'showdown';
    const winnerName = players.find(p => gameState.winners?.includes(p.id))?.name;

    return (
        <div className={styles.tableWrapper}>
            <div className={styles.table}>
                {/* Pot Display - Above table center */}
                <div className={styles.potArea}>
                    <div className={styles.potDisplay}>
                        <span className={styles.potLabel}>POT</span>
                        <span className={styles.potAmount}>${gameState.pot}</span>
                    </div>
                </div>

                {/* Community Cards - Center of table */}
                <div className={styles.tableCenter}>
                    <div className={styles.communityCards}>
                        {(gameState.communityCards || []).map((card, i) => (
                            <div key={i} className={styles.communityCard}>
                                <Card card={card} width={50} />
                            </div>
                        ))}
                        {/* Placeholder slots */}
                        {Array.from({ length: 5 - (gameState.communityCards?.length || 0) }).map((_, i) => (
                            <div key={`empty-${i}`} className={styles.communityCardEmpty} />
                        ))}
                    </div>

                    {/* Phase Indicator */}
                    <div className={styles.phaseIndicator}>
                        {(gameState.phase || 'preflop').toUpperCase()}
                    </div>
                </div>

                {/* Player Seats */}
                {players.map(player => renderPlayerSeat(player))}
            </div>

            {/* Winner Overlay */}
            {isShowdown && gameState.winners && gameState.winners.length > 0 && (
                <div className={styles.winnerOverlay}>
                    <div className={styles.winnerCard}>
                        <div className={styles.winnerEmoji}>🏆</div>
                        <div className={styles.winnerText}>{winnerName} WINS!</div>
                        <div className={styles.winnerPot}>+${gameState.pot}</div>
                        {onNewGame && (
                            <button onClick={onNewGame} className={styles.newGameBtn}>
                                次のゲーム
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
