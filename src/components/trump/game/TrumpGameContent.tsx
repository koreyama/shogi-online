'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './TrumpGameContent.module.css';
import { db } from '@/lib/firebase';
import { ref, onValue, update, set, runTransaction, onDisconnect, remove } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';
import { TrumpRoom, TrumpPlayer, Card as CardType } from '@/lib/trump/types';
import { TrumpTable } from '@/components/trump/TrumpTable';
import { Deck } from '@/lib/trump/deck';
import { DaifugoEngine } from '@/lib/trump/daifugo/engine';
import { DaifugoAI } from '@/lib/trump/daifugo/ai';
import confetti from 'canvas-confetti';
import { IconBack, IconUser, IconCards } from '@/components/Icons';

interface Props {
    roomId: string;
    onExit: () => void;
}

export default function TrumpGameContent({ roomId, onExit }: Props) {
    const { user, signInWithGoogle, loading: authLoading } = useAuth();
    const playerId = user?.uid || '';
    const playerName = user?.displayName || 'Guest';

    const [room, setRoom] = useState<TrumpRoom | null>(null);
    const [myHand, setMyHand] = useState<CardType[]>([]);
    const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
    const [engine] = useState(() => new DaifugoEngine());
    const [ai] = useState(() => new DaifugoAI());
    const lastProcessedStateRef = useRef<string>("");

    const [sortOrder, setSortOrder] = useState<'strength' | 'suit'>('strength');

    // Calculate playable cards
    const playableCards = React.useMemo(() => {
        if (!room || !room.gameState || !playerId) return [];
        if (room.gameState.turn !== playerId) return []; // Not my turn

        const currentHand = myHand;
        const isRevolution = room.gameState.isRevolution || false;
        const lastMove = room.gameState.lastMove;
        const rules = room.rules || {
            isShibari: false,
            isSpade3: false,
            isStaircase: false,
            is11Back: false
        };
        const is11Back = room.gameState.is11Back || false;
        const isShibariActive = room.gameState.isShibari || false;

        return currentHand.filter(card =>
            engine.isCardPlayable(card, currentHand, isRevolution, is11Back, lastMove || null, rules, isShibariActive)
        );
    }, [room, myHand, playerId, engine]);

    const sortedHands = React.useMemo(() => {
        if (!room?.gameState?.hands) return {};
        const hands = { ...room.gameState.hands };
        if (playerId && hands[playerId]) {
            const myCards = [...hands[playerId]];
            const isRevolution = room.gameState?.isRevolution || false;
            const is11Back = room.gameState?.is11Back || false;

            if (sortOrder === 'strength') {
                myCards.sort((a, b) => engine.getStrength(a, isRevolution, is11Back) - engine.getStrength(b, isRevolution, is11Back));
            } else {
                // Sort by suit then rank
                myCards.sort((a, b) => {
                    if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
                    return engine.getStrength(a, isRevolution, is11Back) - engine.getStrength(b, isRevolution, is11Back);
                });
            }
            hands[playerId] = myCards;
        }
        return hands;
    }, [room?.gameState?.hands, playerId, sortOrder, engine, room?.gameState?.isRevolution, room?.gameState?.is11Back]);

    const toggleSort = () => {
        setSortOrder(prev => prev === 'strength' ? 'suit' : 'strength');
    };

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
    }, [roomId, playerId]);

    // Join room & Presence logic
    useEffect(() => {
        if (user && roomId && playerName && playerId) {
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
    }, [user, roomId, playerName, playerId, room]);

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
                    const isShibariActive = room.gameState?.isShibari || false;
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

            // Check Shibari
            if (rules.isShibari) {
                if (gameState.lastMove) {
                    const lastSuits = gameState.lastMove.cards.filter((c: CardType) => c.suit !== 'joker').map((c: CardType) => c.suit).sort().join(',');
                    const currentSuits = cards.filter(c => c.suit !== 'joker').map(c => c.suit).sort().join(',');
                    if (lastSuits === currentSuits && lastSuits !== '') {
                        gameState.isShibari = true;
                    }
                }
            }

            // Check Win (Agari)
            if (newHand.length === 0) {
                gameState.finishedPlayers = gameState.finishedPlayers || [];
                gameState.finishedPlayers.push(actorId);
                gameState.ranks = gameState.ranks || {};
            }

            // Next Turn Logic
            if (is8Cut) {
                gameState.field = [];
                gameState.lastMove = null;
                gameState.is11Back = false;
                gameState.isShibari = false;

                if (newHand.length === 0) {
                    const nextId = getNextActivePlayer(currentRoom.players, gameState.finishedPlayers, actorId);
                    if (nextId) gameState.turn = nextId;
                    else currentRoom.status = 'finished';
                } else {
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

            const allPlayerIds = Object.keys(currentRoom.players);
            const finishedIds = gameState.finishedPlayers || [];
            const activeCount = allPlayerIds.length - finishedIds.length;

            const nextId = getNextActivePlayer(currentRoom.players, finishedIds, actorId);

            if (!nextId) {
                currentRoom.status = 'finished';
                return currentRoom;
            }

            if (gameState.lastMove && nextId === gameState.lastMove.playerId) {
                gameState.field = [];
                gameState.lastMove = null;
                gameState.passCount = 0;
                gameState.is11Back = false;
                gameState.isShibari = false;
                gameState.turn = nextId;
            } else if (gameState.lastMove && finishedIds.includes(gameState.lastMove.playerId)) {
                if (gameState.passCount >= activeCount) {
                    gameState.field = [];
                    gameState.lastMove = null;
                    gameState.passCount = 0;
                    gameState.is11Back = false;
                    gameState.isShibari = false;
                    gameState.turn = nextId;
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
            isShibari: false,
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
        const isShibariActive = room.gameState.isShibari || false;
        const result = engine.validateMove(selectedCards, currentHand, isRevolution, is11Back, lastMove || null, aiRules, isShibariActive);
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

        const playerRef = ref(db, `trump_rooms/${roomId}/players/${playerId}`);
        await remove(playerRef);

        if (room && room.players) {
            const remainingPlayers = Object.keys(room.players).filter(pid => pid !== playerId);
            if (remainingPlayers.length === 0) {
                await remove(ref(db, `trump_rooms/${roomId}`));
            } else if (remainingPlayers.every(pid => room.players[pid].isAi)) {
                await remove(ref(db, `trump_rooms/${roomId}`));
            }
        }

        onExit();
    };

    if (authLoading) return <div className={styles.loading}>読み込み中...</div>;

    if (!user) {
        return (
            <main className={styles.main} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <IconCards size={64} color="#2b6cb0" />
                    <h1 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>トランプゲーム</h1>
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

    const playersList = Object.values(room.players || {});
    const isMyTurn = room.gameState?.turn === playerId;

    const handleAddAi = async () => {
        if (!room || !playerId) return;
        if (room.hostId !== playerId) return;
        if (Object.keys(room.players).length >= 4) return;

        const aiId = `ai-${Date.now()}`;
        const aiName = `CPU ${Object.keys(room.players).length}`;

        await update(ref(db, `trump_rooms/${roomId}/players/${aiId}`), {
            id: aiId,
            name: aiName,
            role: 'guest',
            isReady: true,
            isAi: true
        });
    };

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
                        {room.hostId === playerId && Object.keys(room.players).length < 4 && (
                            <button onClick={handleAddAi} className={styles.actionBtn} style={{ background: '#4a5568' }}>
                                CPU追加
                            </button>
                        )}
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
                <div className={styles.rulesOverlay}>
                    <div className={styles.ruleItem}>革命: {room.rules?.revolution ? 'ON' : 'OFF'}</div>
                    <div className={styles.ruleItem}>8切り: {room.rules?.is8Cut ? 'ON' : 'OFF'}</div>
                    <div className={styles.ruleItem}>縛り: {room.rules?.isShibari ? 'ON' : 'OFF'}</div>
                    <div className={styles.ruleItem}>スペ3: {room.rules?.isSpade3 ? 'ON' : 'OFF'}</div>
                    <div className={styles.ruleItem}>11バック: {room.rules?.is11Back ? 'ON' : 'OFF'}</div>
                    <div className={styles.ruleItem}>階段: {room.rules?.isStaircase ? 'ON' : 'OFF'}</div>
                </div>
                {room.gameState?.isShibari && <div className={styles.shibariIndicator}>縛り中!</div>}

                <TrumpTable
                    players={playersList}
                    myId={playerId || ''}
                    hands={sortedHands}
                    fieldCards={room.gameState?.field || []}
                    turnPlayerId={room.gameState?.turn || ''}
                    onCardClick={handleCardClick}
                    selectedCards={selectedCards}
                    playableCards={playableCards}
                    isRevolution={room.gameState?.isRevolution || false}
                />
            </div>

            <div className={styles.actionControls}>
                <button onClick={toggleSort} className={styles.actionBtn} style={{ background: '#4a5568', marginRight: 'auto' }}>
                    並び替え: {sortOrder === 'strength' ? '強さ' : 'マーク'}
                </button>

                {isMyTurn && (
                    <>
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
                    </>
                )}
            </div>
        </main>
    );
}
