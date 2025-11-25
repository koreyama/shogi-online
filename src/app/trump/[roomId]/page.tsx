'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import { db } from '@/lib/firebase';
import { ref, onValue, update, set, runTransaction, onDisconnect, remove } from 'firebase/database';
import { usePlayer } from '@/hooks/usePlayer';
import { TrumpRoom, TrumpPlayer, Card as CardType } from '@/lib/trump/types';
import { TrumpTable } from '@/components/trump/TrumpTable';
import { Deck } from '@/lib/trump/deck';
import { DaifugoEngine } from '@/lib/trump/daifugo/engine';
import { DaifugoAI } from '@/lib/trump/daifugo/ai';
import confetti from 'canvas-confetti';
import { IconBack, IconUser } from '@/components/Icons';

// ... (inside component)



export default function TrumpGamePage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;
    const { playerName, playerId, isLoaded } = usePlayer();

    const [room, setRoom] = useState<TrumpRoom | null>(null);
    const [myHand, setMyHand] = useState<CardType[]>([]);
    const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
    const [engine] = useState(() => new DaifugoEngine());
    const [ai] = useState(() => new DaifugoAI());
    const lastProcessedStateRef = useRef<string>("");

    useEffect(() => {
        if (room?.status === 'finished') {
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#FFD700', '#FFA500', '#FF4500']
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#FFD700', '#FFA500', '#FF4500']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [room?.status]);

    useEffect(() => {
        if (!roomId) return;

        const roomRef = ref(db, `trump_rooms/${roomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setRoom(data);
                // Sync hand if game is playing
                if (data.gameState && data.gameState.hands && playerId) {
                    setMyHand(data.gameState.hands[playerId] || []);
                }
            } else {
                // Room might have been deleted
            }
        });

        return () => unsubscribe();
    }, [roomId, router, playerId]);

    // Join room & Presence logic
    useEffect(() => {
        if (isLoaded && roomId && playerName && playerId) {
            const playerRef = ref(db, `trump_rooms/${roomId}/players/${playerId}`);

            // Set disconnect handler to remove player
            onDisconnect(playerRef).remove();

            // Join if not already in (and room exists)
            if (room && !room.players?.[playerId] && room.status === 'waiting') {
                if (Object.keys(room.players || {}).length < 4) {
                    set(playerRef, {
                        id: playerId,
                        name: playerName,
                        role: 'guest',
                        isReady: false
                    });
                }
            }
        }
    }, [isLoaded, roomId, playerName, playerId, room]);

    // AI Turn Logic
    useEffect(() => {
        if (!room || !room.gameState || room.status !== 'playing' || !playerId) return;

        const currentTurnPlayerId = room.gameState.turn;
        const currentPlayer = room.players[currentTurnPlayerId];

        // Check if current turn is AI and I am the host (Host manages AI)
        if (currentPlayer?.isAi && room.hostId === playerId) {
            const stateSignature = `${currentTurnPlayerId}-${room.gameState.field?.length || 0}-${room.gameState.passCount || 0}`;

            if (lastProcessedStateRef.current === stateSignature) return;
            lastProcessedStateRef.current = stateSignature;

            const aiHand = room.gameState.hands[currentTurnPlayerId] || [];
            const isRevolution = room.gameState.isRevolution || false;
            const lastMove = room.gameState.lastMove;

            // Simulate thinking time
            setTimeout(async () => {
                try {
                    const rules = room.rules || {
                        isShibari: false,
                        isSpade3: false,
                        isStaircase: false,
                        is11Back: false
                    };
                    const aiRules = {
                        isShibari: rules.isShibari || false,
                        isSpade3: rules.isSpade3 || false,
                        isStaircase: rules.isStaircase || false,
                        is11Back: rules.is11Back || false
                    };
                    const is11Back = room.gameState?.is11Back || false;
                    const move = ai.computeMove(aiHand, room.gameState?.field || [], isRevolution, is11Back, lastMove || null, aiRules);

                    if (move.length > 0) {
                        // Play cards
                        await executeMove(currentTurnPlayerId, move);
                    } else {
                        // Pass
                        await executePass(currentTurnPlayerId);
                    }
                } catch (error) {
                    console.error("AI processing error:", error);
                }
            }, 1000);
        }
    }, [room, playerId, ai]);

    const executeMove = async (actorId: string, cards: CardType[]) => {
        const roomRef = ref(db, `trump_rooms/${roomId}`);
        await runTransaction(roomRef, (currentRoom) => {
            if (!currentRoom || !currentRoom.gameState) return;
            if (currentRoom.gameState.turn !== actorId) return;

            const gameState = currentRoom.gameState;
            const rules = currentRoom.rules || {};

            // Remove cards
            const playerHand = gameState.hands[actorId] || [];
            const newHand = playerHand.filter((c: CardType) =>
                !cards.some(sc => sc.suit === c.suit && sc.rank === c.rank)
            );
            gameState.hands[actorId] = newHand;

            // Update field
            gameState.field = cards;
            gameState.lastMove = { playerId: actorId, cards: cards };
            gameState.passCount = 0;

            // Check Revolution
            if (cards.length >= 4 && rules.revolution) {
                gameState.isRevolution = !gameState.isRevolution;
            }
            const is8Cut = rules.is8Cut && cards.some(c => c.rank === '8');
            const is11BackTrigger = rules.is11Back && cards.some(c => c.rank === 'J');

            if (is11BackTrigger) {
                gameState.is11Back = true;
            }

            // Check Win (Agari)
            if (newHand.length === 0) {
                gameState.finishedPlayers = gameState.finishedPlayers || [];
                gameState.finishedPlayers.push(actorId);
                gameState.ranks = gameState.ranks || {};

                // Assign rank
                // Simple rank assignment based on finish order
            }

            // Next Turn Logic
            if (is8Cut) {
                // 8-Cut: Field clears, same player goes again
                gameState.field = [];
                gameState.lastMove = null;
                gameState.is11Back = false;

                if (newHand.length === 0) {
                    // If finished with 8-cut, next player starts fresh
                    const nextId = getNextActivePlayer(currentRoom.players, gameState.finishedPlayers, actorId);
                    if (nextId) gameState.turn = nextId;
                    else currentRoom.status = 'finished';
                } else {
                    // Same player continues
                    gameState.turn = actorId;
                }
            } else {
                const nextId = getNextActivePlayer(currentRoom.players, gameState.finishedPlayers, actorId);

                if (nextId) {
                    gameState.turn = nextId;
                } else {
                    currentRoom.status = 'finished';
                }
            }

            return currentRoom;
        });
    };

    const executePass = async (actorId: string) => {
        const roomRef = ref(db, `trump_rooms/${roomId}`);
        await runTransaction(roomRef, (currentRoom) => {
            if (!currentRoom || !currentRoom.gameState) return;
            if (currentRoom.gameState.turn !== actorId) return;

            const gameState = currentRoom.gameState;
            gameState.passCount = (gameState.passCount || 0) + 1;

            // Check if everyone passed
            const allPlayerIds = Object.keys(currentRoom.players);
            const finishedIds = gameState.finishedPlayers || [];
            const activeCount = allPlayerIds.length - finishedIds.length;

            const nextId = getNextActivePlayer(currentRoom.players, finishedIds, actorId);

            if (!nextId) {
                currentRoom.status = 'finished';
                return currentRoom;
            }

            // Check if field should clear
            if (gameState.lastMove && nextId === gameState.lastMove.playerId) {
                gameState.field = [];
                gameState.lastMove = null;
                gameState.passCount = 0;
                gameState.is11Back = false;
                gameState.turn = nextId; // They start fresh
            } else if (gameState.lastMove && finishedIds.includes(gameState.lastMove.playerId)) {
                if (gameState.passCount >= activeCount) {
                    // Everyone active has passed.
                    gameState.field = [];
                    gameState.lastMove = null;
                    gameState.passCount = 0;
                    gameState.is11Back = false;
                    gameState.turn = nextId; // The person who would have been next starts fresh
                } else {
                    gameState.turn = nextId;
                }
            } else {
                gameState.turn = nextId;
            }

            return currentRoom;
        });
    };

    const getNextActivePlayer = (players: any, finished: string[], currentId: string) => {
        const playerIds = Object.keys(players).sort();
        let currentIndex = playerIds.indexOf(currentId);

        for (let i = 1; i < playerIds.length; i++) {
            const idx = (currentIndex + i) % playerIds.length;
            const pid = playerIds[idx];
            if (!finished?.includes(pid)) {
                return pid;
            }
        }
        return null;
    };

    const handleStartGame = async () => {
        if (!room || !playerId) return;
        if (room.hostId !== playerId) return;

        const deck = new Deck();
        deck.shuffle();
        const playerIds = Object.keys(room.players).sort();
        const hands = deck.deal(playerIds.length);

        const handsMap: Record<string, CardType[]> = {};
        playerIds.forEach((pid, index) => {
            handsMap[pid] = hands[index].sort((a, b) => engine.getStrength(a, false) - engine.getStrength(b, false));
        });

        const initialState = {
            turn: playerIds[0],
            deck: [],
            hands: handsMap,
            field: [],
            isRevolution: false,
            is11Back: false,
            scores: {}
        };

        await update(ref(db, `trump_rooms/${roomId}`), {
            status: 'playing',
            gameState: initialState
        });
    };

    const handleCardClick = (card: CardType) => {
        setSelectedCards(prev => {
            const exists = prev.some(c => c.suit === card.suit && c.rank === card.rank);
            if (exists) {
                return prev.filter(c => !(c.suit === card.suit && c.rank === card.rank));
            } else {
                return [...prev, card];
            }
        });
    };

    const handlePlayCards = async () => {
        if (!room || !room.gameState || !playerId) return;

        const currentHand = myHand;
        const isRevolution = room.gameState.isRevolution || false;
        const lastMove = room.gameState.lastMove;
        const rules = room.rules || {
            isShibari: false,
            isSpade3: false,
            isStaircase: false,
            is11Back: false
        };

        const aiRules = {
            isShibari: rules.isShibari || false,
            isSpade3: rules.isSpade3 || false,
            isStaircase: rules.isStaircase || false,
            is11Back: rules.is11Back || false
        };

        const is11Back = room.gameState.is11Back || false;
        const result = engine.validateMove(selectedCards, currentHand, isRevolution, is11Back, lastMove || null, aiRules);
        if (!result.isValid) {
            alert(result.errorMessage || 'そのカードは出せません');
            return;
        }

        await executeMove(playerId, selectedCards);
        setSelectedCards([]);
    };

    const handlePass = async () => {
        if (!room || !room.gameState || !playerId) return;
        await executePass(playerId);
    };

    const handleLeaveRoom = async () => {
        if (!roomId || !playerId) return;

        // Remove player
        const playerRef = ref(db, `trump_rooms/${roomId}/players/${playerId}`);
        await remove(playerRef);

        // If room is empty, delete it (best effort)
        if (room && room.players) {
            const remainingPlayers = Object.keys(room.players).filter(pid => pid !== playerId);
            if (remainingPlayers.length === 0) {
                await remove(ref(db, `trump_rooms/${roomId}`));
            } else if (remainingPlayers.every(pid => room.players[pid].isAi)) {
                // If only AI left, delete room
                await remove(ref(db, `trump_rooms/${roomId}`));
            }
        }

        router.push('/trump');
    };

    if (!isLoaded || !room) return <div className={styles.loading}>読み込み中...</div>;

    const playersList = Object.values(room.players || {});
    const isMyTurn = room.gameState?.turn === playerId;

    if (room.status === 'waiting') {
        return (
            <main className={styles.main}>
                <div className={styles.lobbyContainer}>
                    <h1 className={styles.title}>プレイヤー待機中...</h1>
                    <div className={styles.playersList}>
                        {playersList.map(p => (
                            <div key={p.id} className={styles.playerCard}>
                                <IconUser size={20} /> {p.name} {p.role === 'host' ? '(ホスト)' : ''} {p.isAi ? '(CPU)' : ''}
                            </div>
                        ))}
                    </div>
                    <div className={styles.controls}>
                        {room.hostId === playerId && playersList.length >= 2 && (
                            <button onClick={handleStartGame} className={styles.startBtn}>
                                ゲーム開始
                            </button>
                        )}
                        <button onClick={handleLeaveRoom} className={styles.leaveBtn}>
                            退出する
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.gameHeader}>
                <button onClick={handleLeaveRoom} className={styles.backButton}>
                    <IconBack size={20} /> 終了
                </button>
                <div className={styles.gameInfo}>
                    ルーム: {roomId} | 手番: {room.gameState?.turn === playerId ? 'あなたの番です' : ((room.gameState?.turn && room.players[room.gameState.turn]?.name) || '相手')}
                </div>
            </div>

            <div className={styles.tableContainer}>
                <TrumpTable
                    players={playersList}
                    myId={playerId || ''}
                    hands={room.gameState?.hands || {}}
                    fieldCards={room.gameState?.field || []}
                    turnPlayerId={room.gameState?.turn || ''}
                    onCardClick={handleCardClick}
                    selectedCards={selectedCards}
                    isRevolution={room.gameState?.isRevolution || false}
                />
            </div>

            {isMyTurn && (
                <div className={styles.actionControls}>
                    <button
                        onClick={handlePlayCards}
                        className={styles.actionBtn}
                        disabled={selectedCards.length === 0}
                    >
                        出す
                    </button>
                    <button onClick={handlePass} className={`${styles.actionBtn} ${styles.passBtn}`}>
                        パス
                    </button>
                </div>
            )}
        </main>
    );
}
