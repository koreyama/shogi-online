import React, { useEffect, useRef } from 'react';
import { GameState } from '@/lib/card-game/types';
import { CARDS } from '@/lib/card-game/data/cards';
import { PlayerStatus } from './PlayerStatus';
import { Hand } from './Hand';
import { CardDisplay } from './CardDisplay';
import styles from './GameBoard.module.css';

interface GameBoardProps {
    gameState: GameState;
    myPlayerId: string;
    onPlayCard: (cardId: string) => void;
    onDiscardCard?: (cardId: string) => void;
    onEndTurn: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, myPlayerId, onPlayCard, onDiscardCard, onEndTurn }) => {
    const myPlayer = gameState.players[myPlayerId];
    const opponentId = Object.keys(gameState.players).find(id => id !== myPlayerId)!;
    const opponent = gameState.players[opponentId];
    const isMyTurn = gameState.turnPlayerId === myPlayerId;
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameState.log]);

    return (
        <div className={styles.board}>
            {/* Opponent Area */}
            <div className={styles.opponentArea}>
                <PlayerStatus player={opponent} isOpponent />
                <div className={styles.opponentHand}>
                    {/* Show card backs for opponent hand */}
                    {(opponent.hand || []).map((_, i) => (
                        <div key={i} className={styles.cardBack}></div>
                    ))}
                </div>
            </div>

            {/* Center Field / Info */}
            <div className={styles.centerField}>
                <div className={styles.logArea}>
                    {(gameState.log || []).map(entry => (
                        <div key={entry.id} className={styles.logEntry}>
                            {entry.text}
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>


                <div className={styles.fieldArea}>
                    {gameState.lastPlayedCard && (
                        <div className={styles.playedCardWrapper}>
                            <CardDisplay
                                card={CARDS[gameState.lastPlayedCard.cardId]}
                                size="medium"
                                className={styles.playedCard}
                            />
                        </div>
                    )}
                </div>

                <div className={styles.turnInfo}>
                    {gameState.winner ? (
                        <div className={styles.winnerAnnouncement}>
                            {gameState.winner === myPlayerId ? 'YOU WIN!' : 'YOU LOSE...'}
                        </div>
                    ) : (
                        <h2>{isMyTurn ? 'あなたのターン' : '相手のターン'}</h2>
                    )}
                    {isMyTurn && !gameState.winner && (
                        <button onClick={onEndTurn} className={styles.endTurnBtn}>ターン終了</button>
                    )}
                </div>
            </div>

            {/* Player Area */}
            <div className={styles.playerArea}>
                <PlayerStatus player={myPlayer} />
                <Hand
                    cardIds={myPlayer.hand || []}
                    onPlayCard={onPlayCard}
                    onDiscard={(cardId) => {
                        // We need to implement a way to call discardAndDraw from here.
                        // Since onPlayCard calls engine via firebase-utils or similar in page.tsx,
                        // we should probably expose onDiscard in GameBoardProps.
                        // For now, let's assume onPlayCard handles generic actions or we add a new prop.
                        // Wait, GameBoardProps needs update.
                        if (onDiscardCard) onDiscardCard(cardId);
                    }}
                    isMyTurn={isMyTurn}
                    currentMp={myPlayer.mp}
                    cardsData={CARDS}
                    canDiscard={!gameState.turnState.hasDiscarded}
                />
            </div>
        </div>
    );
};
