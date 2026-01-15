import React, { useState, useEffect, useRef } from 'react';
import * as Colyseus from 'colyseus.js';
import { IconChat, IconUser } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { getFriends } from '@/lib/firebase/users';
import { findAnswer } from '@/lib/chatbot/knowledge';
import { subscribeToUnread, subscribeToConversation, sendPrivateMessageWithRoomId, markAsRead, ChatMessage as FSChatMessage } from '@/lib/firebase/chat';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    const [activeTab, setActiveTab] = useState<'chat' | 'friends' | 'bot' | 'dm'>('chat');
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const connectionIdRef = useRef<number>(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const botMessagesEndRef = useRef<HTMLDivElement>(null);
    const dmMessagesEndRef = useRef<HTMLDivElement>(null);

    // ... (existing Bot State lines are below, skipped in replacement)


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

    // Direct Message State (Firestore)
    const [conversationMessages, setConversationMessages] = useState<FSChatMessage[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
    const [unreadDMs, setUnreadDMs] = useState<Record<string, number>>({});
    const [toast, setToast] = useState<{ senderId: string; senderName: string; content: string } | null>(null);

    // Subscribe to Unread Messages (Global)
    useEffect(() => {
        if (!user) return;

        // Listen to RTDB Unread Counts
        const unsubscribe = subscribeToUnread(user.uid, (counts) => {
            setUnreadDMs(counts);
        });

        return () => unsubscribe();
    }, [user]);

    // Subscribe to Active Conversation
    useEffect(() => {
        if (!user || !selectedFriend || activeTab !== 'dm') return;

        // @ts-ignore
        const unsubscribe = subscribeToConversation(user.uid, selectedFriend, (messages) => {
            setConversationMessages(messages);
            // Read marking is handled by the subscription internal side-effect (mostly).
        });

        // @ts-ignore
        return () => unsubscribe();
    }, [user, selectedFriend, activeTab]);


    // Refs for accessing state in socket callbacks
    const stateRef = useRef({ isOpen, activeTab, selectedFriend, friendProfiles });
    useEffect(() => {
        stateRef.current = { isOpen, activeTab, selectedFriend, friendProfiles };
    }, [isOpen, activeTab, selectedFriend, friendProfiles]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };




    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        botMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        dmMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, botMessages, conversationMessages, isOpen, activeTab, selectedFriend]);

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

                r.onMessage("private_message", (msg: any) => {
                    // Hybrid: Use Colyseus mostly for "Toast" when online.
                    // Data source is Firestore.

                    if (msg.senderId !== user.uid) {
                        const { isOpen, activeTab, selectedFriend, friendProfiles } = stateRef.current;
                        const isChatOpenWithUser = isOpen && activeTab === 'dm' && selectedFriend === msg.senderId && !document.hidden;

                        // Only Toast if we are not looking at it
                        if (!isChatOpenWithUser) {
                            // Show In-App Toast
                            const senderName = friendProfiles[msg.senderId]?.displayName || msg.senderName;
                            setToast({
                                senderId: msg.senderId,
                                senderName: senderName,
                                content: msg.content
                            });

                            // Auto-hide after 5 seconds
                            setTimeout(() => {
                                setToast(prev => (prev && prev.senderId === msg.senderId && prev.content === msg.content) ? null : prev);
                            }, 5000);
                        }
                    }
                });

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

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !room) return;

        if (activeTab === 'dm' && selectedFriend) {
            // 1. Write to Firestore (Persistence & Offline support)
            await sendPrivateMessageWithRoomId(user.uid, user.displayName, selectedFriend, input);

            // 2. Send signal to Lobby (for Instant Toast if online)
            // Note: We don't rely on this for data anymore, just notification.
            room.send("private_message", { targetUserId: selectedFriend, content: input });
        } else {
            room.send("chat", { content: input });
        }
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


    // Calculate total unread DMs
    const totalUnread = Object.values(unreadDMs).reduce((a, b) => a + b, 0);

    // Calculate online friends count
    const onlineFriendCount = friends.filter(uid => onlineUsers.some(u => u.userId === uid)).length;

    // Visibility Logic: Hide button on Game Pages (Show only on Dashboard, Profile, Releases, Auth)
    const pathname = usePathname();
    const isDashboard = pathname === '/';
    const isSystemPage = pathname.startsWith('/profile') || pathname.startsWith('/releases') || pathname.startsWith('/auth') || pathname.startsWith('/login') || pathname.startsWith('/signup');
    const shouldShowChatButton = isDashboard || isSystemPage;

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
                                            whiteSpace: 'nowrap',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        {tab === 'chat' && 'Global'}
                                        {tab === 'friends' && (
                                            <>
                                                フレンド
                                                {totalUnread > 0 ? (
                                                    <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '0 4px', borderRadius: '10px', minWidth: '16px', textAlign: 'center' }}>
                                                        {totalUnread}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>({onlineFriendCount})</span>
                                                )}
                                            </>
                                        )}
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
                                    {friends.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px', fontSize: '0.9rem' }}>
                                            フレンドがいません
                                        </div>
                                    ) : (
                                        friends.map((uid, i) => {
                                            const friendProfile = friendProfiles[uid];
                                            const displayName = friendProfile?.displayName || "Unknown";
                                            const unreadCount = unreadDMs[uid] || 0;
                                            // Check online status
                                            const isOnline = onlineUsers.some(u => u.userId === uid);

                                            return (
                                                <div
                                                    key={uid}
                                                    onClick={() => {
                                                        setSelectedFriend(uid);
                                                        setActiveTab('dm');
                                                        setUnreadDMs(prev => ({ ...prev, [uid]: 0 }));
                                                    }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '8px',
                                                        background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0',
                                                        cursor: 'pointer', transition: 'background 0.2s',
                                                        opacity: isOnline ? 1 : 0.8
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                >
                                                    <div style={{ position: 'relative', width: '32px', height: '32px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                                        {friendProfile?.photoURL ? (
                                                            <img src={friendProfile.photoURL} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                                        ) : (
                                                            <IconUser size={16} />
                                                        )}
                                                        {unreadCount > 0 && (
                                                            <div style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                                {unreadCount}
                                                            </div>
                                                        )}
                                                        {/* Status Indicator on Avatar */}
                                                        <div style={{
                                                            position: 'absolute', bottom: -2, right: -2,
                                                            width: '10px', height: '10px', borderRadius: '50%',
                                                            background: isOnline ? '#10b981' : '#cbd5e0',
                                                            border: '2px solid white'
                                                        }} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>
                                                            {displayName}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {isOnline ? (
                                                                <span style={{ color: '#10b981' }}>● Online</span>
                                                            ) : (
                                                                <span style={{ color: '#94a3b8' }}>● Offline</span>
                                                            )}
                                                            <span style={{ color: '#cbd5e0', fontSize: '0.7rem' }}>• {isOnline ? '今すぐチャット' : 'メッセージを送る'}</span>
                                                        </div>
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

                            {/* DM CHAT */}
                            {activeTab === 'dm' && selectedFriend && (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    {/* DM Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9', marginBottom: '10px' }}>
                                        <button
                                            onClick={() => setActiveTab('friends')}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                                        >
                                            ← 戻る
                                        </button>
                                        <div style={{ fontWeight: 700, color: '#334155' }}>
                                            {friendProfiles[selectedFriend]?.displayName || "Friend"}
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                                        {conversationMessages
                                            .map((msg, i) => (
                                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.senderId === user.uid ? 'flex-end' : 'flex-start' }}>
                                                    <div style={{
                                                        padding: '8px 12px',
                                                        background: msg.senderId === user.uid ? '#8b5cf6' : '#f3e8ff', // Purple for DMs
                                                        color: msg.senderId === user.uid ? 'white' : '#581c87',
                                                        borderRadius: msg.senderId === user.uid ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                                        maxWidth: '85%',
                                                        fontSize: '0.9rem',
                                                        wordBreak: 'break-word',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                    }}>
                                                        {msg.content}
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>
                                                        {msg.read && msg.senderId === user.uid ? '既読' : ''}
                                                    </div>
                                                </div>
                                            ))}
                                        {/* Dummy div to scroll to bottom */}
                                        <div ref={dmMessagesEndRef} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        {(activeTab === 'chat' || activeTab === 'bot' || activeTab === 'dm') && (
                            <form
                                onSubmit={activeTab === 'bot' ? sendBotMessage : sendMessage}
                                style={{ padding: '12px', borderTop: '1px solid #e2e8f0', background: 'white' }}
                            >
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        value={activeTab === 'chat' || activeTab === 'dm' ? input : botInput}
                                        onChange={e => (activeTab === 'chat' || activeTab === 'dm') ? setInput(e.target.value) : setBotInput(e.target.value)}
                                        placeholder={activeTab === 'chat' ? "メッセージを入力..." : activeTab === 'dm' ? "DMを入力..." : "質問を入力..."}
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

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        onClick={() => {
                            setToast(null);
                            setSelectedFriend(toast.senderId);
                            setActiveTab('dm');
                            setIsOpen(true);
                            setUnreadDMs(prev => ({ ...prev, [toast.senderId]: 0 }));
                        }}
                        style={{
                            marginBottom: '16px',
                            background: 'white',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            border: '1px solid #e2e8f0',
                            maxWidth: '300px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{toast.senderName}</div>
                            <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>新着メッセージ</div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {toast.content}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '6px', fontWeight: 600 }}>
                            クリックして返信する
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {shouldShowChatButton && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleChat}
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
                        float: 'right',
                        position: 'relative'
                    }}
                >
                    <IconChat size={28} />
                    {totalUnread > 0 ? (
                        <div style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            background: '#ef4444',
                            color: 'white',
                            fontSize: '11px',
                            minWidth: '20px',
                            height: '20px',
                            borderRadius: '10px',
                            border: '2px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            padding: '0 4px'
                        }}>
                            {totalUnread}
                        </div>
                    ) : onlineFriendCount > 0 && !isOpen && (
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
            )}
        </div>
    );
}
