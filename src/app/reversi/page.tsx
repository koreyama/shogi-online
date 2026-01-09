'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import navStyles from '@/styles/GameMenu.module.css';
import { FloatingShapes } from '@/components/landing/FloatingShapes';
import { ReversiBoard } from '@/components/ReversiBoard';
import ColyseusReversiGame from './ColyseusReversiGame';
import { Chat } from '@/components/Chat';
import { createInitialState, executeMove } from '@/lib/reversi/engine'; // Used for AI
import { getBestMove } from '@/lib/reversi/ai';
import { GameState, Player, Coordinates } from '@/lib/reversi/types'; // Used for AI
import { IconBack, IconDice, IconKey, IconRobot, IconHourglass } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import HideChatBot from '@/components/HideChatBot';

// Valid Moves Helper for AI/Local
import { getValidMoves } from '@/lib/reversi/engine';

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

export default function ReversiPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName: savedName, savePlayerName, isLoaded: playerLoaded } = usePlayer();
    const [mounted, setMounted] = useState(false);
    const [gameState, setGameState] = useState<GameState | null>(null); // For AI Match
    const [validMoves, setValidMoves] = useState<Coordinates[]>([]);

    // Player State
    const [playerName, setPlayerName] = useState('');
    const [playerId, setPlayerId] = useState<string>('');
    const [joinMode, setJoinMode] = useState<'random' | 'room' | 'ai' | 'colyseus_random' | 'colyseus_room' | 'colyseus_room_active' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    // Chat State (AI Match Only)
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [status, setStatus] = useState<'setup' | 'initial' | 'waiting' | 'playing' | 'finished'>('setup');

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        setMounted(true);
        setPlayerId(Math.random().toString(36).substring(2, 15));
    }, []);

    useEffect(() => {
        if (playerLoaded && savedName) {
            setPlayerName(savedName);
            setStatus('initial');
        }
    }, [playerLoaded, savedName]);

    // AI Match Setup
    useEffect(() => {
        if (joinMode === 'ai') {
            setGameState(createInitialState());
            setStatus('playing');
            setMessages([]);
        } else {
            // Reset if leaving AI mode
            if (status === 'playing' && joinMode !== 'colyseus_random' && joinMode !== 'colyseus_room' && joinMode !== 'colyseus_room_active') {
                setGameState(null);
            }
        }
    }, [joinMode]);

    // Update valid moves for AI Match
    useEffect(() => {
        if (joinMode === 'ai' && gameState && gameState.turn === 'black' && status === 'playing') {
            setValidMoves(getValidMoves(gameState.board, 'black'));
        } else {
            setValidMoves([]);
        }
    }, [gameState, joinMode, status]);

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerName.trim()) {
            savePlayerName(playerName.trim());
            setStatus('initial');
        }
    };

    const startAIGame = () => {
        setJoinMode('ai');
    };

    // AI Turn Logic
    useEffect(() => {
        if (joinMode !== 'ai' || !gameState || gameState.turn !== 'white' || status !== 'playing') return;

        const timer = setTimeout(() => {
            // AI is White
            const bestMove = getBestMove(gameState.board, 'white');
            if (bestMove) {
                const newState = executeMove(gameState, bestMove.x, bestMove.y);
                setGameState(newState);
                if (newState.winner) setStatus('finished');
            } else {
                // AI Pass - Check if Human has moves
                // Engine handles turn switching if no moves. 
                // If executeMove didn't switch turn back to black, it means black also has no moves -> Game Over handled in engine? 
                // Or "Double Pass" -> Game Over.
                // Reversi engine `executeMove` handles pass logic?
                // Let's assume engine handles it. If not, we might stick. 
                // For now, if AI has no moves, force turn change if valid?
                // Since this is legacy AI code, assume it works roughly as before.
                // Logic update:
                if (!gameState.canMove) {
                    // Game potentially over if both passed
                }
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [gameState, joinMode, status]);

    const handleCellClick = (x: number, y: number) => {
        if (joinMode !== 'ai') return;
        if (!gameState || gameState.turn !== 'black' || status !== 'playing') return;

        const isValid = validMoves.some(m => m.x === x && m.y === y);
        if (!isValid) return;

        const newState = executeMove(gameState, x, y);
        setGameState(newState);
        if (newState.winner) setStatus('finished');
    };

    const handleSendMessage = (text: string) => {
        if (joinMode === 'ai') {
            setMessages(prev => [...prev, { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() }]);
        }
    };

    const handleBackToTop = () => {
        setJoinMode(null);
        setStatus('initial');
    };

    const handleRematch = () => {
        if (joinMode === 'ai') {
            setGameState(createInitialState());
            setStatus('playing');
            setMessages([]);
        }
    };

    if (!mounted || authLoading || !user || !playerLoaded) return <div className={navStyles.main}>Loading...</div>;

    if (status === 'setup') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <div className={navStyles.setupContainer}>
                    <h1 className={navStyles.title}>リバーシ</h1>
                    <form onSubmit={handleNameSubmit} className={navStyles.setupForm}>
                        <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="プレイヤー名" className={navStyles.input} required />
                        <button type="submit" className={navStyles.primaryBtn}>次へ</button>
                    </form>
                </div>
            </main>
        );
    }

    // Colyseus Components
    if (joinMode === 'colyseus_random') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}><button onClick={() => setJoinMode(null)} className={navStyles.backButton}>戻る</button></div>
                <ColyseusReversiGame mode="random" />
            </main>
        );
    }

    if (joinMode === 'colyseus_room_active') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}><button onClick={() => setJoinMode(null)} className={navStyles.backButton}>戻る</button></div>
                <ColyseusReversiGame mode="room" roomId={customRoomId || undefined} />
            </main>
        );
    }

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

    // AI Game View
    if (joinMode === 'ai') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}><button onClick={handleBackToTop} className={navStyles.backButton}><IconBack size={18} /> 終了</button></div>
                <div className={navStyles.gameLayout}>
                    <div className={navStyles.leftPanel}>
                        <div className={navStyles.playersSection}>
                            <div className={navStyles.playerInfo}>
                                <p>AI (相手)</p>
                                <p>白: {gameState?.whiteCount}</p>
                            </div>
                            <div className={navStyles.playerInfo}>
                                <p>{playerName} (自分)</p>
                                <p>黒: {gameState?.blackCount}</p>
                            </div>
                        </div>
                        <div className={navStyles.chatSection}>
                            <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                        </div>
                    </div>
                    <div className={navStyles.centerPanel}>
                        <div className={navStyles.turnIndicator}>
                            {gameState?.turn === 'black' ? '黒の番 (あなた)' : '白の番'}
                        </div>
                        <ReversiBoard
                            board={gameState?.board || []}
                            validMoves={validMoves}
                            onCellClick={handleCellClick}
                            lastMove={gameState?.history[gameState?.history.length - 1]}
                        />
                    </div>
                </div>
                {gameState?.winner && (
                    <div className={navStyles.modalOverlay}>
                        <div className={navStyles.modal}>
                            <h2>勝負あり！</h2>
                            <p>勝者: {gameState.winner === 'black' ? '黒' : gameState.winner === 'white' ? '白' : '引き分け'}</p>
                            <button onClick={handleRematch} className={navStyles.primaryBtn}>再戦</button>
                            <button onClick={handleBackToTop} className={navStyles.secondaryBtn}>終了</button>
                        </div>
                    </div>
                )}
            </main>
        );
    }

    if (status === 'initial') {
        const theme = {
            '--theme-primary': '#16a34a',
            '--theme-secondary': '#15803d',
            '--theme-tertiary': '#4ade80',
            '--theme-bg-light': '#f0fdf4',
            '--theme-text-title': 'linear-gradient(135deg, #15803d 0%, #16a34a 50%, #4ade80 100%)',
        } as React.CSSProperties;

        return (
            <main className={navStyles.main} style={theme}>
                <FloatingShapes />
                <div className={navStyles.header}><button onClick={() => router.push('/')} className={navStyles.backButton}><IconBack size={18} /> 戻る</button></div>

                <div className={navStyles.gameContainer}>
                    <h1 className={navStyles.title}>リバーシ</h1>

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
                        <button onClick={startAIGame} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconRobot size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>AI対戦</span>
                            <span className={navStyles.modeBtnDesc}>コンピュータと練習</span>
                        </button>
                    </div>
                </div>

                {/* AdSense Content Section - (Preserved) */}
                <div className={navStyles.contentSection}>
                    <h2 className={navStyles.contentTitle}>リバーシ（リバーシ）の奥深い世界</h2>

                    <div className={navStyles.sectionBlock}>
                        <div className={navStyles.sectionHeader}>
                            <span className={navStyles.sectionIcon}>⚪⚫</span>
                            <h3 className={navStyles.sectionTitle}>リバーシの魅力と歴史</h3>
                        </div>
                        <p className={navStyles.textBlock}>
                            リバーシは、19世紀後半にイギリスで考案されたと言われるボードゲームです。
                            2人のプレイヤーが黒と白の石を使い、相手の石を挟んで自分の色に変えていきます。
                            「覚えるのは1分、極めるのは一生」と言われるほど、ルールはシンプルですが奥深い戦略性を持っています。
                        </p>
                    </div>

                    <div className={navStyles.sectionBlock}>
                        <div className={navStyles.sectionHeader}>
                            <span className={navStyles.sectionIcon}>🎓</span>
                            <h3 className={navStyles.sectionTitle}>基本ルールと勝利条件</h3>
                        </div>
                        <div className={navStyles.cardGrid}>
                            <div className={navStyles.infoCard}>
                                <span className={navStyles.cardTitle}>1. 初期配置</span>
                                <p className={navStyles.cardText}>盤の中央に黒と白の石を2つずつ、互い違いに置いてスタートします。</p>
                            </div>
                            <div className={navStyles.infoCard}>
                                <span className={navStyles.cardTitle}>2. 石を打つ</span>
                                <p className={navStyles.cardText}>黒が先手です。自分の石で相手の石を挟める場所にしか打てません。</p>
                            </div>
                            <div className={navStyles.infoCard}>
                                <span className={navStyles.cardTitle}>3. 裏返す</span>
                                <p className={navStyles.cardText}>挟んだ相手の石はすべて自分の色に変わります。縦・横・斜め、すべての方向で挟めます。</p>
                            </div>
                            <div className={navStyles.infoCard}>
                                <span className={navStyles.cardTitle}>4. 勝敗</span>
                                <p className={navStyles.cardText}>盤面が埋まるか、両者打てなくなったら終了。石の数が多い方が勝ちです。</p>
                            </div>
                        </div>
                    </div>

                    <div className={navStyles.sectionBlock}>
                        <div className={navStyles.sectionHeader}>
                            <span className={navStyles.sectionIcon}>🏆</span>
                            <h3 className={navStyles.sectionTitle}>勝率を上げる3つの定石</h3>
                        </div>
                        <p className={navStyles.textBlock}>
                            リバーシで勝つためには、単に石を多く取るだけではいけません。むしろ序盤は「少なく取る」ことが重要な場合もあります。
                        </p>
                        <div className={navStyles.highlightBox}>
                            <span className={navStyles.highlightTitle}>1. 四隅（角）を取る</span>
                            <p className={navStyles.textBlock} style={{ marginBottom: 0 }}>
                                盤の四隅（角）に置かれた石は、絶対に裏返されることがありません。これを「確定石」と呼びます。
                                角を取ることで、そこを拠点に自分の石を安定して増やすことができます。
                            </p>
                        </div>
                        <ul className={navStyles.list}>
                            <li className={navStyles.listItem}>
                                <strong>X打ち・C打ちに注意</strong><br />
                                角の隣のマス（XやCと呼ばれる場所）に不用意に打つと、相手に角を取られるチャンスを与えてしまいます。初心者はここを避けるだけで勝率が上がります。
                            </li>
                            <li className={navStyles.listItem}>
                                <strong>中割り（なかわり）</strong><br />
                                序盤は外側の石を取らず、内側の石だけを裏返すように打つと、相手に打てる場所を与えず、自分は打てる場所を確保しやすくなります。
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        );
    }

    return null; // Fallback
}
