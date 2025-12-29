'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { IconBack, IconDice, IconKey } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import ColyseusBackgammonGame from './ColyseusBackgammonGame';

export default function BackgammonPage() {
    const router = useRouter();
    const { playerName: savedName, savePlayerName, isLoaded } = usePlayer();
    const [mounted, setMounted] = useState(false);
    const [joinMode, setJoinMode] = useState<'random' | 'room' | 'colyseus_room' | 'colyseus_random' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');
    const [playerName, setPlayerName] = useState('');

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
    if (!mounted) return <div className={styles.main}>Loading...</div>;

    // Game Active
    if (joinMode === 'colyseus_room') {
        return <ColyseusBackgammonGame mode="room" roomId={customRoomId || undefined} playerName={playerName} />;
    }
    if (joinMode === 'colyseus_random') {
        return <ColyseusBackgammonGame mode="random" playerName={playerName} />;
    }

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <button onClick={handleBackToTop} className={styles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>
            <div className={styles.gameContainer}>
                <h1 className={styles.title}>Backgammon</h1>
                <p className={styles.welcomeText}>ようこそ、{playerName}さん!</p>

                {!joinMode ? (
                    <div className={styles.modeSelection}>
                        <button onClick={joinRandomGame} className={styles.modeBtn}>
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
                ) : (
                    <div className={styles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', width: '100%', maxWidth: '340px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={joinRoomCreate} className={styles.primaryBtn} style={{ width: '100%' }}>
                                    ルーム作成（ID自動発行）
                                </button>
                            </div>

                            <div style={{ position: 'relative', height: '1px', background: 'rgba(0,0,0,0.1)', width: '100%' }}>
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#f7fafc', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={customRoomId}
                                        onChange={(e) => setCustomRoomId(e.target.value)}
                                        placeholder="ルームID"
                                        className={styles.input}
                                    />
                                    <button onClick={joinRoomJoin} className={styles.primaryBtn} style={{ width: 'auto', padding: '0 2rem' }}>
                                        参加
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setJoinMode(null)} className={styles.secondaryBtn} style={{ marginTop: '2rem' }}>
                            戻る
                        </button>
                    </div>
                )}

                {/* Game Description */}
                <div className={styles.contentSection}>
                    <h2 className={styles.contentTitle}>バックギャモンについて</h2>
                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>🎲</span>
                            <h3 className={styles.sectionTitle}>基本ルール</h3>
                        </div>
                        <p className={styles.textBlock}>
                            2つのサイコロを振って駒を進め、全ての駒を先にゴール（盤外へ出す）させた方が勝ちです。<br />
                            白は時計回り（24→1）、黒は反時計回り（1→24）に進みます（またはその逆、設定依存）。
                        </p>
                        <div className={styles.cardGrid}>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>ヒット (Hit)</span>
                                <p className={styles.cardText}>相手の駒が1つだけある場所（ブロット）に止まると、その駒はバー（中央）に飛ばされます。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>エンター (Enter)</span>
                                <p className={styles.cardText}>飛ばされた駒は、サイコロの目で相手のインナーボードから再開しないと他の駒を動かせません。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>ベアオフ (Bear off)</span>
                                <p className={styles.cardText}>全ての駒を自分のインナーボードに集めると、サイコロの目に従ってゴール（盤外）させることができます。</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
