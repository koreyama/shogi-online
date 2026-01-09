'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Room } from 'colyseus.js';
import { client } from '@/lib/colyseus';
import { Schema, MapSchema, defineTypes } from '@colyseus/schema';
import styles from './DrawingGame.module.css';
import { IconBack, IconUser, IconPalette, IconPen, IconSettings } from '@/components/Icons';
import { useRouter } from 'next/navigation';
import { DrawingCanvas } from '@/components/drawing/DrawingCanvas';

const DRAWING_THEME = {
    '--theme-primary': '#7c3aed',
    '--theme-secondary': '#6d28d9',
    '--theme-tertiary': '#8b5cf6',
    '--theme-bg-light': '#f5f3ff',
    '--theme-text-title': 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%)',
} as React.CSSProperties;

// Define Schema for Client-side Decoding (Without decorators)
class DrawingPlayer extends Schema {
    id: string = "";
    name: string = "";
    score: number = 0;
    isDrawer: boolean = false;
    isOnline: boolean = true;
}
defineTypes(DrawingPlayer, {
    id: "string",
    name: "string",
    score: "number",
    isDrawer: "boolean",
    isOnline: "boolean"
});

class DrawingState extends Schema {
    players = new MapSchema<DrawingPlayer>();
    currentDrawer: string = "";
    currentWord: string = "";
    phase: string = "lobby";
    gameMode: string = "quiz";
    timeLeft: number = 0;
    round: number = 1;
    maxRounds: number = 3;
}
defineTypes(DrawingState, {
    players: { map: DrawingPlayer },
    currentDrawer: "string",
    currentWord: "string",
    phase: "string",
    gameMode: "string",
    timeLeft: "number",
    round: "number",
    maxRounds: "number"
});

interface ColyseusDrawingGameProps {
    playerName: string;
    playerId: string;
    mode: 'random' | 'room';
    roomId?: string; // For joining specific room
    onBack: () => void;
}

