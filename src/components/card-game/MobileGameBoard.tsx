import React, { useState, useEffect, useRef } from 'react';
import styles from './MobileGameBoard.module.css';
import { CardDisplay } from './CardDisplay';
import { Hand } from './Hand';
import { PlayerStatus } from './PlayerStatus';
import { CARDS } from '@/lib/card-game/data/cards';
import { AVATARS } from '@/lib/card-game/data/avatars';
import { GameState, Player } from '@/lib/card-game/types';

interface MobileGameBoardProps {
    gameState: GameState;
    myPlayerId: string;
    onPlayCard: (cardId: string, targetId?: string, handIndex?: number) => void;
    onEndTurn: () => void;
    onManaCharge: () => void;
    onExecuteCharge: () => void;
    onCancelCharge: () => void;
    onUseUltimate: () => void;
    onToggleLog: () => void;
    showLog: boolean;
    onSurrender: () => void;
}

export const MobileGameBoard: React.FC<MobileGameBoardProps> = ({
    gameState,
    myPlayerId,
    onPlayCard,
    onEndTurn,
    onManaCharge,
    onExecuteCharge,
    onCancelCharge,
    onUseUltimate,
    onToggleLog,
    showLog,
    onSurrender
}) => {
    const myPlayer = gameState.players[myPlayerId];
    const opponentId = Object.keys(gameState.players).find(id => id !== myPlayerId) || '';
    const opponent = gameState.players[opponentId];
    const logEndRef = useRef<HTMLDivElement>(null);

    const [showGraveyard, setShowGraveyard] = useState(false);
    const [showManaZone, setShowManaZone] = useState(false);
    const [showMenu, setShowMenu] = useState(false); // New menu state

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameState.log, showLog]);

    const handlePlayCard = (cardId: string, targetId?: string, handIndex?: number) => {
        if (gameState.turnPlayerId === myPlayerId) {
            onPlayCard(cardId, targetId, handIndex);
        }
    };

    // Mana Charge Button Logic
    const isChargeMode = myPlayer.isManaChargeMode;
    const selectedCount = myPlayer.selectedForCharge?.length || 0;

    const handleManaChargeClick = () => {
        if (isChargeMode) {
            if (selectedCount > 0) {
                onExecuteCharge(); // Confirm charge
            } else {
                onCancelCharge(); // Cancel mode
            }
        } else {
            onManaCharge(); // Enter charge mode
        }
    };

    const getManaChargeButtonText = () => {
        if (!isChargeMode) return "マナチャージ";
        return selectedCount > 0 ? "決定" : "キャンセル";
    };

    const getManaChargeButtonClass = () => {
        if (!isChargeMode) return styles.manaChargeBtn;
        return selectedCount > 0 ? `${styles.manaChargeBtn} ${styles.confirm}` : `${styles.manaChargeBtn} ${styles.cancel}`;
    };

    return (
        <div className={styles.mobileBoard}>
            {/* Top: Opponent Area */}
            <div className={styles.opponentArea}>
                <PlayerStatus player={opponent} isOpponent />
                <div className={styles.opponentHand}>
                    {(opponent.hand || []).map((_, i) => (
                        <div key={i} className={styles.cardBack}></div>
                    ))}
                </div>
            </div>

            {/* Middle: Field Area */}
            <div className={styles.fieldArea}>
                {/* Controls: Log & Menu */}
                <div className={styles.topControls}>
                    <button className={styles.logToggleBtn} onClick={onToggleLog}>
                        {showLog ? 'ログ閉じる' : 'ログ'}
                    </button>
                    <button className={styles.menuBtn} onClick={() => setShowMenu(true)}>
                        メニュー
                    </button>
                </div>

                {/* Menu Overlay */}
                {showMenu && (
                    <div className={styles.overlayContainer} style={{ zIndex: 2000 }}>
                        <div className={styles.overlayHeader}>
                            <div className={styles.overlayTitle}>メニュー</div>
                            <button className={styles.closeBtn} onClick={() => setShowMenu(false)}>閉じる</button>
                        </div>
                        <div className={styles.overlayContent} style={{ flexDirection: 'column', alignItems: 'center' }}>
                            <button
                                onClick={() => { setShowMenu(false); onSurrender(); }}
                                style={{
                                    padding: '1rem 2rem',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem'
                                }}
                            >
                                降参する (Surrender)
                            </button>
                        </div>
                    </div>
                )}

                {/* Info Buttons */}
                <div className={styles.infoButtons}>
                    <button className={styles.infoBtn} onClick={() => setShowGraveyard(true)}>
                        墓地 ({myPlayer.discardPile?.length || 0})
                    </button>
                    <button className={styles.infoBtn} onClick={() => setShowManaZone(true)}>
                        マナ ({myPlayer.manaZone?.length || 0})
                    </button>
                </div>

                {/* Overlays */}
                {(showGraveyard || showManaZone) && (
                    <div className={styles.overlayContainer}>
                        <div className={styles.overlayHeader}>
                            <div className={styles.overlayTitle}>
                                {showGraveyard ? '墓地' : 'マナゾーン'}
                            </div>
                            <button
                                className={styles.closeBtn}
                                onClick={() => {
                                    setShowGraveyard(false);
                                    setShowManaZone(false);
                                }}
                            >
                                閉じる
                            </button>
                        </div>
                        <div className={styles.overlayContent}>
                            {((showGraveyard ? myPlayer.discardPile : myPlayer.manaZone) || []).map((cardId, i) => (
                                <div key={i} className={styles.overlayCardWrapper}>
                                    <CardDisplay card={CARDS[cardId]} size="medium" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Log Overlay */}
                {showLog && (
                    <div className={styles.logOverlay}>
                        {(gameState.log || []).map(entry => (
                            <div key={entry.id} className={styles.logEntry}>
                                {entry.text}
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                )}

                {/* Field Effect */}
                {gameState.field && (
                    <div className={styles.activeField}>
                        <div className={styles.fieldLabel}>FIELD</div>
                        <div className={`${styles.fieldCard} ${styles[gameState.field.element || 'none']}`}>
                            {gameState.field.name}
                        </div>
                    </div>
                )}

                {/* Played Card */}
                <div className={styles.playedCardContainer}>
                    {gameState.lastPlayedCard && CARDS[gameState.lastPlayedCard.cardId] && (
                        <CardDisplay
                            card={CARDS[gameState.lastPlayedCard.cardId]}
                            size="small"
                            variant="battle"
                            className={styles.playedCard}
                        />
                    )}
                </div>
            </div>

            {/* Bottom: Player Area (Vertical Stack) */}
            <div className={styles.playerArea}>
                {/* Row 1: Status & Controls */}
                <div className={styles.playerStatusBar}>
                    <div className={styles.statusWrapper}>
                        <PlayerStatus player={myPlayer} />
                    </div>

                    <div className={styles.actionButtons}>
                        <button
                            className={styles.endTurnBtn}
                            onClick={onEndTurn}
                            disabled={gameState.turnPlayerId !== myPlayerId}
                        >
                            ターン終了
                        </button>

                        <button
                            className={getManaChargeButtonClass()}
                            onClick={handleManaChargeClick}
                            disabled={gameState.turnPlayerId !== myPlayerId && !isChargeMode}
                        >
                            {getManaChargeButtonText()}
                            <span className={styles.subText}>
                                {isChargeMode ? `${selectedCount}枚選択中` : `(残り${3 - (gameState.turnState.manaChargeCount || 0)}回)`}
                            </span>
                        </button>

                        <button
                            className={`${styles.ultimateBtn} ${myPlayer.ultimateUsed ? styles.ultimateUsed : ''}`}
                            onClick={onUseUltimate}
                            disabled={myPlayer.ultimateUsed || gameState.turnPlayerId !== myPlayerId}
                        >
                            アルティメット
                            <span className={styles.ultimateCost}>Cost: {AVATARS[myPlayer.avatarId]?.ultimateCost || 0}</span>
                        </button>
                    </div>
                </div>

                {/* Row 2: Hand (Full Width) */}
                <div className={styles.handWrapper}>
                    <Hand
                        cardIds={myPlayer.hand || []}
                        onPlayCard={handlePlayCard}
                        isMyTurn={gameState.turnPlayerId === myPlayerId}
                        isManaChargeMode={myPlayer.isManaChargeMode}
                        selectedCardIndices={myPlayer.selectedForCharge}
                        onManaCharge={(index) => handlePlayCard(myPlayer.hand[index], undefined, index)} // Pass index
                        currentMp={myPlayer.mp}
                        cardsData={CARDS}
                        canDiscard={false}
                        freeCardIds={gameState.turnState.freeCardIds}
                    />
                </div>
            </div>

        </div>
    );
};
