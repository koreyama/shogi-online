'use client';

import React, { useState, useEffect } from 'react';
import DotsAndBoxesGame from './DotsAndBoxesGame';
import ColyseusDotsAndBoxesGame from './ColyseusDotsAndBoxesGame';
import navStyles from '@/styles/GameMenu.module.css';
import { FloatingShapes } from '@/components/landing/FloatingShapes';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import HideChatBot from '@/components/HideChatBot';

export default function DotsAndBoxesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName, savePlayerName, playerId, isLoaded: nameLoaded } = usePlayer();
    const [joinMode, setJoinMode] = useState<'menu' | 'ai' | 'random' | 'room' | 'create' | 'join'>('menu');
    const [targetRoomId, setTargetRoomId] = useState('');
    const [tempPlayerName, setTempPlayerName] = useState(playerName || '');

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

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

    if (!nameLoaded || authLoading || !user) return <div className={navStyles.main}>Loading...</div>;

    if (!playerName) {
        return (
            <main className={navStyles.container}>
                <FloatingShapes />
                <div className={navStyles.header}>
                    <h1 className={navStyles.title}>Dots & Boxes</h1>
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

    // Game rendering
    // Game rendering
    if (joinMode === 'ai') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <DotsAndBoxesGame onBack={handleBackToMenu} />
            </main>
        );
    }

    if (joinMode === 'random') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <ColyseusDotsAndBoxesGame playerName={playerName} playerId={playerId} mode="random" onBack={handleBackToMenu} />
            </main>
        );
    }

    if (joinMode === 'create') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <ColyseusDotsAndBoxesGame playerName={playerName} playerId={playerId} mode="room" onBack={handleBackToMenu} />
            </main>
        );
    }

    if (joinMode === 'join') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <ColyseusDotsAndBoxesGame playerName={playerName} playerId={playerId} mode="room" roomId={targetRoomId} onBack={handleBackToMenu} />
            </main>
        );
    }

    const theme = {
        '--theme-primary': '#06b6d4',
        '--theme-secondary': '#0891b2',
        '--theme-tertiary': '#22d3ee',
        '--theme-bg-light': '#ecfeff',
        '--theme-text-title': 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)',
    } as React.CSSProperties;

    return (
        <main className={navStyles.main} style={theme}>
            <FloatingShapes />
            <div className={navStyles.header}>
                <button onClick={handleBackToTop} className={navStyles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>

            <div className={navStyles.gameContainer}>
                <h1 className={navStyles.title}>Dots & Boxes</h1>
                <p className={navStyles.subtitle}>陣取り頭脳バトル！</p>

                {joinMode === 'menu' && (
                    <div className={navStyles.modeSelection}>
                        <button onClick={() => setJoinMode('ai')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconRobot size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ローカル・AI対戦</span>
                            <span className={navStyles.modeBtnDesc}>1台で対戦、またはCPUと練習</span>
                        </button>

                        <button onClick={() => setJoinMode('random')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconDice size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ランダムマッチ</span>
                            <span className={navStyles.modeBtnDesc}>誰かとすぐに対戦</span>
                        </button>

                        <button onClick={() => setJoinMode('room')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconKey size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ルーム対戦</span>
                            <span className={navStyles.modeBtnDesc}>友達と対戦</span>
                        </button>
                    </div>
                )}

                {joinMode === 'room' && (
                    <div className={navStyles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            {/* Create Section */}
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={() => setJoinMode('create')} className={navStyles.primaryBtn} style={{ width: '100%' }}>
                                    ルーム作成（ID自動発行）
                                </button>
                            </div>

                            <div style={{ position: 'relative', height: '1px', background: 'rgba(255,255,255,0.2)', width: '100%' }}>
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
                            </div>

                            {/* Join Section */}
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        className={navStyles.input}
                                        placeholder="ルームID (6桁)"
                                        value={targetRoomId}
                                        onChange={e => setTargetRoomId(e.target.value)}
                                        style={{ flex: 1, letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.1rem' }}
                                    />
                                    <button onClick={() => setJoinMode('join')} className={navStyles.secondaryBtn} style={{ width: 'auto', padding: '0 2rem', whiteSpace: 'nowrap' }}>
                                        参加
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleBackToMenu} className={navStyles.secondaryBtn} style={{ marginTop: '2rem' }}>
                            戻る
                        </button>
                    </div>
                )}

                <div className={navStyles.contentSection}>
                    <h2 className={navStyles.contentTitle}>Dots & Boxes の遊び方</h2>
                    <div className={navStyles.sectionBlock}>
                        <div className={navStyles.sectionHeader}>
                            <span className={navStyles.sectionIcon}>📏</span>
                            <h3 className={navStyles.sectionTitle}>基本ルール</h3>
                        </div>
                        <p className={navStyles.textBlock}>
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
