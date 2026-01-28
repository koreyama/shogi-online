'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import navStyles from '@/styles/GameMenu.module.css';
import gameStyles from './page.module.css';
import { FloatingShapes } from '@/components/landing/FloatingShapes';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import { IconBack, IconDice, IconKey, IconRobot } from '@/components/Icons';
import ColyseusMarubatsuGame from './ColyseusMarubatsuGame';
import { MarubatsuBoard } from '@/components/MarubatsuBoard';
import HideChatBot from '@/components/HideChatBot';

export default function MarubatsuPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { playerName, isLoaded: playerLoaded } = usePlayer();

    const [joinMode, setJoinMode] = useState<'colyseus_random' | 'colyseus_room' | 'colyseus_room_active' | 'ai' | null>(null);
    const [customRoomId, setCustomRoomId] = useState('');

    // AI Local State
    const [localBoard, setLocalBoard] = useState<number[]>(Array(9).fill(0));
    const [localMoves, setLocalMoves] = useState<{ index: number, mark: number }[]>([]); // FIFO Queue
    const [localTurn, setLocalTurn] = useState<'o' | 'x'>('o'); // o=Self(1), x=AI(2)
    const [localStatus, setLocalStatus] = useState<'playing' | 'finished'>('playing');
    const [localWinner, setLocalWinner] = useState<string | null>(null);

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) router.push('/');
    }, [authLoading, user, router]);

    // AI Logic
    useEffect(() => {
        if (joinMode === 'ai' && localStatus === 'playing' && localTurn === 'x') {
            const timer = setTimeout(() => {
                const move = getBestAiMove(localBoard, localMoves, 2); // AI is 2
                if (move !== -1) {
                    handleLocalMove(move, 'x');
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [joinMode, localStatus, localTurn, localBoard, localMoves]);

    const handleLocalMove = (index: number, player: 'o' | 'x') => {
        if (localBoard[index] !== 0) return;

        const mark = player === 'o' ? 1 : 2;
        let newBoard = [...localBoard];
        let newMoves = [...localMoves];

        // FIFO Logic
        const playerMoves = newMoves.filter(m => m.mark === mark);
        if (playerMoves.length >= 3) {
            const oldMove = playerMoves[0];
            const idxToRemove = newMoves.findIndex(m => m === oldMove);
            if (idxToRemove !== -1) {
                newMoves.splice(idxToRemove, 1);
                newBoard[oldMove.index] = 0;
            }
        }

        newBoard[index] = mark;
        newMoves.push({ index, mark });

        setLocalBoard(newBoard);
        setLocalMoves(newMoves);

        // Check Win
        if (checkWin(newBoard, mark)) {
            setLocalStatus('finished');
            setLocalWinner(player);
        } else {
            setLocalTurn(player === 'o' ? 'x' : 'o');
        }
    };

    const resetLocalGame = () => {
        setLocalBoard(Array(9).fill(0));
        setLocalMoves([]);
        setLocalTurn('o');
        setLocalStatus('playing');
        setLocalWinner(null);
    };

    if (authLoading || !user || !playerLoaded) return <div className={navStyles.main}>Loading...</div>;

    // --- GAME VIEWS ---
    if (joinMode === 'colyseus_random') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}><button onClick={() => setJoinMode(null)} className={navStyles.backButton}><IconBack size={18} /> 終了</button></div>
                <ColyseusMarubatsuGame mode="random" playerName={playerName} />
            </main>
        );
    }

    if (joinMode === 'colyseus_room_active') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}><button onClick={() => setJoinMode(null)} className={navStyles.backButton}><IconBack size={18} /> 終了</button></div>
                <ColyseusMarubatsuGame mode="room" roomId={customRoomId || undefined} playerName={playerName} />
            </main>
        );
    }

    // AI View
    if (joinMode === 'ai') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={navStyles.header}><button onClick={() => setJoinMode(null)} className={navStyles.backButton}><IconBack size={18} /> 終了</button></div>

                <div className={gameStyles.gameLayout}>
                    <div className={gameStyles.leftPanel}>
                        <div className={gameStyles.playersSection}>
                            <div className={`${gameStyles.playerCard} ${localTurn === 'o' ? gameStyles.playerCardActive : ''}`}>
                                <div className={gameStyles.playerName}>{playerName}</div>
                                <div className={gameStyles.playerRole}>あなた (〇)</div>
                            </div>
                            <div className={`${gameStyles.playerCard} ${localTurn === 'x' ? gameStyles.playerCardActive : ''}`}>
                                <div className={gameStyles.playerName}>AI</div>
                                <div className={gameStyles.playerRole}>AI (✕)</div>
                            </div>
                        </div>
                    </div>

                    <div className={gameStyles.centerPanel}>
                        <MarubatsuBoard
                            board={localBoard}
                            onCellClick={(i) => localTurn === 'o' && handleLocalMove(i, 'o')}
                            disabled={localStatus !== 'playing' || localTurn !== 'o'}
                        />
                        <div style={{ marginTop: '1rem', color: '#718096', fontSize: '0.9rem' }}>
                            ※コマはそれぞれ3つまで。4つ目を置くと古いコマが消えます。
                        </div>
                        {localWinner && (
                            <div className={gameStyles.modalOverlay}>
                                <div className={gameStyles.modal}>
                                    <h2>{localWinner === 'o' ? 'あなたの勝ち！' : localWinner === 'x' ? 'AIの勝ち...' : '引き分け'}</h2>
                                    <div className={gameStyles.modalBtnGroup}>
                                        <button onClick={resetLocalGame} className={gameStyles.primaryBtn}>もう一度</button>
                                        <button onClick={() => setJoinMode(null)} className={gameStyles.secondaryBtn}>終了</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        );
    }

    // --- MENU VIEW (Room Selection) ---
    if (joinMode === 'colyseus_room') {
        return (
            <main className={navStyles.main}>
                <FloatingShapes />
                <div className={navStyles.header}><button onClick={() => setJoinMode(null)} className={navStyles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={navStyles.gameContainer}>
                    <h1 className={navStyles.title}>ルーム対戦</h1>
                    <div className={navStyles.joinSection}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>新しい部屋を作る</p>
                                <button onClick={() => { setCustomRoomId(''); setJoinMode('colyseus_room_active'); }} className={navStyles.primaryBtn} style={{ width: '100%' }}>
                                    ルーム作成
                                </button>
                            </div>
                            <div style={{ position: 'relative', height: '1px', background: 'rgba(255,255,255,0.2)', width: '100%' }}>
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '0 1rem', fontSize: '0.9rem', color: '#888' }}>または</span>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>友達の部屋に参加</p>
                                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                    <input
                                        className={navStyles.input}
                                        placeholder="ルームID"
                                        value={customRoomId}
                                        onChange={e => setCustomRoomId(e.target.value)}
                                        style={{ flex: 1, textAlign: 'center' }}
                                    />
                                    <button
                                        onClick={() => { if (customRoomId) setJoinMode('colyseus_room_active'); }}
                                        className={navStyles.secondaryBtn}
                                        disabled={!customRoomId}
                                        style={{ width: 'auto', padding: '0 3rem' }}
                                    >
                                        参加
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // --- MAIN MENU VIEW ---
    const theme = {
        '--theme-primary': '#475569',
        '--theme-secondary': '#1e293b',
        '--theme-tertiary': '#64748b',
        '--theme-bg-light': '#f8fafc',
        '--theme-text-title': 'linear-gradient(135deg, #1e293b 0%, #475569 50%, #64748b 100%)',
    } as React.CSSProperties;

    return (
        <main className={navStyles.main} style={theme}>
            <FloatingShapes />
            <div className={navStyles.header}><button onClick={() => router.push('/')} className={navStyles.backButton}><IconBack size={18} /> 戻る</button></div>

            <div className={navStyles.gameContainer}>
                <h1 className={navStyles.title}>マルバツゲーム</h1>
                <div className={navStyles.modeSelection}>
                    <button onClick={() => setJoinMode('colyseus_random')} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconDice size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>ランダムマッチ</span>
                        <span className={navStyles.modeBtnDesc}>世界中のプレイヤーと対戦</span>
                    </button>
                    <button onClick={() => setJoinMode('colyseus_room')} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconKey size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>ルーム対戦</span>
                        <span className={navStyles.modeBtnDesc}>友達と対戦</span>
                    </button>
                    <button onClick={() => setJoinMode('ai')} className={navStyles.modeBtn}>
                        <div className={navStyles.modeBtnIcon}><IconRobot size={32} /></div>
                        <span className={navStyles.modeBtnTitle}>AI対戦</span>
                        <span className={navStyles.modeBtnDesc}>コンピュータと練習</span>
                    </button>
                </div>
            </div>
            <div className={navStyles.contentSection}>
                <div className={navStyles.sectionBlock}>
                    <div className={navStyles.sectionHeader}>
                        <span className={navStyles.sectionIcon}>⚫⚪</span>
                        <h3 className={navStyles.sectionTitle}>ルール</h3>
                    </div>
                    <p className={navStyles.textBlock}>
                        縦・横・斜めのいずれかに同じマークを3つ並べた方が勝ちです。<br />
                        先手が「〇」、後手が「✕」です。<br />
                        <strong style={{ color: '#e53e3e' }}>※重要ルール：コマは3つまでしか置けません。4つ目を置くと、一番古い自分のコマが消えます。永遠に続く攻防を楽しんでください。</strong>
                    </p>
                </div>
            </div>
        </main>
    );
}

