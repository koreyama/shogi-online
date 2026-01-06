'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { client } from '@/lib/colyseus';
import { Room } from 'colyseus.js';
import { IconHourglass, IconBack, IconUser, IconHelp } from '@/components/Icons';
import { YakuListModal } from './YakuListModal';
import { audioManager } from '@/lib/mahjong/audio';
import { TILE_DISPLAY, Wind, getTileVisual } from '@/lib/mahjong/types';
import { TileGraphics } from './TileGraphics';
import HideChatBot from '@/components/HideChatBot';

interface ColyseusMahjongGameProps {
    mode: 'random' | 'room';
    roomId?: string;
    userData: { name: string, id: string };
    options?: any;
}

// Tile component for display
function TileComponent({ tile, isSelected, onClick, size = 'normal', isDora = false }: {
    tile: { suit: string, value: number, isRed?: boolean };
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

// カットインエフェクト
function CutInEffect({ text }: { text: string | null }) {
    if (!text) return null;

    let extraClass = '';
    if (text === 'ロン' || text === 'ツモ') extraClass = styles.cutInTextRon;
    if (text === 'リーチ') extraClass = styles.cutInTextRiichi;

    return (
        <div className={styles.cutInOverlay}>
            <div className={`${styles.cutInText} ${extraClass}`}>
                {text}
            </div>
        </div>
    );
}

// プレイヤーパネル
function PlayerPanel({
    player,
    isCurrentTurn,
    isSelf,
    position
}: {
    player: any;
    isCurrentTurn: boolean;
    isSelf: boolean;
    position: 'bottom' | 'right' | 'top' | 'left';
}) {
    const windDisplay: Record<string, string> = {
        east: '東', south: '南', west: '西', north: '北'
    };

    return (
        <div className={`${styles.playerPanel} ${styles[`player${position.charAt(0).toUpperCase() + position.slice(1)}`]}`}>
            <div className={styles.playerInfo}>
                <span className={styles.wind}>{windDisplay[player.wind]}</span>
                <span className={styles.playerName}>{player.name}{player.isCpu ? ' (CPU)' : ''}</span>
                <span className={styles.score}>{player.score.toLocaleString()}</span>
                {player.isRiichi && <span className={styles.riichiIndicator}>リーチ</span>}
                {isCurrentTurn && <span className={styles.turnIndicator}>●</span>}
            </div>
        </div>
    );
}

export default function ColyseusMahjongGame({ mode, roomId: propRoomId, userData, options }: ColyseusMahjongGameProps) {
    const playerName = userData.name || "Guest";

    const [room, setRoom] = useState<Room | null>(null);
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');
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
    const [canCall, setCanCall] = useState(false);
    const [canRon, setCanRon] = useState(false);

    // ドラ判定ヘルパー
    const checkIsDora = (tile: any, indicators: any[]) => {
        for (const ind of indicators) {
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

    const dataEffectCalled = useRef(false);
    const roomRef = useRef<Room | null>(null);

    useEffect(() => {
        if (dataEffectCalled.current) return;
        dataEffectCalled.current = true;

        const connect = async () => {
            try {
                let r: Room;
                // 3人麻雀と4人麻雀で別のルーム名を使用してマッチングを分離
                const roomName = options?.minPlayers === 3 ? "mahjong3" : "mahjong";

                if (mode === 'room') {
                    if (propRoomId) {
                        r = await client.joinById(propRoomId, { name: playerName, ...options });
                    } else {
                        // ルーム作成時はオプションを渡す（minPlayersなど）
                        r = await client.create(roomName, { name: playerName, isPrivate: true, ...options });
                    }
                } else {
                    // ランダムマッチ - 人数別に分離
                    r = await client.joinOrCreate(roomName, { name: playerName, ...options });
                }

                setRoom(r);
                // ...
                roomRef.current = r;
                console.log("Joined Mahjong room:", r.roomId);

                r.onStateChange((state: any) => {
                    updateState(state, r.sessionId);
                });

                r.onMessage("gameStart", () => {
                    setStatus('playing');
                });

                r.onMessage("gameOver", (msg: any) => {
                    setStatus('finished');
                    setWinner(msg.winner);
                    audioManager.playWin();
                });

                r.onMessage("playerJoined", (msg: any) => {
                    console.log("Player joined:", msg);
                });

            } catch (e: any) {
                console.error("Connection failed", e);
                setError("接続に失敗しました: " + (e.message || ""));
            }
        };

        const updateState = (state: any, sessionId: string) => {
            try {
                setCurrentTurn(state.currentPlayerIndex);
                setRemainingTiles(state.remainingTiles);
                setRoundInfo({ wind: state.roundWind, number: state.roundNumber, honba: state.honba });

                if (state.doraIndicators) {
                    setDoraIndicators([...state.doraIndicators]);
                }

                if (state.players) {
                    const playersArr: any[] = [];
                    let count = 0;
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
                            calls: [...(p.calls || [])]
                        });
                        if (p.sessionId === sessionId) {
                            setMySeat(p.seatIndex);
                            setMyHand([...p.hand]);

                            // Sync call flags
                            if (state.canCall && state.canCall[p.seatIndex]) {
                                setCanCall(true);
                            } else {
                                setCanCall(false);
                            }
                            if (state.canRon && state.canRon[p.seatIndex]) {
                                setCanRon(true);
                            } else {
                                setCanRon(false);
                            }
                        }
                        count++;
                    });
                    playersArr.sort((a, b) => a.seat - b.seat);
                    setPlayers(playersArr);
                    setPlayerCount(count);

                    if (state.phase === 'playing') {
                        setStatus('playing');
                    } else if (state.phase === 'waiting') {
                        setStatus('waiting');
                    } else if (state.phase === 'calling') {
                        // Keep playing status for UI, but buttons will appear via canCall
                        setStatus('playing');
                    } else if (state.phase === 'finished') {
                        setStatus('finished');
                    }
                }
            } catch (e) {
                console.error("Error updating state", e);
            }
        };

        connect();

        return () => {
            if (roomRef.current) {
                roomRef.current.leave();
                roomRef.current = null;
            }
        };
    }, [mode, propRoomId, playerName]);

    const handleTileClick = (tile: any) => {
        if (currentTurn !== mySeat) return;
        if (selectedTileId === tile.id) {
            handleDiscard(tile.id);
        } else {
            setSelectedTileId(tile.id);
        }
    };

    const handleDiscard = (tileId: string) => {
        room?.send("discard", { tileId });
        audioManager.playDiscard();
        setSelectedTileId(null);
    };

    const handleTsumo = () => {
        room?.send("tsumo");
        audioManager.playWin();
        setCutInText('ツモ');
        setTimeout(() => setCutInText(null), 2000);
    };

    const handleRon = () => {
        room?.send("ron");
        audioManager.playWin();
        setCutInText('ロン');
        setTimeout(() => setCutInText(null), 2000);
        setCanRon(false);
    };

    const handlePon = () => {
        room?.send("pon");
        setCutInText('ポン');
        setTimeout(() => setCutInText(null), 1000);
        setCanCall(false);
    };

    const handleChi = () => {
        // Simple Chi (auto-select or send empty to let server pick)
        room?.send("chi", { tiles: [] });
        setCutInText('チー');
        setTimeout(() => setCutInText(null), 1000);
        setCanCall(false);
    };

    const handleKan = () => {
        room?.send("kan");
        setCutInText('カン');
        setTimeout(() => setCutInText(null), 1000);
        setCanCall(false);
    };

    const handlePass = () => {
        room?.send("pass");
        setCanCall(false);
        setCanRon(false);
    };

    const handleStartGame = () => {
        room?.send("startGame");
    };

    const handleNextRound = () => {
        room?.send("nextRound");
        // Reset local UI override if needed, though status change handles most
        setWinner(null);
        setCutInText(null);
    };

    const handleBackToTop = () => {
        roomRef.current?.leave();
        window.location.reload();
    };

    const toggleFullScreen = () => {
        try {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(e => {
                    console.log("Fullscreen denied:", e);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        } catch (err) {
            console.error("Fullscreen error:", err);
        }
    };

    const windDisplay: Record<string, string> = { east: '東', south: '南', west: '西', north: '北' };
    const isMyTurn = currentTurn === mySeat;

    if (error) {
        return (
            <div className={styles.main}>
                <p style={{ color: '#e53e3e' }}>{error}</p>
                <button onClick={() => window.location.reload()} className={styles.actionBtn}>再試行</button>
            </div>
        );
    }

    return (
        <main className={styles.main}>
            {status === 'connecting' && (
                <div className={styles.resultOverlay}>
                    <div className={styles.resultModal}>
                        <h2>接続中...</h2>
                        <IconHourglass size={48} color="#1a472a" />
                    </div>
                </div>
            )}

            {/* Mobile Rotation Prompt */}
            <div className={styles.rotateOverlay}>
                <div className={styles.rotateIcon}>📱➡️</div>
                <h3>横画面にしてください</h3>
                <p>このゲームは横画面専用です</p>
            </div>

            {status === 'waiting' ? (
                /* Lobby (Waiting Room) */
                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyHeader}>
                        <h1>ルーム待機中</h1>
                        <div className={styles.roomIdBox}>
                            <span className={styles.roomIdLabel}>ID:</span>
                            <span className={styles.roomIdValue}>{room?.roomId}</span>
                        </div>
                    </div>

                    <div className={styles.lobbyContent}>
                        <div className={styles.playersSection}>
                            <h3>参加者 ({playerCount}/{room?.state?.minPlayers || 4}人~)</h3>
                            <div className={styles.playersList}>
                                {players.map(p => (
                                    <div key={p.seat} className={styles.playerCard}>
                                        <IconUser size={24} color="#4a5568" />
                                        <span className={styles.playerName}>{p.name}{p.isCpu ? ' (CPU)' : ''}</span>
                                        {p.seat === 0 && <span className={styles.hostBadge}>HOST</span>}
                                        {p.seat === mySeat && <span className={styles.meBadge}>YOU</span>}
                                    </div>
                                ))}
                                {/* 簡易的な空きスロット表示 */}
                                {playerCount < (room?.state?.minPlayers || 4) && (
                                    <div className={`${styles.playerCard} ${styles.emptySlot}`}>
                                        <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>待機中...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.controls}>
                        {mySeat === 0 ? (
                            <button
                                className={styles.startBtn}
                                onClick={handleStartGame}
                                disabled={playerCount < 1}
                            >
                                {playerCount < 4 ? `CPUを入れて開始 (${playerCount}/4人)` : 'ゲーム開始'}
                            </button>
                        ) : (
                            <div className={styles.waitingText}>
                                ホストがゲームを開始するのを待っています...
                            </div>
                        )}
                        <button className={styles.leaveBtn} onClick={handleBackToTop}>退出</button>
                    </div>
                </div>
            ) : (
                /* Game UI (Playing / Finished) */
                status !== 'connecting' && (
                    <>
                        <HideChatBot />
                        <CutInEffect text={cutInText} />
                        {showYakuList && <YakuListModal onClose={() => setShowYakuList(false)} />}
                        <div className={styles.header}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button onClick={handleBackToTop} className={styles.backButton}>
                                    <IconBack size={18} /> 終了
                                </button>
                                <button onClick={() => setShowYakuList(true)} className={styles.backButton} style={{ width: 'auto', padding: '0 10px', fontSize: '0.9rem' }}>
                                    <IconHelp size={18} /> 役一覧
                                </button>
                            </div>
                            {/* ドラ表示（左上） */}
                            <div className={styles.doraHeaderArea}>
                                <span className={styles.doraLabel}>ドラ</span>
                                <div className={styles.doraTiles}>
                                    {doraIndicators.map((tile: any, i: number) => (
                                        <TileComponent key={i} tile={tile} size="small" isDora={true} />
                                    ))}
                                </div>
                            </div>
                            <div className={styles.roundInfo}>
                                {windDisplay[roundInfo.wind] || '東'}{roundInfo.number}局
                                {roundInfo.honba > 0 && ` ${roundInfo.honba}本場`}
                            </div>
                            <div className={styles.riichiSticks}>
                                残り: {remainingTiles}枚
                            </div>
                        </div>

                        <div className={styles.gameBoard}>
                            {/* 上家（対面） - Relative Seat 2 */}
                            <div className={styles.opponentTop}>
                                {players.find(p => (p.seat - mySeat + 4) % 4 === 2) && (
                                    <PlayerPanel
                                        player={players.find(p => (p.seat - mySeat + 4) % 4 === 2)!}
                                        isCurrentTurn={currentTurn === players.find(p => (p.seat - mySeat + 4) % 4 === 2)!.seat}
                                        isSelf={false}
                                        position="top"
                                    />
                                )}
                            </div>

                            <div className={styles.middleSection}>
                                {/* 左家（上家） - Relative Seat 3 */}
                                <div className={styles.opponentLeft}>
                                    {players.find(p => (p.seat - mySeat + 4) % 4 === 3) && (
                                        <PlayerPanel
                                            player={players.find(p => (p.seat - mySeat + 4) % 4 === 3)!}
                                            isCurrentTurn={currentTurn === players.find(p => (p.seat - mySeat + 4) % 4 === 3)!.seat}
                                            isSelf={false}
                                            position="left"
                                        />
                                    )}
                                </div>

                                {/* Center area with Dora and Ponds */}
                                <div className={styles.centerArea}>
                                    <div className={styles.centerInfo}>
                                        <div className={styles.doraArea}>
                                            <span className={styles.doraLabel}>ドラ</span>
                                            <div className={styles.doraTiles}>
                                                {doraIndicators.map((tile, i) => (
                                                    <TileComponent key={i} tile={tile} size="small" isDora={true} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className={styles.wallCount}>
                                            残り: {remainingTiles}枚
                                        </div>
                                    </div>

                                    {/* Ponds (Rivers) */}
                                    {players.map(p => {
                                        const relSeat = (p.seat - mySeat + 4) % 4;
                                        let posClass = '';
                                        if (relSeat === 0) posClass = styles.pondBottom;
                                        else if (relSeat === 1) posClass = styles.pondRight;
                                        else if (relSeat === 2) posClass = styles.pondTop;
                                        else if (relSeat === 3) posClass = styles.pondLeft;

                                        return (
                                            <div key={p.seat} className={`${styles.pondWrapper} ${posClass}`}>
                                                <div className={styles.pond}>
                                                    {p.discards.map((tile: any, i: number) => (
                                                        <TileComponent key={i} tile={tile} size="small" isDora={checkIsDora(tile, doraIndicators)} />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 右家（下家） - Relative Seat 1 */}
                                <div className={styles.opponentRight}>
                                    {players.find(p => (p.seat - mySeat + 4) % 4 === 1) && (
                                        <PlayerPanel
                                            player={players.find(p => (p.seat - mySeat + 4) % 4 === 1)!}
                                            isCurrentTurn={currentTurn === players.find(p => (p.seat - mySeat + 4) % 4 === 1)!.seat}
                                            isSelf={false}
                                            position="right"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* My area */}
                            <div className={styles.myArea}>
                                <PlayerPanel
                                    player={players.find(p => (p.seat - mySeat + 4) % 4 === 0) || { name: 'You', score: 25000, wind: 'east', isRiichi: false } as any}
                                    isCurrentTurn={currentTurn === mySeat}
                                    isSelf={true}
                                    position="bottom"
                                />

                                <div className={styles.myHand}>
                                    {myHand.map((tile, i) => (
                                        <TileComponent
                                            key={tile.id || i}
                                            tile={tile}
                                            isSelected={selectedTileId === tile.id}
                                            onClick={() => handleTileClick(tile)}
                                            isDora={checkIsDora(tile, doraIndicators)}
                                        />
                                    ))}
                                </div>

                                <div className={styles.actions}>
                                    {isMyTurn && selectedTileId && (
                                        <button className={styles.discardBtn} onClick={() => handleDiscard(selectedTileId!)}>
                                            打牌
                                        </button>
                                    )}
                                    {/* ツモは現在未実装 - サーバー側でcanTsumo状態の同期が必要 */}

                                    {/* Action Buttons for Calling Phase */}
                                    {canCall && (
                                        <>
                                            <button className={`${styles.actionBtn} ${styles.ponBtn}`} onClick={handlePon}>ポン</button>
                                            <button className={`${styles.actionBtn} ${styles.chiBtn}`} onClick={handleChi}>チー</button>
                                            <button className={`${styles.actionBtn} ${styles.kanBtn}`} onClick={handleKan}>カン</button>
                                            <button className={`${styles.actionBtn} ${styles.passBtn}`} onClick={handlePass}>パス</button>
                                        </>
                                    )}
                                    {canRon && (
                                        <button className={`${styles.actionBtn} ${styles.ronBtn}`} onClick={handleRon}>ロン</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Finished modal */}
                        {status === 'finished' && (
                            <div className={styles.resultOverlay}>
                                <div className={styles.resultModal}>
                                    <h2>{winner ? `${winner}の勝ち！` : '終了'}</h2>
                                    <button className={styles.newGameBtn} onClick={handleNextRound}>
                                        次の局へ (点数継続)
                                    </button>
                                    <button className={styles.exitBtn} onClick={handleBackToTop}>
                                        終了
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )
            )}
        </main>
    );
}
