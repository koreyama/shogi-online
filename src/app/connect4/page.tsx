'use client';

import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

import { useRouter } from 'next/navigation';
import navStyles from '@/styles/GameMenu.module.css';
import gameStyles from './page.module.css';
import { FloatingShapes } from '@/components/landing/FloatingShapes';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import ColyseusConnectFourGame from './ColyseusConnectFourGame';
import Connect4Board from '@/components/Connect4Board';
import { createInitialState, dropPiece, getValidMoves } from '@/lib/connect4/engine';
import { GameState, Player } from '@/lib/connect4/types';
import { getBestMove } from '@/lib/connect4/ai';
import HideChatBot from '@/components/HideChatBot';

export default function ConnectFourPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName, playerId, isLoaded: playerLoaded } = usePlayer();

    const [joinMode, setJoinMode] = useState<'colyseus_random' | 'colyseus_room' | 'colyseus_room_active' | 'ai' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    // AI/Local State
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [aiStatus, setAiStatus] = useState<'playing' | 'finished'>('playing');

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

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

    if (authLoading || !user || !playerLoaded) return <div className={navStyles.main}>Loading...</div>;

    // --- GAME VIEW: RANDOM MATCH ---
    if (joinMode === 'colyseus_random') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <ColyseusConnectFourGame mode="random" />
            </main>
        );
    }

    // --- GAME VIEW: ROOM MATCH ---
    if (joinMode === 'colyseus_room_active') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <ColyseusConnectFourGame mode="room" roomId={customRoomId || undefined} />
            </main>
        );
    }

    // --- GAME VIEW: AI MATCH ---
    if (joinMode === 'ai' && gameState) {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}>
                    <button onClick={() => setJoinMode(null)} className={navStyles.backButton}><IconBack size={18} /> 戻る</button>
                    <div className={navStyles.headerContent}>
                        <h1 className={navStyles.title}>VS Computer</h1>
                    </div>
                </div>

                <div className={gameStyles.gameLayout}>
                    <div className={gameStyles.leftPanel}>
                        <div className={gameStyles.playersSection}>
                            {/* AI (Yellow) */}
                            <div className={`${gameStyles.playerCard} ${gameState.turn === 'yellow' ? gameStyles.playerCardActive : ''}`}>
                                <div className={gameStyles.playerName}>AI (黄色)</div>
                                <div className={gameStyles.playerRole}>後攻</div>
                                {gameState.turn === 'yellow' && <div className={gameStyles.turnBadge}>思考中...</div>}
                            </div>

                            {/* Player (Red) */}
                            <div className={`${gameStyles.playerCard} ${gameState.turn === 'red' ? gameStyles.playerCardActive : ''}`}>
                                <div className={gameStyles.playerName}>あなた (赤色)</div>
                                <div className={gameStyles.playerRole}>先攻</div>
                                {gameState.turn === 'red' && <div className={gameStyles.turnBadge}>あなたの番</div>}
                            </div>
                        </div>
                    </div>

                    <div className={gameStyles.centerPanel}>
                        <Connect4Board
                            board={gameState.board}
                            onColumnClick={handleLocalClick}
                            turn={gameState.turn}
                            isMyTurn={gameState.turn === 'red' && aiStatus === 'playing'}
                            myRole="red"
                            winner={gameState.winner}
                            winningLine={gameState.winningLine}
                        />
                        {/* Status text removed as it's now redundant with badges, or keep it subtle? Badges are better. */}
                    </div>
                </div>
            </main>
        );
    }

    // --- MENU VIEW (Default) ---
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
                <button onClick={() => router.push('/')} className={navStyles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>

            <div className={navStyles.gameContainer}>
                <h1 className={navStyles.title}>Connect Four</h1>
                <p className={navStyles.subtitle}>4つ並べたら勝ち！</p>

                {!joinMode ? (
                    <div className={navStyles.modeSelection}>
                        <button onClick={() => setJoinMode('colyseus_random')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconDice size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ランダムマッチ</span>
                            <span className={navStyles.modeBtnDesc}>誰かとすぐに対戦</span>
                        </button>
                        <button onClick={() => setJoinMode('colyseus_room')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconKey size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ルーム対戦</span>
                            <span className={navStyles.modeBtnDesc}>友達と対戦</span>
                        </button>
                        <button onClick={() => setJoinMode('ai')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconRobot size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>AI対戦</span>
                            <span className={navStyles.modeBtnDesc}>練習モード (オフライン)</span>
                        </button>
                    </div>
                ) : joinMode === 'colyseus_room' ? (
                    <div className={navStyles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            {/* Create Section */}
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={() => setJoinMode('colyseus_room_active')} className={navStyles.primaryBtn} style={{ width: '100%' }}>
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
                                        value={customRoomId}
                                        onChange={e => setCustomRoomId(e.target.value)}
                                        style={{ flex: 1, letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.1rem' }}
                                    />
                                    <button onClick={() => { if (customRoomId) setJoinMode('colyseus_room_active'); }} className={navStyles.secondaryBtn} style={{ width: 'auto', padding: '0 2rem', whiteSpace: 'nowrap' }}>
                                        参加
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setJoinMode(null)} className={navStyles.secondaryBtn} style={{ marginTop: '2rem' }}>
                            戻る
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Content Section (SEO/Info) */}
            <div className={navStyles.contentSection}>
                <h2 className={navStyles.contentTitle}>Connect Four (四目並べ) とは？</h2>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>🔵</span>
                        <h3 className={navStyles.sectionTitle}>ルールは簡単、奥が深い</h3>
                    </div>
                    <p className={navStyles.textBlock}>
                        重力に従って駒を落とし、<strong>縦・横・斜め</strong>のいずれかに自分の色の駒を4つ並べた方が勝ちとなるシンプルなゲームです。
                        子供から大人まで楽しめる定番の頭脳ゲームですが、先を読む力と空間認識能力が試されます。
                    </p>
                    <ul className={navStyles.list}>
                        <li className={navStyles.listItem}>
                            <strong>「重力」がカギ</strong><br />
                            駒は下から積み上がっていきます。空中に浮くことはできません。この制約が独特の戦略を生み出します。
                        </li>
                        <li className={navStyles.listItem}>
                            <strong>「攻防一体」</strong><br />
                            自分の4連を狙いつつ、相手の3連を阻止しなければなりません。一手のミスが命取りになります。
                        </li>
                    </ul>
                </div>
            </div>
        </main>
    );
}
