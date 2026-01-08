'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import navStyles from '@/styles/GameMenu.module.css';
import { FloatingShapes } from '@/components/landing/FloatingShapes';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import ColyseusGomokuGame from './ColyseusGomokuGame';
import { GomokuBoard } from '@/components/GomokuBoard';
import { createInitialState, executeMove, GameState } from '@/lib/gomoku/engine';
import { getBestMove } from '@/lib/gomoku/ai';
import { Chat } from '@/components/Chat';
import HideChatBot from '@/components/HideChatBot';

export default function GomokuPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName, playerId, isLoaded: playerLoaded } = usePlayer();
    const userData = { name: playerName, id: playerId };

    // Mode Selection: null (Menu), 'colyseus_random', 'colyseus_room', 'colyseus_room_active', 'ai'
    const [joinMode, setJoinMode] = useState<'colyseus_random' | 'colyseus_room' | 'colyseus_room_active' | 'ai' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    // AI/Local Game State
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [aiStatus, setAiStatus] = useState<'playing' | 'finished'>('playing');

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);


    // --- AI Logic ---
    useEffect(() => {
        if (joinMode === 'ai') {
            setGameState(createInitialState());
            setAiStatus('playing');
        } else {
            setGameState(null);
        }
    }, [joinMode]);

    useEffect(() => {
        if (joinMode !== 'ai' || !gameState || gameState.turn !== 'white' || aiStatus !== 'playing') return;

        const timer = setTimeout(() => {
            const bestMove = getBestMove(gameState, 'white');
            if (bestMove) {
                const newState = executeMove(gameState, bestMove.x, bestMove.y);
                setGameState(newState);
                if (newState.isGameOver) setAiStatus('finished');
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [gameState, joinMode, aiStatus]);

    const handleLocalClick = (x: number, y: number) => {
        if (joinMode !== 'ai' || !gameState || gameState.turn !== 'black' || aiStatus !== 'playing') return;
        const newState = executeMove(gameState, x, y);
        if (newState !== gameState) { // Valid move
            setGameState(newState);
            if (newState.isGameOver) setAiStatus('finished');
        }
    };

    if (authLoading || !user || !playerLoaded) return <div className={navStyles.main}>Loading...</div>;

    // --- GAME VIEW: RANDOM MATCH ---
    if (joinMode === 'colyseus_random') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}>
                    <button onClick={() => setJoinMode(null)} className={navStyles.backButton}>
                        <IconBack size={18} /> 終了
                    </button>
                </div>
                <ColyseusGomokuGame mode="random" userData={userData} />
            </main>
        );
    }

    // --- GAME VIEW: ROOM MATCH (Playing) ---
    if (joinMode === 'colyseus_room_active') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}>
                    <button onClick={() => setJoinMode(null)} className={navStyles.backButton}>
                        <IconBack size={18} /> 終了
                    </button>
                </div>
                <ColyseusGomokuGame mode="room" roomId={customRoomId || undefined} userData={userData} />
            </main>
        );
    }

    // --- GAME VIEW: AI MATCH ---
    if (joinMode === 'ai' && gameState) {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}><button onClick={() => setJoinMode(null)} className={navStyles.backButton}><IconBack size={18} /> 終了</button></div>
                <div className={navStyles.gameLayout}>
                    <div className={navStyles.leftPanel}>
                        <div className={navStyles.playersSection}>
                            {/* Opponent (AI - White) */}
                            <div className={`${navStyles.playerCard} ${navStyles.white} ${gameState.turn === 'white' ? navStyles.playerCardActive : ''}`}>
                                <div className={navStyles.playerName}>AI (相手)</div>
                                <div className={navStyles.playerRole}>後手 (白)</div>
                                {gameState.turn === 'white' && <div className={navStyles.turnBadge}>THINKING...</div>}
                            </div>

                            {/* Self (Player - Black) */}
                            <div className={`${navStyles.playerCard} ${navStyles.black} ${gameState.turn === 'black' ? navStyles.playerCardActive : ''}`}>
                                <div className={navStyles.playerName}>{playerName}</div>
                                <div className={navStyles.playerRole}>先手 (黒)</div>
                                {gameState.turn === 'black' && <div className={navStyles.turnBadge}>YOUR TURN</div>}
                            </div>
                        </div>
                    </div>
                    <div className={navStyles.centerPanel}>
                        <div className={`${navStyles.turnIndicator} ${gameState.turn === 'black' ? navStyles.turnBlack : navStyles.turnWhite}`}>
                            {gameState.turn === 'black' ? '黒の番 (あなた)' : '白の番 (AI)'}
                        </div>
                        <GomokuBoard
                            board={gameState.board}
                            onIntersectionClick={handleLocalClick}
                            lastMove={gameState.lastMove}
                        />
                    </div>
                </div>
                {aiStatus === 'finished' && (
                    <div className={navStyles.modalOverlay}>
                        <div className={`${navStyles.modal} fade-in`} style={{
                            borderTop: gameState.winner === 'black' ? '8px solid #4CAF50' :
                                gameState.winner === 'white' ? '8px solid #f44336' : '8px solid #999',
                            textAlign: 'center',
                            padding: '2rem'
                        }}>
                            {gameState.winner === 'black' ? (
                                <>
                                    <h2 style={{ fontSize: '2.5rem', color: '#4CAF50', margin: '0 0 1rem 0', fontWeight: '900' }}>YOU WIN!</h2>
                                    <p style={{ fontSize: '1.2rem', color: '#666' }}>おめでとうございます！あなたの勝利です。</p>
                                </>
                            ) : gameState.winner === 'white' ? (
                                <>
                                    <h2 style={{ fontSize: '2.5rem', color: '#f44336', margin: '0 0 1rem 0', fontWeight: '900' }}>YOU LOSE...</h2>
                                    <p style={{ fontSize: '1.2rem', color: '#666' }}>残念... AIの勝利です。</p>
                                </>
                            ) : (
                                <>
                                    <h2 style={{ fontSize: '2.5rem', color: '#999', margin: '0 0 1rem 0', fontWeight: '900' }}>DRAW</h2>
                                    <p style={{ fontSize: '1.2rem', color: '#666' }}>引き分けです。</p>
                                </>
                            )}

                            <div className={navStyles.modalBtnGroup}>
                                <button
                                    onClick={() => {
                                        setGameState(createInitialState());
                                        setAiStatus('playing');
                                    }}
                                    className={navStyles.primaryBtn}
                                >
                                    もう一度
                                </button>
                                <button
                                    onClick={() => setJoinMode(null)}
                                    className={navStyles.secondaryBtn}
                                >
                                    終了
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        );
    }

    // --- MENU VIEW: ROOM SELECTION ---
    if (joinMode === 'colyseus_room') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <div className={navStyles.header}><button onClick={() => setJoinMode(null)} className={navStyles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={navStyles.gameContainer}>
                    <h1 className={navStyles.title}>ルーム対戦</h1>

                    <div className={navStyles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            {/* Create Section */}
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button
                                    onClick={() => { setCustomRoomId(''); setJoinMode('colyseus_room_active'); }}
                                    className={navStyles.primaryBtn}
                                    style={{ width: '100%', background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', color: '#fff' }}
                                >
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
                                        type="text"
                                        value={customRoomId}
                                        onChange={(e) => setCustomRoomId(e.target.value)}
                                        placeholder="6桁のID"
                                        className={navStyles.input}
                                        maxLength={10}
                                        style={{ flex: 1, letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.1rem' }}
                                        inputMode="numeric"
                                    />
                                    <button
                                        onClick={() => { if (customRoomId) setJoinMode('colyseus_room_active'); }}
                                        className={navStyles.secondaryBtn}
                                        style={{ width: 'auto', padding: '0 2rem', fontSize: '1rem', whiteSpace: 'nowrap' }}
                                        disabled={!customRoomId}
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

    // --- MAIN MENU VIEW ---
    const theme = {
        '--theme-primary': '#475569',
        '--theme-secondary': '#1e293b',
        '--theme-tertiary': '#64748b',
        '--theme-bg-light': '#f8fafc',
        '--theme-text-title': 'linear-gradient(135deg, #1e293b 0%, #475569 50%, #64748b 100%)',
    } as React.CSSProperties;

    return (
        <main className={navStyles.main} style={theme}>
            <FloatingShapes />
            <div className={navStyles.header}><button onClick={() => router.push('/')} className={navStyles.backButton}><IconBack size={18} /> 戻る</button></div>

            <div className={navStyles.gameContainer}>
                <h1 className={navStyles.title}>五目並べ</h1>

                <div className={navStyles.modeSelection}>
                    <button onClick={() => setJoinMode('colyseus_random')} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconDice size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>ランダムマッチ</span>
                        <span className={navStyles.modeBtnDesc}>世界中のプレイヤーと対戦</span>
                    </button>
                    <button onClick={() => setJoinMode('colyseus_room')} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconKey size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>ルーム対戦</span>
                        <span className={navStyles.modeBtnDesc}>友達と対戦</span>
                    </button>
                    <button onClick={() => setJoinMode('ai')} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconRobot size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>AI対戦</span>
                        <span className={navStyles.modeBtnDesc}>コンピュータと練習</span>
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className={navStyles.contentSection}>
                <h2 className={navStyles.contentTitle}>五目並べ（連珠）の世界</h2>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>⚫⚪</span>
                        <h3 className={navStyles.sectionTitle}>五目並べとは</h3>
                    </div>
                    <p className={navStyles.textBlock}>
                        五目並べは、黒と白の石を交互に打ち、先に縦・横・斜めのいずれかに5つ連続で並べた方が勝ちとなるシンプルなゲームです。
                        日本では「連珠（れんじゅ）」として競技化されており、黒番の有利さを調整するための禁じ手ルールなどもありますが、
                        本サイトではシンプルに「5つ並べたら勝ち」というフリー・レンジュ（禁じ手なし）に近いルールを採用しています。
                    </p>
                </div>

                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>🎓</span>
                        <h3 className={navStyles.sectionTitle}>基本ルール</h3>
                    </div>
                    <div className={navStyles.cardGrid}>
                        <div className={navStyles.infoCard}>
                            <span className={navStyles.cardTitle}>1. 対局開始</span>
                            <p className={navStyles.cardText}>盤面は何もない状態からスタートします。黒が先手で、盤の交点に石を置きます。</p>
                        </div>
                        <div className={navStyles.infoCard}>
                            <span className={navStyles.cardTitle}>2. 交互に打つ</span>
                            <p className={navStyles.cardText}>黒と白が交互に1手ずつ石を打ちます。一度置いた石は動かせません。</p>
                        </div>
                        <div className={navStyles.infoCard}>
                            <span className={navStyles.cardTitle}>3. 勝利条件</span>
                            <p className={navStyles.cardText}>先に縦・横・斜めのいずれかに、自分の石を「5つ以上」連続で並べたプレイヤーが勝利となります。</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
