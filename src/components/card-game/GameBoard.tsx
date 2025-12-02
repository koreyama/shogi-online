import React, { useEffect, useRef } from 'react';
import { GameState } from '@/lib/card-game/types';
import { CARDS } from '@/lib/card-game/data/cards';
import { AVATARS } from '@/lib/card-game/data/avatars';
import { PlayerStatus } from './PlayerStatus';
import { Hand } from './Hand';
import { CardDisplay } from './CardDisplay';
import { DiscardPileModal } from './DiscardPileModal';
import styles from './GameBoard.module.css';

import { useGameSound } from '@/hooks/useGameSound';

interface GameBoardProps {
    gameState: GameState;
    myPlayerId: string;
    onPlayCard: (cardId: string) => void;
    onDiscardCard?: (cardId: string) => void;
    onEndTurn: () => void;
    onUseUltimate?: () => void;
    onManaCharge?: (cardIds: string[]) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, myPlayerId, onPlayCard, onDiscardCard, onEndTurn, onUseUltimate, onManaCharge }) => {
    const myPlayer = gameState.players[myPlayerId];
    const opponentId = Object.keys(gameState.players).find(id => id !== myPlayerId)!;
    const opponent = gameState.players[opponentId];
    const isMyTurn = gameState.turnPlayerId === myPlayerId;
    const logEndRef = useRef<HTMLDivElement>(null);

    const [showLog, setShowLog] = React.useState(false);
    const [showDiscard, setShowDiscard] = React.useState(false);
    const [isManaChargeMode, setIsManaChargeMode] = React.useState(false);
    const { playCardPlaySound, playEndTurnSound, playWinSound, playLoseSound, playManaChargeSound } = useGameSound();

    // Sound Effects for Game State Changes
    useEffect(() => {
        if (gameState.winner) {
            if (gameState.winner === myPlayerId) {
                playWinSound();
            } else {
                playLoseSound();
            }
        }
    }, [gameState.winner, myPlayerId, playWinSound, playLoseSound]);

    // Wrap handlers to add sound
    const handlePlayCard = (cardId: string) => {
        playCardPlaySound();
        onPlayCard(cardId);
    };

    const [selectedManaChargeCards, setSelectedManaChargeCards] = React.useState<string[]>([]);

    const handleManaChargeToggle = (cardId: string) => {
        if (selectedManaChargeCards.includes(cardId)) {
            setSelectedManaChargeCards(prev => prev.filter(id => id !== cardId));
        } else {
            if (selectedManaChargeCards.length < 3) {
                setSelectedManaChargeCards(prev => [...prev, cardId]);
            }
        }
    };

    const executeManaCharge = () => {
        if (onManaCharge && selectedManaChargeCards.length > 0) {
            onManaCharge(selectedManaChargeCards);
            setSelectedManaChargeCards([]);
            setIsManaChargeMode(false);
        }
    };

    const handleEndTurn = () => {
        playEndTurnSound();
        onEndTurn();
    };

    const handleUseUltimate = () => {
        if (onUseUltimate) {
            // playUltimateSound(); // Assuming we add this
            onUseUltimate();
        }
    };

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameState.log, showLog]);

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
                <button
                    className={styles.logToggleBtn}
                    onClick={() => setShowLog(!showLog)}
                >
                    {showLog ? 'ログを閉じる' : 'ログを表示'}
                </button>

                <div className={`${styles.logArea} ${showLog ? styles.showLog : ''}`}>
                    {(gameState.log || []).map(entry => (
                        <div key={entry.id} className={styles.logEntry}>
                            {entry.text}
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>


                <div className={styles.fieldArea}>
                    {/* Field Effect Display */}
                    {gameState.field && (
                        <div className={styles.activeField}>
                            <div className={styles.fieldLabel}>FIELD</div>
                            <div className={`${styles.fieldCard} ${styles[gameState.field.element || 'none']}`}>
                                {gameState.field.name}
                            </div>
                            <div className={styles.fieldDesc}>
                                {CARDS[gameState.field.cardId]?.description}
                            </div>
                        </div>
                    )}

                    {/* Trap Display (Opponent) */}
                    {gameState.traps && gameState.traps.some(t => t.ownerId === opponentId) && (
                        <div className={styles.opponentTraps}>
                            {gameState.traps.filter(t => t.ownerId === opponentId).map(t => (
                                <div key={t.id} className={styles.trapCardBack} title="相手の罠">?</div>
                            ))}
                        </div>
                    )}

                    {gameState.lastPlayedCard && CARDS[gameState.lastPlayedCard.cardId] && (
                        <div key={gameState.lastPlayedCard.cardId} className={styles.playedCardWrapper}>
                            <CardDisplay
                                card={CARDS[gameState.lastPlayedCard.cardId]}
                                size="medium"
                                className={styles.playedCard}
                            />
                        </div>
                    )}

                    {/* Trap Display (Player) */}
                    {gameState.traps && gameState.traps.some(t => t.ownerId === myPlayerId) && (
                        <div className={styles.playerTraps}>
                            {gameState.traps.filter(t => t.ownerId === myPlayerId).map(t => (
                                <div key={t.id} className={`${styles.trapCard} ${styles.myTrap}`} title="あなたの罠">
                                    <div className={styles.trapLabel}>TRAP</div>
                                    {t.name}
                                </div>
                            ))}
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
                </div>
            </div>

            {/* Player Area */}
            <div className={styles.playerArea}>
                <div className={styles.playerControls}>
                    <PlayerStatus player={myPlayer} />
                    <div className={styles.actionButtons}>
                        <button
                            className={styles.endTurnBtn}
                            onClick={handleEndTurn}
                            disabled={!isMyTurn}
                        >
                            ターン終了
                        </button>

                        {/* Mana Charge Button */}
                        <div className={styles.manaChargeContainer}>
                            <button
                                className={`${styles.manaChargeBtn} ${isManaChargeMode ? styles.active : ''}`}
                                onClick={() => {
                                    setIsManaChargeMode(!isManaChargeMode);
                                    setSelectedManaChargeCards([]); // Reset selection on toggle
                                }}
                                disabled={!isMyTurn || (gameState.turnState.manaChargeCount || 0) >= 3}
                                title="手札をマナゾーンに置いてMP+1 (ターン3回まで)"
                            >
                                {isManaChargeMode ? 'キャンセル' : 'マナチャージ'}
                                <span className={styles.chargeCount}>
                                    {(gameState.turnState.manaChargeCount || 0)}/3
                                </span>
                            </button>
                            {isManaChargeMode && selectedManaChargeCards.length > 0 && (
                                <button
                                    className={styles.executeChargeBtn}
                                    onClick={executeManaCharge}
                                >
                                    決定 ({selectedManaChargeCards.length})
                                </button>
                            )}
                        </div>

                        {/* Discard Pile Button */}
                        <button
                            className={styles.discardBtn}
                            onClick={() => setShowDiscard(true)}
                            title="墓地を確認"
                        >
                            <span className={styles.discardIcon}>💀</span>
                            <span className={styles.discardCount}>{myPlayer.discardPile?.length || 0}</span>
                        </button>

                        {/* Ultimate Button */}
                        <button
                            className={`${styles.ultimateBtn} ${myPlayer.ultimateUsed ? styles.ultimateUsed : ''}`}
                            onClick={handleUseUltimate}
                            disabled={!isMyTurn || myPlayer.ultimateUsed || myPlayer.mp < (AVATARS[myPlayer.avatarId]?.ultimateCost || 999)}
                            title={AVATARS[myPlayer.avatarId]?.ultimateDescription}
                        >
                            ULTIMATE
                            <span className={styles.ultimateCost}>
                                {AVATARS[myPlayer.avatarId]?.ultimateCost} MP
                            </span>
                        </button>
                    </div>
                </div>
                <Hand
                    cardIds={myPlayer.hand || []}
                    onPlayCard={handlePlayCard}
                    onDiscard={(cardId) => {
                        if (onDiscardCard) onDiscardCard(cardId);
                    }}
                    isMyTurn={isMyTurn}
                    currentMp={myPlayer.mp}
                    cardsData={CARDS}
                    canDiscard={!gameState.turnState.hasDiscarded}
                    isManaChargeMode={isManaChargeMode}
                    onManaCharge={handleManaChargeToggle}
                    selectedCardIds={selectedManaChargeCards}
                />
            </div>

            {/* Discard Pile Modal */}
            {showDiscard && (
                <DiscardPileModal
                    cardIds={myPlayer.discardPile || []}
                    onClose={() => setShowDiscard(false)}
                />
            )}
        </div>
    );
};
