'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/GameMenu.module.css'; // Use Shared Styles
import gameStyles from './page.module.css'; // Keep game-specific styles
import { MinesweeperBoard } from '@/components/MinesweeperBoard';
import { createEmptyBoard, revealCell, toggleFlag } from '@/lib/minesweeper/engine';
import { GameState, DIFFICULTIES, Difficulty } from '@/lib/minesweeper/types';
import { IconBack, IconHourglass, IconFlag, IconTrophy, IconDice, IconKey, IconUser } from '@/components/Icons';
import { useAuth } from '@/hooks/useAuth';
import { submitScore, getRankings, ScoreEntry } from '@/lib/minesweeper/ranking';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue, update, get, onChildAdded, onDisconnect, off } from 'firebase/database';
import { usePlayer } from '@/hooks/usePlayer';

export default function MinesweeperPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { playerName, savePlayerName, isLoaded: nameLoaded } = usePlayer();

    // Game State
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

    // Single Player Ranking
    const [rankings, setRankings] = useState<ScoreEntry[]>([]);

    // Multiplayer State
    const [status, setStatus] = useState<'setup' | 'menu' | 'waiting' | 'playing' | 'result'>('setup');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<'P1' | 'P2' | null>(null);
    const [joinMode, setJoinMode] = useState<'random' | 'room' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');
    const [opponentName, setOpponentName] = useState('');
    const [opponentProgress, setOpponentProgress] = useState(0); // 0 to 100%
    const [opponentStatus, setOpponentStatus] = useState<'playing' | 'won' | 'lost' | null>(null);
    const [gameSeed, setGameSeed] = useState<number | undefined>(undefined);
    const [winner, setWinner] = useState<'P1' | 'P2' | 'Draw' | null>(null);

    // Calc playerId helper
    const [playerId] = useState(() => Math.random().toString(36).substring(2, 15));

    useEffect(() => {
        if (nameLoaded && playerName) {
            setStatus('menu');
        } else if (nameLoaded && !playerName) {
            setStatus('setup');
        }
    }, [nameLoaded, playerName]);

    // Fetch Rankings (Single Player)
    useEffect(() => {
        if (!roomId) {
            fetchRankings(difficulty);
        }
    }, [difficulty, roomId]);

    const fetchRankings = async (diff: Difficulty) => {
        const data = await getRankings(diff);
        setRankings(data);
    };

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState.status === 'playing') {
            interval = setInterval(() => {
                setTime(Math.floor((Date.now() - (gameState.startTime || Date.now())) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState.status, gameState.startTime]);

    // Firebase: Listen to Room
    useEffect(() => {
        if (!roomId || !myRole) return;

        const roomRef = ref(db, `minesweeper_rooms/${roomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            // Opponent Info
            const oppRole = myRole === 'P1' ? 'P2' : 'P1';
            const oppData = data[oppRole];
            if (oppData) {
                setOpponentName(oppData.name);
                setOpponentProgress(oppData.progress || 0);
                setOpponentStatus(oppData.status || 'playing');

                // If opponent lost, I win!
                if (oppData.status === 'lost' && !data.winner && gameState.status === 'playing') {
                    // Update winner in DB
                    checkAndSetWinner(roomId, myRole);
                }
            }

            // Sync Game Start
            if (data.P1 && data.P2 && data.seed && status === 'waiting') {
                startGameMultiplayer(data.seed, data.difficulty);
            }

            // Sync Winner
            if (data.winner) {
                setWinner(data.winner);
                setStatus('result');
            }
        });

        const myRef = ref(db, `minesweeper_rooms/${roomId}/${myRole}`);
        onDisconnect(myRef).remove();

        return () => {
            unsubscribe();
            onDisconnect(myRef).cancel();
        };
    }, [roomId, myRole, status, gameState.status]);

    // Send Progress
    useEffect(() => {
        if (roomId && myRole && gameState.status === 'playing') {
            // Calc progress
            let safeRevealed = 0;
            let totalSafe = (gameState.difficulty.rows * gameState.difficulty.cols) - gameState.difficulty.mines;
            gameState.board.forEach(r => r.forEach(c => {
                if (!c.isMine && c.isRevealed) safeRevealed++;
            }));
            const progress = Math.min(100, Math.floor((safeRevealed / totalSafe) * 100));

            update(ref(db, `minesweeper_rooms/${roomId}/${myRole}`), {
                progress: progress,
                status: 'playing'
            });
        }

        // Send Completion
        if (roomId && myRole && (gameState.status === 'won' || gameState.status === 'lost')) {
            update(ref(db, `minesweeper_rooms/${roomId}/${myRole}`), {
                status: gameState.status // 'won' or 'lost'
            });

            if (gameState.status === 'won') {
                // Claim Victory if no winner yet
                // Use a transaction or just simple set if fast enough? 
                // Simple set: First to set winner field wins.
                // We check existing winner in snapshot usually, but here:
                update(ref(db, `minesweeper_rooms/${roomId}`), {
                    // We don't overwrite winner if exists, strict check usually needed but basic impl:
                });

                // Better: check winner in `onValue`. 
                // But we should try to set it.
                // We'll trust the separate effect or simple race.
                // Actually, let's just push "finished" time?
                // Simplest: Set winner = myRole if winner is null.
                checkAndSetWinner(roomId, myRole);
            }
        }
    }, [gameState, roomId, myRole]);

    // Single Player Score Submit
    useEffect(() => {
        if (!roomId && gameState.status === 'won' && user) {
            submitScore(user.uid, user.displayName || 'Anonymous', difficulty, time).then(() => {
                fetchRankings(difficulty);
            });
        }
    }, [gameState.status, roomId]);


    const checkAndSetWinner = async (rid: string, role: string) => {
        const rRef = ref(db, `minesweeper_rooms/${rid}`);
        const snap = await get(rRef);
        if (snap.exists() && !snap.val().winner) {
            update(rRef, { winner: role });
        }
    };

    // Actions
    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const name = (e.target as any).playerName.value;
        if (name) {
            savePlayerName(name);
            setStatus('menu');
        }
    };

    const startGameSingle = (diff: Difficulty) => {
        setRoomId(null);
        setGameSeed(undefined);
        resetGame(diff, undefined);
        setStatus('playing');
    };

    const startGameMultiplayer = (seed: number, diffKey: string) => {
        // Find difficulty object
        const diff = Object.values(DIFFICULTIES).find(d => d.name === diffKey) || DIFFICULTIES.EASY;
        setGameSeed(seed);
        setDifficulty(diff);
        resetGame(diff, seed);
        setStatus('playing');
    };

    const resetGame = (diff: Difficulty, seed?: number) => {
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

    const joinRandomGame = async () => {
        setJoinMode('random');
        // Simple logic: Look for room with 1 player
        const roomsRef = ref(db, 'minesweeper_rooms');
        const snap = await get(roomsRef);
        const rooms = snap.val();
        let found = null;

        if (rooms) {
            for (const [rid, r] of Object.entries(rooms) as [string, any][]) {
                if (r.state === 'waiting' && ((r.P1 && !r.P2) || (!r.P1 && r.P2))) {
                    found = rid;
                    break;
                }
            }
        }

        if (found) {
            const role = rooms[found].P1 ? 'P2' : 'P1';
            await update(ref(db, `minesweeper_rooms/${found}/${role}`), { name: playerName, status: 'waiting' });
            // Start Trigger is in listener
            setRoomId(found);
            setMyRole(role);
            setStatus('waiting');
        } else {
            // Create
            const newRef = push(roomsRef);
            const seed = Math.floor(Math.random() * 100000);
            await set(newRef, {
                P1: { name: playerName, status: 'waiting' },
                seed: seed,
                difficulty: 'EASY', // Default VS difficulty? Or selectable? Let's force EASY/NORMAL for now or use current `difficulty`. 
                // User didn't specify, let's use selected difficulty or default. 
                // Let's use current `difficulty.name`
                state: 'waiting'
            });
            // BUT wait, difficulty needs to be synced.
            await update(newRef, { difficulty: difficulty.name });

            setRoomId(newRef.key);
            setMyRole('P1');
            setStatus('waiting');
        }
    };

    const joinRoomGame = async () => {
        if (!customRoomId.trim()) return;
        const rid = customRoomId.trim();
        const roomRef = ref(db, `minesweeper_rooms/${rid}`);
        const snapshot = await get(roomRef);
        const room = snapshot.val();

        if (!room) {
            // Create new room
            const seed = Math.floor(Math.random() * 100000);
            await set(roomRef, {
                P1: { name: playerName, status: 'waiting' },
                seed: seed,
                difficulty: difficulty.name,
                state: 'waiting'
            });
            setRoomId(rid);
            setMyRole('P1');
            setStatus('waiting');
        } else if (!room.P2) {
            // Join existing room
            if (room.state !== 'waiting') {
                alert('このルームは既にゲーム中です');
                return;
            }
            await update(ref(db, `minesweeper_rooms/${rid}/P2`), { name: playerName, status: 'waiting' });
            setRoomId(rid);
            setMyRole('P2');
            setStatus('waiting');
        } else {
            alert('満員です');
        }
    };

    // Cell Click
    const handleCellClick = (r: number, c: number) => {
        if (gameState.status === 'won' || gameState.status === 'lost') return;
        // In Result mode (Multiplayer), block?
        if (winner) return;

        if (isFlagMode) {
            const newState = toggleFlag(gameState, r, c);
            setGameState(newState);
        } else {
            const newState = revealCell(gameState, r, c, gameSeed);
            setGameState(newState);
        }
    };

    const handleCellRightClick = (e: React.MouseEvent, r: number, c: number) => {
        e.preventDefault();
        if (gameState.status === 'won' || gameState.status === 'lost') return;
        if (winner) return;
        const newState = toggleFlag(gameState, r, c);
        setGameState(newState);
    };

    // Render Helpers
    const renderMenu = () => (
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

                {!joinMode ? (
                    <div className={styles.modeSelection}>
                        <button onClick={() => startGameSingle(difficulty)} className={styles.modeBtn}>
                            <IconUser size={48} color="#2e7d32" /><span className={styles.modeBtnTitle}>シングルプレイ</span>
                            <span className={styles.modeBtnDesc}>ランキング対応</span>
                        </button>
                        <button onClick={joinRandomGame} className={styles.modeBtn}>
                            <IconDice size={48} color="#d97706" /><span className={styles.modeBtnTitle}>ランダム対戦</span>
                            <span className={styles.modeBtnDesc}>早解き勝負</span>
                        </button>
                        <button onClick={() => setJoinMode('room')} className={styles.modeBtn}>
                            <IconKey size={48} color="#3182ce" /><span className={styles.modeBtnTitle}>ルーム対戦</span>
                            <span className={styles.modeBtnDesc}>友達と対戦</span>
                        </button>
                    </div>
                ) : joinMode === 'room' ? (
                    <div className={styles.joinSection}>
                        <h3 className={styles.joinDesc}>ルームIDを入力</h3>
                        <input
                            type="text"
                            value={customRoomId}
                            onChange={e => setCustomRoomId(e.target.value)}
                            placeholder="ルームID (例: 1234)"
                            className={styles.input}
                        />
                        <button onClick={joinRoomGame} className={styles.primaryBtn} style={{ marginTop: '1rem', width: '100%' }}>参加 / 作成</button>
                        <button onClick={() => setJoinMode(null)} className={styles.secondaryBtn} style={{ marginTop: '0.5rem', width: '100%' }}>戻る</button>
                        <p className={styles.joinDesc} style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                            ※ IDが存在しない場合は新規作成されます。<br />
                            ※ 難易度はホスト（作成者）の設定が適用されます。
                        </p>
                    </div>
                ) : (
                    // Random waiting state handled by status='waiting' usually, but if we stay in menu:
                    <div className={styles.joinSection}>
                        <p>マッチング中...</p>
                    </div>
                )}

                {/* Ranking */}
                <div className={gameStyles.rankingSection}>
                    <div className={gameStyles.rankingHeader}>
                        <IconTrophy size={24} color="#d69e2e" />
                        <h3>ランキング ({difficulty.name})</h3>
                    </div>
                    {rankings.length > 0 ? (
                        <div className={gameStyles.rankingList}>
                            {rankings.map((entry, index) => (
                                <div key={entry.id} className={gameStyles.rankingItem}>
                                    <span className={gameStyles.rank}>#{index + 1}</span>
                                    <span className={gameStyles.userName}>{entry.userName}</span>
                                    <span className={gameStyles.scoreTime}>{entry.time}秒</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={gameStyles.noRanking}>まだ記録がありません</p>
                    )}
                </div>

                {/* Rules */}
                <div className={styles.contentSection}>
                    <h2 className={styles.contentTitle}>マインスイーパーの遊び方</h2>
                    <div className={styles.sectionBlock}>
                        <p className={styles.textBlock}>
                            <strong>シングル:</strong> 地雷を踏まずに全ての安全なマスを開ければクリア。タイムを競います。<br />
                            <strong>マルチ:</strong> 対戦相手と同じ配置の盤面で、どちらが早くクリアできるかを競います。先にクリアした方の勝利です。
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );

    const renderSetup = () => (
        <main className={styles.main}>
            <div className={styles.setupContainer}>
                <h1 className={styles.title}>マインスイーパー</h1>
                <form onSubmit={handleNameSubmit} className={styles.setupForm}>
                    <input name="playerName" defaultValue={playerName} placeholder="プレイヤー名" className={styles.input} required />
                    <button type="submit" className={styles.primaryBtn}>次へ</button>
                </form>
            </div>
        </main>
    );

    const renderWaiting = () => (
        <main className={styles.main}>
            <div className={styles.header}><button onClick={() => { setStatus('menu'); setJoinMode(null); }} className={styles.backButton}><IconBack size={18} /> キャンセル</button></div>
            <div className={styles.gameContainer}>
                <h1>待機中...</h1>
                <div className={styles.waitingAnimation}><IconHourglass size={64} color="#2e7d32" /></div>
                <p>
                    {joinMode === 'room' ? `ルームID: ${roomId}` : `対戦相手を探しています (${difficulty.name})`}
                </p>
                {joinMode === 'room' && <p style={{ fontSize: '0.9rem', color: '#666' }}>相手にルームIDを伝えてください</p>}
            </div>
        </main>
    );

    if (status === 'setup') return renderSetup();
    if (status === 'menu') return renderMenu();
    if (status === 'waiting') return renderWaiting();

    // Playing or Result
    const isMultiplayer = !!roomId;

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <button onClick={() => { setRoomId(null); setStatus('menu'); }} className={styles.backButton}>
                    <IconBack size={18} /> {isMultiplayer ? '退出' : '戻る'}
                </button>
            </div>

            {isMultiplayer && (
                <div className={gameStyles.vsBar}>
                    <div className={gameStyles.vsPlayer}>
                        <span>あなた</span>
                        <div className={gameStyles.progressBar}><div style={{ width: `${Math.floor((((gameState.difficulty.rows * gameState.difficulty.cols) - gameState.difficulty.mines - gameState.minesLeft) / ((gameState.difficulty.rows * gameState.difficulty.cols) - gameState.difficulty.mines)) * 100)}%` }} /></div>
                    </div>
                    <div className={gameStyles.vsInfo}>VS</div>
                    <div className={gameStyles.vsPlayer}>
                        <span>{opponentName || 'Opponent'}</span>
                        <div className={gameStyles.progressBar}>
                            <div style={{ width: `${opponentProgress}%`, background: '#ef4444' }} />
                        </div>
                        {opponentStatus === 'won' && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Done!</span>}
                        {opponentStatus === 'lost' && <span style={{ color: '#666', fontSize: '0.8rem' }}>Exploded</span>}
                    </div>
                </div>
            )}

            <div className={styles.gameContainer}>
                <div className={gameStyles.statusBar}>
                    <div className={gameStyles.statusItem}><span>💣</span> {gameState.minesLeft}</div>
                    <div className={gameStyles.statusItem}><span>⏱️</span> {time}</div>
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
            </div>

            {/* End Game Modal */}
            {(gameState.status === 'won' || gameState.status === 'lost' || winner) && (
                <div className={gameStyles.modalOverlay}>
                    <div className={gameStyles.modal}>
                        {isMultiplayer ? (
                            <>
                                <h2>{winner === myRole ? 'YOU WIN! 🏆' : winner ? 'YOU LOSE...' : gameState.status === 'won' ? 'Waiting for result...' : 'Game Over'}</h2>
                                <p>Time: {time}s</p>
                                {/* Only show winner message if opponent won or I won */}
                            </>
                        ) : (
                            <>
                                <h2>{gameState.status === 'won' ? 'クリア！🎉' : 'ゲームオーバー...'}</h2>
                                <p>タイム: {time}秒</p>
                                {gameState.status === 'won' && user && <p className={gameStyles.saveMsg}>ランキングに登録されました！</p>}
                            </>
                        )}
                        <button onClick={() => { setRoomId(null); setStatus('menu'); setWinner(null); }} className={styles.primaryBtn}>
                            メニューへ戻る
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
