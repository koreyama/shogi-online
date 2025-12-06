'use client';

import React, { useState, useEffect } from 'react';
import styles from './BlackjackGameContent.module.css';
import { db } from '@/lib/firebase';
import { ref, onValue, update, remove, runTransaction } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';
import { Card as CardType } from '@/lib/trump/types';
import { Card } from '@/components/trump/Card';
import { Deck } from '@/lib/trump/deck';
import { BlackjackEngine } from '@/lib/blackjack/engine';
import { IconBack, IconCards } from '@/components/Icons';

interface BlackjackRoomState {
    roomId: string;
    hostId: string;
    status: 'waiting' | 'playing' | 'finished';
    playerHand: CardType[];
    dealerHand: CardType[];
    dealerHidden: boolean;
    deck: CardType[];
    result?: 'win' | 'lose' | 'push' | 'blackjack';
    createdAt: number;
}

interface Props {
    roomId: string;
    onExit: () => void;
}

export default function BlackjackGameContent({ roomId, onExit }: Props) {
    const { user, signInWithGoogle, loading: authLoading } = useAuth();
    const playerId = user?.uid || '';

    const [room, setRoom] = useState<BlackjackRoomState | null>(null);
    const [engine] = useState(() => new BlackjackEngine());

    useEffect(() => {
        if (!roomId) return;

        const roomRef = ref(db, `blackjack_rooms/${roomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setRoom(data);
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    const playerHandValue = room?.playerHand ? engine.calculateHandValue(room.playerHand) : null;
    const dealerHandValue = room?.dealerHand ? engine.calculateHandValue(
        room.dealerHidden ? [room.dealerHand[0]] : room.dealerHand
    ) : null;
    const fullDealerValue = room?.dealerHand ? engine.calculateHandValue(room.dealerHand) : null;

    const handleStartGame = async () => {
        if (!roomId || !playerId) return;

        const deck = new Deck(0);
        deck.shuffle();
        const cards = deck.getCards();

        const playerCards = [cards.pop()!, cards.pop()!];
        const dealerCards = [cards.pop()!, cards.pop()!];

        const playerHand = engine.calculateHandValue(playerCards);
        const dealerHand = engine.calculateHandValue(dealerCards);

        let result: string | undefined;
        let dealerHidden = true;

        if (playerHand.isBlackjack && dealerHand.isBlackjack) {
            result = 'push';
            dealerHidden = false;
        } else if (playerHand.isBlackjack) {
            result = 'blackjack';
            dealerHidden = false;
        } else if (dealerHand.isBlackjack) {
            result = 'lose';
            dealerHidden = false;
        }

        await update(ref(db, `blackjack_rooms/${roomId}`), {
            status: result ? 'finished' : 'playing',
            playerHand: playerCards,
            dealerHand: dealerCards,
            dealerHidden,
            deck: cards,
            result: result || null
        });
    };

    const handleHit = async () => {
        if (!room || room.status !== 'playing' || !playerHandValue) return;

        const roomRef = ref(db, `blackjack_rooms/${roomId}`);
        await runTransaction(roomRef, (current) => {
            if (!current || current.status !== 'playing') return current;

            const newCard = current.deck.pop();
            const newPlayerHand = [...current.playerHand, newCard];
            const handValue = engine.calculateHandValue(newPlayerHand);

            current.playerHand = newPlayerHand;

            if (handValue.isBusted) {
                current.status = 'finished';
                current.result = 'lose';
                current.dealerHidden = false;
            }

            return current;
        });
    };

    const handleStand = async () => {
        if (!room || room.status !== 'playing') return;

        const roomRef = ref(db, `blackjack_rooms/${roomId}`);
        await runTransaction(roomRef, (current) => {
            if (!current || current.status !== 'playing') return current;

            let dealerCards = [...current.dealerHand];
            let dealerHand = engine.calculateHandValue(dealerCards);

            while (dealerHand.value < 17) {
                const newCard = current.deck.pop();
                dealerCards.push(newCard);
                dealerHand = engine.calculateHandValue(dealerCards);
            }

            current.dealerHand = dealerCards;
            current.dealerHidden = false;

            const playerHand = engine.calculateHandValue(current.playerHand);
            current.result = engine.determineResult(playerHand, dealerHand);
            current.status = 'finished';

            return current;
        });
    };

    const handleDouble = async () => {
        if (!room || room.status !== 'playing' || !playerHandValue || room.playerHand.length !== 2) return;

        const roomRef = ref(db, `blackjack_rooms/${roomId}`);
        await runTransaction(roomRef, (current) => {
            if (!current || current.status !== 'playing') return current;

            const newCard = current.deck.pop();
            const newPlayerHand = [...current.playerHand, newCard];
            const playerHand = engine.calculateHandValue(newPlayerHand);
            current.playerHand = newPlayerHand;

            if (playerHand.isBusted) {
                current.status = 'finished';
                current.result = 'lose';
                current.dealerHidden = false;
                return current;
            }

            let dealerCards = [...current.dealerHand];
            let dealerHand = engine.calculateHandValue(dealerCards);

            while (dealerHand.value < 17) {
                const newDealerCard = current.deck.pop();
                dealerCards.push(newDealerCard);
                dealerHand = engine.calculateHandValue(dealerCards);
            }

            current.dealerHand = dealerCards;
            current.dealerHidden = false;
            current.result = engine.determineResult(playerHand, dealerHand);
            current.status = 'finished';

            return current;
        });
    };

    const handleLeaveRoom = async () => {
        if (!roomId) return;
        await remove(ref(db, `blackjack_rooms/${roomId}`));
        onExit();
    };

    if (authLoading) {
        return <div className={styles.loading}>読み込み中...</div>;
    }

    if (!user) {
        return (
            <main className={styles.main} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <IconCards size={64} color="#2b6cb0" />
                    <h1 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>ブラックジャック</h1>
                    <p style={{ color: '#718096', marginBottom: '1.5rem' }}>プレイするにはログインが必要です</p>
                    <button
                        onClick={signInWithGoogle}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            background: '#3182ce',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 600
                        }}
                    >
                        Googleでログイン
                    </button>
                </div>
            </main>
        );
    }

    if (!room) {
        return <div className={styles.loading}>読み込み中...</div>;
    }

    if (room.status === 'waiting' || !room.playerHand) {
        return (
            <main className={styles.main}>
                <div className={styles.lobbyContainer}>
                    <h1 className={styles.title}>ブラックジャック</h1>
                    <button onClick={handleStartGame} className={styles.startBtn}>
                        ゲーム開始
                    </button>
                    <button onClick={handleLeaveRoom} className={styles.leaveBtn}>
                        退出する
                    </button>
                </div>
            </main>
        );
    }

    const canHit = room.status === 'playing' && playerHandValue && !playerHandValue.isBusted && playerHandValue.value < 21;
    const canDouble = room.status === 'playing' && room.playerHand.length === 2;

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <button onClick={handleLeaveRoom} className={styles.backButton}>
                    <IconBack size={20} /> 終了
                </button>
                <div className={styles.gameInfo}>ブラックジャック</div>
            </div>

            <div className={styles.tableContainer}>
                {/* Dealer Area */}
                <div className={styles.dealerArea}>
                    <div className={styles.areaLabel}>ディーラー</div>
                    <div className={styles.cardsRow}>
                        {room.dealerHand.map((card, i) => (
                            <div key={i} className={styles.cardWrapper}>
                                <Card
                                    card={card}
                                    isBack={room.dealerHidden && i === 1}
                                    width={70}
                                />
                            </div>
                        ))}
                    </div>
                    <div className={styles.handValue}>
                        {room.dealerHidden
                            ? `${dealerHandValue?.value || 0}+?`
                            : fullDealerValue?.value || 0
                        }
                    </div>
                </div>

                {/* Result */}
                {room.result && (
                    <div className={`${styles.resultBanner} ${styles[room.result]}`}>
                        {room.result === 'win' && '勝利！'}
                        {room.result === 'lose' && '敗北...'}
                        {room.result === 'push' && '引き分け'}
                        {room.result === 'blackjack' && 'ブラックジャック！'}
                    </div>
                )}

                {/* Player Area */}
                <div className={styles.playerArea}>
                    <div className={styles.areaLabel}>あなた</div>
                    <div className={styles.cardsRow}>
                        {room.playerHand.map((card, i) => (
                            <div key={i} className={styles.cardWrapper}>
                                <Card card={card} width={70} />
                            </div>
                        ))}
                    </div>
                    <div className={styles.handValue}>
                        {playerHandValue?.value || 0}
                        {playerHandValue?.isBusted && ' (バースト)'}
                    </div>
                </div>
            </div>

            <div className={styles.controls}>
                {room.status === 'playing' ? (
                    <>
                        <button
                            onClick={handleHit}
                            className={`${styles.actionBtn} ${styles.hitBtn}`}
                            disabled={!canHit}
                        >
                            ヒット
                        </button>
                        <button
                            onClick={handleStand}
                            className={`${styles.actionBtn} ${styles.standBtn}`}
                        >
                            スタンド
                        </button>
                        <button
                            onClick={handleDouble}
                            className={`${styles.actionBtn} ${styles.doubleBtn}`}
                            disabled={!canDouble}
                        >
                            ダブル
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleStartGame}
                        className={`${styles.actionBtn} ${styles.newGameBtn}`}
                    >
                        もう一度
                    </button>
                )}
            </div>
        </main>
    );
}
