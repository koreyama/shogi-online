'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Client, Room } from 'colyseus.js';
import { GameBoard } from '@/components/card-game/GameBoard';
import { GameState, PlayerState, GameLogEntry, StatusEffect, Trap, Field } from '@/lib/card-game/types';
import { AVATARS } from '@/lib/card-game/data/avatars';
import { updateUserRankingAfterMatch, getUserRanking, DEFAULT_RATING } from '@/lib/card-game/ranking';

interface ColyseusCardGameProps {
    roomId?: string; // If joining existing
    options?: any; // e.g. create: true
    playerId: string;
    playerName: string;
    avatarId: string;
    deck: string[];
    onLeave: () => void;
}

export function ColyseusCardGame({ roomId, options, playerId, playerName, avatarId, deck, onLeave }: ColyseusCardGameProps) {
    const [client] = useState(() => new Client(process.env.NEXT_PUBLIC_COLYSEUS_URL || 'ws://localhost:2567'));
    const [room, setRoom] = useState<Room | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const roomRef = useRef<Room | null>(null);

    // Filter repeated connection attempts
    const connectingRef = useRef(false);

    const [ratingResult, setRatingResult] = useState<{ old: number, new: number } | null>(null);
    const [currentRating, setCurrentRating] = useState<number | null>(null);
    const ratingUpdatedRef = useRef(false);

    // Fetch initial rating for display
    useEffect(() => {
        if (options?.mode === 'ranked') {
            getUserRanking(playerId).then(u => setCurrentRating(u.rating));
        }
    }, [options?.mode, playerId]);

    useEffect(() => {
        // Reset ref if game restarts
        if (gameState?.phase !== 'end') {
            ratingUpdatedRef.current = false;
        }

        if (!gameState || gameState.phase !== 'end' || options?.mode !== 'ranked' || ratingUpdatedRef.current) return;

        const handleRankingUpdate = async () => {
            console.log("Starting Ranking Update...");
            ratingUpdatedRef.current = true;
            try {
                const myPlayer = gameState.players[playerId];
                const opponentId = Object.keys(gameState.players).find(id => id !== playerId);

                if (!myPlayer || !opponentId) {
                    console.error("Missing player or opponent ID");
                    return;
                }

                const isWin = gameState.winner === playerId;

                // Get Opponent Rating
                const opponentRanking = await getUserRanking(opponentId);
                const myRanking = await getUserRanking(playerId);
                console.log(`Current Ratings - Me: ${myRanking.rating}, Opponent: ${opponentRanking.rating}`);

                // Update My Rating
                await updateUserRankingAfterMatch(playerId, playerName, opponentRanking.rating, isWin);

                // Fetch new rating for display
                const newRanking = await getUserRanking(playerId);
                console.log(`New Rating: ${newRanking.rating}`);

                setRatingResult({ old: myRanking.rating, new: newRanking.rating });

            } catch (e) {
                console.error("Error updating ranking:", e);
            }
        };

        handleRankingUpdate();

    }, [gameState?.phase, options?.mode, gameState?.winner, playerId, playerName]);

    useEffect(() => {
        // ... (existing logging logic) -> Actually client doesn't log much.
        // Just keeping this slot for connection logic.
        if (connectingRef.current) return;
        connectingRef.current = true;

        const connect = async () => {
            try {
                let r: Room;
                const joinOptions = {
                    playerId,
                    name: playerName,
                    avatarId,
                    deck,
                    ...options
                };

                if (roomId) {
                    r = await client.joinById(roomId, joinOptions);
                } else if (options?.create) {
                    r = await client.create("card_game", joinOptions);
                } else {
                    r = await client.joinOrCreate("card_game", joinOptions);
                }

                roomRef.current = r;
                setRoom(r);
                console.log("Joined room", r.roomId);

                // Initial state sync
                convertAndSetState(r.state);

                // Listen to changes
                r.onStateChange((state: any) => {
                    convertAndSetState(state);
                });

                r.onMessage("message", (msg) => {
                    console.log("Server message:", msg);
                });

                r.onMessage("roomDissolved", () => {
                    alert("対戦相手が退出したため、ルームを解散します。");
                    roomRef.current?.leave();
                    onLeave();
                });

            } catch (e: any) {
                console.error("Join error:", e);
                setError(`Error joining room: ${e.message}`);
            } finally {
                connectingRef.current = false;
            }
        };

        connect();

        return () => {
            if (roomRef.current) {
                roomRef.current.leave();
            }
        };
    }, [client, roomId, options, playerId, playerName, avatarId, deck]);

    const convertAndSetState = (schemaState: any) => {
        // Convert Schema to Plain GameState
        // Schema arrays/maps need .toJSON() or manual mapping?
        // simple toJSON might work if structure matches perfectly
        // But Schema Map toJSON returns Object, which matches Record<string, PlayerState>
        // Schema Array toJSON returns Array.

        // However, we need to ensure the types match perfectly or the GameBoard might break.
        // Let's rely on JSON serialization of schema state which Colyseus provides implicitly via .toJSON() usually
        // or just access properties.

        // Safe conversion helper
        // Safe conversion helper
        if (!schemaState) {
            console.warn("Received empty state");
            return;
        }

        // Debug Log
        console.log("Raw Schema State:", JSON.stringify(schemaState));

        const plainState: GameState = {
            roomId: schemaState.roomId || "",
            turnPlayerId: schemaState.turnPlayerId || "",
            phase: (schemaState.phase as any) || "draw",
            turnCount: schemaState.turnCount || 0,
            winner: schemaState.winner || undefined,
            log: (schemaState.log || []).map((l: any) => ({
                id: l.id,
                text: l.text,
                timestamp: l.timestamp
            })),
            players: {},
            turnState: {
                hasAttacked: schemaState.turnState?.hasAttacked ?? false,
                hasDiscarded: schemaState.turnState?.hasDiscarded ?? false,
                cardsPlayedCount: schemaState.turnState?.cardsPlayedCount ?? 0,
                isComboChain: schemaState.turnState?.isComboChain ?? false,
                manaChargeCount: schemaState.turnState?.manaChargeCount ?? 0,
                freeCardIds: Array.from(schemaState.turnState?.freeCardIds || [])
            }
        };

        // Field
        if (schemaState.field && schemaState.field.cardId) {
            plainState.field = {
                cardId: schemaState.field.cardId,
                name: schemaState.field.name,
                effectId: schemaState.field.effectId,
                element: schemaState.field.element || undefined
            };
        }

        // Traps
        if (schemaState.traps && schemaState.traps.length > 0) {
            plainState.traps = schemaState.traps.map((t: any) => ({
                id: t.id,
                cardId: t.cardId,
                name: t.name,
                ownerId: t.ownerId,
                effectId: t.effectId
            }));
        }

        // Players
        if (schemaState.players) {
            schemaState.players.forEach((p: any, key: string) => {
                plainState.players[key] = {
                    id: p.id,
                    name: p.name,
                    avatarId: p.avatarId,
                    hp: p.hp,
                    maxHp: p.maxHp,
                    mp: p.mp,
                    maxMp: p.maxMp,
                    status: p.status as any,
                    money: p.money,
                    ultimateUsed: p.ultimateUsed,
                    isManaChargeMode: p.isManaChargeMode,
                    selectedForCharge: Array.from(p.selectedForCharge || []),
                    hand: Array.from(p.hand || []),
                    deck: Array.from(p.deck || []),
                    discardPile: Array.from(p.discardPile || []),
                    manaZone: Array.from(p.manaZone || []),
                    equipment: {
                        weapon: p.equipment.weapon || undefined,
                        armor: p.equipment.armor || undefined,
                        armorDurability: p.equipment.armorDurability || undefined,
                        enchantment: p.equipment.enchantment || undefined
                    },
                    statusEffects: (p.statusEffects || []).map((e: any) => ({
                        id: e.id,
                        type: e.type,
                        name: e.name,
                        value: e.value,
                        duration: e.duration
                    }))
                };
            });
        }

        // Last played
        if (schemaState.lastPlayedCardId) {
            plainState.lastPlayedCard = {
                cardId: schemaState.lastPlayedCardId,
                playerId: schemaState.lastPlayedPlayerId,
                timestamp: schemaState.lastPlayedTimestamp
            };
        }

        setGameState(plainState);
    };

    // Action Handlers
    const handlePlayCard = (cardId: string, targetId?: string, handIndex?: number) => {
        if (!room || !gameState) return;

        // Check Mana Charge mode locally first or let server handle?
        // The engine has toggle logic.
        // Client UI normally checks `player.isManaChargeMode`.
        const player = gameState.players[playerId];
        if (player?.isManaChargeMode && handIndex !== undefined) {
            room.send("selectCharge", { index: handIndex });
        } else {
            room.send("playCard", { cardId, targetId });
        }
    };

    const handleEndTurn = () => {
        room?.send("endTurn");
    };

    const handleUseUltimate = () => {
        room?.send("useUltimate");
    };

    const handleManaCharge = () => {
        room?.send("toggleManaCharge");
    };

    const handleExecuteCharge = () => {
        // Server knows selected indices from `selectCharge`? 
        // Wait, Schema `selectedForCharge` was skipped because I thought it was UI state.
        // BUT `manaCharge` action uses `selectedIndices`.
        // If I skipped syncing `selectedForCharge`, then server doesn't know what is selected if I send "execute" without args.
        // Option A: Send indices with "manaCharge" message. Client must track selection locally then.
        // Option B: Sync `selectedForCharge` in Schema.

        // Let's use Option A: Client tracks selection UI locally (visually), and when clicking "Execute", sends indices.
        // BUT `GameBoard` logic relies on `onExecuteCharge` taking NO args and using `player.selectedForCharge`.
        // So `GameBoard` assumes `gameState` has the selection.
        // So I MUST sync `selectedForCharge` OR Client-side wrapper must intercept selection.
        // Intercepting selection is better for responsiveness.
        // Wait, `ColyseusCardGame` just renders `GameBoard`. `GameBoard` uses `onManaCharge` (toggle), `onExecuteCharge`, `onCancelCharge`.
        // And `handlePlayCard` (which handles selection click if in charge mode).

        // Let's modify `ColyseusCardGame` to handle selection state locally overlaying the server state?
        // Or simpler: Sync `selectedForCharge` to server. It's safer.
        // I'll update `CardGameRoom.ts` and Schema to include `selectedForCharge`.
        // This is better for consistency.

        // For now, let's assume I send the indices from the player state.
        // Wait, if I didn't sync it, `gameState.players[pid].selectedForCharge` is undefined.
        // Does `GameBoard` handle local selection?
        // `GameBoard` reads `player.selectedForCharge`. 
        // So I DO need to sync it.

        // I will add `selectedForCharge` to Schema and Room sync logic quickly.
        // Actually, `CardGameRoom.ts` already has `selectCharge` handler which calls `selectCardForCharge` engine function.
        // This engine function updates `player.selectedForCharge`.
        // So if I just add `selectedForCharge` to Schema players, it will work automatically!

        // Let's update this file to send "execute" which will make server call `manaCharge` with the stored indices.
        // Wait, `engine.ts` `manaCharge` takes `indices` as arg.
        // Does `engine.ts` have a function to "execute current selection"? 
        // No, `manaCharge`(state, playerId, indices).
        // `toggleManaChargeMode` just toggles mode.
        // `selectCardForCharge` updates `selectedForCharge` array in state.

        // So:
        // 1. User clicks card -> `handlePlayCard` checks mode -> sends `selectCharge` -> Server updates `state.selectedForCharge`.
        // 2. State syncs -> Client sees `selectedForCharge`.
        // 3. User clicks "Execute" -> `handleExecuteCharge` -> sends `manaCharge` (no args needed? Server needs to look up `selectedForCharge`?)
        // Server's `manaCharge` message handler I wrote in Step 3479:
        // `this.onMessage("manaCharge", (client, message: { indices: number[] }) => ...`
        // It expects indices.
        // So Client needs to send `gameState.players[pid].selectedForCharge`.

        const player = gameState?.players[playerId];
        if (player?.selectedForCharge) {
            room?.send("manaCharge", { indices: player.selectedForCharge });
        }
    };

    const handleCancelCharge = () => {
        room?.send("toggleManaCharge"); // Toggle off
    };

    const handleSurrender = () => {
        if (confirm('本当にあきらめますか？')) {
            room?.send("surrender");
        }
    };

    if (error) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
                <div style={{ color: 'red' }}>{error}</div>
                <button onClick={onLeave} style={{ padding: '0.5rem 1rem', background: '#333', color: 'white', border: 'none', borderRadius: '4px' }}>
                    戻る
                </button>
            </div>
        );
    }

    if (!gameState) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Connecting to server...</div>;

    // Waiting for opponent
    if (Object.keys(gameState.players).length < 2) {
        const isPrivateRoom = options?.mode !== 'random' && options?.mode !== 'ranked' && options?.mode !== 'casual';

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
                <h2>{isPrivateRoom ? '対戦相手を待っています...' : '対戦相手を探しています...'}</h2>

                {options?.mode === 'ranked' && currentRating !== null && (
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#d97706' }}>
                        現在のレート: {currentRating}
                    </div>
                )}

                <div style={{ fontSize: '1.2rem', color: '#666' }}>
                    {isPrivateRoom ? `現在の参加者: ${Object.keys(gameState.players).length} / 2` : 'マッチング中...'}
                </div>

                {isPrivateRoom && (
                    <div style={{
                        padding: '1rem 2rem',
                        backgroundColor: '#fff',
                        border: '2px solid #cbd5e1',
                        color: '#1e293b',
                        borderRadius: '8px',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.1em',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        Room ID: {gameState?.roomId || room?.roomId || roomId}
                    </div>
                )}

                {!isPrivateRoom && (
                    <div className="animate-spin" style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #cbd5e1',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        margin: '1rem'
                    }} />
                )}

                <div style={{ fontSize: '0.9rem', color: '#888' }}>
                    Player ID: {playerId}
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <button onClick={() => {
                        roomRef.current?.leave();
                        onLeave();
                    }} style={{ background: 'none', border: 'none', color: '#666', textDecoration: 'underline', cursor: 'pointer' }}>
                        キャンセルして戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative' }}>
            <GameBoard
                gameState={gameState}
                myPlayerId={playerId}
                onPlayCard={handlePlayCard}
                onEndTurn={handleEndTurn}
                onUseUltimate={handleUseUltimate}
                onManaCharge={handleManaCharge}
                onExecuteCharge={handleExecuteCharge} // Wraps logic to send indices
                onCancelCharge={handleCancelCharge}
                onSurrender={handleSurrender}
            />
            {/* Surrender button moved to GameBoard */}

            {gameState.phase === 'end' && (
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
                        width: '90%'
                    }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
                            {gameState.winner === playerId ? 'YOU WIN!' : 'LOSE...'}
                        </h2>

                        {ratingResult && (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>RATING</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#334155' }}>
                                    {ratingResult.old} <span style={{ color: '#94a3b8', margin: '0 0.5rem' }}>→</span>
                                    <span style={{ color: ratingResult.new > ratingResult.old ? '#22c55e' : '#ef4444' }}>
                                        {ratingResult.new}
                                    </span>
                                    <span style={{ fontSize: '0.9rem', marginLeft: '0.5rem', color: ratingResult.new > ratingResult.old ? '#22c55e' : '#ef4444' }}>
                                        ({ratingResult.new > ratingResult.old ? '+' : ''}{ratingResult.new - ratingResult.old})
                                    </span>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => {
                                    room?.leave();
                                    onLeave();
                                }}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#94a3b8',
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
                            <button
                                onClick={() => {
                                    room?.send("rematch");
                                    // Visual feedback can be added here (e.g., disable button)
                                    const btn = document.getElementById('rematch-btn');
                                    if (btn) {
                                        btn.textContent = '待機中...';
                                        (btn as HTMLButtonElement).disabled = true;
                                    }
                                }}
                                id="rematch-btn"
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
                                もう一度戦う
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
