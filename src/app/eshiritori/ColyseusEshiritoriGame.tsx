'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Room } from 'colyseus.js';
import { client } from '@/lib/colyseus';
import { Schema, MapSchema, ArraySchema, defineTypes } from '@colyseus/schema';
import styles from '../drawing/DrawingGame.module.css';
import { IconBack, IconUser, IconPen } from '@/components/Icons';
import { DrawingCanvas } from '@/components/drawing/DrawingCanvas';
import { db } from '@/lib/firebase';
import { ref, set, remove, onDisconnect } from 'firebase/database';

// Schema definitions for client-side
class DrawingEntry extends Schema {
    playerId: string = "";
    playerName: string = "";
    targetWord: string = "";
    guessedWord: string = "";
    imageData: string = "";
}
defineTypes(DrawingEntry, {
    playerId: "string",
    playerName: "string",
    targetWord: "string",
    guessedWord: "string",
    imageData: "string"
});

class EshiritoriPlayer extends Schema {
    id: string = "";
    name: string = "";
    isHost: boolean = false;
    isCurrentDrawer: boolean = false;
    hasDrawn: boolean = false;
}
defineTypes(EshiritoriPlayer, {
    id: "string",
    name: "string",
    isHost: "boolean",
    isCurrentDrawer: "boolean",
    hasDrawn: "boolean"
});

class EshiritoriState extends Schema {
    players = new MapSchema<EshiritoriPlayer>();
    currentDrawerId: string = "";
    currentWord: string = "";
    phase: string = "lobby";
    timeLeft: number = 0;
    turnIndex: number = 0;
    drawingHistory = new ArraySchema<DrawingEntry>();
    lastImageData: string = "";
}
defineTypes(EshiritoriState, {
    players: { map: EshiritoriPlayer },
    currentDrawerId: "string",
    currentWord: "string",
    phase: "string",
    timeLeft: "number",
    turnIndex: "number",
    drawingHistory: [DrawingEntry],
    lastImageData: "string"
});

interface Props {
    playerName: string;
    playerId: string;
    mode: 'create' | 'join';
    roomId?: string;
    password?: string;
    onBack: () => void;
}