export default function ColyseusDrawingGame({ playerName, playerId, mode, roomId, onBack }: ColyseusDrawingGameProps) {
    const [room, setRoom] = useState<Room<DrawingState> | null>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [gameStatus, setGameStatus] = useState<string>('lobby');
    const [currentDrawer, setCurrentDrawer] = useState<string>('');
    const [currentWord, setCurrentWord] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [round, setRound] = useState<number>(1);
    const [gameMode, setGameMode] = useState<'quiz' | 'free'>('quiz');

    // UI Local State
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<{ id: string, name: string, text: string, system?: boolean }[]>([]);
    const [wordChoices, setWordChoices] = useState<string[]>([]);
    const [showWordSelect, setShowWordSelect] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const roomRef = useRef<Room<DrawingState> | null>(null); // Ref for cleanup

    // Scroll chat to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const updatePlayers = (r: Room<DrawingState>) => {
        const pList: any[] = [];
        try {
            r.state.players.forEach((p, key) => {
                pList.push({
                    id: p.id,
                    name: p.name,
                    score: p.score,
                    isDrawer: p.isDrawer,
                    isOnline: p.isOnline
                });
            });
            console.log("Updated Players List:", pList);
            setPlayers(pList);
        } catch (e) {
            console.error("Error updating players:", e);
        }
    };

    useEffect(() => {
        let ignore = false;

        // Prevent double connection using Ref check, though local "ignore" is safer involved with async
        if (roomRef.current) return;

        console.log("Connecting to Colyseus...");
        // client is imported from @/lib/colyseus

        const connect = async () => {
            // Delay slightly to allow strict mode unmount to fire first if happening
            // await new Promise(r => setTimeout(r, 100)); 
            // actually standard ignore pattern is sufficient if we check it after await.

            try {
                // Determine options
                const options = { name: playerName, uid: playerId };

                if (ignore) return;

                let r: Room<DrawingState>;
                // Connect without explicit schema first to avoid mismatch
                if (mode === 'random') {
                    // Random Match: Only join PUBLIC rooms
                    r = await client.joinOrCreate("drawing", { ...options, isPrivate: false });
                } else if (mode === 'room' && roomId) {
                    // Join by ID: Can join PRIVATE or PUBLIC if known ID
                    r = await client.joinById(roomId, options);
                } else {
                    // Create Room: Always PRIVATE
                    r = await client.create("drawing", { ...options, isPrivate: true });
                }

                if (ignore) {
                    r.leave();
                    return;
                }

                roomRef.current = r;
                // @ts-ignore
                setRoom(r);

                console.log("Room joined successfully. Session ID:", r.sessionId);

                // Use onStateChange for robust updates (matches DotsAndBoxes pattern)
                r.onStateChange((state: any) => {
                    console.log("State Change:", state);

                    // Update Players
                    const pList: any[] = [];
                    if (state.players) {
                        state.players.forEach((p: any) => {
                            pList.push({
                                id: p.id,
                                name: p.name,
                                score: p.score,
                                isDrawer: p.isDrawer,
                                isOnline: p.isOnline
                            });
                        });
                    }
                    setPlayers(pList);
                    console.log("Players updated:", pList.length);

                    // Update Game Status
                    setGameStatus(state.phase);
                    setCurrentDrawer(state.currentDrawer);
                    setCurrentWord(state.currentWord);
                    setTimeLeft(state.timeLeft);
                    setRound(state.round);
                    setGameMode(state.gameMode || 'quiz');
                });

                // Message Handlers
                r.onMessage("chat", (msg) => {
                    setMessages(prev => [...prev, msg]);
                });
                r.onMessage("message", (msg) => {
                    setMessages(prev => [...prev, { id: 'system', name: 'System', text: msg.text, system: true }]);
                });
                r.onMessage("wordChoices", (choices: string[]) => {
                    console.log("Word Choices Received:", choices);
                    setWordChoices(choices);
                    setShowWordSelect(true);
                });
                r.onMessage("startDrawing", (data) => {
                    console.log("Start Drawing:", data);
                    setShowWordSelect(false);
                    setWordChoices([]);
                });
                r.onMessage("clear", () => {
                    // Canvas clearing is handled via simple event or prop, 
                    // but here we might need to dispatch an event to the canvas component
                    // For now, let's just log it. The Canvas component likely needs a ref or event listener.
                    // The previous code didn't handle 'clear' in the main component explicitly for canvas logic, 
                    // relying on passing 'room' to Canvas.
                    // We'll leave it as the room instance is passed to DrawingCanvas.
                });
            } catch (e: any) {
                console.error("Connection error full:", e);
                // Attempt to extract more info
                let errorMsg = e?.message || e?.error || JSON.stringify(e);
                if (errorMsg === "{}") errorMsg = "Server connection failed (possibly offline)";

                const msg = "接続エラー: " + errorMsg;
                setError(msg);
                // alert(msg); // Don't alert, just show UI
                roomRef.current = null;
            }
        };

        connect();

        return () => {
            ignore = true;
            if (roomRef.current) {
                console.log("Leaving room...");
                roomRef.current.leave();
                roomRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleStartGame = () => {
        room?.send("start");
    };

    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !room) return;

        // If guessing phase and not drawer, this is a guess
        // Otherwise it's chat
        room.send("guess", chatInput);
        setChatInput('');
    };

    const handleSelectWord = (word: string) => {
        room?.send("selectWord", word);
        setShowWordSelect(false);
    };

    const handleSetMode = (mode: 'quiz' | 'free') => {
        room?.send("setGameMode", mode);
    };



    if (error) {
        return (
            <div className={styles.gameContainer} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                    <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>接続エラー</h2>
                    <p style={{ marginBottom: '2rem', color: '#64748b' }}>{error}</p>
                    <button onClick={onBack} className={styles.primaryBtn}>戻る</button>
                </div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className={styles.gameContainer} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className={styles.title} style={{ fontSize: '1.5rem' }}>サーバーに接続中...</div>
            </div>
        );
    }

    const amIDrawer = room.sessionId === currentDrawer;

    // Copy Room ID
    const copyRoomId = () => {
        navigator.clipboard.writeText(room.roomId);
        alert("ルームIDをコピーしました: " + room.roomId);
    };

    return (
        <main className={styles.gameContainer} style={DRAWING_THEME}>
            {/* Header */}
            <header className={styles.header}>
                <button onClick={onBack} className={styles.backButton}>
                    <IconBack size={24} /> 退出
                </button>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className={styles.timerPill} style={{ color: timeLeft <= 10 && timeLeft > 0 ? '#ef4444' : '#3b82f6' }}>
                        {timeLeft > 0 ? `${timeLeft}s` : '待機中'}
                    </div>
                </div>

                <div className={styles.roundInfo}>
                    Round {round}
                </div>

                <div className={styles.roomId} onClick={copyRoomId} title="クリックしてコピー">
                    ID: {room.roomId}
                </div>
            </header>

            {/* Main Content */}
            <div className={styles.content}>

                {/* Stage (Canvas) */}
                <div className={styles.stage}>
                    {/* Status Text Pill */}
                    <div className={styles.statusOverlay} style={{ top: '20px' }}>
                        {gameStatus === 'drawing' ? (
                            amIDrawer ? `お題: ${currentWord}` : `描き手: ${players.find(p => p.id === currentDrawer)?.name || 'Unknown'}`
                        ) : gameStatus === 'selecting' ? (
                            `選出中: ${players.find(p => p.id === currentDrawer)?.name || 'Unknown'}`
                        ) : 'ロビー'}
                    </div>

                    <div className={styles.canvasWrapper}>
                        <DrawingCanvas
                            // @ts-ignore
                            room={room}
                            isDrawer={(gameMode === 'free') || (amIDrawer && gameStatus === 'drawing')}
                            room={room}
                            isDrawer={(gameMode === 'free') || (amIDrawer && gameStatus === 'drawing')}
                            width={800}
                            height={600}
                        />
                    </div>

                    {/* Tool Palette handled by DrawingCanvas internally for now */}

                    {/* Overlays */}
                    {(gameStatus === 'lobby' || !gameStatus) && (
                        <div className={styles.overlay}>
                            <h2 className={styles.title}>待機中 ({players.length}人)</h2>

                            {/* Mode Selection */}
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                <button
                                    onClick={() => handleSetMode('quiz')}
                                    style={{
                                        padding: '1rem 2rem', border: 'none', borderRadius: '12px',
                                        background: gameMode === 'quiz' ? '#3b82f6' : '#f1f5f9',
                                        color: gameMode === 'quiz' ? 'white' : '#64748b',
                                        fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                                        boxShadow: gameMode === 'quiz' ? '0 4px 10px rgba(59, 130, 246, 0.4)' : 'none'
                                    }}
                                >
                                    🎨 お絵かきクイズ
                                </button>
                                <button
                                    onClick={() => handleSetMode('free')}
                                    style={{
                                        padding: '1rem 2rem', border: 'none', borderRadius: '12px',
                                        background: gameMode === 'free' ? '#10b981' : '#f1f5f9',
                                        color: gameMode === 'free' ? 'white' : '#64748b',
                                        fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                                        boxShadow: gameMode === 'free' ? '0 4px 10px rgba(16, 185, 129, 0.4)' : 'none'
                                    }}
                                >
                                    ✏️ みんなでお絵かき
                                </button>
                            </div>

                            <p style={{ marginBottom: '2rem', fontSize: '1.2rem', opacity: 0.8 }}>
                                {gameMode === 'quiz' ? '出題者が絵を描き、他の人が当てるモードです' : '時間制限なしで自由にお絵かきを楽しむモードです'}
                            </p>

                            {players.length === 0 ? (
                                <p style={{ color: '#ef4444', fontWeight: 'bold' }}>参加者リストの取得中...</p>
                            ) : (
                                <button onClick={handleStartGame} className={styles.primaryBtn}>
                                    ゲーム開始
                                </button>
                            )}
                        </div>
                    )}

                    {gameStatus === 'selecting' && amIDrawer && showWordSelect && (
                        <div className={styles.overlay}>
                            <h2 className={styles.title} style={{ fontSize: '2rem' }}>お題を選んでください</h2>
                            <div className={styles.wordCardContainer}>
                                {wordChoices.map(w => (
                                    <button
                                        key={w}
                                        onClick={() => handleSelectWord(w)}
                                        className={styles.wordCard}
                                    >
                                        {w}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.playerList}>
                        <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>
                            PLAYERS
                        </div>
                        {players.map(p => (
                            <div key={p.id} className={`${styles.playerItem} ${p.id === currentDrawer ? styles.active : ''}`}>
                                <div className={styles.avatar}>
                                    {p.isDrawer ? '🎨' : <IconUser size={20} color="#64748b" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.name} {p.id === playerId && '(自分)'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Score: {p.score}</div>
                                </div>
                                {p.isOnline && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />}
                            </div>
                        ))}
                    </div>

                    <div className={styles.chatArea}>
                        <div className={styles.messages}>
                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    className={`${styles.message} ${m.system ? styles.systemMessage : (m.id === playerId ? styles.myMessage : styles.otherMessage)}`}
                                >
                                    {!m.system && m.id !== playerId && <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>{m.name}</div>}
                                    {m.text}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSendChat} className={styles.chatInputArea}>
                            <input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder={gameStatus === 'drawing' && !amIDrawer ? "答えを入力..." : "チャット..."}
                                className={styles.chatInput}
                            />
                            <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}>
                                <IconPen size={24} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
