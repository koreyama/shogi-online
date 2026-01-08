'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IconBack, IconDice, IconKey, IconRobot, IconHourglass } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import styles from './page.module.css';
import navStyles from '@/styles/GameMenu.module.css';
import { FloatingShapes } from '@/components/landing/FloatingShapes';
import { Chat } from '@/components/Chat';
import CheckersBoard from '@/components/CheckersBoard';
import { createInitialState, getValidMoves, move } from '@/lib/checkers/engine';
import { getBestMove } from '@/lib/checkers/ai';
import { GameState, Move, Player, Position } from '@/lib/checkers/types';
import ColyseusCheckersGame from './ColyseusCheckersGame';
import HideChatBot from '@/components/HideChatBot';

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

const CHECKERS_THEME = {
    '--theme-primary': '#dc2626',
    '--theme-secondary': '#b91c1c',
    '--theme-tertiary': '#ef4444',
    '--theme-bg-light': '#fef2f2',
    '--theme-text-title': 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #ef4444 100%)',
} as React.CSSProperties;

export default function CheckersPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerId, playerName, isLoaded } = usePlayer();
    const [joinMode, setJoinMode] = useState<'colyseus_random' | 'colyseus_room' | 'ai' | 'room_menu' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    // Local state for AI match
    const [gameState, setGameState] = useState<GameState>(createInitialState());
    const [roomId, setRoomId] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<Player | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [selectedPos, setSelectedPos] = useState<Position | null>(null);

    const statusRef = useRef<string>('');

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (!isLoaded) return;
        statusRef.current = 'ゲームモードを選択してください';
    }, [isLoaded]);

    // AI Logic
    useEffect(() => {
        if (joinMode !== 'ai' || gameState.winner || gameState.turn === 'red') return; // AI is Black

        const timer = setTimeout(() => {
            setIsAiThinking(true);
            const bestMove = getBestMove(gameState, 'black');
            if (bestMove) {
                const nextState = move(gameState, bestMove);
                setGameState(nextState);
            }
            setIsAiThinking(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [gameState, joinMode]);

    if (authLoading || !user || !isLoaded) return <div className={styles.main}>Loading...</div>;

    const startAiGame = () => {
        setRoomId('ai-match');
        setMyRole('red');
        setGameState(createInitialState());
        setJoinMode('ai');
    };

    const handleRoomCreate = () => {
        setCustomRoomId('');
        setJoinMode('colyseus_room');
    };

    const handleRoomJoin = () => {
        if (!customRoomId) return;
        setJoinMode('colyseus_room');
    };

    const handleCellClick = (r: number, c: number) => {
        if (gameState.winner || (roomId !== 'ai-match' && gameState.turn !== myRole)) return;
        if (isAiThinking) return;

        const piece = gameState.board[r][c];
        const isMyPiece = piece && piece.owner === (roomId === 'ai-match' ? 'red' : myRole);

        if (gameState.activePiece) {
            if (r !== gameState.activePiece.r || c !== gameState.activePiece.c) return;
            setSelectedPos({ r, c });
            return;
        }

        if (isMyPiece) {
            setSelectedPos({ r, c });
        } else if (selectedPos) {
            const validMoves = getValidMoves(gameState, gameState.turn);
            const moveAction = validMoves.find(m =>
                m.from.r === selectedPos.r &&
                m.from.c === selectedPos.c &&
                m.to.r === r &&
                m.to.c === c
            );

            if (moveAction) {
                if (roomId === 'ai-match') {
                    setGameState(move(gameState, moveAction));
                }
                setSelectedPos(null);
            }
        }
    };

    if (joinMode === 'colyseus_random') {
        return <><HideChatBot /><ColyseusCheckersGame mode="random" /></>;
    }
    if (joinMode === 'colyseus_room') {
        return <><HideChatBot /><ColyseusCheckersGame mode="room" roomId={customRoomId.trim() || undefined} /></>;
    }
    // Note: The above logic renders the SETUP screen for Room match.
    // But ColyseusCheckersGame is called immediately in old code. 
    // We need to change handleRoomJoin to switch to a 'playing' mode, similar to Shogi.
    // For now, let's keep old behavior for Room Join if RoomID is present, but wait... 
    // In old code: return <ColyseusCheckersGame ... /> immediately.
    // It seems Checkers didn't have a separate ID input screen in page.tsx?
    // Ah, Line 210 in original file shows it HAD an input screen.
    // Line 209: if (joinMode === 'room_menu') ...
    // So 'room_menu' is the setup screen. 'colyseus_room' is the game.
    // OK, I will style 'room_menu' block below, and leave 'colyseus_room' block (which renders game) alone.


    if (joinMode === 'ai') {
        const validMoves = getValidMoves(gameState, gameState.turn);
        return (
            <main className={styles.main} style={CHECKERS_THEME}>
                <HideChatBot />
                <div className={styles.header}><button onClick={() => setJoinMode(null)} className={styles.backButton}><IconBack size={18} /> 終了</button></div>
                <div className={styles.gameLayout}>
                    <div className={styles.leftPanel}>
                        <div className={styles.playersSection}>
                            <div className={styles.playerInfo}>
                                <p>AI</p>
                                <p>黒 (Black)</p>
                            </div>
                            <div className={styles.playerInfo}>
                                <p>{playerName} (自分)</p>
                                <p>赤 (Red)</p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.centerPanel}>
                        <div className={styles.turnIndicator}>
                            {gameState.turn === 'red' ? '赤の番' : '黒の番'}
                            {gameState.turn === 'red' && ' (あなた)'}
                        </div>
                        <CheckersBoard
                            board={gameState.board}
                            turn={gameState.turn}
                            myRole="red"
                            validMoves={validMoves}
                            onCellClick={handleCellClick}
                            selectedPos={selectedPos}
                            lastMove={gameState.history[gameState.history.length - 1] || null}
                        />
                        {gameState.mustJump && <p style={{ color: '#fc8181', marginTop: '1rem', fontWeight: 'bold' }}>※ 強制ジャンプが必要です</p>}
                        {isAiThinking && <p style={{ color: '#805ad5', marginTop: '1rem' }}>AIが考えています...</p>}
                    </div>
                </div>
                {gameState.winner && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            <h2>勝負あり！</h2>
                            <p>勝者: {gameState.winner === 'draw' ? '引き分け' : (gameState.winner === 'red' ? '赤' : '黒')}</p>
                            <button onClick={() => setJoinMode(null)} className={styles.primaryBtn}>終了</button>
                        </div>
                    </div>
                )}
            </main>
        );
    }

    return (
        <main className={navStyles.main} style={CHECKERS_THEME}>
            <FloatingShapes />
            <div className={navStyles.header}>
                <button onClick={() => router.push('/')} className={navStyles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>
            <div className={navStyles.gameContainer}>
                <h1 className={navStyles.title}>チェッカー</h1>
                <p className={navStyles.subtitle}>斜めに動き、相手を飛び越えて捕獲する伝統ゲーム</p>

                {!joinMode && (
                    <div className={navStyles.modeSelection}>
                        <button onClick={() => setJoinMode('colyseus_random')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconDice size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ランダムマッチ</span>
                            <span className={navStyles.modeBtnDesc}>世界中のプレイヤーと対戦</span>
                        </button>
                        <button onClick={() => setJoinMode('room_menu')} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconKey size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>ルーム対戦</span>
                            <span className={navStyles.modeBtnDesc}>友達と対戦</span>
                        </button>
                        <button onClick={startAiGame} className={navStyles.modeBtn}>
                            <div className={navStyles.modeBtnIcon}><IconRobot size={32} /></div>
                            <span className={navStyles.modeBtnTitle}>AI対戦</span>
                            <span className={navStyles.modeBtnDesc}>コンピュータと練習</span>
                        </button>
                    </div>
                )}

                {joinMode === 'room_menu' && (
                    <div className={navStyles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p className={navStyles.joinDesc} style={{ marginBottom: '1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={handleRoomCreate} className={navStyles.primaryBtn} style={{ width: '100%', background: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)', color: '#fff' }}>
                                    ルーム作成（ID自動発行）
                                </button>
                            </div>
                            <div style={{ position: 'relative', height: '1px', background: 'rgba(255,255,255,0.2)', width: '100%' }}>
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p className={navStyles.joinDesc} style={{ marginBottom: '1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        className={navStyles.input}
                                        placeholder="ルームID (6桁)"
                                        value={customRoomId}
                                        onChange={e => setCustomRoomId(e.target.value)}
                                        style={{ flex: 1, textAlign: 'center' }}
                                    />
                                    <button onClick={handleRoomJoin} className={navStyles.secondaryBtn} style={{ width: 'auto', padding: '0 2rem' }}>参加</button>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setJoinMode(null)} className={navStyles.backButton} style={{ marginTop: '2rem', background: 'none', border: 'none' }}>
                            キャンセル
                        </button>
                    </div>
                )}

                <div className={navStyles.contentSection}>
                    <h2 className={navStyles.contentTitle}>チェッカー（ドラフツ）の遊び方</h2>

                    <div className={navStyles.sectionBlock}>
                        <div className={navStyles.sectionHeader}>
                            <span className={navStyles.sectionIcon}>🏁</span>
                            <h3 className={navStyles.sectionTitle}>世界中で愛される伝統ゲーム</h3>
                        </div>
                        <p className={navStyles.textBlock}>
                            チェッカー（Checkers）、またはドラフツ（Draughts）は、非常に古いボードゲームです。
                            斜めに動いて相手を飛び越すというダイナミックな動きと、「強制ジャンプ」という独特のルールが、スリリングな展開を生み出します。
                        </p>
                    </div>

                    <div className={navStyles.sectionBlock}>
                        <div className={navStyles.sectionHeader}>
                            <span className={navStyles.sectionIcon}>📏</span>
                            <h3 className={navStyles.sectionTitle}>基本ルール</h3>
                        </div>
                        <div className={navStyles.cardGrid}>
                            <div className={navStyles.infoCard}>
                                <span className={navStyles.cardTitle}>1. 移動</span>
                                <p className={navStyles.cardText}>駒は斜め前方に1マスずつ進めます。黒いマスの上だけを移動します。</p>
                            </div>
                            <div className={navStyles.infoCard}>
                                <span className={navStyles.cardTitle}>2. ジャンプ</span>
                                <p className={navStyles.cardText}>隣に相手の駒があり、その奥が空いている場合、飛び越えて相手の駒を取ることができます。</p>
                            </div>
                            <div className={navStyles.infoCard}>
                                <span className={navStyles.cardTitle}>3. 強制ジャンプ</span>
                                <p className={navStyles.cardText}>取れる駒がある場合は、必ず取らなければなりません。複数取れる場合は更に取り続けます。</p>
                            </div>
                            <div className={navStyles.infoCard}>
                                <span className={navStyles.cardTitle}>4. キング</span>
                                <p className={navStyles.cardText}>一番奥の列まで進むと「キング」になり、斜め後ろにも進めるようになります。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
