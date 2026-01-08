'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './DotsAndBoxes.module.css';
import { client } from '@/lib/colyseus';
import { Room } from 'colyseus.js';
import { IconBack, IconCopy, IconCheck } from '@/components/Icons';
import { Chat } from '@/components/Chat';
import { MatchingWaitingScreen } from '@/components/game/MatchingWaitingScreen';

type PlayerRole = 'P1' | 'P2';
const ROWS = 6;
const COLS = 6;

// Helper to convert flat array to 2D
function to2D<T>(arr: any, rows: number, cols: number): T[][] {
    if (!arr) return [];
    const res: T[][] = [];
    const flat = Array.from(arr);
    for (let i = 0; i < rows; i++) {
        res.push(flat.slice(i * cols, (i + 1) * cols) as T[]);
    }
    return res;
}

interface Props {
    playerName: string;
    playerId: string;
    onBack: () => void;
    mode: 'random' | 'room';
    roomId?: string;
}

export default function ColyseusDotsAndBoxesGame({ playerName, playerId, onBack, mode, roomId: targetRoomId }: Props) {
    const [room, setRoom] = useState<Room | null>(null);
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');
    const [error, setError] = useState<string | null>(null);
    const [gameState, setGameState] = useState<any>(null);
    const [myRole, setMyRole] = useState<PlayerRole | null>(null);
    const [playersInfo, setPlayersInfo] = useState<{ P1: string, P2: string }>({ P1: '対戦相手を待っています...', P2: '対戦相手を待っています...' });
    const [messages, setMessages] = useState<{ id: string, sender: string, text: string, timestamp: number }[]>([]);
    const [showCopyTooltip, setShowCopyTooltip] = useState(false);
    const [showDissolvedDialog, setShowDissolvedDialog] = useState(false);

    // Refs to prevent double connection in development
    const dataEffectCalled = useRef(false);
    const roomRef = useRef<Room | null>(null);

    useEffect(() => {
        if (dataEffectCalled.current) return;
        dataEffectCalled.current = true;

        const connect = async () => {
            let currentRoom: Room;
            try {
                if (mode === 'random') {
                    currentRoom = await client.joinOrCreate("dots_and_boxes", { name: playerName, playerId });
                } else {
                    if (targetRoomId) {
                        currentRoom = await client.joinById(targetRoomId, { name: playerName, playerId });
                    } else {
                        currentRoom = await client.create("dots_and_boxes", { name: playerName, playerId, isPrivate: true });
                    }
                }

                setRoom(currentRoom);
                roomRef.current = currentRoom;
                console.log("Joined room:", currentRoom.roomId);

                currentRoom.onStateChange((state) => {
                    const players: any = {};
                    let p1Nick = '対戦相手を待っています...';
                    let p2Nick = '対戦相手を待っています...';
                    let myR: PlayerRole | null = null;

                    state.players.forEach((p: any, sessionId: string) => {
                        if (p.role === 'P1') p1Nick = p.name;
                        if (p.role === 'P2') p2Nick = p.name;
                        if (sessionId === currentRoom.sessionId) myR = p.role as PlayerRole;
                    });

                    setPlayersInfo({ P1: p1Nick, P2: p2Nick });
                    setMyRole(myR);

                    const json = state.toJSON();
                    setGameState({
                        hLines: to2D<number>(json.hLines, ROWS, COLS - 1),
                        vLines: to2D<number>(json.vLines, ROWS - 1, COLS),
                        boxes: to2D<number>(json.boxes, ROWS - 1, COLS - 1),
                        currentPlayer: json.currentPlayer,
                        winner: json.winner,
                        scores: { 1: 0, 2: 0 }, // Will calculate below
                        gameStarted: json.gameStarted
                    });

                    // Calculate scores from players map
                    const scores = { 1: 0, 2: 0 };
                    state.players.forEach((p: any) => {
                        if (p.role === 'P1') scores[1] = p.score;
                        if (p.role === 'P2') scores[2] = p.score;
                    });
                    setGameState((prev: any) => prev ? { ...prev, scores } : null);

                    if (json.winner !== 0) setStatus('finished');
                    else if (json.gameStarted) setStatus('playing');
                    else setStatus('waiting');
                });

                currentRoom.onMessage("roomDissolved", () => {
                    setShowDissolvedDialog(true);
                });

                currentRoom.onMessage("chat", (message: any) => {
                    setMessages((prev) => [...prev, message]);
                });

            } catch (e: any) {
                console.error(e);
                setError("接続に失敗しました。");
            }
        };

        connect();
        return () => {
            if (roomRef.current) {
                roomRef.current.leave();
                roomRef.current = null;
            }
        };
    }, [mode, targetRoomId, playerName]);

    const handleLineClick = (type: 'h' | 'v', r: number, c: number) => {
        if (!room || status !== 'playing') return;
        const myNum = myRole === 'P1' ? 1 : 2;
        if (gameState.currentPlayer !== myNum) return;
        room.send("placeLine", { type, r, c });
    };

    const handleRestart = () => { room?.send("restart"); };

    const copyRoomId = () => {
        if (room) {
            navigator.clipboard.writeText(room.roomId);
            setShowCopyTooltip(true);
            setTimeout(() => setShowCopyTooltip(false), 2000);
        }
    };

    if (error) {
        return (
            <div className={styles.container}>
                <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
                <button onClick={onBack} className={styles.backButton}>戻る</button>
            </div>
        );
    }

    const dissolvedModal = showDissolvedDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>対戦が終了しました</h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>相手が退出したため、ルームを解散します。</p>
                <button onClick={onBack} className={styles.primaryBtn} style={{ width: '100%' }}>メニューへ戻る</button>
            </div>
        </div>
    );



    const { hLines, vLines, boxes, currentPlayer, winner, scores } = gameState || { hLines: [], vLines: [], boxes: [], currentPlayer: 1, winner: 0, scores: { 1: 0, 2: 0 } };
    const isGameOver = status === 'finished';
    const isMyTurn = !isGameOver && ((myRole === 'P1' && currentPlayer === 1) || (myRole === 'P2' && currentPlayer === 2));

    const DOT_SPACING = 50;
    const DOT_RADIUS = 6;
    const PADDING = 20;

    return (
        <div className={styles.game_layout_wrapper}>
            {dissolvedModal}

            {/* Left Panel */}
            <div className={styles.side_panel}>
                <div className={styles.status_panel}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                        <div className={`${styles.player_card} ${currentPlayer === 1 && !isGameOver ? styles.player_card_active + ' ' + styles.p1_active : ''}`} style={{ opacity: !isGameOver && currentPlayer !== 1 ? 0.7 : 1 }}>
                            <span className={`${styles.player_name} ${styles.p1_name}`}>{playersInfo.P1} {myRole === 'P1' && '(あなた)'}</span>
                            <span className={styles.player_score}>{scores[1]}</span>
                        </div>
                        <div className={`${styles.player_card} ${currentPlayer === 2 && !isGameOver ? styles.player_card_active + ' ' + styles.p2_active : ''}`} style={{ opacity: !isGameOver && currentPlayer !== 2 ? 0.7 : 1 }}>
                            <span className={`${styles.player_name} ${styles.p2_name}`}>{playersInfo.P2} {myRole === 'P2' && '(あなた)'}</span>
                            <span className={styles.player_score}>{scores[2]}</span>
                        </div>
                    </div>

                    <div className={styles.current_turn} style={{
                        background: currentPlayer === 1 ? '#eff6ff' : '#fff1f2',
                        color: currentPlayer === 1 ? '#2563eb' : '#e11d48',
                        border: `1px solid ${currentPlayer === 1 ? '#2563eb' : '#e11d48'}`,
                        padding: '0.4rem 1rem', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: 'bold'
                    }}>
                        {currentPlayer === 1 ? playersInfo.P1 : playersInfo.P2}の番
                    </div>

                    {isGameOver && (
                        <div className={styles.game_over} style={{ marginTop: '1rem' }}>
                            <h2 className={styles.winner_text} style={{ fontSize: '1.5rem' }}>
                                {winner === 3 ? "引き分け!" : `${winner === 1 ? playersInfo.P1 : playersInfo.P2} の勝ち!`}
                            </h2>
                            <button onClick={handleRestart} className={styles.play_again_btn}>もう一度遊ぶ</button>
                        </div>
                    )}
                </div>
                {room && <Chat messages={messages} onSendMessage={(txt: string) => room.send("chat", { sender: playerName, text: txt })} myName={playerName} />}
                <button onClick={onBack} className={styles.backButton} style={{ marginTop: '0.5rem', width: '100%' }}>退会する</button>
            </div>

            {/* Center Panel */}
            <div className={styles.center_panel}>
                <div className={styles.board_wrapper}>
                    <svg width={(COLS - 1) * DOT_SPACING + PADDING * 2} height={(ROWS - 1) * DOT_SPACING + PADDING * 2}>
                        <g transform={`translate(${PADDING}, ${PADDING})`}>
                            {boxes.map((row: any[], r: number) => row.map((owner: number, c: number) => owner > 0 && (
                                <rect key={`box-${r}-${c}`} x={c * DOT_SPACING} y={r * DOT_SPACING} width={DOT_SPACING} height={DOT_SPACING} className={owner === 1 ? styles.box_p1 : styles.box_p2} />
                            )))}
                            {hLines.map((row: any[], r: number) => row.map((owner: number, c: number) => (
                                <rect key={`h-${r}-${c}`} x={c * DOT_SPACING} y={r * DOT_SPACING - 5} width={DOT_SPACING} height={10} rx={4}
                                    className={`${styles.line} 
                                        ${owner === 1 ? styles.line_p1 : ''} 
                                        ${owner === 2 ? styles.line_p2 : ''} 
                                        ${owner === 0 && !isGameOver ? styles.line_inactive : ''}`}
                                    fill={owner !== 0 ? undefined : 'transparent'}
                                    onClick={() => handleLineClick('h', r, c)}
                                />
                            )))}
                            {vLines.map((row: any[], r: number) => row.map((owner: number, c: number) => (
                                <rect key={`v-${r}-${c}`} x={c * DOT_SPACING - 5} y={r * DOT_SPACING} width={10} height={DOT_SPACING} rx={4}
                                    className={`${styles.line} 
                                        ${owner === 1 ? styles.line_p1 : ''} 
                                        ${owner === 2 ? styles.line_p2 : ''} 
                                        ${owner === 0 && !isGameOver ? styles.line_inactive : ''}`}
                                    fill={owner !== 0 ? undefined : 'transparent'}
                                    onClick={() => handleLineClick('v', r, c)}
                                />
                            )))}
                            {Array(ROWS).fill(0).map((_, r) => Array(COLS).fill(0).map((_, c) => (
                                <circle key={`dot-${r}-${c}`} cx={c * DOT_SPACING} cy={r * DOT_SPACING} r={DOT_RADIUS} className={styles.dot} />
                            )))}
                        </g>
                    </svg>
                </div>
                <div className={styles.instructions}>
                    <p>点と点の間をクリックして線を引きます。四角形を完成させるとポイント獲得＆もう一度行動できます。</p>
                </div>
            </div>


            {/* Matching Screen Overlay */}
            {
                ((status === 'waiting' || status === 'connecting') || !gameState) && (
                    <MatchingWaitingScreen
                        status={status === 'waiting' ? 'waiting' : 'connecting'}
                        mode={mode}
                        roomId={room?.roomId}
                        onCancel={onBack}
                    />
                )
            }
        </div >
    );
}
