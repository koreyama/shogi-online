'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { usePlayer } from '@/hooks/usePlayer';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import ColyseusConnectFourGame from './ColyseusConnectFourGame';
import Connect4Board from '@/components/Connect4Board';
import { createInitialState, dropPiece, getValidMoves } from '@/lib/connect4/engine';
import { GameState, Player } from '@/lib/connect4/types';
import { getBestMove } from '@/lib/connect4/ai';

export default function ConnectFourPage() {
    const router = useRouter();
    const { playerName, playerId, isLoaded } = usePlayer();

    const [joinMode, setJoinMode] = useState<'colyseus_random' | 'colyseus_room' | 'colyseus_room_active' | 'ai' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    // AI/Local State
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [aiStatus, setAiStatus] = useState<'playing' | 'finished'>('playing');

    // AI Logic
    useEffect(() => {
        if (joinMode === 'ai') {
            setGameState(createInitialState());
            setAiStatus('playing');
        } else {
            setGameState(null);
        }
    }, [joinMode]);

    useEffect(() => {
        if (joinMode !== 'ai' || !gameState || gameState.turn !== 'yellow' || aiStatus !== 'playing') return;

        const timer = setTimeout(() => {
            const bestCol = getBestMove(gameState, 'yellow');
            if (bestCol !== -1) {
                const newState = dropPiece(gameState, bestCol);
                setGameState(newState);
                if (newState.winner) setAiStatus('finished');
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [gameState, joinMode, aiStatus]);

    const handleLocalClick = (col: number) => {
        if (joinMode !== 'ai' || !gameState || gameState.turn !== 'red' || aiStatus !== 'playing') return;

        // Check validity (simple check)
        if (gameState.board[0][col] !== null) return;

        const newState = dropPiece(gameState, col);
        if (newState !== gameState) {
            setGameState(newState);
            if (newState.winner) setAiStatus('finished');
        }
    };

    if (!isLoaded) return <div className={styles.main}>Loading...</div>;

    // --- GAME VIEW: RANDOM MATCH ---
    if (joinMode === 'colyseus_random') {
        return (
            <main className={styles.main}>
                <ColyseusConnectFourGame mode="random" />
            </main>
        );
    }

    // --- GAME VIEW: ROOM MATCH ---
    if (joinMode === 'colyseus_room_active') {
        return (
            <main className={styles.main}>
                <ColyseusConnectFourGame mode="room" roomId={customRoomId || undefined} />
            </main>
        );
    }

    // --- GAME VIEW: AI MATCH ---
    if (joinMode === 'ai' && gameState) {
        return (
            <main className={styles.main}>
                <div className={styles.header}>
                    <button onClick={() => setJoinMode(null)} className={styles.backButton}><IconBack size={18} /> 戻る</button>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>VS Computer</h1>
                    </div>
                </div>

                <div className={styles.gameArea}>
                    <div className={styles.playerInfo}>
                        <div className={`${styles.playerCard} ${gameState.turn === 'red' ? styles.active : ''}`}>
                            <div className={`${styles.playerIcon} ${styles.redIcon}`} />
                            <span className={styles.playerName}>あなた (赤)</span>
                        </div>
                        <div className={styles.vs}>VS</div>
                        <div className={`${styles.playerCard} ${gameState.turn === 'yellow' ? styles.active : ''}`}>
                            <div className={`${styles.playerIcon} ${styles.yellowIcon}`} />
                            <span className={styles.playerName}>AI (黄)</span>
                        </div>
                    </div>

                    <Connect4Board
                        board={gameState.board}
                        onColumnClick={handleLocalClick}
                        turn={gameState.turn}
                        isMyTurn={gameState.turn === 'red' && aiStatus === 'playing'}
                        myRole="red"
                        winner={gameState.winner}
                        winningLine={gameState.winningLine}
                    />

                    <div className={styles.statusDisplay}>
                        {aiStatus === 'playing' ? (gameState.turn === 'red' ? "あなたの番です" : "AIが思考中...") :
                            (gameState.winner === 'draw' ? "引き分け！" : `${gameState.winner === 'red' ? 'あなたの勝ち！' : 'AIの勝ち！'}`)}
                    </div>
                </div>
            </main>
        );
    }

    // --- MENU VIEW (Default) ---
    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <button onClick={() => router.push('/')} className={styles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>

            <div className={styles.gameContainer}>
                <h1 className={styles.title}>Connect Four</h1>
                <p className={styles.subtitle}>4つ並べたら勝ち！</p>

                {!joinMode ? (
                    <div className={styles.modeSelection}>
                        <button onClick={() => setJoinMode('colyseus_random')} className={styles.modeBtn}>
                            <div className={styles.modeBtnIcon}><IconDice size={48} color="var(--color-primary)" /></div>
                            <span className={styles.modeBtnTitle}>ランダムマッチ</span>
                            <span className={styles.modeBtnDesc}>誰かとすぐに対戦</span>
                        </button>
                        <button onClick={() => setJoinMode('colyseus_room')} className={styles.modeBtn}>
                            <div className={styles.modeBtnIcon}><IconKey size={48} color="var(--color-primary)" /></div>
                            <span className={styles.modeBtnTitle}>ルーム対戦</span>
                            <span className={styles.modeBtnDesc}>友達と対戦</span>
                        </button>
                        <button onClick={() => setJoinMode('ai')} className={styles.modeBtn}>
                            <div className={styles.modeBtnIcon}><IconRobot size={48} color="var(--color-primary)" /></div>
                            <span className={styles.modeBtnTitle}>AI対戦</span>
                            <span className={styles.modeBtnDesc}>練習モード</span>
                        </button>
                    </div>
                ) : joinMode === 'colyseus_room' ? (
                    <div className={styles.joinSection}>
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <p className={styles.subtitle} style={{ marginBottom: '1rem' }}>新しい部屋を作る</p>
                            <button onClick={() => setJoinMode('colyseus_room_active')} className={styles.primaryBtn} style={{ width: '100%' }}>
                                ルーム作成
                            </button>
                        </div>

                        <div style={{ borderTop: '1px solid #ddd', width: '100%', margin: '1rem 0' }}></div>

                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <p className={styles.subtitle} style={{ marginBottom: '1rem' }}>部屋に参加する</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    className={styles.input}
                                    placeholder="ルームIDを入力"
                                    value={customRoomId}
                                    onChange={e => setCustomRoomId(e.target.value)}
                                />
                                <button onClick={() => {
                                    if (customRoomId) setJoinMode('colyseus_room_active');
                                }} className={styles.primaryBtn}>
                                    参加
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setJoinMode(null)} className={styles.secondaryBtn} style={{ marginTop: '2rem' }}>戻る</button>
                    </div>
                ) : null}
            </div>

            {/* Content Section (SEO/Info) */}
            <div className={styles.contentSection}>
                <h2 className={styles.contentTitle}>Connect Four (四目並べ) とは？</h2>

                <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionIcon}>🔵</span>
                        <h3 className={styles.sectionTitle}>ルールは簡単、奥が深い</h3>
                    </div>
                    <p className={styles.textBlock}>
                        重力に従って駒を落とし、<strong>縦・横・斜め</strong>のいずれかに自分の色の駒を4つ並べた方が勝ちとなるシンプルなゲームです。
                        子供から大人まで楽しめる定番の頭脳ゲームですが、先を読む力と空間認識能力が試されます。
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>
                            <strong>「重力」がカギ</strong><br />
                            駒は下から積み上がっていきます。空中に浮くことはできません。この制約が独特の戦略を生み出します。
                        </li>
                        <li className={styles.listItem}>
                            <strong>「攻防一体」</strong><br />
                            自分の4連を狙いつつ、相手の3連を阻止しなければなりません。一手のミスが命取りになります。
                        </li>
                    </ul>
                </div>
            </div>
        </main>
    );
}
