import React, { useEffect, useState, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import styles from './page.module.css';
import { client } from '@/lib/colyseus';
import { IconBack, IconHourglass } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import { Chat } from '@/components/Chat';
import { generateGrid, hexToPixel, getHexPoints, getHexKey } from '@/lib/honeycomb/engine';
import { Hex, Player, HEX_SIZE } from '@/lib/honeycomb/types';
import { MatchingWaitingScreen } from '@/components/game/MatchingWaitingScreen';

interface Props {
    mode: 'random' | 'room';
    roomId?: string;
}

export default function ColyseusHoneycombGame({ mode, roomId: targetRoomId }: Props) {
    const { playerName, isLoaded: playerLoaded } = usePlayer();
    const { loading: authLoading } = useAuth();
    const [room, setRoom] = useState<Colyseus.Room<any> | null>(null);

    // Game State
    const [board, setBoard] = useState<Map<string, Player>>(new Map());
    const [turn, setTurn] = useState<Player>(1);
    const [myRole, setMyRole] = useState<Player | null>(null);
    const [winner, setWinner] = useState<Player | null>(null);
    const [winningHexes, setWinningHexes] = useState<string[]>([]);
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');
    const [winReason, setWinReason] = useState<string>('');

    const [playersInfo, setPlayersInfo] = useState({ p1: "待機中...", p2: "待機中..." });
    const [messages, setMessages] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [showDissolvedDialog, setShowDissolvedDialog] = useState(false);

    const roomRef = useRef<Colyseus.Room<any> | null>(null);
    const hexes = generateGrid();

    useEffect(() => {
        if (authLoading || !playerLoaded) return;

        const init = async () => {
            try {
                let r: Colyseus.Room<any>;
                if (mode === 'room') {
                    if (targetRoomId) {
                        r = await client.joinById(targetRoomId, { name: playerName });
                    } else {
                        r = await client.create("honeycomb", { name: playerName, isPrivate: true });
                    }
                } else {
                    r = await client.joinOrCreate("honeycomb", { name: playerName });
                }

                setRoom(r);
                roomRef.current = r;

                r.onStateChange((state) => {
                    // Update Board
                    const newBoard = new Map<string, Player>();
                    state.board.forEach((val: number, key: string) => {
                        newBoard.set(key, val as Player);
                    });
                    setBoard(newBoard);

                    setTurn(state.turn as Player);

                    if (state.winner !== 0) {
                        setWinner(state.winner as Player);
                        setStatus('finished');
                        setWinReason(state.winReason);

                        // Parse winning line
                        const line: string[] = [];
                        state.winningLine.forEach((k: string) => line.push(k));
                        setWinningHexes(line);
                    } else if (state.gameStarted) {
                        if (status !== 'playing') setStatus('playing');
                    } else {
                        setStatus('waiting');
                    }

                    // Update Players
                    const newPlayersInfo = { p1: "待機中...", p2: "待機中..." };
                    let myRoleResult: Player | null = myRole; // Persist

                    if (state.players) {
                        state.players.forEach((p: any, sessionId: string) => {
                            if (p.role === 1) newPlayersInfo.p1 = p.name;
                            if (p.role === 2) newPlayersInfo.p2 = p.name;

                            if (sessionId === r.sessionId) {
                                setMyRole(p.role as Player);
                                myRoleResult = p.role as Player;
                            }
                        });
                    }
                    setPlayersInfo(newPlayersInfo);

                    // Better approach: Update State to store JSON string "{name, role}" or object.
                    // Since I just defined Map<string>, I can store "Role:Name" string?
                    // "1:Name", "2:Name".

                    // Actually, let's just make `players` a MapSchema of a Schema class `HoneycombPlayer`?
                    // Previous games did this.
                    // For now, let's try to infer or just update schema again to be proper.
                    // Re-updating schema is cleaner.

                });

                r.onMessage("chat", (message) => {
                    setMessages(prev => [...prev, message]);
                });

                r.onMessage("gameStart", () => setStatus('playing'));
                r.onMessage("roomDissolved", () => setShowDissolvedDialog(true));
                r.onMessage("gameOver", (data) => {
                    // Handled by state change mostly
                });

            } catch (e: any) {
                console.error("Join error:", e);
                setError("ルームへの参加に失敗しました。");
            }
        };
        init();

        return () => {
            roomRef.current?.leave();
        };
    }, [authLoading, playerLoaded]);

    const handleHexClick = (hex: Hex) => {
        if (status !== 'playing' || turn !== myRole) return;
        const key = getHexKey(hex);
        if (board.has(key)) return;

        room?.send("move", { q: hex.q, r: hex.r, s: hex.s });
    };

    const handleSendMessage = (text: string) => {
        if (!room) return;
        const msg = {
            id: `msg-${Date.now()}`,
            sender: playerName,
            text,
            timestamp: Date.now()
        };
        // Optimistic update? No, let's wait for broadcast to keep order
        room.send("chat", msg);
    };

    const handleBackToTop = () => {
        window.location.reload();
    };

    if (error) return <div className={styles.main}>{error}</div>;
    if (!room) return <div className={styles.main}>Loading...</div>;



    return (
        <main className={styles.main}>
            <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 終了</button></div>
            <div className={styles.gameLayout}>
                <div className={styles.leftPanel}>
                    <div className={styles.playersSection}>
                        {/* 
                           p1 is Role 1 (Blue/Sente), p2 is Role 2 (Red/Gote)
                           If myRole is 1: Opponent is p2.
                           If myRole is 2: Opponent is p1.
                        */}
                        <div className={styles.playerInfo}>
                            <p>{myRole === 1 ? playersInfo.p2 : playersInfo.p1}</p>
                            <p>{myRole === 1 ? '赤 (後攻)' : '青 (先攻)'}</p>
                        </div>
                        <div className={styles.playerInfo}>
                            <p>{playerName} (自分)</p>
                            <p>{myRole === 1 ? '青 (先攻)' : '赤 (後攻)'}</p>
                        </div>
                    </div>
                    <div className={styles.chatSection}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                    </div>
                </div>
                <div className={styles.centerPanel}>
                    <div className={styles.turnIndicator}>
                        {turn === 1 ? '青の番' : '赤の番'}
                        {turn === myRole && ' (あなた)'}
                    </div>
                    {/* Responsive SVG with viewBox */}
                    <svg viewBox="-450 -400 900 800" className={styles.hexGrid}>
                        {hexes.map(hex => {
                            const { x, y } = hexToPixel(hex);
                            const key = getHexKey(hex);
                            const player = board.get(key);
                            const isWinning = winningHexes.includes(key);

                            return (
                                <polygon
                                    key={key}
                                    points={getHexPoints(HEX_SIZE)}
                                    transform={`translate(${x}, ${y})`}
                                    className={`${styles.hex} ${player ? styles[`player${player}`] : ''} ${isWinning ? styles.winning : ''}`}
                                    onClick={() => handleHexClick(hex)}
                                />
                            );
                        })}
                    </svg>
                </div>
            </div>
            {(status === 'finished') && winner && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>勝負あり！</h2>
                        <p>
                            {winner === myRole ? 'あなたの勝ち！' : 'あなたの負け...'}
                            <br />
                            {winReason === '4-in-row' ? '(4つ並びました)' : '(3目並べ反則負け)'}
                        </p>
                        <button onClick={handleBackToTop} className={styles.secondaryBtn}>終了</button>
                    </div>
                </div>
            )}
            {showDissolvedDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>部屋が解散されました</h2>
                        <button onClick={handleBackToTop} className={styles.primaryBtn}>戻る</button>
                    </div>
                </div>
            )}
            {/* Matching Screen Overlay */}
            {(status === 'waiting' || status === 'connecting') && (
                <MatchingWaitingScreen
                    status={status}
                    mode={mode}
                    roomId={room?.roomId}
                    onCancel={handleBackToTop}
                />
            )}
        </main>
    );
}
