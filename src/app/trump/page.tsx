'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { db } from '@/lib/firebase';
import { ref, push, set, onValue } from 'firebase/database';
import { usePlayer } from '@/hooks/usePlayer';
import { TrumpRoom } from '@/lib/trump/types';
import { IconBack, IconCards, IconUser } from '@/components/Icons';
import { useRoomJanitor } from '@/hooks/useRoomJanitor';

export default function TrumpLobbyPage() {
    const router = useRouter();
    const { playerName, playerId, isLoaded } = usePlayer();
    const [selectedGame, setSelectedGame] = useState<'daifugo' | 'poker' | 'blackjack'>('daifugo');
    const [rooms, setRooms] = useState<TrumpRoom[]>([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [rules, setRules] = useState({
        jokerCount: 2,
        revolution: true,
        miyakoOchi: true,
        is8Cut: true,
        is11Back: true,
        isStaircase: false,
        isShibari: false,
        isSpade3: false
    });

    // Clean up empty trump rooms
    useRoomJanitor(['trump']);

    console.log('TrumpLobbyPage rendering', { selectedGame });

    useEffect(() => {
        const path = selectedGame === 'poker' ? 'poker_rooms' :
            selectedGame === 'blackjack' ? 'blackjack_rooms' : 'trump_rooms';

        console.log('TrumpLobbyPage: Fetching rooms from', path);
        const roomsRef = ref(db, path);
        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            console.log('TrumpLobbyPage: Data received', data);
            const roomList: TrumpRoom[] = [];
            if (data) {
                Object.keys(data).forEach((key) => {
                    roomList.push({
                        roomId: key,
                        ...data[key]
                    });
                });
            }
            setRooms(roomList.filter(r => r.status === 'waiting'));
        });

        return () => unsubscribe();
    }, [selectedGame]);

    const handleCreateRoom = async () => {
        if (!newRoomName.trim() || !playerId || !playerName) return;
        setIsCreating(true);

        try {
            const path = selectedGame === 'poker' ? 'poker_rooms' :
                selectedGame === 'blackjack' ? 'blackjack_rooms' : 'trump_rooms';
            const roomsRef = ref(db, path);
            const newRoomRef = push(roomsRef);
            const roomId = newRoomRef.key;

            if (roomId) {
                const newRoom: TrumpRoom = {
                    roomId,
                    hostId: playerId,
                    status: 'waiting',
                    gameType: selectedGame,
                    players: {
                        [playerId]: {
                            id: playerId,
                            name: playerName,
                            role: 'host',
                            isReady: true,
                            hand: [],
                            isAi: false
                        }
                    },
                    rules: rules,
                    createdAt: Date.now()
                };

                await set(newRoomRef, newRoom);
                if (selectedGame === 'poker') {
                    router.push(`/poker/${roomId}`);
                } else if (selectedGame === 'blackjack') {
                    router.push(`/blackjack/${roomId}`);
                } else {
                    router.push(`/trump/${roomId}`);
                }
            }
        } catch (error) {
            console.error('Error creating room:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCreateAiRoom = async () => {
        if (!playerId || !playerName) return;
        setIsCreating(true);

        try {
            const path = selectedGame === 'poker' ? 'poker_rooms' :
                selectedGame === 'blackjack' ? 'blackjack_rooms' : 'trump_rooms';
            const roomsRef = ref(db, path);
            const newRoomRef = push(roomsRef);
            const roomId = newRoomRef.key;

            if (roomId) {
                const aiPlayers: Record<string, any> = {};
                // Add Host
                aiPlayers[playerId] = {
                    id: playerId,
                    name: playerName,
                    role: 'host',
                    isReady: true,
                    hand: [],
                    isAi: false
                };
                // Add 3 AI Bots
                for (let i = 1; i <= 3; i++) {
                    const aiId = `ai-${Date.now()}-${i}`;
                    aiPlayers[aiId] = {
                        id: aiId,
                        name: `CPU ${i}`,
                        role: 'guest',
                        isReady: true,
                        isAi: true,
                        hand: []
                    };
                }

                const newRoom: TrumpRoom = {
                    roomId,
                    hostId: playerId,
                    status: 'waiting',
                    gameType: selectedGame,
                    players: aiPlayers,
                    rules: rules,
                    createdAt: Date.now()
                };

                await set(newRoomRef, newRoom);
                if (selectedGame === 'poker') {
                    router.push(`/poker/${roomId}`);
                } else if (selectedGame === 'blackjack') {
                    router.push(`/blackjack/${roomId}`);
                } else {
                    router.push(`/trump/${roomId}`);
                }
            }
        } catch (error) {
            console.error('Error creating AI room:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinRoom = (roomId: string) => {
        if (selectedGame === 'poker') {
            router.push(`/poker/${roomId}`);
        } else if (selectedGame === 'blackjack') {
            router.push(`/blackjack/${roomId}`);
        } else {
            router.push(`/trump/${roomId}`);
        }
    };

    const toggleRule = (key: keyof typeof rules) => {
        if (typeof rules[key] === 'boolean') {
            setRules(prev => ({ ...prev, [key]: !prev[key] }));
        }
    };

    if (!isLoaded) return <div className={styles.loading}>読み込み中...</div>;

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <button onClick={() => router.push('/')} className={styles.backButton}>
                    <IconBack size={20} /> ホームに戻る
                </button>
                <h1 className={styles.title}>トランプゲーム</h1>
                <div style={{ width: 100 }}></div> {/* Spacer */}
            </header>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>ルーム作成</h2>

                    <div className={styles.gameGrid}>
                        <div
                            className={`${styles.gameCard} ${selectedGame === 'daifugo' ? styles.selected : ''}`}
                            onClick={() => setSelectedGame('daifugo')}
                        >
                            <div className={styles.gameIcon}><IconCards size={40} /></div>
                            <span className={styles.gameName}>大富豪</span>
                        </div>
                        <div
                            className={`${styles.gameCard} ${selectedGame === 'poker' ? styles.selected : ''}`}
                            onClick={() => setSelectedGame('poker')}
                        >
                            <div className={styles.gameIcon}><IconCards size={40} /></div>
                            <span className={styles.gameName}>ポーカー</span>
                        </div>
                        <div
                            className={`${styles.gameCard} ${selectedGame === 'blackjack' ? styles.selected : ''}`}
                            onClick={() => setSelectedGame('blackjack')}
                        >
                            <div className={styles.gameIcon}><IconCards size={40} /></div>
                            <span className={styles.gameName}>ブラックジャック</span>
                        </div>
                    </div>

                    <div className={styles.createForm}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>ルーム名</label>
                            <input
                                type="text"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                placeholder="ルーム名を入力..."
                                className={styles.input}
                            />
                        </div>

                        {selectedGame === 'daifugo' && (
                            <div className={styles.rulesGroup}>
                                <label className={styles.label}>ローカルルール設定</label>
                                <div className={styles.rulesGrid}>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={rules.revolution} onChange={() => toggleRule('revolution')} />
                                        革命
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={rules.is8Cut} onChange={() => toggleRule('is8Cut')} />
                                        8切り
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={rules.is11Back} onChange={() => toggleRule('is11Back')} />
                                        11バック
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={rules.miyakoOchi} onChange={() => toggleRule('miyakoOchi')} />
                                        都落ち
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={rules.isStaircase} onChange={() => toggleRule('isStaircase')} />
                                        階段
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={rules.isShibari} onChange={() => toggleRule('isShibari')} />
                                        縛り
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={rules.isSpade3} onChange={() => toggleRule('isSpade3')} />
                                        スペ3返し
                                    </label>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                onClick={handleCreateRoom}
                                disabled={!newRoomName.trim() || isCreating}
                                className={styles.createButton}
                                style={{ flex: 1 }}
                            >
                                {isCreating ? '作成中...' : 'ルーム作成'}
                            </button>
                            <button
                                onClick={handleCreateAiRoom}
                                disabled={isCreating}
                                className={styles.createButton}
                                style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                            >
                                AI対戦
                            </button>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>ルーム参加</h2>
                    <div className={styles.roomList}>
                        {rooms.length === 0 ? (
                            <div className={styles.emptyState}>
                                ルームが見つかりません。作成してください！
                            </div>
                        ) : (
                            rooms.map(room => (
                                <div key={room.roomId} className={styles.roomCard}>
                                    <div className={styles.roomInfo}>
                                        <span className={styles.roomName}>{room.roomId}</span>
                                        <div className={styles.roomDetails}>
                                            <span>{room.gameType}</span>
                                            <span><IconUser size={14} /> {room.players ? Object.keys(room.players).length : 0}/4</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleJoinRoom(room.roomId)}
                                        className={styles.joinButton}
                                    >
                                        参加
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* AdSense Content Section */}
            <div className={styles.contentSection}>
                {selectedGame === 'daifugo' && (
                    <>
                        <h2 className={styles.contentTitle}>大富豪（大貧民）の遊び方</h2>
                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>👑</span>
                                <h3 className={styles.sectionTitle}>日本で最も愛されるカードゲーム</h3>
                            </div>
                            <p className={styles.textBlock}>
                                大富豪は、手札をいかに早く出し切るかを競うゲームです。
                                階級制度（大富豪、富豪、平民、貧民、大貧民）があり、順位によって次回のゲームで有利不利が決まるのが特徴です。
                                多くのローカルルールが存在し、戦略の幅が広いのも魅力です。
                            </p>
                        </div>
                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>📜</span>
                                <h3 className={styles.sectionTitle}>主なローカルルール</h3>
                            </div>
                            <div className={styles.cardGrid}>
                                <div className={styles.infoCard}>
                                    <span className={styles.cardTitle}>革命</span>
                                    <p className={styles.cardText}>同じ数字を4枚出すと、カードの強さが逆転します（3が最強、2が最弱）。</p>
                                </div>
                                <div className={styles.infoCard}>
                                    <span className={styles.cardTitle}>8切り</span>
                                    <p className={styles.cardText}>8を含むカードを出すと、その場で場が流れます（強制的に自分の番になる）。</p>
                                </div>
                                <div className={styles.infoCard}>
                                    <span className={styles.cardTitle}>都落ち</span>
                                    <p className={styles.cardText}>大富豪が1位になれなかった場合、即座に大貧民に転落します。</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {selectedGame === 'poker' && (
                    <>
                        <h2 className={styles.contentTitle}>ポーカー（テキサスホールデム）の遊び方</h2>
                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>♠️</span>
                                <h3 className={styles.sectionTitle}>世界標準の頭脳スポーツ</h3>
                            </div>
                            <p className={styles.textBlock}>
                                ポーカーは、手札と共通カードを組み合わせて最強の役を作るゲームです。
                                単なる運ゲーではなく、確率計算や心理戦（ブラフ）が重要な要素となります。
                                ここでは世界で最も人気のある「テキサスホールデム」のルールを採用しています。
                            </p>
                        </div>
                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>🏆</span>
                                <h3 className={styles.sectionTitle}>役の強さ（強い順）</h3>
                            </div>
                            <ul className={styles.list}>
                                <li className={styles.listItem}><strong>ロイヤルストレートフラッシュ</strong>：同じマークの10, J, Q, K, A</li>
                                <li className={styles.listItem}><strong>ストレートフラッシュ</strong>：同じマークの連続した5枚</li>
                                <li className={styles.listItem}><strong>フォーカード</strong>：同じ数字4枚</li>
                                <li className={styles.listItem}><strong>フルハウス</strong>：スリーカード + ワンペア</li>
                                <li className={styles.listItem}><strong>フラッシュ</strong>：同じマーク5枚</li>
                            </ul>
                        </div>
                    </>
                )}

                {selectedGame === 'blackjack' && (
                    <>
                        <h2 className={styles.contentTitle}>ブラックジャックの遊び方</h2>
                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>🃏</span>
                                <h3 className={styles.sectionTitle}>ディーラーとの真剣勝負</h3>
                            </div>
                            <p className={styles.textBlock}>
                                ブラックジャックは、カードの合計値を「21」に近づけるゲームです。
                                21を超えてしまうと「バースト」で負けになります。
                                プレイヤーはディーラー（親）と1対1で勝負します。
                            </p>
                        </div>
                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>🧠</span>
                                <h3 className={styles.sectionTitle}>ベーシックストラテジー</h3>
                            </div>
                            <div className={styles.highlightBox}>
                                <span className={styles.highlightTitle}>ヒットかスタンドか？</span>
                                <p className={styles.textBlock} style={{ marginBottom: 0 }}>
                                    自分の手が「11以下」なら必ずヒット（カードを引く）。
                                    「17以上」なら必ずスタンド（引かない）。
                                    その中間は、ディーラーの見えているカード（アップカード）によって判断が変わります。
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
