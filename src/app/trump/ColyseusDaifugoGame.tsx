import React, { useEffect, useState, useRef } from 'react';
import { Client, Room } from 'colyseus.js';
import { TrumpTable } from '@/components/trump/TrumpTable';
import { DaifugoEngine } from '@/lib/trump/daifugo/engine';
import { Card, TrumpPlayer } from '@/lib/trump/types'; // UI types
import { IconBack, IconUser, IconSettings } from '@/components/Icons';
import styles from './page.module.css';
import { db } from '@/lib/firebase';
import { ref, set, onDisconnect, remove, update } from 'firebase/database';

// Type definition for Schema (Simplified mapping)
interface SchemaCard {
    suit: string;
    rank: string;
}

interface Props {
    roomId?: string; // If joining existing
    options?: any;   // If creating
    onLeave: () => void;
    myPlayerId: string;
    myPlayerName: string;
}

export function ColyseusDaifugoGame({ roomId, options, onLeave, myPlayerId, myPlayerName }: Props) {
    const [room, setRoom] = useState<Room | null>(null);
    const [players, setPlayers] = useState<TrumpPlayer[]>([]);
    const [hands, setHands] = useState<Record<string, Card[]>>({});
    const [fieldCards, setFieldCards] = useState<Card[]>([]);
    const [turnPlayerId, setTurnPlayerId] = useState<string>("");
    const [isRevolution, setIsRevolution] = useState(false);
    const [is11Back, setIs11Back] = useState(false);
    const [lastMove, setLastMove] = useState<{ playerId: string; cards: Card[] } | null>(null);

    // Server Rules State
    const [rules, setRules] = useState({
        revolution: true,
        is8Cut: true,
        is11Back: true,
        isStaircase: false,
        isShibari: false,
        isSpade3: false,
        jokerCount: 2
    });

    // Local State
    const [selectedCards, setSelectedCards] = useState<Card[]>([]);
    const [engine] = useState(() => new DaifugoEngine());

    const clientRef = useRef<Client | null>(null);

    // Initial Connection
    useEffect(() => {
        const client = new Client(process.env.NEXT_PUBLIC_COLYSEUS_URL || "ws://localhost:2567");
        clientRef.current = client;

        const connect = async () => {
            try {
                let r: Room;
                if (roomId) {
                    // Try to join specified room
                    r = await client.joinById(roomId, { playerId: myPlayerId, name: myPlayerName });
                } else if (options?.roomId) {
                    // Join via options (from page.tsx input)
                    r = await client.joinById(options.roomId, { playerId: myPlayerId, name: myPlayerName });
                } else {
                    // Create new room
                    r = await client.create("daifugo_room", { ...options, playerId: myPlayerId, name: myPlayerName });
                }
                setRoom(r);
                setupRoomListeners(r);

                // --- Firebase Integration for Room Listing ---
                updateFirebaseRoom(r, myPlayerId, players);

            } catch (e: any) {
                console.error("Colyseus Join/Create Error:", e);
                if (e instanceof Error) {
                    console.error("Error details:", e.message, e.stack);
                }
                alert(`ルームに参加できませんでした。\nエラー: ${e?.message || e}\nサーバーの状態を確認してください。`);
                onLeave();
            }
        };
        connect();

        return () => {
            if (clientRef.current && room) {
                room.leave();
            }
        };
    }, []); // eslint-disable-line

    // Firebase Sync Effect (Keep this separate or integrate? Keep separate for specific updates)
    useEffect(() => {
        if (!room || players.length === 0) return;
        updateFirebaseRoom(room, myPlayerId, players);

        const rId = room.roomId;
        const amHost = players.find(p => p.id === myPlayerId)?.role === 'host';

        return () => {
            if (amHost && rId) {
                const refToRemove = ref(db, `trump_rooms/${rId}`);
                remove(refToRemove).catch(() => { });
            }
        };
    }, [room, players, rules, myPlayerId]);

    const updateFirebaseRoom = (r: Room, mId: string, currentPlayers: TrumpPlayer[]) => {
        const amHost = currentPlayers.find(p => p.id === mId)?.role === 'host';
        const rId = r.roomId;
        console.log("Firebase Update: attempting...", { rId, mId, amHost });

        if (amHost && rId) {
            const roomRef = ref(db, `trump_rooms/${rId}`);
            const roomData = {
                roomId: rId,
                hostId: mId,
                gameType: 'daifugo',
                status: r.state.status || 'waiting',
                players: currentPlayers.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}),
                createdAt: Date.now(),
                rules: rules
            };
            set(roomRef, roomData).catch(err => console.warn("Firebase update failed (Permissions?):", err));
            onDisconnect(roomRef).remove().catch(err => console.warn("onDisconnect failed:", err));
        }
    };

    const setupRoomListeners = (r: Room) => {
        // Use central onStateChange for all data to avoid "listen is not a function" errors
        r.onStateChange((state: any) => {
            // 1. Primitives
            setTurnPlayerId(state.turnPlayerId);
            setIsRevolution(state.isRevolution);
            setIs11Back(state.is11Back);

            // 2. Rules
            setRules({
                revolution: state.ruleRevolution,
                is8Cut: state.rule8Cut,
                is11Back: state.rule11Back,
                isStaircase: state.ruleStaircase,
                isShibari: state.ruleShibari,
                isSpade3: state.ruleSpade3,
                jokerCount: state.jokerCount
            });

            // 3. Last Move
            if (state.lastMovePlayerId) {
                const lmCards: Card[] = [];
                state.lastMoveCards.forEach((c: any) => lmCards.push({ suit: c.suit, rank: c.rank }));
                setLastMove({ playerId: state.lastMovePlayerId, cards: lmCards });
            } else {
                setLastMove(null);
            }

            // 4. Field Cards
            const fCards: Card[] = [];
            state.fieldCards.forEach((c: any) => fCards.push({ suit: c.suit, rank: c.rank }));
            setFieldCards(fCards);

            // 5. Players & Hands
            const pList: TrumpPlayer[] = [];
            const newHands: Record<string, Card[]> = {};

            state.players.forEach((p: any, key: string) => {
                pList.push({
                    id: p.id,
                    name: p.name,
                    role: p.role,
                    isReady: p.isReady,
                    isAi: p.isAi,
                    sessionId: key, // Use Colyseus session ID as unique key
                    hand: []
                });

                const pHand: Card[] = [];
                // ... (rest of hand parsing)
                p.hand.forEach((c: any) => pHand.push({ suit: c.suit, rank: c.rank }));
                newHands[p.id] = pHand;
            });

            // Sort players optionally? Or keep order from map? 
            // MapSchema order is insertion order usually.
            setPlayers(pList);
            setHands(newHands);
        });

        r.onMessage("error", (msg: string) => alert(msg));
    };

    // Game Logic Wrappers
    const handleCardClick = (card: Card) => {
        setSelectedCards(prev => {
            const exists = prev.some(c => c.suit === card.suit && c.rank === card.rank);
            if (exists) {
                return prev.filter(c => !(c.suit === card.suit && c.rank === card.rank));
            } else {
                return [...prev, card];
            }
        });
    };

    const executePlay = () => {
        room?.send("playCard", { cards: selectedCards });
        setSelectedCards([]);
    };

    const executePass = () => {
        room?.send("pass");
        setSelectedCards([]);
    };

    const startGame = () => {
        room?.send("startGame");
    };

    // Calculate Playable Cards
    const playableCards = React.useMemo(() => {
        if (!room || turnPlayerId !== myPlayerId) return [];

        const myHand = hands[myPlayerId] || [];
        const currentRules = { // Use local synced rules or server state
            isShibari: room.state.ruleShibari,
            isSpade3: room.state.ruleSpade3,
            isStaircase: room.state.ruleStaircase,
            is11Back: room.state.rule11Back
        };
        const isShibariActive = room.state.isShibari;

        return myHand.filter(card =>
            engine.isCardPlayable(card, myHand, isRevolution, is11Back, lastMove, currentRules, isShibariActive)
        );
    }, [hands, myPlayerId, turnPlayerId, lastMove, isRevolution, is11Back, room?.state?.isShibari, room?.state?.ruleShibari]);

    // Render
    if (!room) return <div className={styles.loading}>接続中...</div>;

    const amHost = players.find(p => p.id === myPlayerId)?.role === 'host';

    // Lobby State Rendering (Waiting Room)
    if (room.state.status === 'waiting') {
        const currentId = room.roomId;
        return (
            <main className={styles.main}>
                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyHeader}>
                        <h1 className={styles.title}>ルーム待機中</h1>
                        <div className={styles.roomIdBox}>
                            <span className={styles.roomIdLabel}>ID:</span>
                            <span className={styles.roomIdValue}>{currentId}</span>
                        </div>
                    </div>

                    <div className={styles.lobbyContent}>
                        {/* Players List */}
                        <div className={styles.playersSection}>
                            <h3>参加者 ({players.length}/6)</h3>
                            <div className={styles.playersList}>
                                {players.map(p => (
                                    <div key={p.sessionId || p.id} className={styles.playerCard}>
                                        <IconUser size={20} />
                                        <span className={styles.playerName}>{p.name}</span>
                                        {p.role === 'host' && <span className={styles.hostBadge}>HOST</span>}
                                        {p.id === myPlayerId && <span className={styles.meBadge}>YOU</span>}
                                    </div>
                                ))}
                                {[...Array(Math.max(0, 6 - players.length))].map((_, i) => (
                                    <div key={`empty-${i}`} className={`${styles.playerCard} ${styles.emptySlot}`}>
                                        <span>待機中...</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rules Config (Host Only) */}
                        <div className={styles.rulesSection}>
                            <h3>ルール設定 {amHost ? '(変更可)' : '(ホストのみ変更可)'}</h3>
                            <div className={styles.rulesGrid}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={rules.revolution} disabled={!amHost}
                                        onChange={e => room.send('updateRules', { revolution: e.target.checked })} />
                                    革命
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={rules.is8Cut} disabled={!amHost}
                                        onChange={e => room.send('updateRules', { is8Cut: e.target.checked })} />
                                    8切り
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={rules.is11Back} disabled={!amHost}
                                        onChange={e => room.send('updateRules', { is11Back: e.target.checked })} />
                                    11バック
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={rules.isStaircase} disabled={!amHost}
                                        onChange={e => room.send('updateRules', { isStaircase: e.target.checked })} />
                                    階段
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={rules.isShibari} disabled={!amHost}
                                        onChange={e => room.send('updateRules', { isShibari: e.target.checked })} />
                                    縛り
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={rules.isSpade3} disabled={!amHost}
                                        onChange={e => room.send('updateRules', { isSpade3: e.target.checked })} />
                                    スペ3返し
                                </label>
                            </div>
                            <div className={styles.rulesRow} style={{ marginTop: '10px' }}>
                                <label className={styles.inputLabel}>
                                    ジョーカー枚数:
                                    <input
                                        type="number"
                                        min="0"
                                        max="4"
                                        value={rules.jokerCount}
                                        disabled={!amHost}
                                        onChange={e => room.send('updateRules', { jokerCount: parseInt(e.target.value) })}
                                        className={styles.numInput}
                                        style={{ marginLeft: '10px', width: '50px' }}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className={styles.controls}>
                        {amHost ? (
                            <button onClick={startGame} className={styles.startBtn} disabled={players.length < 2 && process.env.NODE_ENV === 'production'}>
                                {players.length < 2 ? '人数不足' : 'ゲーム開始'}
                            </button>
                        ) : (
                            <div className={styles.waitingMessage}>
                                ホストがゲームを開始するのを待っています...
                            </div>
                        )}
                        <button onClick={() => { room.leave(); onLeave(); }} className={styles.leaveBtn}>退出</button>
                    </div>
                </div>
            </main >
        );
    }

    const isMyTurn = turnPlayerId === myPlayerId;

    return (
        <main className={styles.main}>
            <div className={styles.gameHeader}>
                <button onClick={() => { room.leave(); onLeave(); }} className={styles.backButton}>
                    <IconBack size={20} /> 終了
                </button>
                <div className={styles.gameInfo}>
                    ルームID: {room.roomId}
                </div>
            </div>

            <div className={styles.tableContainer}>
                <TrumpTable
                    players={players}
                    myId={myPlayerId}
                    hands={hands}
                    fieldCards={fieldCards}
                    turnPlayerId={turnPlayerId}
                    onCardClick={handleCardClick}
                    selectedCards={selectedCards}
                    playableCards={playableCards}
                    isRevolution={isRevolution}
                />
            </div>

            <div className={styles.actionControls}>
                {isMyTurn && (
                    <>
                        <button onClick={executePlay} className={styles.actionBtn} disabled={selectedCards.length === 0}>
                            出す
                        </button>
                        <button onClick={executePass} className={`${styles.actionBtn} ${styles.passBtn}`}>
                            パス
                        </button>
                    </>
                )}
            </div>
        </main>
    );
}
