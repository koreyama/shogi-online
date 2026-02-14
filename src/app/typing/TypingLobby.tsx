'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import navStyles from '@/styles/GameMenu.module.css';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import { IconBack, IconDice, IconKey, IconCpu } from '@/components/Icons';
import { FloatingShapes } from '@/components/landing/FloatingShapes';
import HideChatBot from '@/components/HideChatBot';
import dynamic from 'next/dynamic';

const LoadingSpinner = () => (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{
                width: 50, height: 50, border: '4px solid #e2e8f0',
                borderTopColor: '#06b6d4', borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <h2 style={{ color: '#06b6d4' }}>読み込み中...</h2>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    </div>
);

const TypingGame = dynamic(() => import('./TypingGame'), {
    ssr: false,
    loading: () => <LoadingSpinner />
});

const TypingPracticeGame = dynamic(() => import('./TypingPracticeGame'), {
    ssr: false,
    loading: () => <LoadingSpinner />
});

const TYPING_THEME = {
    '--theme-primary': '#06b6d4',
    '--theme-secondary': '#0891b2',
    '--theme-tertiary': '#22d3ee',
    '--theme-bg-light': '#ecfeff',
    '--theme-text-title': 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)',
} as React.CSSProperties;

export default function TypingLobby() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName } = usePlayer();
    const [mounted, setMounted] = useState(false);

    // Mode state: null = mode selection, 'room' = room setup, 'practice' = solo, 'playing_room' = in game
    const [joinMode, setJoinMode] = useState<'room' | 'practice' | 'playing_room' | 'random' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!authLoading && !user) router.push('/');
    }, [authLoading, user, router]);

    const joinRoomCreate = () => {
        setCustomRoomId('');
        setJoinMode('playing_room');
    };

    const joinRoomJoin = () => {
        if (!customRoomId.trim()) {
            alert("ルームIDを入力してください");
            return;
        }
        setJoinMode('playing_room');
    };

    const handleExit = () => {
        setJoinMode(null);
        setCustomRoomId('');
    };

    if (!mounted || authLoading || !user) return <LoadingSpinner />;

    // Practice Mode
    if (joinMode === 'practice') {
        return <TypingPracticeGame onBack={handleExit} />;
    }

    // Random Match or Room Game
    if (joinMode === 'random' || joinMode === 'playing_room') {
        return (
            <>
                <HideChatBot />
                <TypingGame
                    userData={{ name: playerName || user.displayName || 'Guest', id: user.uid }}
                    mode={joinMode === 'random' ? 'create' : (customRoomId ? 'join' : 'create')}
                    roomId={customRoomId || undefined}
                    onBack={handleExit}
                />
            </>
        );
    }

    // Room Setup Screen
    if (joinMode === 'room') {
        return (
            <main className={navStyles.main} style={TYPING_THEME}>
                <FloatingShapes />
                <div className={navStyles.header}>
                    <button onClick={() => setJoinMode(null)} className={navStyles.backButton}>
                        <IconBack size={18} /> 戻る
                    </button>
                </div>

                <div className={navStyles.gameContainer}>
                    <h1 className={navStyles.title}>ルーム対戦</h1>
                    <p className={navStyles.subtitle}>友達と対戦します</p>

                    <div className={navStyles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button
                                    onClick={joinRoomCreate}
                                    className={navStyles.primaryBtn}
                                    style={{ width: '100%', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: '#fff' }}
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
                                        placeholder="IDを入力"
                                        value={customRoomId}
                                        onChange={(e) => setCustomRoomId(e.target.value)}
                                        className={navStyles.input}
                                        style={{ flex: 1, textAlign: 'center' }}
                                    />
                                    <button
                                        onClick={joinRoomJoin}
                                        className={navStyles.secondaryBtn}
                                        disabled={!customRoomId.trim()}
                                        style={{ width: 'auto', padding: '0 1.5rem', whiteSpace: 'nowrap' }}
                                    >
                                        参加
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Mode Selection Screen (Shogi-style)
    return (
        <main className={navStyles.main} style={TYPING_THEME}>
            <FloatingShapes />
            <div className={navStyles.header}>
                <button onClick={() => router.push('/')} className={navStyles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>

            <div className={navStyles.gameContainer}>
                <h1 className={navStyles.title}>タイピング</h1>
                <p className={navStyles.subtitle}>Typing Battle</p>

                <div className={navStyles.modeSelection}>
                    <button onClick={() => setJoinMode('random')} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconDice size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>ランダムマッチ</span>
                        <span className={navStyles.modeBtnDesc}>世界中のプレイヤーと対戦</span>
                    </button>

                    <button onClick={() => setJoinMode('room')} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconKey size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>ルーム対戦</span>
                        <span className={navStyles.modeBtnDesc}>合言葉で友達と対戦</span>
                    </button>

                    <button onClick={() => setJoinMode('practice')} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconCpu size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>練習モード</span>
                        <span className={navStyles.modeBtnDesc}>一人でタイピング練習</span>
                    </button>
                </div>
            </div>

            {/* Rules Section */}
            <div className={navStyles.contentSection}>
                <h2 className={navStyles.contentTitle}>タイピングバトルについて</h2>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>⌨️</span>
                        <h3 className={navStyles.sectionTitle}>押し合いタイピング</h3>
                    </div>
                    <p className={navStyles.textBlock}>
                        画面に表示される日本語の単語をローマ字でタイプ！
                        正しくタイプするごとに中央のゲージが相手側に押し込まれます。
                        「し」は「si」でも「shi」でも OK！どんな打ち方でも対応しています。
                    </p>
                </div>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>🏆</span>
                        <h3 className={navStyles.sectionTitle}>勝利条件</h3>
                    </div>
                    <div className={navStyles.cardGrid}>
                        <div className={navStyles.infoCard}>
                            <span className={navStyles.cardTitle}>タイムアップ勝利</span>
                            <p className={navStyles.cardText}>制限時間(60秒)終了時にゲージを多く押し込んでいた方が勝ち！</p>
                        </div>
                        <div className={navStyles.infoCard}>
                            <span className={navStyles.cardTitle}>KO 勝利</span>
                            <p className={navStyles.cardText}>ゲージを完全に押し切ればその時点でKO勝利！</p>
                        </div>
                    </div>
                </div>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>💡</span>
                        <h3 className={navStyles.sectionTitle}>練習モード</h3>
                    </div>
                    <p className={navStyles.textBlock}>
                        一人で60秒間のタイピング練習ができます。WPM(1分あたりの単語数)や正確さを計測して、
                        タイピングスキルを磨こう！
                    </p>
                </div>
            </div>
        </main>
    );
}
