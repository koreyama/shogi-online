'use client';

import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

import { useRouter } from 'next/navigation';
import navStyles from '@/styles/GameMenu.module.css';
import { FloatingShapes } from '@/components/landing/FloatingShapes';
import { IconBack, IconRobot, IconDice, IconKey } from '@/components/Icons';
import { useAuth } from '@/hooks/useAuth';
import GoAiGame from './GoAiGame';
import ColyseusGoGame from './ColyseusGoGame';
import HideChatBot from '@/components/HideChatBot';

type GameMode = 'select' | 'ai' | 'online-random' | 'online-room';

export default function GoPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [mode, setMode] = useState<GameMode>('select');
    const [roomIdInput, setRoomIdInput] = useState('');
    const [showRoomInput, setShowRoomInput] = useState(false);
    const [profileName, setProfileName] = useState<string | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    // Fetch profile name from Firestore
    useEffect(() => {
        const fetchProfile = async () => {
            if (user?.uid) {
                try {
                    const { getUserProfile } = await import('@/lib/firebase/users');
                    const profile = await getUserProfile(user.uid);
                    if (profile?.displayName) {
                        setProfileName(profile.displayName);
                    } else {
                        setProfileName("Guest");
                    }
                } catch (e) {
                    console.warn("Failed to fetch user profile:", e);
                    setProfileName("Guest");
                }
            } else {
                setProfileName("Guest");
            }
            setProfileLoading(false);
        };
        if (!authLoading) {
            fetchProfile();
        }
    }, [user, authLoading]);

    const userName = profileName || "Guest";
    const userId = user?.uid || "guest-" + Math.floor(Math.random() * 10000);
    const isLoading = authLoading || profileLoading;

    const handleBack = () => {
        if (mode !== 'select') {
            if (confirm('Are you sure you want to quit?')) {
                setMode('select');
                setShowRoomInput(false);
            }
        } else {
            router.push('/');
        }
    };

    const startOnlineRoom = () => {
        if (!roomIdInput.trim()) {
            // Create
            setMode('online-room');
        } else {
            // Join
            setMode('online-room');
        }
    };

    if (mode === 'ai') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}>
                    <button className={navStyles.backButton} onClick={handleBack}>
                        <IconBack size={18} /> 終了
                    </button>
                </div>
                <div style={{ position: 'relative', zIndex: 10, width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <GoAiGame />
                </div>
            </main>
        );
    }

    if (mode === 'online-random' || mode === 'online-room') {
        // Wait for profile to load before starting game
        if (isLoading) {
            return (
                <main className={navStyles.main}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                        <p>Loading...</p>
                    </div>
                </main>
            );
        }

        return (
            <main className={navStyles.main} style={{ padding: 0 }}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}>
                    <button className={navStyles.backButton} onClick={handleBack}>
                        <IconBack size={18} /> 終了
                    </button>
                </div>
                <div style={{ position: 'relative', zIndex: 10, width: '100%', padding: '0 1rem', boxSizing: 'border-box' }}>
                    <ColyseusGoGame
                        mode={mode === 'online-random' ? 'random' : 'room'}
                        roomId={mode === 'online-room' && roomIdInput ? roomIdInput : undefined}
                        userData={{ name: userName, id: userId }}
                    />
                </div>
            </main>
        );
    }

    const theme = {
        '--theme-primary': '#475569',
        '--theme-secondary': '#1e293b',
        '--theme-tertiary': '#64748b',
        '--theme-bg-light': '#f8fafc',
        '--theme-text-title': 'linear-gradient(135deg, #1e293b 0%, #475569 50%, #64748b 100%)',
    } as React.CSSProperties;

    return (
        <main className={navStyles.main} style={theme}>
            <FloatingShapes />
            <div className={navStyles.header}>
                <button className={navStyles.backButton} onClick={() => router.push('/')}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>

            <div className={navStyles.gameContainer}>
                <h1 className={navStyles.title}>囲碁</h1>
                <p className={navStyles.subtitle}>ゲームモードを選択してください</p>

                {!showRoomInput ? (
                    <div className={navStyles.modeSelection}>
                        <button className={navStyles.modeBtn} onClick={() => setMode('online-random')}>
                            <div className={navStyles.modeBtnIcon}><IconDice size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ランダム対戦</span>
                            <span className={navStyles.modeBtnDesc}>オンラインで誰かと対局</span>
                        </button>

                        <button className={navStyles.modeBtn} onClick={() => setShowRoomInput(true)}>
                            <div className={navStyles.modeBtnIcon}><IconKey size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ルーム対戦</span>
                            <span className={navStyles.modeBtnDesc}>友達と合言葉で対局</span>
                        </button>

                        <button className={navStyles.modeBtn} onClick={() => setMode('ai')}>
                            <div className={navStyles.modeBtnIcon}><IconRobot size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>CPU対戦</span>
                            <span className={navStyles.modeBtnDesc}>AIと対局練習</span>
                        </button>
                    </div>
                ) : (
                    <div className={navStyles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button
                                    onClick={() => { setRoomIdInput(''); startOnlineRoom(); }}
                                    className={navStyles.primaryBtn}
                                    style={{ width: '100%', background: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)', color: '#fff' }}
                                >
                                    ルーム作成（ID自動発行）
                                </button>
                            </div>

                            <div style={{ position: 'relative', height: '1px', background: 'rgba(0,0,0,0.1)', width: '100%' }}>
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={roomIdInput}
                                        onChange={(e) => setRoomIdInput(e.target.value)}
                                        placeholder="IDを入力"
                                        className={navStyles.input}
                                        style={{ flex: 1, textAlign: 'center' }}
                                    />
                                    <button
                                        onClick={startOnlineRoom}
                                        className={navStyles.secondaryBtn}
                                        style={{ width: 'auto', padding: '0 1.5rem', whiteSpace: 'nowrap' }}
                                        disabled={!roomIdInput.trim()}
                                    >
                                        参加
                                    </button>
                                </div>
                            </div>
                            <button className={navStyles.secondaryBtn} onClick={() => setShowRoomInput(false)} style={{ marginTop: '0rem' }}>キャンセル</button>
                        </div>
                    </div>
                )}
            </div>

            <div className={navStyles.contentSection}>
                <h2 className={navStyles.contentTitle}>囲碁のルールと遊び方</h2>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>⚫⚪</span>
                        <h3 className={navStyles.sectionTitle}>基本ルール</h3>
                    </div>
                    <ul className={navStyles.list}>
                        <li className={navStyles.listItem}>黒番と白番が交互に、盤上の交点に石を打ちます。</li>
                        <li className={navStyles.listItem}>一度置いた石は動かせません（囲まれて取られる場合を除く）。</li>
                        <li className={navStyles.listItem}>パスをすることができます。双方が連続してパスをすると終局となります。</li>
                    </ul>
                </div>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>🤏</span>
                        <h3 className={navStyles.sectionTitle}>石の取り方</h3>
                    </div>
                    <p className={navStyles.textBlock}>
                        相手の石の縦横の連結している線（呼吸点）をすべて自分の石で塞ぐと、その石を取って「アゲハマ」にすることができます。
                        盤の端にある石は、少ない手数で囲むことができます。
                    </p>
                </div>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>🚩</span>
                        <h3 className={navStyles.sectionTitle}>勝敗の決め方（地）</h3>
                    </div>
                    <p className={navStyles.textBlock}>
                        終局後、自分の石で囲んだ空交点の数（地）と、取った相手の石（アゲハマ）の合計が多い方が勝ちとなります。
                        （本ゲームでは簡易的な日本ルールを採用しており、アゲハマを計算に含めます）
                    </p>
                </div>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>🚫</span>
                        <h3 className={navStyles.sectionTitle}>禁止手</h3>
                    </div>
                    <ul className={navStyles.list}>
                        <li className={navStyles.listItem}><strong>着手禁止点（自殺手）:</strong> 打った瞬間に自分の石が囲まれて取られてしまう場所には打てません（ただし、打つことで相手の石を取れる場合は打てます）。</li>
                        <li className={navStyles.listItem}><strong>コウ（劫）:</strong> 相手に石を1つ取られた直後に、取り返して元の形に戻るような手は打てません。別の場所に打って（コウ材）、相手が受けてから取り返す必要があります。</li>
                    </ul>
                </div>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>🎮</span>
                        <h3 className={navStyles.sectionTitle}>ゲームの進行</h3>
                    </div>
                    <ul className={navStyles.list}>
                        <li className={navStyles.listItem}>対局開始時、黒番から打ち始めます（ハンデなしの場合）。</li>
                        <li className={navStyles.listItem}>終局後、自動的に整地は行われないため、アゲハマの数を参考に勝敗を確認してください。</li>
                        <li className={navStyles.listItem}>オンライン対戦では、相手との合意による終局（両者パス）か、投了によって決着がつきます。</li>
                    </ul>
                </div>
            </div>
        </main>
    );
}
