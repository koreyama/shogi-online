'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/GameMenu.module.css';
import { usePlayer } from '@/hooks/usePlayer';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import ColyseusChessGame from './ColyseusChessGame';
import ChessBoard from '@/components/ChessBoard';
import { Chat } from '@/components/Chat';
import HideChatBot from '@/components/HideChatBot';
import { createInitialState, executeMove, isValidMove } from '@/lib/chess/engine';
import { getBestMove } from '@/lib/chess/ai';
import { Coordinates } from '@/lib/chess/types';

export default function ChessPage() {
    const router = useRouter();
    const { playerName: savedName, savePlayerName, playerId, isLoaded } = usePlayer();
    const [playerName, setPlayerName] = useState('');
    const [mounted, setMounted] = useState(false);

    // Mode Selection: null, 'colyseus_random', 'colyseus_room', 'colyseus_room_active', 'ai'
    const [joinMode, setJoinMode] = useState<'colyseus_random' | 'colyseus_room' | 'colyseus_room_active' | 'ai' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    // AI Match State
    const [gameState, setGameState] = useState<any>(null);
    const [status, setStatus] = useState<'initial' | 'playing' | 'finished'>('initial');
    const [myRole, setMyRole] = useState<'white' | 'black'>('white');
    const [selectedPos, setSelectedPos] = useState<Coordinates | null>(null);
    const [validMoves, setValidMoves] = useState<Coordinates[]>([]);
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isLoaded && savedName) {
            setPlayerName(savedName);
        }
    }, [isLoaded, savedName]);

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerName.trim()) {
            savePlayerName(playerName.trim());
        }
    };

    const handleBackToMenu = () => {
        setJoinMode(null);
        setCustomRoomId('');
        setStatus('initial');
    };

    const handleBackToTop = () => {
        router.push('/');
    };

    const startAIGame = () => {
        setJoinMode('ai');
        setMyRole('white');
        setGameState(createInitialState());
        setStatus('playing');
        setMessages([]);
    };

    // AI Logic
    useEffect(() => {
        if (joinMode !== 'ai' || !gameState || gameState.turn !== 'black' || status !== 'playing') return;

        const timer = setTimeout(() => {
            const bestMove = getBestMove(gameState, 'black');
            if (bestMove) {
                const newState = executeMove(gameState, bestMove.from, bestMove.to);
                setGameState(newState);
                if (newState.winner) setStatus('finished');
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [gameState, joinMode, status]);

    const handleCellClick = (x: number, y: number) => {
        if (joinMode !== 'ai' || !gameState || gameState.turn !== myRole || status !== 'playing') return;

        const piece = gameState.board[y][x];

        // Selection
        if (piece && piece.player === myRole) {
            setSelectedPos({ x, y });
            const moves: Coordinates[] = [];
            for (let dy = 0; dy < 8; dy++) {
                for (let dx = 0; dx < 8; dx++) {
                    if (isValidMove(gameState, { x, y }, { x: dx, y: dy })) {
                        moves.push({ x: dx, y: dy });
                    }
                }
            }
            setValidMoves(moves);
            return;
        }

        // Execution
        if (selectedPos) {
            const isValid = validMoves.some(m => m.x === x && m.y === y);
            if (isValid) {
                const newState = executeMove(gameState, selectedPos, { x, y });
                setGameState(newState);
                if (newState.winner) setStatus('finished');
                setSelectedPos(null);
                setValidMoves([]);
            } else {
                setSelectedPos(null);
                setValidMoves([]);
            }
        }
    };

    const handleSendMessage = (text: string) => {
        setMessages(prev => [...prev, { id: `msg-${Date.now()}`, sender: savedName, text, timestamp: Date.now() }]);
    };

    const handleRematch = () => {
        setGameState(createInitialState());
        setStatus('playing');
        setMessages([]);
    };

    if (!mounted) return null;
    if (!isLoaded) return null;

    if (!savedName) {
        return (
            <main className={styles.main}>
                <div className={styles.setupContainer}>
                    <h1 className={styles.title}>チェス</h1>
                    <form onSubmit={handleNameSubmit} className={styles.setupForm}>
                        <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="プレイヤー名" className={styles.input} required />
                        <button type="submit" className={styles.primaryBtn} style={{ width: '100%' }}>次へ</button>
                    </form>
                </div>
            </main>
        );
    }

    // --- GAME VIEWS ---
    if (joinMode === 'colyseus_random') {
        return <><HideChatBot /><ColyseusChessGame mode="random" userData={{ name: savedName, id: playerId }} /></>;
    }

    if (joinMode === 'colyseus_room_active') {
        return <><HideChatBot /><ColyseusChessGame mode="room" roomId={customRoomId || undefined} userData={{ name: savedName, id: playerId }} /></>;
    }

    if (joinMode === 'ai' && gameState) {
        return (
            <main className={styles.main}>
                <HideChatBot />
                <div className={styles.header}><button onClick={handleBackToMenu} className={styles.backButton}><IconBack size={18} /> 終了</button></div>
                <div className={styles.gameLayout}>
                    <div className={styles.leftPanel}>
                        <div className={styles.playersSection}>
                            <div className={styles.playerInfo}>
                                <p>AI (相手)</p>
                                <p>黒 (後手)</p>
                            </div>
                            <div className={styles.playerInfo}>
                                <p>{savedName} (自分)</p>
                                <p>白 (先手)</p>
                            </div>
                        </div>
                        <div className={styles.chatSection}>
                            <Chat messages={messages} onSendMessage={handleSendMessage} myName={savedName} />
                        </div>
                    </div>
                    <div className={styles.centerPanel}>
                        <div className={styles.turnIndicator}>
                            {gameState.turn === 'white' ? '白の番' : '黒の番'}
                            {gameState.turn === myRole && ' (あなた)'}
                        </div>
                        <ChessBoard
                            board={gameState.board}
                            onCellClick={handleCellClick}
                            selectedPos={selectedPos}
                            validMoves={validMoves}
                            turn={gameState.turn}
                            isMyTurn={gameState.turn === myRole}
                            winner={gameState.winner}
                            myRole={myRole}
                        />
                    </div>
                </div>
                {status === 'finished' && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            <h2>勝負あり！</h2>
                            <p>勝者: {gameState.winner === 'white' ? '白' : gameState.winner === 'black' ? '黒' : '引き分け'}</p>
                            <button onClick={handleRematch} className={styles.primaryBtn}>再戦</button>
                            <button onClick={handleBackToMenu} className={styles.secondaryBtn}>終了</button>
                        </div>
                    </div>
                )}
            </main>
        );
    }

    // --- MENU VIEWS ---
    if (joinMode === 'colyseus_room') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={handleBackToMenu} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={styles.gameContainer}>
                    <h1 className={styles.title}>ルーム対戦</h1>
                    <div className={styles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', width: '100%', maxWidth: '340px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button
                                    onClick={() => { setCustomRoomId(''); setJoinMode('colyseus_room_active'); }}
                                    className={styles.primaryBtn}
                                    style={{ width: '100%', background: 'linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', padding: '1rem' }}
                                >
                                    ルーム作成（ID自動発行）
                                </button>
                            </div>
                            <div style={{ position: 'relative', height: '1px', background: 'rgba(0,0,0,0.1)', width: '100%' }}>
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#f7fafc', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={customRoomId}
                                        onChange={(e) => setCustomRoomId(e.target.value)}
                                        placeholder="6桁のID"
                                        className={styles.input}
                                        maxLength={10}
                                        style={{ flex: 1, letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.1rem' }}
                                        inputMode="numeric"
                                    />
                                    <button
                                        onClick={() => { if (customRoomId) setJoinMode('colyseus_room_active'); }}
                                        className={styles.primaryBtn}
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

    // MAIN MENU
    return (
        <main className={styles.main}>
            <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
            <div className={styles.gameContainer}>
                <h1 className={styles.title}>チェス</h1>
                <div className={styles.modeSelection}>
                    <button onClick={() => setJoinMode('colyseus_random')} className={styles.modeBtn}>
                        <span className={styles.modeBtnIcon}><IconDice size={48} color="var(--color-primary)" /></span>
                        <span className={styles.modeBtnTitle}>ランダムマッチ</span>
                        <span className={styles.modeBtnDesc}>誰かとすぐに対戦</span>
                    </button>
                    <button onClick={() => setJoinMode('colyseus_room')} className={styles.modeBtn}>
                        <span className={styles.modeBtnIcon}><IconKey size={48} color="var(--color-primary)" /></span>
                        <span className={styles.modeBtnTitle}>ルーム対戦</span>
                        <span className={styles.modeBtnDesc}>友達と対戦</span>
                    </button>
                    <button onClick={startAIGame} className={styles.modeBtn}>
                        <span className={styles.modeBtnIcon}><IconRobot size={48} color="var(--color-primary)" /></span>
                        <span className={styles.modeBtnTitle}>AI対戦</span>
                        <span className={styles.modeBtnDesc}>練習モード (オフライン)</span>
                    </button>
                </div>
            </div>

            <div className={styles.contentSection}>
                <h2 className={styles.contentTitle}>チェスの世界へようこそ</h2>
                <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionIcon}>♔</span>
                        <h3 className={styles.sectionTitle}>チェスの歴史</h3>
                    </div>
                    <p className={styles.textBlock}>
                        チェスの起源は古代インドまで遡ります。世界で最もポピュラーなボードゲームの一つです。
                    </p>
                </div>
                <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionIcon}>♟️</span>
                        <h3 className={styles.sectionTitle}>基本ルール</h3>
                    </div>
                    <div className={styles.cardGrid}>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>勝利条件</span>
                            <p className={styles.cardText}>相手のキングをチェックメイトすれば勝ちです。</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
