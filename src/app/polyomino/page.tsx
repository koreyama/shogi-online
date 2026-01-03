'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/GameMenu.module.css';
import gameStyles from './Polyomino.module.css';
import { PolyominoEngine } from './polyomino-engine';
import { GameState, Piece, PlayerColor, Point, BOARD_SIZE } from './polyomino-types';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';
import HideChatBot from '@/components/HideChatBot';
import { useAuth } from '@/hooks/useAuth';
import ColyseusPolyominoGame from './ColyseusPolyominoGame';

export default function PolyominoPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName, isLoaded } = usePlayer();
    const [joinMode, setJoinMode] = useState<'colyseus_random' | 'colyseus_room' | 'ai' | 'room_menu' | null>(null);

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);
    const [customRoomId, setCustomRoomId] = useState('');

    // Local AI game state
    const [engine] = useState(() => new PolyominoEngine());
    const [localGameState, setLocalGameState] = useState<GameState>(engine.getState());
    const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
    const [matrix, setMatrix] = useState<number[][] | null>(null);
    const [hoverPos, setHoverPos] = useState<Point | null>(null);

    // AI logic
    useEffect(() => {
        if (joinMode !== 'ai' || localGameState.isGameOver || localGameState.currentPlayer !== 'P2') return;

        const timer = setTimeout(() => {
            const move = engine.calculateBestMove('P2');
            if (move) {
                engine.placePiece(move.pieceId, move.shape, move.position);
                setLocalGameState({ ...engine.getState() });
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [localGameState, joinMode]);

    const handleSelectPiece = (piece: Piece) => {
        if (localGameState.isGameOver || localGameState.currentPlayer !== 'P1') return;
        if (selectedPieceId === piece.id) {
            setSelectedPieceId(null);
            setMatrix(null);
        } else {
            setSelectedPieceId(piece.id);
            setMatrix(piece.shape);
        }
    };

    const handleRotate = () => {
        if (!matrix) return;
        setMatrix(PolyominoEngine.rotate(matrix));
    };

    const handleFlip = () => {
        if (!matrix) return;
        setMatrix(PolyominoEngine.flip(matrix));
    };

    const handleBoardClick = (x: number, y: number) => {
        if (!selectedPieceId || !matrix || localGameState.isGameOver) return;
        const success = engine.placePiece(selectedPieceId, matrix, { x, y });
        if (success) {
            setLocalGameState({ ...engine.getState() });
            setSelectedPieceId(null);
            setMatrix(null);
        }
    };

    const handleBackToTop = () => {
        router.push('/');
    };

    const handleRoomCreate = () => {
        setCustomRoomId('');
        setJoinMode('colyseus_room');
    };

    const handleRoomJoin = () => {
        if (!customRoomId) return;
        setJoinMode('colyseus_room');
    };

    if (!isLoaded || authLoading || !user) return <div className={styles.main}>読み込み中...</div>;

    if (joinMode === 'colyseus_random') {
        return <><HideChatBot /><ColyseusPolyominoGame mode="random" /></>;
    }

    if (joinMode === 'colyseus_room') {
        return <><HideChatBot /><ColyseusPolyominoGame mode="room" roomId={customRoomId.trim() || undefined} /></>;
    }

    if (joinMode === 'ai') {
        return (
            <main className={styles.main}>
                <HideChatBot />
                <div className={styles.header}><button onClick={() => setJoinMode(null)} className={styles.backButton}><IconBack size={18} /> 終了</button></div>
                <div className={gameStyles.game_layout_wrapper}>
                    <div className={gameStyles.side_panel}>
                        <HandView
                            player="P2"
                            pieces={localGameState.hands.P2}
                            isActive={localGameState.currentPlayer === 'P2'}
                            selectedId={null}
                            onSelect={() => { }}
                            label="CPU (相手)"
                        />
                    </div>
                    <div className={gameStyles.center_panel}>
                        <div className={gameStyles.status_panel}>
                            <div className={gameStyles.current_turn} style={{ backgroundColor: localGameState.currentPlayer === 'P1' ? '#ecfeff' : '#fdf4ff', color: localGameState.currentPlayer === 'P1' ? '#0891b2' : '#c026d3' }}>
                                {localGameState.currentPlayer === 'P1' ? 'あなた' : 'CPU'}の手番
                            </div>
                            {localGameState.isGameOver && (
                                <div style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '4px' }}>
                                    勝利: {localGameState.projectedScore.P1 > localGameState.projectedScore.P2 ? 'あなた' : 'CPU'} ({localGameState.projectedScore.P1} vs {localGameState.projectedScore.P2})
                                </div>
                            )}
                        </div>
                        <div className={gameStyles.board_container}>
                            <div className={gameStyles.board} onMouseLeave={() => setHoverPos(null)}>
                                {localGameState.board.map((row, r) => (
                                    row.map((cellOwner, c) => {
                                        let className = gameStyles.cell;
                                        if (cellOwner === 'P1') className += ` ${gameStyles.cell_p1}`;
                                        if (cellOwner === 'P2') className += ` ${gameStyles.cell_p2}`;

                                        let startAttr = undefined;
                                        if (r === 4 && c === 4) startAttr = 'P1';
                                        if (r === 9 && c === 9) startAttr = 'P2';

                                        if (selectedPieceId && matrix && hoverPos) {
                                            const relativeR = r - hoverPos.y;
                                            const relativeC = c - hoverPos.x;
                                            if (relativeR >= 0 && relativeR < matrix.length && relativeC >= 0 && relativeC < matrix[0].length) {
                                                if (matrix[relativeR][relativeC] === 1) {
                                                    const isValid = engine.isValidMove(matrix, hoverPos, localGameState.currentPlayer);
                                                    className += isValid ? ` ${gameStyles.cell_valid}` : ` ${gameStyles.cell_invalid}`;
                                                }
                                            }
                                        }

                                        return (
                                            <div
                                                key={`${r}-${c}`}
                                                className={className}
                                                data-start={startAttr}
                                                onMouseEnter={() => setHoverPos({ x: c, y: r })}
                                                onClick={() => handleBoardClick(c, r)}
                                            />
                                        );
                                    })
                                ))}
                            </div>
                        </div>
                        <div className={gameStyles.controls_hint} style={{ visibility: selectedPieceId ? 'visible' : 'hidden' }}>
                            [Space] 回転 | [F] 反転
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'center' }}>
                                <button onClick={handleRotate} className={styles.secondaryBtn}>回転</button>
                                <button onClick={handleFlip} className={styles.secondaryBtn}>反転</button>
                            </div>
                        </div>
                    </div>
                    <div className={gameStyles.side_panel}>
                        <HandView
                            player="P1"
                            pieces={localGameState.hands.P1}
                            isActive={localGameState.currentPlayer === 'P1'}
                            selectedId={selectedPieceId}
                            onSelect={handleSelectPiece}
                            label={`${playerName} (あなた)`}
                        />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <button onClick={handleBackToTop} className={styles.backButton}>
                    <IconBack size={18} /> トップへ戻る
                </button>
            </div>

            <div className={styles.gameContainer}>
                <h1 className={styles.title}>BLOCK TERRITORY</h1>
                <p className={styles.subtitle}>盤面を自らの色で埋め尽くせ</p>

                {!joinMode && (
                    <div className={styles.modeSelection}>
                        <button onClick={() => setJoinMode('colyseus_random')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconDice size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>ランダムマッチ</span>
                            <span className={styles.modeBtnDesc}>誰かとすぐに対戦</span>
                        </button>

                        <button onClick={() => setJoinMode('room_menu')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconKey size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>ルーム対戦</span>
                            <span className={styles.modeBtnDesc}>友達と対戦</span>
                        </button>

                        <button onClick={() => setJoinMode('ai')} className={styles.modeBtn}>
                            <span className={styles.modeBtnIcon}><IconRobot size={48} color="var(--color-primary)" /></span>
                            <span className={styles.modeBtnTitle}>AI対戦</span>
                            <span className={styles.modeBtnDesc}>練習モード (オフライン)</span>
                        </button>
                    </div>
                )}

                {joinMode === 'room_menu' && (
                    <div className={styles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={handleRoomCreate} className={styles.primaryBtn} style={{ width: '100%', background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', padding: '1rem' }}>
                                    ルーム作成（ID自動発行）
                                </button>
                            </div>

                            <div style={{ position: 'relative', height: '1px', background: 'rgba(0,0,0,0.1)', width: '100%' }}>
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        className={styles.input}
                                        placeholder="ルームID"
                                        value={customRoomId}
                                        onChange={e => setCustomRoomId(e.target.value)}
                                        style={{ flex: 1, letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.1rem' }}
                                    />
                                    <button onClick={handleRoomJoin} className={styles.primaryBtn} style={{ width: 'auto', padding: '0 2rem', whiteSpace: 'nowrap' }}>
                                        参加
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setJoinMode(null)} className={styles.secondaryBtn} style={{ marginTop: '2rem' }}>
                            戻る
                        </button>
                    </div>
                )}

                {!joinMode && (
                    <div className={styles.contentSection}>
                        <h2 className={styles.contentTitle}>ルールと遊び方</h2>
                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>♟️</span>
                                <h3 className={styles.sectionTitle}>ゲームの目的</h3>
                            </div>
                            <p className={styles.textBlock}>
                                ブロックテリトリーは、手持ちのピースを盤面に配置し、より多くのマス目を埋めたプレイヤーが勝利する陣取りゲームです。<br />
                                すべてのピースを使い切るか、置ける場所がなくなるとゲーム終了です。
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

const HandView = ({ player, pieces, isActive, selectedId, onSelect, label }: {
    player: PlayerColor,
    pieces: Piece[],
    isActive: boolean,
    selectedId: string | null,
    onSelect: (p: Piece) => void,
    label: string
}) => {
    return (
        <div className={`${gameStyles.hand_container} ${player === 'P1' ? gameStyles.hand_p1 : gameStyles.hand_p2}`} style={{ opacity: isActive ? 1 : 0.5 }}>
            <h3 style={{ marginBottom: '10px', fontSize: '0.9rem' }}>{label}</h3>
            <div className={gameStyles.hand_grid}>
                {pieces.map(p => (
                    <div
                        key={p.id}
                        className={`${gameStyles.piece_wrapper} ${selectedId === p.id ? gameStyles.piece_selected : ''}`}
                        onClick={() => isActive && onSelect(p)}
                    >
                        <div className={gameStyles.mini_grid} style={{ gridTemplateColumns: `repeat(${p.shape[0].length}, 8px)` }}>
                            {p.shape.map((row, pr) => row.map((cell, pc) => (
                                <div key={`${pr}-${pc}`} className={`${gameStyles.mini_cell} ${cell ? (player === 'P1' ? gameStyles.p1_color : gameStyles.p2_color) : ''}`} style={{ opacity: cell ? 1 : 0, width: '8px', height: '8px' }} />
                            )))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
