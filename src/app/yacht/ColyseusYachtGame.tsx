'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './Yacht.module.css';
import { client } from '@/lib/colyseus';
import { Room } from 'colyseus.js';
import { CATEGORIES, Category, calculateScore } from './scoring';
import { IconHourglass, IconBack } from '@/components/Icons';
import { Chat } from '@/components/Chat';
import { MatchingWaitingScreen } from '@/components/game/MatchingWaitingScreen';

const MAX_ROLLS = 3;

const CATEGORY_LABELS: Record<Category, string> = {
    'Ones': '1 (Ones)',
    'Twos': '2 (Twos)',
    'Threes': '3 (Threes)',
    'Fours': '4 (Fours)',
    'Fives': '5 (Fives)',
    'Sixes': '6 (Sixes)',
    'Choice': 'Choice',
    '4 of a Kind': '4 Cards',
    'Full House': 'Full House',
    'S. Straight': 'S. Straight',
    'L. Straight': 'L. Straight',
    'Yacht': 'Yacht'
};

const Die = ({ value, held, rolling, onClick, disabled }: { value: number, held: boolean, rolling: boolean, onClick: () => void, disabled: boolean }) => {
    const rotations: Record<number, string> = {
        1: 'rotateX(0deg) rotateY(0deg)',
        6: 'rotateX(0deg) rotateY(180deg)',
        3: 'rotateX(0deg) rotateY(-90deg)',
        4: 'rotateX(0deg) rotateY(90deg)',
        5: 'rotateX(-90deg) rotateY(0deg)',
        2: 'rotateX(90deg) rotateY(0deg)',
    };

    return (
        <div
            className={`${styles.die_wrapper} ${held ? styles.held : ''} ${disabled ? styles.disabled : ''}`}
            onClick={onClick}
        >
            {held && <div className={styles.held_badge}>KEEP</div>}
            <div
                className={styles.die}
                style={{ transform: rotations[value] }}
            >
                {[1, 6, 3, 4, 5, 2].map((faceVal) => {
                    let faceClass = '';
                    if (faceVal === 1) faceClass = styles.front;
                    if (faceVal === 6) faceClass = styles.back;
                    if (faceVal === 3) faceClass = styles.right;
                    if (faceVal === 4) faceClass = styles.left;
                    if (faceVal === 5) faceClass = styles.top;
                    if (faceVal === 2) faceClass = styles.bottom;

                    const pips = Array(faceVal).fill(0);
                    return (
                        <div key={faceVal} className={`${styles.face} ${faceClass}`} data-value={faceVal}>
                            <div className={styles.face_inner}>
                                {pips.map((_, i) => (
                                    <div key={i} className={`${styles.pip} ${faceVal === 1 ? styles.pip_red : ''}`} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface ColyseusYachtGameProps {
    mode: 'random' | 'room';
    roomId?: string;
    playerName: string;
    playerId: string;
    onBack?: () => void;
}

export default function ColyseusYachtGame({ mode, roomId: propRoomId, playerName, playerId, onBack }: ColyseusYachtGameProps) {
    const [room, setRoom] = useState<Room | null>(null);
    const [gameState, setGameState] = useState<any>(null);
    const [myRole, setMyRole] = useState<'P1' | 'P2' | 'spectator'>('spectator');
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [playersInfo, setPlayersInfo] = useState<{ P1: string, P2: string }>({ P1: "Waiting...", P2: "Waiting..." });
    const [showDissolvedDialog, setShowDissolvedDialog] = useState(false);

    const roomRef = useRef<Room | null>(null);
    const dataEffectCalled = useRef(false);

    useEffect(() => {
        if (dataEffectCalled.current) return;
        dataEffectCalled.current = true;

        const connect = async () => {
            try {
                let r: Room;
                const options = { name: playerName, playerId: playerId };
                if (mode === 'room') {
                    if (propRoomId) {
                        r = await client.joinById(propRoomId, options);
                    } else {
                        r = await client.create("yacht", { ...options, isPrivate: true });
                    }
                } else {
                    r = await client.joinOrCreate("yacht", options);
                }

                setRoom(r);
                roomRef.current = r;
                console.log("Joined Yacht room:", r.roomId);

                r.onStateChange((state: any) => {
                    updateState(state, r.sessionId);
                });

                r.onMessage("gameStart", () => setStatus('playing'));
                r.onMessage("gameOver", (msg) => setStatus('finished'));
                r.onMessage("chat", (msg) => setMessages(prev => [...prev, msg]));
                r.onMessage("roomDissolved", () => {
                    setShowDissolvedDialog(true);
                });

            } catch (err: any) {
                console.error("Connection error:", err);
                setError(err.message || "接続に失敗しました");
            }
        };

        connect();
        return () => {
            if (roomRef.current) roomRef.current.leave();
        };
    }, []);

    const updateState = (state: any, sessionId: string) => {
        const p1 = Array.from(state.players.values()).find((p: any) => p.role === 'P1');
        const p2 = Array.from(state.players.values()).find((p: any) => p.role === 'P2');
        const me = state.players.get(sessionId);

        setPlayersInfo({
            P1: (p1 as any)?.name || "Waiting...",
            P2: (p2 as any)?.name || "Waiting..."
        });

        if (me) setMyRole((me as any).role);
        setGameState(state.toJSON());
        if (state.gameStarted && status !== 'finished') setStatus('playing');
        else if (!state.gameStarted) setStatus('waiting');
    };

    const handleRoll = () => {
        if (!room || status !== 'playing') return;
        room.send("roll");
    };

    const handleToggleHold = (index: number) => {
        if (!room || status !== 'playing') return;
        room.send("toggleHold", index);
    };

    const handleSelectCategory = (category: Category) => {
        if (!room || status !== 'playing') return;
        room.send("selectCategory", category);
    };

    const handleRestart = () => {
        if (!room || status !== 'finished') return;
        room.send("restart");
    };

    const handleSendMessage = (text: string) => {
        if (!room) return;
        room.send("chat", { id: `chat-${Date.now()}`, text });
    };

    const dissolvedModal = showDissolvedDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>対戦が終了しました</h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>相手が退出したため、ルームを解散します。</p>
                <button onClick={onBack} className={styles.roll_btn} style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}>メニューへ戻る</button>
            </div>
        </div>
    );

    if (error) {
        return (
            <div className={styles.container}>
                <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
                <button onClick={onBack} className={styles.restart_btn}>戻る</button>
            </div>
        );
    }




    if (!gameState) {
        return (
            <div className={styles.container}>
                <MatchingWaitingScreen
                    status={(status === 'waiting' || status === 'connecting') ? status : 'connecting'}
                    mode={mode}
                    roomId={room?.roomId}
                    onCancel={() => onBack ? onBack() : window.location.reload()}
                />
            </div>
        );
    }

    const { P1, P2 } = playersInfo;
    const scores = myRole === 'P1' ? gameState.scoresP1 : gameState.scoresP2;
    const isMyTurn = gameState.turn === myRole;

    const calculateTotal = (scoreMap: any) => {
        let total = 0;
        let upperSum = 0;
        const upperCats = ['Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes'];
        Object.entries(scoreMap).forEach(([key, val]) => {
            total += (val as number);
            if (upperCats.includes(key)) upperSum += (val as number);
        });
        if (upperSum >= 63) total += 35;
        return total;
    };

    const renderScoreColumn = (role: 'P1' | 'P2', scoreMap: any, isMe: boolean) => {
        const total = calculateTotal(scoreMap);
        const upperCats = ['Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes'];
        const upperSum = upperCats.reduce((acc, cat) => acc + (scoreMap[cat] || 0), 0);
        const bonus = upperSum >= 63 ? 35 : 0;
        const isUpperComplete = upperCats.every(cat => scoreMap[cat] !== undefined);

        return (
            <div className={styles.score_column} style={{ flex: 1, opacity: gameState.turn === role ? 1 : 0.6 }}>
                <div className={styles.score_header_small}>
                    {role === 'P1' ? P1 : P2} {isMe && "(あなた)"}
                    <span style={{ float: 'right' }}>{total}</span>
                </div>
                {CATEGORIES.map((cat, idx) => {
                    const isTaken = scoreMap[cat] !== undefined;
                    const canPick = isMe && isMyTurn && !isTaken && gameState.rollsLeft < 3 && !gameState.isRolling;
                    const potential = calculateScore(cat as Category, gameState.dice);

                    return (
                        <React.Fragment key={cat}>
                            {idx === 6 && (
                                <div className={styles.bonus_row_small}>
                                    <span>Bonus</span>
                                    <span>{isUpperComplete ? (bonus > 0 ? '+35' : '0') : `${upperSum}/63`}</span>
                                </div>
                            )}
                            <button
                                onClick={() => canPick && handleSelectCategory(cat as Category)}
                                disabled={!canPick}
                                className={`${styles.category_row} ${isTaken ? styles.category_row_taken : ''} ${canPick ? styles.category_row_active : ''}`}
                            >
                                <span className={styles.category_name}>{CATEGORY_LABELS[cat as Category]}</span>
                                <span className={styles.category_points}>
                                    {isTaken ? scoreMap[cat] : (canPick ? potential : '-')}
                                </span>
                            </button>
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={styles.container}>
            {dissolvedModal}
            <div className={styles.gameLayout}>
                <div className={styles.leftPanel}>
                    <div className={styles.topControls}>
                        <div className={styles.turnIndicator} style={{ flex: 1, color: isMyTurn ? '#3b82f6' : '#9ca3af' }}>
                            {isMyTurn ? "あなたの番です" : `${myRole === 'P1' ? P2 : P1}の番です`}
                        </div>
                        <button onClick={onBack} className={styles.exit_btn}>
                            <IconBack size={18} /> 退出
                        </button>
                    </div>
                    <div className={styles.game_area}>
                        <div className={`${styles.dice_stage} ${gameState.isRolling ? styles.rolling : ''}`}>
                            {gameState.dice.map((val: number, i: number) => (
                                <Die
                                    key={i}
                                    value={val}
                                    held={gameState.held[i]}
                                    rolling={gameState.isRolling && !gameState.held[i]}
                                    onClick={() => isMyTurn && handleToggleHold(i)}
                                    disabled={!isMyTurn || status === 'finished' || gameState.isRolling || gameState.rollsLeft === 3}
                                />
                            ))}
                        </div>
                        <div className={styles.controls}>
                            <button
                                onClick={handleRoll}
                                disabled={!isMyTurn || status === 'finished' || gameState.rollsLeft <= 0 || gameState.isRolling}
                                className={styles.roll_btn}
                            >
                                {gameState.rollsLeft > 0 ? `ロール (${gameState.rollsLeft})` : '役を選択'}
                            </button>
                        </div>
                    </div>
                    <div className={styles.chatSection}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                    </div>
                </div>

                <div className={styles.rightPanel}>
                    <div className={styles.score_card} style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem' }}>
                        {renderScoreColumn('P1', gameState.scoresP1, myRole === 'P1')}
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                        {renderScoreColumn('P2', gameState.scoresP2, myRole === 'P2')}
                    </div>
                </div>
            </div>

            {status === 'finished' && (
                <div className={styles.game_over_panel}>
                    <p className={styles.game_over_title}>ゲーム盤面</p>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        {gameState.winner === 'Draw' ? '引き分け' :
                            (gameState.winner === myRole ? 'あなたの勝ち！' : 'あなたの負け')}
                    </div>
                    <button onClick={handleRestart} className={styles.restart_btn}>もう一度遊ぶ</button>
                    <button onClick={onBack} className={styles.restart_btn} style={{ background: '#666', marginTop: '0.5rem' }}>メニューに戻る</button>
                </div>
            )}

            {/* Matching Screen Overlay */}
            {(status === 'waiting' || status === 'connecting') && (
                <MatchingWaitingScreen
                    status={status}
                    mode={mode}
                    roomId={room?.roomId}
                    onCancel={() => onBack ? onBack() : window.location.reload()}
                />
            )}
        </div>
    );
}
