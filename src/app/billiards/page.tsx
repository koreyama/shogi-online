'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconBack, IconDice, IconKey, IconUser } from '@/components/Icons';
import ColyseusBilliardsGame from './ColyseusBilliardsGame';
import navStyles from '@/styles/GameMenu.module.css';
import { FloatingShapes } from '@/components/landing/FloatingShapes';

type GameMode = 'lobby' | 'room_menu' | 'solo' | 'multiplayer' | 'room_create' | 'room_join';

export default function BilliardsPage() {
    const router = useRouter();
    const [gameMode, setGameMode] = useState<GameMode>('lobby');
    const [roomIdInput, setRoomIdInput] = useState("");

    const handleBack = () => {
        setGameMode('lobby');
        setRoomIdInput("");
    };

    // Show game if mode is selected
    if (gameMode === 'solo' || gameMode === 'multiplayer' || gameMode === 'room_create') {
        return (
            <ColyseusBilliardsGame
                mode={gameMode === 'solo' ? 'solo' : 'multiplayer'}
                isPrivate={gameMode === 'room_create'}
                onBack={handleBack}
            />
        );
    }

    if (gameMode === 'room_join') {
        return (
            <ColyseusBilliardsGame
                mode="multiplayer"
                roomId={roomIdInput}
                onBack={handleBack}
            />
        );
    }

    // Room Menu (Create or Join)
    if (gameMode === 'room_menu') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <div className={navStyles.header}>
                    <button onClick={() => setGameMode('lobby')} className={navStyles.backButton}>
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
                                    onClick={() => setGameMode('room_create')}
                                    className={navStyles.primaryBtn}
                                    style={{ width: '100%' }}
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
                                        value={roomIdInput}
                                        onChange={(e) => setRoomIdInput(e.target.value)}
                                        className={navStyles.input}
                                        style={{ flex: 1, textAlign: 'center' }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (roomIdInput.trim()) setGameMode('room_join');
                                        }}
                                        className={navStyles.secondaryBtn}
                                        disabled={!roomIdInput.trim()}
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

    // Lobby
    const theme = {
        '--theme-primary': '#10b981',
        '--theme-secondary': '#059669',
        '--theme-tertiary': '#34d399',
        '--theme-bg-light': '#ecfdf5',
        '--theme-text-title': 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
    } as React.CSSProperties;

    return (
        <main className={navStyles.main} style={theme}>
            <FloatingShapes />
            <div className={navStyles.header}>
                <button onClick={() => router.push('/')} className={navStyles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>

            <div className={navStyles.gameContainer}>
                <h1 className={navStyles.title}>BILLIARDS</h1>


                <div className={navStyles.modeSelection}>
                    <button onClick={() => setGameMode('solo')} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconUser size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>ソロ練習</span>
                        <span className={navStyles.modeBtnDesc}>1人でショット練習</span>
                    </button>

                    <button onClick={() => setGameMode('multiplayer')} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconDice size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>ランダムマッチ</span>
                        <span className={navStyles.modeBtnDesc}>世界中の誰かと対戦</span>
                    </button>

                    <button onClick={() => setGameMode('room_menu')} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconKey size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>ルーム対戦</span>
                        <span className={navStyles.modeBtnDesc}>合言葉で友達と対戦</span>
                    </button>
                </div>
            </div>

            {/* Rules Section */}
            <div className={navStyles.contentSection}>
                <h2 className={navStyles.contentTitle}>8ボール（エイトボール）の世界へ</h2>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>🎱</span>
                        <h3 className={navStyles.sectionTitle}>基本的なルール</h3>
                    </div>
                    <p className={navStyles.textBlock}>
                        8ボールは、1番から15番までの的球と、手球（白）を使うビリヤード競技です。
                        プレイヤーは「ソリッド（1-7番）」と「ストライプ（9-15番）」のグループに分かれ、
                        自分のグループのボールを全てポケットに入れた後、最後に8番ボールを入れたプレイヤーが勝利となります。
                    </p>
                    <div className={navStyles.cardGrid}>
                        <div className={navStyles.infoCard}>
                            <span className={navStyles.cardTitle}>1. ブレイクショット</span>
                            <p className={navStyles.cardText}>最初のショットでボールを散らします。ポケットに入ればそのまま続行できます。</p>
                        </div>
                        <div className={navStyles.infoCard}>
                            <span className={navStyles.cardTitle}>2. グループ決定</span>
                            <p className={navStyles.cardText}>ブレイク後、最初にポケットに入れたボールの種類で自分のグループが決まります。</p>
                        </div>
                        <div className={navStyles.infoCard}>
                            <span className={navStyles.cardTitle}>3. 勝利条件</span>
                            <p className={navStyles.cardText}>自分のグループのボールを全て入れ、最後に8番ボールを指定のポケットに入れます。</p>
                        </div>
                        <div className={navStyles.infoCard}>
                            <span className={navStyles.cardTitle}>4. ファウル</span>
                            <p className={navStyles.cardText}>手球がポケットに落ちたり、自分のボールに当たらなかった場合はファウルとなり、相手にフリーボールが与えられます。</p>
                        </div>
                    </div>
                </div>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>✨</span>
                        <h3 className={navStyles.sectionTitle}>このゲームの特徴</h3>
                    </div>
                    <div className={navStyles.highlightBox}>
                        <span className={navStyles.highlightTitle}>リアルな物理演算</span>
                        <p className={navStyles.textBlock} style={{ marginBottom: 0 }}>
                            Matter.jsエンジンを使用し、ボールの衝突、摩擦、跳ね返りをリアルにシミュレーションしています。
                            力の加減や角度を細かく調整して、狙い通りのショットを打ちましょう。
                        </p>
                    </div>
                    <p className={navStyles.textBlock}>
                        ソロモードでは時間制限なしで練習し、マルチプレイではリアルタイムで世界中のプレイヤーと対戦できます。
                        ルーム機能を使えば、離れた友達ともすぐに遊ぶことができます。
                    </p>
                </div>
            </div>
        </main>
    );
}
