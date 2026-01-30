import React, { useState, useEffect, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import styles from './WerewolfGame.module.css';
import { IconUser, IconBack, IconChat } from '@/components/Icons';

interface Player {
    id: string;
    name: string;
    role: string;
    isAlive: boolean;
    isHost: boolean;
    votedFor: string;
    checked: boolean;
    wantsToSkip: boolean;
}

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    type: 'normal' | 'system' | 'werewolf' | 'dead';
    timestamp: number;
}

interface GameSettings {
    discussionTime: number;
    nightTime: number;
    villagerCount: number;
    werewolfCount: number;
    seerCount: number;
    mediumCount: number;
    bodyguardCount: number;
    madmanCount: number;
    canFirstNightAttack: boolean;
}

interface WerewolfGameProps {
    client: Colyseus.Client;
    room: Colyseus.Room;
    initialPlayers: Player[];
    onLeave: () => void;
    onError?: (error: string) => void;
}

export default function WerewolfGame({ client, room, initialPlayers, onLeave, onError }: WerewolfGameProps) {
    const [players, setPlayers] = useState<Player[]>(initialPlayers);
    const [serverMessages, setServerMessages] = useState<ChatMessage[]>([]);

    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

    // Memoize and limit total messages to prevent "tail" crash
    const messages = React.useMemo(() => {
        const combined = [...serverMessages, ...localMessages].sort((a, b) => a.timestamp - b.timestamp);
        return combined.slice(-150);
    }, [serverMessages, localMessages]);

    const [phase, setPhase] = useState('lobby');
    const [dayCount, setDayCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [winner, setWinner] = useState('');
    const [settings, setSettings] = useState<GameSettings | null>(null);
    const [myRole, setMyRole] = useState<string>('');
    const [chatInput, setChatInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [showPhaseAnnouncement, setShowPhaseAnnouncement] = useState(false);

    const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
    const messageListenerAttached = useRef(false);


    useEffect(() => {
        setSelectedTarget(null);

        // Trigger announcement on phase change
        if (phase !== 'lobby') {
            setShowPhaseAnnouncement(true);
            const timer = setTimeout(() => setShowPhaseAnnouncement(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // Sync state
    useEffect(() => {
        if (!room) return;

        // Initialize state immediately if available
        if (room.state) {
            updateState(room.state);
        }

        // Listen for state changes (Generic Schema approach)
        room.onStateChange((state: any) => {
            updateState(state);
        });

        // Listen for specific messages
        room.onMessage("your_role", (role: string) => setMyRole(role));
        room.onMessage("error", (msg: string) => {
            setLocalMessages(prev => [...prev, {
                id: Math.random().toString(), senderId: "system", senderName: "システム",
                content: msg,
                type: 'system' as const, timestamp: Date.now()
            }]);
        });
        room.onMessage("seer_result", (res: any) => {
            console.log("Client received seer_result:", res);
            setLocalMessages(prev => {
                const newMsg = {
                    id: Math.random().toString(), senderId: "system", senderName: "システム",
                    content: `【占い結果】\n対象: ${res.targetName}\n結果: 【${res.isWerewolf ? '人狼' : '人間'}】 です`,
                    type: 'system' as const, timestamp: Date.now()
                };
                console.log("Adding seer message:", newMsg);
                return [...prev, newMsg];
            });
        });

        // Listen for messages from the state (Handled in updateState via ref check)
        room.onMessage("medium_result", (res: any) => {
            setLocalMessages(prev => [...prev, {
                id: Math.random().toString(), senderId: "system", senderName: "システム",
                content: `【霊媒結果】\n昨日の処刑者 ${res.targetName} は...\n【${res.isWerewolf ? '人狼' : '人間'}】 でした`,
                type: 'system' as const, timestamp: Date.now()
            }]);
        });
        // room.onMessage("game_over", (res: any) => alert(`ゲーム終了! 勝者: ${res.winner === 'villagers' ? '市民チーム' : '人狼チーム'}`));

        return () => {
            room.removeAllListeners();
        };
    }, [room]);

    const updateState = (state: any) => {
        if (!state) return;

        // Sync Phase & Timer
        if (state.phase) {
            setPhase(state.phase);
            if (state.phase === 'result' && state.winner) {
                setWinner(state.winner);
            } else if (state.phase === 'lobby') {
                setWinner('');
            }
        }
        if (state.dayCount !== undefined) setDayCount(state.dayCount);
        if (state.timeLeft !== undefined) setTimeLeft(state.timeLeft);

        // Sync Players
        const currentPlayers: Player[] = [];
        if (state.players) {
            if (state.players.forEach) {
                state.players.forEach((p: any) => currentPlayers.push(p));
            } else {
                Object.values(state.players).forEach((p: any) => currentPlayers.push(p));
            }
        }
        setPlayers([...currentPlayers]);



        // Sync Messages - limit to last 100 to prevent crash and "tail" growth
        if (state.messages) {
            const msgs: ChatMessage[] = [];
            state.messages.forEach((m: any) => msgs.push({
                ...m,
                id: m.id || Math.random().toString(), // Ensure ID
                content: String(m.content) // Force string
            }));
            setServerMessages(msgs.slice(-100)); // Limit history
        }
        if (state.settings) {
            setSettings({ ...state.settings });
        }
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleStart = () => {
        room.send("start_game");
    };

    const handleSkipVote = () => {
        room.send("skip_discussion");
    };

    const handleVote = (targetId: string) => {
        setSelectedTarget(targetId);
        if (phase === 'day_vote') {
            room.send("vote", targetId);
        } else if (phase === 'night_action') {
            room.send("night_action", targetId);
        }
    };

    const sendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        let type = 'normal';
        if (myRole === 'werewolf' && (phase === 'night_action' || chatInput.startsWith('/w'))) {
            type = 'werewolf';
        }

        room.send("chat", { content: chatInput, type });
        setChatInput('');
    };

    const isMe = (p: Player) => p.id === room?.sessionId;
    const me = players.find(p => isMe(p));

    // Determine if action panel should be shown
    const isWerewolfAttackForbidden = myRole === 'werewolf' && phase === 'night_action' && dayCount === 1 && !settings?.canFirstNightAttack;

    // Alive check added to day_vote as well
    const canAction = (phase === 'day_vote' && me?.isAlive) ||
        (phase === 'night_action' && me?.isAlive && ['werewolf', 'seer', 'bodyguard'].includes(myRole) && !isWerewolfAttackForbidden);

    const displayMessages = messages.filter(m => {
        if (m.type === 'dead') return !me?.isAlive || phase === 'result'; // Only dead can see dead chat
        if (m.type === 'werewolf') return myRole === 'werewolf' || !me?.isAlive; // Werewolf chat visible to werewolves and dead
        return true;
    });

    return (
        <div className={styles.container} data-phase={phase === 'lobby' ? 'lobby' : phase.includes('night') ? 'night' : phase === 'result' ? 'result' : 'day'}>
            {/* Cinematic Phase Announcement Overlay */}
            <div className={`${styles.phaseAnnouncement} ${showPhaseAnnouncement ? styles.visible : ''}`}>
                <div className={styles.announcementContent}>
                    <h2>{getPhaseIcon(phase, winner)} {getPhaseLabel(phase, winner)}</h2>
                    <p>{getPhaseDescription(phase, winner)}</p>
                </div>
            </div>
            <header className={styles.header}>
                <div className={styles.gameInfo}>
                    <button onClick={onLeave} className={styles.backButton}>
                        <IconBack size={16} /> 退室
                    </button>
                    <div className={styles.roomIdInfo}>
                        Room ID: <span>{room.roomId}</span>
                    </div>
                </div>

                <div className={styles.phaseInfo}>
                    <span className={styles.phaseLabel}>{getPhaseIcon(phase, winner)} {getPhaseLabel(phase, winner)}</span>
                    <span className={styles.timer}>{timeLeft}</span>

                    {phase === 'day_conversation' && me?.isAlive && (
                        <button
                            className={`${styles.skipBtn} ${me.wantsToSkip ? styles.active : ''}`}
                            onClick={handleSkipVote}
                            title="8割の同意でスキップ"
                        >
                            ⏩ 時短 ({players.filter(p => p.isAlive && p.wantsToSkip).length}/{Math.ceil(players.filter(p => p.isAlive).length * 0.8)})
                        </button>
                    )}
                </div>

                {phase === 'result' && (
                    <div className={styles.adminControls} style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px' }}>
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>10秒後にロビーに戻ります...</p>
                    </div>
                )}

                {myRole && (
                    <div className={`${styles.roleBadge} ${styles[myRole]}`}>
                        <span style={{ fontSize: '1.2em' }}>{getRoleIcon(myRole)}</span>
                        <span>{getRoleLabel(myRole)}</span>
                    </div>
                )}
            </header>

            <div className={styles.mainContent}>
                {/* Players List */}
                <div className={styles.playersPanel}>
                    <h3>参加者 ({players.length})</h3>
                    <div className={styles.playerList}>
                        {players.map(p => (
                            <div key={p.id} className={`${styles.playerCard} ${!p.isAlive ? styles.dead : ''} ${isMe(p) ? styles.me : ''}`}>
                                <div className={styles.avatarPlaceholder}>
                                    <IconUser size={20} />
                                </div>
                                <div className={styles.playerInfo}>
                                    <span className={styles.playerName}>{p.name} {p.isHost && '👑'}</span>
                                    <span className={`${styles.playerStatus} ${p.isAlive ? styles.alive : styles.dead}`}>{p.isAlive ? '生存' : '死亡'}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {phase === 'lobby' && settings && (
                        <div className={styles.settingsPanel}>
                            <h4>ゲーム設定 {me?.isHost ? '(変更可能)' : '(閲覧のみ)'}</h4>
                            <SettingCounter label="👱 市民" value={settings.villagerCount} onChange={(v) => room.send("update_settings", { villagerCount: v })} readonly={!me?.isHost} />
                            <SettingCounter label="🐺 人狼" value={settings.werewolfCount} onChange={(v) => room.send("update_settings", { werewolfCount: v })} readonly={!me?.isHost} />
                            <SettingCounter label="🔮 占い師" value={settings.seerCount} onChange={(v) => room.send("update_settings", { seerCount: v })} readonly={!me?.isHost} />
                            <SettingCounter label="👻 霊媒師" value={settings.mediumCount} onChange={(v) => room.send("update_settings", { mediumCount: v })} readonly={!me?.isHost} />
                            <SettingCounter label="🛡️ 騎士" value={settings.bodyguardCount} onChange={(v) => room.send("update_settings", { bodyguardCount: v })} readonly={!me?.isHost} />
                            <SettingCounter label="🤡 狂人" value={settings.madmanCount} onChange={(v) => room.send("update_settings", { madmanCount: v })} readonly={!me?.isHost} />

                            <div className={styles.settingRow}>
                                <span>初日襲撃</span>
                                <div className={styles.counter}>
                                    <button
                                        onClick={() => me?.isHost && room.send("update_settings", { canFirstNightAttack: !settings.canFirstNightAttack })}
                                        style={{ width: 'auto', padding: '4px 12px', fontSize: '0.8rem', opacity: me?.isHost ? 1 : 0.7, cursor: me?.isHost ? 'pointer' : 'default' }}
                                    >
                                        {settings.canFirstNightAttack ? "あり" : "なし"}
                                    </button>
                                </div>
                            </div>

                            {me?.isHost && (
                                <button className={styles.startBtn} onClick={handleStart}>ゲーム開始</button>
                            )}
                            {!me?.isHost && (
                                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px' }}>ホストがゲームを開始するのを待っています...</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Chat Area */}
                <div className={styles.chatPanel}>
                    <div className={styles.chatMessages} ref={chatContainerRef}>
                        {messages.length === 0 && (
                            <div className={styles.message} style={{ alignSelf: 'center', background: 'transparent', boxShadow: 'none' }}>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>会話履歴はまだありません</p>
                            </div>
                        )}
                        {displayMessages.map((msg, i) => (
                            <div key={i} className={`${styles.message} ${styles[msg.type]}`}>
                                {msg.type !== 'system' && <span className={styles.msgSender}>{msg.senderName}</span>}
                                <span className={styles.msgContent}>{msg.content}</span>
                            </div>
                        ))}
                    </div>
                    <form className={styles.chatInput} onSubmit={sendChat}>
                        <input
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            placeholder={!me?.isAlive ? "霊界チャット..." : phase === 'night_action' && myRole === 'werewolf' ? "人狼チャット (赤字になります)..." : "メッセージを入力..."}
                        />
                        <button type="submit"><IconChat size={20} /></button>
                    </form>
                </div>

                {/* Action Area */}
                <div className={styles.actionPanel}>
                    {canAction && (
                        <div className={styles.actionBox}>
                            <h3>{phase === 'day_vote' ? '投票' : '夜のアクション'}</h3>
                            <div className={styles.targetList}>
                                {players.filter(p => !isMe(p) && p.isAlive).map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleVote(p.id)}
                                        className={`${styles.targetBtn} ${selectedTarget === p.id ? styles.selected : ''}`}
                                    >
                                        <span>{p.name}</span>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{getActionLabel(phase, myRole)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SettingCounter({ label, value, onChange, readonly }: { label: string, value: number, onChange: (v: number) => void, readonly?: boolean }) {
    return (
        <div className={styles.settingRow}>
            <span>{label}</span>
            <div className={styles.counter}>
                {!readonly && <button onClick={() => onChange(Math.max(0, value - 1))}>-</button>}
                <span>{value}</span>
                {!readonly && <button onClick={() => onChange(value + 1)}>+</button>}
            </div>
        </div>
    );
}

function getPhaseLabel(phase: string, winner?: string) {
    const map: { [key: string]: string } = {
        'lobby': '待機中',
        'day_conversation': '昼：議論',
        'day_vote': '昼：投票',
        'day_execution': '昼：処刑',
        'night_action': '夜：行動',
        'result': '結果発表'
    };
    if (phase === 'result' && winner) {
        if (winner === 'villagers') return '市民チーム 勝利！';
        if (winner === 'werewolves') return '人狼チーム 勝利！';
    }
    return map[phase] || phase;
}

function getPhaseIcon(phase: string, winner?: string) {
    if (phase.includes('day')) return '☀️';
    if (phase.includes('night')) return '🌙';
    if (phase === 'result') {
        if (winner === 'villagers') return '🎉';
        if (winner === 'werewolves') return '🐺';
        return '🏆';
    }
    return '⏳';
}

function getRoleLabel(role: string) {
    const map: { [key: string]: string } = {
        'villager': '市民',
        'werewolf': '人狼',
        'seer': '占い師',
        'medium': '霊媒師',
        'bodyguard': '騎士',
        'madman': '狂人'
    };
    return map[role] || role;
}

function getRoleIcon(role: string) {
    const map: { [key: string]: string } = {
        'villager': '👱',
        'werewolf': '🐺',
        'seer': '🔮',
        'medium': '👻',
        'bodyguard': '🛡️',
        'madman': '🤡'
    };
    return map[role] || '❓';
}

function getActionLabel(phase: string, role: string) {
    if (phase === 'day_vote') return '投票';
    if (role === 'werewolf') return '襲撃';
    if (role === 'seer') return '占う';
    if (role === 'bodyguard') return '護衛';
    return '選択';
}

function getPhaseDescription(phase: string, winner?: string) {
    if (phase === 'day_conversation') return '議論の時間です。疑わしい人物を探し出してください。';
    if (phase === 'day_vote') return '運命の投票の時間です。処刑する人物を選んでください。';
    if (phase === 'day_execution') return '処刑が執行されます...';
    if (phase === 'night_action') return '静寂の夜が訪れました。それぞれの役割を果たしてください。';
    if (phase === 'result') {
        if (winner === 'villagers') return '人狼を追放しました！平和が訪れます。';
        if (winner === 'werewolves') return '村は人狼によって支配されました...';
        return '勝敗が決しました。';
    }
    return 'ゲーム開始を待っています。';
}
