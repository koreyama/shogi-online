'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameState, Tile, PlayerState, TILE_DISPLAY, Wind } from '@/lib/mahjong/types';
import {
    createInitialGameState, performDraw, performDiscard,
    declareRiichi, executeTsumo, executeRon, passCall,
    executePon, executeChi, getChiOptions, getPonTiles
} from '@/lib/mahjong/engine';
import { computeAiAction } from '@/lib/mahjong/ai';
import { getTileKey, sortHand, removeTileFromHand } from '@/lib/mahjong/tiles';
import { getTenpaiWaits } from '@/lib/mahjong/hand-evaluator';
import styles from './page.module.css';
import menuStyles from '@/styles/GameMenu.module.css';
import { IconBack, IconRobot, IconDice, IconKey, IconHelp } from '@/components/Icons';
import ColyseusMahjongGame from './ColyseusMahjongGame';
import { audioManager } from '@/lib/mahjong/audio';

import { YakuListModal } from './YakuListModal';
import { useAuth } from '@/hooks/useAuth';


type GameMode = 'select' | 'ai' | 'online-random' | 'online-room';

// 牌コンポーネント
function TileComponent({
    tile,
    isSelected,
    onClick,
    isHidden = false,
    size = 'normal',
    isDora = false
}: {
    tile: Tile;
    isSelected?: boolean;
    onClick?: () => void;
    isHidden?: boolean;
    size?: 'normal' | 'small';
    isDora?: boolean;
}) {
    const key = getTileKey(tile);
    const display = TILE_DISPLAY[key] || '🀫';

    return (
        <div
            className={`${styles.tile} ${isSelected ? styles.tileSelected : ''} ${size === 'small' ? styles.tileSmall : ''} ${isDora ? styles.tileDora : ''}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            {isHidden ? '🀫' : display}
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
    player: PlayerState;
    isCurrentTurn: boolean;
    isSelf: boolean;
    position: 'bottom' | 'right' | 'top' | 'left';
}) {
    const windDisplay: Record<Wind, string> = {
        east: '東', south: '南', west: '西', north: '北'
    };
    const isDealer = player.wind === 'east';

    return (
        <div className={`${styles.playerPanel} ${styles[`player${position.charAt(0).toUpperCase() + position.slice(1)}`]}`}>
            <div className={styles.playerInfo}>
                <span className={styles.wind}>{windDisplay[player.wind]}</span>
                {isDealer && <span className={styles.dealerIndicator}>親</span>}
                <span className={styles.playerName}>{player.name}</span>
                <span className={styles.score}>{player.score.toLocaleString()}</span>
                {player.isRiichi && <span className={styles.riichiIndicator}>リーチ</span>}
                {isCurrentTurn && <span className={styles.turnIndicator}>●</span>}
            </div>
        </div>
    );
}

// ... (imports remain)

type ViewState = 'top' | 'random_select' | 'room_select' | 'ai_select';

export default function MahjongPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [view, setView] = useState<ViewState>('top');
    const [gameMode, setGameMode] = useState<GameMode | null>(null);
    const [roomId, setRoomId] = useState('');
    const [options, setOptions] = useState<any>({});

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    if (authLoading || !user) return <div className={menuStyles.loading}>Loading...</div>;

    const startOnlineGame = (mode: 'random' | 'room', opts: any = {}) => {
        if (!user) {
            alert('ログインが必要です');
            return;
        }
        setOptions(opts);
        setGameMode(mode === 'random' ? 'online-random' : 'online-room');
    };

    const startAiGame = () => {
        setGameMode('ai');
    };

    // トップ画面 & モード選択
    if (!gameMode) {
        return (
            <main className={menuStyles.main}>
                <div className={menuStyles.header}>
                    <button
                        onClick={() => view === 'top' ? router.push('/') : setView('top')}
                        className={menuStyles.backButton}
                    >
                        <IconBack size={18} /> 戻る
                    </button>
                    <h1 className={menuStyles.title}>🀄 四人麻雀</h1>
                    <p className={menuStyles.subtitle}>
                        {view === 'top' && 'モードを選択してください'}
                        {view === 'random_select' && '対戦形式を選択'}
                        {view === 'room_select' && 'ルーム作成・参加'}
                        {view === 'ai_select' && 'CPU対戦設定'}
                    </p>
                </div>

                {view === 'top' && (
                    <>
                        <div className={menuStyles.modeSelection}>
                            {/* 左: オンライン（ランダム） */}
                            <button className={menuStyles.modeBtn} onClick={() => setView('random_select')}>
                                <div className={menuStyles.modeBtnIcon}>
                                    <IconDice size={48} />
                                </div>
                                <span className={menuStyles.modeBtnTitle}>オンライン対戦</span>
                                <span className={menuStyles.modeBtnDesc}>ランダムマッチ</span>
                            </button>

                            {/* 中: ルーム対戦 */}
                            <button className={menuStyles.modeBtn} onClick={() => setView('room_select')}>
                                <div className={menuStyles.modeBtnIcon}>
                                    <IconKey size={48} />
                                </div>
                                <span className={menuStyles.modeBtnTitle}>ルーム対戦</span>
                                <span className={menuStyles.modeBtnDesc}>友達と対戦</span>
                            </button>

                            {/* 右: AI対戦 */}
                            <button className={menuStyles.modeBtn} onClick={() => startAiGame()}>
                                <div className={menuStyles.modeBtnIcon}>
                                    <IconRobot size={48} />
                                </div>
                                <span className={menuStyles.modeBtnTitle}>CPU対戦</span>
                                <span className={menuStyles.modeBtnDesc}>一人で練習</span>
                            </button>
                        </div>

                        <div className={menuStyles.contentSection} style={{ marginTop: '3rem' }}>
                            <h2 className={menuStyles.contentTitle}>麻雀ルール・遊び方</h2>

                            <div className={menuStyles.sectionHeader}>
                                <div className={menuStyles.sectionIcon}>🀄</div>
                                <h3 className={menuStyles.sectionTitle}>基本ルール</h3>
                            </div>

                            <div className={menuStyles.textBlock}>
                                当サイトの麻雀は、一般的な「ありあり」ルールを採用しています。手軽に楽しめるよう、サクサク進行する仕様になっています。
                            </div>

                            <div className={menuStyles.cardGrid}>
                                <div className={menuStyles.infoCard}>
                                    <span className={menuStyles.cardTitle}>ゲーム設定</span>
                                    <p className={menuStyles.cardText}>
                                        ・四人麻雀（東南戦）<br />
                                        ・25,000点持ち、30,000点返し<br />
                                        ・喰い断あり、後付けあり
                                    </p>
                                </div>
                                <div className={menuStyles.infoCard}>
                                    <span className={menuStyles.cardTitle}>ドラ・役</span>
                                    <p className={menuStyles.cardText}>
                                        ・赤ドラ各1枚（計3枚）<br />
                                        ・裏ドラ、カンドラ、カン裏あり<br />
                                        ・ダブルリーチあり
                                    </p>
                                </div>
                                <div className={menuStyles.infoCard}>
                                    <span className={menuStyles.cardTitle}>流局・連荘</span>
                                    <p className={menuStyles.cardText}>
                                        ・親の聴牌連荘<br />
                                        ・途中流局あり（九種九牌など）<br />
                                        ・流し満貫あり
                                    </p>
                                </div>
                                <div className={menuStyles.infoCard}>
                                    <span className={menuStyles.cardTitle}>その他</span>
                                    <p className={menuStyles.cardText}>
                                        ・ダブロンあり（供託は上家取り）<br />
                                        ・箱割れ終了あり（0点未満）<br />
                                        ・責任払い（パオ）なし
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {view === 'random_select' && (
                    <div className={menuStyles.joinSection}>
                        <h2 className={menuStyles.sectionTitle} style={{ marginBottom: '1rem' }}>対戦人数を選択</h2>
                        <button className={menuStyles.primaryBtn} onClick={() => startOnlineGame('random', { minPlayers: 4 })}>
                            四人麻雀 (マッチング)
                        </button>
                        <button className={menuStyles.secondaryBtn} style={{ marginTop: '1rem' }} onClick={() => startOnlineGame('random', { minPlayers: 3 })}>
                            三人麻雀 (マッチング) <br /><span style={{ fontSize: '0.8rem' }}>※CPU含む場合あり</span>
                        </button>
                    </div>
                )}

                {view === 'room_select' && (
                    <div className={menuStyles.joinSection}>
                        <h2 className={menuStyles.sectionTitle}>ルームに参加・作成</h2>
                        <div style={{ width: '100%', marginBottom: '1.5rem' }}>
                            <p className={menuStyles.joinDesc} style={{ textAlign: 'left', fontSize: '0.9rem', marginBottom: '0.5rem' }}>IDを入力して参加</p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="ルームID"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    className={menuStyles.input}
                                />
                                <button
                                    className={menuStyles.primaryBtn}
                                    style={{ width: 'auto' }}
                                    onClick={() => {
                                        if (roomId) startOnlineGame('room', {});
                                    }}
                                >
                                    参加
                                </button>
                            </div>
                        </div>
                        <div style={{ width: '100%', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                            <p className={menuStyles.joinDesc} style={{ marginBottom: '0.5rem' }}>または新しく作成</p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className={menuStyles.primaryBtn} onClick={() => startOnlineGame('room', { minPlayers: 4 })}>
                                    四人部屋作成
                                </button>
                                <button className={menuStyles.secondaryBtn} onClick={() => startOnlineGame('room', { minPlayers: 3 })}>
                                    三人部屋作成
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        );
    }

    // オンラインモード
    if (gameMode === 'online-random' || gameMode === 'online-room') {
        return (
            <ColyseusMahjongGame
                mode={gameMode === 'online-random' ? 'random' : 'room'}
                roomId={roomId || undefined}
                userData={{ name: user?.displayName || 'Guest', id: user?.uid || '' }}
                options={options}
            />
        );
    }

    // AI対戦モード（gameMode === 'ai'）
    return <MahjongAiGame onBack={() => setGameMode(null)} />;
}

// AI対戦用コンポーネント
function MahjongAiGame({ onBack }: { onBack: () => void }) {
    const router = useRouter();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const [cutInText, setCutInText] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [showYakuList, setShowYakuList] = useState(false);
    const [callTimer, setCallTimer] = useState<number>(0); // 鳴き判断用タイマー（秒）

    // ゲーム初期化
    useEffect(() => {
        const state = createInitialGameState(['あなた', 'CPU 南', 'CPU 西', 'CPU 北']);
        const drawnState = performDraw(state);
        setGameState(drawnState);
    }, []);

    // AIのターン処理
    useEffect(() => {
        if (!gameState || gameState.phase === 'finished' || gameState.phase === 'draw') return;

        // 自分のターン以外はAIが行動
        if (gameState.currentPlayerIndex !== 0 && gameState.phase === 'playing') {
            setIsAiThinking(true);
            const timer = setTimeout(() => {
                executeAiTurn();
            }, 1000);
            return () => clearTimeout(timer);
        }

        // 鳴き/ロン待ちでAIの応答
        if (gameState.phase === 'calling') {
            const timer = setTimeout(() => {
                handleAiCallResponse();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [gameState?.currentPlayerIndex, gameState?.phase]);

    // 鳴き可能時の15秒タイマー
    useEffect(() => {
        if (!gameState || gameState.phase !== 'calling') {
            setCallTimer(0);
            return;
        }

        const myPlayer = gameState.players[0];
        if (!myPlayer) return;

        const canRon = gameState.canRon[0];
        const canCallPon = gameState.lastDiscard && gameState.lastDiscardPlayer !== 0 && !myPlayer.isRiichi && getPonTiles(myPlayer.hand, gameState.lastDiscard).length >= 2;
        const canCallChi = gameState.lastDiscard && gameState.lastDiscardPlayer === 3 && !myPlayer.isRiichi && getChiOptions(myPlayer.hand, gameState.lastDiscard).length > 0;

        // 鳴けない場合は即パス
        if (!canCallPon && !canCallChi && !canRon) {
            const timer = setTimeout(() => {
                handlePass();
            }, 600);
            return () => clearTimeout(timer);
        }

        // 鳴ける場合は15秒タイマー開始
        setCallTimer(15);
        const interval = setInterval(() => {
            setCallTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handlePass(); // タイムアウトで自動パス
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState?.phase, gameState?.lastDiscard?.id]); // calling phase と捨て牌が変わった時のみ

    const executeAiTurn = () => {
        if (!gameState) return;

        // AIの手番でのツモ
        let currentState = performDraw(gameState);

        if (currentState.phase === 'draw') {
            setGameState(currentState);
            return;
        }

        // AIの行動を決定
        const action = computeAiAction(currentState, currentState.currentPlayerIndex);

        if (action.type === 'tsumo') {
            currentState = executeTsumo(currentState);
            audioManager.playWin();
        } else if (action.type === 'riichi' && action.tileId) {
            currentState = declareRiichi(currentState, action.tileId);
            audioManager.playRiichi();
        } else if (action.type === 'discard' && action.tileId) {
            currentState = performDiscard(currentState, action.tileId);
            audioManager.playDiscard();
        } else {
            // デフォルト: ツモ切り
            const hand = currentState.players[currentState.currentPlayerIndex].hand;
            if (hand.length > 0) {
                currentState = performDiscard(currentState, hand[hand.length - 1].id);
                audioManager.playDiscard();
            }
        }

        // 次が人間ならツモらせる
        if (currentState.phase === 'playing' && currentState.currentPlayerIndex === 0) {
            currentState = performDraw(currentState);
        }

        setGameState(currentState);
        setIsAiThinking(false);
    };

    const handleAiCallResponse = () => {
        if (!gameState) return;

        // AI（プレイヤー1-3）のロン/鳴き判断
        for (let i = 1; i < 4; i++) {
            if (gameState.canRon[i]) {
                // AIはロンする
                const newState = executeRon(gameState, i);
                audioManager.playWin();
                setGameState(newState);
                return;
            }
        }

        // 鳴きは基本パス
        const newState = passCall(gameState, 0); // 引数の0はダミー

        // 次が人間ならツモらせる
        if (newState.phase === 'playing' && newState.currentPlayerIndex === 0) {
            const drawnState = performDraw(newState);
            setGameState(drawnState);
        } else {
            setGameState(newState);
        }
    };

    const handleTileClick = (tile: Tile) => {
        if (!gameState || gameState.currentPlayerIndex !== 0) return;

        if (selectedTileId === tile.id) {
            // ダブルクリックで打牌
            handleDiscard(tile.id);
        } else {
            setSelectedTileId(tile.id);
        }
    };

    const handleDiscard = (tileId: string) => {
        if (!gameState || gameState.currentPlayerIndex !== 0) return;

        const newState = performDiscard(gameState, tileId);
        audioManager.playDiscard();
        setSelectedTileId(null);

        // 修正: 打牌後はここでツモらない（次がAIならuseEffectでAIがツモる）
        setGameState(newState);
    };

    const handleTsumo = () => {
        if (!gameState) return;
        const newState = executeTsumo(gameState);
        setGameState(newState);
        setShowResult(true);
    };

    const handleRiichi = () => {
        if (!gameState || !selectedTileId) return;
        const newState = declareRiichi(gameState, selectedTileId);
        audioManager.playRiichi();
        setSelectedTileId(null);
        setCutInText('リーチ');
        setTimeout(() => setCutInText(null), 2000);

        // 修正: リーチ後もここでツモらない
        setGameState(newState);
    };

    const handleRon = () => {
        if (!gameState || !gameState.canRon[0]) return;
        const newState = executeRon(gameState, 0);
        audioManager.playWin();
        setGameState(newState);
        setCutInText('ロン');
        setTimeout(() => setCutInText(null), 2000);
        setShowResult(true);
    };

    const handlePass = () => {
        if (!gameState) return;
        let newState = passCall(gameState, 0);

        // パスした後、自分のツモ番ならツモる
        if (newState.phase === 'playing' && newState.currentPlayerIndex === 0) {
            newState = performDraw(newState);
        }

        setGameState(newState);
    };

    const handlePon = () => {
        if (!gameState || !gameState.lastDiscard) return;
        const ponTiles = getPonTiles(myPlayer.hand, gameState.lastDiscard);
        if (ponTiles.length < 2) return;

        const newState = executePon(gameState, 0, [ponTiles[0].id, ponTiles[1].id]);
        audioManager.playCall();
        setGameState(newState);
        setCutInText('ポン');
        setTimeout(() => setCutInText(null), 2000);
    };

    const handleChi = () => {
        if (!gameState || !gameState.lastDiscard) return;
        const chiOptions = getChiOptions(myPlayer.hand, gameState.lastDiscard);
        if (chiOptions.length === 0) return;

        // 最初のオプションを使用（TODO: 複数オプションの選択UI）
        const [t1, t2] = chiOptions[0];
        const newState = executeChi(gameState, 0, [t1.id, t2.id]);
        audioManager.playCall();
        setGameState(newState);
        setCutInText('チー');
        setTimeout(() => setCutInText(null), 2000);
    };

    const handleNewGame = () => {
        const state = createInitialGameState(['あなた', 'CPU 南', 'CPU 西', 'CPU 北']);
        const drawnState = performDraw(state);
        setGameState(drawnState);
        setShowResult(false);
        setSelectedTileId(null);
    };

    if (!gameState) {
        return <div className={styles.loading}>読み込み中...</div>;
    }

    const myPlayer = gameState.players[0];
    const isMyTurn = gameState.currentPlayerIndex === 0;
    const canTsumo = gameState.phase === 'tsumo' && isMyTurn;
    const canRon = gameState.phase === 'calling' && gameState.canRon[0];
    // リーチ可能かチェックする関数
    const checkRiichiPossibility = (player: PlayerState): boolean => {
        if (player.isRiichi || player.calls.length > 0 || player.score < 1000) return false;
        if (player.hand.length !== 14) return false;

        const checked = new Set<string>();
        for (const tile of player.hand) {
            const key = `${tile.suit}${tile.value}`;
            if (checked.has(key)) continue;
            checked.add(key);

            const testHand = removeTileFromHand(player.hand, tile.id);
            const waits = getTenpaiWaits(testHand, player.calls);
            if (waits.length > 0) return true;
        }
        return false;
    };

    const canRiichi = isMyTurn && checkRiichiPossibility(myPlayer);

    // チー・ポンの判定（リーチ中は不可）
    const canCallPon = gameState.phase === 'calling' && gameState.lastDiscard &&
        gameState.lastDiscardPlayer !== 0 && !myPlayer.isRiichi && getPonTiles(myPlayer.hand, gameState.lastDiscard).length >= 2;
    const canCallChi = gameState.phase === 'calling' && gameState.lastDiscard &&
        gameState.lastDiscardPlayer === 3 && !myPlayer.isRiichi && getChiOptions(myPlayer.hand, gameState.lastDiscard).length > 0;



    // ドラ判定ヘルパー
    const checkIsDora = (tile: Tile, indicators: Tile[]) => {
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

    return (
        <main className={styles.main}>
            <CutInEffect text={cutInText} />
            {showYakuList && <YakuListModal onClose={() => setShowYakuList(false)} />}

            {/* ヘッダー */}
            <div className={styles.header}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button onClick={onBack} className={styles.backButton}>
                        <IconBack size={18} /> 戻る
                    </button>
                    <button onClick={() => setShowYakuList(true)} className={styles.backButton} style={{ width: 'auto', padding: '0 10px', fontSize: '0.9rem' }}>
                        <IconHelp size={18} /> 役一覧
                    </button>
                </div>
                {/* ドラ表示（左上） */}
                <div className={styles.doraHeaderArea}>
                    <span className={styles.doraLabel}>ドラ</span>
                    <div className={styles.doraTiles}>
                        {gameState.doraIndicators.map((tile, i) => (
                            <TileComponent key={i} tile={tile} size="small" isDora={true} />
                        ))}
                    </div>
                </div>
                <div className={styles.roundInfo}>
                    {gameState.roundWind === 'east' ? '東' : '南'}{gameState.roundNumber}局
                    {gameState.honba > 0 && ` ${gameState.honba}本場`}
                </div>
                <div className={styles.riichiSticks}>
                    供託: {gameState.riichiSticks * 1000}
                </div>
            </div>

            {/* ゲームボード */}
            <div className={styles.gameBoard}>
                {/* 上家（対面） */}
                <div className={styles.opponentTop}>
                    <PlayerPanel
                        player={gameState.players[2]}
                        isCurrentTurn={gameState.currentPlayerIndex === 2}
                        isSelf={false}
                        position="top"
                    />
                    {gameState.players[2].calls.length > 0 && (
                        <div className={styles.opponentCalls}>
                            {gameState.players[2].calls.map((call, cIdx) => (
                                <div key={cIdx} className={styles.callGroupSmall}>
                                    {call.tiles.map((tile, tIdx) => (
                                        <TileComponent key={tIdx} tile={tile} size="small" />
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className={styles.handHidden}>
                        {gameState.players[2].hand.map((_, i) => (
                            <div key={i} className={styles.tileBack}></div>
                        ))}
                    </div>
                </div>

                {/* 左右の対戦者と中央エリア */}
                <div className={styles.middleSection}>
                    {/* 左家 */}
                    <div className={styles.opponentLeft}>
                        <PlayerPanel
                            player={gameState.players[3]}
                            isCurrentTurn={gameState.currentPlayerIndex === 3}
                            isSelf={false}
                            position="left"
                        />
                        {gameState.players[3].calls.length > 0 && (
                            <div className={styles.opponentCalls}>
                                {gameState.players[3].calls.map((call, cIdx) => (
                                    <div key={cIdx} className={styles.callGroupSmall}>
                                        {call.tiles.map((tile, tIdx) => (
                                            <TileComponent key={tIdx} tile={tile} size="small" />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className={styles.handVertical}>
                            {gameState.players[3].hand.map((_, i) => (
                                <div key={i} className={styles.tileBackVertical}></div>
                            ))}
                        </div>
                    </div>

                    {/* 中央（河） */}
                    <div className={styles.centerArea}>
                        <div className={styles.centerInfo}>
                            <div className={styles.wallCount}>
                                残り: {gameState.wall.length}枚
                            </div>
                        </div>

                        {/* 河（Bottom: Player 0） */}
                        <div className={`${styles.pondWrapper} ${styles.pondBottom}`}>
                            <div className={styles.pond}>
                                {gameState.players[0].discards.map((tile, i) => (
                                    <TileComponent key={i} tile={tile} size="small" isDora={checkIsDora(tile, gameState.doraIndicators)} />
                                ))}
                            </div>
                        </div>
                        {/* 河（Right: Player 1） */}
                        <div className={`${styles.pondWrapper} ${styles.pondRight}`}>
                            <div className={styles.pond}>
                                {gameState.players[1].discards.map((tile, i) => (
                                    <TileComponent key={i} tile={tile} size="small" isDora={checkIsDora(tile, gameState.doraIndicators)} />
                                ))}
                            </div>
                        </div>
                        {/* 河（Top: Player 2） */}
                        <div className={`${styles.pondWrapper} ${styles.pondTop}`}>
                            <div className={styles.pond}>
                                {gameState.players[2].discards.map((tile, i) => (
                                    <TileComponent key={i} tile={tile} size="small" isDora={checkIsDora(tile, gameState.doraIndicators)} />
                                ))}
                            </div>
                        </div>
                        {/* 河（Left: Player 3） */}
                        <div className={`${styles.pondWrapper} ${styles.pondLeft}`}>
                            <div className={styles.pond}>
                                {gameState.players[3].discards.map((tile, i) => (
                                    <TileComponent key={i} tile={tile} size="small" isDora={checkIsDora(tile, gameState.doraIndicators)} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 右家 */}
                    <div className={styles.opponentRight}>
                        <PlayerPanel
                            player={gameState.players[1]}
                            isCurrentTurn={gameState.currentPlayerIndex === 1}
                            isSelf={false}
                            position="right"
                        />
                        {gameState.players[1].calls.length > 0 && (
                            <div className={styles.opponentCalls}>
                                {gameState.players[1].calls.map((call, cIdx) => (
                                    <div key={cIdx} className={styles.callGroupSmall}>
                                        {call.tiles.map((tile, tIdx) => (
                                            <TileComponent key={tIdx} tile={tile} size="small" />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className={styles.handVertical}>
                            {gameState.players[1].hand.map((_, i) => (
                                <div key={i} className={styles.tileBackVertical}></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 自家 */}
                <div className={styles.myArea}>
                    <PlayerPanel
                        player={myPlayer}
                        isCurrentTurn={isMyTurn}
                        isSelf={true}
                        position="bottom"
                    />

                    {/* 鳴き牌表示 */}
                    {myPlayer.calls.length > 0 && (
                        <div className={styles.callsArea}>
                            {myPlayer.calls.map((call, cIdx) => (
                                <div key={cIdx} className={styles.callGroup}>
                                    {call.tiles.map((tile, tIdx) => (
                                        <TileComponent key={tIdx} tile={tile} size="small" />
                                    ))}
                                    <span className={styles.callLabel}>
                                        {call.type === 'chi' ? 'チー' : call.type === 'pon' ? 'ポン' : 'カン'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* アクションボタン */}
                    <div className={styles.actions}>
                        {canTsumo && (
                            <button className={styles.actionBtn} onClick={handleTsumo}>
                                ツモ
                            </button>
                        )}
                        {canRon && (
                            <>
                                <button className={`${styles.actionBtn} ${styles.ronBtn}`} onClick={handleRon}>
                                    ロン
                                </button>
                                <button className={styles.actionBtn} onClick={handlePass}>
                                    パス
                                </button>
                                {callTimer > 0 && (
                                    <span className={styles.callTimerDisplay}>
                                        残り {callTimer}秒
                                    </span>
                                )}
                            </>
                        )}
                        {canCallPon && !canRon && (
                            <button className={`${styles.actionBtn} ${styles.ponBtn}`} onClick={handlePon}>
                                ポン
                            </button>
                        )}
                        {canCallChi && !canRon && !canCallPon && (
                            <button className={`${styles.actionBtn} ${styles.chiBtn}`} onClick={handleChi}>
                                チー
                            </button>
                        )}
                        {(canCallPon || canCallChi) && !canRon && (
                            <>
                                <button className={styles.actionBtn} onClick={handlePass}>
                                    パス
                                </button>
                                {callTimer > 0 && (
                                    <span className={styles.callTimerDisplay}>
                                        残り {callTimer}秒
                                    </span>
                                )}
                            </>
                        )}
                        {canRiichi && selectedTileId && (
                            <button className={styles.actionBtn} onClick={handleRiichi}>
                                リーチ
                            </button>
                        )}
                        {isMyTurn && selectedTileId && !canTsumo && (
                            <button className={styles.discardBtn} onClick={() => handleDiscard(selectedTileId)}>
                                打牌
                            </button>
                        )}
                    </div>

                    {/* 自分の手牌 */}
                    <div className={styles.myHand}>
                        {myPlayer.hand.map((tile, i) => (
                            <TileComponent
                                key={tile.id}
                                tile={tile}
                                isSelected={selectedTileId === tile.id}
                                onClick={() => handleTileClick(tile)}
                                isDora={checkIsDora(tile, gameState.doraIndicators)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* 結果モーダル */}
            {
                (gameState.phase === 'finished' || gameState.phase === 'draw') && (
                    <div className={styles.resultOverlay}>
                        <div className={styles.resultModal}>
                            {gameState.phase === 'draw' ? (
                                <>
                                    <h2>流局</h2>
                                    <p>山牌がなくなりました</p>
                                </>
                            ) : gameState.winningHand ? (
                                <>
                                    <h2>{gameState.winner === 0 ? '和了！' : `${gameState.players[gameState.winner!].name}の和了`}</h2>
                                    <div className={styles.winningHand}>
                                        {gameState.winningHand.tiles.map((tile, i) => (
                                            <TileComponent key={i} tile={tile} size="small" />
                                        ))}
                                    </div>
                                    <div className={styles.yakuList}>
                                        {gameState.winningHand.yaku.map((yaku, i) => (
                                            <div key={i} className={styles.yakuItem}>
                                                {yaku.nameJp} {yaku.han}翻
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.scoreResult}>
                                        {gameState.winningHand.han}翻 {gameState.winningHand.fu}符
                                        <br />
                                        <strong>{gameState.winningHand.score.toLocaleString()}点</strong>
                                    </div>
                                </>
                            ) : null}
                            <button className={styles.newGameBtn} onClick={handleNewGame}>
                                もう一度
                            </button>
                            <button className={styles.exitBtn} onClick={() => router.push('/')}>
                                終了
                            </button>
                        </div>
                    </div>
                )
            }


            {/* AI思考中インジケータ */}
            {
                isAiThinking && (
                    <div className={styles.thinkingIndicator}>
                        {gameState.players[gameState.currentPlayerIndex].name}が考え中...
                    </div>
                )
            }
        </main>
    );
}
