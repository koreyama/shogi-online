'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import styles from './page.module.css';
import { client } from '@/lib/colyseus';
import { IconBack, IconHourglass } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import { Chat } from '@/components/Chat';
import MancalaBoard from '@/components/MancalaBoard';
import { GameState, Player, BoardState } from '@/lib/mancala/types';
import { MatchingWaitingScreen } from '@/components/game/MatchingWaitingScreen';

interface Props {
    mode: 'random' | 'room';
    roomId?: string;
}

export default function ColyseusMancalaGame({ mode, roomId: targetRoomId }: Props) {
    const { playerName, isLoaded: playerLoaded } = usePlayer();
    const { user, loading: authLoading } = useAuth();
    const [room, setRoom] = useState<Colyseus.Room<any> | null>(null);

    // Game State
    const [board, setBoard] = useState<BoardState>(new Array(14).fill(0));
    const [turn, setTurn] = useState<Player>('first');
    const [myRole, setMyRole] = useState<Player | null>(null);
    const [winner, setWinner] = useState<Player | 'draw' | null>(null);
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');

    const [playersInfo, setPlayersInfo] = useState({ first: "待機中...", second: "待機中..." });
    const [messages, setMessages] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [showDissolvedDialog, setShowDissolvedDialog] = useState(false);

    const roomRef = useRef<Colyseus.Room<any> | null>(null);

    useEffect(() => {
        if (authLoading || !playerLoaded) return;

        const init = async () => {
            try {
                // Fetch User Profile Name dynamically
                let currentName = playerName || "Player";
                if (user?.uid) {
                    try {
                        const { getUserProfile } = await import('@/lib/firebase/users');
                        const profile = await getUserProfile(user.uid);
                        if (profile?.displayName) {
                            currentName = profile.displayName;
                        }
                    } catch (e) {
                        console.warn("Failed to fetch user profile:", e);
                    }
                }

                let r: Colyseus.Room<any>;
                if (mode === 'room') {
                    if (targetRoomId) {
                        r = await client.joinById(targetRoomId, { name: currentName });
                    } else {
                        r = await client.create("mancala", { name: currentName, isPrivate: true });
                    }
                } else {
                    r = await client.joinOrCreate("mancala", { name: currentName });
                }

                setRoom(r);
                roomRef.current = r;

                r.onStateChange((state) => {
                    try {
                        if (!state || !state.board) return;

                        setBoard(Array.from(state.board));
                        setTurn(state.turn as Player);

                        if (state.winner !== "") {
                            setWinner(state.winner as Player | 'draw');
                            setStatus('finished');
                        } else if (state.gameStarted) {
                            setStatus('playing');
                        } else {
                            setStatus('waiting');
                        }

                        // Players
                        const newPlayersInfo = { first: "待機中...", second: "待機中..." };
                        state.players.forEach((p: any, sessionId: string) => {
                            if (p.role === "first") newPlayersInfo.first = p.name;
                            if (p.role === "second") newPlayersInfo.second = p.name;

                            if (sessionId === r.sessionId) {
                                setMyRole(p.role as Player);
                            }
                        });
                        setPlayersInfo(newPlayersInfo);
                    } catch (err) {
                        console.warn("State update error:", err);
                    }
                });

                r.onMessage("chat", (message) => {
                    setMessages(prev => [...prev, message]);
                });

                r.onMessage("gameStart", () => setStatus('playing'));
                r.onMessage("roomDissolved", () => setShowDissolvedDialog(true));

            } catch (e: any) {
                console.warn("Join error:", e);
                setError("ルームへの参加に失敗しました。");
            }
        };
        init();

        return () => {
            roomRef.current?.leave();
        };
    }, [authLoading, playerLoaded]);

    const handlePitClick = (pitIndex: number) => {
        if (status !== 'playing' || turn !== myRole) return;
        room?.send("move", pitIndex);
    };

    const handleSendMessage = (text: string) => {
        if (!room) return;
        room.send("chat", {
            id: `msg-${Date.now()}`,
            sender: playerName,
            text,
            timestamp: Date.now()
        });
    };

    const handleBackToTop = () => {
        window.location.reload();
    };

    // Portrait Check
    const [isPortrait, setIsPortrait] = useState(false);
    useEffect(() => {
        const checkOrientation = () => {
            // Simple check: height > width and width < 768 (mobile/tablet)
            setIsPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 768);
        };
        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    if (error) return <div className={styles.main}>{error}</div>;
    if (!room) return <div className={styles.main}>Loading...</div>;

    return (
        <main className={styles.main}>
            {/* Landscape Enforcement Overlay */}
            {isPortrait && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.95)', zIndex: 9999,
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', color: 'white', padding: '20px', textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>↻</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>画面を横向きにしてください</div>
                    <p style={{ marginTop: '10px', color: '#ccc' }}>マンカラは横画面でのプレイを推奨しています。</p>
                </div>
            )}

            <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 終了</button></div>
            <div className={styles.gameLayout}>
                <div className={styles.leftPanel}>
                    <div className={styles.playersSection}>
                        <div className={styles.playerInfo}>
                            <p>{myRole === 'first' ? playersInfo.second : playersInfo.first}</p>
                            <p>{myRole === 'first' ? 'Second (上)' : 'First (下)'}</p>
                        </div>
                        <div className={styles.playerInfo}>
                            <p>{playerName} (自分)</p>
                            <p>{myRole === 'first' ? 'First (下)' : 'Second (上)'}</p>
                        </div>
                    </div>
                    <div className={styles.chatSection}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                    </div>
                </div>
                <div className={styles.centerPanel}>
                    <div className={styles.turnIndicator}>
                        {turn === 'first' ? 'Firstの番 (下)' : 'Secondの番 (上)'}
                        {turn === myRole && ' (あなた)'}
                    </div>
                    <MancalaBoard
                        board={board}
                        onPitClick={handlePitClick}
                        turn={turn}
                        isMyTurn={turn === myRole}
                        winner={winner}
                        myRole={myRole}
                    />
                </div>
            </div>
            {status === 'finished' && winner && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>勝負あり！</h2>
                        <p>勝者: {winner === 'draw' ? '引き分け' : (winner === 'first' ? 'First (下)' : 'Second (上)')}</p>
                        <button onClick={handleBackToTop} className={styles.primaryBtn}>終了</button>
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
