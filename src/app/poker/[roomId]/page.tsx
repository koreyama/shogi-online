'use client';

export const runtime = 'edge';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import { db } from '@/lib/firebase';
import { ref, onValue, update, set, runTransaction, onDisconnect, remove } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';
import { TrumpRoom, Card } from '@/lib/trump/types';
import { PokerGameState, PokerPlayer, PokerPhase } from '@/lib/poker/types';
import { PokerTable } from '@/components/poker/PokerTable';
import { Deck } from '@/lib/trump/deck';
import { PokerEngine } from '@/lib/poker/engine';
import { PokerAI } from '@/lib/poker/ai';
import { IconBack, IconUser, IconCards } from '@/components/Icons';
// import confetti from 'canvas-confetti';

export default function PokerGamePage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;
    const { user, signInWithGoogle, loading: authLoading } = useAuth();
    const playerId = user?.uid || '';
    const playerName = user?.displayName || 'Guest';

    console.log('PokerGamePage rendering', { roomId, authLoading, playerName });

    const [room, setRoom] = useState<TrumpRoom | null>(null);
    const [gameState, setGameState] = useState<PokerGameState | null>(null);
    const [engine] = useState(() => new PokerEngine());
    const [ai] = useState(() => new PokerAI());
    const lastProcessedStateRef = useRef<string>("");

    // Game constants
    const SMALL_BLIND = 10;
    const BIG_BLIND = 20;
    const STARTING_CHIPS = 1000;

    useEffect(() => {
        if (!roomId) return;
        console.log('PokerGamePage: Setting up listener for room', roomId);

        const roomRef = ref(db, `poker_rooms/${roomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            console.log('PokerGamePage: Room data received', data);
            if (data) {
                setRoom(data);
                if (data.gameState) {
                    setGameState({
                        ...data.gameState,
                        communityCards: data.gameState.communityCards || []
                    });
                }
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    // Join room logic
    useEffect(() => {
        if (user && roomId && playerName && playerId) {
            const playerRef = ref(db, `poker_rooms/${roomId}/players/${playerId}`);
            onDisconnect(playerRef).remove();

            if (room && !room.players?.[playerId] && room.status === 'waiting') {
                if (Object.keys(room.players || {}).length < 4) {
                    set(playerRef, {
                        id: playerId,
                        name: playerName,
                        role: 'guest',
                        isReady: false,
                        chips: STARTING_CHIPS,
                        isAi: false
                    });
                }
            }
        }
    }, [user, roomId, playerName, playerId, room]);

    // AI Turn Logic
    useEffect(() => {
        if (!gameState || room?.status !== 'playing' || !playerId) return;

        const currentTurnPlayerId = gameState.turnPlayerId;
        const currentPlayer = gameState.players[currentTurnPlayerId];

        // Host manages AI
        if (currentPlayer?.isAi && room.hostId === playerId) {
            const stateSignature = `${currentTurnPlayerId}-${gameState.phase}-${gameState.currentBet}`;
            if (lastProcessedStateRef.current === stateSignature) return;
            lastProcessedStateRef.current = stateSignature;

            setTimeout(async () => {
                const action = ai.decideAction(gameState, currentTurnPlayerId);
                await executeAction(currentTurnPlayerId, action.type, action.amount);
            }, 1000);
        }
    }, [gameState, room, playerId, ai]);

    const handleStartGame = async () => {
        if (!room || !playerId) return;

        const deck = new Deck(0); // No jokers
        deck.shuffle();

        // Get current players - use gameState if available (for new rounds), otherwise room.players
        const currentPlayers = gameState?.players || room.players;
        const playerIds = Object.keys(currentPlayers);

        if (playerIds.length < 2) {
            console.error('Not enough players to start game');
            return;
        }

        const players: Record<string, PokerPlayer> = {};

        // Deal 2 cards to each player
        const hands: Card[][] = Array.from({ length: playerIds.length }, () => []);
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < playerIds.length; j++) {
                const card = deck.draw();
                if (card) hands[j].push(card);
            }
        }

        // Rotate dealer for new game
        let dealerIndex = 0;
        if (gameState?.dealerId) {
            const prevDealerIndex = playerIds.indexOf(gameState.dealerId);
            dealerIndex = (prevDealerIndex + 1) % playerIds.length;
        }

        const sbIndex = playerIds.length === 2 ? dealerIndex : (dealerIndex + 1) % playerIds.length;
        const bbIndex = playerIds.length === 2 ? (dealerIndex + 1) % playerIds.length : (dealerIndex + 2) % playerIds.length;

        playerIds.forEach((pid, i) => {
            const existingPlayer = currentPlayers[pid];
            // Preserve chips from previous game, or use starting chips
            const prevChips = (gameState?.players[pid]?.chips) || STARTING_CHIPS;

            players[pid] = {
                id: pid,
                name: existingPlayer.name || `Player ${i + 1}`,
                hand: hands[i],
                chips: prevChips > 0 ? prevChips : STARTING_CHIPS, // Reset if busted
                currentBet: 0,
                isActive: true,
                isAllIn: false,
                isDealer: i === dealerIndex,
                isSmallBlind: i === sbIndex,
                isBigBlind: i === bbIndex,
                role: 'player',
                isAi: existingPlayer.isAi || false,
                hasActedThisRound: false,
                lastAction: null
            } as PokerPlayer;
        });

        // Blinds
        const sbPlayer = Object.values(players).find(p => p.isSmallBlind);
        const bbPlayer = Object.values(players).find(p => p.isBigBlind);

        if (sbPlayer) {
            sbPlayer.chips -= SMALL_BLIND;
            sbPlayer.currentBet = SMALL_BLIND;
        }
        if (bbPlayer) {
            bbPlayer.chips -= BIG_BLIND;
            bbPlayer.currentBet = BIG_BLIND;
        }

        // Preflop: First to act
        let turnIndex = 0;
        if (playerIds.length === 2) {
            turnIndex = dealerIndex; // Dealer/SB acts first heads up
        } else {
            turnIndex = (bbIndex + 1) % playerIds.length;
        }

        const bbPlayerId = playerIds[bbIndex];

        const initialState: PokerGameState = {
            pot: SMALL_BLIND + BIG_BLIND,
            communityCards: [],
            deck: deck.getCards(),
            players,
            turnPlayerId: playerIds[turnIndex],
            dealerId: playerIds[dealerIndex],
            smallBlindAmount: SMALL_BLIND,
            bigBlindAmount: BIG_BLIND,
            currentBet: BIG_BLIND,
            phase: 'preflop',
            winners: [],
            history: ['Game Started'],
            lastAggressorId: bbPlayerId
        };

        console.log('Starting game with state:', initialState);

        await update(ref(db, `poker_rooms/${roomId}`), {
            status: 'playing',
            gameState: initialState
        });
    };

    const executeAction = async (actorId: string, type: 'fold' | 'check' | 'call' | 'raise' | 'allin', amount?: number) => {
        const roomRef = ref(db, `poker_rooms/${roomId}`);
        await runTransaction(roomRef, (currentRoom) => {
            if (!currentRoom || !currentRoom.gameState) return;
            const state = currentRoom.gameState as PokerGameState;

            if (state.turnPlayerId !== actorId) return;
            if (state.phase === 'showdown') return;

            const player = state.players[actorId];
            const callAmount = state.currentBet - player.currentBet;

            // Mark player as having acted this round
            player.hasActedThisRound = true;

            // Process Action
            if (type === 'fold') {
                player.isActive = false;
                player.lastAction = 'fold';
            } else if (type === 'check') {
                if (callAmount > 0) return; // Invalid check
                player.lastAction = 'check';
            } else if (type === 'call') {
                const amountToCall = Math.min(callAmount, player.chips);
                player.chips -= amountToCall;
                player.currentBet += amountToCall;
                state.pot += amountToCall;
                player.lastAction = 'call';
                if (player.chips === 0) player.isAllIn = true;
            } else if (type === 'raise') {
                let actualRaise = amount || state.bigBlindAmount;
                if (actualRaise < state.bigBlindAmount) actualRaise = state.bigBlindAmount;

                const totalNeeded = state.currentBet + actualRaise - player.currentBet;
                const actualBet = Math.min(totalNeeded, player.chips);

                player.chips -= actualBet;
                player.currentBet += actualBet;
                state.pot += actualBet;
                state.currentBet = player.currentBet;
                player.lastAction = 'raise';
                if (player.chips === 0) player.isAllIn = true;

                // On raise, set as last aggressor and reset hasActedThisRound for others
                state.lastAggressorId = actorId;
                Object.values(state.players).forEach(p => {
                    if (p.id !== actorId && p.isActive && !p.isAllIn) {
                        p.hasActedThisRound = false;
                    }
                });
            }

            // Find next active non-all-in player
            const playerIds = Object.keys(state.players);
            let currentIndex = playerIds.indexOf(actorId);
            let nextIndex = (currentIndex + 1) % playerIds.length;
            let loopCount = 0;

            while (loopCount < playerIds.length) {
                const nextPlayer = state.players[playerIds[nextIndex]];
                if (nextPlayer.isActive && !nextPlayer.isAllIn) {
                    break;
                }
                nextIndex = (nextIndex + 1) % playerIds.length;
                loopCount++;
            }

            // Check for game end conditions
            const activeCount = Object.values(state.players).filter(p => p.isActive).length;

            if (activeCount === 1) {
                // Only one player left - they win
                state.phase = 'showdown';
                const winnerId = Object.values(state.players).find(p => p.isActive)?.id;
                state.winners = winnerId ? [winnerId] : [];
            } else if (activeCount <= 1 || loopCount >= playerIds.length) {
                // Everyone is all-in or folded - go to showdown
                advanceToShowdown(state);
            } else {
                // Check if betting round is complete
                const activePlayers = Object.values(state.players).filter(p => p.isActive && !p.isAllIn);
                const allMatched = activePlayers.every(p => p.currentBet === state.currentBet);
                const allActed = activePlayers.every(p => p.hasActedThisRound);

                // Special case: Preflop BB option
                const isBBOption = state.phase === 'preflop'
                    && actorId !== state.lastAggressorId
                    && state.players[state.lastAggressorId || '']?.isBigBlind
                    && !state.players[state.lastAggressorId || '']?.hasActedThisRound;

                if (allMatched && allActed && !isBBOption) {
                    // Betting round complete - advance phase
                    if (!state.deck) {
                        state.deck = new Deck(0).getCards();
                    } else if (!Array.isArray(state.deck)) {
                        state.deck = Object.values(state.deck);
                    }
                    nextPhase(state, state.deck);
                } else {
                    // Continue betting round
                    state.turnPlayerId = playerIds[nextIndex];
                }
            }

            return currentRoom;
        });
    };

    const advanceToShowdown = (state: PokerGameState) => {
        // Deal remaining community cards and go to showdown
        if (!state.deck) state.deck = [];
        if (!Array.isArray(state.deck)) state.deck = Object.values(state.deck);

        if (!state.communityCards) state.communityCards = [];
        if (!Array.isArray(state.communityCards)) state.communityCards = Object.values(state.communityCards);

        const draw = (): Card => {
            if (state.deck.length > 0) {
                return state.deck.pop()!;
            }
            return { suit: 'spade', rank: 'A' } as Card;
        };

        while (state.communityCards.length < 5) {
            draw(); // burn
            state.communityCards.push(draw());
        }

        state.phase = 'showdown';
        state.winners = engine.determineWinners(Object.values(state.players), state.communityCards);
    };

    const nextPhase = (state: PokerGameState, deck: any[]) => {
        // Reset bets and hasActedThisRound for all players
        Object.values(state.players).forEach(p => {
            p.currentBet = 0;
            p.hasActedThisRound = false;
            p.lastAction = null;
        });
        state.currentBet = 0;
        state.lastAggressorId = null; // No aggressor in new round

        if (!state.communityCards) {
            state.communityCards = [];
        } else if (!Array.isArray(state.communityCards)) {
            state.communityCards = Object.values(state.communityCards);
        }

        const draw = (): Card => {
            if (!deck || deck.length === 0) {
                console.error('Deck empty during draw');
                return { suit: 'spade', rank: 'A' } as Card;
            }
            return deck.pop()!;
        };

        if (state.phase === 'preflop') {
            state.phase = 'flop';
            draw(); // burn
            state.communityCards.push(draw(), draw(), draw());
        } else if (state.phase === 'flop') {
            state.phase = 'turn';
            draw();
            state.communityCards.push(draw());
        } else if (state.phase === 'turn') {
            state.phase = 'river';
            draw();
            state.communityCards.push(draw());
        } else if (state.phase === 'river') {
            state.phase = 'showdown';
            state.winners = engine.determineWinners(Object.values(state.players), state.communityCards);
            return; // Don't set turn if showdown
        }

        // Set turn to first active player left of dealer
        const playerIds = Object.keys(state.players);
        const dealerIndex = playerIds.findIndex(pid => state.players[pid].isDealer);
        let nextIndex = (dealerIndex + 1) % playerIds.length;
        let loopCount = 0;
        while (loopCount < playerIds.length) {
            const nextPlayer = state.players[playerIds[nextIndex]];
            if (nextPlayer.isActive && !nextPlayer.isAllIn) {
                break;
            }
            nextIndex = (nextIndex + 1) % playerIds.length;
            loopCount++;
        }
        state.turnPlayerId = playerIds[nextIndex];
    };

    const handleAddAi = async () => {
        if (!room || !playerId) return;
        if (room.hostId !== playerId) return;
        if (Object.keys(room.players).length >= 4) return;

        const aiId = `ai-${Date.now()}`;
        const aiName = `CPU ${Object.keys(room.players).length}`;

        await update(ref(db, `poker_rooms/${roomId}/players/${aiId}`), {
            id: aiId,
            name: aiName,
            role: 'guest',
            isReady: true,
            isAi: true
        });
    };

    const handleLeaveRoom = async () => {
        router.push('/trump');
    };

    if (authLoading) return <div className={styles.loading}>読み込み中...</div>;

    if (!user) {
        return (
            <main className={styles.main} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <IconCards size={64} color="#2b6cb0" />
                    <h1 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>ポーカー</h1>
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

    if (!room) return <div className={styles.loading}>読み込み中...</div>;

    if (room.status === 'waiting') {
        // Reusing lobby UI from trump page (simplified)
        return (
            <main className={styles.main}>
                <div className={styles.lobbyContainer}>
                    <h1>ポーカー待機中...</h1>
                    <div className={styles.playersList}>
                        {Object.values(room.players).map(p => (
                            <div key={p.id}>{p.name} {p.isAi ? '(CPU)' : ''}</div>
                        ))}
                    </div>
                    <div className={styles.controls}>
                        {room.hostId === playerId && (
                            <>
                                <button onClick={handleAddAi} className={styles.actionBtn}>CPU追加</button>
                                <button onClick={handleStartGame} className={styles.startBtn}>ゲーム開始</button>
                            </>
                        )}
                        <button onClick={handleLeaveRoom} className={styles.leaveBtn}>退出</button>
                    </div>
                </div>
            </main>
        );
    }

    const isMyTurn = gameState?.turnPlayerId === playerId;
    const myPlayer = gameState?.players[playerId || ''];
    const callAmount = (gameState?.currentBet || 0) - (myPlayer?.currentBet || 0);
    const isShowdown = gameState?.phase === 'showdown';
    const isHost = room.hostId === playerId;

    return (
        <main className={styles.main}>
            <div className={styles.gameHeader}>
                <button onClick={handleLeaveRoom} className={styles.backButton}><IconBack size={20} /> 終了</button>
            </div>

            <div className={styles.tableContainer}>
                {gameState && (
                    <PokerTable
                        gameState={gameState}
                        myId={playerId || ''}
                        onNewGame={isHost ? handleStartGame : undefined}
                    />
                )}
            </div>

            {!isShowdown && (
                <div className={styles.actionControls}>
                    {isMyTurn && (
                        <>
                            <button onClick={() => executeAction(playerId!, 'fold')} className={`${styles.actionBtn} ${styles.foldBtn}`}>Fold</button>
                            <button onClick={() => executeAction(playerId!, callAmount === 0 ? 'check' : 'call')} className={`${styles.actionBtn} ${styles.checkBtn}`}>
                                {callAmount === 0 ? 'Check' : `Call $${callAmount}`}
                            </button>
                            <button onClick={() => executeAction(playerId!, 'raise')} className={`${styles.actionBtn} ${styles.raiseBtn}`}>Raise</button>
                        </>
                    )}
                </div>
            )}
        </main>
    );
}
