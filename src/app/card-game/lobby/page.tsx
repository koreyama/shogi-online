'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AVATAR_LIST } from '@/lib/card-game/data/avatars';
import { STARTER_DECKS } from '@/lib/card-game/data/decks';
import { CARDS } from '@/lib/card-game/data/cards';
import { DeckBuilder } from '@/components/card-game/DeckBuilder';
import { createRoom, joinRoom, findRandomRoom } from '@/lib/card-game/firebase-utils';
import { createPlayerState } from '@/lib/card-game/engine';
import styles from './page.module.css';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';

export default function LobbyPage() {
    const router = useRouter();
    const [selectedAvatarId, setSelectedAvatarId] = useState(AVATAR_LIST[0].id);
    const [showDeckBuilder, setShowDeckBuilder] = useState(false);
    const [myDecks, setMyDecks] = useState<{ id: string, name: string, cards: string[] }[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string>('');
    const [deckType, setDeckType] = useState<'custom' | 'starter'>('starter');
    const [showRules, setShowRules] = useState(false);
    const [viewingDeck, setViewingDeck] = useState<string | null>(null);
    const [joinRoomId, setJoinRoomId] = useState('');
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);

    useEffect(() => {
        // Load saved decks
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
    }, []);

    const handleSaveDeck = (deckId: string, cardIds: string[]) => {
        // Reload decks
        const deck = JSON.parse(localStorage.getItem(deckId)!);
        setMyDecks(prev => [...prev.filter(d => d.id !== deckId), { id: deckId, ...deck }]);
        setSelectedDeckId(deckId);
        setShowDeckBuilder(false);
        setDeckType('custom');
    };

    const handleDeleteDeck = (deckId: string) => {
        if (!confirm('本当にこのデッキを削除しますか？')) return;
        localStorage.removeItem(deckId);
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
        if (!selectedDeckId) {
            alert('デッキを選択してください');
            return;
        }
        setIsCreatingRoom(true);
        const playerName = localStorage.getItem('card_game_player_name') || 'Player';
        const playerId = `p-${Date.now()}`;
        const deckCards = getSelectedDeckCards();

        const playerState = createPlayerState(playerId, playerName, selectedAvatarId, deckCards);
        const roomId = await createRoom(playerState);

        router.push(`/card-game?mode=room&roomId=${roomId}&playerId=${playerId}`);
    };

    const handleJoinRoom = async () => {
        if (!joinRoomId) {
            alert('ルームIDを入力してください');
            return;
        }
        if (!selectedDeckId) {
            alert('デッキを選択してください');
            return;
        }

        const playerName = localStorage.getItem('card_game_player_name') || 'Player';
        const playerId = `p-${Date.now()}`;
        const deckCards = getSelectedDeckCards();

        const playerState = createPlayerState(playerId, playerName, selectedAvatarId, deckCards);
        const success = await joinRoom(joinRoomId, playerState);

        if (success) {
            router.push(`/card-game?mode=room&roomId=${joinRoomId}&playerId=${playerId}`);
        } else {
            alert('ルームが見つからないか、満員です');
        }
    };

    const handleStartGame = async (mode: 'random' | 'room' | 'cpu', roomId?: string) => {
        if (!selectedDeckId) {
            alert('デッキを選択してください');
            return;
        }

        // Default name
        localStorage.setItem('card_game_player_name', 'Player');
        const playerName = 'Player';
        const playerId = `p-${Date.now()}`;
        const deckCards = getSelectedDeckCards();

        if (mode === 'random') {
            const playerState = createPlayerState(playerId, playerName, selectedAvatarId, deckCards);
            const rId = await findRandomRoom(playerState);
            router.push(`/card-game?mode=room&roomId=${rId}&playerId=${playerId}`);
            return;
        }

        const params = new URLSearchParams();
        params.set('mode', mode);
        if (roomId) params.set('roomId', roomId);
        params.set('avatar', selectedAvatarId);
        params.set('deck', selectedDeckId);
        params.set('deckType', deckType);
        params.set('playerId', playerId);

        router.push(`/card-game?${params.toString()}`);
    };

    if (showDeckBuilder) {
        return <DeckBuilder onSave={handleSaveDeck} onCancel={() => setShowDeckBuilder(false)} />;
    }

    return (
        <main className={styles.main}>
            <button onClick={() => router.push('/')} className={styles.backButton}>
                <IconBack size={18} /> トップへ戻る
            </button>

            <div className={styles.gameContainer}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Divine Duel</h1>
                    <button onClick={() => setShowRules(true)} className={styles.rulesBtn}>ルール説明</button>
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
                                    <h3>{avatar.name}</h3>
                                    <p className={styles.desc}>{avatar.description}</p>
                                    <div className={styles.passive}>
                                        <strong>{avatar.passiveName}</strong>: {avatar.passiveDescription}
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
                                        <button
                                            onClick={() => handleDeleteDeck(selectedDeckId)}
                                            className={styles.deleteDeckBtn}
                                        >
                                            削除
                                        </button>
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
                    <button onClick={() => handleStartGame('random')} className={styles.modeBtn}>
                        <span className={styles.modeBtnIcon}><IconDice size={48} color="var(--color-primary)" /></span>
                        <span className={styles.modeBtnTitle}>ランダムマッチ</span>
                        <span className={styles.modeBtnDesc}>誰かとすぐに対戦</span>
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
            </div>

            {/* Rules Modal */}
            {showRules && (
                <div className={styles.modalOverlay} onClick={() => setShowRules(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2>ルール説明</h2>
                        <div className={styles.rulesText}>
                            <h3>勝利条件</h3>
                            <p>相手のHPを0にすると勝利です。</p>

                            <h3>ターンの流れ</h3>
                            <ol>
                                <li>MPが1回復し、カードを1枚引きます。</li>
                                <li>手札からカードを使用します（MPを消費）。</li>
                                <li><strong>攻撃（武器・攻撃魔法）は1ターンに1回のみ</strong>可能です。</li>
                                <li>ターン終了ボタンを押して相手に交代します。</li>
                            </ol>

                            <h3>カードの種類</h3>
                            <ul>
                                <li><strong>武器</strong>: 相手にダメージを与えます。</li>
                                <li><strong>防具</strong>: 装備するとダメージを軽減します。</li>
                                <li><strong>魔法</strong>: 攻撃や回復など様々な効果があります。</li>
                                <li><strong>道具</strong>: HPやMPを回復します。使い切りです。</li>
                                <li><strong>装飾品</strong>: 装備すると永続的な効果を得られます。</li>
                            </ul>
                        </div>
                        <button onClick={() => setShowRules(false)} className={styles.closeBtn}>閉じる</button>
                    </div>
                </div>
            )}

            {/* Deck Viewer Modal */}
            {viewingDeck && (
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
            )}
        </main>
    );
}
