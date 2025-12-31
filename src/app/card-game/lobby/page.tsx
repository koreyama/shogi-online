'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AVATAR_LIST } from '@/lib/card-game/data/avatars';
import { STARTER_DECKS } from '@/lib/card-game/data/decks';
import { CARDS } from '@/lib/card-game/data/cards';
import { DeckBuilder } from '@/components/card-game/DeckBuilder';
import styles from './page.module.css';
import { IconBack, IconDice, IconKey, IconRobot, IconTrophy } from '@/components/Icons';
import { useAuth } from '@/hooks/useAuth';
import { ref, get, set, remove, child } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getLeaderboard, RankingUser } from '@/lib/card-game/ranking';

export default function LobbyPage() {
    const router = useRouter();
    const { user, signInWithGoogle, signOut } = useAuth();
    const [selectedAvatarId, setSelectedAvatarId] = useState(AVATAR_LIST[0].id);
    const [showDeckBuilder, setShowDeckBuilder] = useState(false);
    const [myDecks, setMyDecks] = useState<{ id: string, name: string, cards: string[] }[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string>('');
    const [deckType, setDeckType] = useState<'custom' | 'starter'>('starter');
    const [showRules, setShowRules] = useState(false);
    const [viewingDeck, setViewingDeck] = useState<string | null>(null);
    const [joinRoomId, setJoinRoomId] = useState('');
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [editingDeck, setEditingDeck] = useState<{ id: string, name: string, cards: string[] } | undefined>(undefined);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState<RankingUser[]>([]);

    useEffect(() => {
        const loadDecks = async () => {
            if (user) {
                // Load from Firebase
                try {
                    const userDecksRef = ref(db, `users/${user.uid}/decks`);
                    const snapshot = await get(userDecksRef);
                    if (snapshot.exists()) {
                        const decksData = snapshot.val();
                        const decks = Object.values(decksData) as { id: string, name: string, cards: string[] }[];
                        setMyDecks(decks);
                        if (decks.length > 0) {
                            setDeckType('custom');
                            setSelectedDeckId(decks[0].id);
                        }
                    } else {
                        setMyDecks([]);
                        setDeckType('starter');
                        setSelectedDeckId(Object.keys(STARTER_DECKS)[0]);
                    }
                } catch (error) {
                    console.error("Error loading decks from Firebase:", error);
                    // Fallback to empty/starter if permission denied
                    setMyDecks([]);
                    setDeckType('starter');
                    setSelectedDeckId(Object.keys(STARTER_DECKS)[0]);
                }
            } else {
                // Load from LocalStorage
                const decks = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('deck-')) {
                        const deck = JSON.parse(localStorage.getItem(key)!);
                        decks.push({ id: key, ...deck });
                    }
                }
                setMyDecks(decks);

                // Default selection logic
                if (decks.length > 0) {
                    setDeckType('custom');
                    setSelectedDeckId(decks[0].id);
                } else {
                    setDeckType('starter');
                    setSelectedDeckId(Object.keys(STARTER_DECKS)[0]);
                }
            }
        };
        loadDecks();
    }, [user]);

    const handleSaveDeck = async (deckId: string, cardIds: string[], deckName: string) => {
        const newDeck = { id: deckId, name: deckName, cards: cardIds };

        if (user) {
            // Save to Firebase
            await set(ref(db, `users/${user.uid}/decks/${deckId}`), newDeck);
        } else {
            // Save to LocalStorage
            localStorage.setItem(deckId, JSON.stringify(newDeck));
        }

        // Reload decks (Optimistic update)
        setMyDecks(prev => {
            const filtered = prev.filter(d => d.id !== deckId);
            return [...filtered, newDeck];
        });
        setSelectedDeckId(deckId);
        setShowDeckBuilder(false);
        setEditingDeck(undefined);
        setDeckType('custom');
    };

    const handleEditDeck = (deckId: string) => {
        const deck = myDecks.find(d => d.id === deckId);
        if (deck) {
            setEditingDeck(deck);
            setShowDeckBuilder(true);
        }
    };

    const handleDeleteDeck = async (deckId: string) => {
        if (!confirm('本当にこのデッキを削除しますか？')) return;

        if (user) {
            await remove(ref(db, `users/${user.uid}/decks/${deckId}`));
        } else {
            localStorage.removeItem(deckId);
        }

        const newDecks = myDecks.filter(d => d.id !== deckId);
        setMyDecks(newDecks);
        if (newDecks.length > 0) {
            setSelectedDeckId(newDecks[0].id);
        } else {
            setSelectedDeckId('');
        }
    };

    const getSelectedDeckCards = () => {
        if (deckType === 'starter') {
            return STARTER_DECKS[selectedDeckId as keyof typeof STARTER_DECKS]?.cards || [];
        } else {
            const deck = myDecks.find(d => d.id === selectedDeckId);
            return deck?.cards || [];
        }
    };

    const handleCreateRoom = async () => {
        console.log("Create room clicked", { selectedDeckId });
        try {
            if (!selectedDeckId) {
                alert('デッキを選択してください');
                return;
            }
            setIsCreatingRoom(true);
            const playerName = user?.displayName || localStorage.getItem('card_game_player_name') || 'Player';
            const playerId = user ? user.uid : `p-${Date.now()}`;

            const params = new URLSearchParams();
            params.set('mode', 'room');
            params.set('create', 'true');
            params.set('avatar', selectedAvatarId);
            params.set('deck', selectedDeckId);
            params.set('deckType', deckType);
            params.set('playerId', playerId);

            const url = `/card-game?${params.toString()}`;
            console.log("Navigating to", url);
            router.push(url);
        } catch (e: any) {
            console.error("Error in handleCreateRoom:", e);
            alert(`エラーが発生しました: ${e.message}`);
        }
    };

    const handleJoinRoom = async () => {
        console.log("Join room clicked", { joinRoomId, selectedDeckId });
        try {
            if (!joinRoomId) {
                alert('ルームIDを入力してください');
                return;
            }
            if (!selectedDeckId) {
                alert('デッキを選択してください');
                return;
            }

            const playerName = user?.displayName || localStorage.getItem('card_game_player_name') || 'Player';
            const playerId = user ? user.uid : `p-${Date.now()}`;

            const params = new URLSearchParams();
            params.set('mode', 'room');
            params.set('roomId', joinRoomId);
            params.set('avatar', selectedAvatarId);
            params.set('deck', selectedDeckId);
            params.set('deckType', deckType);
            params.set('playerId', playerId);

            const url = `/card-game?${params.toString()}`;
            console.log("Navigating to", url);
            router.push(url);
        } catch (e: any) {
            console.error("Error in handleJoinRoom:", e);
            alert(`エラーが発生しました: ${e.message}`);
        }
    };

    const handleStartGame = async (mode: 'ranked' | 'casual' | 'room' | 'cpu', roomId?: string) => {
        console.log("Start game clicked", { mode, selectedDeckId });
        try {
            if (!selectedDeckId) {
                alert('デッキを選択してください');
                return;
            }

            // Default name
            if (!user) {
                localStorage.setItem('card_game_player_name', 'Player');
            }
            const playerName = user?.displayName || 'Player';
            const playerId = user ? user.uid : `p-${Date.now()}`;

            const params = new URLSearchParams();
            params.set('mode', mode);
            if (roomId) params.set('roomId', roomId);
            params.set('avatar', selectedAvatarId);
            params.set('deck', selectedDeckId);
            params.set('deckType', deckType);
            params.set('playerId', playerId);

            const url = `/card-game?${params.toString()}`;
            console.log("Navigating to", url);
            router.push(url);
        } catch (e: any) {
            console.error("Error in handleStartGame:", e);
            alert(`エラーが発生しました: ${e.message}`);
        }
    };

    const handleShowLeaderboard = async () => {
        try {
            const data = await getLeaderboard(20);
            setLeaderboardData(data);
            setShowLeaderboard(true);
        } catch (e) {
            console.error("Failed to load leaderboard:", e);
            alert("ランキングの取得に失敗しました。");
        }
    };

    if (showDeckBuilder) {
        return <DeckBuilder onSave={handleSaveDeck} onCancel={() => { setShowDeckBuilder(false); setEditingDeck(undefined); }} initialDeck={editingDeck} />;
    }

    return (
        <main className={styles.main}>
            <button onClick={() => router.push('/')} className={styles.backButton}>
                <IconBack size={18} /> トップへ戻る
            </button>

            <div className={styles.gameContainer}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Divine Duel</h1>
                    <div className={styles.headerBtnGroup}>
                        <button onClick={handleShowLeaderboard} className={styles.leaderboardBtn}>
                            <span style={{ marginRight: '0.4rem', display: 'flex' }}><IconTrophy size={16} /></span>ランキング
                        </button>
                        <button onClick={() => setShowRules(true)} className={styles.rulesBtn}>ルール説明</button>
                    </div>
                </div>

                <div className={styles.setupSection}>
                    {/* Avatar Selection */}
                    <section className={styles.section}>
                        <h2>守護神選択</h2>
                        <div className={styles.avatarGrid}>
                            {AVATAR_LIST.map(avatar => (
                                <div
                                    key={avatar.id}
                                    className={`${styles.avatarCard} ${selectedAvatarId === avatar.id ? styles.selected : ''}`}
                                    onClick={() => setSelectedAvatarId(avatar.id)}
                                >
                                    {avatar.imageUrl ? (
                                        <div className={styles.avatarImageContainer}>
                                            <img src={avatar.imageUrl} alt={avatar.name} className={styles.avatarImage} />
                                        </div>
                                    ) : null}
                                    <h3>{avatar.name}</h3>
                                    <p className={styles.desc}>{avatar.description}</p>
                                    <div className={styles.passive}>
                                        <strong>特性: {avatar.passiveName}</strong><br />
                                        {avatar.passiveDescription}
                                    </div>
                                    <div className={styles.ultimate}>
                                        <strong>必殺技: {avatar.ultimateName}</strong> (MP:{avatar.ultimateCost})<br />
                                        {avatar.ultimateDescription}
                                    </div>
                                    <div className={styles.stats}>
                                        HP: {avatar.baseHp} / MP: {avatar.baseMp}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Deck Selection */}
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>デッキ選択</h2>
                            <div className={styles.deckActions}>
                                <button onClick={() => setShowDeckBuilder(true)} className={styles.secondaryBtn}>新規作成</button>
                            </div>
                        </div>

                        <div className={styles.deckTabs}>
                            <button
                                className={`${styles.tab} ${deckType === 'custom' ? styles.activeTab : ''}`}
                                onClick={() => {
                                    setDeckType('custom');
                                    if (myDecks.length > 0) {
                                        setSelectedDeckId(myDecks[0].id);
                                    } else {
                                        setSelectedDeckId('');
                                    }
                                }}
                            >
                                自分のデッキ
                            </button>
                            <button
                                className={`${styles.tab} ${deckType === 'starter' ? styles.activeTab : ''}`}
                                onClick={() => {
                                    setDeckType('starter');
                                    setSelectedDeckId(Object.keys(STARTER_DECKS)[0]);
                                }}
                            >
                                スターターデッキ
                            </button>
                        </div>

                        <div className={styles.deckSelector}>
                            {deckType === 'custom' ? (
                                myDecks.length === 0 ? (
                                    <p>デッキがありません。新規作成してください。</p>
                                ) : (
                                    <select
                                        value={selectedDeckId}
                                        onChange={(e) => setSelectedDeckId(e.target.value)}
                                        className={styles.select}
                                    >
                                        {myDecks.map(deck => (
                                            <option key={deck.id} value={deck.id}>{deck.name} ({deck.cards.length}枚)</option>
                                        ))}
                                    </select>
                                )
                            ) : (
                                <select
                                    value={selectedDeckId}
                                    onChange={(e) => setSelectedDeckId(e.target.value)}
                                    className={styles.select}
                                >
                                    {Object.values(STARTER_DECKS).map(deck => (
                                        <option key={deck.id} value={deck.id}>{deck.name}</option>
                                    ))}
                                </select>
                            )}

                            {selectedDeckId && (
                                <div className={styles.deckActions}>
                                    <button
                                        onClick={() => setViewingDeck(selectedDeckId)}
                                        className={styles.viewDeckBtn}
                                    >
                                        内容確認
                                    </button>
                                    {deckType === 'custom' && myDecks.some(d => d.id === selectedDeckId) && (
                                        <>
                                            <button
                                                onClick={() => handleEditDeck(selectedDeckId)}
                                                className={styles.editDeckBtn}
                                            >
                                                編集
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDeck(selectedDeckId)}
                                                className={styles.deleteDeckBtn}
                                            >
                                                削除
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {deckType === 'starter' && selectedDeckId && STARTER_DECKS[selectedDeckId as keyof typeof STARTER_DECKS] && (
                            <p className={styles.deckDesc}>
                                {STARTER_DECKS[selectedDeckId as keyof typeof STARTER_DECKS].description}
                            </p>
                        )}
                    </section>
                </div>

                {/* Game Start */}
                <div className={styles.modeSelection}>
                    <button onClick={() => handleStartGame('ranked')} className={`${styles.modeBtn} ${styles.rankedBtn}`}>
                        <span className={styles.modeBtnIcon} style={{ background: '#fef3c7' }}>
                            <IconTrophy size={48} color="#d97706" />
                        </span>
                        <span className={styles.modeBtnTitle} style={{ color: '#b45309' }}>ランクマッチ</span>
                        <span className={styles.modeBtnDesc}>レートを懸けて真剣勝負</span>
                    </button>

                    <button onClick={() => handleStartGame('casual')} className={styles.modeBtn}>
                        <span className={styles.modeBtnIcon}><IconDice size={48} color="var(--color-primary)" /></span>
                        <span className={styles.modeBtnTitle}>カジュアルマッチ</span>
                        <span className={styles.modeBtnDesc}>気軽にランダム対戦</span>
                    </button>

                    <div className={styles.roomModeContainer}>
                        <button onClick={() => setIsCreatingRoom(!isCreatingRoom)} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconKey size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>ルーム対戦</span>
                            <span className={styles.modeBtnDesc}>友達と対戦</span>
                        </button>
                        {isCreatingRoom && (
                            <div className={styles.roomActionsExpanded}>
                                <div className={styles.createRoom}>
                                    <h4>部屋を作る</h4>
                                    <button
                                        onClick={handleCreateRoom}
                                        className={styles.primaryBtn}
                                        disabled={!selectedDeckId}
                                    >
                                        部屋を作成
                                    </button>
                                </div>
                                <div className={styles.joinRoom}>
                                    <h4>部屋に参加する</h4>
                                    <div className={styles.joinInputGroup}>
                                        <input
                                            type="text"
                                            placeholder="ルームID"
                                            value={joinRoomId}
                                            onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                                            className={styles.roomInput}
                                        />
                                        <button onClick={handleJoinRoom} className={styles.secondaryBtn}>参加</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={() => handleStartGame('cpu')} className={styles.modeBtn}>
                        <span className={styles.modeBtnIcon}><IconRobot size={48} color="var(--color-primary)" /></span>
                        <span className={styles.modeBtnTitle}>AI対戦</span>
                        <span className={styles.modeBtnDesc}>CPUと練習</span>
                    </button>
                </div>


            </div >

            {/* Rules Modal */}
            {
                showRules && (
                    <div className={styles.modalOverlay} onClick={() => setShowRules(false)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <h2 className={styles.contentTitle}>カードゲーム（Card Game）の遊び方</h2>

                            <div className={styles.rulesText}>
                                <div className={styles.sectionBlock}>
                                    <div className={styles.sectionHeader}>
                                        <span className={styles.sectionIcon}>⚔️</span>
                                        <h3 className={styles.sectionTitle}>戦略と運が交差する対戦カードバトル</h3>
                                    </div>
                                    <p className={styles.textBlock}>
                                        このゲームは、ユニットカードとスペルカードを駆使して相手プレイヤーと戦う、1対1の対戦型カードゲームです。
                                        毎ターン増加するマナを管理し、最適なタイミングでカードをプレイして、相手のHPを0にすれば勝利となります。
                                    </p>
                                </div>

                                <div className={styles.sectionBlock}>
                                    <div className={styles.sectionHeader}>
                                        <span className={styles.sectionIcon}>📏</span>
                                        <h3 className={styles.sectionTitle}>基本ルール</h3>
                                    </div>
                                    <div className={styles.cardGrid}>
                                        <div className={styles.infoCard}>
                                            <span className={styles.cardTitle}>1. マナシステム</span>
                                            <p className={styles.cardText}>カードを使うにはマナが必要です。マナは毎ターン全回復し、最大値が1ずつ増えていきます（最大10）。</p>
                                        </div>
                                        <div className={styles.infoCard}>
                                            <span className={styles.cardTitle}>2. ユニットカード</span>
                                            <p className={styles.cardText}>場に出して戦うカードです。攻撃力と体力を持ち、相手プレイヤーや相手ユニットを攻撃できます。</p>
                                        </div>
                                        <div className={styles.infoCard}>
                                            <span className={styles.cardTitle}>3. スペルカード</span>
                                            <p className={styles.cardText}>使い切りの魔法カードです。ダメージを与えたり、ユニットを強化したり、様々な効果があります。</p>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.sectionBlock}>
                                    <div className={styles.sectionHeader}>
                                        <span className={styles.sectionIcon}>🧠</span>
                                        <h3 className={styles.sectionTitle}>勝つためのコツ</h3>
                                    </div>
                                    <p className={styles.textBlock}>
                                        ただ強いカードを出せば勝てるわけではありません。盤面の状況（ボードアドバンテージ）を意識しましょう。
                                    </p>
                                    <div className={styles.highlightBox}>
                                        <span className={styles.highlightTitle}>マナカーブを意識する</span>
                                        <p className={styles.textBlock} style={{ marginBottom: 0 }}>
                                            序盤は低コストのカードで盤面を支え、中盤以降に高コストの強力なカードで勝負を決めるのが理想的な流れです。
                                            手札事故（高コストばかりで何も出せない）を防ぐため、バランスよくデッキを組みましょう。
                                        </p>
                                    </div>
                                    <ul className={styles.list}>
                                        <li className={styles.listItem}>
                                            <strong>有利トレード</strong><br />
                                            自分の弱いユニットで相手の強いユニットを倒したり、スペルで効率よく除去したりして、相手より多くのリソースを残すことを心がけましょう。
                                        </li>
                                        <li className={styles.listItem}>
                                            <strong>アルティメットスキル</strong><br />
                                            各アバターには強力な必殺技（アルティメット）があります。ここぞという場面で使って、戦況をひっくり返しましょう。
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <button onClick={() => setShowRules(false)} className={styles.closeBtn}>閉じる</button>
                        </div>
                    </div>
                )
            }

            {/* Leaderboard Modal */}
            {
                showLeaderboard && (
                    <div className={styles.modalOverlay} onClick={() => setShowLeaderboard(false)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <IconTrophy size={28} color="#d97706" /> ランキング
                            </h2>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                                            <th style={{ padding: '0.75rem', width: '60px' }}>順位</th>
                                            <th style={{ padding: '0.75rem' }}>プレイヤー</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>レート</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>勝利数</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboardData.length > 0 ? (
                                            leaderboardData.map((user, index) => (
                                                <tr key={user.userId || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '0.75rem', fontWeight: 'bold', color: index < 3 ? '#d97706' : '#64748b' }}>
                                                        {index + 1}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', fontWeight: 600, color: '#334155' }}>
                                                        {user.name}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>
                                                        {user.rating}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>
                                                        {user.wins}勝 {user.losses}敗
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                                    データがありません
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={() => setShowLeaderboard(false)} className={styles.closeBtn}>閉じる</button>
                        </div>
                    </div>
                )
            }

            {/* Deck Viewer Modal */}
            {
                viewingDeck && (
                    <div className={styles.modalOverlay} onClick={() => setViewingDeck(null)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <h2>デッキ内容</h2>
                            <div className={styles.cardList}>
                                {(() => {
                                    let cards: string[] = [];
                                    if (STARTER_DECKS[viewingDeck as keyof typeof STARTER_DECKS]) {
                                        cards = STARTER_DECKS[viewingDeck as keyof typeof STARTER_DECKS].cards;
                                    } else {
                                        const deck = myDecks.find(d => d.id === viewingDeck);
                                        if (deck) cards = deck.cards;
                                    }

                                    // Count cards
                                    const counts: Record<string, number> = {};
                                    cards.forEach(id => counts[id] = (counts[id] || 0) + 1);

                                    return (
                                        <ul className={styles.deckListUl}>
                                            {Object.entries(counts).map(([id, count]) => (
                                                <li key={id} className={styles.deckListLi}>
                                                    {CARDS[id] ? CARDS[id].name : `Unknown Card (${id})`} x{count}
                                                </li>
                                            ))}
                                        </ul>
                                    );
                                })()}
                            </div>
                            <button onClick={() => setViewingDeck(null)} className={styles.closeBtn}>閉じる</button>
                        </div>
                    </div>
                )
            }
        </main >
    );
}
