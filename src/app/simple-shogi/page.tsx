'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import SimpleShogiBoard from '@/components/SimpleShogiBoard';
import { createInitialState, getValidMoves, move } from '@/lib/simple-shogi/engine';
import { GameState, Player, PieceType } from '@/lib/simple-shogi/types';
import { getBestMove } from '@/lib/simple-shogi/ai';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import ColyseusSimpleShogiGame from './ColyseusSimpleShogiGame';
import HideChatBot from '@/components/HideChatBot';

export default function SimpleShogiPage() {
    const router = useRouter();
    const { playerName, isLoaded } = usePlayer();
    const [gameState, setGameState] = useState<GameState | null>(null);

    // Online State
    const [joinMode, setJoinMode] = useState<'colyseus_random' | 'colyseus_room' | 'ai' | 'room_menu' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    // AI State
    const [aiStatus, setAiStatus] = useState<'playing' | 'finished'>('playing');

    // AI Interactions
    const [selectedPos, setSelectedPos] = useState<{ r: number, c: number } | null>(null);
    const [selectedHand, setSelectedHand] = useState<PieceType | null>(null);
    const [validMoves, setValidMoves] = useState<any[]>([]);

    useEffect(() => {
        if (joinMode === 'ai') {
            setGameState(createInitialState());
            setAiStatus('playing');
        } else {
            setGameState(null);
        }
    }, [joinMode]);

    // Update valid moves for AI match
    useEffect(() => {
        if (joinMode === 'ai' && gameState && gameState.turn === 'sente' && aiStatus === 'playing') {
            const moves = getValidMoves(gameState, 'sente');
            setValidMoves(moves);
        } else {
            setValidMoves([]);
        }
    }, [gameState, joinMode, aiStatus]);

    // AI Logic
    useEffect(() => {
        if (joinMode !== 'ai' || !gameState || gameState.turn !== 'gote' || aiStatus !== 'playing') return;

        const timer = setTimeout(() => {
            const bestMove = getBestMove(gameState, 'gote');
            if (bestMove) {
                const newState = move(gameState, bestMove);
                setGameState(newState);
                if (newState.winner) setAiStatus('finished');
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [gameState, joinMode, aiStatus]);

    const handleAICellClick = (r: number, c: number) => {
        if (joinMode !== 'ai' || !gameState || gameState.turn !== 'sente' || aiStatus !== 'playing') return;

        const piece = gameState.board[r][c];

        // Select piece to move
        if (piece && piece.owner === 'sente') {
            setSelectedPos({ r, c });
            setSelectedHand(null);
            return;
        }

        // Move or Drop
        if (selectedPos) {
            const moveAction = validMoves.find(m => !m.isDrop && m.from.r === selectedPos.r && m.from.c === selectedPos.c && m.to.r === r && m.to.c === c);
            if (moveAction) {
                executeAIMove(moveAction);
                setSelectedPos(null);
            }
        } else if (selectedHand) {
            const dropAction = validMoves.find(m => m.isDrop && m.type === selectedHand && m.to.r === r && m.to.c === c);
            if (dropAction) {
                executeAIMove(dropAction);
                setSelectedHand(null);
            }
        }
    };

    const handleAIHandClick = (type: PieceType) => {
        if (joinMode !== 'ai' || !gameState || gameState.turn !== 'sente' || aiStatus !== 'playing') return;
        setSelectedHand(type);
        setSelectedPos(null);
    };

    const executeAIMove = (action: any) => {
        const newState = move(gameState!, action);
        setGameState(newState);
        if (newState.winner) setAiStatus('finished');
    };

    const handleBackToTop = () => {
        router.push('/');
    };

    const handleAIRematch = () => {
        setGameState(createInitialState());
        setAiStatus('playing');
    };

    if (!isLoaded) return <div className={styles.main}>Loading...</div>;

    // --- GAME VIEW: PREVIOUSLY ---
    if (joinMode === 'colyseus_random') {
        return <ColyseusSimpleShogiGame mode="random" />;
    }

    // --- GAME VIEW: ROOM MATCH ---
    if (joinMode === 'colyseus_room') {
        const roomId = customRoomId.trim() || undefined; // If empty, create new room
        return <ColyseusSimpleShogiGame mode="room" roomId={roomId} />;
    }

    // --- GAME VIEW: AI MATCH ---
    if (joinMode === 'ai' && gameState) {
        return (
            <main className={styles.main}>
                <HideChatBot />
                <div className={styles.header}><button onClick={() => setJoinMode(null)} className={styles.backButton}><IconBack size={18} /> 終了</button></div>
                <div className={styles.gameLayout}>
                    <div className={styles.leftPanel}>
                        <div className={styles.playersSection}>
                            <div className={styles.playerInfo}>
                                <p>AI</p>
                                <p>後手</p>
                            </div>
                            <div className={styles.playerInfo}>
                                <p>{playerName} (自分)</p>
                                <p>先手</p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.centerPanel}>
                        <div className={styles.turnIndicator}>
                            {gameState.turn === 'sente' ? '先手の番 (あなた)' : '後手の番 (AI)'}
                        </div>
                        <SimpleShogiBoard
                            board={gameState.board}
                            hands={gameState.hands}
                            turn={gameState.turn}
                            myRole="sente"
                            validMoves={validMoves}
                            onCellClick={handleAICellClick}
                            onHandClick={handleAIHandClick}
                            selectedPos={selectedPos}
                            selectedHand={selectedHand}
                            lastMove={gameState.history[gameState.history.length - 1]}
                        />
                    </div>
                </div>
                {aiStatus === 'finished' && gameState.winner && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            <h2>勝負あり！</h2>
                            <p>勝者: {gameState.winner === 'sente' ? '先手' : '後手'}</p>
                            <button onClick={handleAIRematch} className={styles.primaryBtn}>再戦</button>
                            <button onClick={() => setJoinMode(null)} className={styles.secondaryBtn}>終了</button>
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

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <button onClick={handleBackToTop} className={styles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>

            <div className={styles.gameContainer}>
                <h1 className={styles.title}>ファンタジー将棋</h1>
                <p className={styles.subtitle}>小さな盤面で熱い頭脳戦</p>

                {/* Mode Selection (Side-by-Side) */}
                {!joinMode && (
                    <div className={styles.modeSelection}>
                        <button onClick={() => setJoinMode('colyseus_random')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconDice size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>ランダムマッチ</span>
                            <span className={styles.modeBtnDesc}>誰かとすぐに対戦</span>
                        </button>

                        <button onClick={() => setJoinMode('room_menu')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconKey size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>ルーム対戦</span>
                            <span className={styles.modeBtnDesc}>友達と対戦</span>
                        </button>

                        <button onClick={() => setJoinMode('ai')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconRobot size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>AI対戦</span>
                            <span className={styles.modeBtnDesc}>練習モード (オフライン)</span>
                        </button>
                    </div>
                )}

                {/* Room Mode Selection (Create or Join) */}
                {joinMode === 'room_menu' && (
                    <div className={styles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            {/* Create Section */}
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={handleRoomCreate} className={styles.primaryBtn} style={{ width: '100%', background: 'linear-gradient(135deg, #e6b422 0%, #b8860b 100%)', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', padding: '1rem' }}>
                                    ルーム作成（ID自動発行）
                                </button>
                            </div>

                            <div style={{ position: 'relative', height: '1px', background: 'rgba(0,0,0,0.1)', width: '100%' }}>
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
                            </div>

                            {/* Join Section */}
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        className={styles.input}
                                        placeholder="ルームID (6桁)"
                                        value={customRoomId}
                                        onChange={e => setCustomRoomId(e.target.value)}
                                        style={{ flex: 1, letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.1rem' }}
                                    />
                                    <button onClick={handleRoomJoin} className={styles.primaryBtn} style={{ width: 'auto', padding: '0 2rem', whiteSpace: 'nowrap' }}>
                                        参加
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setJoinMode(null)} className={styles.secondaryBtn} style={{ marginTop: '2rem' }}>
                            戻る
                        </button>
                    </div>
                )}

                {/* Content Section (SEO/Info) - Preserved */}
                <div className={styles.contentSection}>
                    <h2 className={styles.contentTitle}>ファンタジー将棋（どうぶつしょうぎ風）の遊び方</h2>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>🦁</span>
                            <h3 className={styles.sectionTitle}>小さな盤面で熱い頭脳戦</h3>
                        </div>
                        <p className={styles.textBlock}>
                            ファンタジー将棋は、3×4マスの小さな盤面で遊ぶ、将棋を簡略化したミニゲームです。
                            ルールは簡単ですが奥が深く、短時間で楽しめます。
                        </p>
                    </div>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>📏</span>
                            <h3 className={styles.sectionTitle}>基本ルール</h3>
                        </div>
                        <div className={styles.cardGrid}>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>1. 勝利条件</span>
                                <p className={styles.cardText}>相手の「ライオン（王）」を取るか（キャッチ）、自分のライオンが相手の陣地（一番奥の段）に入れば（トライ）勝ちです。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>2. 駒の動き</span>
                                <p className={styles.cardText}>
                                    <strong>ライオン</strong>：全方向に1マス<br />
                                    <strong>キリン</strong>：縦横に1マス<br />
                                    <strong>ゾウ</strong>：斜めに1マス<br />
                                    <strong>ヒヨコ</strong>：前に1マス
                                </p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>3. 持ち駒</span>
                                <p className={styles.cardText}>取った駒を自分の駒として、空いているマスに打つことができます。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>4. 成り</span>
                                <p className={styles.cardText}>ヒヨコが相手の陣地に入ると「ニワトリ」になり、動きがパワーアップします。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
