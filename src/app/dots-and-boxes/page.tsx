'use client';

import React, { useState, useEffect } from 'react';
import DotsAndBoxesGame from './DotsAndBoxesGame';
import ColyseusDotsAndBoxesGame from './ColyseusDotsAndBoxesGame';
import styles from '@/styles/GameMenu.module.css';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/hooks/usePlayer';

export default function DotsAndBoxesPage() {
    const router = useRouter();
    const { playerName, savePlayerName, playerId, isLoaded: nameLoaded } = usePlayer();
    const [joinMode, setJoinMode] = useState<'menu' | 'ai' | 'random' | 'room' | 'create' | 'join'>('menu');
    const [targetRoomId, setTargetRoomId] = useState('');
    const [tempPlayerName, setTempPlayerName] = useState(playerName || '');

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
                    <h1 className={styles.title}>Dots & Boxes</h1>
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

    // Game rendering
    if (joinMode === 'ai') {
        return <DotsAndBoxesGame onBack={handleBackToMenu} />;
    }

    if (joinMode === 'random') {
        return <ColyseusDotsAndBoxesGame playerName={playerName} playerId={playerId} mode="random" onBack={handleBackToMenu} />;
    }

    if (joinMode === 'create') {
        return <ColyseusDotsAndBoxesGame playerName={playerName} playerId={playerId} mode="room" onBack={handleBackToMenu} />;
    }

    if (joinMode === 'join') {
        return <ColyseusDotsAndBoxesGame playerName={playerName} playerId={playerId} mode="room" roomId={targetRoomId} onBack={handleBackToMenu} />;
    }

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <button onClick={handleBackToTop} className={styles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>

            <div className={styles.gameContainer}>
                <h1 className={styles.title}>Dots & Boxes</h1>
                <p className={styles.subtitle}>陣取り頭脳バトル！</p>

                {joinMode === 'menu' && (
                    <div className={styles.modeSelection}>
                        <button onClick={() => setJoinMode('ai')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconRobot size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>ローカル・AI対戦</span>
                            <span className={styles.modeBtnDesc}>1台で対戦、またはCPUと練習</span>
                        </button>

                        <button onClick={() => setJoinMode('random')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconDice size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>ランダムマッチ</span>
                            <span className={styles.modeBtnDesc}>誰かとすぐに対戦</span>
                        </button>

                        <button onClick={() => setJoinMode('room')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconKey size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>ルーム対戦</span>
                            <span className={styles.modeBtnDesc}>友達と対戦</span>
                        </button>
                    </div>
                )}

                {joinMode === 'room' && (
                    <div className={styles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            {/* Create Section */}
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={() => setJoinMode('create')} className={styles.primaryBtn} style={{ width: '100%', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', padding: '1rem' }}>
                                    ルーム作成（ID自動発行）
                                </button>
                            </div>

                            <div style={{ position: 'relative', height: '1px', background: 'rgba(0,0,0,0.1)', width: '100%' }}>
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#f3f4f6', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
                            </div>

                            {/* Join Section */}
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        className={styles.input}
                                        placeholder="ルームID (6桁)"
                                        value={targetRoomId}
                                        onChange={e => setTargetRoomId(e.target.value)}
                                        style={{ flex: 1, letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.1rem' }}
                                    />
                                    <button onClick={() => setJoinMode('join')} className={styles.primaryBtn} style={{ width: 'auto', padding: '0 2rem', whiteSpace: 'nowrap' }}>
                                        参加
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleBackToMenu} className={styles.secondaryBtn} style={{ marginTop: '2rem' }}>
                            戻る
                        </button>
                    </div>
                )}

                <div className={styles.contentSection}>
                    <h2 className={styles.contentTitle}>Dots & Boxes の遊び方</h2>
                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>📏</span>
                            <h3 className={styles.sectionTitle}>基本ルール</h3>
                        </div>
                        <p className={styles.textBlock}>
                            1. プレイヤーは交互に点と点の間に線を引きます。<br />
                            2. 4辺を囲んで「ボックス」を完成させたプレイヤーが、そのボックスを自分のものにできます。<br />
                            3. ボックスを完成させたプレイヤーは、続けてもう一度線を引くことができます。<br />
                            4. 最終的に獲得したボックスの数が多いプレイヤーの勝利です。
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
