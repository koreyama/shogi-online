'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/GameMenu.module.css';
import sudokuStyles from '@/components/sudoku/Sudoku.module.css';
import { SudokuBoard } from '@/components/sudoku/SudokuBoard';
import { NumberPad } from '@/components/sudoku/NumberPad';
import { createGameState, placeNumber, toggleNote } from '@/lib/sudoku/engine';
import { DIFFICULTIES, Difficulty, GameState } from '@/lib/sudoku/types';
import { IconBack, IconUser } from '@/components/Icons';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import HideChatBot from '@/components/HideChatBot';
import { FloatingShapes } from '@/components/landing/FloatingShapes';

const SUDOKU_THEME = {
    '--theme-primary': '#3b82f6',
    '--theme-secondary': '#2563eb',
    '--theme-tertiary': '#60a5fa',
    '--theme-bg-light': '#eff6ff',
    '--theme-text-title': 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)',
} as React.CSSProperties;

export default function SudokuPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName, savePlayerName, isLoaded: nameLoaded } = usePlayer();

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    // Game State
    const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES.EASY);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [time, setTime] = useState(0);
    const [isNotesMode, setIsNotesMode] = useState(false);

    // Navigation State
    const [status, setStatus] = useState<'setup' | 'menu' | 'playing'>('setup');

    // Check if name is loaded
    useEffect(() => {
        if (nameLoaded && playerName) {
            setStatus('menu');
        } else if (nameLoaded && !playerName) {
            setStatus('setup');
        }
    }, [nameLoaded, playerName]);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState?.status === 'playing' && gameState.startTime) {
            interval = setInterval(() => {
                setTime(Math.floor((Date.now() - gameState.startTime!) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState?.status, gameState?.startTime]);

    // Start game
    const startGame = useCallback(() => {
        setGameState(createGameState(difficulty));
        setTime(0);
        setIsNotesMode(false);
        setStatus('playing');
    }, [difficulty]);

    // Cell click
    const handleCellClick = (row: number, col: number) => {
        if (!gameState || gameState.status === 'won') return;
        setGameState({
            ...gameState,
            selectedCell: { row, col },
        });
    };

    // Number input
    const handleNumberClick = (num: number) => {
        if (!gameState || !gameState.selectedCell || gameState.status === 'won') return;
        const { row, col } = gameState.selectedCell;

        if (isNotesMode) {
            setGameState(toggleNote(gameState, row, col, num));
        } else {
            setGameState(placeNumber(gameState, row, col, num));
        }
    };

    // Clear cell
    const handleClear = () => {
        if (!gameState || !gameState.selectedCell || gameState.status === 'won') return;
        const { row, col } = gameState.selectedCell;
        setGameState(placeNumber(gameState, row, col, 0));
    };

    // Keyboard input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!gameState || !gameState.selectedCell || gameState.status === 'won') return;
            const { row, col } = gameState.selectedCell;

            const num = parseInt(e.key);
            if (num >= 1 && num <= 9) {
                if (isNotesMode) {
                    setGameState(toggleNote(gameState, row, col, num));
                } else {
                    setGameState(placeNumber(gameState, row, col, num));
                }
            } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                setGameState(placeNumber(gameState, row, col, 0));
            } else if (e.key === 'ArrowUp' && row > 0) {
                setGameState({ ...gameState, selectedCell: { row: row - 1, col } });
            } else if (e.key === 'ArrowDown' && row < 8) {
                setGameState({ ...gameState, selectedCell: { row: row + 1, col } });
            } else if (e.key === 'ArrowLeft' && col > 0) {
                setGameState({ ...gameState, selectedCell: { row, col: col - 1 } });
            } else if (e.key === 'ArrowRight' && col < 8) {
                setGameState({ ...gameState, selectedCell: { row, col: col + 1 } });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, isNotesMode]);

    // Calculate completed numbers
    const getCompletedNumbers = (): Set<number> => {
        if (!gameState) return new Set();
        const counts: Record<number, number> = {};
        for (const row of gameState.board) {
            for (const cell of row) {
                if (cell.value !== 0) {
                    counts[cell.value] = (counts[cell.value] || 0) + 1;
                }
            }
        }
        const completed = new Set<number>();
        for (let n = 1; n <= 9; n++) {
            if (counts[n] === 9) completed.add(n);
        }
        return completed;
    };

    // Format time
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Render
    if (authLoading || !user) return <div className={styles.main}>Loading...</div>;

    // Setup
    if (status === 'setup') {
        return (
            <main className={styles.main} style={SUDOKU_THEME}>
                <div className={styles.setupContainer}>
                    <h1 className={styles.title}>数独</h1>
                    <form onSubmit={(e: any) => { e.preventDefault(); savePlayerName(e.target.playerName.value); }} className={styles.setupForm}>
                        <input name="playerName" defaultValue={playerName} placeholder="プレイヤー名" className={styles.input} required />
                        <button type="submit" className={styles.primaryBtn}>次へ</button>
                    </form>
                </div>
            </main>
        );
    }

    // Menu
    if (status === 'menu') {
        return (
            <main className={styles.main} style={SUDOKU_THEME}>
                <FloatingShapes />

                <div className={sudokuStyles.header}>
                    <button onClick={() => router.push('/')} className={sudokuStyles.backButton}>
                        <IconBack size={18} /> 戻る
                    </button>
                    <div className={sudokuStyles.headerContent}>
                        <h1 className={sudokuStyles.title}>数独</h1>
                        <p className={sudokuStyles.subtitle}>難易度を選択してゲームを開始</p>
                    </div>
                    <div style={{ width: '80px' }} /> {/* Spacer */}
                </div>

                <div className={styles.gameContainer}>
                    <h2 className={styles.subtitle} style={{ marginTop: '0', marginBottom: '1.5rem' }}>難易度選択</h2>
                    <div className={sudokuStyles.difficultySelector}>
                        {Object.values(DIFFICULTIES).map((diff) => (
                            <button
                                key={diff.name}
                                className={`${sudokuStyles.difficultyOption} ${difficulty.name === diff.name ? sudokuStyles.active : ''}`}
                                onClick={() => setDifficulty(diff)}
                            >
                                {diff.name}
                            </button>
                        ))}
                    </div>

                    <div className={sudokuStyles.modeSelection}>
                        <button onClick={startGame} className={sudokuStyles.modeBtn}>
                            <div className={sudokuStyles.modeBtnIcon}>
                                <IconUser size={48} />
                            </div>
                            <span className={sudokuStyles.modeBtnTitle}>ゲームスタート</span>
                            <span className={sudokuStyles.modeBtnDesc}>ヒント{difficulty.clues}マス</span>
                        </button>
                    </div>

                    {/* Rules */}
                    <div className={sudokuStyles.rulesSection}>
                        <h2 className={sudokuStyles.rulesTitle}>数独のルール</h2>
                        <ul className={sudokuStyles.rulesList}>
                            <li className={sudokuStyles.ruleItem}>
                                <span className={sudokuStyles.ruleIcon}>🔢</span>
                                <span className={sudokuStyles.ruleText}>空いているマスに1～9の数字を入れます</span>
                            </li>
                            <li className={sudokuStyles.ruleItem}>
                                <span className={sudokuStyles.ruleIcon}>↔️</span>
                                <span className={sudokuStyles.ruleText}>各行（横一列）に1～9が1つずつ入ります</span>
                            </li>
                            <li className={sudokuStyles.ruleItem}>
                                <span className={sudokuStyles.ruleIcon}>↕️</span>
                                <span className={sudokuStyles.ruleText}>各列（縦一列）に1～9が1つずつ入ります</span>
                            </li>
                            <li className={sudokuStyles.ruleItem}>
                                <span className={sudokuStyles.ruleIcon}>⬛</span>
                                <span className={sudokuStyles.ruleText}>3×3のブロック内にも1～9が1つずつ入ります</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        );
    }

    // Playing
    return (
        <main className={styles.main} style={SUDOKU_THEME}>
            <HideChatBot />

            <div className={sudokuStyles.header}>
                <button onClick={() => setStatus('menu')} className={sudokuStyles.backButton}>
                    <IconBack size={18} /> 戻る
                </button>
                <div className={sudokuStyles.headerContent}>
                    <h1 className={sudokuStyles.title}>数独</h1>
                    <p className={sudokuStyles.subtitle}>{gameState?.difficulty.name}</p>
                </div>
                <div style={{ width: '80px' }} />
            </div>

            <div className={sudokuStyles.gameContainer}>
                {/* Status Bar */}
                <div className={sudokuStyles.statusBar}>
                    <div className={sudokuStyles.statusItem}>⏱️ {formatTime(time)}</div>
                </div>

                {/* Game Board */}
                {gameState && (
                    <>
                        <SudokuBoard
                            board={gameState.board}
                            selectedCell={gameState.selectedCell}
                            onCellClick={handleCellClick}
                        />

                        <NumberPad
                            onNumberClick={handleNumberClick}
                            onClear={handleClear}
                            onToggleNotes={() => setIsNotesMode(!isNotesMode)}
                            isNotesMode={isNotesMode}
                            disabledNumbers={getCompletedNumbers()}
                        />
                    </>
                )}

                {/* Win Modal */}
                {gameState?.status === 'won' && (
                    <div className={sudokuStyles.modalOverlay}>
                        <div className={sudokuStyles.modal}>
                            <h2>🎉 クリア！</h2>
                            <p>タイム: {formatTime(time)}</p>
                            <button onClick={startGame}>もう一度</button>
                            <button onClick={() => setStatus('menu')}>メニューへ</button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
