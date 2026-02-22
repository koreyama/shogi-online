'use client';

import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

import { useRouter } from 'next/navigation';
import navStyles from '@/styles/GameMenu.module.css';
import { FloatingShapes } from '@/components/landing/FloatingShapes';
import { usePlayer } from '@/hooks/usePlayer';
import { IconBack, IconDice, IconKey, IconRobot, IconTrophy } from '@/components/Icons';
import YachtGame from './YachtGame';
import ColyseusYachtGame from './ColyseusYachtGame';
import HideChatBot from '@/components/HideChatBot';

import { useAuth } from '@/hooks/useAuth';

export default function YachtPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName, playerId, savePlayerName, isLoaded: nameLoaded } = usePlayer();

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    // Mode Selection: 'menu', 'ai', 'random', 'room', 'create', 'join'
    const [joinMode, setJoinMode] = useState<'menu' | 'ai' | 'random' | 'room' | 'create' | 'join'>('menu');
    const [targetRoomId, setTargetRoomId] = useState('');
    const [tempPlayerName, setTempPlayerName] = useState('');
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

    useEffect(() => {
        if (showLeaderboard) {
            import('@/lib/yacht/ranking').then(async (mod) => {
                const data = await mod.getYachtLeaderboard();
                setLeaderboardData(data);
            });
        }
    }, [showLeaderboard]);

    useEffect(() => {
        if (nameLoaded && playerName) {
            setTempPlayerName(playerName);
        }
    }, [nameLoaded, playerName]);

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tempPlayerName.trim()) {
            savePlayerName(tempPlayerName.trim());
        }
    };

    const handleBackToMenu = () => {
        setJoinMode('menu');
        setTargetRoomId('');
    };

    const handleBackToTop = () => {
        router.push('/');
    };

    if (!nameLoaded || authLoading || !user) return null;

    if (!playerName) {
        return (
            <main className={navStyles.container}>
                <FloatingShapes />
                <div className={navStyles.header}>
                    <h1 className={navStyles.title}>Yacht (ヨット)</h1>
                    <p className={navStyles.subtitle}>名前を入力して開始</p>
                </div>
                <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%', zIndex: 1, position: 'relative' }}>
                    <form onSubmit={handleNameSubmit} className={navStyles.setupForm}>
                        <input
                            value={tempPlayerName}
                            onChange={(e) => setTempPlayerName(e.target.value)}
                            placeholder="プレイヤー名"
                            className={navStyles.input}
                            required
                        />
                        <button type="submit" className={navStyles.primaryBtn} style={{ width: '100%' }}>次へ</button>
                    </form>
                </div>
            </main>
        );
    }

    // --- GAME VIEWS ---
    // --- GAME VIEWS ---
    if (joinMode === 'ai') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}>
                    <button onClick={handleBackToMenu} className={navStyles.backButton}><IconBack size={18} /> 終了</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', zIndex: 1 }}>
                    <YachtGame onBack={handleBackToMenu} />
                </div>
            </main>
        );
    }

    if (joinMode === 'random') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <ColyseusYachtGame mode="random" onBack={handleBackToMenu} />
            </main>
        );
    }

    if (joinMode === 'create') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <ColyseusYachtGame mode="room" onBack={handleBackToMenu} />
            </main>
        );
    }

    if (joinMode === 'join') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <ColyseusYachtGame mode="room" roomId={targetRoomId} onBack={handleBackToMenu} />
            </main>
        );
    }

    const theme = {
        '--theme-primary': '#9333ea',
        '--theme-secondary': '#7e22ce',
        '--theme-tertiary': '#a855f7',
        '--theme-bg-light': '#faf5ff',
        '--theme-text-title': 'linear-gradient(135deg, #7e22ce 0%, #9333ea 50%, #a855f7 100%)',
    } as React.CSSProperties;

    return (
        <main className={navStyles.main} style={theme}>
            <FloatingShapes />
            {showLeaderboard && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }} onClick={() => setShowLeaderboard(false)}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '16px',
                        width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: '#333'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#333' }}>
                            <IconTrophy size={28} color="#FFD700" />
                            ランキング (Top 20)
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {leaderboardData.map((user, index) => (
                                <div key={user.userId || index} style={{
                                    display: 'flex', alignItems: 'center', padding: '0.8rem',
                                    backgroundColor: index === 0 ? '#fffbeb' : '#f8fafc',
                                    borderRadius: '8px', border: index === 0 ? '2px solid #fcd34d' : '1px solid #e2e8f0'
                                }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        backgroundColor: index < 3 ? '#fbbf24' : '#e2e8f0',
                                        color: index < 3 ? 'white' : '#64748b',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', marginRight: '1rem'
                                    }}>
                                        {index + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{user.userName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(user.timestamp).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                        {user.score}
                                    </div>
                                </div>
                            ))}
                            {leaderboardData.length === 0 && <p style={{ textAlign: 'center', color: '#64748b' }}>ランキングデータがありません</p>}
                        </div>
                        <button onClick={() => setShowLeaderboard(false)} className={navStyles.secondaryBtn} style={{ marginTop: '2rem', width: '100%' }}>閉じる</button>
                    </div>
                </div>
            )}

            <div className={navStyles.header}>
                <button onClick={handleBackToTop} className={navStyles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
                <button
                    onClick={() => setShowLeaderboard(true)}
                    className={navStyles.backButton}
                    style={{ left: 'auto', right: 0, background: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d' }}
                >
                    <IconTrophy size={18} /> ランキング
                </button>
            </div>

            <div className={navStyles.gameContainer}>
                <h1 className={navStyles.title}>Yacht</h1>
                <p className={navStyles.subtitle}>運と戦略のダイスゲーム！</p>

                {joinMode === 'menu' && (
                    <div className={navStyles.modeSelection}>
                        <button onClick={() => setJoinMode('ai')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconRobot size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ソロプレイ</span>
                            <span className={navStyles.modeBtnDesc}>1人でハイスコアを目指す</span>
                        </button>
                        <button onClick={() => setJoinMode('random')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconDice size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ランダムマッチ</span>
                            <span className={navStyles.modeBtnDesc}>誰かとオンライン対戦</span>
                        </button>
                        <button onClick={() => setJoinMode('room')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconKey size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ルーム対戦</span>
                            <span className={navStyles.modeBtnDesc}>友達と合言葉で対戦</span>
                        </button>
                    </div>
                )}

                {joinMode === 'room' && (
                    <div className={navStyles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={() => setJoinMode('create')} className={navStyles.primaryBtn} style={{ width: '100%' }}>
                                    ルーム作成
                                </button>
                            </div>
                            <div style={{ position: 'relative', height: '1px', background: 'rgba(255,255,255,0.2)', width: '100%' }}>
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        className={navStyles.input}
                                        placeholder="ルームID (6桁)"
                                        value={targetRoomId}
                                        onChange={e => setTargetRoomId(e.target.value)}
                                        style={{ flex: 1, textAlign: 'center' }}
                                    />
                                    <button onClick={() => setJoinMode('join')} className={navStyles.secondaryBtn} style={{ width: 'auto', padding: '0 2rem' }}>
                                        参加
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleBackToMenu} className={navStyles.secondaryBtn} style={{ marginTop: '2rem' }}>戻る</button>
                    </div>
                )}
            </div>

            <div className={navStyles.contentSection}>
                <h2 className={navStyles.contentTitle}>Yacht (ヨット) のルールと役</h2>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>🎲</span>
                        <h3 className={navStyles.sectionTitle}>ゲームの流れ</h3>
                    </div>
                    <p className={navStyles.textBlock}>
                        5つのダイスを振り、ポーカーの役のような組み合わせを作って高得点を目指すゲームです。全12ラウンド行います。
                    </p>
                    <ul className={navStyles.list}>
                        <li className={navStyles.listItem}>各ターン、ダイスは最大3回まで振ることができます。</li>
                        <li className={navStyles.listItem}>「残したいダイス」をタップしてホールド（保持）し、残りを振り直します。</li>
                        <li className={navStyles.listItem}>3回振り終わるか、途中で役が完成したら、スコアシートの空いている場所に点数を記録します。</li>
                        <li className={navStyles.listItem}>一度埋めた場所には書き直せません。点数が低い役でも、どこかに記録しなければなりません（0点になることもあります）。</li>
                    </ul>
                </div>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>📋</span>
                        <h3 className={navStyles.sectionTitle}>役（カテゴリー）一覧</h3>
                    </div>

                    <div className={navStyles.cardGrid}>
                        <div className={navStyles.infoCard}>
                            <span className={navStyles.cardTitle}>数字の部 (Upper)</span>
                            <p className={navStyles.cardText}>
                                <strong>1〜6 (Ace〜Six):</strong> 指定した数字のダイスの合計値が得点。<br />
                                <strong>ボーナス:</strong> 数字の部の合計が63点以上なら、＋35点のボーナスがつきます！
                            </p>
                        </div>
                        <div className={navStyles.infoCard}>
                            <span className={navStyles.cardTitle}>役の部 (Lower)</span>
                            <p className={navStyles.cardText}>
                                <strong>チョイス:</strong> ダイス5つの合計値。<br />
                                <strong>4カード:</strong> 同じ数字が4つ以上。ダイス5つの合計値。<br />
                                <strong>フルハウス:</strong> 3枚組＋2枚組。固定25点。<br />
                                <strong>Sストレート:</strong> 4つ連続（例:1-2-3-4）。固定30点。<br />
                                <strong>Bストレート:</strong> 5つ連続（例:2-3-4-5-6）。固定40点。<br />
                                <strong>ヨット:</strong> 5つ全て同じ数字。固定50点。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
