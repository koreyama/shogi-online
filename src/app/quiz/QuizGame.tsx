'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './Quiz.module.css';
import { client } from '@/lib/colyseus';
import { Room } from 'colyseus.js';
import { IconBack } from '@/components/Icons';

// Constants
const QUESTIONS_TOTAL = 10;

import { db } from '@/lib/firebase';
import { ref, set, onDisconnect, remove } from 'firebase/database';

interface QuizGameProps {
    userData: { name: string; id: string };
    mode?: 'create' | 'join';
    roomId?: string;
    password?: string;
    onBack: () => void;
}

export default function QuizGame({ userData, mode = 'create', roomId, password, onBack }: QuizGameProps) {
    const [room, setRoom] = useState<Room | null>(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Game State
    const [phase, setPhase] = useState<string>('waiting');
    const [currentQuestion, setCurrentQuestion] = useState<{ text: string; category: string; length: number } | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [questionCount, setQuestionCount] = useState(0);
    const [selectedGenre, setSelectedGenre] = useState<string>("すべて");
    const [choices, setChoices] = useState<string[]>([]);
    const [myAnswer, setMyAnswer] = useState<string>('');
    const [players, setPlayers] = useState<any[]>([]);
    const [resultData, setResultData] = useState<{ correctAnswer: string } | null>(null);
    const [me, setMe] = useState<any>(null);
    const [isGenreOpen, setIsGenreOpen] = useState(false);

    const roomRef = useRef<Room | null>(null);

    useEffect(() => {
        let ignore = false;
        if (roomRef.current) return;

        const connect = async () => {
            // Debounce to prevent double connection in Strict Mode
            await new Promise(r => setTimeout(r, 50));
            if (ignore) return;

            try {
                const options = { name: userData.name, password };
                let r: Room;

                if (mode === 'join' && roomId) {
                    r = await client.joinById(roomId, options);
                } else {
                    r = await client.create('quiz', options);
                }

                if (ignore) {
                    if (r) r.leave();
                    return;
                }

                roomRef.current = r;
                setRoom(r);
                setConnected(true);

                // Track phases for sound/reset logic
                let lastPhase = '';

                r.onStateChange((state: any) => {
                    // Phase transition logic
                    if (lastPhase !== 'question' && state.phase === 'question') {
                        setMyAnswer('');
                    }
                    lastPhase = state.phase;

                    setPhase(state.phase);
                    setTimeRemaining(state.timeRemaining);
                    setQuestionCount(state.currentQuestionIndex);
                    setSelectedGenre(state.selectedGenre || "すべて");

                    if (state.questionText) {
                        setCurrentQuestion({
                            text: state.questionText,
                            category: state.questionCategory,
                            length: state.answerLength
                        });
                    }

                    if (state.choices) {
                        try {
                            const parsed = JSON.parse(state.choices);
                            setChoices(parsed);
                        } catch (e) { }
                    }

                    if (state.phase === 'result') {
                        setResultData({
                            correctAnswer: state.correctAnswer
                        });
                        setMyAnswer('');
                    } else if (state.phase === 'question') {
                        setResultData(null);
                    }

                    const pList: any[] = [];
                    state.players.forEach((p: any, sessionId: string) => {
                        const playerObj = {
                            name: p.name,
                            score: p.score,
                            answered: p.answered,
                            isCorrect: p.isCorrect,
                            isHost: p.isHost,
                            sessionId: sessionId,
                            me: sessionId === r.sessionId
                        };
                        pList.push(playerObj);
                        if (sessionId === r.sessionId) setMe(playerObj);
                    });
                    pList.sort((a, b) => b.score - a.score);
                    setPlayers(pList);

                    // Firebase room tracking for lobby listing (same as Eshiritori)
                    const myPlayer = pList.find(p => p.sessionId === r.sessionId);
                    if ((myPlayer?.isHost || mode === 'create') && r.roomId) {
                        const fbRoomRef = ref(db, `quiz_rooms/${r.roomId}`);
                        const roomData = {
                            roomId: r.roomId,
                            hostId: userData.id,
                            hostName: userData.name,
                            status: state.phase === 'waiting' ? 'waiting' : 'playing',
                            playerCount: pList.length,
                            isLocked: !!password,
                            genre: state.selectedGenre || "すべて",
                            createdAt: Date.now()
                        };
                        set(fbRoomRef, roomData).catch(err => console.warn("Firebase update failed:", err));
                        onDisconnect(fbRoomRef).remove().catch(err => console.warn("onDisconnect failed:", err));
                    }
                });

            } catch (e: any) {
                setError(e.message || 'Connection failed');
            }
        };
        connect();
        return () => {
            ignore = true;
            if (roomRef.current?.roomId) {
                const rRef = ref(db, `quiz_rooms/${roomRef.current.roomId}`);
                remove(rRef);
            }
            roomRef.current?.leave();
            roomRef.current = null;
        };
    }, []);

    const handleTileClick = (char: string) => {
        if (phase !== 'question') return;
        if (me?.answered) return;

        if (myAnswer.length < (currentQuestion?.length || 0)) {
            const nextAnswer = myAnswer + char;
            setMyAnswer(nextAnswer);

            if (nextAnswer.length === (currentQuestion?.length || 0)) {
                // Auto submit
                room?.send('answer', { answer: nextAnswer });
            }
        }
    };

    const handleBackSpace = () => {
        if (phase !== 'question' || me?.answered) return;
        setMyAnswer(prev => prev.slice(0, -1));
    };

    // Render
    if (!connected) {
        return (
            <div className={styles.main}>
                <div className={styles.container}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: 50, height: 50, border: '4px solid #e2e8f0',
                            borderTopColor: '#3b82f6', borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <h2 style={{ color: '#3b82f6' }}>サーバーに接続中...</h2>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                </div>
            </div>
        );
    }
    if (error) return <div className={styles.container}>{error} <button onClick={onBack}>戻る</button></div>;

    // WAITING
    if (phase === 'waiting') {
        const isHost = me?.isHost;
        const genres = ["すべて", "地理", "歴史", "科学", "生物", "文学", "ゲーム", "アニメ", "スポーツ", "常識", "英語", "数学", "IT", "エンタメ", "雑学", "音楽", "美術", "文化", "言葉", "食べ物", "ビジネス", "社会"];

        return (
            <div className={styles.main}>
                <div className={styles.container}>
                    {/* Header with exit button */}
                    <div className={styles.header}>
                        <button className={styles.backButton} onClick={onBack}>
                            <IconBack size={20} /> 退出
                        </button>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                            💡 Quiz Battle
                        </div>
                        <div style={{ width: 100 }}></div>
                    </div>

                    <div className={styles.questionBox} style={{ marginTop: '2rem' }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#2563eb' }}>待機中</h1>

                        {/* Display Room ID */}
                        <div style={{
                            background: '#eff6ff',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            display: 'inline-block',
                            border: '1px dashed #93c5fd',
                            marginBottom: '1rem',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            color: '#1d4ed8'
                        }}>
                            Room ID: {room?.roomId}
                        </div>

                        <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>他のプレイヤーを待っています...</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '2rem' }}>
                            現在: {players.length}人
                        </p>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ marginRight: '1rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>ジャンル選択:</label>
                            {isHost ? (
                                <div>
                                    <button
                                        onClick={() => setIsGenreOpen(!isGenreOpen)}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: 'white',
                                            border: '1px solid #ccc',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            color: '#333'
                                        }}
                                    >
                                        <span>選択中: <span style={{ color: '#3b82f6' }}>{selectedGenre}</span></span>
                                        <span>{isGenreOpen ? '▲ 閉じる' : '▼ 変更する'}</span>
                                    </button>

                                    {isGenreOpen && (
                                        <div className={styles.genreGrid}>
                                            {genres.map(g => (
                                                <button
                                                    key={g}
                                                    className={`${styles.genreButton} ${selectedGenre === g ? styles.genreButtonSelected : ''}`}
                                                    onClick={() => {
                                                        room?.send("selectGenre", { genre: g });
                                                        setIsGenreOpen(false);
                                                    }}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{
                                    padding: '1rem',
                                    background: '#eff6ff',
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    color: '#3b82f6',
                                    fontSize: '1.2rem',
                                    border: '2px solid #dbeafe'
                                }}>
                                    {selectedGenre}
                                </div>
                            )}
                        </div>

                        {players.length > 0 && isHost && (
                            <button
                                className={styles.button}
                                onClick={() => room?.send('start')}
                                style={{
                                    padding: '1rem 2rem',
                                    fontSize: '1.1rem',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                                }}
                            >
                                ゲーム開始
                            </button>
                        )}
                        {players.length > 0 && !isHost && (
                            <div style={{ marginTop: '1rem', color: '#64748b' }}>ホストが開始するのを待っています...</div>
                        )}
                    </div>

                    <div className={styles.playersList} style={{ marginTop: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#64748b' }}>参加者</h3>
                        {players.map(p => (
                            <div key={p.sessionId} className={styles.playerCard}>
                                <div style={{ fontWeight: 'bold' }}>{p.name} {p.isHost ? '(Host)' : ''}</div>
                                {/* Hide score in waiting room */}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // STARTING
    if (phase === 'starting') {
        return (
            <div className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.questionBox}>
                        <h1 style={{ fontSize: '3rem', color: '#2563eb', marginBottom: '1rem' }}>まもなく開始！</h1>
                        <div style={{ fontSize: '5rem', fontWeight: 'bold', color: '#3b82f6', animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                            {timeRemaining}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // FINISHED
    if (phase === 'finished') {
        return (
            <div className={styles.container}>
                <div className={styles.resultContent} style={{ margin: 'auto' }}>
                    <h1>最終結果</h1>
                    {players.map((p, i) => (
                        <div key={i} className={styles.rankingRow}>
                            <span>{i + 1}位 {p.name}</span>
                            <span>{p.score}点</span>
                        </div>
                    ))}

                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {me?.isHost ? (
                            <button
                                className={styles.button}
                                onClick={() => room?.send('restart')}
                                style={{ background: '#3b82f6', color: 'white' }}
                            >
                                ルームに戻る（もう一度遊ぶ）
                            </button>
                        ) : (
                            <div style={{ color: '#64748b', marginBottom: '1rem' }}>
                                ホストが次の操作を選択中...
                            </div>
                        )}
                        <button
                            className={styles.button}
                            onClick={onBack}
                            style={{ background: 'transparent', border: '1px solid #ccc', color: '#64748b' }}
                        >
                            退出する
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // GAME LOOP (Question / Result)
    return (
        <div className={styles.main}>
            {/* Phase Result Overlay */}
            {phase === 'result' && resultData && (
                <div className={styles.resultModal}>
                    <div className={styles.resultContent}>
                        <h2>正解は...</h2>
                        <div className={styles.correctAnswerDisplay}>{resultData.correctAnswer}</div>

                        {/* Show who got it right */}
                        <div style={{ margin: '1rem 0' }}>
                            {players.map(p => (
                                <div key={p.sessionId} style={{ color: p.isCorrect ? '#2ecc71' : '#bdc3c7' }}>
                                    {p.name}: {p.isCorrect ? '正解！' : '不正解'}
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '1.5rem', fontSize: '1.1rem', color: '#64748b' }}>
                            次の問題まで: <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{timeRemaining}</span> 秒
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.container}>
                {/* Header info */}
                <div className={styles.header}>
                    <button className={styles.menuButtonExit} onClick={onBack} style={{ padding: '4px 12px' }}>退出</button>
                    <div className={styles.playerScore}>Score: {me?.score || 0}</div>
                </div>

                {/* Question Section */}
                {currentQuestion && (
                    <div className={styles.questionBox}>
                        <span className={styles.categoryTag}>{currentQuestion.category}</span>
                        <span style={{ float: 'right', color: '#94a3b8', fontWeight: 'bold' }}>Q{questionCount}/{QUESTIONS_TOTAL}</span>
                        <div className={styles.questionText}>{currentQuestion.text}</div>
                        <div className={styles.timerBar}>
                            <div className={styles.timerFill} style={{ width: `${(timeRemaining / 20) * 100}%` }} />
                        </div>
                    </div>
                )}

                {/* Answer Slots */}
                <div className={styles.answerSlots}>
                    {Array.from({ length: currentQuestion?.length || 0 }).map((_, i) => (
                        <div key={i} className={`${styles.slot} ${myAnswer[i] ? styles.slotFilled : ''}`}>
                            {myAnswer[i] || ''}
                        </div>
                    ))}
                    {/* Backspace button */}
                    <button
                        onClick={handleBackSpace}
                        style={{ marginLeft: 10, background: 'transparent', border: '1px solid #ccc', color: '#ccc', borderRadius: 4, width: 40 }}
                        disabled={me?.answered}
                    >
                        ⌫
                    </button>
                </div>

                {/* Char Grid */}
                <div className={styles.charGrid}>
                    {choices.map((char, i) => (
                        <button
                            key={`${char}-${i}`}
                            className={`${styles.charTile} ${me?.answered ? styles.charTileDisabled : ''}`}
                            onClick={() => handleTileClick(char)}
                            disabled={me?.answered}
                        >
                            {char}
                        </button>
                    ))}
                </div>

                {/* Players status footer */}
                <div className={styles.playersList}>
                    {players.map(p => (
                        <div key={p.sessionId} className={`${styles.playerCard}`}>
                            <div className={`${styles.statusIndicator} ${p.answered ? (phase === 'result' ? (p.isCorrect ? styles.statusCorrect : styles.statusWrong) : styles.statusAnswered) : ''}`}>
                                {phase === 'result' ? (p.isCorrect ? '✓' : '✗') : (p.answered ? '!' : '')}
                            </div>
                            <div style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                            <div className={styles.playerScore} style={{ fontSize: '1rem' }}>{p.score}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