export default function ColyseusEshiritoriGame({ playerName, playerId, mode, roomId, password, onBack }: Props) {
    const [room, setRoom] = useState<Room<EshiritoriState> | null>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [phase, setPhase] = useState<string>('lobby');
    const [currentDrawerId, setCurrentDrawerId] = useState<string>('');
    const [currentWord, setCurrentWord] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [lastImageData, setLastImageData] = useState<string>('');
    const [drawingHistory, setDrawingHistory] = useState<any[]>([]);

    // UI state
    const [messages, setMessages] = useState<{ text: string, system?: boolean }[]>([]);
    const [guessInput, setGuessInput] = useState('');
    const [showingWord, setShowingWord] = useState('');
    const [previousDrawer, setPreviousDrawer] = useState('');
    const [error, setError] = useState<string | null>(null);

    const roomRef = useRef<Room<EshiritoriState> | null>(null);
    const canvasRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto scroll messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Connect to room
    useEffect(() => {
        let ignore = false;
        if (roomRef.current) return;

        const connect = async () => {
            try {
                const options = { name: playerName, uid: playerId };
                let r: Room<EshiritoriState>;

                if (mode === 'join' && roomId) {
                    r = await client.joinById(roomId, options);
                } else {
                    r = await client.create("eshiritori", options);
                }

                if (ignore) {
                    r.leave();
                    return;
                }

                roomRef.current = r;
                // @ts-ignore
                setRoom(r);

                // State change handler
                r.onStateChange((state: any) => {
                    // Players
                    const pList: any[] = [];
                    if (state.players) {
                        state.players.forEach((p: any) => {
                            pList.push({
                                id: p.id,
                                name: p.name,
                                isHost: p.isHost,
                                isCurrentDrawer: p.isCurrentDrawer,
                                hasDrawn: p.hasDrawn
                            });
                        });
                    }
                    setPlayers(pList);

                    setPhase(state.phase);
                    setCurrentDrawerId(state.currentDrawerId);
                    setCurrentWord(state.currentWord);
                    setTimeLeft(state.timeLeft);
                    setLastImageData(state.lastImageData);

                    // Drawing history
                    const history: any[] = [];
                    if (state.drawingHistory) {
                        state.drawingHistory.forEach((entry: any) => {
                            history.push({
                                playerId: entry.playerId,
                                playerName: entry.playerName,
                                targetWord: entry.targetWord,
                                guessedWord: entry.guessedWord,
                                imageData: entry.imageData
                            });
                        });
                    }
                    setDrawingHistory(history);
                });

                // Message handlers
                r.onMessage("message", (msg) => {
                    setMessages(prev => [...prev, { text: msg.text, system: msg.system }]);
                });

                r.onMessage("showWord", (data: { word: string }) => {
                    setShowingWord(data.word);
                });

                r.onMessage("startDrawing", () => {
                    setShowingWord('');
                });

                r.onMessage("showDrawing", (data: { imageData: string, previousDrawer: string }) => {
                    setLastImageData(data.imageData);
                    setPreviousDrawer(data.previousDrawer);
                });

                r.onMessage("requestSnapshot", () => {
                    // Canvas requests snapshot
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                        const imageData = canvas.toDataURL('image/png');
                        r.send("finishDrawing", { imageData });
                    }
                });

                r.onMessage("clear", () => {
                    // Canvas will handle this
                });

            } catch (e: any) {
                console.error("Connection error:", e);
                let errorMsg = "サーバーに接続できません";
                if (e instanceof Event) {
                    errorMsg = "WebSocket接続エラー: サーバーが起動していない可能性があります";
                } else if (e?.message) {
                    errorMsg = e.message;
                } else if (typeof e === 'string') {
                    errorMsg = e;
                }
                setError("接続エラー: " + errorMsg);
            }
        };

        connect();

        return () => {
            ignore = true;
            if (roomRef.current) {
                roomRef.current.leave();
                roomRef.current = null;
            }
        };
    }, []); // eslint-disable-line

    const handleStartGame = () => {
        room?.send("start");
    };

    const handleFinishDrawing = () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const imageData = canvas.toDataURL('image/png');
            room?.send("finishDrawing", { imageData });
        }
    };

    const handleSubmitGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guessInput.trim()) return;
        room?.send("submitGuess", { guess: guessInput.trim() });
        setGuessInput('');
    };

    const copyRoomId = () => {
        if (room) {
            navigator.clipboard.writeText(room.roomId);
            alert("ルームIDをコピーしました: " + room.roomId);
        }
    };

    // Error screen
    if (error) {
        return (
            <div className={styles.gameContainer} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
                    <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>接続エラー</h2>
                    <p style={{ marginBottom: '2rem', color: '#64748b' }}>{error}</p>
                    <button onClick={onBack} className={styles.primaryBtn}>戻る</button>
                </div>
            </div>
        );
    }

    // Loading screen
    if (!room) {
        return (
            <div className={styles.gameContainer} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className={styles.title}>サーバーに接続中...</div>
            </div>
        );
    }

    const amIDrawer = room.sessionId === currentDrawerId;
    const isHost = players.find(p => p.id === room.sessionId)?.isHost;

    // Determine next guesser
    const playerOrder = players.map(p => p.id);
    const currentTurnIndex = playerOrder.indexOf(currentDrawerId);
    const nextGuesserId = playerOrder[(currentTurnIndex + 1) % playerOrder.length];
    const amIGuesser = room.sessionId === nextGuesserId && phase === 'guessing';

    return (
        <main className={styles.gameContainer} style={{ '--theme-primary': '#f59e0b', '--theme-secondary': '#d97706' } as React.CSSProperties}>
            {/* Header */}
            <header className={styles.header}>
                <button onClick={onBack} className={styles.backButton}>
                    <IconBack size={24} /> 退出
                </button>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className={styles.timerPill} style={{ color: timeLeft <= 10 && timeLeft > 0 ? '#ef4444' : '#f59e0b' }}>
                        {timeLeft > 0 ? `${timeLeft}s` : phase === 'lobby' ? '待機中' : ''}
                    </div>
                </div>

                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f59e0b' }}>
                    絵しりとり
                </div>

                <div className={styles.roomId} onClick={copyRoomId} title="クリックしてコピー">
                    ID: {room.roomId}
                </div>
            </header>

            {/* Main Content */}
            <div className={styles.content}>
                {/* Stage */}
                <div className={styles.stage}>
                    {/* Status overlay */}
                    <div className={styles.statusOverlay} style={{ top: '20px' }}>
                        {phase === 'lobby' && '参加者を待っています...'}
                        {phase === 'showWord' && amIDrawer && `お題: ${showingWord || currentWord}`}
                        {phase === 'showWord' && !amIDrawer && `${players.find(p => p.isCurrentDrawer)?.name}がお題を確認中...`}
                        {phase === 'drawing' && amIDrawer && `「${currentWord}」を描いてください！`}
                        {phase === 'drawing' && !amIDrawer && `${players.find(p => p.isCurrentDrawer)?.name}が描いています...`}
                        {phase === 'guessing' && amIGuesser && `${previousDrawer}の絵を見て推測してください`}
                        {phase === 'guessing' && !amIGuesser && '推測中...'}
                        {phase === 'result' && '結果発表！'}
                    </div>

                    <div className={styles.canvasWrapper}>
                        {/* Drawing canvas for drawer */}
                        {(phase === 'drawing' || phase === 'showWord') && (
                            <DrawingCanvas
                                // @ts-ignore
                                room={room}
                                isDrawer={amIDrawer && phase === 'drawing'}
                                width={800}
                                height={600}
                            />
                        )}

                        {/* Show previous drawing for guesser */}
                        {phase === 'guessing' && lastImageData && (
                            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'white', borderRadius: '12px' }}>
                                <img src={lastImageData} alt="前の人の絵" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            </div>
                        )}

                        {/* Result screen */}
                        {phase === 'result' && (
                            <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: '12px', padding: '2rem', overflowY: 'auto' }}>
                                <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#f59e0b' }}>🎨 しりとりチェーン</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {drawingHistory.map((entry, idx) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', background: '#fef3c7', borderRadius: '12px' }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{entry.playerName}</div>
                                            {entry.imageData && (
                                                <img src={entry.imageData} alt={`${entry.playerName}の絵`} style={{ width: '200px', height: '150px', objectFit: 'contain', background: 'white', borderRadius: '8px', marginBottom: '0.5rem' }} />
                                            )}
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
                                                <span style={{ color: '#059669' }}>描いた: {entry.targetWord}</span>
                                                {entry.guessedWord && (
                                                    <>
                                                        <span>→</span>
                                                        <span style={{ color: entry.guessedWord === entry.targetWord ? '#059669' : '#dc2626' }}>
                                                            推測: {entry.guessedWord}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    {phase === 'drawing' && amIDrawer && (
                        <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>
                            <button onClick={handleFinishDrawing} className={styles.primaryBtn} style={{ background: '#10b981' }}>
                                描き終わった！
                            </button>
                        </div>
                    )}

                    {/* Guess input form */}
                    {phase === 'guessing' && amIGuesser && (
                        <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '80%', maxWidth: '400px' }}>
                            <form onSubmit={handleSubmitGuess} style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={guessInput}
                                    onChange={e => setGuessInput(e.target.value)}
                                    placeholder="この絵は何？（ひらがなで）"
                                    style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '2px solid #f59e0b', fontSize: '1rem' }}
                                    autoFocus
                                />
                                <button type="submit" className={styles.primaryBtn} style={{ background: '#f59e0b' }}>
                                    送信
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Lobby overlay */}
                    {phase === 'lobby' && (
                        <div className={styles.overlay}>
                            <h2 className={styles.title} style={{ color: '#f59e0b' }}>🎨 絵しりとり</h2>
                            <p style={{ marginBottom: '1rem', fontSize: '1rem', opacity: 0.8 }}>
                                前の人の絵を見て、それが何かを推測して、<br />
                                しりとりで続く言葉を描いていくゲームです！
                            </p>
                            <p style={{ marginBottom: '2rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                参加者: {players.length}人
                            </p>
                            {isHost ? (
                                <button
                                    onClick={handleStartGame}
                                    className={styles.primaryBtn}
                                    disabled={players.length < 2}
                                    style={{ background: players.length >= 2 ? '#f59e0b' : '#cbd5e1' }}
                                >
                                    {players.length >= 2 ? 'ゲーム開始！' : '2人以上必要です'}
                                </button>
                            ) : (
                                <p style={{ color: '#64748b' }}>ホストがゲームを開始するのを待っています...</p>
                            )}
                        </div>
                    )}

                    {/* Result restart */}
                    {phase === 'result' && isHost && (
                        <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>
                            <button onClick={handleStartGame} className={styles.primaryBtn} style={{ background: '#f59e0b' }}>
                                もう一度遊ぶ
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.playerList}>
                        <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>
                            参加者
                        </div>
                        {players.map(p => (
                            <div key={p.id} className={`${styles.playerItem} ${p.isCurrentDrawer ? styles.active : ''}`}>
                                <div className={styles.avatar}>
                                    {p.isCurrentDrawer ? '🎨' : p.hasDrawn ? '✅' : <IconUser size={20} color="#64748b" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                        {p.name} {p.id === room.sessionId && '(自分)'} {p.isHost && '👑'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.chatArea}>
                        <div className={styles.messages}>
                            {messages.map((m, i) => (
                                <div key={i} className={`${styles.message} ${m.system ? styles.systemMessage : ''}`}>
                                    {m.text}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
