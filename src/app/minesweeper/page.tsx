'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { MinesweeperBoard } from '@/components/MinesweeperBoard';
import { createEmptyBoard, revealCell, toggleFlag, initializeBoard } from '@/lib/minesweeper/engine';
import { GameState, DIFFICULTIES, Difficulty } from '@/lib/minesweeper/types';
import { IconBack, IconHourglass, IconFlag, IconTrophy } from '@/components/Icons';
import { useAuth } from '@/hooks/useAuth';
import { submitScore, getRankings, ScoreEntry } from '@/lib/minesweeper/ranking';

export default function MinesweeperPage() {
    const router = useRouter();
    const { user } = useAuth();
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

    useEffect(() => {
        resetGame(difficulty);
    }, []);

    useEffect(() => {
        fetchRankings(difficulty);
    }, [difficulty]);

    const fetchRankings = async (diff: Difficulty) => {
        const data = await getRankings(diff);
        setRankings(data);
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState.status === 'playing') {
            interval = setInterval(() => {
                setTime(Math.floor((Date.now() - (gameState.startTime || Date.now())) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState.status, gameState.startTime]);

    useEffect(() => {
        if (gameState.status === 'won' && user) {
            submitScore(user.uid, user.displayName || 'Anonymous', difficulty, time).then(() => {
                fetchRankings(difficulty);
            });
        }
    }, [gameState.status]);

    const resetGame = (diff: Difficulty) => {
        setDifficulty(diff);
        setGameState({
            board: createEmptyBoard(diff.rows, diff.cols),
            status: 'initial',
            difficulty: diff,
            startTime: null,
            endTime: null,
            minesLeft: diff.mines
        });
        setTime(0);
        setIsFlagMode(false);
    };

    const handleCellClick = (r: number, c: number) => {
        if (gameState.status === 'won' || gameState.status === 'lost') return;

        if (isFlagMode) {
            const newState = toggleFlag(gameState, r, c);
            setGameState(newState);
        } else {
            const newState = revealCell(gameState, r, c);
            setGameState(newState);
        }
    };

    const handleCellRightClick = (e: React.MouseEvent, r: number, c: number) => {
        e.preventDefault();
        if (gameState.status === 'won' || gameState.status === 'lost') return;
        const newState = toggleFlag(gameState, r, c);
        setGameState(newState);
    };

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <button onClick={() => router.push('/')} className={styles.backButton}>
                    <IconBack size={18} /> 戻る
                </button>
            </div>

            <div className={styles.gameContainer}>
                <h1 className={styles.title}>マインスイーパー</h1>

                <div className={styles.controls}>
                    {Object.values(DIFFICULTIES).map((diff) => (
                        <button
                            key={diff.name}
                            className={`${styles.difficultyBtn} ${difficulty.name === diff.name ? styles.active : ''}`}
                            onClick={() => resetGame(diff)}
                        >
                            {diff.name}
                        </button>
                    ))}
                </div>

                <div className={styles.statusBar}>
                    <div className={styles.statusItem}>
                        <span>💣</span> {gameState.minesLeft}
                    </div>
                    <div className={styles.statusItem}>
                        <span>⏱️</span> {time}
                    </div>
                    <button
                        className={`${styles.flagToggleBtn} ${isFlagMode ? styles.active : ''}`}
                        onClick={() => setIsFlagMode(!isFlagMode)}
                        title="フラグモード切替"
                    >
                        <IconFlag size={24} />
                    </button>
                </div>

                <div className={styles.boardWrapper}>
                    <MinesweeperBoard
                        board={gameState.board}
                        onCellClick={handleCellClick}
                        onCellRightClick={handleCellRightClick}
                    />
                </div>

                {/* Ranking Section */}
                <div className={styles.rankingSection}>
                    <div className={styles.rankingHeader}>
                        <IconTrophy size={24} color="#d69e2e" />
                        <h3>ランキング ({difficulty.name})</h3>
                    </div>
                    {rankings.length > 0 ? (
                        <div className={styles.rankingList}>
                            {rankings.map((entry, index) => (
                                <div key={entry.id} className={styles.rankingItem}>
                                    <span className={styles.rank}>#{index + 1}</span>
                                    <span className={styles.userName}>{entry.userName}</span>
                                    <span className={styles.scoreTime}>{entry.time}秒</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={styles.noRanking}>まだ記録がありません</p>
                    )}
                    {!user && (
                        <p className={styles.loginHint}>ログインするとランキングに参加できます</p>
                    )}
                </div>
            </div>

            {(gameState.status === 'won' || gameState.status === 'lost') && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>{gameState.status === 'won' ? 'クリア！🎉' : 'ゲームオーバー...'}</h2>
                        <p>タイム: {time}秒</p>
                        {gameState.status === 'won' && user && <p className={styles.saveMsg}>ランキングに登録されました！</p>}
                        <button onClick={() => resetGame(difficulty)} className={styles.primaryBtn}>
                            もう一度遊ぶ
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.contentSection}>
                <h2 className={styles.contentTitle}>マインスイーパーの遊び方</h2>
                <div className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionIcon}>🚩</span>
                        <h3 className={styles.sectionTitle}>ルール説明</h3>
                    </div>
                    <p className={styles.textBlock}>
                        マインスイーパーは、地雷原から地雷を踏まずに全ての安全なマスを開けるパズルゲームです。<br />
                        マスをクリックして開け、数字をヒントに地雷の場所を特定します。<br />
                        数字は「そのマスの周囲8マスにある地雷の数」を表しています。<br />
                        地雷があると思う場所には右クリック、またはフラグモードで旗を立てることができます。
                    </p>
                </div>
            </div>
        </main>
    );
}
