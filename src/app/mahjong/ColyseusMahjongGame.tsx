'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import styles from './page.module.css';
import { client } from '@/lib/colyseus';
import { Room } from 'colyseus.js';
import { IconHourglass, IconBack, IconUser, IconHelp } from '@/components/Icons';
import { YakuListModal } from './YakuListModal';
import { audioManager } from '@/lib/mahjong/audio';
import { TileGraphics } from './TileGraphics';
import HideChatBot from '@/components/HideChatBot';

interface ColyseusMahjongGameProps {
    mode: 'random' | 'room';
    roomId?: string;
    userData: { name: string; id: string };
    options?: any;
}

// ─── Tile component ───
function TileComponent({
    tile,
    isSelected,
    onClick,
    size = 'normal',
    isDora = false,
}: {
    tile: { suit: string; value: number; isRed?: boolean };
    isSelected?: boolean;
    onClick?: () => void;
    size?: 'normal' | 'small';
    isDora?: boolean;
}) {
    return (
        <div
            className={`${styles.tile} ${isSelected ? styles.tileSelected : ''} ${size === 'small' ? styles.tileSmall : ''} ${isDora ? styles.tileDora : ''}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className={styles.tileContent}>
                <TileGraphics suit={tile.suit} value={tile.value} size={size} />
            </div>
            {tile.isRed && <span className={styles.redDot} />}
        </div>
    );
}

// ─── CutIn effect ───
function CutInEffect({ text }: { text: string | null }) {
    if (!text) return null;
    let cls = '';
    if (text === 'ロン' || text === 'ツモ') cls = styles.cutInTextRon;
    if (text === 'リーチ') cls = styles.cutInTextRiichi;
    return (
        <div className={styles.cutInOverlay}>
            <div className={`${styles.cutInText} ${cls}`}>{text}</div>
        </div>
    );
}

// ─── Player info panel ───
function PlayerPanel({ player, isCurrentTurn }: { player: any; isCurrentTurn: boolean }) {
    const wMap: Record<string, string> = { east: '東', south: '南', west: '西', north: '北' };
    return (
        <div className={styles.playerPanel}>
            <div className={styles.playerInfo}>
                <span className={styles.wind}>{wMap[player.wind] || '?'}</span>
                <span className={styles.playerName}>{player.name}</span>
                <span className={styles.score}>{(player.score ?? 25000).toLocaleString()}</span>
                {player.isRiichi && <span className={styles.riichiIndicator}>立</span>}
                {isCurrentTurn && <span className={styles.turnIndicator}>●</span>}
            </div>
        </div>
    );
}

// ─── Local helpers for call validity ───
function canPonLocal(hand: any[], discard: any): boolean {
    if (!discard) return false;
    const count = hand.filter((t: any) => t.suit === discard.suit && t.value === discard.value).length;
    return count >= 2;
}

function canChiLocal(hand: any[], discard: any, mySeat: number, discarderSeat: number, totalPlayers: number): boolean {
    if (!discard || discard.suit === 'honor') return false;
    // Can only chi from the player to our left (previous seat)
    const leftSeat = (mySeat - 1 + totalPlayers) % totalPlayers;
    if (discarderSeat !== leftSeat) return false;
    const v = discard.value;
    const s = discard.suit;
    const has = (val: number) => hand.some((t: any) => t.suit === s && t.value === val);
    return (has(v - 2) && has(v - 1)) || (has(v - 1) && has(v + 1)) || (has(v + 1) && has(v + 2));
}

function canKanLocal(hand: any[], discard: any): boolean {
    if (!discard) return false;
    const count = hand.filter((t: any) => t.suit === discard.suit && t.value === discard.value).length;
    return count >= 3;
}

// ─── Main component ───
export default function ColyseusMahjongGame({ mode, roomId: propRoomId, userData, options }: ColyseusMahjongGameProps) {
    const playerName = userData.name || 'Guest';

    const [room, setRoom] = useState<Room | null>(null);
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished' | 'draw'>('connecting');
    const [error, setError] = useState<string | null>(null);
    const [myHand, setMyHand] = useState<any[]>([]);
    const [mySeat, setMySeat] = useState<number>(-1);
    const [players, setPlayers] = useState<any[]>([]);
    const [showYakuList, setShowYakuList] = useState(false);
    const [currentTurn, setCurrentTurn] = useState<number>(0);
    const [doraIndicators, setDoraIndicators] = useState<any[]>([]);
    const [remainingTiles, setRemainingTiles] = useState<number>(70);
    const [roundInfo, setRoundInfo] = useState({ wind: 'east', number: 1, honba: 0 });
    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const [winner, setWinner] = useState<string | null>(null);
    const [playerCount, setPlayerCount] = useState(0);
    const [cutInText, setCutInText] = useState<string | null>(null);
    const [serverCanCall, setServerCanCall] = useState(false);
    const [serverCanRon, setServerCanRon] = useState(false);
    const [canTsumo, setCanTsumo] = useState(false);
    const [winInfo, setWinInfo] = useState<any>(null);
    const [gameEndScores, setGameEndScores] = useState<any[] | null>(null);
    const [riichiSticks, setRiichiSticks] = useState(0);
    const [lastDiscard, setLastDiscard] = useState<any>(null);
    const [lastDiscardPlayer, setLastDiscardPlayer] = useState(-1);
    const [phase, setPhase] = useState('waiting');

    const dataEffectCalled = useRef(false);
    const roomRef = useRef<Room | null>(null);
    const mySeatRef = useRef<number>(-1);

    // Derived: which buttons to show
    const isMyTurn = currentTurn === mySeat;
    const totalPlayers = players.length || 4;

    // Only show pon/chi/kan when server says canCall AND the local hand check validates it
    const showPon = serverCanCall && !serverCanRon && canPonLocal(myHand, lastDiscard);
    const showChi = serverCanCall && !serverCanRon && canChiLocal(myHand, lastDiscard, mySeat, lastDiscardPlayer, totalPlayers);
    const showKan = serverCanCall && !serverCanRon && canKanLocal(myHand, lastDiscard);
    const showPass = (serverCanCall || serverCanRon) && phase === 'calling';

    // ────── Connect ──────
    useEffect(() => {
        if (dataEffectCalled.current) return;
        dataEffectCalled.current = true;

        const connect = async () => {
            try {
                let r: Room;
                const roomName = options?.minPlayers === 3 ? 'mahjong3' : 'mahjong';

                if (mode === 'room') {
                    if (propRoomId) {
                        r = await client.joinById(propRoomId, { name: playerName, ...options });
                    } else {
                        r = await client.create(roomName, { name: playerName, isPrivate: true, ...options });
                    }
                } else {
                    r = await client.joinOrCreate(roomName, { name: playerName, ...options });
                }

                setRoom(r);
                roomRef.current = r;

                r.onStateChange((state: any) => updateState(state, r.sessionId));

                r.onMessage('riichi', () => {
                    setCutInText('リーチ');
                    audioManager.playRiichi?.();
                    setTimeout(() => setCutInText(null), 2000);
                });

                r.onMessage('gameOver', (msg: any) => {
                    if (msg.type === 'draw') {
                        setStatus('draw');
                        setWinInfo({ type: 'draw', winner: '', score: 0, yaku: '', label: '流局', han: 0, fu: 0, tenpaiPlayers: msg.tenpaiPlayers });
                    } else {
                        setStatus('finished');
                        setWinner(msg.winner);
                        setWinInfo({
                            type: msg.type,
                            winner: msg.winner,
                            score: msg.score || 0,
                            yaku: msg.yaku || '',
                            label: msg.label || '',
                            han: msg.han || 0,
                            fu: msg.fu || 0,
                        });
                        setCutInText(msg.type === 'tsumo' ? 'ツモ' : 'ロン');
                        setTimeout(() => setCutInText(null), 2000);
                        audioManager.playWin();
                    }
                });

                r.onMessage('gameEnd', (msg: any) => {
                    setGameEndScores(msg.scores);
                    setStatus('finished');
                });
            } catch (e: any) {
                setError('接続に失敗しました: ' + (e.message || ''));
            }
        };

        const updateState = (state: any, sessionId: string) => {
            try {
                setCurrentTurn(state.currentPlayerIndex);
                setRemainingTiles(state.remainingTiles);
                setRoundInfo({ wind: state.roundWind, number: state.roundNumber, honba: state.honba });
                setRiichiSticks(state.riichiSticks || 0);
                setPhase(state.phase);

                if (state.doraIndicators) setDoraIndicators([...state.doraIndicators]);

                // Last discard info for local call checks
                if (state.lastDiscard && state.lastDiscard.length > 0) {
                    setLastDiscard(state.lastDiscard[0]);
                } else {
                    setLastDiscard(null);
                }
                setLastDiscardPlayer(state.lastDiscardPlayer);

                if (state.players) {
                    const playersArr: any[] = [];
                    let localMySeat = mySeatRef.current;
                    state.players.forEach((p: any) => {
                        playersArr.push({
                            name: p.name,
                            seat: p.seatIndex,
                            wind: p.wind,
                            score: p.score,
                            isRiichi: p.isRiichi,
                            isCpu: p.isCpu,
                            hand: [...(p.hand || [])],
                            discards: [...(p.discards || [])],
                            calls: [...(p.calls || [])],
                            sessionId: p.sessionId,
                        });
                        if (p.sessionId === sessionId) {
                            localMySeat = p.seatIndex;
                            mySeatRef.current = p.seatIndex;
                            setMySeat(p.seatIndex);
                            setMyHand([...p.hand]);

                            // Server call flags
                            setServerCanCall(!!state.canCall?.[p.seatIndex]);
                            setServerCanRon(!!state.canRon?.[p.seatIndex]);
                        }
                    });
                    playersArr.sort((a, b) => a.seat - b.seat);
                    setPlayers(playersArr);
                    setPlayerCount(playersArr.length);

                    if (state.phase === 'playing') {
                        setStatus('playing');
                        if (state.lastAction?.includes('canTsumo')) {
                            setCanTsumo(state.currentPlayerIndex === localMySeat);
                        } else {
                            setCanTsumo(false);
                        }
                    } else if (state.phase === 'waiting') {
                        setStatus('waiting');
                    } else if (state.phase === 'calling') {
                        setStatus('playing');
                        setCanTsumo(false);
                    } else if (state.phase === 'finished') {
                        setStatus('finished');
                    } else if (state.phase === 'draw') {
                        setStatus('draw');
                    }
                }
            } catch (e) {
                console.error('Error updating state', e);
            }
        };

        connect();
        return () => { roomRef.current?.leave(); };
    }, [mode, propRoomId, playerName]);

    // ─── Actions ───
    const handleTileClick = (tile: any) => {
        if (currentTurn !== mySeat || phase !== 'playing') return;
        if (selectedTileId === tile.id) {
            handleDiscard(tile.id);
        } else {
            setSelectedTileId(tile.id);
        }
    };

    const handleDiscard = (tileId: string) => {
        room?.send('discard', { tileId });
        audioManager.playDiscard();
        setSelectedTileId(null);
    };

    const handleTsumo = () => { room?.send('tsumo'); setCanTsumo(false); };
    const handleRon = () => { room?.send('ron'); setServerCanRon(false); };
    const handlePon = () => { room?.send('pon'); setServerCanCall(false); };
    const handleChi = () => { room?.send('chi', { tiles: [] }); setServerCanCall(false); };
    const handleKan = () => { room?.send('kan'); setServerCanCall(false); };
    const handleRiichi = () => {
        if (!selectedTileId) return;
        room?.send('riichi', { tileId: selectedTileId });
        setSelectedTileId(null);
    };
    const handlePass = () => { room?.send('pass'); setServerCanCall(false); setServerCanRon(false); };
    const handleStartGame = () => { room?.send('startGame'); };

    const handleNextRound = () => {
        room?.send('nextRound');
        setWinner(null);
        setCutInText(null);
        setWinInfo(null);
        setCanTsumo(false);
        setGameEndScores(null);
    };

    const handleBackToTop = () => { roomRef.current?.leave(); window.location.reload(); };

    const windMap: Record<string, string> = { east: '東', south: '南', west: '西', north: '北' };

    // Relative player helper (0=me, 1=right, 2=across, 3=left)
    const getRelPlayer = (rel: number) => {
        const c = players.length || 4;
        return players.find(p => ((p.seat - mySeat + c) % c) === rel);
    };

    const checkIsDora = (tile: any) => {
        for (const ind of doraIndicators) {
            if (tile.suit === ind.suit) {
                if (tile.suit === 'honor') {
                    if (ind.value <= 4 && tile.value === (ind.value % 4) + 1) return true;
                    if (ind.value >= 5 && tile.value === 5 + ((ind.value - 5 + 1) % 3)) return true;
                } else {
                    if (tile.value === (ind.value % 9) + 1) return true;
                }
            }
        }
        return false;
    };

    // ─── Error ───
    if (error) {
        return (
            <div className={styles.main} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ color: '#e53e3e', marginBottom: 16 }}>{error}</p>
                <button onClick={() => window.location.reload()} className={styles.actionBtn}>再試行</button>
            </div>
        );
    }

    // ─── Connecting ───
    if (status === 'connecting') {
        return (
            <div className={styles.main} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <IconHourglass size={48} color="#fff" />
                <p style={{ marginTop: 12 }}>接続中...</p>
            </div>
        );
    }

    // ─── Waiting lobby ───
    if (status === 'waiting') {
        return (
            <main className={styles.main}>
                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyHeader}>
                        <h1>ルーム待機中</h1>
                        <div className={styles.roomIdBox}>
                            <span className={styles.roomIdLabel}>ID:</span>
                            <span className={styles.roomIdValue}>{room?.roomId}</span>
                        </div>
                    </div>
                    <div className={styles.playersSection}>
                        <h3>参加者 ({playerCount}/4人)</h3>
                        <div className={styles.playersList}>
                            {players.map(p => (
                                <div key={p.seat} className={styles.playerCard}>
                                    <IconUser size={24} color="#4a5568" />
                                    <span className={styles.playerName} style={{ color: '#2d3748', maxWidth: 'none' }}>
                                        {p.name}{p.isCpu ? ' (CPU)' : ''}
                                    </span>
                                    {p.seat === mySeat && <span className={styles.meBadge}>YOU</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.controls}>
                        {mySeat === 0 ? (
                            <button className={styles.startBtn} onClick={handleStartGame}>
                                {playerCount < 4 ? `CPUを入れて開始 (${playerCount}/4)` : 'ゲーム開始'}
                            </button>
                        ) : (
                            <div className={styles.waitingText}>ホストの開始を待っています...</div>
                        )}
                        <button className={styles.leaveBtn} onClick={handleBackToTop}>退出</button>
                    </div>
                </div>
            </main>
        );
    }

    // ─── GAME BOARD ───
    const meP = getRelPlayer(0);
    const rightP = getRelPlayer(1);
    const acrossP = getRelPlayer(2);
    const leftP = getRelPlayer(3);

    return (
        <main className={styles.main}>
            <HideChatBot />
            <CutInEffect text={cutInText} />
            {showYakuList && <YakuListModal onClose={() => setShowYakuList(false)} />}

            {/* Mobile rotate prompt */}
            <div className={styles.rotateOverlay}>
                <div className={styles.rotateIcon}>📱</div>
                <h3>横画面にしてください</h3>
            </div>

            {/* ─── Header ─── */}
            <div className={styles.header}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button onClick={handleBackToTop} className={styles.backButton}>
                        <IconBack size={16} /> 終了
                    </button>
                    <button onClick={() => setShowYakuList(true)} className={styles.backButton}>
                        <IconHelp size={16} /> 役
                    </button>
                </div>
                <div className={styles.doraHeaderArea}>
                    <span className={styles.doraLabel}>ドラ</span>
                    <div className={styles.doraTiles}>
                        {doraIndicators.map((t: any, i: number) => (
                            <TileComponent key={i} tile={t} size="small" isDora />
                        ))}
                    </div>
                </div>
                <div className={styles.roundInfo}>
                    {windMap[roundInfo.wind] || '東'}{roundInfo.number}局
                    {roundInfo.honba > 0 && ` ${roundInfo.honba}本場`}
                </div>
                <div className={styles.riichiSticks}>
                    残{remainingTiles}
                    {riichiSticks > 0 && ` 供託${riichiSticks * 1000}`}
                </div>
            </div>

            {/* ─── Board ─── */}
            <div className={styles.gameBoard}>
                {/* Top (Across) */}
                <div className={styles.opponentTop}>
                    {acrossP && (
                        <>
                            <PlayerPanel player={acrossP} isCurrentTurn={currentTurn === acrossP.seat} />
                            {acrossP.calls?.length > 0 && (
                                <div className={styles.opponentCalls}>
                                    {acrossP.calls.map((c: any, ci: number) => (
                                        <div key={ci} className={styles.callGroupSmall}>
                                            {[...(c.tiles || [])].map((t: any, ti: number) => (
                                                <TileComponent key={ti} tile={t} size="small" />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className={styles.handHidden}>
                                {acrossP.hand?.map((_: any, i: number) => (
                                    <div key={i} className={styles.tileBack} />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.middleSection}>
                    {/* Left */}
                    <div className={styles.opponentLeft}>
                        {leftP && (
                            <>
                                <PlayerPanel player={leftP} isCurrentTurn={currentTurn === leftP.seat} />
                                {leftP.calls?.length > 0 && (
                                    <div className={styles.opponentCalls}>
                                        {leftP.calls.map((c: any, ci: number) => (
                                            <div key={ci} className={styles.callGroupSmall}>
                                                {[...(c.tiles || [])].map((t: any, ti: number) => (
                                                    <TileComponent key={ti} tile={t} size="small" />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className={styles.handVertical}>
                                    {leftP.hand?.map((_: any, i: number) => (
                                        <div key={i} className={styles.tileBackVertical} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Center pond */}
                    <div className={styles.centerArea}>
                        <div className={styles.centerInfo}>
                            <div className={styles.wallCount}>残り{remainingTiles}枚</div>
                        </div>
                        {players.map(p => {
                            const rel = ((p.seat - mySeat + totalPlayers) % totalPlayers);
                            const pos = [styles.pondBottom, styles.pondRight, styles.pondTop, styles.pondLeft][rel];
                            return (
                                <div key={p.seat} className={`${styles.pondWrapper} ${pos}`}>
                                    <div className={styles.pond}>
                                        {p.discards.map((t: any, i: number) => (
                                            <TileComponent key={i} tile={t} size="small" isDora={checkIsDora(t)} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right */}
                    <div className={styles.opponentRight}>
                        {rightP && (
                            <>
                                <PlayerPanel player={rightP} isCurrentTurn={currentTurn === rightP.seat} />
                                {rightP.calls?.length > 0 && (
                                    <div className={styles.opponentCalls}>
                                        {rightP.calls.map((c: any, ci: number) => (
                                            <div key={ci} className={styles.callGroupSmall}>
                                                {[...(c.tiles || [])].map((t: any, ti: number) => (
                                                    <TileComponent key={ti} tile={t} size="small" />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className={styles.handVertical}>
                                    {rightP.hand?.map((_: any, i: number) => (
                                        <div key={i} className={styles.tileBackVertical} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* My area */}
                <div className={styles.myArea}>
                    {meP && <PlayerPanel player={meP} isCurrentTurn={isMyTurn} />}

                    {/* My calls */}
                    {meP?.calls?.length > 0 && (
                        <div className={styles.callsArea}>
                            {meP.calls.map((c: any, ci: number) => (
                                <div key={ci} className={styles.callGroup}>
                                    {[...(c.tiles || [])].map((t: any, ti: number) => (
                                        <TileComponent key={ti} tile={t} size="small" />
                                    ))}
                                    <span className={styles.callLabel}>
                                        {c.callType === 'chi' ? 'チー' : c.callType === 'pon' ? 'ポン' : 'カン'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* My hand */}
                    <div className={styles.myHand}>
                        {myHand.map((tile, i) => (
                            <TileComponent
                                key={tile.id || i}
                                tile={tile}
                                isSelected={selectedTileId === tile.id}
                                onClick={() => handleTileClick(tile)}
                                isDora={checkIsDora(tile)}
                            />
                        ))}
                    </div>

                    {/* Actions — below hand */}
                    <div className={styles.actionsBar}>
                        {canTsumo && isMyTurn && (
                            <button className={`${styles.actionBtn} ${styles.ronBtn}`} onClick={handleTsumo}>ツモ</button>
                        )}
                        {serverCanRon && (
                            <button className={`${styles.actionBtn} ${styles.ronBtn}`} onClick={handleRon}>ロン</button>
                        )}
                        {showPon && <button className={`${styles.actionBtn} ${styles.ponBtn}`} onClick={handlePon}>ポン</button>}
                        {showChi && <button className={`${styles.actionBtn} ${styles.chiBtn}`} onClick={handleChi}>チー</button>}
                        {showKan && <button className={`${styles.actionBtn} ${styles.kanBtn}`} onClick={handleKan}>カン</button>}
                        {showPass && <button className={styles.actionBtn} onClick={handlePass}>パス</button>}
                        {isMyTurn && selectedTileId && !canTsumo && phase === 'playing' && (
                            <button className={styles.discardBtn} onClick={() => handleDiscard(selectedTileId!)}>打牌</button>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Result modal ─── */}
            {(status === 'finished' || status === 'draw') && (
                <div className={styles.resultOverlay}>
                    <div className={styles.resultModal}>
                        {gameEndScores ? (
                            <>
                                <h2>対局終了</h2>
                                <div style={{ margin: '12px 0' }}>
                                    {gameEndScores.sort((a: any, b: any) => b.score - a.score).map((p: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #eee', fontSize: '1rem' }}>
                                            <span>{i + 1}位 {p.name}</span>
                                            <span style={{ fontWeight: 'bold', color: p.score >= 25000 ? '#27ae60' : '#e74c3c' }}>{p.score.toLocaleString()}点</span>
                                        </div>
                                    ))}
                                </div>
                                <button className={styles.exitBtn} onClick={handleBackToTop}>終了</button>
                            </>
                        ) : winInfo?.type === 'draw' ? (
                            <>
                                <h2>流局</h2>
                                <p style={{ color: '#718096', marginBottom: 8 }}>山牌がなくなりました</p>
                                {winInfo.tenpaiPlayers?.length > 0 && (
                                    <p style={{ color: '#4a5568' }}>テンパイ: {winInfo.tenpaiPlayers.join(', ')}</p>
                                )}
                                <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
                                    <button className={styles.newGameBtn} onClick={handleNextRound}>次の局</button>
                                    <button className={styles.exitBtn} onClick={handleBackToTop}>終了</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2>{winInfo?.type === 'tsumo' ? 'ツモ' : 'ロン'}！ {winner}</h2>
                                {winInfo && (
                                    <div style={{ margin: '8px 0' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e67e22', marginBottom: 4 }}>{winInfo.label}</div>
                                        <div className={styles.scoreResult}>
                                            {winInfo.han}翻 {winInfo.fu}符 — <strong>{winInfo.score.toLocaleString()}点</strong>
                                        </div>
                                        {winInfo.yaku && (
                                            <div className={styles.yakuList}>
                                                {winInfo.yaku.split(', ').map((y: string, i: number) => (
                                                    <div key={i} className={styles.yakuItem}>{y}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                                    <button className={styles.newGameBtn} onClick={handleNextRound}>次の局</button>
                                    <button className={styles.exitBtn} onClick={handleBackToTop}>終了</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
