import React, { useEffect, useState, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import styles from './RainbowGame.module.css'; // Changed to use dedicated CSS


interface RainbowGameProps {
    roomId?: string;
    options?: any;
    onLeave: () => void;
    myPlayerId: string;
    myPlayerName: string;
}

const COLORS: any = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
    black: '#1f2937'
};

const CardView = ({ card, onClick, selected = false, disabled = false, extraClass = '' }: { card: any, onClick?: () => void, selected?: boolean, disabled?: boolean, extraClass?: string }) => {
    const bg = COLORS[card.color] || '#ccc';
    return (
        <div
            onClick={!disabled ? onClick : undefined}
            className={extraClass}
            style={{
                width: 80, height: 120, // Slightly larger
                backgroundColor: bg,
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.1)', // Constant border
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 'bold', fontSize: '1.6rem', // Larger font
                cursor: (!disabled && onClick) ? 'pointer' : 'default',
                // Use box-shadow for the glow AND the "border" effect (spread radius)
                boxShadow: selected
                    ? '0 0 0 4px #f59e0b, 0 0 15px 5px rgba(255, 255, 255, 0.8), 0 0 30px rgba(245, 158, 11, 0.6)'
                    : '0 4px 10px rgba(0,0,0,0.15)',
                position: 'relative',
                userSelect: 'none',
                transform: selected ? 'scale(1.05)' : 'none', // Removed translateY
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bouncy transition
                opacity: disabled ? 0.6 : 1,
                zIndex: selected ? 10 : 1
            }}
        >
            <span style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                {card.type === 'wild' ? (card.value === 'wild' ? '🌈' : '+4') :
                    card.type === 'action' ? (card.value === 'skip' ? '🚫' : card.value === 'reverse' ? '🔁' : '+2') :
                        card.value}
            </span>
            <div style={{ position: 'absolute', top: 6, left: 6, fontSize: '0.7rem', opacity: 0.9 }}>
                {card.value === 'wild' ? 'W' : card.value === 'wild4' ? '+4' : String(card.value ?? "").substring(0, 2).toUpperCase()}
            </div>

            {/* Glass Shine */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
                borderRadius: '9px 9px 0 0', pointerEvents: 'none'
            }} />
        </div>
    );
};

import { client } from '@/lib/colyseus';

