import React, { useState, useEffect, useRef } from 'react';
import styles from './GameBoard.module.css';
import { CardDisplay } from './CardDisplay';
import { Hand } from './Hand';
import { PlayerStatus } from './PlayerStatus';
import { CARDS } from '@/lib/card-game/data/cards';
import { AVATARS } from '@/lib/card-game/data/avatars';
import { GameState, Player } from '@/lib/card-game/types';
import { MobileGameBoard } from './MobileGameBoard';

interface GameBoardProps {
    gameState: GameState;
    myPlayerId: string;
    onPlayCard: (cardId: string, targetId?: string, handIndex?: number) => void;
    onEndTurn: () => void;
    onManaCharge: () => void;
    onExecuteCharge: () => void;
    onCancelCharge: () => void;
    onUseUltimate: () => void;
    onSurrender: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
    gameState,
    myPlayerId,
    onPlayCard,
    onEndTurn,
    onManaCharge,
    onExecuteCharge,
    onCancelCharge,
    onUseUltimate,
    onSurrender
}) => {
    const [showLog, setShowLog] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);
    const myPlayer = gameState.players[myPlayerId];
    const opponentId = Object.keys(gameState.players).find(id => id !== myPlayerId) || '';
    const opponent = gameState.players[opponentId];

    const [isMobileView, setIsMobileView] = useState(false);
    const [showGraveyard, setShowGraveyard] = useState(false);
    const [showManaZone, setShowManaZone] = useState(false);
    const [showElementInfo, setShowElementInfo] = useState(false);

    // Auto-detect mobile on mount
    useEffect(() => {
        const checkMobile = () => {
            setIsMobileView(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameState.log, showLog]);

    // Safety check: If myPlayer is not found (e.g. during ID switch), don't render
    if (!myPlayer) return <div className={styles.loading}>Loading player data...</div>;





    const handlePlayCard = (cardId: string, targetId?: string, handIndex?: number) => {
        if (gameState.turnPlayerId === myPlayerId) {
            onPlayCard(cardId, targetId, handIndex);
        }
    };

    // Mana Charge Button Logic (Desktop)
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



    // ... (existing useEffects)

    // ... (existing handlers)

    if (isMobileView) {
        return (
            <>
                <MobileGameBoard
                    gameState={gameState}
                    myPlayerId={myPlayerId}
                    onPlayCard={handlePlayCard}
                    onEndTurn={onEndTurn}
                    onManaCharge={onManaCharge}
                    onExecuteCharge={onExecuteCharge}
                    onCancelCharge={onCancelCharge}
                    onUseUltimate={onUseUltimate}
                    onToggleLog={() => setShowLog(!showLog)}
                    showLog={showLog}
                    onSurrender={onSurrender}
                />
                {/* Debug: Toggle View */}
                <button
                    onClick={() => setIsMobileView(!isMobileView)}
                    style={{
                        position: 'fixed',
                        top: 10,
                        right: 10,
                        zIndex: 1000,
                        opacity: 0.8,
                        background: '#334155',
                        color: 'white',
                        border: '1px solid #475569',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                    }}
                >
                    PC View
                </button>
            </>
        );
    }

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
                                <div key={t.id} className={styles.trapCardBack} title="Secret Trap">
                                    ?
                                </div>
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

                    {gameState.winner && (
                        <div className={styles.winnerAnnouncement}>
                            {gameState.winner === myPlayerId ? 'VICTORY!' : 'DEFEAT...'}
                        </div>
                    )}
                </div>
            </div>

            {/* Player Area */}
            <div className={styles.playerArea}>
                <div className={styles.playerControls}>
                    <PlayerStatus player={myPlayer} />

                    {/* Info Buttons */}
                    <div className={styles.infoButtons}>
                        <button className={styles.infoBtn} onClick={() => setShowGraveyard(true)}>
                            墓地 ({myPlayer.discardPile?.length || 0})
                        </button>
                        <button className={styles.infoBtn} onClick={() => setShowManaZone(true)}>
                            マナ ({myPlayer.manaZone?.length || 0})
                        </button>
                        <button className={styles.infoBtn} onClick={() => setShowElementInfo(true)}>
                            属性相性
                        </button>
                    </div>

                    <div className={styles.actionButtons}>
                        <button
                            className={styles.endTurnBtn}
                            onClick={onEndTurn}
                            disabled={gameState.turnPlayerId !== myPlayerId}
                        >
                            ターン終了
                        </button>

                        <div className={styles.manaChargeContainer}>
                            <button
                                className={getManaChargeButtonClass()}
                                onClick={handleManaChargeClick}
                                disabled={gameState.turnPlayerId !== myPlayerId && !isChargeMode}
                            >
                                {getManaChargeButtonText()}
                                <span className={styles.chargeCount}>
                                    {isChargeMode ? `${selectedCount}枚選択中` : `(残り${3 - (gameState.turnState.manaChargeCount || 0)}回)`}
                                </span>
                            </button>
                        </div>

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
                <Hand
                    cardIds={myPlayer.hand || []}
                    onPlayCard={handlePlayCard}
                    isMyTurn={gameState.turnPlayerId === myPlayerId}
                    isManaChargeMode={myPlayer.isManaChargeMode}
                    selectedCardIndices={myPlayer.selectedForCharge}
                    onManaCharge={(index) => handlePlayCard(myPlayer.hand[index], undefined, index)}
                    currentMp={myPlayer.mp}
                    cardsData={CARDS}
                    canDiscard={false}
                    freeCardIds={gameState.turnState.freeCardIds}
                />
            </div>

            {/* Overlays */}
            {(showGraveyard || showManaZone || showElementInfo) && (
                <div className={styles.overlayContainer} onClick={() => { setShowGraveyard(false); setShowManaZone(false); setShowElementInfo(false); }}>
                    <div className={styles.overlayContentWrapper} onClick={e => e.stopPropagation()}>
                        <div className={styles.overlayHeader}>
                            <div className={styles.overlayTitle}>
                                {showGraveyard ? '墓地 (Graveyard)' : showManaZone ? 'マナゾーン (Mana Zone)' : '属性相性 (Elements)'}
                            </div>
                            <button
                                className={styles.closeBtn}
                                onClick={() => {
                                    setShowGraveyard(false);
                                    setShowManaZone(false);
                                    setShowElementInfo(false);
                                }}
                            >
                                閉じる
                            </button>
                        </div>

                        {showElementInfo ? (
                            <div className={styles.elementInfoContent}>
                                <div className={styles.elementCycle}>
                                    <span className={styles.fireText}>火</span> &gt;
                                    <span className={styles.windText}>風</span> &gt;
                                    <span className={styles.earthText}>土</span> &gt;
                                    <span className={styles.waterText}>水</span> &gt;
                                    <span className={styles.fireText}>火</span>
                                </div>
                                <div className={styles.elementPair}>
                                    <span className={styles.holyText}>聖</span> &lt;=&gt; <span className={styles.darkText}>闇</span>
                                </div>
                                <div className={styles.elementNote}>
                                    有利: ダメージ2.0倍 / 不利: ダメージ0.5倍
                                </div>
                            </div>
                        ) : (
                            <div className={styles.overlayGrid}>
                                {((showGraveyard ? myPlayer.discardPile : myPlayer.manaZone) || []).map((cardId: string, i: number) => (
                                    <div key={i} className={styles.overlayCardWrapper}>
                                        <CardDisplay card={CARDS[cardId]} size="medium" />
                                    </div>
                                ))}
                                {((showGraveyard ? myPlayer.discardPile : myPlayer.manaZone) || []).length === 0 && (
                                    <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>
                                        カードがありません
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Debug: Toggle View */}
            <button
                onClick={() => setIsMobileView(!isMobileView)}
                style={{
                    position: 'fixed',
                    top: 10,
                    right: 10,
                    zIndex: 1000,
                    opacity: 0.8,
                    background: '#334155',
                    color: 'white',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                }}
            >
                Mobile View
            </button>
        </div>
    );
};
