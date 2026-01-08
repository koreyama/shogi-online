import React, { useEffect, useState, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import styles from '@/styles/GameMenu.module.css';
import gameStyles from './HitAndBlow.module.css';
import { client } from '@/lib/colyseus';
import { IconBack, IconDice, IconKey } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import { Chat } from '@/components/Chat';
import { COLORS } from './utils';
import { MatchingWaitingScreen } from '@/components/game/MatchingWaitingScreen';

const DIGIT_COUNT = 4;

interface Props {
    mode: 'random' | 'room';
    roomId?: string;
}

export default function ColyseusHitBlowGame({ mode, roomId: targetRoomId }: Props) {
    const { playerName, isLoaded: playerLoaded } = usePlayer();
    const { loading: authLoading } = useAuth();
    const [room, setRoom] = useState<Colyseus.Room<any> | null>(null);

    // Game State
    const [turn, setTurn] = useState<string>("P1");
    const [myRole, setMyRole] = useState<'P1' | 'P2' | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState("");
    const [allowDuplicates, setAllowDuplicates] = useState(false);
    const [playersInfo, setPlayersInfo] = useState({ P1: "待機中...", P2: "待機中..." });
    const [messages, setMessages] = useState<any[]>([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [showDissolvedDialog, setShowDissolvedDialog] = useState(false);

    // Interaction
    const [currentGuess, setCurrentGuess] = useState<string>('');
    const roomRef = useRef<Colyseus.Room<any> | null>(null);
    const historyEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (authLoading || !playerLoaded) return;

        const init = async () => {
            try {
                let r: Colyseus.Room<any>;
                if (mode === 'room') {
                    if (targetRoomId) r = await client.joinById(targetRoomId, { name: playerName });
                    else r = await client.create("hitblow", { name: playerName, allowDuplicates: false });
                } else {
                    r = await client.joinOrCreate("hitblow", { name: playerName });
                }

                setRoom(r);
                roomRef.current = r;

                r.onStateChange((state) => {
                    setTurn(state.turn);
                    setIsGameOver(state.isGameOver);
                    setWinner(state.winner);
                    setStatusMessage(state.statusMessage);
                    setGameStarted(state.gameStarted);
                    setAllowDuplicates(state.allowDuplicates);
                    setHistory(Array.from(state.history));

                    const newPlayersInfo = { P1: "待機中...", P2: "待機中..." };
                    state.players.forEach((p: any, sessionId: string) => {
                        newPlayersInfo[p.role as 'P1' | 'P2'] = p.name;
                        if (sessionId === r.sessionId) {
                            setMyRole(p.role as 'P1' | 'P2');
                        }
                    });
                    setPlayersInfo(newPlayersInfo);
                });

                r.onMessage("chat", (msg) => setMessages(prev => [...prev, msg]));
                r.onMessage("roomDissolved", () => setShowDissolvedDialog(true));

            } catch (e: any) {
                console.error("Join error:", e);
            }
        };
        init();
        return () => { roomRef.current?.leave(); };
    }, [authLoading, playerLoaded]);

    useEffect(() => {
        if (historyEndRef.current) historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleColorClick = (colorInitial: string) => {
        if (isGameOver || currentGuess.length >= DIGIT_COUNT || turn !== myRole) return;
        if (!allowDuplicates && currentGuess.includes(colorInitial)) return;
        setCurrentGuess(prev => prev + colorInitial);
    };

    const handleBackspace = () => {
        setCurrentGuess(prev => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if (currentGuess.length !== DIGIT_COUNT || turn !== myRole || isGameOver) return;
        room?.send("guess", { guess: currentGuess });
        setCurrentGuess('');
    };

    const handleBackToTop = () => { window.location.reload(); };

    if (!room) return <div className={styles.container}>読み込み中...</div>;



    const isMyTurn = turn === myRole && !isGameOver;

    return (
        <main className={styles.container}>
            <div className={styles.header}><button onClick={handleBackToTop} className={styles.backButton}><IconBack size={18} /> 終了</button></div>

            <div className={gameStyles.game_layout_wrapper}>
                {/* Left Panel: Chat and Info */}
                <div className={gameStyles.side_panel}>
                    <div className={gameStyles.status_panel}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                            <div className={gameStyles.player_card} style={{
                                borderLeft: `6px solid ${turn === 'P1' ? '#06b6d4' : '#e2e8f0'}`,
                                background: turn === 'P1' ? '#ecfeff' : 'white',
                                opacity: !isGameOver && turn !== 'P1' ? 0.7 : 1
                            }}>
                                <div className={gameStyles.player_role}>P1</div>
                                <div className={gameStyles.player_name}>
                                    {playersInfo.P1} {myRole === 'P1' && <span style={{ fontSize: '0.7rem', color: '#06b6d4' }}>(あなた)</span>}
                                </div>
                            </div>
                            <div className={gameStyles.player_card} style={{
                                borderLeft: `6px solid ${turn === 'P2' ? '#a855f7' : '#e2e8f0'}`,
                                background: turn === 'P2' ? '#fdf4ff' : 'white',
                                opacity: !isGameOver && turn !== 'P2' ? 0.7 : 1
                            }}>
                                <div className={gameStyles.player_role}>P2</div>
                                <div className={gameStyles.player_name}>
                                    {playersInfo.P2} {myRole === 'P2' && <span style={{ fontSize: '0.7rem', color: '#a855f7' }}>(あなた)</span>}
                                </div>
                            </div>
                        </div>

                        <div className={gameStyles.current_turn} style={{
                            backgroundColor: turn === 'P1' ? '#ecfeff' : '#fdf4ff',
                            color: turn === 'P1' ? '#0891b2' : '#c026d3',
                            border: `1px solid ${turn === 'P1' ? '#0891b2' : '#c026d3'}`
                        }}>
                            {turn === 'P1' ? playersInfo.P1 : playersInfo.P2}の番
                        </div>
                        {isGameOver && <div style={{ fontWeight: 'bold', marginTop: '12px', color: winner === myRole ? '#059669' : '#dc2626', fontSize: '1.1rem' }}>{statusMessage}</div>}
                    </div>
                    <Chat messages={messages} onSendMessage={(txt) => room.send("chat", { sender: playerName, text: txt })} myName={playerName} />
                </div>

                {/* Center Panel: Game Board */}
                <div className={gameStyles.center_panel}>
                    <div className={gameStyles.history_container}>
                        <div className={gameStyles.history_header}>
                            <div>担当</div>
                            <div>予想</div>
                            <div>HIT</div>
                            <div>BLOW</div>
                        </div>
                        {history.map((record, index) => (
                            <div key={index} className={gameStyles.history_row}>
                                <div style={{ fontSize: '0.7rem', color: record.player === 'P1' ? '#0891b2' : '#c026d3', fontWeight: 'bold' }}>
                                    {record.player}
                                </div>
                                <div className={gameStyles.guess_colors}>
                                    {record.guess.split('').map((char: string, i: number) => (
                                        <div key={i} className={`${gameStyles.history_dot} ${gameStyles['circle_' + char]}`} />
                                    ))}
                                </div>
                                <div className={`${gameStyles.result_badge} ${gameStyles.hit_badge}`}>{record.result.hit}</div>
                                <div className={`${gameStyles.result_badge} ${gameStyles.blow_badge}`}>{record.result.blow}</div>
                            </div>
                        ))}
                        <div ref={historyEndRef} />
                    </div>

                    <div className={gameStyles.input_display}>
                        <div className={gameStyles.input_slots}>
                            {Array.from({ length: DIGIT_COUNT }).map((_, i) => {
                                const char = currentGuess[i];
                                return (
                                    <div key={i} className={`${gameStyles.slot} ${char ? gameStyles.slot_filled : ''}`}>
                                        {char && <div className={`${gameStyles.circle} ${gameStyles['circle_' + char]}`} />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {isMyTurn && (
                        <div className={gameStyles.keypad_container}>
                            <div className={gameStyles.color_grid}>
                                {COLORS.map((color) => {
                                    const char = color[0];
                                    const isUsed = !allowDuplicates && currentGuess.includes(char);
                                    return (
                                        <button
                                            key={color}
                                            onClick={() => handleColorClick(char)}
                                            disabled={isUsed}
                                            className={`${gameStyles.color_btn} ${gameStyles['circle_' + char]}`}
                                        />
                                    );
                                })}
                            </div>
                            <div className={gameStyles.action_row}>
                                <button onClick={handleBackspace} className={gameStyles.action_btn}>⌫</button>
                                <button onClick={handleSubmit} disabled={currentGuess.length !== DIGIT_COUNT} className={`${gameStyles.action_btn} ${gameStyles.enter_btn}`}>ENTER</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Rules/Info */}
                <div className={gameStyles.side_panel}>
                    <div className={gameStyles.info_card}>
                        <h3>遊び方</h3>
                        <p>4色の並びを当ててください。</p>
                        <ul>
                            <li><strong>HIT</strong>: 色も位置も合っている</li>
                            <li><strong>BLOW</strong>: 色は合っているが位置が違う</li>
                        </ul>
                    </div>
                </div>
            </div>

            {showDissolvedDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>部屋が解散されました</h2>
                        <p>対戦相手が退出しました。</p>
                        <button onClick={handleBackToTop} className={styles.primaryBtn}>終了</button>
                    </div>
                </div>
            )}

            {/* Matching Screen Overlay */}
            {(!gameStarted && !isGameOver) && (
                <MatchingWaitingScreen
                    status="waiting"
                    mode={mode}
                    roomId={room?.roomId}
                    onCancel={handleBackToTop}
                />
            )}
        </main>
    );
}
