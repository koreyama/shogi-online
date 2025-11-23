'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './Chat.module.css';
import { IconSend, IconChat } from './Icons';

interface Message {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

interface ChatProps {
    messages: Message[];
    onSendMessage: (text: string) => void;
    myName: string;
}

export const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, myName }) => {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            onSendMessage(inputText.trim());
            setInputText('');
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
                <span className={styles.chatIcon}><IconChat size={20} /></span>
                <h3>チャット</h3>
            </div>

            <div className={styles.messagesContainer}>
                {messages.length === 0 ? (
                    <div className={styles.emptyState}>
                        メッセージはまだありません
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`${styles.message} ${message.sender === myName ? styles.myMessage : styles.theirMessage}`}
                        >
                            <div className={styles.messageHeader}>
                                <span className={styles.messageSender}>{message.sender}</span>
                                <span className={styles.messageTime}>{formatTime(message.timestamp)}</span>
                            </div>
                            <div className={styles.messageText}>{message.text}</div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className={styles.inputForm}>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="メッセージを入力..."
                    className={styles.input}
                    maxLength={200}
                />
                <button type="submit" className={styles.sendButton} disabled={!inputText.trim()}>
                    <IconSend size={18} />
                </button>
            </form>
        </div>
    );
};
