'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/GameMenu.module.css';
import gameStyles from './page.module.css';
import { MinesweeperBoard } from '@/components/MinesweeperBoard';
import { createEmptyBoard, revealCell, toggleFlag } from '@/lib/minesweeper/engine';
import { GameState, DIFFICULTIES, Difficulty } from '@/lib/minesweeper/types';
import { IconBack, IconUser, IconTrophy, IconFlag, IconDice, IconKey } from '@/components/Icons';
import { useAuth } from '@/hooks/useAuth';
import { submitScore, getRankings, getUserRank, ScoreEntry } from '@/lib/minesweeper/ranking';
import { usePlayer } from '@/hooks/usePlayer';
import { ColyseusMinesweeperGame } from './ColyseusMinesweeperGame';
import HideChatBot from '@/components/HideChatBot';
import { FloatingShapes } from '@/components/landing/FloatingShapes';
import { MinesweeperShareModal } from '@/components/sharing/MinesweeperShareModal';
import { IconXLogo } from '@/components/Icons';

const MINESWEEPER_THEME = {
    '--theme-primary': '#475569',
    '--theme-secondary': '#334155',
    '--theme-tertiary': '#64748b',
    '--theme-bg-light': '#f8fafc',
    '--theme-text-title': 'linear-gradient(135deg, #334155 0%, #475569 50%, #64748b 100%)',
} as React.CSSProperties;