// Helpers
function checkWin(board: number[], mark: number): boolean {
    const wins = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    return wins.some(line => line.every(i => board[i] === mark));
}

// AI Helper with 3-piece forecast
function getBestAiMove(board: number[], moves: { index: number, mark: number }[], aiMark: number): number {
    const opponentMark = aiMark === 1 ? 2 : 1;
    const emptyIndices = board.map((v, i) => v === 0 ? i : -1).filter(i => i !== -1);
    // Note: if board is full (unlikely with 3-limit), empty is empty. But with 3 limit, there are always 3 empty squares if both have 3 pieces.

    // Simulate function
    const simulateWin = (candidateIdx: number, mark: number) => {
        const simMoves = [...moves];
        const simBoard = [...board];

        // FIFO simulation
        const playerMoves = simMoves.filter(m => m.mark === mark);
        if (playerMoves.length >= 3) {
            const oldMove = playerMoves[0];
            const idxToRemove = simMoves.indexOf(oldMove);
            if (idxToRemove !== -1) {
                simMoves.splice(idxToRemove, 1);
                simBoard[oldMove.index] = 0;
            }
        }

        // Use candidate
        simBoard[candidateIdx] = mark;
        return checkWin(simBoard, mark);
    };

    if (emptyIndices.length === 0) return -1;

    // 1. Try to win (taking into account FIFO removal)
    for (const i of emptyIndices) {
        if (simulateWin(i, aiMark)) return i;
    }
    // 2. Block opponent (taking into account THEIR FIFO removal)
    for (const i of emptyIndices) {
        if (simulateWin(i, opponentMark)) return i;
    }
    // 3. Center if available (and not risky? simplified)
    if (board[4] === 0) return 4;

    // 4. Random
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}
