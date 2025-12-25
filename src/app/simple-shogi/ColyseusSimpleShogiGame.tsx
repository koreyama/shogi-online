import React, { useEffect, useState, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import styles from './page.module.css';
import SimpleShogiBoard from '@/components/SimpleShogiBoard';
import { GameState, Player, PieceType, Piece } from '@/lib/simple-shogi/types';
import { client } from '@/lib/colyseus';
import { IconBack } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import { soundManager } from '@/utils/sound';
import { Chat } from '@/components/Chat';
import SimpleShogiRuleGuide from '@/components/SimpleShogiRuleGuide';

// Map Colyseus types if needed, or stick to any for schema decoding
interface Props {
    mode: 'random' | 'room';
    roomId?: string;
}

const ROWS = 4;
const COLS = 3;

export default function ColyseusSimpleShogiGame({ mode, roomId: targetRoomId }: Props) {
    const { playerName, isLoaded: playerLoaded } = usePlayer();
    const { loading: authLoading } = useAuth();

    const [room, setRoom] = useState<Colyseus.Room<any> | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);

    // UI Local Interactions
    const [selectedPos, setSelectedPos] = useState<{ r: number, c: number } | null>(null);
    const [selectedHand, setSelectedHand] = useState<PieceType | null>(null);
    const [validMoves, setValidMoves] = useState<any[]>([]); // We might need to fetch available moves or calc locally

    const [myRole, setMyRole] = useState<Player | null>(null);
    const [playersInfo, setPlayersInfo] = useState({ sente: "待機中...", gote: "待機中..." });
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');
    const [error, setError] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [showDissolvedDialog, setShowDissolvedDialog] = useState(false);

    const roomRef = useRef<Colyseus.Room<any> | null>(null);

    // Convert Server schema to Client GameState
    const updateGameState = (state: any) => {
        // Board: 1D Array -> 2D
        const board: any[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
        state.board.forEach((p: any, idx: number) => {
            const r = Math.floor(idx / COLS);
            const c = idx % COLS;
            if (p.type !== "") {
                board[r][c] = {
                    type: p.type,
                    owner: p.owner,
                    id: p.id || `${p.owner}-${p.type}-${r}-${c}`
                };
            } else {
                board[r][c] = null;
            }
        });

        // Hands
        const hands = {
            sente: {} as any,
            gote: {} as any
        };
        // Server hands are arrays of pieces. Client expects { pawn: count, ... } ?
        // simple-shogi/types.ts says: type Hand = { [key in PieceType]?: number; };

        state.senteHand.forEach((p: any) => {
            hands.sente[p.type] = (hands.sente[p.type] || 0) + 1;
        });
        state.goteHand.forEach((p: any) => {
            hands.gote[p.type] = (hands.gote[p.type] || 0) + 1;
        });

        const newGameState: GameState = {
            board,
            hands,
            turn: state.turn,
            winner: state.winner || null,
            history: [] // We don't track full history here unless schema sends it
        };
        setGameState(newGameState);
    };

    // Client-side move validation (Reuse existing engine if possible, or simple check)
    // Ideally we import getValidMoves from engine, but it requires GameState matching perfectly.
    // Our constructed GameState should match.
    useEffect(() => {
        if (!gameState || !myRole) {
            setValidMoves([]);
            return;
        }

        import('@/lib/simple-shogi/engine').then(({ getValidMoves }) => {
            if (gameState.turn === myRole && status === 'playing') {
                const moves = getValidMoves(gameState, myRole);
                setValidMoves(moves);
            } else {
                setValidMoves([]);
            }
        });
    }, [gameState, myRole, status]);


    useEffect(() => {
        if (authLoading || !playerLoaded) return;

        const init = async () => {
            try {
                let r: Colyseus.Room<any>;
                if (mode === 'room') {
                    if (targetRoomId) {
                        r = await client.joinById(targetRoomId, { name: playerName });
                    } else {
                        r = await client.create("simpleshogi", { name: playerName, isPrivate: true });
                    }
                } else {
                    r = await client.joinOrCreate("simpleshogi", { name: playerName });
                }

                setRoom(r);
                roomRef.current = r;

                r.onStateChange((state) => {
                    updateGameState(state);

                    const players: any = {};
                    state.players.forEach((p: any, key: string) => {
                        players[p.role] = p.name;
                        if (key === r.sessionId) {
                            setMyRole(p.role as any);
                        }
                    });
                    setPlayersInfo({
                        sente: players.sente || "待機中...",
                        gote: players.gote || "待機中..."
                    });

                    if (state.winner) {
                        setStatus('finished');
                        soundManager.playWinSound();
                    } else if (state.gameStarted) {
                        if (status !== 'playing') {
                            setStatus('playing');
                            soundManager.playMoveSound();
                        }
                    } else {
                        setStatus('waiting');
                    }

                    // TODO: Detect single move sound via change?
                });

                r.onMessage("gameStart", () => setStatus('playing'));
                r.onMessage("roomDissolved", () => setShowDissolvedDialog(true));
                r.onMessage("gameOver", (data) => {
                    setStatus('finished');
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

    const handleCellClick = (r: number, c: number) => {
        if (!gameState || !myRole || gameState.turn !== myRole || status !== 'playing') return;

        const piece = gameState.board[r][c];

        // 1. Select Own Piece
        if (piece && piece.owner === myRole) {
            setSelectedPos({ r, c });
            setSelectedHand(null);
            return;
        }

        // 2. Move (if selected)
        if (selectedPos) {
            const moveAction = validMoves.find(m => !m.isDrop && m.from.r === selectedPos.r && m.from.c === selectedPos.c && m.to.r === r && m.to.c === c);
            if (moveAction) {
                room?.send("move", { type: "move", from: selectedPos, to: { r, c } });
                setSelectedPos(null);
                soundManager.playMoveSound(); // Optimistic sound
            }
        }
        // 3. Drop (if hand selected)
        else if (selectedHand) {
            const dropAction = validMoves.find(m => m.isDrop && m.type === selectedHand && m.to.r === r && m.to.c === c);
            if (dropAction) {
                room?.send("move", { type: "drop", pieceType: selectedHand, to: { r, c } });
                setSelectedHand(null);
                soundManager.playMoveSound();
            }
        }
    };

    const handleHandClick = (type: PieceType) => {
        if (!gameState || !myRole || gameState.turn !== myRole || status !== 'playing') return;
        setSelectedHand(type);
        setSelectedPos(null);
    };

    const handleSendMessage = (text: string) => {
        // Implement chat if desired (Colyseus supports broadcasting messages)
        // room?.send("chat", text);
        // For now, simpler to leave local or unimplemented unless requested.
        // User asked for UI preservation, so Chat component exists.
        // If we want chat, we need server support. 
        // Let's add local echo for now or skip.
    };

    const handleBackToTop = () => {
        window.location.reload();
    };

    if (error) return <div className={styles.main}>{error}</div>;
    if (!room) return <div className={styles.main}>読み込み中...</div>;

    if (status === 'waiting' || status === 'connecting') {
        return (
            <main className={styles.main}>
                <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={styles.gameContainer}>
                    <h1>待機中...</h1>
                    {status === 'connecting' ? <p>接続中...</p> : (
                        <>
                            <p>対戦相手を探しています</p>
                            {mode !== 'random' && (
                                <p>ルームID: <span className={styles.roomId}>{room.roomId}</span></p>
                            )}
                        </>
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
                            <p>{playersInfo[myRole === 'sente' ? 'gote' : 'sente']}</p>
                            <p>{myRole === 'sente' ? '後手' : '先手'}</p>
                        </div>
                        <div className={styles.playerInfo}>
                            <p>{playersInfo[myRole!]} (自分)</p>
                            <p>{myRole === 'sente' ? '先手' : '後手'}</p>
                        </div>
                    </div>
                    <div className={styles.chatSection}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} myName={playerName} />
                    </div>
                    <div className={styles.ruleSection}>
                        <SimpleShogiRuleGuide />
                    </div>
                </div>

                <div className={styles.centerPanel}>
                    <div className={styles.turnIndicator}>
                        {gameState?.turn === 'sente' ? '先手の番' : '後手の番'}
                        {gameState?.turn === myRole && ' (あなた)'}
                    </div>
                    {gameState && (
                        <SimpleShogiBoard
                            board={gameState.board}
                            hands={gameState.hands}
                            turn={gameState.turn}
                            myRole={myRole}
                            validMoves={validMoves}
                            onCellClick={handleCellClick}
                            onHandClick={handleHandClick}
                            selectedPos={selectedPos}
                            selectedHand={selectedHand}
                            lastMove={null} // Highlighting last move requires tracking in state
                        />
                    )}
                </div>
            </div>

            {showDissolvedDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>部屋が解散されました</h2>
                        <button onClick={handleBackToTop} className={styles.primaryBtn}>戻る</button>
                    </div>
                </div>
            )}

            {status === 'finished' && gameState?.winner && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>勝負あり！</h2>
                        <p>勝者: {gameState.winner === 'sente' ? '先手' : '後手'}</p>
                        <button onClick={handleBackToTop} className={styles.secondaryBtn}>終了</button>
                    </div>
                </div>
            )}
        </main>
    );
}
