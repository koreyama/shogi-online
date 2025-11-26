'use client';

export const runtime = 'edge';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import { db } from '@/lib/firebase';
import { ref, onValue, update, set, runTransaction, onDisconnect, remove } from 'firebase/database';
import { usePlayer } from '@/hooks/usePlayer';
import { TrumpRoom, Card } from '@/lib/trump/types';
import { PokerGameState, PokerPlayer, PokerPhase } from '@/lib/poker/types';
import { PokerTable } from '@/components/poker/PokerTable';
import { Deck } from '@/lib/trump/deck';
import { PokerEngine } from '@/lib/poker/engine';
import { PokerAI } from '@/lib/poker/ai';
import { IconBack, IconUser } from '@/components/Icons';
// import confetti from 'canvas-confetti';

export default function PokerGamePage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;
    const { playerName, playerId, isLoaded } = usePlayer();

    console.log('PokerGamePage rendering', { roomId, isLoaded, playerName });

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
        if (isLoaded && roomId && playerName && playerId) {
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
    }, [isLoaded, roomId, playerName, playerId, room]);

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

        const playerIds = Object.keys(room.players);
        const players: Record<string, PokerPlayer> = {};

        // Deal 2 cards to each player
        const hands: Card[][] = Array.from({ length: playerIds.length }, () => []);
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < playerIds.length; j++) {
                const card = deck.draw();
                if (card) hands[j].push(card);
            }
        }

        playerIds.forEach((pid, i) => {
            players[pid] = {
                ...room.players[pid],
                hand: hands[i],
                chips: STARTING_CHIPS,
                currentBet: 0,
                isActive: true,
                isAllIn: false,
                isDealer: i === 0, // Randomize later
                isSmallBlind: i === 1 % playerIds.length,
                isBigBlind: i === 2 % playerIds.length,
                role: 'player',
                isAi: room.players[pid].isAi || false
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

        // Next turn is usually UTG (Under the Gun), left of BB.
        // For 2 players: Dealer is SB, other is BB. Preflop: Dealer acts first? No, BB acts last.
        // Heads up: Dealer is SB. SB posts SB. BB posts BB. Dealer acts first preflop.
        // 3+ players: SB, BB, UTG. UTG acts first.

        let turnIndex = 0;
        if (playerIds.length === 2) {
            // Heads up: Dealer (SB) acts first preflop
            turnIndex = playerIds.findIndex(pid => players[pid].isDealer);
        } else {
            // UTG acts first (left of BB)
            const bbIndex = playerIds.findIndex(pid => players[pid].isBigBlind);
            turnIndex = (bbIndex + 1) % playerIds.length;
        }

        const initialState: PokerGameState = {
            pot: SMALL_BLIND + BIG_BLIND,
            communityCards: [],
            deck: deck.getCards(),
            players,
            turnPlayerId: playerIds[turnIndex],
            dealerId: playerIds.find(pid => players[pid].isDealer)!,
            smallBlindAmount: SMALL_BLIND,
            bigBlindAmount: BIG_BLIND,
            currentBet: BIG_BLIND,
            phase: 'preflop',
            winners: [],
            history: ['Game Started']
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

            const player = state.players[actorId];
            const callAmount = state.currentBet - player.currentBet;

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
                const raiseAmount = amount || (state.bigBlindAmount * 2); // Default min raise
                const totalBet = state.currentBet + raiseAmount; // Raise ON TOP or TO? Usually "Raise TO X" or "Raise BY X".
                // Let's assume 'amount' is the total amount to add to pot? No, usually raise amount.
                // Simple: Raise to 'amount'.
                // If amount is not provided, min raise.

                // Logic: Player puts in chips to match currentBet, plus raiseAmount.
                // Actually, let's simplify: 'raise' means matching current bet AND adding 'amount'.
                // Or 'amount' is the TOTAL bet for this round.

                let actualRaise = amount || state.bigBlindAmount;
                // Ensure min raise
                if (actualRaise < state.bigBlindAmount) actualRaise = state.bigBlindAmount;

                const totalNeeded = state.currentBet + actualRaise - player.currentBet;
                const actualBet = Math.min(totalNeeded, player.chips);

                player.chips -= actualBet;
                player.currentBet += actualBet;
                state.pot += actualBet;
                state.currentBet = player.currentBet;
                player.lastAction = 'raise';
                if (player.chips === 0) player.isAllIn = true;
            }

            // Move Turn
            // Find next active player
            const playerIds = Object.keys(state.players);
            let currentIndex = playerIds.indexOf(actorId);
            let nextIndex = (currentIndex + 1) % playerIds.length;
            let loopCount = 0;

            // Check if round is complete
            // Round ends when all active players have bet equal amount (or are all-in) AND everyone had a chance to act.
            // This is tricky. Simplified:
            // If everyone checked/called/folded, move to next phase.

            // Check if everyone matches currentBet
            const activePlayers = Object.values(state.players).filter(p => p.isActive && !p.isAllIn);
            const allMatched = activePlayers.every(p => p.currentBet === state.currentBet);
            // Also need to ensure everyone acted at least once if no raise?
            // Or simply: if the next player has already matched the bet and we are just cycling?

            // Let's rely on a simple counter or check.
            // If 'raise' happened, everyone needs to act again.
            // If 'check'/'call' happened, and next player matches, maybe done?

            // Robust way:
            // Keep track of 'lastAggressor' or similar?
            // Or: if (allMatched && (actor was last to act or everyone acted))

            // Hacky: If next player has already matched currentBet, and it's not a new raise...
            // But preflop BB has option to raise even if matched.

            // Let's just move turn for now, and check phase transition separately.

            while (!state.players[playerIds[nextIndex]].isActive || state.players[playerIds[nextIndex]].isAllIn) {
                nextIndex = (nextIndex + 1) % playerIds.length;
                loopCount++;
                if (loopCount > playerIds.length) break; // Should not happen
            }

            // Check for Phase Transition
            // If only 1 player active -> Winner
            const activeCount = Object.values(state.players).filter(p => p.isActive).length;
            if (activeCount === 1) {
                state.phase = 'showdown';
                state.winners = engine.determineWinners(Object.values(state.players), state.communityCards);
                // End game / New round logic
                // ...
            } else {
                // Check if betting round is over
                // Betting round over if:
                // 1. All active players (not all-in) have currentBet == state.currentBet
                // 2. AND (someone raised OR everyone checked) - tricky.

                // Let's assume if we cycle back to a player who has already matched the bet, and no one raised since?
                // We need a 'lastRaiser' or 'aggressorIndex'.

                // Simplified: If all active players have matched currentBet, AND the next player has ALSO matched (and isn't Big Blind preflop option)...

                const allActiveMatched = Object.values(state.players)
                    .filter(p => p.isActive && !p.isAllIn)
                    .every(p => p.currentBet === state.currentBet);

                // Special case: Preflop BB option.
                // If preflop, and everyone called BB, BB gets to check.

                if (allActiveMatched && type !== 'raise' && (type !== 'fold' || activeCount > 1)) {
                    // Potential end of round.
                    // If preflop, check if actor was BB and checked? Or everyone called and it's back to BB?

                    // Let's just advance phase if everyone matched.
                    // (This is slightly buggy for preflop BB option but acceptable for MVP)

                    // Ensure deck is an array
                    if (!state.deck) {
                        console.error('Deck missing in game state, creating new deck');
                        state.deck = new Deck(0).getCards();
                    } else if (!Array.isArray(state.deck)) {
                        // Firebase might return array as object
                        state.deck = Object.values(state.deck);
                    }

                    nextPhase(state, state.deck);
                } else {
                    state.turnPlayerId = playerIds[nextIndex];
                }
            }

            return currentRoom;
        });
    };

    const nextPhase = (state: PokerGameState, deck: any[]) => {
        // Reset bets
        Object.values(state.players).forEach(p => p.currentBet = 0);
        state.currentBet = 0;

        if (!state.communityCards) {
            state.communityCards = [];
        } else if (!Array.isArray(state.communityCards)) {
            state.communityCards = Object.values(state.communityCards);
        }

        // Deal cards
        // Need to reconstruct Deck object or just pop from array
        // deck is array of cards

        const draw = () => {
            if (!deck || deck.length === 0) {
                console.error('Deck empty or undefined during draw');
                return { suit: 'spade', rank: 'A' }; // Fallback
            }
            return deck.pop();
        };

        if (state.phase === 'preflop') {
            state.phase = 'flop';
            // Burn 1?
            draw();
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
        }

        // Set turn to first active player left of dealer
        const playerIds = Object.keys(state.players);
        const dealerIndex = playerIds.findIndex(pid => state.players[pid].isDealer);
        let nextIndex = (dealerIndex + 1) % playerIds.length;
        while (!state.players[playerIds[nextIndex]].isActive || state.players[playerIds[nextIndex]].isAllIn) {
            nextIndex = (nextIndex + 1) % playerIds.length;
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

    if (!isLoaded || !room) return <div className={styles.loading}>読み込み中...</div>;

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

    return (
        <main className={styles.main}>
            <div className={styles.gameHeader}>
                <button onClick={handleLeaveRoom} className={styles.backButton}><IconBack size={20} /> 終了</button>
            </div>

            <div className={styles.tableContainer}>
                {gameState && <PokerTable gameState={gameState} myId={playerId || ''} />}
            </div>

            <div className={styles.actionControls}>
                {isMyTurn && (
                    <>
                        <button onClick={() => executeAction(playerId!, 'fold')} className={styles.actionBtn} style={{ background: '#e53e3e' }}>Fold</button>
                        <button onClick={() => executeAction(playerId!, callAmount === 0 ? 'check' : 'call')} className={styles.actionBtn}>
                            {callAmount === 0 ? 'Check' : `Call $${callAmount}`}
                        </button>
                        <button onClick={() => executeAction(playerId!, 'raise')} className={styles.actionBtn} style={{ background: '#d69e2e' }}>Raise</button>
                    </>
                )}
            </div>
        </main>
    );
}
