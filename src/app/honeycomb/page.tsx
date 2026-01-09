'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import navStyles from '@/styles/GameMenu.module.css';
import { FloatingShapes } from '@/components/landing/FloatingShapes';
import styles from './page.module.css'; // Keep for game-specific styles if needed, or remove if fully replaced. Keeping for hex grid specific styles.
import { Chat } from '@/components/Chat';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue, update, get, onChildAdded, onDisconnect, off } from 'firebase/database';
import { IconBack, IconDice, IconKey, IconRobot, IconHourglass } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { getBestMove } from '@/lib/honeycomb/ai';
import { generateGrid, hexToPixel, getHexPoints, checkWinLoss, getHexKey } from '@/lib/honeycomb/engine';
import { Hex, Player, GameState, BOARD_RADIUS, HEX_SIZE } from '@/lib/honeycomb/types';
import ColyseusHoneycombGame from './ColyseusHoneycombGame';
import HideChatBot from '@/components/HideChatBot';

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

import { useAuth } from '@/hooks/useAuth';

export default function HoneycombPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName: savedName, savePlayerName, isLoaded } = usePlayer();
    const [mounted, setMounted] = useState(false);

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    // Game State
    const [board, setBoard] = useState<Map<string, Player>>(new Map());
    const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
    const [gameState, setGameState] = useState<GameState>('playing');
    const [winner, setWinner] = useState<Player | null>(null);
    const [winningHexes, setWinningHexes] = useState<string[]>([]);

    // Online State
    const [roomId, setRoomId] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<Player | null>(null);
    const [status, setStatus] = useState<'setup' | 'initial' | 'waiting' | 'playing' | 'finished'>('setup');
    const [playerId, setPlayerId] = useState<string>('');

    // Player State
    const [playerName, setPlayerName] = useState('');
    const [opponentName, setOpponentName] = useState('');
    const [joinMode, setJoinMode] = useState<'random' | 'room' | 'ai' | 'colyseus_random' | 'colyseus_room' | 'room_menu' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        setMounted(true);
        setPlayerId(Math.random().toString(36).substring(2, 15));
    }, []);

    useEffect(() => {
        if (isLoaded && savedName) {
            setPlayerName(savedName);
            setStatus('initial');
        }
    }, [isLoaded, savedName]);

    // Generate grid
    const hexes = generateGrid();

    // Firebase Logic Removed (Colyseus Migration)
    // AI Turn Effect
    useEffect(() => {
        if (roomId === 'ai-match' && currentPlayer === 2 && gameState === 'playing' && status === 'playing') {
            // Delay slightly for visual effect then trigger async AI
            const timer = setTimeout(() => {
                makeAIMove();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [roomId, currentPlayer, gameState, status]);

    const applyMove = (q: number, r: number, s: number, player: Player) => {
        const key = getHexKey({ q, r, s });
        setBoard(prev => {

            const newBoard = new Map(prev);
            newBoard.set(key, player);

            // Check win/loss
            const result = checkWinLoss(newBoard, { q, r, s }, player);
            if (result.won) {
                setGameState('won');
                setWinner(player);
                setWinningHexes(result.line);
                setStatus('finished');
            } else if (result.lost) {
                setGameState('lost');
                setWinner(player === 1 ? 2 : 1);
                setStatus('finished');
            } else {
                setCurrentPlayer(player === 1 ? 2 : 1);
            }

            return newBoard;
        });
    };

    const handleHexClick = (hex: Hex) => {
        if (gameState !== 'playing' || status === 'finished') return;
        if (roomId && roomId !== 'ai-match' && currentPlayer !== myRole) return;

        const key = getHexKey(hex);
        if (board.has(key)) return;

        if (roomId === 'ai-match') {
            if (currentPlayer === 1) {
                applyMove(hex.q, hex.r, hex.s, 1);
                // AI is trigger via useEffect
            }
        } else if (roomId) {
            push(ref(db, `honeycomb_rooms/${roomId}/moves`), { ...hex, player: myRole });
        } else {
            // Local play (fallback/debug)
            applyMove(hex.q, hex.r, hex.s, currentPlayer);
        }
    };

    const makeAIMove = async () => {
        // Pass a copy of the board to avoid mutation issues
        // The AI is now async and yields, preventing freeze.
        const bestMove = await getBestMove(new Map(board), 2, BOARD_RADIUS);
        if (bestMove) {
            applyMove(bestMove.q, bestMove.r, bestMove.s, 2);
        }
    };

    const resetLocalGame = () => {
        setBoard(new Map());
        setCurrentPlayer(1);
        setGameState('playing');
        setWinner(null);
        setWinningHexes([]);
        if (roomId === 'ai-match') setStatus('playing');
    };



    const startAIGame = () => {
        setJoinMode('ai');
        setRoomId('ai-match');
        setMyRole(1);
        setOpponentName('AI');
        setStatus('playing');
        resetLocalGame();
    };

    const handleSendMessage = (text: string) => {
        if (roomId === 'ai-match') {
            setMessages(prev => [...prev, { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() }]);
        } else if (roomId) {
            push(ref(db, `honeycomb_rooms/${roomId}/chat`), { id: `msg-${Date.now()}`, sender: playerName, text, timestamp: Date.now() });
        }
    };

    const handleRematch = () => {
        if (roomId === 'ai-match') {
            resetLocalGame();
        } else if (roomId) {
            update(ref(db, `honeycomb_rooms/${roomId}/rematch`), { [`p${myRole}`]: true });
        }
    };

    const handleBackToTop = () => {
        if (roomId && roomId !== 'ai-match' && myRole) {
            const myPlayerRef = ref(db, `honeycomb_rooms/${roomId}/p${myRole}`);
            set(myPlayerRef, null);
            onDisconnect(myPlayerRef).cancel();
        }
        router.push('/');
    };

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerName.trim()) {
            savePlayerName(playerName.trim());
            setStatus('initial');
        }
    };

    if (!mounted) return <div className={styles.main}>Loading...</div>;

    // Online State


    // AI State
    // ... AI logic handled inside this component for 'ai' mode or extracted?
    // Current AI logic is embedded in page.tsx. Let's keep it for 'ai' mode.
    // The previous code had AI logic. We must preserve it.

    // ... (Keep AI Effect and handlers) ...

    if (!mounted) return <div className={styles.main}>Loading...</div>;

    // --- GAME VIEW: RANDOM / ROOM ---
    if (joinMode === 'colyseus_random') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <ColyseusHoneycombGame mode="random" />
            </main>
        );
    }
    if (joinMode === 'colyseus_room') {
        const roomId = customRoomId.trim() || undefined;
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <ColyseusHoneycombGame mode="room" roomId={roomId} />
            </main>
        );
    }

    // --- GAME VIEW: AI MATCH ---
    if (joinMode === 'ai') {
        return (

            <main className={navStyles.container}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}><button onClick={handleBackToTop} className={navStyles.backButton}><IconBack size={18} /> 終了</button></div>
                <div className={styles.gameLayout}>
                    <div className={styles.leftPanel}>
                        <div className={styles.playersSection}>
                            {/* Opponent (AI - Player 2 - Red) */}
                            <div className={`${styles.playerInfo} ${currentPlayer === 2 ? styles.playerInfoActive : ''}`}>
                                <div>
                                    <p>AI (相手)</p>
                                    <p style={{ fontSize: '0.9rem', color: '#666' }}>赤 (後攻)</p>
                                </div>
                                {currentPlayer === 2 && <div className={styles.turnBadge}>思考中...</div>}
                            </div>

                            {/* Player (Self - Player 1 - Blue) */}
                            <div className={`${styles.playerInfo} ${currentPlayer === 1 ? styles.playerInfoActive : ''}`}>
                                <div>
                                    <p>{playerName} (自分)</p>
                                    <p style={{ fontSize: '0.9rem', color: '#666' }}>青 (先攻)</p>
                                </div>
                                {currentPlayer === 1 && <div className={styles.turnBadge}>あなたの番</div>}
                            </div>
                        </div>
                        <div className={styles.chatSection}>
                            <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                        </div>
                    </div>
                    <div className={styles.centerPanel}>
                        {/* Turn Indicator Removed */}
                        <svg width="600" height="500" viewBox="-450 -400 900 800" className={styles.hexGrid}>
                            {hexes.map(hex => {
                                const { x, y } = hexToPixel(hex);
                                const key = getHexKey(hex);
                                const player = board.get(key);
                                const isWinning = winningHexes.includes(key);

                                return (
                                    <polygon
                                        key={key}
                                        points={getHexPoints(HEX_SIZE)}
                                        transform={`translate(${x}, ${y})`}
                                        className={`${styles.hex} ${player ? styles[`player${player}`] : ''} ${isWinning ? styles.winning : ''}`}
                                        onClick={() => handleHexClick(hex)}
                                    />
                                );
                            })}
                        </svg>
                    </div>
                </div>
                {status === 'finished' && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            <h2>勝負あり！</h2>
                            <p>
                                {winner === 1 ? 'あなたの勝ち！' : 'あなたの負け...'}
                                <br />
                                {gameState === 'won' ? '(4つ並びました)' : '(3目並べ反則負け)'}
                            </p>
                            <button onClick={handleRematch} className={styles.primaryBtn}>再戦</button>
                            <button onClick={handleBackToTop} className={styles.secondaryBtn}>終了</button>
                        </div>
                    </div>
                )}
            </main>
        );
    }

    // --- MENU VIEW ---
    // --- UI HELPERS ---
    const handleRoomCreate = () => {
        setCustomRoomId('');
        setJoinMode('colyseus_room');
    };

    const handleRoomJoin = () => {
        if (!customRoomId) return;
        setJoinMode('colyseus_room');
    };

    const theme = {
        '--theme-primary': '#eab308',
        '--theme-secondary': '#ca8a04',
        '--theme-tertiary': '#facc15',
        '--theme-bg-light': '#fefce8',
        '--theme-text-title': 'linear-gradient(135deg, #ca8a04 0%, #eab308 50%, #facc15 100%)',
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
                <h1 className={navStyles.title}>蜂の陣</h1>
                <p className={navStyles.subtitle}>六角形の盤面で繰り広げる陣取り合戦</p>

                {/* Mode Selection (Side-by-Side) */}
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

                        <button onClick={startAIGame} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconRobot size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>AI対戦</span>
                            <span className={navStyles.modeBtnDesc}>練習モード (オフライン)</span>
                        </button>
                    </div>
                )}

                {/* Room Mode Selection (Create or Join) */}
                {joinMode === 'room_menu' && (
                    <div className={navStyles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            {/* Create Section */}
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={handleRoomCreate} className={navStyles.primaryBtn} style={{ width: '100%' }}>
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

                {/* Content Section (SEO/Info) */}
                <div className={navStyles.contentSection}>
                    <h2 className={navStyles.contentTitle}>蜂の陣（Honeycomb）の遊び方</h2>

                    <div className={navStyles.sectionBlock}>
                        <div className={navStyles.sectionHeader}>
                            <span className={navStyles.sectionIcon}>🐝</span>
                            <h3 className={navStyles.sectionTitle}>六角形の盤面で繰り広げる陣取り合戦</h3>
                        </div>
                        <p className={navStyles.textBlock}>
                            蜂の陣は、六角形（ヘキサゴン）のマス目で構成された盤面で行う、戦略的なボードゲームです。
                            交互に自分の色を置いていき、特定の条件を満たすことを目指します。
                            シンプルながらも奥深い、幾何学的な思考が試されるゲームです。
                        </p>
                    </div>

                    <div className={navStyles.sectionBlock}>
                        <div className={navStyles.sectionHeader}>
                            <span className={navStyles.sectionIcon}>📏</span>
                            <h3 className={navStyles.sectionTitle}>基本ルール</h3>
                        </div>
                        <div className={navStyles.cardGrid}>
                            <div className={navStyles.infoCard}>
                                <span className={navStyles.cardTitle}>1. 勝利条件</span>
                                <p className={navStyles.cardText}>自分の色のマスを「一直線に4つ」並べると勝ちです。縦、斜めのどの方向でもOKです。</p>
                            </div>
                            <div className={navStyles.infoCard}>
                                <span className={navStyles.cardTitle}>2. 敗北条件</span>
                                <p className={navStyles.cardText}>自分の色のマスを「一直線に3つ」並べてしまうと、その時点で負けになります（三目並べ禁止）。</p>
                            </div>
                            <div className={navStyles.infoCard}>
                                <span className={navStyles.cardTitle}>3. 手番</span>
                                <p className={navStyles.cardText}>青（先攻）と赤（後攻）が交互に、空いているマスに自分の色を置いていきます。</p>
                            </div>
                        </div>
                    </div>

                    <div className={navStyles.sectionBlock}>
                        <div className={navStyles.sectionHeader}>
                            <span className={navStyles.sectionIcon}>🧠</span>
                            <h3 className={navStyles.sectionTitle}>勝つためのコツ</h3>
                        </div>
                        <p className={navStyles.textBlock}>
                            4つ並べることを目指しつつ、3つ並びそうになるのを避けなければなりません。
                        </p>
                        <div className={navStyles.highlightBox}>
                            <span className={navStyles.highlightTitle}>相手を追い込む</span>
                            <p className={navStyles.textBlock} style={{ marginBottom: 0 }}>
                                相手に「次に置くと3つ並んでしまう」ような状況を作らせることができれば、勝利に近づきます。
                                また、相手が4つ並べようとしているのを阻止するのも重要です。
                            </p>
                        </div>
                        <ul className={navStyles.list}>
                            <li className={navStyles.listItem}>
                                <strong>フォークを作る</strong><br />
                                2つの方向で同時に4つ並びそうな形（フォーク）を作れば、相手は片方しか防げないので必勝となります。
                            </li>
                            <li className={navStyles.listItem}>
                                <strong>3並びの罠</strong><br />
                                相手がうっかり3つ並べてしまうように、盤面をコントロールしましょう。
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}


