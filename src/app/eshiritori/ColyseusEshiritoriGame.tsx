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
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
    currentGuesserId: string = "";
    phase: string = "lobby";
    timeLeft: number = 0;
    turnIndex: number = 0;
    drawingHistory = new ArraySchema<DrawingEntry>();
    lastImageData: string = "";
    roundsPerPlayer: number = 1;
    currentRound: number = 1;
}
defineTypes(EshiritoriState, {
    players: { map: EshiritoriPlayer },
    currentDrawerId: "string",
    currentGuesserId: "string",
    phase: "string",
    timeLeft: "number",
    turnIndex: "number",
    drawingHistory: [DrawingEntry],
    lastImageData: "string",
    roundsPerPlayer: "number",
    currentRound: "number"
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
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [lastImageData, setLastImageData] = useState<string>('');
    const [drawingHistory, setDrawingHistory] = useState<any[]>([]);
    const [roundsPerPlayer, setRoundsPerPlayer] = useState<number>(1);
    const [turnIndex, setTurnIndex] = useState<number>(0);
    const [currentRound, setCurrentRound] = useState<number>(1);
    const [currentGuesserId, setCurrentGuesserId] = useState<string>("");

    // UI state
    const [messages, setMessages] = useState<{ text: string, system?: boolean }[]>([]);
    const [guessInput, setGuessInput] = useState('');
    const [showingWord, setShowingWord] = useState('');  // Word only shown to drawer via message
    const [previousDrawer, setPreviousDrawer] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showMobileChat, setShowMobileChat] = useState(false);

    const roomRef = useRef<Room<EshiritoriState> | null>(null);
    const canvasRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto scroll messages (only within chat container)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [messages]);

    // Connect to room
    useEffect(() => {
        let ignore = false;
        if (roomRef.current) return;

        const connect = async () => {
            // Debounce to prevent double connection in Strict Mode
            await new Promise(r => setTimeout(r, 50));
            if (ignore) return;

            try {
                const options = { name: playerName, uid: playerId };
                let r: Room<EshiritoriState>;

                if (mode === 'join' && roomId) {
                    r = await client.joinById(roomId, options);
                } else {
                    r = await client.create("eshiritori", options);
                }

                if (ignore) {
                    if (r) r.leave();
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
                    setTimeLeft(state.timeLeft);
                    setLastImageData(state.lastImageData);
                    setRoundsPerPlayer(state.roundsPerPlayer || 1);
                    setTurnIndex(state.turnIndex || 0);
                    setCurrentRound(state.currentRound || 1);
                    setCurrentGuesserId(state.currentGuesserId || "");

                    // Firebase room tracking for lobby listing
                    const myPlayer = pList.find(p => p.id === r.sessionId);
                    if (myPlayer?.isHost && r.roomId) {
                        const roomRef = ref(db, `eshiritori_rooms/${r.roomId}`);
                        const roomData = {
                            roomId: r.roomId,
                            hostId: playerId,
                            hostName: playerName,
                            status: state.phase === 'lobby' ? 'waiting' : 'playing',
                            playerCount: pList.length,
                            isLocked: !!password,
                            createdAt: Date.now()
                        };
                        set(roomRef, roomData).catch(err => console.warn("Firebase update failed:", err));
                        onDisconnect(roomRef).remove().catch(err => console.warn("onDisconnect failed:", err));
                    }

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
                    // Do not clear showingWord here, we need it for display
                    console.log("startDrawing received");
                });

                r.onMessage("showDrawing", (data: { imageData: string, previousDrawer: string }) => {
                    setLastImageData(data.imageData);
                    setPreviousDrawer(data.previousDrawer);
                });

                r.onMessage("requestSnapshot", () => {
                    // Canvas requests snapshot
                    try {
                        const wrapper = document.getElementById('eshiritori-canvas-wrapper');
                        const canvases = wrapper?.querySelectorAll('canvas');

                        const tempCanvas = document.createElement('canvas');

                        // Resize to max 400px width to reduce size
                        const MAX_WIDTH = 400;
                        const originalWidth = 800;
                        const originalHeight = 600;
                        const scale = MAX_WIDTH / originalWidth;

                        tempCanvas.width = MAX_WIDTH;
                        tempCanvas.height = originalHeight * scale;

                        const ctx = tempCanvas.getContext('2d');

                        if (ctx) {
                            // Fill white background (important for JPEG)
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                            // Draw all layers scaled
                            if (canvases) {
                                canvases.forEach((c) => {
                                    ctx.drawImage(c, 0, 0, tempCanvas.width, tempCanvas.height);
                                });
                            }

                            // Use JPEG with 0.5 quality to reduce message size and prevent WS disconnect
                            const imageData = tempCanvas.toDataURL('image/jpeg', 0.5);
                            r.send("finishDrawing", { imageData });
                        } else {
                            r.send("finishDrawing", { imageData: "" });
                        }
                    } catch (err) {
                        console.error("Snapshot error:", err);
                        r.send("finishDrawing", { imageData: "" });
                    }
                });

                r.onLeave((code) => {
                    console.log("Room left:", code);
                    setError("サーバーから切断されました (Code: " + code + ")");
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

    const handleSkipDrawing = () => {
        room?.send("skipDrawing");
    };

    const handleUpdateSettings = (rounds: number) => {
        room?.send("updateSettings", { roundsPerPlayer: rounds });
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
    // Determine next guesser - Use server state for truth
    const amIGuesser = room.sessionId === currentGuesserId && phase === 'guessing';

    return (
        <main className={styles.gameContainer} style={{ '--theme-primary': '#f59e0b', '--theme-secondary': '#d97706' } as React.CSSProperties}>
            {/* Header */}
            <header className={styles.header}>
                <button onClick={onBack} className={styles.backButton}>
                    <IconBack size={24} /> 退出
                </button>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                    <div className={styles.timerPill} style={{ color: timeLeft <= 10 && timeLeft > 0 ? '#ef4444' : '#f59e0b' }}>
                        {timeLeft > 0 ? `${timeLeft}s` : phase === 'lobby' ? '待機中' : ''}
                    </div>
                    {/* Finish button in header for drawer */}
                    {phase === 'drawing' && amIDrawer && (
                        <button onClick={handleFinishDrawing} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                            ✓ 完了
                        </button>
                    )}
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
                        {phase === 'showWord' && amIDrawer && turnIndex === 0 && currentRound === 1 && `お題: ${showingWord}`}
                        {phase === 'showWord' && amIDrawer && !(turnIndex === 0 && currentRound === 1) && '次に描く準備をしてください'}
                        {phase === 'showWord' && !amIDrawer && `${players.find(p => p.isCurrentDrawer)?.name}が準備中...`}
                        {phase === 'drawing' && amIDrawer && turnIndex === 0 && currentRound === 1 && `🎨 お題: 「${showingWord}」`}
                        {phase === 'drawing' && amIDrawer && !(turnIndex === 0 && currentRound === 1) && '🎨 前の人の絵に続くものを描いてください'}
                        {phase === 'drawing' && !amIDrawer && `${players.find(p => p.isCurrentDrawer)?.name}が描いています...`}
                        {phase === 'guessing' && amIGuesser && `${previousDrawer}の絵を見て推測してください`}
                        {phase === 'guessing' && !amIGuesser && '推測中...'}
                    </div>

                    <div className={styles.canvasWrapper} id="eshiritori-canvas-wrapper">
                        {/* Drawing canvas for drawer */}
                        {(phase === 'drawing' || phase === 'showWord') && (
                            <ErrorBoundary fallback={<div style={{ padding: '2rem', color: 'white', background: '#dc2626', borderRadius: '8px' }}>キャンバスエラーが発生しました。ページをリロードしてください。</div>}>
                                <DrawingCanvas
                                    // @ts-ignore
                                    room={room}
                                    isDrawer={amIDrawer && phase === 'drawing'}
                                    width={800}
                                    height={600}
                                />
                            </ErrorBoundary>
                        )}

                        {/* Show previous drawing for guesser */}
                        {phase === 'guessing' && lastImageData && (
                            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'white', borderRadius: '12px' }}>
                                <img src={lastImageData} alt="前の人の絵" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            </div>
                        )}

                        {/* Result screen */}
                        {phase === 'result' && (
                            <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: '12px', padding: '1rem', overflowY: 'auto' }}>
                                <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: '#f59e0b', fontSize: '1.2rem' }}>🎨 しりとりチェーン</h2>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                                    {drawingHistory.map((entry, idx) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem', background: '#fef3c7', borderRadius: '8px', width: '150px' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{entry.playerName}</div>
                                            {entry.imageData && (
                                                <img src={entry.imageData} alt={`${entry.playerName}の絵`} style={{ width: '120px', height: '90px', objectFit: 'contain', background: 'white', borderRadius: '4px', marginBottom: '0.25rem' }} />
                                            )}
                                            <div style={{ fontSize: '0.9rem', color: '#b45309', fontWeight: 'bold' }}>
                                                → {entry.guessedWord || '？'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Guess input form */}
                    {phase === 'guessing' && amIGuesser && (
                        <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '80%', maxWidth: '400px', zIndex: 100 }}>
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

                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#64748b' }}>
                                    描く枚数: {roundsPerPlayer}枚 / 人
                                </div>
                                {isHost ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => handleUpdateSettings(n)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: roundsPerPlayer === n ? '#f59e0b' : '#e2e8f0',
                                                    color: roundsPerPlayer === n ? 'white' : '#64748b',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                                        ホストが設定中...
                                    </div>
                                )}
                            </div>

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
                        <div className={styles.messages} style={{ overscrollBehavior: 'contain' }}>
                            {messages.map((m, i) => (
                                <div key={i} className={`${styles.message} ${m.system ? styles.systemMessage : ''}`}>
                                    {m.text}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className={styles.chatInputArea}>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                                if (input && input.value.trim() && room) {
                                    room.send("chat", { text: input.value.trim() });
                                    input.value = '';
                                }
                            }} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                <input
                                    type="text"
                                    placeholder="メッセージを入力..."
                                    className={styles.chatInput}
                                />
                                <button type="submit" className={styles.primaryBtn} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                    送信
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile chat toggle button */}
            <button
                onClick={() => setShowMobileChat(!showMobileChat)}
                style={{
                    position: 'fixed',
                    top: '80px',
                    right: '10px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    zIndex: 200,
                    display: 'none'
                }}
                className="mobile-chat-toggle"
            >
                💬
            </button>

            {/* Mobile chat overlay */}
            {showMobileChat && (
                <div style={{
                    position: 'fixed',
                    top: '130px',
                    right: '10px',
                    width: '280px',
                    maxWidth: 'calc(100vw - 20px)',
                    height: '300px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    zIndex: 199,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }} className="mobile-chat-overlay">
                    <div style={{ padding: '0.75rem', background: '#f59e0b', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>💬 チャット / 👥 参加者</span>
                        <button onClick={() => setShowMobileChat(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                    </div>

                    {/* Mobile Player List */}
                    <div style={{ padding: '0.5rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', overflowX: 'auto', gap: '0.5rem' }}>
                        {players.map(p => {
                            const isGuesser = p.id === currentGuesserId && phase === 'guessing';
                            return (
                                <div key={p.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem',
                                    background: p.isCurrentDrawer ? '#fef3c7' : (isGuesser ? '#dbeafe' : 'white'),
                                    border: p.isCurrentDrawer ? '1px solid #f59e0b' : (isGuesser ? '1px solid #3b82f6' : '1px solid #e2e8f0'),
                                    fontWeight: (p.isCurrentDrawer || isGuesser) ? 'bold' : 'normal',
                                    whiteSpace: 'nowrap'
                                }}>
                                    <span>{p.isCurrentDrawer ? '🎨' : (isGuesser ? '🤔' : '👤')}</span>
                                    {p.name}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', overscrollBehavior: 'contain' }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ padding: '0.4rem 0.6rem', marginBottom: '0.25rem', borderRadius: '8px', fontSize: '0.85rem', background: m.system ? '#dcfce7' : '#f1f5f9' }}>
                                {m.text}
                            </div>
                        ))}
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                        if (input && input.value.trim() && room) {
                            room.send("chat", { text: input.value.trim() });
                            input.value = '';
                        }
                    }} style={{ display: 'flex', padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                        <input type="text" placeholder="メッセージ..." style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginRight: '0.5rem' }} />
                        <button type="submit" style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer' }}>送信</button>
                    </form>
                </div>
            )}

            <style jsx global>{`
                @media (max-width: 768px) {
                    .mobile-chat-toggle { display: block !important; }
                }
            `}</style>
        </main>
    );
}
