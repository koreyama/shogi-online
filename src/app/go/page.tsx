'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import menuStyles from '@/styles/GameMenu.module.css';
import { IconBack, IconRobot, IconDice, IconKey } from '@/components/Icons';
import { useAuth } from '@/hooks/useAuth';
import GoAiGame from './GoAiGame';
import ColyseusGoGame from './ColyseusGoGame';
import HideChatBot from '@/components/HideChatBot';

type GameMode = 'select' | 'ai' | 'online-random' | 'online-room';

export default function GoPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [mode, setMode] = useState<GameMode>('select');
    const [roomIdInput, setRoomIdInput] = useState('');
    const [showRoomInput, setShowRoomInput] = useState(false);

    const userName = user?.displayName || "Guest";
    const userId = user?.uid || "guest-" + Math.floor(Math.random() * 10000);

    const handleBack = () => {
        if (mode !== 'select') {
            if (confirm('Are you sure you want to quit?')) {
                setMode('select');
                setShowRoomInput(false);
            }
        } else {
            router.push('/');
        }
    };

    const startOnlineRoom = () => {
        if (!roomIdInput.trim()) {
            // Create
            setMode('online-room');
        } else {
            // Join
            setMode('online-room');
        }
    };

    if (mode === 'ai') {
        return (
            <>
                <HideChatBot />
                <button className={styles.backButton} onClick={handleBack} style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 1000 }}>
                    <IconBack /> Back
                </button>
                <GoAiGame />
            </>
        );
    }

    if (mode === 'online-random' || mode === 'online-room') {
        return (
            <>
                <HideChatBot />
                <button className={styles.backButton} onClick={handleBack} style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 1000 }}>
                    <IconBack /> Back
                </button>
                <ColyseusGoGame
                    mode={mode === 'online-random' ? 'random' : 'room'}
                    roomId={mode === 'online-room' && roomIdInput ? roomIdInput : undefined}
                    userData={{ name: userName, id: userId }}
                />
            </>
        );
    }

    return (
        <div className={styles.main}>
            <div className={styles.setupContainer}>
                <button className={styles.backButton} onClick={() => router.push('/')} style={{ alignSelf: 'flex-start' }}>
                    <IconBack /> Home
                </button>

                <h1 className={styles.title}>囲碁</h1>
                <p className={styles.subtitle}>ゲームモードを選択してください</p>

                <div className={styles.modeSelection}>
                    <button className={styles.modeBtn} onClick={() => setMode('online-random')}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><IconDice size={40} /></div>
                        <div>ランダム対戦</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>オンラインで誰かと対局</div>
                    </button>

                    <button className={styles.modeBtn} onClick={() => setShowRoomInput(true)}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><IconKey size={40} /></div>
                        <div>合言葉マッチ</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>友達と合言葉で対局</div>
                    </button>

                    <button className={styles.modeBtn} onClick={() => setMode('ai')}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><IconRobot size={40} /></div>
                        <div>CPU対戦</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>AIと対局練習</div>
                    </button>
                </div>

                {showRoomInput && (
                    <div className={styles.joinSection}>
                        <h3>ルーム対戦</h3>
                        <p>合言葉を入力して参加、または空欄で新規作成</p>
                        <input
                            type="text"
                            placeholder="合言葉 (任意)"
                            value={roomIdInput}
                            onChange={(e) => setRoomIdInput(e.target.value)}
                            className={menuStyles.input}
                            style={{ padding: '0.8rem', fontSize: '1rem', width: '200px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                        <button
                            className={menuStyles.primaryBtn}
                            onClick={startOnlineRoom}
                            style={{ padding: '0.8rem 2rem', marginTop: '1rem' }}
                        >
                            {roomIdInput ? 'ルームに参加' : 'ルームを作成'}
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.rulesContainer}>
                <h2>囲碁のルールと遊び方</h2>

                <h3>基本ルール</h3>
                <ul>
                    <li>黒番と白番が交互に、盤上の交点に石を打ちます。</li>
                    <li>一度置いた石は動かせません（囲まれて取られる場合を除く）。</li>
                    <li>パスをすることができます。双方が連続してパスをすると終局となります。</li>
                </ul>

                <h3>石の取り方</h3>
                <p>
                    相手の石の縦横の連結している線（呼吸点）をすべて自分の石で塞ぐと、その石を取って「アゲハマ」にすることができます。
                    盤の端にある石は、少ない手数で囲むことができます。
                </p>

                <h3>勝敗の決め方（地）</h3>
                <p>
                    終局後、自分の石で囲んだ空交点の数（地）と、取った相手の石（アゲハマ）の合計が多い方が勝ちとなります。
                    （本ゲームでは簡易的な日本ルールを採用しており、アゲハマを計算に含めます）
                </p>

                <h3>禁止手</h3>
                <ul>
                    <li><strong>着手禁止点（自殺手）:</strong> 打った瞬間に自分の石が囲まれて取られてしまう場所には打てません（ただし、打つことで相手の石を取れる場合は打てます）。</li>
                    <li><strong>コウ（劫）:</strong> 相手に石を1つ取られた直後に、取り返して元の形に戻るような手は打てません。別の場所に打って（コウ材）、相手が受けてから取り返す必要があります。</li>
                </ul>

                <h3>ゲームの進行</h3>
                <ol>
                    <li>対局開始時、黒番から打ち始めます（ハンデなしの場合）。</li>
                    <li>終局後、自動的に整地は行われないため、アゲハマの数を参考に勝敗を確認してください。</li>
                    <li>オンライン対戦では、相手との合意による終局（両者パス）か、投了によって決着がつきます。</li>
                </ol>
            </div>
        </div>
    );
}
