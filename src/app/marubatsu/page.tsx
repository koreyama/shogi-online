'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    const [localTurn, setLocalTurn] = useState<'o' | 'x'>('o'); // o=Self, x=AI
    const [localStatus, setLocalStatus] = useState<'playing' | 'finished'>('playing');
    const [localWinner, setLocalWinner] = useState<string | null>(null);

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) router.push('/');
    }, [authLoading, user, router]);

    // AI Logic (Simple Random + Block/Win logic)
    useEffect(() => {
        if (joinMode === 'ai' && localStatus === 'playing' && localTurn === 'x') {
            const timer = setTimeout(() => {
                const move = getBestAiMove(localBoard);
                if (move !== -1) {
                    handleLocalMove(move, 'x');
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [joinMode, localStatus, localTurn, localBoard]);

    const handleLocalMove = (index: number, player: 'o' | 'x') => {
        if (localBoard[index] !== 0) return;

        const newBoard = [...localBoard];
        newBoard[index] = player === 'o' ? 1 : 2;
        setLocalBoard(newBoard);

        // Check Win
        if (checkWin(newBoard, player === 'o' ? 1 : 2)) {
            setLocalStatus('finished');
            setLocalWinner(player);
        } else if (newBoard.every(c => c !== 0)) {
            setLocalStatus('finished');
            setLocalWinner('draw');
        } else {
            setLocalTurn(player === 'o' ? 'x' : 'o');
        }
    };

    const resetLocalGame = () => {
        setLocalBoard(Array(9).fill(0));
        setLocalTurn('o');
        setLocalStatus('playing');
        setLocalWinner(null);
    };

    if (authLoading || !user || !playerLoaded) return <div className={gameStyles.main}>Loading...</div>;

    // --- GAME VIEWS ---
    if (joinMode === 'colyseus_random') {
        return (
            <main className={gameStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={gameStyles.header}><button onClick={() => setJoinMode(null)} className={gameStyles.backButton}><IconBack size={18} /> 終了</button></div>
                <ColyseusMarubatsuGame mode="random" playerName={playerName} />
            </main>
        );
    }

    if (joinMode === 'colyseus_room_active') {
        return (
            <main className={gameStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={gameStyles.header}><button onClick={() => setJoinMode(null)} className={gameStyles.backButton}><IconBack size={18} /> 終了</button></div>
                <ColyseusMarubatsuGame mode="room" roomId={customRoomId || undefined} playerName={playerName} />
            </main>
        );
    }

    if (joinMode === 'ai') {
        return (
            <main className={gameStyles.main}>
                <FloatingShapes />
                <HideChatBot />
                <div className={gameStyles.header}><button onClick={() => setJoinMode(null)} className={gameStyles.backButton}><IconBack size={18} /> 終了</button></div>

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

    // --- MENU VIEW ---
    if (joinMode === 'colyseus_room') {
        return (
            <main className={gameStyles.main}>
                <FloatingShapes />
                <div className={gameStyles.header}><button onClick={() => setJoinMode(null)} className={gameStyles.backButton}><IconBack size={18} /> 戻る</button></div>
                <div className={gameStyles.gameContainer}>
                    <h1 className={gameStyles.modeBtnTitle} style={{ fontSize: '2rem', marginBottom: '1rem' }}>ルーム対戦</h1>
                    <div className={gameStyles.joinSection}>
                        <button onClick={() => { setCustomRoomId(''); setJoinMode('colyseus_room_active'); }} className={gameStyles.primaryBtn} style={{ width: '100%' }}>
                            ルーム作成
                        </button>
                        <p>または</p>
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <input
                                className={gameStyles.input}
                                placeholder="ルームID"
                                value={customRoomId}
                                onChange={e => setCustomRoomId(e.target.value)}
                                style={{ flex: 1, textAlign: 'center' }}
                            />
                            <button
                                onClick={() => { if (customRoomId) setJoinMode('colyseus_room_active'); }}
                                className={gameStyles.secondaryBtn}
                                disabled={!customRoomId}
                            >
                                参加
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className={gameStyles.main}>
            <FloatingShapes />
            <div className={gameStyles.header}><button onClick={() => router.push('/')} className={gameStyles.backButton}><IconBack size={18} /> 戻る</button></div>

            <div className={gameStyles.gameContainer}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2d3748' }}>マルバツゲーム</h1>
                <div className={gameStyles.modeSelection}>
                    <button onClick={() => setJoinMode('colyseus_random')} className={gameStyles.modeBtn}>
                        <IconDice size={32} />
                        <span className={gameStyles.modeBtnTitle}>ランダムマッチ</span>
                    </button>
                    <button onClick={() => setJoinMode('colyseus_room')} className={gameStyles.modeBtn}>
                        <IconKey size={32} />
                        <span className={gameStyles.modeBtnTitle}>ルーム対戦</span>
                    </button>
                    <button onClick={() => setJoinMode('ai')} className={gameStyles.modeBtn}>
                        <IconRobot size={32} />
                        <span className={gameStyles.modeBtnTitle}>AI対戦</span>
                    </button>
                </div>
            </div>
            <div className={gameStyles.contentSection}>
                <h2 className={gameStyles.contentTitle}>ルール</h2>
                <p className={gameStyles.textBlock}>
                    縦・横・斜めのいずれかに同じマークを3つ並べた方が勝ちです。<br />
                    先手が「〇」、後手が「✕」です。
                </p>
            </div>
        </main>
    );
}

// Helpers
function checkWin(board: number[], mark: number): boolean {
    const wins = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    return wins.some(line => line.every(i => board[i] === mark));
}

function getBestAiMove(board: number[]): number {
    const emptyIndices = board.map((v, i) => v === 0 ? i : -1).filter(i => i !== -1);
    if (emptyIndices.length === 0) return -1;

    // 1. Try to win
    for (const i of emptyIndices) {
        const temp = [...board]; temp[i] = 2; // AI is 2
        if (checkWin(temp, 2)) return i;
    }
    // 2. Block opponent
    for (const i of emptyIndices) {
        const temp = [...board]; temp[i] = 1; // Opponent is 1
        if (checkWin(temp, 1)) return i;
    }
    // 3. Center
    if (board[4] === 0) return 4;

    // 4. Random
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}
