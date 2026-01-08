'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import dynamic from 'next/dynamic';
import HideChatBot from '@/components/HideChatBot';

const CARD_GAME_THEME = {
    '--theme-primary': '#e11d48',
    '--theme-secondary': '#be123c',
    '--theme-tertiary': '#f43f5e',
    '--theme-bg-light': '#fff1f2',
    '--theme-text-title': 'linear-gradient(135deg, #be123c 0%, #e11d48 50%, #f43f5e 100%)',
} as React.CSSProperties;

// Dynamically import ColyseusCardGame with SSR disabled to prevent server-side issues with colyseus.js
const ColyseusCardGame = dynamic(
    () => import('./ColyseusCardGame').then(mod => mod.ColyseusCardGame),
    { ssr: false, loading: () => <div>Loading Multiplayer...</div> }
);

// Simple WebSocket client for demo purposes
// In production, use a library like Socket.io or Pusher
let ws: WebSocket | null = null;

function CardGameContent() {
    const searchParams = useSearchParams();
    const router = useRouter(); // Import useRouter
    const { user, loading: authLoading } = useAuth();

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    const mode = searchParams.get('mode') || 'local'; // 'local', 'cpu', 'random', 'room'
    const deckId = searchParams.get('deck') || 'warrior_starter';
    const deckType = searchParams.get('deckType') || 'starter';
    const avatarId = searchParams.get('avatar') || 'warrior_god';
    const roomId = searchParams.get('roomId'); // Standardized param name
    const create = searchParams.get('create') === 'true';

    // Determine Player ID
    const paramPlayerId = searchParams.get('playerId');
    const [playerId, setPlayerId] = useState(paramPlayerId || (typeof window !== 'undefined' ? localStorage.getItem('playerId') || `player-${Math.random().toString(36).substr(2, 9)}` : 'player-1'));

    // Update Player ID when user logs in
    useEffect(() => {
        if (user) setPlayerId(user.uid);
    }, [user]);

    // Persist playerId
    useEffect(() => {
        if (typeof window !== 'undefined' && !user) localStorage.setItem('playerId', playerId);
    }, [playerId, user]);

    // PREPARE DECK (Shared Logic)
    const [myDeck, setMyDeck] = useState<string[]>([]);
    const [deckLoaded, setDeckLoaded] = useState(false);

    useEffect(() => {
        const loadDeck = async () => {
            if (authLoading) return;
            let deck: string[] = [];

            if (deckType === 'starter') {
                deck = STARTER_DECKS[deckId as keyof typeof STARTER_DECKS]?.cards || STARTER_DECKS['warrior_starter'].cards;
            } else {
                // Custom Deck (Logic condensed for brevity, similar to existing)
                if (user) {
                    try {
                        const deckRef = ref(db, `users/${user.uid}/decks/${deckId}`);
                        const snapshot = await get(deckRef);
                        if (snapshot.exists()) deck = snapshot.val().cards || [];
                        else deck = STARTER_DECKS['warrior_starter'].cards;
                    } catch { deck = STARTER_DECKS['warrior_starter'].cards; }
                } else {
                    if (typeof window !== 'undefined') {
                        const saved = localStorage.getItem(deckId);
                        if (saved) {
                            try { deck = JSON.parse(saved).cards || []; } catch { }
                        }
                    }
                    if (deck.length === 0) deck = STARTER_DECKS['warrior_starter'].cards;
                }
            }
            setMyDeck(deck);
            setDeckLoaded(true);
        };
        loadDeck();
    }, [deckId, deckType, user, authLoading]);


    // Move hooks to top level
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isMultiplayer, setIsMultiplayer] = useState(false); // Force false for local/cpu

    // Determine Player Name
    const [localPlayerName, setLocalPlayerName] = useState('Player');
    useEffect(() => {
        const fetchProfileName = async () => {
            if (typeof window !== 'undefined') {
                const storedName = localStorage.getItem('card_game_player_name');
                if (storedName) setLocalPlayerName(storedName);
            }

            if (user) {
                try {
                    const usersModule = await import('@/lib/firebase/users');
                    const profile = await usersModule.getUserProfile(user.uid);
                    if (profile && profile.displayName) {
                        setLocalPlayerName(profile.displayName);
                        // Optional: Sync back to local storage
                        localStorage.setItem('card_game_player_name', profile.displayName);
                    } else if (user.displayName) {
                        setLocalPlayerName(user.displayName);
                    }
                } catch (e) {
                    console.error("Failed to fetch profile name:", e);
                    if (user.displayName) setLocalPlayerName(user.displayName);
                }
            }
        };
        fetchProfileName();
    }, [user]);

    // Initialize Game (Local/CPU)
    useEffect(() => {
        if (!deckLoaded) return;
        // Skip if multiplayer mode
        if (mode === 'random' || mode === 'room' || mode === 'ranked' || mode === 'casual') return;

        const initGame = async () => {
            // Randomly select a guardian god for CPU
            const CPU_GUARDIANS = [
                { avatarId: 'warrior_god', deckKey: 'warrior_starter', name: '戦神アレス' },
                { avatarId: 'mage_god', deckKey: 'mage_starter', name: '魔神オーディン' },
                { avatarId: 'trickster_god', deckKey: 'trickster_starter', name: '道化神ロキ' }
            ];
            const randomGuardian = CPU_GUARDIANS[Math.floor(Math.random() * CPU_GUARDIANS.length)];

            // Get corresponding starter deck
            let cpuDeck = STARTER_DECKS?.[randomGuardian.deckKey as keyof typeof STARTER_DECKS]?.cards;

            // Fallback deck if starter deck not found
            const FALLBACK_CPU_DECK = [
                'w001', 'w001', 'w002', 'w002', 'w003', 'w003',
                'm001', 'm001', 'm002', 'm002',
                'a001', 'a001', 'a006', 'a006',
                'i001', 'i001', 'i002', 'i003', 'i003',
                'e001', 'e001', 'e002', 'e002'
            ];

            if (!cpuDeck || cpuDeck.length === 0) cpuDeck = FALLBACK_CPU_DECK;

            const initial = createInitialState(
                roomId || 'local-room',
                { id: playerId, name: localPlayerName, avatarId: avatarId, deck: myDeck },
                { id: 'cpu', name: randomGuardian.name, avatarId: randomGuardian.avatarId, deck: cpuDeck }
            );
            setGameState(initial);
        };
        initGame();
    }, [mode, playerId, avatarId, user, authLoading, deckLoaded, myDeck, roomId, localPlayerName]);

    // WebSocket Sync (Mock)
    const syncGameState = (roomId: string | null, newState: GameState) => {
        const finalRoomId = roomId || 'local-room';
        // In real app, send newState to server
        console.log('Syncing state:', newState, 'to', finalRoomId);
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
                if (isMultiplayer) syncGameState(roomId || 'local-room', newState);
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

        if (isMultiplayer) syncGameState(roomId || 'local-room', newState);
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


    // RENDER COLYSEUS GAME FOR MULTIPLAYER
    if (authLoading || !user) return <div>Loading...</div>;

    // Check mode and decide what to render
    const isOnlineMode = mode === 'random' || mode === 'room' || mode === 'ranked' || mode === 'casual';

    if (isOnlineMode) {
        if (!deckLoaded) return <div>Loading Deck...</div>;

        return (
            <div className={styles.main} style={CARD_GAME_THEME}>
                <HideChatBot />
                <ColyseusCardGame
                    roomId={roomId || undefined}
                    options={{ create, mode }} // Pass mode to server if needed for matchmaking? 
                    // Actually Colyseus "room" mode logic is usually handled by `joinById` vs `create`.
                    // For "random", we use `joinOrCreate`.
                    // My `ColyseusCardGame` handles `roomId` vs `options.create`.
                    // If mode='random', we pass neither `roomId` nor `create:true` (or create:false), so it does `joinOrCreate`.
                    playerId={playerId}
                    playerName={user?.displayName || 'Player'}
                    avatarId={avatarId}
                    deck={myDeck}
                    onLeave={() => router.push('/card-game/lobby')}
                />
            </div>
        );
    }

    // Local/CPU Game Render
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
        <div className={styles.main} style={CARD_GAME_THEME}>
            <HideChatBot />
            <GameBoard
                gameState={gameState}
                myPlayerId={playerId}
                onPlayCard={handlePlayCard}
                onEndTurn={handleEndTurn}
                onUseUltimate={handleUseUltimate}
                onManaCharge={handleToggleManaCharge}
                onExecuteCharge={handleExecuteManaCharge}
                onCancelCharge={handleCancelManaCharge}
                onSurrender={() => {
                    if (confirm('本当にあきらめますか？')) {
                        const endedState: GameState = {
                            ...gameState,
                            winner: 'opponent',
                            phase: 'end'
                        };
                        setGameState(endedState);
                    }
                }}
            />
            {gameState && gameState.phase === 'end' && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '16px',
                        textAlign: 'center',
                        maxWidth: '400px',
                        width: '90%',
                        color: '#1e293b'
                    }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            {gameState.winner === playerId ? 'YOU WIN!' : 'LOSE...'}
                        </h2>
                        <button
                            onClick={() => router.push('/card-game/lobby')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '1rem'
                            }}
                        >
                            ホームへ
                        </button>
                    </div>
                </div>
            )}
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
