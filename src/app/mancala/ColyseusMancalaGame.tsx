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

interface Props {
    mode: 'random' | 'room';
    roomId?: string;
}

export default function ColyseusMancalaGame({ mode, roomId: targetRoomId }: Props) {
    const { playerName, isLoaded: playerLoaded } = usePlayer();
    const { loading: authLoading } = useAuth();
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
                let r: Colyseus.Room<any>;
                if (mode === 'room') {
                    if (targetRoomId) {
                        r = await client.joinById(targetRoomId, { name: playerName });
                    } else {
                        r = await client.create("mancala", { name: playerName, isPrivate: true });
                    }
                } else {
                    r = await client.joinOrCreate("mancala", { name: playerName });
                }

                setRoom(r);
                roomRef.current = r;

                r.onStateChange((state) => {
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
                });

                r.onMessage("chat", (message) => {
                    setMessages(prev => [...prev, message]);
                });

                r.onMessage("gameStart", () => setStatus('playing'));
                r.onMessage("roomDissolved", () => setShowDissolvedDialog(true));

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

    if (error) return <div className={styles.main}>{error}</div>;
    if (!room) return <div className={styles.main}>Loading...</div>;

    if (status === 'waiting' || status === 'connecting') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={styles.gameContainer}>
                    <h1>待機中...</h1>
                    <div className={styles.waitingAnimation}><IconHourglass size={64} color="#d69e2e" /></div>
                    {mode !== 'random' && (
                        <p>ルームID: <span className={styles.roomId}>{room.roomId}</span></p>
                    )}
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
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
        </main>
    );
}
