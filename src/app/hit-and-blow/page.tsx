'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import navStyles from '@/styles/GameMenu.module.css';
import { FloatingShapes } from '@/components/landing/FloatingShapes';
import gameStyles from './HitAndBlow.module.css';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import ColyseusHitBlowGame from './ColyseusHitBlowGame';
import SoloHitAndBlowGame from './HitAndBlowGame'; // Reusing existing for Solo for now, but will clean it up
import HideChatBot from '@/components/HideChatBot';
import { useAuth } from '@/hooks/useAuth';

const HIT_AND_BLOW_THEME = {
    '--theme-primary': '#0ea5e9',
    '--theme-secondary': '#0284c7',
    '--theme-tertiary': '#38bdf8',
    '--theme-bg-light': '#e0f2fe',
    '--theme-text-title': 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)',
} as React.CSSProperties;

export default function HitAndBlowPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName, isLoaded } = usePlayer();
    const [joinMode, setJoinMode] = useState<'colyseus_random' | 'colyseus_room' | 'ai' | 'room_menu' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    // Auth Guard
    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

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

    if (!isLoaded || authLoading || !user) return <div className={navStyles.main}>読み込み中...</div>;

    if (joinMode === 'colyseus_random') {
        return (
            <main className={navStyles.main} style={HIT_AND_BLOW_THEME}>
                <FloatingShapes />
                <HideChatBot />
                <ColyseusHitBlowGame mode="random" />
            </main>
        );
    }

    if (joinMode === 'colyseus_room') {
        return (
            <main className={navStyles.main} style={HIT_AND_BLOW_THEME}>
                <FloatingShapes />
                <HideChatBot />
                <ColyseusHitBlowGame mode="room" roomId={customRoomId.trim() || undefined} />
            </main>
        );
    }

    if (joinMode === 'ai') {
        return (
            <main className={navStyles.container} style={HIT_AND_BLOW_THEME}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}><button onClick={() => setJoinMode(null)} className={navStyles.backButton}><IconBack size={18} /> 終了</button></div>
                <div className={gameStyles.game_layout_wrapper} style={{ zIndex: 1, position: 'relative' }}>
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
        <main className={navStyles.main} style={HIT_AND_BLOW_THEME}>
            <FloatingShapes />
            <div className={navStyles.header}>
                <button onClick={handleBackToTop} className={navStyles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>

            <div className={navStyles.gameContainer}>
                <h1 className={navStyles.title}>HIT & BLOW</h1>
                <p className={navStyles.subtitle}>推理力を駆使して色の正体を見破れ</p>

                {!joinMode && (
                    <div className={navStyles.modeSelection}>
                        <button onClick={() => setJoinMode('colyseus_random')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconDice size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ランダムマッチ</span>
                            <span className={navStyles.modeBtnDesc}>誰かとすぐに対戦</span>
                        </button>

                        <button onClick={() => setJoinMode('room_menu')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconKey size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ルーム対戦</span>
                            <span className={navStyles.modeBtnDesc}>友達と対戦</span>
                        </button>

                        <button onClick={() => setJoinMode('ai')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconRobot size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ソロプレイ</span>
                            <span className={navStyles.modeBtnDesc}>1人で練習</span>
                        </button>
                    </div>
                )}

                {joinMode === 'room_menu' && (
                    <div className={navStyles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={handleRoomCreate} className={navStyles.primaryBtn} style={{ width: '100%' }}>
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
                                        className={navStyles.input}
                                        placeholder="ルームID"
                                        value={customRoomId}
                                        onChange={e => setCustomRoomId(e.target.value)}
                                        style={{ flex: 1, letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.1rem' }}
                                    />
                                    <button onClick={handleRoomJoin} className={navStyles.secondaryBtn} style={{ width: 'auto', padding: '0 2rem', whiteSpace: 'nowrap' }}>
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

                {!joinMode && (
                    <div className={navStyles.contentSection}>
                        <h2 className={navStyles.contentTitle}>ルールと遊び方</h2>
                        <div className={navStyles.sectionBlock}>
                            <div className={navStyles.sectionHeader}>
                                <span className={navStyles.sectionIcon}>🎯</span>
                                <h3 className={navStyles.sectionTitle}>ゲームの目的</h3>
                            </div>
                            <p className={navStyles.textBlock}>
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
