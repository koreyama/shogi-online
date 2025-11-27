'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './DrawingGameContent.module.css';
import { DrawingCanvas } from '@/components/drawing/DrawingCanvas';
import { ChatArea } from '@/components/drawing/ChatArea';
import { Timer } from '@/components/drawing/Timer';
import { db } from '@/lib/firebase';
import { ref, onValue, update, onDisconnect, remove } from 'firebase/database';
import { usePlayer } from '@/hooks/usePlayer';
import { DrawingGameState } from '@/lib/drawing/types';
import { getRandomWords } from '@/lib/drawing/words';
import { IconPen, IconBack, IconUser, IconPalette } from '@/components/Icons';

export default function DrawingGameContent() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;
    const { playerId, playerName } = usePlayer();

    const [gameState, setGameState] = useState<DrawingGameState | null>(null);
    const [players, setPlayers] = useState<Record<string, any>>({});
    const [wordChoices, setWordChoices] = useState<string[]>([]);

    useEffect(() => {
        if (!roomId || !playerId) return;

        // Presence logic
        const playerRef = ref(db, `drawing_rooms/${roomId}/players/${playerId}`);
        const roomRef = ref(db, `drawing_rooms/${roomId}`);

        // Add player to room
        update(playerRef, {
            id: playerId,
            name: playerName,
            score: 0,
            isOnline: true
        });

        // Remove on disconnect
        onDisconnect(playerRef).remove();

        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setPlayers(data.players || {});
                if (data.gameState) {
                    setGameState(data.gameState);
                } else {
                    // Initialize game state if missing (First load)
                    if (data.hostId === playerId && data.status === 'waiting') {
                        // Auto start for testing if 1+ players (usually 2+)
                        // For now, let's keep it manual start via UI or just auto-init state
                    }
                }
            } else {
                // Room deleted
                router.push('/drawing');
            }
        });

        return () => {
            unsubscribe();
            remove(playerRef); // Remove self on unmount
        };
    }, [roomId, playerId, playerName, router]);

    // Helper: Am I the drawer?
    const isDrawer = gameState?.currentDrawerId === playerId;

    const startGame = async () => {
        const playerIds = Object.keys(players);
        if (playerIds.length < 1) return; // Allow 1 for testing

        const firstDrawer = playerIds[0];
        const choices = getRandomWords(3);

        const initialState: DrawingGameState = {
            status: 'selecting',
            currentDrawerId: firstDrawer,
            currentWord: '',
            strokes: {}, // Will be stored in separate node usually, but type has it
            round: 1,
            maxRounds: 3,
            turnEndTime: 0
        };

        await update(ref(db, `drawing_rooms/${roomId}`), {
            status: 'playing',
            gameState: initialState,
            wordChoices: choices // Store choices temporarily in room root
        });
    };

    const handleWordSelect = async (word: string) => {
        if (!isDrawer) return;

        await update(ref(db, `drawing_rooms/${roomId}/gameState`), {
            status: 'drawing',
            currentWord: word,
            turnEndTime: Date.now() + 60000 // 60 seconds
        });
        // Clear choices
        await update(ref(db, `drawing_rooms/${roomId}`), { wordChoices: null });
    };

    const handleCorrectGuess = async () => {
        // Called by ChatArea when someone guesses right
        // In a real app, verify server-side. Here, we trust the client for MVP.

        // Update score
        const currentScore = players[playerId]?.score || 0;
        await update(ref(db, `drawing_rooms/${roomId}/players/${playerId}`), {
            score: currentScore + 10
        });

        // Move to next turn
        await nextTurn();
    };

    const nextTurn = async () => {
        // Simple rotation logic
        const playerIds = Object.keys(players);
        const currentIndex = playerIds.indexOf(gameState?.currentDrawerId || '');
        const nextIndex = (currentIndex + 1) % playerIds.length;
        const nextDrawer = playerIds[nextIndex];

        // Check if round ended (if next is first player again)
        // For MVP, just rotate forever or until maxRounds

        const choices = getRandomWords(3);

        await update(ref(db, `drawing_rooms/${roomId}`), {
            'gameState/status': 'selecting',
            'gameState/currentDrawerId': nextDrawer,
            'gameState/currentWord': '',
            'gameState/strokes': null, // Clear strokes
            wordChoices: choices
        });

        // Also clear strokes node
        await update(ref(db, `drawing_rooms/${roomId}/strokes`), {});
    };

    // Listen for word choices if I am drawer and status is selecting
    useEffect(() => {
        if (isDrawer && gameState?.status === 'selecting') {
            const choicesRef = ref(db, `drawing_rooms/${roomId}/wordChoices`);
            onValue(choicesRef, (snap) => {
                const choices = snap.val();
                if (choices) setWordChoices(choices);
            }, { onlyOnce: true });
        }
    }, [isDrawer, gameState?.status, roomId]);


    if (!gameState) {
        return (
            <div className={styles.waitingScreen}>
                <div className={styles.waitingCard}>
                    <h1>待機中...</h1>
                    <p style={{ fontSize: '1.2rem', color: '#6b7280', margin: '1rem 0' }}>
                        参加者: {Object.keys(players).length}人
                    </p>
                    <div className={styles.playerList} style={{ maxHeight: '200px', marginBottom: '2rem' }}>
                        {Object.values(players).map((p: any) => (
                            <div key={p.id} className={styles.playerItem}>
                                <span className={styles.playerName}><IconUser size={18} /> {p.name}</span>
                            </div>
                        ))}
                    </div>
                    {players[playerId]?.id === Object.keys(players)[0] && ( // Host check
                        <button onClick={startGame} className={styles.startButton}>ゲーム開始</button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <main className={styles.main}>
            {/* Left: Canvas */}
            <div className={styles.canvasSection}>
                <div className={styles.header}>
                    <div className={styles.roundInfo} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <IconPalette size={24} color="#d53f8c" />
                        <span className={styles.roundNumber}>ROUND {gameState.round}</span>
                        <span className={styles.drawerName}>
                            Drawer: {players[gameState.currentDrawerId]?.name}
                        </span>
                    </div>
                    <div className={styles.gameStatus}>
                        <div className={styles.statusText}>
                            {gameState.status === 'selecting' ? 'お題選択中...' :
                                gameState.status === 'drawing' ? (isDrawer ? `お題: ${gameState.currentWord}` : '???') :
                                    '結果発表'}
                        </div>
                        {gameState.status === 'drawing' && (
                            <Timer endTime={gameState.turnEndTime} onTimeUp={nextTurn} />
                        )}
                    </div>
                    <button onClick={() => router.push('/drawing')} className={styles.backButton}>
                        <IconBack size={20} /> 退出
                    </button>
                </div>

                {gameState.status === 'selecting' && isDrawer && (
                    <div className={styles.overlay}>
                        <div className={styles.overlayContent}>
                            <h2>お題を選んでください</h2>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                {wordChoices.map(word => (
                                    <button key={word} onClick={() => handleWordSelect(word)} className={styles.wordButton}>
                                        {word}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <DrawingCanvas
                    roomId={roomId}
                    isDrawer={isDrawer && gameState.status === 'drawing'}
                    width={800}
                    height={600}
                />
            </div>

            {/* Right: Chat & Players */}
            <div className={styles.sidebar}>
                <div className={styles.playerList}>
                    <h3 className={styles.sectionTitle}>参加者</h3>
                    {Object.values(players).map((p: any) => (
                        <div key={p.id} className={`${styles.playerItem} ${p.id === gameState.currentDrawerId ? styles.active : ''}`}>
                            <span className={styles.playerName}>
                                {p.name}
                                {p.id === gameState.currentDrawerId && <IconPen size={16} color="#4f46e5" />}
                            </span>
                            <span className={styles.playerScore}>{p.score || 0}pt</span>
                        </div>
                    ))}
                </div>

                <div className={styles.chatContainer}>
                    <ChatArea
                        roomId={roomId}
                        myId={playerId || ''}
                        myName={playerName || 'Guest'}
                        currentWord={gameState.currentWord}
                        onCorrectGuess={handleCorrectGuess}
                        isDrawer={isDrawer}
                    />
                </div>
            </div>
        </main>
    );
}
