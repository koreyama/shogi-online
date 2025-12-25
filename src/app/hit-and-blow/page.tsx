'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/GameMenu.module.css';
import gameStyles from './HitAndBlow.module.css';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import ColyseusHitBlowGame from './ColyseusHitBlowGame';
import SoloHitAndBlowGame from './HitAndBlowGame'; // Reusing existing for Solo for now, but will clean it up

export default function HitAndBlowPage() {
    const router = useRouter();
    const { playerName, isLoaded } = usePlayer();
    const [joinMode, setJoinMode] = useState<'colyseus_random' | 'colyseus_room' | 'ai' | 'room_menu' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    const handleBackToTop = () => {
        router.push('/');
    };

    const handleRoomCreate = () => {
        setCustomRoomId('');
        setJoinMode('colyseus_room');
    };

    const handleRoomJoin = () => {
        if (!customRoomId) return;
        setJoinMode('colyseus_room');
    };

    if (!isLoaded) return <div className={styles.main}>読み込み中...</div>;

    if (joinMode === 'colyseus_random') {
        return <ColyseusHitBlowGame mode="random" />;
    }

    if (joinMode === 'colyseus_room') {
        return <ColyseusHitBlowGame mode="room" roomId={customRoomId.trim() || undefined} />;
    }

    if (joinMode === 'ai') {
        return (
            <main className={styles.container}>
                <div className={styles.header}><button onClick={() => setJoinMode(null)} className={styles.backButton}><IconBack size={18} /> 終了</button></div>
                <div className={gameStyles.game_layout_wrapper}>
                    <div className={gameStyles.side_panel}>
                        <div className={gameStyles.info_card}>
                            <h3>ソロプレイ</h3>
                            <p>コンピュータが隠した4つの色を、少ない手掛かりで当ててください。</p>
                        </div>
                    </div>
                    <div className={gameStyles.center_panel}>
                        <SoloHitAndBlowGame />
                    </div>
                    <div className={gameStyles.side_panel}>
                        <div className={gameStyles.info_card}>
                            <h3>ヒント</h3>
                            <ul>
                                <li><strong>HIT</strong>: 色と位置が正解</li>
                                <li><strong>BLOW</strong>: 色は合っているが位置が不正解</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <button onClick={handleBackToTop} className={styles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>

            <div className={styles.gameContainer}>
                <h1 className={styles.title}>HIT & BLOW</h1>
                <p className={styles.subtitle}>推理力を駆使して色の正体を見破れ</p>

                {!joinMode && (
                    <div className={styles.modeSelection}>
                        <button onClick={() => setJoinMode('colyseus_random')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconDice size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>ランダムマッチ</span>
                            <span className={styles.modeBtnDesc}>誰かとすぐに対戦</span>
                        </button>

                        <button onClick={() => setJoinMode('room_menu')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconKey size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>ルーム対戦</span>
                            <span className={styles.modeBtnDesc}>友達と対戦</span>
                        </button>

                        <button onClick={() => setJoinMode('ai')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconRobot size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>ソロプレイ</span>
                            <span className={styles.modeBtnDesc}>1人で練習</span>
                        </button>
                    </div>
                )}

                {joinMode === 'room_menu' && (
                    <div className={styles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={handleRoomCreate} className={styles.primaryBtn} style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', padding: '1rem' }}>
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
                                        className={styles.input}
                                        placeholder="ルームID"
                                        value={customRoomId}
                                        onChange={e => setCustomRoomId(e.target.value)}
                                        style={{ flex: 1, letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.1rem' }}
                                    />
                                    <button onClick={handleRoomJoin} className={styles.primaryBtn} style={{ width: 'auto', padding: '0 2rem', whiteSpace: 'nowrap' }}>
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

                {!joinMode && (
                    <div className={styles.contentSection}>
                        <h2 className={styles.contentTitle}>ルールと遊び方</h2>
                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>🎯</span>
                                <h3 className={styles.sectionTitle}>ゲームの目的</h3>
                            </div>
                            <p className={styles.textBlock}>
                                隠された4つの色の順番を推測するゲームです。<br />
                                予想を送信すると、その予想が正解とどれくらい近いかが「HIT」と「BLOW」で返されます。
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
