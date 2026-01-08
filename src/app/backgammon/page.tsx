'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import navStyles from '@/styles/GameMenu.module.css';
import { FloatingShapes } from '@/components/landing/FloatingShapes';
import { IconBack, IconDice, IconKey } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import ColyseusBackgammonGame from './ColyseusBackgammonGame';
import LocalBackgammonGame from './LocalBackgammonGame';
import HideChatBot from '@/components/HideChatBot';

export default function BackgammonPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName: savedName, savePlayerName, isLoaded } = usePlayer();
    const [mounted, setMounted] = useState(false);
    const [joinMode, setJoinMode] = useState<'random' | 'room' | 'colyseus_room' | 'colyseus_random' | 'cpu' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');
    const [playerName, setPlayerName] = useState('');

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isLoaded && savedName) {
            setPlayerName(savedName);
        }
    }, [isLoaded, savedName]);

    const joinRoomCreate = async () => {
        setCustomRoomId('');
        setJoinMode('colyseus_room');
    };

    const joinRoomJoin = async () => {
        if (!customRoomId.trim()) {
            alert("ルームIDを入力してください");
            return;
        }
        setJoinMode('colyseus_room');
    };

    const joinRandomGame = async () => {
        setJoinMode('colyseus_random');
    };

    const handleBackToTop = () => {
        router.push('/');
    };

    // Setup / Loading
    if (!mounted || authLoading || !user || !isLoaded) return <div className={navStyles.main}>Loading...</div>;

    // Game Active
    if (joinMode === 'colyseus_room') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <ColyseusBackgammonGame mode="room" roomId={customRoomId || undefined} playerName={playerName} />
            </main>
        );
    }
    if (joinMode === 'colyseus_random') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <ColyseusBackgammonGame mode="random" playerName={playerName} />
            </main>
        );
    }

    if (joinMode === 'cpu') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <LocalBackgammonGame onBack={() => setJoinMode(null)} />
            </main>
        );
    }

    const theme = {
        '--theme-primary': '#b91c1c',
        '--theme-secondary': '#991b1b',
        '--theme-tertiary': '#ef4444',
        '--theme-bg-light': '#fef2f2',
        '--theme-text-title': 'linear-gradient(135deg, #991b1b 0%, #b91c1c 50%, #ef4444 100%)',
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
                <h1 className={navStyles.title}>Backgammon</h1>
                <p className={navStyles.welcomeText}>ようこそ、{playerName}さん!</p>

                {!joinMode ? (
                    <div className={navStyles.modeSelection}>
                        <button onClick={joinRandomGame} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconDice size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ランダムマッチ</span>
                            <span className={navStyles.modeBtnDesc}>誰かとすぐに対戦</span>
                        </button>

                        <button onClick={() => setJoinMode('cpu')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}>🤖</div>
                            <span className={navStyles.modeBtnTitle}>AI 対戦</span>
                            <span className={navStyles.modeBtnDesc}>一人で練習</span>
                        </button>

                        <button onClick={() => setJoinMode('room')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconKey size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ルーム対戦</span>
                            <span className={navStyles.modeBtnDesc}>友達と対戦</span>
                        </button>
                    </div>
                ) : (
                    <div className={navStyles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={joinRoomCreate} className={navStyles.primaryBtn} style={{ width: '100%' }}>
                                    ルーム作成（ID自動発行）
                                </button>
                            </div>

                            <div style={{ position: 'relative', height: '1px', background: 'rgba(255,255,255,0.2)', width: '100%' }}>
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={customRoomId}
                                        onChange={(e) => setCustomRoomId(e.target.value)}
                                        placeholder="ルームID"
                                        className={navStyles.input}
                                        style={{ textAlign: 'center' }}
                                    />
                                    <button onClick={joinRoomJoin} className={navStyles.secondaryBtn} style={{ width: 'auto', padding: '0 2rem' }}>
                                        参加
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setJoinMode(null)} className={navStyles.secondaryBtn} style={{ marginTop: '2rem' }}>
                            戻る
                        </button>
                    </div>
                )}

                {/* Game Description */}
                <div className={navStyles.contentSection}>
                    <h2 className={navStyles.contentTitle}>バックギャモンについて</h2>
                    <div className={navStyles.sectionBlock}>
                        <div className={navStyles.sectionHeader}>
                            <span className={navStyles.sectionIcon}>🎲</span>
                            <h3 className={navStyles.sectionTitle}>基本ルール</h3>
                        </div>
                        <p className={navStyles.textBlock}>
                            2つのサイコロを振って駒を進め、全ての駒を先にゴール（盤外へ出す）させた方が勝ちです。<br />
                            白は時計回り（24→1）、黒は反時計回り（1→24）に進みます（またはその逆、設定依存）。
                        </p>
                        <div className={navStyles.cardGrid}>
                            <div className={navStyles.infoCard}>
                                <span className={navStyles.cardTitle}>ヒット (Hit)</span>
                                <p className={navStyles.cardText}>相手の駒が1つだけある場所（ブロット）に止まると、その駒はバー（中央）に飛ばされます。</p>
                            </div>
                            <div className={navStyles.infoCard}>
                                <span className={navStyles.cardTitle}>エンター (Enter)</span>
                                <p className={navStyles.cardText}>飛ばされた駒は、サイコロの目で相手のインナーボードから再開しないと他の駒を動かせません。</p>
                            </div>
                            <div className={navStyles.infoCard}>
                                <span className={navStyles.cardTitle}>ベアオフ (Bear off)</span>
                                <p className={navStyles.cardText}>全ての駒を自分のインナーボードに集めると、サイコロの目に従ってゴール（盤外）させることができます。</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
