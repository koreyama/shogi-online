'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GameBoard } from '@/components/card-game/GameBoard';
import { GameState } from '@/lib/card-game/types';
import { createInitialState, playCard, endTurn, discardAndDraw } from '@/lib/card-game/engine';
import { STARTER_DECKS } from '@/lib/card-game/data/decks';
import { CARDS } from '@/lib/card-game/data/cards';
import { subscribeToRoom, syncGameState } from '@/lib/card-game/firebase-utils';

export default function CardGamePage() {
    const searchParams = useSearchParams();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerId, setPlayerId] = useState<string>('');
    const [roomId, setRoomId] = useState<string>('');
    const [isMultiplayer, setIsMultiplayer] = useState(false);

    useEffect(() => {
        const mode = searchParams.get('mode');
        const pId = searchParams.get('playerId') || 'p1';
        const rId = searchParams.get('roomId');

        setPlayerId(pId);

        if (mode === 'room' && rId) {
            setIsMultiplayer(true);
            setRoomId(rId);

            // Subscribe to Firebase
            const unsubscribe = subscribeToRoom(rId, (newState) => {
                setGameState(newState);
            });

            return () => unsubscribe();
        } else {
            // Local / Random (CPU) mode
            // For now, random mode just creates a local game against a dummy
            const avatarId = searchParams.get('avatar') || 'warrior_god';
            const deckId = searchParams.get('deck') || 'warrior_starter';
            const deckType = searchParams.get('deckType') || 'starter';

            let deck: string[] = [];
            if (deckType === 'starter' || deckId.includes('starter')) {
                deck = STARTER_DECKS[deckId as keyof typeof STARTER_DECKS]?.cards || STARTER_DECKS['warrior_starter'].cards;
            } else {
                const savedDeck = localStorage.getItem(deckId);
                if (savedDeck) {
                    deck = JSON.parse(savedDeck).cards;
                } else {
                    deck = STARTER_DECKS['warrior_starter'].cards;
                }
            }

            const player1 = {
                id: pId,
                name: localStorage.getItem('card_game_player_name') || 'Player',
                avatarId: avatarId,
                deck: deck
            };

            const player2 = {
                id: 'cpu',
                name: 'CPU',
                avatarId: 'mage_god', // Default CPU avatar
                deck: STARTER_DECKS['mage_starter'].cards
            };

            const initial = createInitialState('local-room', player1, player2);
            setGameState(initial);
        }
    }, [searchParams]);

    const handlePlayCard = (cardId: string) => {
        if (!gameState) return;

        // In multiplayer, only allow move if it's your turn
        if (isMultiplayer && gameState.turnPlayerId !== playerId) {
            alert('相手のターンです');
            return;
        }

        const newState = playCard(gameState, playerId, cardId);
        setGameState(newState);

        if (isMultiplayer) {
            syncGameState(roomId, newState);
        }
    };

    const handleEndTurn = () => {
        if (!gameState) return;

        if (isMultiplayer && gameState.turnPlayerId !== playerId) {
            alert('相手のターンです');
            return;
        }

        const newState = endTurn(gameState);
        setGameState(newState);

        if (isMultiplayer) {
            syncGameState(roomId, newState);
        } else {
            // CPU Turn (Simple AI)
            setTimeout(() => {
                let cpuState = { ...newState };
                const cpuId = 'cpu';
                const cpu = cpuState.players[cpuId];

                // Simple AI: Play first playable card
                // Try to play up to 3 cards
                for (let i = 0; i < 3; i++) {
                    // Check if CPU can play any card
                    const playableCardIndex = cpu.hand.findIndex(cardId => {
                        const card = CARDS[cardId];
                        return cpu.mp >= card.cost;
                    });

                    if (playableCardIndex !== -1) {
                        const cardId = cpu.hand[playableCardIndex];
                        cpuState = playCard(cpuState, cpuId, cardId);
                    } else {
                        break;
                    }
                }

                const finalState = endTurn(cpuState);
                setGameState(finalState);
            }, 1000);
        }
    };

    const handleDiscard = (cardId: string) => {
        if (!gameState) return;

        if (isMultiplayer && gameState.turnPlayerId !== playerId) {
            alert('相手のターンです');
            return;
        }

        const newState = discardAndDraw(gameState, playerId, cardId);
        setGameState(newState);

        if (isMultiplayer) {
            syncGameState(roomId, newState);
        }
    };

    if (!gameState) return <div>Loading...</div>;

    // Waiting for opponent
    if (isMultiplayer && Object.keys(gameState.players).length < 2) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                fontFamily: 'Inter, sans-serif',
                gap: '1rem'
            }}>
                <h2>対戦相手を待っています...</h2>
                <div style={{
                    padding: '1rem 2rem',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '8px',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.1em'
                }}>
                    Room ID: {roomId}
                </div>
                <p>このIDを友達に教えてください</p>
            </div>
        );
    }

    return (
        <GameBoard
            gameState={gameState}
            myPlayerId={playerId}
            onPlayCard={handlePlayCard}
            onDiscardCard={handleDiscard}
            onEndTurn={handleEndTurn}
        />
    );
}