export function RainbowGame({ roomId, options, onLeave, myPlayerId, myPlayerName }: RainbowGameProps) {
    // Client is imported from lib

    const [room, setRoom] = useState<Colyseus.Room<any> | null>(null);
    const [gameState, setGameState] = useState<any>(null);
    const [myHand, setMyHand] = useState<any[]>([]);
    const [error, setError] = useState('');

    // Multi-select state
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    // Drag Scroll State
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const isDown = useRef(false); // Ref for immediate tracking without re-renders

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        isDown.current = true;
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
        // Do NOT set isDragging(true) here. Wait for move.
    };

    const handleMouseLeave = () => {
        isDown.current = false;
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        isDown.current = false;
        // Delay resetting isDragging slightly to ensure onClick checks the correct state
        if (isDragging) {
            setTimeout(() => setIsDragging(false), 50);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDown.current || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast

        // Only trigger drag state if moved more than 5px to prevent blocking clicks
        if (Math.abs(x - startX) > 5) {
            if (!isDragging) setIsDragging(true);
            scrollContainerRef.current.scrollLeft = scrollLeft - walk;
        }
    };

    const [showColorPicker, setShowColorPicker] = useState(false);

    const clientRef = useRef<Colyseus.Client | null>(null);
    const roomRef = useRef<Colyseus.Room<any> | null>(null);
    const cleanupRef = useRef<{ roomId: string, isHost: boolean } | null>(null);
    // Initial Connection
    useEffect(() => {
        let isMounted = true;
        clientRef.current = client;

        const connect = async () => {
            try {
                // If we already have a room, don't join again
                if (roomRef.current) return;

                console.log("Connect called. Client:", client, "RoomID:", roomId, "Options:", options);

                let r: Colyseus.Room<any>;
                const opts = { ...options, name: myPlayerName }; // Use passed fixed name

                // Daifugo-style Logic:
                if (roomId) {
                    r = await client.joinById(roomId, opts);
                } else if (options?.roomId) {
                    // If roomId passed in options (reconnection scenario)
                    r = await client.joinById(options.roomId, opts);
                } else if (options?.create) {
                    r = await client.create("rainbow", opts);
                } else {
                    r = await client.joinOrCreate("rainbow", opts);
                }

                if (!isMounted) {
                    console.log("Component unmounted before connection established. Leaving room.");
                    r.leave();
                    return;
                }

                roomRef.current = r;
                setRoom(r);
                setupRoomListeners(r);

            } catch (e: any) {
                if (!isMounted) return;
                console.error("Join error:", e);
                console.error("Error Details:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
                if (e?.message) console.error("Message:", e.message);

                const isNotFound = e?.message?.includes('not found') || e?.code === 404;
                if (isNotFound) {
                    alert("指定されたルームが見つかりませんでした。");
                } else {
                    alert(`接続エラー: ${e.message || "不明なエラー"}`);
                }
                setError(e.message || "接続エラーが発生しました");
            }
        };

        if (client) {
            connect();
        }

        return () => {
            isMounted = false;
            if (roomRef.current) {
                console.log("Cleaning up Colyseus connection...");
                roomRef.current.leave();
                roomRef.current = null;
            }
        };
    }, []); // eslint-disable-line

    const setupRoomListeners = (r: Colyseus.Room<any>) => {
        r.onStateChange((state) => {
            setGameState({ ...state });
            const me = state.players.get(r.sessionId);
            if (me) {
                setMyHand([...me.hand]);
            }
        });

        r.onMessage("error", (msg: string) => alert(msg));
    };

    // Firebase Sync Effect
    useEffect(() => {
        if (!room || !gameState) return;
        const players = Array.from(gameState.players.values());
        updateFirebaseRoom(room, players);
    }, [gameState, room]);

    const updateFirebaseRoom = async (r: Colyseus.Room<any>, currentPlayers: any[]) => {
        const me = currentPlayers.find((p: any) => p.sessionId === r.sessionId);
        const amHost = me?.isHost;
        const rId = r.roomId;

        cleanupRef.current = { roomId: rId, isHost: amHost };

        if (amHost) {
            const { ref, set, remove, onDisconnect } = await import('firebase/database');
            const { db } = await import('@/lib/firebase');

            const roomRef = ref(db, `rooms/${rId}`);

            // Check if room should be visible (Waiting AND Not Full)
            // Note: maxClients is 8 on server for buffer, but logical limit is 4.
            const isFull = currentPlayers.length >= 4;
            const isPlaying = (gameState?.status !== 'waiting');

            if (isFull || isPlaying) {
                // Remove from lobby listing
                remove(roomRef).catch(() => { });
                // Ensure cleanup on disconnect still active (though redundant if removed)
                onDisconnect(roomRef).remove().catch(() => { });
            } else {
                const roomData = {
                    roomId: rId,
                    gameType: 'rainbow',
                    status: gameState?.status || 'waiting',
                    players: currentPlayers.reduce((acc: any, p: any) => ({
                        ...acc,
                        [p.id]: { name: p.name, role: p.isHost ? 'host' : 'guest' }
                    }), {}),
                    createdAt: Date.now(),
                    isLocked: !!(options?.password),
                    maxClients: 4
                };

                set(roomRef, roomData).catch(() => { });
                onDisconnect(roomRef).remove().catch(() => { });
            }
        }
    };

    // Unmount Cleanup Effect (Firebase)
    useEffect(() => {
        return () => {
            const current = cleanupRef.current;
            if (current && current.isHost && current.roomId) {
                import('firebase/database').then(({ ref, remove }) => {
                    import('@/lib/firebase').then(({ db }) => {
                        const refToRemove = ref(db, `rooms/${current.roomId}`);
                        remove(refToRemove).catch(() => { });
                    });
                });
            }
        };
    }, []);

    const toggleSelect = (index: number) => {
        if (!gameState || gameState.currentTurn !== room?.sessionId) return;

        if (selectedIndices.includes(index)) {
            setSelectedIndices(selectedIndices.filter(i => i !== index));
        } else {
            if (selectedIndices.length > 0) {
                const first = myHand[selectedIndices[0]];
                const current = myHand[index];
                if (first.value !== current.value) {
                    setSelectedIndices([index]);
                } else {
                    setSelectedIndices([...selectedIndices, index]);
                }
            } else {
                setSelectedIndices([index]);
            }
        }
    };

    const handlePlaySubmit = () => {
        if (!room || selectedIndices.length === 0) return;
        const needsColor = selectedIndices.some(idx => myHand[idx].color === 'black');
        if (needsColor) {
            setShowColorPicker(true);
        } else {
            room.send("playCards", { cardIndices: selectedIndices });
        }
    };

    const handleColorPick = (color: string) => {
        if (!room || selectedIndices.length === 0) return;
        room.send("playCards", { cardIndices: selectedIndices, color });
        setShowColorPicker(false);
    };

    const handleDraw = () => room?.send("drawCard");

    if (error) return <div className={styles.error}>{error} <button onClick={onLeave} className={styles.leaveBtn}>戻る</button></div>;
    if (!gameState) return <div className={styles.loading}>接続中...</div>;

    const mySessionId = room?.sessionId;
    const me = gameState.players.get(mySessionId);
    const mySeat = me?.seatIndex ?? 0;

    // --- Waiting Room UI (Daifugo Style) ---
    if (gameState.status === 'waiting') {
        const playersList = Array.from(gameState.players.values()).sort((a: any, b: any) => a.seatIndex - b.seatIndex);
        const isHost = me?.isHost;

        return (
            <main className={styles.gameMain} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyHeader}>
                        <h1 className={styles.title}>ルーム待機中</h1>
                        <div className={styles.roomIdBox}>
                            <span className={styles.roomIdLabel}>ID:</span>
                            <span className={styles.roomIdValue}>{roomId || room?.roomId}</span>
                        </div>
                    </div>

                    <div className={styles.lobbyContent}>
                        {/* Players List */}
                        <div className={styles.playersSection}>
                            <h3><span>👤</span> 参加者 ({playersList.length}/4)</h3>
                            <div className={styles.playersList}>
                                {playersList.map((p: any) => (
                                    <div key={p.sessionId} className={styles.playerCard}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                            {p.name.charAt(0)}
                                        </div>
                                        <span className={styles.playerName}>{p.name}</span>
                                        {p.isHost && <span className={styles.hostBadge}>HOST</span>}
                                        {p.sessionId === mySessionId && <span className={styles.meBadge}>YOU</span>}
                                    </div>
                                ))}
                                {[...Array(Math.max(0, 4 - playersList.length))].map((_, i) => (
                                    <div key={`empty-${i}`} className={`${styles.playerCard} ${styles.emptySlot}`}>
                                        <span>待機中...</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.controls}>
                            {isHost ? (
                                <button
                                    onClick={() => room?.send("startGame")}
                                    className={styles.startBtn}
                                    disabled={playersList.length < 2}
                                >
                                    {playersList.length < 2 ? '2人以上で開始できます' : 'ゲーム開始'}
                                </button>
                            ) : (
                                <div className={styles.waitingMessage}>
                                    ホストがゲームを開始するのを待っています...
                                </div>
                            )}
                            <button onClick={onLeave} className={styles.leaveBtn}>退出</button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // --- Game UI (Cross Layout) ---

    const isMyTurn = gameState.currentTurn === mySessionId;
    const topCard = gameState.discardPile && gameState.discardPile.length > 0
        ? gameState.discardPile[gameState.discardPile.length - 1]
        : null;

    // Distribute players into relative slots
    // 0: Bottom (Me), 1: Left, 2: Top, 3: Right
    const slots: any = { 0: null, 1: null, 2: null, 3: null };
    gameState.players.forEach((p: any) => {
        // Calculate relative seat: (PlayerSeat - MySeat + 4) % 4
        // To make it clockwise/counter-clockwise intuitive:
        // If mySeat is 0, seats are indexed 0, 1, 2, 3 clockwise.
        // We want relSeat 0=Bottom, 1=Left, 2=Top, 3=Right.
        // Clockwise sequence in seating usually goes: 0 -> 1 -> 2 -> 3
        // So relSeat 1 is next in clockwise order.
        let relSeat = (p.seatIndex - mySeat + 4) % 4;
        slots[relSeat] = p;
    });

    const drawPenalty = gameState.drawStack || 0;

    const PlayerInSlot = ({ player, slotClass }: { player: any, slotClass: string }) => {
        if (!player) return <div className={`${styles.slot} ${slotClass}`} />;
        const isActive = gameState.currentTurn === player.sessionId;
        const isMe = player.sessionId === mySessionId;

        return (
            <div className={`${styles.slot} ${slotClass}`}>
                <div className={`${styles.playerContainer} ${isActive ? styles.playerActive : ''}`}>
                    <div className={styles.playerAvatar} style={{
                        margin: '0 auto 8px', width: 40, height: 40, borderRadius: '50%',
                        background: '#cbd5e0', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 'bold', color: 'white',
                        border: '3px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}>
                        {player.name.charAt(0)}
                    </div>
                    {player.hand.length === 1 && (
                        <div style={{ position: 'absolute', top: -10, right: -10, background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: 10, animation: 'pulse 1s infinite', zIndex: 10 }}>
                            LAST!
                        </div>
                    )}
                    <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                        {player.name}
                    </div>
                    {!isMe && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                            <span style={{ fontWeight: '800', color: '#3b82f6' }}>{player.hand.length}</span> 枚
                        </div>
                    )}
                    {isActive && <div className={styles.turnMarker}>{isMe ? 'YOUR TURN' : 'PLAYING'}</div>}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.gameMain}>
            {/* Header */}
            <div className={styles.header}>
                <button onClick={onLeave} style={{ background: '#f1f5f9', padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#64748b', fontSize: '0.8rem' }}>
                    退出
                </button>
                <div className={styles.headerTitle}>ROOM: {roomId || room?.roomId}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: gameState.direction === 1 ? '#22c55e' : '#f59e0b' }}>
                        {gameState.direction === 1 ? '時計回り ↻' : '反時計回り ↺'}
                    </div>
                </div>
            </div>

            {/* Play Area - Cross Layout */}
            <div className={styles.playArea}>
                <PlayerInSlot player={slots[2]} slotClass={styles.slotTop} />
                <PlayerInSlot player={slots[1]} slotClass={styles.slotLeft} />

                <div className={`${styles.slot} ${styles.slotCenter}`}>
                    <div className={styles.centerField}>
                        {/* Direction Indicator */}
                        <div className={`${styles.directionRing} ${gameState.direction === 1 ? styles.dirClockwise : styles.dirCounter}`}>
                            <div className={styles.directionArrow}>➤</div>
                        </div>

                        {gameState.winner ? (
                            <div style={{ textAlign: 'center', zIndex: 50 }}>
                                <div style={{ fontSize: '2.5rem' }}>👑</div>
                                <div style={{ fontWeight: '800', color: '#f59e0b', fontSize: '1.2rem' }}>
                                    {gameState.players.get(gameState.winner)?.name} WINS!
                                </div>
                                {gameState.status === 'finished' && (
                                    <button onClick={onLeave} style={{ marginTop: 10, padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' }}>
                                        戻る
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: 20, alignItems: 'center', zIndex: 10 }}>
                                {/* Draw Pile */}
                                <div
                                    onClick={isMyTurn ? handleDraw : undefined}
                                    style={{
                                        width: 70, height: 105,
                                        background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
                                        borderRadius: 12, border: '3px solid white',
                                        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: isMyTurn ? 'pointer' : 'default',
                                        color: 'white', fontSize: '0.7rem', fontWeight: 'bold',
                                        transition: 'transform 0.2s',
                                        transform: (isMyTurn && !me?.hasDrawn) ? 'scale(1.05)' : 'none'
                                    }}
                                >
                                    {me?.hasDrawn ? 'PASS' : 'DRAW'}
                                    {drawPenalty > 0 && !me?.hasDrawn && <div style={{ position: 'absolute', top: -10, right: -10, background: '#ef4444', padding: '2px 6px', borderRadius: 8, fontSize: '0.7rem' }}>+{drawPenalty}</div>}
                                </div>

                                {/* Discard Pile */}
                                <div style={{ transform: 'rotate(-5deg)' }}>
                                    {topCard ? <CardView card={topCard} extraClass={styles.cardInHand} /> : <div style={{ width: 70, height: 105, border: '2px dashed #cbd5e0', borderRadius: 12 }} />}
                                </div>
                            </div>
                        )}

                        {/* Status/Penalty Info */}
                        {drawPenalty > 0 && !gameState.winner && (
                            <div style={{ position: 'absolute', top: -40, background: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 'bold' }}>
                                +{drawPenalty} 枚 累積中
                            </div>
                        )}
                        {(gameState.currentColor && !gameState.winner && gameState.status !== 'finished') && (
                            <div style={{
                                position: 'absolute', bottom: -40,
                                padding: '4px 16px', background: COLORS[gameState.currentColor],
                                color: 'white', borderRadius: 20, fontWeight: '800', fontSize: '0.8rem'
                            }}>
                                {gameState.currentColor.toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                <PlayerInSlot player={slots[3]} slotClass={styles.slotRight} />
                <PlayerInSlot player={slots[0]} slotClass={styles.slotBottom} />
            </div>

            {/* Result Screen Overlay */}
            {gameState.status === 'finished' && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    zIndex: 200, color: 'white'
                }}>
                    <h1 style={{ fontSize: '3rem', marginBottom: '20px', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>Results</h1>

                    <div style={{
                        background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '30px',
                        width: '90%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        {Array.from(gameState.players.values())
                            // @ts-ignore
                            .sort((a: any, b: any) => (a.rank || 99) - (b.rank || 99))
                            .map((p: any, i: number) => (
                                <div key={p.sessionId} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '15px 20px', marginBottom: '10px',
                                    background: i === 0 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: 15, fontWeight: 'bold'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                        <span style={{ fontSize: '1.5rem', width: 30 }}>
                                            {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : '4th'}
                                        </span>
                                        <span style={{ fontSize: '1.2rem' }}>{p.name}</span>
                                    </div>
                                    {p.rank === 0 && <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Retiring...</span>}
                                </div>
                            ))}
                    </div>

                    <div style={{ marginTop: 40, display: 'flex', gap: 20 }}>
                        <button
                            onClick={() => room?.send("restartGame")}
                            style={{
                                padding: '15px 40px', fontSize: '1.2rem', fontWeight: 'bold',
                                background: '#22c55e', color: 'white', border: 'none', borderRadius: 30,
                                cursor: 'pointer', boxShadow: '0 5px 15px rgba(34, 197, 94, 0.4)'
                            }}
                        >
                            もう一度遊ぶ
                        </button>
                        <button
                            onClick={onLeave}
                            style={{
                                padding: '15px 40px', fontSize: '1.2rem', fontWeight: 'bold',
                                background: 'transparent', color: '#cbd5e0', border: '2px solid #64748b', borderRadius: 30,
                                cursor: 'pointer'
                            }}
                        >
                            終了する
                        </button>
                    </div>
                </div>
            )}

            {/* Waiting for others Overlay */}
            {(me?.rank > 0 && gameState.status === 'playing') && (
                <div style={{
                    position: 'absolute', top: 100, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.6)', padding: '10px 30px', borderRadius: 20,
                    color: 'white', fontWeight: 'bold', zIndex: 100,
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: 5 }}>🎉 FINISHED! 🎉</div>
                    <div style={{ fontSize: '1rem', opacity: 0.9 }}>順位: {me.rank}位</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>他のプレイヤーを待っています...</div>
                </div>
            )}

            {/* Play Button Overlay */}
            {isMyTurn && selectedIndices.length > 0 && (
                <div className={styles.playButtonContainer}>
                    <button
                        onClick={handlePlaySubmit}
                        style={{
                            padding: '12px 32px', background: '#22c55e', color: 'white',
                            border: 'none', borderRadius: 30, fontSize: '1.1rem', fontWeight: '800',
                            boxShadow: '0 8px 20px rgba(34, 197, 94, 0.4)', cursor: 'pointer'
                        }}
                    >
                        {selectedIndices.length}枚 出す
                    </button>
                </div>
            )}

            {/* Sort Buttons */}
            <div style={{ position: 'absolute', bottom: 170, right: 20, zIndex: 120, display: 'flex', gap: 10 }}>
                <button
                    onClick={() => {
                        room?.send("sortHand", { type: 'color' });
                        setSelectedIndices([]);
                    }}
                    style={{
                        padding: '8px 16px', background: 'white', border: '1px solid #cbd5e0',
                        borderRadius: 20, fontWeight: 'bold', fontSize: '0.8rem', color: '#475569',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)', cursor: 'pointer'
                    }}
                >
                    🎨 色順
                </button>
                <button
                    onClick={() => {
                        room?.send("sortHand", { type: 'number' });
                        setSelectedIndices([]);
                    }}
                    style={{
                        padding: '8px 16px', background: 'white', border: '1px solid #cbd5e0',
                        borderRadius: 20, fontWeight: 'bold', fontSize: '0.8rem', color: '#475569',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)', cursor: 'pointer'
                    }}
                >
                    123 数字順
                </button>
            </div>

            {/* My Hand */}
            <div
                className={`${styles.handSection} ${isMyTurn ? styles.handActive : ''}`}
                ref={scrollContainerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                {myHand.map((card, i) => {
                    const selectionIndex = selectedIndices.indexOf(i);
                    const isSelected = selectionIndex >= 0;

                    return (
                        <div key={i} className={`${styles.cardWrapper} ${isSelected ? styles.cardSelected : ''}`}>
                            <CardView
                                card={card}
                                selected={isSelected}
                                disabled={!isMyTurn}
                                onClick={() => {
                                    if (!isDragging) toggleSelect(i);
                                }}
                                extraClass={styles.cardInHand}
                            />
                            {isSelected && (
                                <div className={styles.selectionBadge}>
                                    {selectionIndex + 1}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {showColorPicker && (
                <div className={styles.colorPickerOverlay}>
                    <div className={styles.colorPickerModal}>
                        <div style={{ width: '100%', textAlign: 'center', fontWeight: '800', fontSize: '1.2rem', color: '#1e293b' }}>カラーチェンジ</div>
                        <div className={styles.colorPickerGrid}>
                            {['red', 'blue', 'green', 'yellow'].map(c => (
                                <div
                                    key={c}
                                    onClick={() => handleColorPick(c)}
                                    style={{
                                        width: 70, height: 70,
                                        background: COLORS[c],
                                        borderRadius: '20px', cursor: 'pointer',
                                        border: 'none',
                                        boxShadow: '0 8px 15px rgba(0,0,0,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                    className={styles.colorBox}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RainbowGame;
