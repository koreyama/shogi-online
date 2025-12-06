'use client';

import React, { useState } from 'react';
import HitAndBlowGame from './HitAndBlowGame';
import menuStyles from '../../styles/GameMenu.module.css';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import Link from 'next/link';

export default function HitAndBlowPage() {
    const [gameMode, setGameMode] = useState<'menu' | 'ai' | 'random' | 'room'>('menu');
    const [customRoomId, setCustomRoomId] = useState('');

    const handleBackToMenu = () => {
        setGameMode('menu');
    };

    const handleStartAI = () => {
        setGameMode('ai');
    };

    return (
        <main className={menuStyles.container}>
            {gameMode === 'ai' ? (
                <div style={{ width: '100%', maxWidth: '1000px' }}>
                    <div style={{ padding: '1rem 0' }}>
                        <button onClick={handleBackToMenu} className={menuStyles.backButton} style={{ position: 'relative', marginBottom: '1rem' }}>
                            <IconBack size={20} /> メニューへ戻る
                        </button>
                    </div>
                    <HitAndBlowGame />
                </div>
            ) : (
                <>
                    <div className={menuStyles.header}>
                        <Link href="/" className={menuStyles.backButton}>
                            <IconBack size={20} /> トップへ戻る
                        </Link>
                        <h1 className={menuStyles.title}>Hit & Blow</h1>
                        <p className={menuStyles.subtitle}>数字を当てて脳を活性化！</p>
                    </div>

                    <div className={menuStyles.modeSelection}>
                        <button onClick={() => setGameMode('random')} className={menuStyles.modeBtn}>
                            <span className={menuStyles.modeBtnIcon}><IconDice size={48} /></span>
                            <span className={menuStyles.modeBtnTitle}>ランダムマッチ</span>
                            <span className={menuStyles.modeBtnDesc}>誰かとすぐに対戦 (準備中)</span>
                        </button>

                        <button onClick={() => setGameMode('room')} className={menuStyles.modeBtn}>
                            <span className={menuStyles.modeBtnIcon}><IconKey size={48} /></span>
                            <span className={menuStyles.modeBtnTitle}>ルーム対戦</span>
                            <span className={menuStyles.modeBtnDesc}>友達と対戦 (準備中)</span>
                        </button>

                        <button onClick={handleStartAI} className={menuStyles.modeBtn}>
                            <span className={menuStyles.modeBtnIcon}><IconRobot size={48} /></span>
                            <span className={menuStyles.modeBtnTitle}>ソロプレイ</span>
                            <span className={menuStyles.modeBtnDesc}>1人でじっくり練習</span>
                        </button>
                    </div>

                    {(gameMode === 'random' || gameMode === 'room') && (
                        <div className={menuStyles.joinSection}>
                            <p className={menuStyles.joinDesc}>
                                {gameMode === 'random'
                                    ? 'ランダムマッチは近日公開予定です！'
                                    : 'ルーム対戦は近日公開予定です！'}
                            </p>

                            {gameMode === 'room' && (
                                <input
                                    type="text"
                                    placeholder="ルームID (準備中)"
                                    className={menuStyles.input}
                                    disabled
                                    value={customRoomId}
                                    onChange={(e) => setCustomRoomId(e.target.value)}
                                    style={{ marginBottom: '1rem' }}
                                />
                            )}

                            <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
                                {gameMode === 'room' && <button className={menuStyles.primaryBtn} disabled>参加</button>}
                                <button onClick={() => setGameMode('menu')} className={menuStyles.secondaryBtn}>戻る</button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}
