'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/hooks/usePlayer';
import { createInitialState, executeMove, isValidMove } from '@/lib/mancala/engine';
import { GameState } from '@/lib/mancala/types';
import { getBestMove } from '@/lib/mancala/ai';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import MancalaBoard from '@/components/MancalaBoard';
import styles from '@/styles/GameMenu.module.css';
import ColyseusMancalaGame from './ColyseusMancalaGame';

export default function MancalaPage() {
    const router = useRouter();
    const { playerName, isLoaded } = usePlayer();
    const [joinMode, setJoinMode] = useState<'colyseus_random' | 'colyseus_room' | 'ai' | 'room_menu' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    // Local state for AI match
    const [gameState, setGameState] = useState<GameState>(createInitialState());

    const startAIGame = () => {
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

    // AI Logic
    useEffect(() => {
        if (joinMode !== 'ai' || !gameState || gameState.turn !== 'second' || gameState.isGameOver) return;

        const timer = setTimeout(() => {
            const bestMove = getBestMove(gameState, 'second');
            if (bestMove !== null) {
                const newState = executeMove(gameState, bestMove);
                setGameState(newState);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [gameState, joinMode]);

    const handlePitClick = (pitIndex: number) => {
        if (!gameState || gameState.turn !== 'first' || gameState.isGameOver) return;

        // 自分の側のピットか確認
        if (pitIndex < 0 || pitIndex > 5) return;
        if (!isValidMove(gameState, pitIndex)) return;

        const newState = executeMove(gameState, pitIndex);
        setGameState(newState);
    };

    if (joinMode === 'colyseus_random') {
        return <ColyseusMancalaGame mode="random" />;
    }
    if (joinMode === 'colyseus_room') {
        return <ColyseusMancalaGame mode="room" roomId={customRoomId || undefined} />;
    }

    if (joinMode === 'ai') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={() => setJoinMode(null)} className={styles.backButton}><IconBack size={18} /> 終了</button></div>
                <div className={styles.gameLayout}>
                    <div className={styles.leftPanel}>
                        <div className={styles.playersSection}>
                            <div className={styles.playerInfo}>
                                <p>AI</p>
                                <p>Second (上)</p>
                            </div>
                            <div className={styles.playerInfo}>
                                <p>{playerName} (自分)</p>
                                <p>First (下)</p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.centerPanel}>
                        <div className={styles.turnIndicator}>
                            {gameState.turn === 'first' ? 'Firstの番 (下)' : 'Secondの番 (上)'}
                            {gameState.turn === 'first' && ' (あなた)'}
                        </div>
                        <MancalaBoard
                            board={gameState.board}
                            onPitClick={handlePitClick}
                            turn={gameState.turn}
                            isMyTurn={gameState.turn === 'first'}
                            winner={gameState.winner}
                            myRole="first"
                        />
                    </div>
                </div>
                {gameState.isGameOver && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            <h2>勝負あり！</h2>
                            <p>勝者: {gameState.winner === 'first' ? 'First' : gameState.winner === 'second' ? 'Second' : '引き分け'}</p>
                            <button onClick={startAIGame} className={styles.primaryBtn}>再戦</button>
                            <button onClick={() => setJoinMode(null)} className={styles.secondaryBtn}>終了</button>
                        </div>
                    </div>
                )}
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <button onClick={() => router.push('/')} className={styles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>
            <div className={styles.gameContainer}>
                <h1 className={styles.title}>マンカラ</h1>
                <p className={styles.subtitle}>最古のボードゲームで知略を競う</p>

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
                        <button onClick={startAIGame} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconRobot size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>AI対戦</span>
                            <span className={styles.modeBtnDesc}>練習モード (オフライン)</span>
                        </button>
                    </div>
                )}

                {joinMode === 'room_menu' && (
                    <div className={styles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={handleRoomCreate} className={styles.primaryBtn} style={{ width: '100%', background: 'linear-gradient(135deg, #ECC94B 0%, #D69E2E 100%)', color: '#fff' }}>
                                    ルーム作成（ID自動発行）
                                </button>
                            </div>
                            <div style={{ position: 'relative', height: '1px', background: 'rgba(0,0,0,0.1)', width: '100%' }}>
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        className={styles.input}
                                        placeholder="ルームID (6桁)"
                                        value={customRoomId}
                                        onChange={e => setCustomRoomId(e.target.value)}
                                        style={{ flex: 1, textAlign: 'center' }}
                                    />
                                    <button onClick={handleRoomJoin} className={styles.primaryBtn} style={{ width: 'auto', padding: '0 2rem' }}>参加</button>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setJoinMode(null)} className={styles.secondaryBtn} style={{ marginTop: '2rem' }}>戻る</button>
                    </div>
                )}

                <div className={styles.contentSection}>
                    <h2 className={styles.contentTitle}>マンカラ（カラハ）の遊び方と歴史</h2>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>🌍</span>
                            <h3 className={styles.sectionTitle}>世界最古のゲーム「マンカラ」</h3>
                        </div>
                        <p className={styles.textBlock}>
                            マンカラ（Mancala）は、紀元前から遊ばれている世界最古のボードゲームの一つです。
                            アフリカや中近東、東南アジアなど世界中で親しまれており、数百種類以上のルールが存在します。
                            このサイトでは、最もポピュラーなルールの一つである「ベーシック（カラハ）」を採用しています。
                        </p>
                    </div>

                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>💎</span>
                            <h3 className={styles.sectionTitle}>基本ルール（カラハ）</h3>
                        </div>
                        <div className={styles.cardGrid}>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>1. 種まき</span>
                                <p className={styles.cardText}>自分のポケットから1つ選び、中の石をすべて取ります。反時計回りに隣の穴へ1つずつ入れていきます。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>2. ゴール</span>
                                <p className={styles.cardText}>右端の大きな穴が自分のゴール（ストア）です。ここにも石を入れますが、相手のストアは飛ばします。</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>3. ぴったりゴール</span>
                                <p className={styles.cardText}>最後の石が自分のストアに入ったら、もう一度自分の番になります（連続手番）。これが勝利の鍵です！</p>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.cardTitle}>4. 横取り</span>
                                <p className={styles.cardText}>最後の石が自分の空のポケットに入り、向かい側に相手の石があれば、それらをすべて獲得できます。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
