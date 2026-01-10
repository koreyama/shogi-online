import React, { useState } from 'react';
import navStyles from '@/styles/GameMenu.module.css';
import { IconBack, IconDice, IconKey, IconUsers } from '@/components/Icons';
import { FloatingShapes } from '@/components/landing/FloatingShapes';

interface WerewolfLobbyProps {
    onJoinRandom: () => void;
    onCreateRoom: () => void;
    onJoinById: (roomId: string) => void;
    onBack: () => void;
    error: string | null;
}

export default function WerewolfLobby({ onJoinRandom, onCreateRoom, onJoinById, onBack, error }: WerewolfLobbyProps) {
    const [mode, setMode] = useState<'menu' | 'join'>('menu');
    const [inputRoomId, setInputRoomId] = useState('');

    const theme = {
        '--theme-primary': '#4f46e5', // Indigo-600
        '--theme-secondary': '#4338ca', // Indigo-700
        '--theme-tertiary': '#6366f1', // Indigo-500
        '--theme-bg-light': '#eef2ff',
        '--theme-text-title': 'linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #6366f1 100%)',
    } as React.CSSProperties;

    // Join Mode UI
    if (mode === 'join') {
        return (
            <main className={navStyles.main} style={theme}>
                <FloatingShapes />
                <div className={navStyles.header}>
                    <button onClick={() => setMode('menu')} className={navStyles.backButton}>
                        <IconBack size={18} /> 戻る
                    </button>
                </div>

                <div className={navStyles.gameContainer}>
                    <h1 className={navStyles.title}>ルーム参加</h1>
                    <p className={navStyles.subtitle}>友達の部屋に参加します</p>

                    <div className={navStyles.joinSection}>
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>ルームIDを入力</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="IDを入力"
                                    value={inputRoomId}
                                    onChange={(e) => setInputRoomId(e.target.value)}
                                    className={navStyles.input}
                                    style={{ flex: 1, textAlign: 'center' }}
                                />
                                <button
                                    onClick={() => onJoinById(inputRoomId)}
                                    className={navStyles.secondaryBtn}
                                    disabled={!inputRoomId.trim()}
                                    style={{ width: 'auto', padding: '0 1.5rem', whiteSpace: 'nowrap' }}
                                >
                                    参加
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Main Menu UI
    return (
        <main className={navStyles.main} style={theme}>
            <FloatingShapes />
            <div className={navStyles.header}>
                <button onClick={onBack} className={navStyles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>

            <div className={navStyles.gameContainer}>
                <h1 className={navStyles.title}>人狼ゲーム</h1>
                <p className={navStyles.subtitle}>究極の心理戦オンライン</p>

                {error && (
                    <div style={{
                        padding: '1rem',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        borderRadius: '12px',
                        marginBottom: '1rem',
                        border: '1px solid #fca5a5',
                        textAlign: 'center',
                        maxWidth: '600px',
                        width: '100%'
                    }}>
                        <p style={{ fontWeight: 'bold' }}>エラーが発生しました</p>
                        <p style={{ fontSize: '0.9rem' }}>{error}</p>
                    </div>
                )}

                <div className={navStyles.modeSelection}>
                    <button onClick={onJoinRandom} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconDice size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>ランダムマッチ</span>
                        <span className={navStyles.modeBtnDesc}>世界中のプレイヤーと対戦</span>
                    </button>

                    <button onClick={onCreateRoom} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconUsers size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>ルーム作成</span>
                        <span className={navStyles.modeBtnDesc}>友達と遊ぶ部屋を作る</span>
                    </button>

                    <button onClick={() => setMode('join')} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconKey size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>ルーム参加</span>
                        <span className={navStyles.modeBtnDesc}>IDで部屋に参加する</span>
                    </button>
                </div>
            </div>

            <div className={navStyles.contentSection}>
                <h2 className={navStyles.contentTitle}>人狼ゲームのルール</h2>
                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>🐺</span>
                        <h3 className={navStyles.sectionTitle}>目的</h3>
                    </div>
                    <p className={navStyles.textBlock}>
                        プレイヤーは「村人陣営」と「人狼陣営」に分かれます。
                        村人陣営の勝利条件は、全ての人狼を発見し、追放することです。
                        人狼陣営の勝利条件は、村人の数を人狼と同数以下に減らすことです。
                    </p>
                </div>

                <div className={navStyles.cardGrid}>
                    <div className={navStyles.infoCard}>
                        <span className={navStyles.cardTitle}>昼のフェーズ</span>
                        <p className={navStyles.cardText}>全員で議論を行い、最も疑わしいプレイヤー1名を投票で処刑（追放）します。</p>
                    </div>
                    <div className={navStyles.infoCard}>
                        <span className={navStyles.cardTitle}>夜のフェーズ</span>
                        <p className={navStyles.cardText}>人狼はこっそりと村人を1人襲撃します。役職者はそれぞれの能力（占い、護衛など）を使用できます。</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
