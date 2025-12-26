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
import { submitScore, getRankings, ScoreEntry } from '@/lib/minesweeper/ranking';
import { usePlayer } from '@/hooks/usePlayer';
import { ColyseusMinesweeperGame } from './ColyseusMinesweeperGame';

export default function MinesweeperPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { playerName, savePlayerName, isLoaded: nameLoaded } = usePlayer();

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

    // Navigation State
    const [status, setStatus] = useState<'setup' | 'menu' | 'playing' | 'multiplayer'>('setup');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [multiplayerOptions, setMultiplayerOptions] = useState<any>(null);

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
    if (status === 'setup') {
        return (
            <main className={styles.main}>
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
            <ColyseusMinesweeperGame
                roomId={multiplayerOptions?.roomId}
                options={multiplayerOptions}
                onLeave={() => { setStatus('menu'); setMultiplayerOptions(null); }}
                myPlayerId={(user?.uid || 'guest') + '-' + Math.floor(Math.random() * 10000)}
                myPlayerName={playerName}
            />
        );
    }

    // Render Menu
    if (status === 'menu') {
        return (
            <main className={styles.main}>
                <div className={styles.header}>
                    <button onClick={() => router.push('/')} className={styles.backButton}><IconBack size={18} /> 戻る</button>
                </div>
                <div className={styles.gameContainer}>
                    <h1 className={styles.title}>マインスイーパー</h1>

                    <h2 className={styles.subtitle} style={{ marginTop: '1rem' }}>難易度選択</h2>
                    <div className={gameStyles.controls} style={{ justifyContent: 'center' }}>
                        {Object.values(DIFFICULTIES).map((diff) => (
                            <button
                                key={diff.name}
                                className={`${gameStyles.difficultyBtn} ${difficulty.name === diff.name ? gameStyles.active : ''}`}
                                onClick={() => setDifficulty(diff)}
                            >
                                {diff.name}
                            </button>
                        ))}
                    </div>

                    <div className={styles.modeSelection}>
                        <button onClick={startSinglePlayer} className={styles.modeBtn}>
                            <IconUser size={48} color="#2e7d32" /><span className={styles.modeBtnTitle}>シングルプレイ</span>
                            <span className={styles.modeBtnDesc}>ランキング対応</span>
                        </button>

                        <button onClick={startMultiplayerRandom} className={styles.modeBtn}>
                            <IconDice size={48} color="#d97706" /><span className={styles.modeBtnTitle}>ランダム対戦</span>
                            <span className={styles.modeBtnDesc}>早解き勝負</span>
                        </button>

                        <div className={styles.joinSection}>
                            <h3 className={styles.joinDesc}>ルーム対戦</h3>
                            <input
                                type="text"
                                value={joinRoomId}
                                onChange={e => setJoinRoomId(e.target.value)}
                                placeholder="ルームID"
                                className={styles.input}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button onClick={startMultiplayerJoin} className={styles.primaryBtn} style={{ flex: 1 }}>参加</button>
                                <button onClick={startMultiplayerCreate} className={styles.secondaryBtn} style={{ flex: 1 }}>作成</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Render Single Player Game
    return (
        <main className={styles.main}>
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
                            <button onClick={startSinglePlayer} className={styles.primaryBtn}>もう一度</button>
                            <button onClick={() => setStatus('menu')} className={styles.secondaryBtn}>メニューへ</button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
