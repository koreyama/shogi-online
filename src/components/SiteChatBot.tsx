'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './SiteChatBot.module.css';
import { CHAT_KNOWLEDGE, findAnswer } from '@/lib/chatbot/knowledge';
import Link from 'next/link';
import { useChatVisibility } from '@/contexts/ChatVisibilityContext';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: number;
    link?: { text: string; url: string };
}

export default function SiteChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            text: 'こんにちは！Asobi Loungeへようこそ。\nサイトの使い方やゲームについて、何か質問はありますか？',
            sender: 'bot',
            timestamp: Date.now()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        // Simulate thinking delay
        setTimeout(() => {
            const knowledge = findAnswer(userMsg.text);

            let botText = '申し訳ありません、その質問にはうまく答えられないかもしれません。\n別の言い方で聞いてみてください。（例：「ログイン方法は？」「将棋のルール」）';
            let botLink = undefined;

            if (knowledge) {
                botText = knowledge.answer;
                botLink = knowledge.link;
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: botText,
                sender: 'bot',
                timestamp: Date.now(),
                link: botLink
            };

            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 600 + Math.random() * 400);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const { isVisible } = useChatVisibility();

    if (!isVisible) return null;

    return (
        <div className={styles.wrapper}>
            {/* Chat Window */}
            <div className={`${styles.chatWindow} ${isOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <span className={styles.robotIcon}>🤖</span>
                        Asobi Assistant
                    </div>
                    <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
                </div>

                <div className={styles.body}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={`${styles.messageRow} ${msg.sender === 'user' ? styles.userRow : styles.botRow}`}>
                            {msg.sender === 'bot' && <div className={styles.botAvatar}>🤖</div>}
                            <div className={`${styles.messageBubble} ${msg.sender === 'user' ? styles.userBubble : styles.botBubble}`}>
                                {msg.text.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                                {msg.link && (
                                    <div className={styles.linkContainer}>
                                        <Link href={msg.link.url} className={styles.msgLink}>
                                            {msg.link.text} &rarr;
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className={`${styles.messageRow} ${styles.botRow}`}>
                            <div className={styles.botAvatar}>🤖</div>
                            <div className={`${styles.messageBubble} ${styles.botBubble} ${styles.typing}`}>
                                <span>.</span><span>.</span><span>.</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className={styles.footer}>
                    <input
                        className={styles.input}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="質問を入力..."
                    />
                    <button className={styles.sendBtn} onClick={handleSendMessage} disabled={!inputText.trim()}>
                        送信
                    </button>
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                className={`${styles.fab} ${isOpen ? styles.hideFab : ''}`}
                onClick={() => setIsOpen(true)}
                aria-label="チャットを開く"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </button>
        </div>
    );
}
