'use client';

import React, { useState, useEffect } from 'react';
import styles from './Quiz.module.css';
import { QUIZ_DATA } from '@/lib/quiz/data';

interface QuizPracticeGameProps {
    onBack: () => void;
}

export default function QuizPracticeGame({ onBack }: QuizPracticeGameProps) {
    const [phase, setPhase] = useState<'genre_select' | 'starting' | 'question' | 'result' | 'finished'>('genre_select');
    const [selectedGenre, setSelectedGenre] = useState<string>("すべて");
    const [qIndex, setQIndex] = useState(0);
    const [questions, setQuestions] = useState<any[]>([]);
    const [score, setScore] = useState(0);
    const [myAnswer, setMyAnswer] = useState('');
    const [choices, setChoices] = useState<string[]>([]);
    const [history, setHistory] = useState<{ q: any, correct: boolean }[]>([]);
    const [loading, setLoading] = useState(false);
    const [isGenreOpen, setIsGenreOpen] = useState(false);

    // Genres (mirrors QuizGame)
    const genres = ["すべて", "地理", "歴史", "科学", "生物", "文学", "ゲーム", "アニメ", "スポーツ", "常識", "英語", "数学", "IT", "エンタメ", "雑学", "音楽", "美術", "文化", "言葉", "食べ物", "ビジネス", "社会"];

    const [countdown, setCountdown] = useState(0);

    const startGame = async () => {
        setLoading(true);
        // Simulate loading delay for better UX
        await new Promise(r => setTimeout(r, 800));

        let pool = JSON.parse(JSON.stringify(QUIZ_DATA)); // Deep clone to avoid mutating global data
        if (selectedGenre !== "すべて") {
            pool = pool.filter((q: any) => q.category === selectedGenre);
            // Fallback if not enough questions
            if (pool.length < 10) pool = JSON.parse(JSON.stringify(QUIZ_DATA));
        }

        const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, 10);
        setQuestions(shuffled);
        setQIndex(0);
        setScore(0);
        setHistory([]);
        setLoading(false);

        // Start Countdown
        setPhase('starting');
        setCountdown(3);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Load the first question explicitly
                    loadQuestion(shuffled[0]);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const loadQuestion = (q: any) => {
        if (!q) return;
        setMyAnswer('');
        setPhase('question');

        // Normalize ruby (handle dakuten separation issues)
        const normalizedRuby = q.ruby.normalize('NFC');
        q.ruby = normalizedRuby; // Update ref for checking

        // Gen choices
        const correctChars = normalizedRuby.split('');
        const hiragana = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゃゅょっー";
        const dummyCount = 12 - correctChars.length;
        const dummies = [];
        for (let i = 0; i < Math.max(0, dummyCount); i++) {
            dummies.push(hiragana[Math.floor(Math.random() * hiragana.length)]);
        }

        let combined = [...correctChars, ...dummies].sort(() => 0.5 - Math.random());

        // Safety Check: Ensure all correct chars are physically in the combined array
        const missing = correctChars.filter(c => !combined.includes(c));
        if (missing.length > 0) {
            console.warn("Missing chars detected, forcing add:", missing);
            combined.push(...missing);
        }

        setChoices(combined);
    };

    const handleTileClick = (char: string) => {
        if (phase !== 'question') return;

        const q = questions[qIndex];
        if (myAnswer.length < q.ruby.length) {
            const next = myAnswer + char;
            setMyAnswer(next);

            if (next.length === q.ruby.length) {
                checkAnswer(next);
            }
        }
    };

    const handleBackSpace = () => {
        setMyAnswer(prev => prev.slice(0, -1));
    };

    const checkAnswer = (ans: string) => {
        const q = questions[qIndex];
        const isCorrect = (ans === q.ruby);

        if (isCorrect) {
            setScore(s => s + 100);
        }

        setHistory(prev => [...prev, { q, correct: isCorrect }]);
        setPhase('result');
        setCountdown(3); // Result display time

        // Count down for next question
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (qIndex + 1 >= questions.length) {
                        setPhase('finished');
                    } else {
                        const nextIndex = qIndex + 1;
                        setQIndex(nextIndex);
                        loadQuestion(questions[nextIndex]);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleGiveUp = () => {
        const q = questions[qIndex];
        // Treat as incorrect
        setHistory(prev => [...prev, { q, correct: false }]);
        setPhase('result');
        setCountdown(4); // Slightly longer to read answer
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (qIndex + 1 >= questions.length) {
                        setPhase('finished');
                    } else {
                        const nextIndex = qIndex + 1;
                        setQIndex(nextIndex);
                        loadQuestion(questions[nextIndex]);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    if (loading) {
        return (
            <div className={styles.main}>
                <div className={styles.container}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: 50, height: 50, border: '4px solid #e2e8f0',
                            borderTopColor: '#3b82f6', borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <h2 style={{ color: '#3b82f6' }}>問題を読み込んでいます...</h2>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'starting') {
        return (
            <div className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.questionBox}>
                        <h1 style={{ fontSize: '3rem', color: '#2563eb', marginBottom: '1rem' }}>まもなく開始！</h1>
                        <div style={{ fontSize: '5rem', fontWeight: 'bold', color: '#3b82f6', animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                            {countdown}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'genre_select') {
        return (
            <div className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.questionBox}>
                        <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#2563eb' }}>練習モード</h1>
                        <p style={{ marginBottom: '2rem' }}>苦手なジャンルを克服しよう！</p>





                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>挑戦するジャンル</label>
                            <button
                                onClick={() => setIsGenreOpen(!isGenreOpen)}
                                style={{
                                    width: '100%',
                                    maxWidth: '400px',
                                    margin: '0 auto',
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
                                                setSelectedGenre(g);
                                                setIsGenreOpen(false);
                                            }}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className={styles.menuButtonExit} onClick={onBack} style={{ padding: '0.8rem 1.5rem' }}>戻る</button>
                            <button
                                className={styles.button}
                                onClick={startGame}
                                style={{ marginTop: 0, width: 'auto', padding: '0.8rem 2rem' }}
                            >
                                スタート
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = questions[qIndex];

    if (phase === 'finished') {
        return (
            <div className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.resultContent} style={{ margin: 'auto' }}>
                        <h1>練習終了</h1>
                        <div style={{ fontSize: '2rem', margin: '2rem 0', color: '#3b82f6', fontWeight: 'bold' }}>Score: {score}</div>
                        <div style={{ textAlign: 'left', maxHeight: '300px', overflowY: 'auto' }}>
                            {history.map((h, i) => (
                                <div key={i} style={{ borderBottom: '1px solid #f1f5f9', padding: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ color: h.correct ? '#2ecc71' : '#ef4444', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                        {h.correct ? '○' : '×'}
                                    </span>
                                    <div>
                                        <div style={{ fontSize: '0.9rem' }}>{h.q.question}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>正解: {h.q.answer}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className={styles.button} onClick={onBack}>メニューへ戻る</button>
                        <button
                            className={styles.button}
                            onClick={() => { setPhase('genre_select'); setScore(0); }}
                            style={{ marginTop: 10, background: '#94a3b8', boxShadow: 'none' }}
                        >
                            ジャンル選択に戻る
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentQ) {
        return (
            <div className={styles.main}>
                <div className={styles.container}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: 50, height: 50, border: '4px solid #e2e8f0',
                            borderTopColor: '#3b82f6', borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <h2 style={{ color: '#3b82f6' }}>読み込み中...</h2>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.main}>
            {phase === 'result' && (
                <div className={styles.resultModal}>
                    <div className={styles.resultContent}>
                        <h2 style={{ color: myAnswer === currentQ.ruby ? '#2ecc71' : '#ef4444', fontSize: '2rem' }}>
                            {myAnswer === currentQ.ruby ? '正解！' : '不正解...'}
                        </h2>
                        <div className={styles.correctAnswerDisplay}>{currentQ.answer}</div>
                        <div style={{ color: '#64748b', fontSize: '1.2rem' }}>{currentQ.ruby}</div>
                        <div style={{ marginTop: '1.5rem', fontSize: '1.1rem', color: '#64748b' }}>
                            次の問題まで: <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{countdown}</span> 秒
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.menuButtonExit} onClick={onBack} style={{ padding: '4px 12px', width: 'auto' }}>終了</button>
                    <button className={styles.menuButtonExit} onClick={handleGiveUp} style={{ padding: '4px 12px', width: 'auto', marginLeft: '0.5rem', background: '#fee2e2', color: '#ef4444', borderColor: '#fca5a5' }}>パス</button>
                    <div className={styles.playerScore} style={{ marginLeft: 'auto' }}>Score: {score}</div>
                </div>

                <div className={styles.questionBox}>
                    <span className={styles.categoryTag}>{currentQ.category}</span>
                    <span style={{ float: 'right', color: '#94a3b8', fontWeight: 'bold' }}>Q{qIndex + 1}/10</span>
                    <div className={styles.questionText}>{currentQ.question}</div>
                    <div className={styles.timerBar} style={{ background: '#e2e8f0' }}>
                        <div className={styles.timerFill} style={{ width: '100%', background: '#3b82f6' }} />
                    </div>
                    <div style={{ marginTop: 8, fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>時間制限なし - じっくり考えよう</div>
                </div>

                <div className={styles.answerSlots}>
                    {Array.from({ length: currentQ.ruby.length }).map((_, i) => (
                        <div key={i} className={`${styles.slot} ${myAnswer[i] ? styles.slotFilled : ''}`}>
                            {myAnswer[i] || ''}
                        </div>
                    ))}
                    <button
                        onClick={handleBackSpace}
                        style={{
                            marginLeft: 12,
                            background: 'white',
                            border: '2px solid #e2e8f0',
                            color: '#64748b',
                            borderRadius: 12,
                            width: 50,
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ⌫
                    </button>
                </div>

                <div className={styles.charGrid}>
                    {choices.map((char, i) => (
                        <button
                            key={`${char}-${i}`}
                            className={styles.charTile}
                            onClick={() => handleTileClick(char)}
                        >
                            {char}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
