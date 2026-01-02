'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/GameMenu.module.css';
import { usePlayer } from '@/hooks/usePlayer';
import { IconBack, IconDice, IconKey, IconRobot, IconTrophy } from '@/components/Icons';
import YachtGame from './YachtGame';
import ColyseusYachtGame from './ColyseusYachtGame';
import HideChatBot from '@/components/HideChatBot';

export default function YachtPage() {
    const router = useRouter();
    const { playerName, playerId, savePlayerName, isLoaded: nameLoaded } = usePlayer();

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

    if (!nameLoaded) return null;

    if (!playerName) {
        return (
            <main className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Yacht (ヨット)</h1>
                    <p className={styles.subtitle}>名前を入力して開始</p>
                </div>
                <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                    <form onSubmit={handleNameSubmit} className={styles.setupForm}>
                        <input
                            value={tempPlayerName}
                            onChange={(e) => setTempPlayerName(e.target.value)}
                            placeholder="プレイヤー名"
                            className={styles.input}
                            required
                        />
                        <button type="submit" className={styles.primaryBtn} style={{ width: '100%' }}>次へ</button>
                    </form>
                </div>
            </main>
        );
    }

    // --- GAME VIEWS ---
    if (joinMode === 'ai') {
        return (
            <main className={styles.main}>
                <HideChatBot />
                <div className={styles.header}>
                    <button onClick={handleBackToMenu} className={styles.backButton}><IconBack size={18} /> 終了</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <YachtGame onBack={handleBackToMenu} />
                </div>
            </main>
        );
    }

    if (joinMode === 'random') {
        return <><HideChatBot /><ColyseusYachtGame playerName={playerName} playerId={playerId} mode="random" onBack={handleBackToMenu} /></>;
    }

    if (joinMode === 'create') {
        return <><HideChatBot /><ColyseusYachtGame playerName={playerName} playerId={playerId} mode="room" onBack={handleBackToMenu} /></>;
    }

    if (joinMode === 'join') {
        return <><HideChatBot /><ColyseusYachtGame playerName={playerName} playerId={playerId} mode="room" roomId={targetRoomId} onBack={handleBackToMenu} /></>;
    }

    return (
        <main className={styles.main}>
            {showLeaderboard && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }} onClick={() => setShowLeaderboard(false)}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '16px',
                        width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
                        <button onClick={() => setShowLeaderboard(false)} className={styles.secondaryBtn} style={{ marginTop: '2rem', width: '100%' }}>閉じる</button>
                    </div>
                </div>
            )}

            <div className={styles.header}>
                <button onClick={handleBackToTop} className={styles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
                <button
                    onClick={() => setShowLeaderboard(true)}
                    className={styles.backButton}
                    style={{ left: 'auto', right: 0, background: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d' }}
                >
                    <IconTrophy size={18} /> ランキング
                </button>
            </div>

            <div className={styles.gameContainer}>
                <h1 className={styles.title}>Yacht</h1>
                <p className={styles.subtitle}>運と戦略のダイスゲーム！</p>

                {joinMode === 'menu' && (
                    <div className={styles.modeSelection}>
                        <button onClick={() => setJoinMode('ai')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconRobot size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>ソロプレイ</span>
                            <span className={styles.modeBtnDesc}>1人でハイスコアを目指す</span>
                        </button>
                        <button onClick={() => setJoinMode('random')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconDice size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>ランダムマッチ</span>
                            <span className={styles.modeBtnDesc}>誰かとオンライン対戦</span>
                        </button>
                        <button onClick={() => setJoinMode('room')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconKey size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>ルーム対戦</span>
                            <span className={styles.modeBtnDesc}>友達と合言葉で対戦</span>
                        </button>
                    </div>
                )}

                {joinMode === 'room' && (
                    <div className={styles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={() => setJoinMode('create')} className={styles.primaryBtn} style={{ width: '100%', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#fff' }}>
                                    ルーム作成
                                </button>
                            </div>
                            <div style={{ position: 'relative', height: '1px', background: 'rgba(0,0,0,0.1)', width: '100%' }}>
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#f3f4f6', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        className={styles.input}
                                        placeholder="ルームID (6桁)"
                                        value={targetRoomId}
                                        onChange={e => setTargetRoomId(e.target.value)}
                                        style={{ flex: 1, textAlign: 'center' }}
                                    />
                                    <button onClick={() => setJoinMode('join')} className={styles.primaryBtn} style={{ width: 'auto' }}>
                                        参加
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleBackToMenu} className={styles.secondaryBtn} style={{ marginTop: '2rem' }}>戻る</button>
                    </div>
                )}
            </div>

            <div className={styles.contentSection}>
                <h2 className={styles.contentTitle}>Yacht (ヨット) の遊び方</h2>
                <div className={styles.sectionBlock}>
                    <p className={styles.textBlock}>
                        5つのダイスを振り、特定の「役」を作って点数を競うゲームです。
                        各ターンでは最大3回までダイスを振ることができ、残したいダイスを「ホールド（保持）」することができます。
                        最終的にスコアシートをすべて埋め、合計点数が高いプレイヤーの勝利です。
                    </p>
                </div>
            </div>
        </main>
    );
}
