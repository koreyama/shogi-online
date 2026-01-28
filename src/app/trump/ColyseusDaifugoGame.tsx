import React, { useEffect, useState, useRef } from 'react';
import { Client, Room } from 'colyseus.js';
import { AnimatePresence, motion } from 'framer-motion'; // Added AnimatePresence, motion
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
        isSpade3: false,
        jokerCount: 2,
        is5Skip: false,
        is7Watashi: false,
        isQBomber: false,
        miyakoOchi: true,
        is10Sute: false
    });

    // Local State
    const [selectedCardsList, setSelectedCardsList] = useState<Card[]>([]);
    const [selectedRanks, setSelectedRanks] = useState<string[]>([]); // ADDED for Q Bomber
    const [exchangePendingCount, setExchangePendingCount] = useState<number>(0);
    const [gameState, setGameState] = useState<string>('waiting');
    const [finishedPlayers, setFinishedPlayers] = useState<string[]>([]);
    const [engine] = useState(() => new DaifugoEngine());

    // Pending Actions State
    const [pendingAction, setPendingAction] = useState<string>('');
    const [pendingActionPlayerId, setPendingActionPlayerId] = useState<string>('');
    const [pendingActionCount, setPendingActionCount] = useState<number>(0);

    // Visual Effects State
    const [effectEvent, setEffectEvent] = useState<{ type: string, message: string, id: number } | null>(null);
    const lastEventTimestampRef = useRef<number>(0);

    const clientRef = useRef<Client | null>(null);
    const roomRef = useRef<Room | null>(null);

    // Initial Connection
    useEffect(() => {
        let isMounted = true;
        const client = new Client(process.env.NEXT_PUBLIC_COLYSEUS_URL || "ws://localhost:2567");
        clientRef.current = client;

        const connect = async () => {
            try {
                // If we already have a room, don't join again
                if (roomRef.current) return;

                // Resolve Player Name from Firebase Profile (Firestore) - Fix for "Player name not changing"
                let playerName = myPlayerName;
                try {
                    const { getUserProfile } = await import('@/lib/firebase/users');
                    const profile = await getUserProfile(myPlayerId);
                    if (profile?.displayName) {
                        playerName = profile.displayName;
                    }
                } catch (e) {
                    console.warn("Failed to fetch user profile:", e);
                }

                let r: Room;
                if (roomId) {
                    r = await client.joinById(roomId, { ...options, playerId: myPlayerId, name: playerName });
                } else if (options?.roomId) {
                    // FIX: Spread options to include password!
                    r = await client.joinById(options.roomId, { ...options, playerId: myPlayerId, name: playerName });
                } else {
                    r = await client.create("daifugo_room", { ...options, playerId: myPlayerId, name: playerName });
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

                const isNotFound = e?.message?.includes('not found') || e?.code === 404;

                if (isNotFound) {
                    console.warn("Colyseus Join Error (Room Not Found):", e);
                    alert("指定されたルームが見つかりませんでした。\nすでに解散している可能性があります。");
                } else if (e instanceof ProgressEvent || e.type === 'error') {
                    console.warn("Colyseus Connection Error:", e);
                    alert("サーバーへの接続に失敗しました。\nサーバーが再起動中か、ネットワークに問題があります。");
                } else {
                    console.warn("Colyseus Join/Create Error:", e);
                    alert(`ルームに参加できませんでした。\nエラー: ${e?.message || '不明なエラー'}\nサーバーの状態を確認してください。`);
                }
                onLeave();
            }
        };
        connect();

        return () => {
            isMounted = false;
            if (roomRef.current) {
                console.log("Cleaning up Colyseus connection...");
                roomRef.current.leave();
                roomRef.current = null;
            }
        };
    }, []); // eslint-disable-line

    // Refs for Cleanup
    const cleanupRef = useRef<{ roomId: string, isHost: boolean } | null>(null);

    // Firebase Sync Effect
    useEffect(() => {
        if (!room || players.length === 0) return;

        const amHost = players.find(p => p.id === myPlayerId)?.role === 'host';
        const rId = room.roomId;

        // Update Cleanup Ref
        cleanupRef.current = { roomId: rId, isHost: amHost };

        updateFirebaseRoom(room, myPlayerId, players);


        // We do NOT remove the room here. Cleanup happens on unmount or explicit leave.
    }, [room, players, rules, myPlayerId, options]);

    // Unmount Cleanup Effect
    useEffect(() => {
        return () => {
            const current = cleanupRef.current;
            if (current && current.isHost && current.roomId) {
                console.log("Unmounting: removing room from Firebase", current.roomId);
                const refToRemove = ref(db, `trump_rooms/${current.roomId}`);
                remove(refToRemove).catch(err => console.warn("Failed to remove room on unmount:", err));
            }
        };
    }, []);


    const updateFirebaseRoom = (r: Room, mId: string, currentPlayers: TrumpPlayer[]) => {
        const amHost = currentPlayers.find(p => p.id === mId)?.role === 'host';
        const rId = r.roomId;
        console.log("Firebase Update Attempt:", { rId, mId, amHost, status: r.state.status, playerCount: currentPlayers.length }); // DEBUG

        if (amHost && rId) {
            const roomRef = ref(db, `trump_rooms/${rId}`);
            const roomData = {
                roomId: rId,
                hostId: mId,
                gameType: 'daifugo',
                status: r.state.status || 'waiting',
                players: currentPlayers.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}),
                createdAt: Date.now(),
                rules: rules,
                isLocked: !!(options?.password)
            };
            console.log("Writing to Firebase:", roomData); // DEBUG
            set(roomRef, roomData).catch(err => console.warn("Firebase update failed (Permissions?):", err));
            onDisconnect(roomRef).remove().catch(err => console.warn("onDisconnect failed:", err));
        }
    };

    const setupRoomListeners = (r: Room) => {
        r.onStateChange((state: any) => {
            // 1. Primitives
            setTurnPlayerId(state.turnPlayerId);
            setIsRevolution(state.isRevolution);
            setIs11Back(state.is11Back);
            setGameState(state.status);
            // finishedPlayers is ArraySchema - convert to plain array
            const fp: string[] = [];
            if (state.finishedPlayers && typeof state.finishedPlayers.forEach === 'function') {
                state.finishedPlayers.forEach((id: string) => fp.push(id));
            }
            setFinishedPlayers(fp);

            // Pending Actions
            setPendingAction(state.pendingAction || '');
            setPendingActionPlayerId(state.pendingActionPlayerId || '');
            setPendingActionCount(state.pendingActionCount || 0);

            // Exchange State
            if (state.exchangePending) {
                // MapSchema access: try .get() first, fallback to forEach iteration
                let myPending = 0;
                if (typeof state.exchangePending.get === 'function') {
                    myPending = state.exchangePending.get(myPlayerId) ?? 0;
                } else if (typeof state.exchangePending.forEach === 'function') {
                    state.exchangePending.forEach((val: number, key: string) => {
                        if (key === myPlayerId) myPending = val;
                    });
                } else {
                    // Fallback for plain object (shouldn't happen but safe)
                    myPending = state.exchangePending[myPlayerId] ?? 0;
                }
                setExchangePendingCount(myPending);
            }

            // 2. Rules
            setRules({
                revolution: state.ruleRevolution,
                is8Cut: state.rule8Cut,
                is11Back: state.rule11Back,
                isSpade3: state.ruleSpade3,
                jokerCount: state.jokerCount,
                is5Skip: state.rule5Skip,
                is7Watashi: state.rule7Watashi,
                isQBomber: state.ruleQBomber,
                miyakoOchi: state.ruleMiyakoOchi,
                is10Sute: state.rule10Sute
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
                    sessionId: key,
                    hand: [],
                    rank: p.rank,
                    score: p.score,
                    lastScoreChange: p.lastScoreChange
                });

                const pHand: Card[] = [];
                p.hand.forEach((c: any) => pHand.push({ suit: c.suit, rank: c.rank }));

                // Sort hand using engine
                // FORCE STANDARD SORT: User requested (3 -> 2 -> Joker) always, regardless of Revolution/11Back
                const sortedHand = engine.sortHand(pHand, false, false);
                newHands[p.id] = sortedHand;
            });

            // Sort players by sessionId to ensure consistent order (Clockwise)
            pList.sort((a, b) => (a.sessionId || '').localeCompare(b.sessionId || ''));
            setPlayers(pList);
            setHands(newHands);

            // 6. Events (Visual Effects)
            if (state.lastEvent && state.lastEvent.timestamp > lastEventTimestampRef.current) {
                lastEventTimestampRef.current = state.lastEvent.timestamp;

                const eventType = state.lastEvent.type;
                const eventPlayerId = state.lastEvent.playerId;

                // For rank events, only show to the affected player
                if (eventType === 'rank' && eventPlayerId !== myPlayerId) {
                    // Don't show rank effects to other players
                    return;
                }
                // Miyako-ochi should be visible to everyone

                setEffectEvent({
                    type: eventType,
                    message: state.lastEvent.message,
                    id: state.lastEvent.timestamp
                });
                // Auto-clear logic handled by AnimatePresence or local timeout if needed, 
                // but setting a new object triggers the animation key.
                setTimeout(() => setEffectEvent(null), 2500);
            }
        });

        r.onMessage("error", (msg: string) => alert(msg));

        // Handle direct broadcast events (won't be overwritten like state)
        r.onMessage("gameEvent", (event: { type: string, message: string, playerId: string, timestamp: number }) => {
            console.log('[DEBUG] Received gameEvent:', event);

            const eventType = event.type;
            const eventPlayerId = event.playerId;

            // For rank events, only show to the affected player
            if (eventType === 'rank' && eventPlayerId !== myPlayerId) {
                return;
            }
            // Miyako-ochi and other events visible to everyone

            setEffectEvent({
                type: eventType,
                message: event.message,
                id: event.timestamp
            });
            setTimeout(() => setEffectEvent(null), 2500);
        });
    };

    // Helper for Effects
    // POLISH: Removed emojis, using sleek text colors for gradient/shadow effects in CSS
    const getEffectContent = (type: string, message: string = "") => {
        if (type === 'rank') {
            switch (message) {
                case '大富豪': return { text: "大富豪", color: "#FFD700", gradient: "linear-gradient(to bottom, #FFD700, #B8860B)" };
                case '富豪': return { text: "富豪", color: "#C0C0C0", gradient: "linear-gradient(to bottom, #E0E0E0, #A9A9A9)" };
                case '平民': return { text: "平民", color: "#87CEEB", gradient: "linear-gradient(to bottom, #87CEEB, #4682B4)" };
                case '貧民': return { text: "貧民", color: "#CD7F32", gradient: "linear-gradient(to bottom, #CD7F32, #8B4513)" };
                case '大貧民': return { text: "大貧民", color: "#A0A0A0", gradient: "linear-gradient(to bottom, #696969, #000000)" };
                default: return { text: message, color: "#FFFFFF", gradient: "linear-gradient(to bottom, #FFFFFF, #CCCCCC)" };
            }
        }
        switch (type) {
            case '8cut': return { text: "8切り", color: "#EF4444", gradient: "linear-gradient(to bottom, #EF4444, #B91C1C)" };
            case 'spade3': return { text: "スペ3返し", color: "#1E3A5F", gradient: "linear-gradient(to bottom, #1E3A5F, #0A1929)" };
            case 'revolution': return { text: "革命", color: "#F59E0B", gradient: "linear-gradient(to bottom, #F59E0B, #D97706)" };
            case '11back': return { text: "11バック", color: "#3B82F6", gradient: "linear-gradient(to bottom, #3B82F6, #1D4ED8)" };
            case 'miyakoochi': return { text: "都落ち", color: "#9333EA", gradient: "linear-gradient(to bottom, #9333EA, #581C87)" };
            default: return { text: type, color: "#FFFFFF", gradient: "linear-gradient(to bottom, #FFFFFF, #999999)" };
        }
    };

    const isSameCard = (a: Card, b: Card) => a.suit === b.suit && a.rank === b.rank;

    // Game Logic Wrappers
    const handleCardClick = (card: Card, index: number) => {
        setSelectedCardsList(prev => {
            const exists = prev.some(c => isSameCard(c, card));
            if (exists) {
                // If duplicates exist in hand (e.g. 2 Jokers), we need to be careful.
                // But generally removing by value is fine. If I selected 2 Jokers, and click one, I remove one.
                // Simple filter removes ALL matching cards. That's bad for duplicates!
                // We should find index of first match and remove it.
                const newSelection = [...prev];
                const removeIdx = newSelection.findIndex(c => isSameCard(c, card));
                if (removeIdx !== -1) {
                    newSelection.splice(removeIdx, 1);
                }
                return newSelection;
            } else {
                return [...prev, card];
            }
        });
    };

    // getSelectedCardsObjects is now just returning the state
    const getSelectedCardsObjects = () => {
        return selectedCardsList;
    };

    const executePlay = () => {
        room?.send("playCard", { cards: selectedCardsList });
        setSelectedCardsList([]);
    };

    const executePass = () => {
        if (!lastMove) return; // Should be disabled in UI, but safety check
        room?.send("pass");
        setSelectedCardsList([]);
    };

    const startGame = () => {
        room?.send("startGame");
    };

    const handleExchangeSubmit = () => {
        if (selectedCardsList.length !== exchangePendingCount) {
            alert(`${exchangePendingCount}枚選択してください`);
            return;
        }
        room?.send("exchangeCards", { cards: selectedCardsList });
        setSelectedCardsList([]);
    };

    const handleNextGame = () => {
        room?.send("startNextGame");
        setSelectedCardsList([]);
    };

    const handleEndGame = () => {
        room?.send("endGame");
    };

    const handle7WatashiSubmit = () => {
        const myHand = hands[myPlayerId] || [];
        const required = Math.min(pendingActionCount, myHand.length);
        if (selectedCardsList.length !== required) {
            alert(`${required}枚選択してください`);
            return;
        }
        room?.send("7watashiPass", { cards: selectedCardsList });
        setSelectedCardsList([]);
    };

    const handleQBomberRankToggle = (rank: string) => {
        setSelectedRanks(prev => {
            const current = prev || [];
            if (current.includes(rank)) return current.filter(r => r !== rank);
            if (current.length < pendingActionCount) return [...current, rank];
            return current;
        });
    };

    const handleQBomberSubmit = () => {
        if (selectedRanks.length !== pendingActionCount) return;
        room?.send("qBomberSelect", { ranks: selectedRanks });
        setSelectedRanks([]);
    };

    const handle10SuteSubmit = () => {
        if (selectedCardsList.length !== pendingActionCount) {
            alert(`${pendingActionCount}枚選択してください`);
            return;
        }
        room?.send("10suteDiscard", { cards: selectedCardsList });
        setSelectedCardsList([]);
    };

    const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

    // Calculate Playable Cards
    const playableCards = React.useMemo(() => {
        const myHand = hands[myPlayerId] || [];

        // Allow selection during exchange phase
        if (gameState === 'exchanging') {
            return myHand; // All cards are selectable/playable for exchange UI
        }

        // Allow selection for 7 watashi / 10 sute
        if ((pendingAction === '7watashi' || pendingAction === '10sute') && pendingActionPlayerId === myPlayerId) {
            return myHand;
        }

        // Allow checking playable status even when it's not my turn
        // User Request: Only dim cards on my turn. Otherwise show all full opacity.
        if (gameState === 'playing' && turnPlayerId !== myPlayerId && !pendingAction) {
            return myHand;
        }

        if (!room) return [];

        const currentRules = { // Use local synced rules or server state
            isShibari: false,
            isSpade3: room.state.ruleSpade3,
            isStaircase: false,
            is11Back: room.state.rule11Back
        };
        const isShibariActive = false;

        return myHand.filter(card =>
            engine.isCardPlayable(card, myHand, isRevolution, is11Back, lastMove, currentRules, isShibariActive)
        );
    }, [hands, myPlayerId, turnPlayerId, lastMove, isRevolution, is11Back, room?.state?.ruleShibari, gameState, pendingAction, pendingActionPlayerId]);

    // Render
    if (!room) return <div className={styles.loading}>接続中...</div>;

    const amHost = players.find(p => p.id === myPlayerId)?.role === 'host';
    // Hide Play/Pass controls if pending action exists
    const isMyTurn = turnPlayerId === myPlayerId && !pendingAction;

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
                                    <input type="checkbox" checked={rules.isSpade3} disabled={!amHost}
                                        onChange={e => room.send('updateRules', { isSpade3: e.target.checked })} />
                                    スペ3返し
                                </label>
                                {/* Local Rules */}
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={rules.is5Skip} disabled={!amHost}
                                        onChange={e => room.send('updateRules', { is5Skip: e.target.checked })} />
                                    5スキップ
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={rules.is7Watashi} disabled={!amHost}
                                        onChange={e => room.send('updateRules', { is7Watashi: e.target.checked })} />
                                    7渡し
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={rules.isQBomber} disabled={!amHost}
                                        onChange={e => room.send('updateRules', { isQBomber: e.target.checked })} />
                                    Qボンバー
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={rules.miyakoOchi} disabled={!amHost}
                                        onChange={e => room.send('updateRules', { miyakoOchi: e.target.checked })} />
                                    都落ち
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={rules.is10Sute} disabled={!amHost}
                                        onChange={e => room.send('updateRules', { is10Sute: e.target.checked })} />
                                    10捨て
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
                                        onChange={e => {
                                            const val = Math.min(4, Math.max(0, parseInt(e.target.value) || 0));
                                            room.send('updateRules', { jokerCount: val });
                                        }}
                                        className={styles.numInput}
                                        style={{ marginLeft: '10px', width: '50px' }}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className={styles.controls}>
                        {amHost ? (
                            <button onClick={startGame} className={styles.startBtn} disabled={players.length < 4}>
                                {players.length < 4 ? '4人揃うまで待機中' : 'ゲーム開始'}
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

    return (
        <main className={styles.gameMain}>
            <div className={styles.gameHeader}>
                <button onClick={() => { room.leave(); onLeave(); }} className={styles.backButton}>
                    <IconBack size={20} /> 終了
                </button>
                <div className={styles.gameInfo}>
                    ルームID: {room.roomId}
                </div>
            </div>

            <div className={styles.gameBody}>
                <TrumpTable
                    players={players}
                    myId={myPlayerId}
                    hands={hands}
                    fieldCards={fieldCards}
                    turnPlayerId={turnPlayerId}
                    onCardClick={handleCardClick}
                    selectedCards={selectedCardsList} // Pass Card objects directly
                    playableCards={playableCards}
                    isRevolution={isRevolution}
                />

                {/* Exchange Overlay */}
                {gameState === 'exchanging' && (

                    <div className={styles.notificationBar}>
                        <div className={styles.notificationContent}>
                            <h2>カード交換タイム</h2>
                            {(() => {
                                const myRank = players.find(p => p.id === myPlayerId)?.rank;
                                const rankLabel = myRank === 'daifugo' ? '大富豪' : myRank === 'fugou' ? '富豪' : '';
                                return rankLabel ? <p style={{ fontWeight: 'bold', color: '#FCD34D' }}>あなたは【{rankLabel}】です</p> : null;
                            })()}
                            {exchangePendingCount > 0 ? (
                                <>
                                    <p>下位のプレイヤーに渡すカードを{exchangePendingCount}枚選んでください ({selectedCardsList.length}/{exchangePendingCount})</p>
                                    <button
                                        onClick={handleExchangeSubmit}
                                        disabled={selectedCardsList.length !== exchangePendingCount}
                                        className={styles.actionBtn}
                                    >
                                        交換する
                                    </button>
                                </>
                            ) : (
                                <p>他のプレイヤーの交換を待っています...</p>
                            )}
                        </div>
                    </div>
                )}

                {/* 7 Watashi: Non-blocking Notification Bar */}
                {pendingAction === '7watashi' && pendingActionPlayerId === myPlayerId && (
                    <div className={styles.notificationBar}>
                        <div className={styles.notificationContent}>
                            <h2>7渡し</h2>
                            <p>次のプレイヤーに渡すカードを選んでください ({selectedCardsList.length}/{pendingActionCount})</p>
                            <button
                                onClick={handle7WatashiSubmit}
                                className={styles.actionBtn}
                                disabled={(() => {
                                    const myHand = hands[myPlayerId] || [];
                                    const required = Math.min(pendingActionCount, myHand.length);
                                    return selectedCardsList.length !== required;
                                })()}
                            >
                                渡す
                            </button>
                        </div>
                    </div>
                )}
                {/* 7 Watashi Waiting Message (for others) */}
                {pendingAction === '7watashi' && pendingActionPlayerId !== myPlayerId && (
                    <div className={styles.notificationBar}>
                        <p>他のプレイヤーが7渡しを行っています...</p>
                    </div>
                )}

                {/* Q Bomber Modal (Improved) */}
                {pendingAction === 'qbomber' && (
                    <div className={`${styles.modalOverlay} ${styles.qBomberOverlay}`}>
                        <div className={`${styles.modalContent} ${styles.qBomberContent}`}>
                            {pendingActionPlayerId === myPlayerId ? (
                                <>
                                    <h2 className={styles.modalTitle}>Qボンバー発動</h2>
                                    <p className={styles.modalInstruction}>
                                        指定する数字を <strong>{pendingActionCount}つ</strong> 選んでください
                                    </p>
                                    <div className={styles.rankGrid}>
                                        {ranks.map(r => {
                                            const isSelected = selectedRanks?.includes(r);
                                            return (
                                                <button
                                                    key={r}
                                                    onClick={() => handleQBomberRankToggle(r)}
                                                    className={`${styles.rankBtn} ${isSelected ? styles.rankBtnSelected : ''}`}
                                                >
                                                    {r}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className={styles.modalActions}>
                                        <div className={styles.selectionCount}>
                                            選択中: {selectedRanks?.map(r => <span key={r} className={styles.selectedBadge}>{r}</span>)}
                                        </div>
                                        <button
                                            onClick={handleQBomberSubmit}
                                            className={`${styles.actionBtn} ${styles.confirmBtn}`}
                                            disabled={selectedRanks?.length !== pendingActionCount}
                                        >
                                            決定する
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.waitingMessage}>
                                    <p>他のプレイヤーがQボンバーの対象を選択中...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 10 Sute: Non-blocking Notification Bar */}
                {pendingAction === '10sute' && pendingActionPlayerId === myPlayerId && (
                    <div className={styles.notificationBar}>
                        <div className={styles.notificationContent}>
                            <h2>10捨て</h2>
                            <p>捨てるカードを選んでください ({selectedCardsList.length}/{pendingActionCount})</p>
                            <button
                                onClick={handle10SuteSubmit}
                                className={styles.actionBtn}
                                disabled={selectedCardsList.length !== pendingActionCount}
                            >
                                捨てる
                            </button>
                        </div>
                    </div>
                )}
                {/* 10 Sute Waiting Message */}
                {pendingAction === '10sute' && pendingActionPlayerId !== myPlayerId && (
                    <div className={styles.notificationBar}>
                        <p>他のプレイヤーが10捨てを行っています...</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {gameState === 'finished' && (
                    <ResultModal
                        players={players}
                        finishedPlayers={finishedPlayers}
                        myPlayerId={myPlayerId}
                        isHost={amHost}
                        onNextGame={handleNextGame}
                        onEndGame={handleEndGame}
                    />
                )}
            </AnimatePresence>

            {/* Visual Effects Overlay */}
            <AnimatePresence>
                {effectEvent && (
                    <motion.div
                        key={effectEvent.id}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1.2 }}
                        exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }}
                        transition={{ type: "spring", damping: 12, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 9999,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            pointerEvents: 'none'
                        }}
                    >
                        {(() => {
                            const { text, color, gradient } = getEffectContent(effectEvent.type, effectEvent.message);
                            return (
                                <div style={{
                                    padding: '1.5rem 3rem',
                                    borderRadius: '1rem',
                                    background: 'rgba(0, 0, 0, 0.8)',
                                    border: `2px solid ${color}`,
                                    boxShadow: `0 0 30px ${color}40, 0 0 60px ${color}20`
                                }}>
                                    <span style={{
                                        fontSize: 'clamp(2rem, 10vw, 5rem)',
                                        fontWeight: '900',
                                        background: gradient,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        textShadow: `0 0 20px ${color}`,
                                        whiteSpace: 'nowrap',
                                        fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {text}
                                    </span>
                                </div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={styles.actionControls}>
                {isMyTurn && (
                    <>
                        <button
                            onClick={executePass}
                            className={`${styles.actionBtn} ${styles.passBtn}`}
                            disabled={!lastMove} // Disable pass if I am leading (start of trick)
                        >
                            パス
                        </button>
                        <button onClick={executePlay} className={styles.actionBtn} disabled={selectedCardsList.length === 0}>
                            出す
                        </button>
                    </>
                )}
            </div>
        </main>
    );
}

function ResultModal({
    players,
    finishedPlayers,
    myPlayerId,
    isHost,
    onNextGame,
    onEndGame
}: {
    players: TrumpPlayer[];
    finishedPlayers: string[];
    myPlayerId: string;
    isHost?: boolean;
    onNextGame: () => void;
    onEndGame: () => void;
}) {
    // Sort logic: rely on finishedPlayers order!
    // finishedPlayers[0] is 1st place (Daifugo next)
    const sortedPlayers = [...players].sort((a, b) => {
        const idxA = finishedPlayers.indexOf(a.id);
        const idxB = finishedPlayers.indexOf(b.id);

        // If both finished, lower index (earlier finish) is better
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;

        // If one finished, they rank higher than one who didn't
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;

        // If neither finished (shouldn't happen on finished screen usually, but for incomplete games), fallback
        return (b.score || 0) - (a.score || 0);
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 99999, // Super high z-index
                backdropFilter: 'blur(5px)'
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                style={{
                    backgroundColor: '#111827',
                    padding: 'clamp(1rem, 4vw, 2rem)',
                    borderRadius: 'clamp(0.75rem, 2vw, 1rem)',
                    border: '1px solid #4B5563',
                    maxWidth: '500px',
                    width: '95%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                }}
            >
                <h2 style={{
                    fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
                    background: 'linear-gradient(to right, #FCD34D, #F59E0B)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    ゲーム終了
                </h2>

                <div style={{ marginBottom: '1.5rem', maxHeight: '50vh', overflowY: 'auto' }}>
                    {sortedPlayers.map((p, idx) => {
                        // Calculate the rank for this game based on finish order
                        const finishIndex = finishedPlayers.indexOf(p.id);
                        const totalPlayers = players.length;
                        let gameRank = '平民';
                        let rankColor = '#6B7280'; // gray
                        let rankBg = 'rgba(107, 114, 128, 0.2)';

                        if (finishIndex === 0) {
                            gameRank = '大富豪';
                            rankColor = '#FCD34D';
                            rankBg = 'rgba(252, 211, 77, 0.2)';
                        } else if (finishIndex === 1 && totalPlayers >= 4) {
                            gameRank = '富豪';
                            rankColor = '#60A5FA';
                            rankBg = 'rgba(96, 165, 250, 0.2)';
                        } else if (finishIndex === totalPlayers - 1) {
                            gameRank = '大貧民';
                            rankColor = '#9CA3AF';
                            rankBg = 'rgba(55, 65, 81, 0.4)';
                        } else if (finishIndex === totalPlayers - 2 && totalPlayers >= 4) {
                            gameRank = '貧民';
                            rankColor = '#F87171';
                            rankBg = 'rgba(248, 113, 113, 0.2)';
                        } else {
                            gameRank = '平民';
                        }

                        return (
                            <div
                                key={p.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem 1rem',
                                    marginBottom: '0.4rem',
                                    borderRadius: '0.5rem',
                                    background: p.id === myPlayerId
                                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)'
                                        : 'rgba(31, 41, 55, 0.5)',
                                    border: p.id === myPlayerId ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(75, 85, 99, 0.3)',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem'
                                }}
                            >
                                {/* Left: Rank + Name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: '1 1 auto' }}>
                                    <div style={{
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: '0.4rem',
                                        background: rankBg,
                                        border: `1px solid ${rankColor}`,
                                        color: rankColor,
                                        fontWeight: 'bold',
                                        fontSize: 'clamp(0.7rem, 2.5vw, 0.85rem)',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0
                                    }}>
                                        {gameRank}
                                    </div>
                                    <span style={{
                                        color: 'white',
                                        fontWeight: p.id === myPlayerId ? 'bold' : 'normal',
                                        fontSize: 'clamp(0.85rem, 3vw, 1rem)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {p.name}
                                        {p.id === myPlayerId && <span style={{ color: '#60A5FA', marginLeft: '0.3rem' }}>(自分)</span>}
                                    </span>
                                </div>

                                {/* Right: Score */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                    <span style={{
                                        color: (p.lastScoreChange || 0) > 0 ? '#10B981' : (p.lastScoreChange || 0) < 0 ? '#EF4444' : '#9CA3AF',
                                        fontWeight: 'bold',
                                        fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)'
                                    }}>
                                        {(p.lastScoreChange || 0) > 0 ? '+' : ''}{p.lastScoreChange || 0}
                                    </span>
                                    <span style={{
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: 'clamp(0.85rem, 3vw, 1rem)',
                                        minWidth: '45px',
                                        textAlign: 'right'
                                    }}>
                                        {p.score || 0}pt
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {isHost ? (
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={onEndGame}
                            style={{
                                padding: 'clamp(0.6rem, 2vw, 1rem) clamp(1rem, 4vw, 2rem)',
                                borderRadius: '0.5rem',
                                backgroundColor: '#EF4444',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: 'clamp(0.85rem, 3vw, 1rem)',
                                border: '2px solid #B91C1C',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.5)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#DC2626';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#EF4444';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            終了
                        </button>
                        <button
                            onClick={onNextGame}
                            style={{
                                padding: 'clamp(0.6rem, 2vw, 1rem) clamp(1.5rem, 5vw, 3rem)',
                                borderRadius: '0.5rem',
                                backgroundColor: '#2563EB',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: 'clamp(0.85rem, 3vw, 1rem)',
                                border: '2px solid #1D4ED8',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.5)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#1D4ED8';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#2563EB';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            次のゲームへ
                        </button>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '1.2rem', fontWeight: 'bold' }}>ホストが次の操作を選択中...</p>
                )}
            </motion.div>
        </motion.div>
    );
}

function getRankDisplay(rank: string) {
    switch (rank) {
        case 'daifugo': case '大富豪': return '大富豪';
        case 'fugou': case '富豪': return '富豪';
        case 'heimin': case '平民': return '平民';
        case 'binbou': case '貧民': return '貧民';
        case 'daihinmin': case '大貧民': return '大貧民';
        default: return '－';
    }
}