export default function MinesweeperPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName, savePlayerName, isLoaded: nameLoaded } = usePlayer();

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    // Game State (Single Player)
    const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES.EASY);
    const [gameState, setGameState] = useState<GameState>({
        board: createEmptyBoard(DIFFICULTIES.EASY.rows, DIFFICULTIES.EASY.cols),
        status: 'initial',
        difficulty: DIFFICULTIES.EASY,
        startTime: null,
        endTime: null,
        minesLeft: DIFFICULTIES.EASY.mines
    });
    const [time, setTime] = useState(0);
    const [isFlagMode, setIsFlagMode] = useState(false);
    const [rankings, setRankings] = useState<ScoreEntry[]>([]);
    const [leaderboardTab, setLeaderboardTab] = useState<Difficulty>(DIFFICULTIES.EASY);

    // Navigation State
    const [status, setStatus] = useState<'setup' | 'menu' | 'playing' | 'multiplayer'>('setup');
    const [menuView, setMenuView] = useState<'top' | 'room_select' | 'ranking'>('top');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [multiplayerOptions, setMultiplayerOptions] = useState<any>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [resultRank, setResultRank] = useState<number | null>(null);

    // Fetch Rankings when tab changes or view is 'ranking'
    useEffect(() => {
        if (menuView === 'ranking') {
            getRankings(leaderboardTab).then(setRankings);
        }
    }, [menuView, leaderboardTab]);

    // Auth Check
    useEffect(() => {
        if (nameLoaded && playerName) {
            setStatus('menu');
        } else if (nameLoaded && !playerName) {
            setStatus('setup');
        }
    }, [nameLoaded, playerName]);

    // Timer (Single Player)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState.status === 'playing') {
            interval = setInterval(() => {
                setTime(Math.floor((Date.now() - (gameState.startTime || Date.now())) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState.status, gameState.startTime]);

    // Single Player Actions
    const handleCellClick = (r: number, c: number) => {
        if (gameState.status === 'won' || gameState.status === 'lost') return;
        if (isFlagMode) {
            setGameState(toggleFlag(gameState, r, c));
        } else {
            setGameState(revealCell(gameState, r, c));
        }
    };

    const handleCellRightClick = (e: React.MouseEvent, r: number, c: number) => {
        e.preventDefault();
        if (gameState.status === 'won' || gameState.status === 'lost') return;
        setGameState(toggleFlag(gameState, r, c));
    };

    const startSinglePlayer = () => {
        setGameState({
            board: createEmptyBoard(difficulty.rows, difficulty.cols),
            status: 'initial',
            difficulty,
            startTime: null,
            endTime: null,
            minesLeft: difficulty.mines
        });
        setTime(0);
        setStatus('playing');
    };

    // Save Score on Win
    useEffect(() => {
        if (gameState.status === 'won' && user && playerName) {
            const finalTime = Math.floor((Date.now() - (gameState.startTime || Date.now())) / 1000);
            submitScore(user.uid, playerName, difficulty, finalTime).then(async () => {
                const rank = await getUserRank(difficulty, finalTime);
                setResultRank(rank);
            });
        }
    }, [gameState.status, user, playerName, difficulty, gameState.startTime]);

    const startMultiplayerCreate = () => {
        setMultiplayerOptions({ create: true, difficulty: difficulty.name });
        setStatus('multiplayer');
    };

    const startMultiplayerJoin = () => {
        if (!joinRoomId) return;
        setMultiplayerOptions({ roomId: joinRoomId });
        setStatus('multiplayer');
    };

    const startMultiplayerRandom = () => {
        // Pass empty options to trigger joinOrCreate in wrapper
        setMultiplayerOptions({ difficulty: difficulty.name });
        setStatus('multiplayer');
    };

    // Render Setup
    if (authLoading || !user) return <div className={styles.main}>Loading...</div>;
    if (status === 'setup') {
        return (
            <main className={styles.main} style={MINESWEEPER_THEME}>
                <div className={styles.setupContainer}>
                    <h1 className={styles.title}>マインスイーパー</h1>
                    <form onSubmit={(e: any) => { e.preventDefault(); savePlayerName(e.target.playerName.value); }} className={styles.setupForm}>
                        <input name="playerName" defaultValue={playerName} placeholder="プレイヤー名" className={styles.input} required />
                        <button type="submit" className={styles.primaryBtn}>次へ</button>
                    </form>
                </div>
            </main>
        );
    }

    // Render Multiplayer Game
    if (status === 'multiplayer') {
        return (
            <>
                <HideChatBot />
                <ColyseusMinesweeperGame
                    roomId={multiplayerOptions?.roomId}
                    options={multiplayerOptions}
                    onLeave={() => { setStatus('menu'); setMultiplayerOptions(null); }}
                />
            </>
        );
    }

    // Render Menu
    if (status === 'menu') {
        return (
            <main className={styles.main} style={MINESWEEPER_THEME}>
                <FloatingShapes />

                <div className={gameStyles.header}>
                    <button
                        onClick={() => menuView === 'top' ? router.push('/') : setMenuView('top')}
                        className={gameStyles.backButton}
                    >
                        <IconBack size={18} /> 戻る
                    </button>
                    <div className={gameStyles.headerContent}>
                        <h1 className={gameStyles.title}>マインスイーパー</h1>
                        <p className={gameStyles.subtitle}>
                            {menuView === 'room_select' ? 'ルーム作成・参加' :
                                menuView === 'ranking' ? 'タイムアタックランキング' : '難易度を選択してモードを開始'}
                        </p>
                    </div>
                    {/* Ranking Button (Top Right) */}
                    {menuView !== 'ranking' && (
                        <button
                            onClick={() => setMenuView('ranking')}
                            className={gameStyles.backButton}
                            style={{ color: '#d97706', borderColor: '#fcd34d', background: '#fffbeb' }}
                        >
                            <IconTrophy size={18} /> ランキング
                        </button>
                    )}
                </div>

                <div className={styles.gameContainer}>
                    {menuView === 'ranking' && (
                        <div className={gameStyles.rankingContainer}>
                            <div className={gameStyles.leaderboardTabs}>
                                {Object.values(DIFFICULTIES).map((diff) => (
                                    <button
                                        key={diff.name}
                                        className={`${gameStyles.leaderboardTab} ${leaderboardTab.name === diff.name ? gameStyles.active : ''}`}
                                        onClick={() => setLeaderboardTab(diff)}
                                    >
                                        {diff.name}
                                    </button>
                                ))}
                            </div>

                            <div className={gameStyles.leaderboardList}>
                                {rankings.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📉</div>
                                        データがありません
                                    </div>
                                ) : (
                                    rankings.map((entry, index) => (
                                        <div key={entry.id} className={`${gameStyles.rankingItem} ${index === 0 ? gameStyles.top1 : index === 1 ? gameStyles.top2 : index === 2 ? gameStyles.top3 : ''}`}>
                                            <div className={gameStyles.rankIcon}>
                                                {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                            </div>
                                            <div className={gameStyles.rankName}>{entry.userName}</div>
                                            <div className={gameStyles.rankTime}>{entry.time}秒</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', width: '80px', textAlign: 'right' }}>
                                                {new Date(entry.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {menuView === 'top' && (
                        <>
                            <h2 className={styles.subtitle} style={{ marginTop: '0', marginBottom: '1.5rem' }}>難易度選択</h2>
                            <div className={gameStyles.difficultySelector}>
                                {Object.values(DIFFICULTIES).map((diff) => (
                                    <button
                                        key={diff.name}
                                        className={`${gameStyles.difficultyOption} ${difficulty.name === diff.name ? gameStyles.active : ''}`}
                                        onClick={() => setDifficulty(diff)}
                                    >
                                        {diff.name}
                                    </button>
                                ))}
                            </div>

                            <div className={gameStyles.modeSelection}>
                                <button onClick={startSinglePlayer} className={gameStyles.modeBtn}>
                                    <div className={gameStyles.modeBtnIcon}>
                                        <IconUser size={48} />
                                    </div>
                                    <span className={gameStyles.modeBtnTitle}>シングルプレイ</span>
                                    <span className={gameStyles.modeBtnDesc}>ランキング対応</span>
                                </button>

                                <button onClick={startMultiplayerRandom} className={gameStyles.modeBtn}>
                                    <div className={gameStyles.modeBtnIcon}>
                                        <IconDice size={48} />
                                    </div>
                                    <span className={gameStyles.modeBtnTitle}>ランダム対戦</span>
                                    <span className={gameStyles.modeBtnDesc}>早解き勝負</span>
                                </button>

                                <button onClick={() => setMenuView('room_select')} className={gameStyles.modeBtn}>
                                    <div className={gameStyles.modeBtnIcon}>
                                        <IconKey size={48} />
                                    </div>
                                    <span className={gameStyles.modeBtnTitle}>ルーム対戦</span>
                                    <span className={gameStyles.modeBtnDesc}>友達と対戦</span>
                                </button>
                            </div>
                        </>
                    )}

                    {menuView === 'room_select' && (
                        <div className={styles.joinSection}>
                            <h2 className={styles.sectionTitle} style={{ marginBottom: '0.5rem' }}>ルームに参加・作成</h2>
                            <p className={styles.joinDesc} style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                選択中の難易度: <strong>{difficulty.name}</strong>
                            </p>

                            <div style={{ width: '100%', marginBottom: '1.5rem' }}>
                                <p className={styles.joinDesc} style={{ textAlign: 'left', fontSize: '0.9rem', marginBottom: '0.5rem' }}>IDを入力して参加</p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="ルームID"
                                        value={joinRoomId}
                                        onChange={(e) => setJoinRoomId(e.target.value)}
                                        className={styles.input}
                                    />
                                    <button
                                        className={styles.primaryBtn}
                                        style={{ width: 'auto' }}
                                        onClick={startMultiplayerJoin}
                                    >
                                        参加
                                    </button>
                                </div>
                            </div>

                            <div style={{ width: '100%', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                                <p className={styles.joinDesc} style={{ marginBottom: '0.5rem' }}>または新しく作成</p>
                                <button className={styles.primaryBtn} onClick={startMultiplayerCreate}>
                                    この難易度で部屋を作成
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Game Rules Section */}
                    {menuView === 'top' && (
                        <div className={styles.contentSection} style={{ marginTop: '3rem' }}>
                            <h2 className={styles.contentTitle}>マインスイーパーのルール</h2>
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <span className={styles.sectionIcon}>💣</span>
                                    <h3 className={styles.sectionTitle}>基本操作</h3>
                                </div>
                                <p className={styles.textBlock}>
                                    地雷原から全ての地雷を見つけ出し、地雷以外のマスを全て開けるパズルゲームです。
                                </p>
                                <ul className={styles.list}>
                                    <li className={styles.listItem}><strong>左クリック:</strong> マスを開けます。地雷を開けてしまうと即ゲームオーバーです。</li>
                                    <li className={styles.listItem}><strong>右クリック (または旗ボタン):</strong> 地雷だと思うマスに「旗（フラグ）」を立てて目印にします。</li>
                                    <li className={styles.listItem}><strong>数字の意味:</strong> 開いた数字は、その周囲8マス（縦・横・斜め）に隠されている地雷の数を示しています。</li>
                                </ul>
                            </div>

                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <span className={styles.sectionIcon}>🧩</span>
                                    <h3 className={styles.sectionTitle}>攻略の基本パターン</h3>
                                </div>
                                <div className={styles.cardGrid}>
                                    <div className={styles.infoCard}>
                                        <span className={styles.cardTitle}>角の「1」</span>
                                        <p className={styles.cardText}>
                                            突き出した角にある「1」の対角線のマスは、必ず地雷です。<br />
                                            （1の周りに未開封マスが1つしかなければ、それは確定で地雷です）
                                        </p>
                                    </div>
                                    <div className={styles.infoCard}>
                                        <span className={styles.cardTitle}>直線上の「1-2-1」</span>
                                        <p className={styles.cardText}>
                                            壁沿いに「1・2・1」と並んでいる場合、両端の1の脇にある未開封マスに地雷があります。真ん中の2の脇は安全です。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        );
    }

    // Render Single Player Game
    return (
        <main className={styles.main} style={MINESWEEPER_THEME}>
            <HideChatBot />
            <div className={styles.header}>
                <button onClick={() => setStatus('menu')} className={styles.backButton}><IconBack size={18} /> 戻る</button>
            </div>
            <div className={styles.gameContainer}>
                <div className={gameStyles.statusBar}>
                    <div className={gameStyles.statusItem}>💣 {gameState.minesLeft}</div>
                    <div className={gameStyles.statusItem}>⏱️ {time}</div>
                    <button className={`${gameStyles.flagToggleBtn} ${isFlagMode ? gameStyles.active : ''}`} onClick={() => setIsFlagMode(!isFlagMode)}>
                        <IconFlag size={24} />
                    </button>
                </div>
                <div className={gameStyles.boardWrapper}>
                    <MinesweeperBoard
                        board={gameState.board}
                        onCellClick={handleCellClick}
                        onCellRightClick={handleCellRightClick}
                    />
                </div>

                {(gameState.status === 'won' || gameState.status === 'lost') && (
                    <div className={gameStyles.modalOverlay}>
                        <div className={gameStyles.modal}>
                            <h2>{gameState.status === 'won' ? 'CLEAR! 🎉' : 'GAME OVER 💣'}</h2>
                            {gameState.status === 'won' && <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>タイム: {time}秒</p>}

                            {gameState.status === 'won' && (
                                <button
                                    onClick={() => setShowShareModal(true)}
                                    className={styles.secondaryBtn}
                                    style={{ background: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}
                                >
                                    <IconXLogo size={16} color="white" /> 結果をシェア
                                </button>
                            )}

                            <button onClick={startSinglePlayer} className={styles.primaryBtn}>もう一度</button>
                            <button onClick={() => setStatus('menu')} className={styles.secondaryBtn}>メニューへ</button>
                        </div>
                    </div>
                )}

                {showShareModal && (
                    <MinesweeperShareModal
                        time={time}
                        difficulty={difficulty.name}
                        rank={resultRank} // Can be null if not loaded yet or not won
                        onClose={() => setShowShareModal(false)}
                    />
                )}
            </div>
        </main>
    );
}
