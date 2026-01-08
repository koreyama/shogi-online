import React, { useEffect, useState, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import styles from './page.module.css';
import { client } from '@/lib/colyseus';
import { IconBack, IconHourglass } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import { Chat } from '@/components/Chat';
import CheckersBoard from '@/components/CheckersBoard';
import { MatchingWaitingScreen } from '@/components/game/MatchingWaitingScreen';
import { getValidMoves } from '@/lib/checkers/engine';
import { GameState as LocalGameState, Piece, Player, Board, Position } from '@/lib/checkers/types';

interface Props {
    mode: 'random' | 'room';
    roomId?: string;
}

export default function ColyseusCheckersGame({ mode, roomId: targetRoomId }: Props) {
    const { playerName, isLoaded: playerLoaded } = usePlayer();
    const { loading: authLoading } = useAuth();
    const [room, setRoom] = useState<Colyseus.Room<any> | null>(null);

    // Game State
    const [board, setBoard] = useState<Board>(Array(10).fill(null).map(() => Array(10).fill(null)));
    const [turn, setTurn] = useState<Player>('red');
    const [myRole, setMyRole] = useState<Player | null>(null);
    const [winner, setWinner] = useState<Player | 'draw' | null>(null);
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');
    const [mustJump, setMustJump] = useState(false);
    const [activePiece, setActivePiece] = useState<Position | null>(null);

    const [playersInfo, setPlayersInfo] = useState({ red: "待機中...", black: "待機中..." });
    const [messages, setMessages] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [showDissolvedDialog, setShowDissolvedDialog] = useState(false);
    const [selectedPos, setSelectedPos] = useState<Position | null>(null);

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
                        r = await client.create("checkers", { name: playerName, isPrivate: true });
                    }
                } else {
                    r = await client.joinOrCreate("checkers", { name: playerName });
                }

                setRoom(r);
                roomRef.current = r;

                r.onStateChange((state) => {
                    // Sync Board
                    const newBoard: Board = Array(10).fill(null).map(() => Array(10).fill(null));
                    state.board.forEach((p: any, key: string) => {
                        const [row, col] = key.split(',').map(Number);
                        newBoard[row][col] = { type: p.type, owner: p.owner } as Piece;
                    });
                    setBoard(newBoard);

                    setTurn(state.turn as Player);
                    setMustJump(state.mustJump);

                    if (state.activePiece) {
                        setActivePiece(JSON.parse(state.activePiece));
                    } else {
                        setActivePiece(null);
                    }

                    if (state.winner !== "") {
                        setWinner(state.winner as Player | 'draw');
                        setStatus('finished');
                    } else if (state.gameStarted) {
                        setStatus('playing');
                    } else {
                        setStatus('waiting');
                    }

                    // Players
                    const newPlayersInfo = { red: "待機中...", black: "待機中..." };
                    state.players.forEach((p: any, sessionId: string) => {
                        if (p.role === "red") newPlayersInfo.red = p.name;
                        if (p.role === "black") newPlayersInfo.black = p.name;

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

    const handleCellClick = (r: number, c: number) => {
        if (status !== 'playing' || turn !== myRole) return;

        const piece = board[r][c];
        const isMyPiece = piece && piece.owner === myRole;

        // Multi-jump restriction
        if (activePiece) {
            if (r !== activePiece.r || c !== activePiece.c) {
                if (!selectedPos) return; // Must move from activePiece
            }
        }

        if (isMyPiece) {
            setSelectedPos({ r, c });
        } else if (selectedPos) {
            // Try to move
            const localState: LocalGameState = {
                board,
                turn,
                winner,
                history: [],
                mustJump,
                activePiece
            };
            const validMoves = getValidMoves(localState, turn);
            const moveAction = validMoves.find(m =>
                m.from.r === selectedPos.r &&
                m.from.c === selectedPos.c &&
                m.to.r === r &&
                m.to.c === c
            );

            if (moveAction) {
                room?.send("move", moveAction);
                setSelectedPos(null);
            }
        }
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



    const localStateRef: LocalGameState = { board, turn, winner, history: [], mustJump, activePiece };
    const validMoves = getValidMoves(localStateRef, turn);

    return (
        <main className={styles.main}>
            <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 終了</button></div>
            <div className={styles.gameLayout}>
                <div className={styles.leftPanel}>
                    <div className={styles.playersSection}>
                        <div className={styles.playerInfo}>
                            <p>{myRole === 'red' ? playersInfo.black : playersInfo.red}</p>
                            <p>{myRole === 'red' ? '黒 (Black)' : '赤 (Red)'}</p>
                        </div>
                        <div className={styles.playerInfo}>
                            <p>{playerName} (自分)</p>
                            <p>{myRole === 'red' ? '赤 (Red)' : '黒 (Black)'}</p>
                        </div>
                    </div>
                    <div className={styles.chatSection}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                    </div>
                </div>
                <div className={styles.centerPanel}>
                    <div className={styles.turnIndicator}>
                        {turn === 'red' ? '赤の番' : '黒の番'}
                        {turn === myRole && ' (あなた)'}
                    </div>
                    <CheckersBoard
                        board={board}
                        turn={turn}
                        myRole={myRole}
                        validMoves={validMoves}
                        onCellClick={handleCellClick}
                        selectedPos={selectedPos}
                        lastMove={null}
                    />
                    {mustJump && <p style={{ color: '#fc8181', marginTop: '1rem', fontWeight: 'bold' }}>※ 強制ジャンプが必要です</p>}
                </div>
            </div>
            {status === 'finished' && winner && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>勝負あり！</h2>
                        <p>勝者: {winner === 'draw' ? '引き分け' : (winner === 'red' ? '赤' : '黒')}</p>
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
