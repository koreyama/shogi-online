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

// ... imports unchanged

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
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]); // Changed to indices
    const [exchangePendingCount, setExchangePendingCount] = useState<number>(0);
    const [gameState, setGameState] = useState<string>('waiting');
    const [finishedPlayers, setFinishedPlayers] = useState<string[]>([]);
    const [engine] = useState(() => new DaifugoEngine());

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

                let r: Room;
                if (roomId) {
                    r = await client.joinById(roomId, { playerId: myPlayerId, name: myPlayerName });
                } else if (options?.roomId) {
                    r = await client.joinById(options.roomId, { playerId: myPlayerId, name: myPlayerName });
                } else {
                    r = await client.create("daifugo_room", { ...options, playerId: myPlayerId, name: myPlayerName });
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
            setFinishedPlayers(state.finishedPlayers || []);

            // Exchange State
            if (state.exchangePending) {
                const myPending = state.exchangePending[myPlayerId] ?? 0;
                setExchangePendingCount(myPending);
            }

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
                    sessionId: key,
                    hand: []
                });

                const pHand: Card[] = [];
                p.hand.forEach((c: any) => pHand.push({ suit: c.suit, rank: c.rank }));

                // Sort hand using engine
                const sortedHand = engine.sortHand(pHand, state.isRevolution, state.is11Back);
                newHands[p.id] = sortedHand;
            });

            setPlayers(pList);
            setHands(newHands);
        });

        r.onMessage("error", (msg: string) => alert(msg));
    };

    // Game Logic Wrappers
    const handleCardClick = (card: Card, index: number) => {
        setSelectedIndices(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    const getSelectedCardsObjects = () => {
        const myHand = hands[myPlayerId] || [];
        return selectedIndices.map(i => myHand[i]).filter(c => c !== undefined);
    };

    const executePlay = () => {
        room?.send("playCard", { cards: getSelectedCardsObjects() });
        setSelectedIndices([]);
    };

    const executePass = () => {
        room?.send("pass");
        setSelectedIndices([]);
    };

    const startGame = () => {
        room?.send("startGame");
    };

    const handleExchangeSubmit = () => {
        if (selectedIndices.length !== exchangePendingCount) {
            alert(`${exchangePendingCount}枚選択してください`);
            return;
        }
        room?.send("exchangeCards", { cards: getSelectedCardsObjects() });
        setSelectedIndices([]);
    };

    const handleNextGame = () => {
        room?.send("startNextGame");
        setSelectedIndices([]);
    };

    // Calculate Playable Cards
    const playableCards = React.useMemo(() => {
        const myHand = hands[myPlayerId] || [];

        // Allow selection during exchange phase
        if (gameState === 'exchanging') {
            return myHand; // All cards are selectable/playable for exchange UI
        }

        // Allow checking playable status even when it's not my turn
        if (!room) return [];

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
    }, [hands, myPlayerId, turnPlayerId, lastMove, isRevolution, is11Back, room?.state?.isShibari, room?.state?.ruleShibari, gameState]);

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
                    selectedIndices={selectedIndices} // Pass indices correctly
                    playableCards={playableCards}
                    isRevolution={isRevolution}
                />

                {/* Exchange Overlay */}
                {gameState === 'exchanging' && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 100
                    }}>
                        <h2>カード交換タイム</h2>
                        {exchangePendingCount > 0 ? (
                            <>
                                <p>指定された枚数の不要なカードを選択してください</p>
                                <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>残り: {exchangePendingCount - selectedIndices.length}枚</p>
                                <button
                                    onClick={handleExchangeSubmit}
                                    disabled={selectedIndices.length !== exchangePendingCount}
                                    className={styles.actionBtn}
                                    style={{ marginTop: '20px' }}
                                >
                                    交換する
                                </button>
                            </>
                        ) : (
                            <p>相手の選択を待っています...</p>
                        )}
                    </div>
                )}

                {/* Result Overlay */}
                {gameState === 'finished' && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 150
                    }}>
                        <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>ゲーム終了</h1>
                        <div style={{ display: 'grid', gap: '1rem', width: '100%', maxWidth: '400px' }}>
                            {players
                                .sort((a, b) => {
                                    // Sort by Rank Logic (Daifugo -> Daihinmin)
                                    const rankOrder = ['daifugo', 'fugou', 'heimin', 'binbou', 'daihinmin'];
                                    return rankOrder.indexOf(a.rank || '') - rankOrder.indexOf(b.rank || '');
                                })
                                .map(p => (
                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                                        <span style={{ fontWeight: 'bold' }}>{p.rank?.toUpperCase() || 'ー'}</span>
                                        <span>{p.name}</span>
                                    </div>
                                ))
                            }
                        </div>
                        {amHost && (
                            <button onClick={handleNextGame} className={styles.actionBtn} style={{ marginTop: '30px' }}>
                                次のゲームへ
                            </button>
                        )}
                        {!amHost && <p style={{ marginTop: '20px' }}>ホストの操作を待っています...</p>}
                    </div>
                )}
            </div>

            <div className={styles.actionControls}>
                {isMyTurn && (
                    <>
                        <button onClick={executePlay} className={styles.actionBtn} disabled={selectedIndices.length === 0}>
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
