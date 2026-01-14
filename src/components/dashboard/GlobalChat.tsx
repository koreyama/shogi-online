import React, { useState, useEffect, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import { IconChat, IconUser } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { getFriends } from '@/lib/firebase/users';
import { findAnswer } from '@/lib/chatbot/knowledge';
import Link from 'next/link';

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    type: string;
    timestamp: number;
}

interface LobbyUser {
    userId: string;
    name: string;
    status: string;
}

interface BotMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: number;
    link?: { text: string; url: string };
}

export default function GlobalChat({ user, initialIsOpen = false }: { user: any, initialIsOpen?: boolean }) {
    // const [client, setClient] = useState<Colyseus.Client | null>(null); // Removed unused state
    const [room, setRoom] = useState<Colyseus.Room | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<LobbyUser[]>([]);
    const [friendProfiles, setFriendProfiles] = useState<Record<string, { displayName: string, photoURL?: string }>>({});
    const [friends, setFriends] = useState<string[]>([]); // Keep this for easy filtering

    const [isOpen, setIsOpen] = useState(initialIsOpen);
    const [activeTab, setActiveTab] = useState<'chat' | 'friends' | 'bot'>('chat');
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const connectionIdRef = useRef<number>(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const botMessagesEndRef = useRef<HTMLDivElement>(null);

    // Bot State
    const [botMessages, setBotMessages] = useState<BotMessage[]>([
        {
            id: 'welcome',
            text: 'こんにちは！お困りごとはありますか？\nゲームのルールやサイトの使い方など、お気軽にどうぞ。',
            sender: 'bot',
            timestamp: Date.now()
        }
    ]);
    const [botInput, setBotInput] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false);


    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        botMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, botMessages, isOpen, activeTab]);

    // Fetch Friends
    useEffect(() => {
        if (!user) return;
        getFriends(user.uid).then((friendList) => {
            const accepted = friendList.filter((f: any) => f.status === 'accepted');

            setFriends(accepted.map((f: any) => f.uid));

            const profiles: Record<string, { displayName: string, photoURL?: string }> = {};
            accepted.forEach((f: any) => {
                profiles[f.uid] = { displayName: f.displayName, photoURL: f.photoURL };
            });
            setFriendProfiles(profiles);
        });
    }, [user]);

    // Connect to Lobby
    useEffect(() => {
        let roomInstance: Colyseus.Room | null = null;
        // Increment connection ID to invalidate previous attempts
        const currentConnectionId = ++connectionIdRef.current;

        const connect = async () => {
            if (!user) return;

            // Only update status if this is still the latest attempt
            if (currentConnectionId === connectionIdRef.current) setStatus('connecting');

            try {
                const { client } = await import('@/lib/colyseus');

                if (currentConnectionId !== connectionIdRef.current) return;

                const r = await client.joinOrCreate("lobby", {
                    userId: user.uid,
                    name: user.displayName || "Guest",
                });

                if (currentConnectionId !== connectionIdRef.current) {
                    r.leave();
                    return;
                }

                r.onStateChange((state: any) => {
                    if (currentConnectionId !== connectionIdRef.current) return;

                    // Users
                    const users: LobbyUser[] = [];
                    if (state.users) {
                        state.users.forEach((u: any) => users.push(u));
                    }
                    setOnlineUsers(users);

                    // Messages
                    const msgs: ChatMessage[] = [];
                    if (state.messages) {
                        state.messages.forEach((m: any) => msgs.push(m));
                    }
                    setMessages(msgs);
                });

                if (r.state.messages && r.state.messages.onAdd) {
                    r.state.messages.onAdd = (item: any) => {
                        if (currentConnectionId !== connectionIdRef.current) return;
                        setMessages(prev => [...prev, item]);
                    };
                }

                // Success! Set room and status.
                roomInstance = r;
                setRoom(r);
                setStatus('connected');
                console.log("Joined lobby", r.sessionId);

            } catch (e) {
                // Squelch error if we are cancelled OR if we somehow managed to connect anyway in a parallel universe (unlikely but safe)
                if (currentConnectionId === connectionIdRef.current) {
                    // Only set error if we don't have a room. 
                    // Note: setRoom(r) above sets state, so 'room' variable in closure is old, but we haven't set it yet if we are here.
                    console.warn("Lobby connection attempt failed or was interrupted:", e);
                    setStatus('error');
                }
            }
        };

        connect();

        return () => {
            // Cleanup: The next effect run will increment the ID, invalidating this one.
            // We also leave the room if we have one.
            roomInstance?.leave();
            setRoom(null);
        };
    }, [user]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !room) return;
        room.send("chat", { content: input });
        setInput('');
    };

    const sendBotMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!botInput.trim()) return;

        const userMsg: BotMessage = {
            id: Date.now().toString(),
            text: botInput,
            sender: 'user',
            timestamp: Date.now()
        };

        setBotMessages(prev => [...prev, userMsg]);
        setBotInput('');
        setIsBotTyping(true);

        // Simulate
        setTimeout(() => {
            const knowledge = findAnswer(userMsg.text);
            let botText = '申し訳ありません、その質問にはうまく答えられないかもしれません。\n別の言い方で聞いてみてください。';
            let botLink = undefined;

            if (knowledge) {
                botText = knowledge.answer;
                botLink = knowledge.link;
            }

            const botMsg: BotMessage = {
                id: (Date.now() + 1).toString(),
                text: botText,
                sender: 'bot',
                timestamp: Date.now(),
                link: botLink
            };

            setBotMessages(prev => [...prev, botMsg]);
            setIsBotTyping(false);
        }, 600 + Math.random() * 400);
    };

    // Filter Online Friends
    const onlineFriendList = onlineUsers.filter(u => friends.includes(u.userId));

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, fontFamily: 'Inter, sans-serif', alignItems: 'flex-end', display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        style={{
                            width: '90vw',
                            maxWidth: '350px',
                            height: '500px',
                            maxHeight: '70vh',
                            background: 'rgba(255, 255, 255, 0.98)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                            border: '1px solid rgba(255,255,255,0.4)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            marginBottom: '16px'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', overflowX: 'auto' }}>
                                <div
                                    title={room ? '接続済み' : status === 'error' ? '接続エラー' : '接続中...'}
                                    style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: room ? '#10b981' : status === 'connecting' ? '#f59e0b' : '#ef4444',
                                        marginRight: '4px',
                                        flexShrink: 0,
                                        cursor: 'help'
                                    }} />

                                {['chat', 'friends', 'bot'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            background: activeTab === tab ? '#3b82f6' : 'transparent',
                                            color: activeTab === tab ? 'white' : '#64748b',
                                            fontWeight: 600,
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {tab === 'chat' && 'チャット'}
                                        {tab === 'friends' && `フレンド(${onlineFriendList.length})`}
                                        {tab === 'bot' && 'サポート'}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: activeTab === 'friends' ? '#f8fafc' : '#ffffff' }}>

                            {/* GLOBAL CHAT */}
                            {activeTab === 'chat' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {messages.filter(msg => msg.senderId === user.uid || friends.includes(msg.senderId)).map((msg, i) => (
                                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.senderId === user.uid ? 'flex-end' : 'flex-start' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px', marginLeft: '4px' }}>{msg.senderName}</div>
                                            <div style={{
                                                padding: '8px 12px',
                                                background: msg.senderId === user.uid ? '#3b82f6' : '#f1f5f9',
                                                color: msg.senderId === user.uid ? 'white' : '#1e293b',
                                                borderRadius: msg.senderId === user.uid ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                                maxWidth: '85%',
                                                fontSize: '0.9rem',
                                                wordBreak: 'break-word',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}

                            {/* FRIENDS */}
                            {activeTab === 'friends' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {onlineFriendList.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px', fontSize: '0.9rem' }}>
                                            オンラインのフレンドはいません
                                        </div>
                                    ) : (
                                        onlineFriendList.map((u, i) => {
                                            // Prioritize the name from our friend list (checking by ID) if available
                                            // We need to keep the friends state as a map for this lookup. 
                                            // Ideally we refactor 'friends' state to be a Map<string, FriendProfile>.
                                            // But for minimum diff, we can do a lookup or just trust that `u.name` *should* be right? No user said it's wrong.
                                            // So I will change friends state to store objects.
                                            const friendProfile = friendProfiles[u.userId];
                                            const displayName = friendProfile?.displayName || u.name;

                                            return (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ width: '32px', height: '32px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                                        {friendProfile?.photoURL ? (
                                                            <img src={friendProfile.photoURL} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                                        ) : (
                                                            <IconUser size={16} />
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>{displayName}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#10b981' }}>● Online</div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            )}

                            {/* BOT */}
                            {activeTab === 'bot' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {botMessages.map((msg, i) => (
                                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                                            <div style={{
                                                padding: '8px 12px',
                                                background: msg.sender === 'user' ? '#3b82f6' : '#f0f9ff',
                                                color: msg.sender === 'user' ? 'white' : '#0c4a6e',
                                                borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                                border: msg.sender === 'bot' ? '1px solid #e0f2fe' : 'none',
                                                maxWidth: '85%',
                                                fontSize: '0.9rem',
                                                wordBreak: 'break-word',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}>
                                                {msg.text.split('\n').map((line, idx) => <div key={idx}>{line}</div>)}
                                                {msg.link && (
                                                    <div style={{ marginTop: '4px' }}>
                                                        <Link href={msg.link.url} style={{ color: '#0284c7', textDecoration: 'underline', fontWeight: 600 }}>
                                                            {msg.link.text} &rarr;
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isBotTyping && (
                                        <div style={{ alignSelf: 'flex-start', background: '#f0f9ff', padding: '8px 12px', borderRadius: '12px 12px 12px 0', border: '1px solid #e0f2fe' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#0c4a6e' }}>...</span>
                                        </div>
                                    )}
                                    <div ref={botMessagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        {(activeTab === 'chat' || activeTab === 'bot') && (
                            <form
                                onSubmit={activeTab === 'chat' ? sendMessage : sendBotMessage}
                                style={{ padding: '12px', borderTop: '1px solid #e2e8f0', background: 'white' }}
                            >
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        value={activeTab === 'chat' ? input : botInput}
                                        onChange={e => activeTab === 'chat' ? setInput(e.target.value) : setBotInput(e.target.value)}
                                        placeholder={activeTab === 'chat' ? "メッセージを入力..." : "質問を入力..."}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            borderRadius: '20px',
                                            border: '1px solid #cbd5e0',
                                            fontSize: '0.9rem',
                                            outline: 'none'
                                        }}
                                    />
                                    <button type="submit" style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <IconChat size={16} />
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    float: 'right'
                }}
            >
                <IconChat size={28} />
                {onlineFriendList.length > 0 && !isOpen && (
                    <span style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        background: '#10b981',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: '2px solid white'
                    }} />
                )}
            </motion.button>
        </div>
    );
}
