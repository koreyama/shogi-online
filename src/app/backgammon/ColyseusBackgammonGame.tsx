'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import styles from './page.module.css';
import { BackgammonBoard } from '@/components/BackgammonBoard';
import { usePlayer } from '@/hooks/usePlayer';
import { IconHourglass, IconBack } from '@/components/Icons'; // Assuming IconBack exists or use text

// ... imports

// Types (simplified from Schema)
interface Point {
    count: number;
    color: number; // 0: None, 1: White, 2: Black
}

interface GameState {
    board: Point[];
    bar: { white: number; black: number };
    off: { white: number; black: number };
    dice: number[];
    turn: number;
    winner: string;
    whitePlayerId: string;
    blackPlayerId: string;
    whitePlayerName: string;
    blackPlayerName: string;
}

interface ColyseusBackgammonGameProps {
    mode: 'room' | 'random';
    roomId?: string;
    playerName: string;
}

export default function ColyseusBackgammonGame({ mode, roomId: initialRoomId, playerName }: ColyseusBackgammonGameProps) {
    // const { playerName } = usePlayer(); // Removed internal hook usage
    const [client, setClient] = useState<Colyseus.Client | null>(null);
    const [room, setRoom] = useState<Colyseus.Room<any> | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');
    const [myColor, setMyColor] = useState<number>(0); // 1: White, 2: Black
    const [actualRoomId, setActualRoomId] = useState<string>('');
    const [helpOpen, setHelpOpen] = useState(false);

    const dataEffectCalled = useRef(false);
    const roomRef = useRef<Colyseus.Room<any> | null>(null);

    useEffect(() => {
        if (dataEffectCalled.current) return;
        dataEffectCalled.current = true;

        // Determine Colyseus URL
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host = window.location.hostname;
        const port = process.env.NODE_ENV === 'production' ? '' : ':2567';
        const endpoint = process.env.NEXT_PUBLIC_COLYSEUS_URL || `${protocol}://${host}${port}`;

        const c = new Colyseus.Client(endpoint);
        setClient(c);

        const connect = async () => {
            try {
                let r: Colyseus.Room<any>;
                if (mode === 'room') {
                    if (initialRoomId) {
                        r = await c.joinById(initialRoomId, { playerName });
                    } else {
                        r = await c.create("backgammon", { playerName });
                    }
                } else {
                    r = await c.joinOrCreate("backgammon", { playerName });
                }

                setRoom(r);
                roomRef.current = r; // Store for cleanup
                setActualRoomId(r.roomId); // Ensure UI updates
                setStatus('waiting');

                r.onStateChange((state: any) => {
                    const mapped: GameState = {
                        board: state.board.map((p: any) => ({ count: p.count, color: p.color })),
                        bar: { white: state.bar.white, black: state.bar.black },
                        off: { white: state.off.white, black: state.off.black },
                        dice: state.dice.map((d: any) => d),
                        turn: state.turn,
                        winner: state.winner,
                        whitePlayerId: state.whitePlayerId,
                        blackPlayerId: state.blackPlayerId,
                        whitePlayerName: state.whitePlayerName,
                        blackPlayerName: state.blackPlayerName
                    };
                    setGameState(mapped);

                    if (state.whitePlayerId && state.blackPlayerId) {
                        if (state.winner) setStatus('finished');
                        else setStatus('playing');

                        if (r.sessionId === state.whitePlayerId) setMyColor(1);
                        else if (r.sessionId === state.blackPlayerId) setMyColor(2);
                    }
                });

            } catch (e: any) {
                console.error("Join error", e);
                const msg = e.message || "接続エラーが発生しました";
                alert(`エラー: ${msg}`);
            }
        };

        connect();

        return () => {
            if (roomRef.current) {
                roomRef.current.leave();
                roomRef.current = null;
            }
        };
    }, []);

    const handleRollResponse = () => {
        if (room) room.send("roll");
    };

    const handleMoveResponse = (from: number | "bar", to: number | "off") => {
        if (room) room.send("move", { from, to });
    };

    const handlePassResponse = () => {
        if (room) room.send("pass");
    };

    if (status === 'connecting') return <div className={styles.main}>Connecting...</div>;

    if (status === 'waiting') {
        // Check if we are actually waiting or just only me
        // If both IDs exist, we are playing
        if (gameState && gameState.whitePlayerId && gameState.blackPlayerId) {
            // Should have switched to playing in onStateChange, but just in case
        } else {
            return (
                <main className={styles.main}>
                    <div className={styles.gameContainer}>
                        <h1 className={styles.title}>Waiting...</h1>
                        <div className={styles.waitingAnimation}><IconHourglass size={64} color="var(--color-primary)" /></div>
                        <div className={styles.roomInfo}>
                            <p className={styles.roomLabel}>ルームID</p>
                            <p className={styles.roomId}>{actualRoomId}</p>
                            <p className={styles.roomHint}>友達にこのIDを伝えてください</p>
                        </div>
                    </div>
                </main>
            );
        }
    }



    // ... (existing code until return)

    return (
        <main className={styles.main}>
            {helpOpen && (
                <div className={styles.modalOverlay} onClick={() => setHelpOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h2 className={styles.modalTitle}>バックギャモンのルール</h2>
                        <div style={{ textAlign: 'left', lineHeight: '1.6', fontSize: '0.95rem' }}>
                            <p><strong>目的:</strong> 全ての駒を自分のインナーボード（ゴール手前）に集め、先に盤外へ出す（ベアオフ）ことです。</p>
                            <p style={{ marginTop: '0.5rem' }}><strong>移動:</strong></p>
                            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
                                <li>サイコロ2つの目に従って駒を進めます。</li>
                                <li><strong>白</strong>は反時計回り(24→1)、<strong>黒</strong>は時計回り(1→24)のようなイメージで互いにすれ違います（画面上の矢印に従ってください）。</li>
                                <li>相手の駒が2つ以上ある場所には止まれません（ブロック）。</li>
                            </ul>
                            <p style={{ marginTop: '0.5rem' }}><strong>ヒット:</strong></p>
                            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
                                <li>相手の駒が1つだけの場所（ブロット）に止まると、その駒はバー（中央）に飛ばされます。</li>
                                <li>飛ばされた駒は、サイコロの目で相手エリアから復帰しない限り動き出せません。</li>
                            </ul>
                            <p style={{ marginTop: '0.5rem' }}><strong>ベアオフ（ゴール）:</strong></p>
                            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
                                <li>全ての駒が自分のインナーボードに集まると、サイコロの目を使ってゴールできます。</li>
                            </ul>
                        </div>
                        <button onClick={() => setHelpOpen(false)} className={styles.primaryBtn} style={{ marginTop: '1rem', width: '100%' }}>閉じる</button>
                    </div>
                </div>
            )}

            <div className={styles.gameContainer} style={{ maxWidth: '1200px' }}>
                <div className={styles.header}>
                    <h1 className={styles.compactTitle}>Backgammon</h1>
                    <button onClick={() => setHelpOpen(true)} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #ccc', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>?</button>

                    {gameState?.winner && (
                        <div style={{ color: 'red', fontWeight: 'bold', fontSize: '1.5rem' }}>
                            WINNER: {gameState.winner}
                        </div>
                    )}
                </div>

                <BackgammonBoard
                    gameState={gameState!}
                    myColor={myColor}
                    onRoll={handleRollResponse}
                    onMove={handleMoveResponse}
                    onPass={handlePassResponse}
                />

                <div className={styles.roomInfo} style={{ marginTop: '1rem', padding: '1rem', width: '100%' }}>
                    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>Room ID: <strong>{actualRoomId}</strong></div>
                    <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* White Player */}
                        <div style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            background: '#f0f0f0',
                            border: myColor === 1 ? '3px solid #4CAF50' : '1px solid #ccc',
                            boxShadow: gameState?.turn === 1 ? '0 0 10px rgba(0,0,0,0.2)' : 'none',
                            opacity: gameState?.turn === 1 ? 1 : 0.7,
                            minWidth: '200px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>⚪ White</div>
                            <div style={{ fontSize: '1.1rem' }}>{gameState?.whitePlayerName || 'Waiting...'}</div>
                            {myColor === 1 && <div style={{ color: '#4CAF50', fontWeight: 'bold', marginTop: '0.5rem' }}>(あなた)</div>}
                        </div>

                        {/* VS or Turn Indicator */}
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#666' }}>VS</div>

                        {/* Black Player */}
                        <div style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            background: '#333',
                            color: 'white',
                            border: myColor === 2 ? '3px solid #4CAF50' : '1px solid #000',
                            boxShadow: gameState?.turn === 2 ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
                            opacity: gameState?.turn === 2 ? 1 : 0.7,
                            minWidth: '200px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>⚫ Black</div>
                            <div style={{ fontSize: '1.1rem' }}>{gameState?.blackPlayerName || 'Waiting...'}</div>
                            {myColor === 2 && <div style={{ color: '#4CAF50', fontWeight: 'bold', marginTop: '0.5rem' }}>(あなた)</div>}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
