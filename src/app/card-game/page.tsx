'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GameBoard } from '@/components/card-game/GameBoard';
import { STARTER_DECKS } from '@/lib/card-game/data/decks';
import {
    createInitialState,
    drawCards,
    playCard,
    endTurn,
    manaCharge,
    useUltimate,
    discardAndDraw,
    toggleManaChargeMode,
    selectCardForCharge
} from '@/lib/card-game/engine';
import { computeAiAction } from '@/lib/card-game/ai';
import { GameState } from '@/lib/card-game/types';
import styles from './page.module.css';
import { useAuth } from '@/hooks/useAuth';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';

// Simple WebSocket client for demo purposes
// In production, use a library like Socket.io or Pusher
let ws: WebSocket | null = null;

function CardGameContent() {
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const mode = searchParams.get('mode') || 'local'; // 'local' or 'multiplayer'
    const deckId = searchParams.get('deck') || 'warrior_starter';
    const deckType = searchParams.get('deckType') || 'starter';
    const avatarId = searchParams.get('avatar') || 'warrior_god';
    const roomId = searchParams.get('room') || 'demo-room';

    // Determine Player ID: Prefer User UID, fallback to params or localStorage
    const paramPlayerId = searchParams.get('player');
    const [playerId, setPlayerId] = useState(paramPlayerId || (typeof window !== 'undefined' ? localStorage.getItem('playerId') || `player-${Math.random().toString(36).substr(2, 9)}` : 'player-1'));

    // Update Player ID when user logs in
    useEffect(() => {
        if (user) {
            setPlayerId(user.uid);
        }
    }, [user]);

    // Persist playerId (only if not user uid to avoid overwriting with temp id)
    useEffect(() => {
        if (typeof window !== 'undefined' && !user) {
            localStorage.setItem('playerId', playerId);
        }
    }, [playerId, user]);

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isMultiplayer, setIsMultiplayer] = useState(mode === 'multiplayer');

    // Initialize Game
    useEffect(() => {
        const initGame = async () => {
            if (authLoading) return; // Wait for auth check

            let myDeck: string[] = [];
            let playerName = user?.displayName || 'You';

            // Load Deck
            if (deckType === 'starter') {
                myDeck = STARTER_DECKS[deckId as keyof typeof STARTER_DECKS]?.cards || STARTER_DECKS['warrior_starter'].cards;
            } else {
                // Custom Deck
                if (user) {
                    // Load from Firebase for logged-in user
                    try {
                        const deckRef = ref(db, `users/${user.uid}/decks/${deckId}`);
                        const snapshot = await get(deckRef);
                        if (snapshot.exists()) {
                            myDeck = snapshot.val().cards || [];
                        } else {
                            console.warn("Deck not found in Firebase, falling back to starter");
                            myDeck = STARTER_DECKS['warrior_starter'].cards;
                        }
                    } catch (e) {
                        console.error("Error fetching deck from Firebase", e);
                        myDeck = STARTER_DECKS['warrior_starter'].cards;
                    }
                } else {
                    // Load from LocalStorage for guest
                    if (typeof window !== 'undefined') {
                        const savedDeck = localStorage.getItem(deckId);
                        if (savedDeck) {
                            try {
                                const parsed = JSON.parse(savedDeck);
                                myDeck = parsed.cards || [];
                            } catch (e) {
                                console.error('Failed to parse deck', e);
                            }
                        }
                    }
                    if (myDeck.length === 0) myDeck = STARTER_DECKS['warrior_starter'].cards;
                }
            }

            if (mode === 'local' || mode === 'cpu') {
                // Use Trickster deck for Trickster CPU
                const cpuDeckKey = 'trickster_starter';

                // Robust Fallback: Hardcoded Trickster Deck
                const FALLBACK_CPU_DECK = [
                    'w025', 'w025', 'w025', // Combo Dagger
                    'm035', 'm035', // Chain Lightning
                    'm036', // Finishing Move
                    'w005', 'w005', // Dagger
                    'w014', // Gale Dagger
                    'w021', // Ninja Sword
                    'm025', // Gamble
                    'm022', // Haste
                    'm038', 'm038', // Regen Slime
                    'm032', // Necromancy
                    'm033', // Soul Burst
                    'm039', // Offering to Dead
                    'm023', // Blood Ritual
                    'm024', // Lifesteal
                    'w020', // Vampire Sword
                    'i005', // Smoke Bomb
                    'i010', // Bomb
                    't001', // Counter Stance
                    't003', // Explosive Rune
                    'e005', // Gale Boots
                    'e006', // Poison Enchant
                    'i003', 'i003', // Mana Water
                    'a013'  // Phantom Cloak
                ];

                let cpuDeck = STARTER_DECKS?.[cpuDeckKey]?.cards;

                if (!cpuDeck || cpuDeck.length === 0) {
                    console.warn('STARTER_DECKS failed. Using hardcoded fallback deck for CPU.');
                    cpuDeck = FALLBACK_CPU_DECK;
                }

                const initial = createInitialState(
                    'local-room',
                    { id: playerId, name: playerName, avatarId: avatarId, deck: myDeck },
                    { id: 'cpu', name: 'CPU', avatarId: 'trickster_god', deck: cpuDeck }
                );
                setGameState(initial);
            } else {
                // Multiplayer setup (simplified)
                const initial = createInitialState(
                    roomId,
                    { id: playerId, name: playerName, avatarId: avatarId, deck: myDeck },
                    { id: 'opponent', name: 'Player 2', avatarId: 'mage_god', deck: [] }
                );
                setGameState(initial);
            }
        };

        initGame();
    }, [mode, playerId, roomId, deckId, deckType, avatarId, user, authLoading]);

    // WebSocket Sync (Mock)
    const syncGameState = (roomId: string, newState: GameState) => {
        // In real app, send newState to server
        console.log('Syncing state:', newState);
    };

    const handleEndTurn = () => {
        if (!gameState) return;

        if (isMultiplayer && gameState.turnPlayerId !== playerId) {
            alert('相手のターンです');
            return;
        }

        let newState = endTurn(gameState);
        setGameState(newState);

        if (isMultiplayer) {
            syncGameState(roomId, newState);
        } else {
            // CPU Turn (Basic AI)
            const executeCpuTurn = async () => {
                // Wait a bit before starting
                await new Promise(r => setTimeout(r, 1000));

                let aiState = newState;
                let turnActive = true;

                let actionCount = 0;
                const MAX_ACTIONS = 10;

                while (turnActive && actionCount < MAX_ACTIONS) {
                    actionCount++;
                    const action = computeAiAction(aiState, 'cpu');

                    if (action.type === 'END_TURN') {
                        turnActive = false;
                        // End CPU turn
                        const finalState = endTurn(aiState);
                        setGameState(finalState);
                    } else if (action.type === 'PLAY_CARD') {
                        // Play Card
                        const prevState = aiState;
                        aiState = playCard(aiState, 'cpu', action.cardId, action.targetId);

                        // Check if state actually changed (prevent infinite loop if card play fails)
                        if (JSON.stringify(prevState) === JSON.stringify(aiState)) {
                            console.warn('AI attempted invalid move, forcing turn end.');
                            turnActive = false;
                            const finalState = endTurn(aiState);
                            setGameState(finalState);
                            break;
                        }

                        setGameState(aiState);
                        // Wait between actions
                        await new Promise(r => setTimeout(r, 1500));
                    } else if (action.type === 'MANA_CHARGE') {
                        // Mana Charge (Not implemented in basic AI yet, but ready)
                        aiState = manaCharge(aiState, 'cpu', action.cardIndices);
                        setGameState(aiState);
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }

                if (actionCount >= MAX_ACTIONS) {
                    console.warn('AI action limit reached, forcing turn end.');
                    const finalState = endTurn(aiState);
                    setGameState(finalState);
                }
            };
            executeCpuTurn();
        }
    };

    const handlePlayCard = (cardId: string, targetId?: string, handIndex?: number) => {
        if (!gameState) return;
        if (isMultiplayer && gameState.turnPlayerId !== playerId) {
            alert('相手のターンです');
            return;
        }

        const player = gameState.players[playerId];
        if (player.isManaChargeMode) {
            // Select for charge instead of playing
            if (handIndex !== undefined) {
                const newState = selectCardForCharge(gameState, playerId, handIndex);
                setGameState(newState);
                if (isMultiplayer) syncGameState(roomId, newState);
            }
        } else {
            // Normal play
            const newState = playCard(gameState, playerId, cardId, targetId);
            setGameState(newState);
            if (isMultiplayer) syncGameState(roomId, newState);
        }
    };

    const handleDiscard = (cardId: string) => {
        if (!gameState) return;
        if (isMultiplayer && gameState.turnPlayerId !== playerId) return;

        const newState = discardAndDraw(gameState, playerId, cardId);
        setGameState(newState);
        if (isMultiplayer) syncGameState(roomId, newState);
    };

    const handleUseUltimate = () => {
        if (!gameState) return;

        if (isMultiplayer && gameState.turnPlayerId !== playerId) {
            alert('相手のターンです');
            return;
        }

        const newState = useUltimate(gameState, playerId);
        setGameState(newState);

        if (isMultiplayer) {
            syncGameState(roomId, newState);
        }
    };

    const handleToggleManaCharge = () => {
        if (!gameState) return;
        if (isMultiplayer && gameState.turnPlayerId !== playerId) return;

        const newState = toggleManaChargeMode(gameState, playerId);
        setGameState(newState);
        if (isMultiplayer) syncGameState(roomId, newState);
    };

    const handleExecuteManaCharge = () => {
        if (!gameState) return;
        if (isMultiplayer && gameState.turnPlayerId !== playerId) return;

        const player = gameState.players[playerId];
        const selectedIndices = player.selectedForCharge || [];
        if (selectedIndices.length === 0) return;

        const newState = manaCharge(gameState, playerId, selectedIndices);
        setGameState(newState);
        if (isMultiplayer) syncGameState(roomId, newState);
    };

    const handleCancelManaCharge = () => {
        if (!gameState) return;
        // Just toggle off
        const newState = toggleManaChargeMode(gameState, playerId);
        setGameState(newState);
        if (isMultiplayer) syncGameState(roomId, newState);
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
        <div className={styles.main}>
            <GameBoard
                gameState={gameState}
                myPlayerId={playerId}
                onPlayCard={handlePlayCard}
                onEndTurn={handleEndTurn}
                onUseUltimate={handleUseUltimate}
                onManaCharge={handleToggleManaCharge}
                onExecuteCharge={handleExecuteManaCharge}
                onCancelCharge={handleCancelManaCharge}
            />
        </div>
    );
}

export default function CardGamePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CardGameContent />
        </Suspense>
    );
}
