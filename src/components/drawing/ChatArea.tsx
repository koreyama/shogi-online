'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, push, onChildAdded, off } from 'firebase/database';
import { IconSend } from '@/components/Icons';

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
    isSystem?: boolean;
    isCorrect?: boolean;
}

interface ChatAreaProps {
    roomId: string;
    myId: string;
    myName: string;
    currentWord?: string; // If provided, we check for correct answer locally (or server-side ideally)
    onCorrectGuess?: () => void;
    isDrawer: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ roomId, myId, myName, currentWord, onCorrectGuess, isDrawer }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const chatRef = ref(db, `drawing_rooms/${roomId}/chat`);

        const handleNewMessage = (snapshot: any) => {
            const msg = snapshot.val();
            if (msg) {
                setMessages(prev => [...prev, { ...msg, id: snapshot.key }]);
            }
        };

        const unsubscribe = onChildAdded(chatRef, handleNewMessage);
        return () => {
            off(chatRef, 'child_added', handleNewMessage);
        };
    }, [roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const text = inputText.trim();
        let isCorrect = false;

        // Check answer (Simple local check for MVP)
        // In a real app, this should be done securely or via Cloud Functions
        if (currentWord && !isDrawer && text === currentWord) {
            isCorrect = true;
            if (onCorrectGuess) onCorrectGuess();
        }

        const newMessage: Omit<ChatMessage, 'id'> = {
            senderId: myId,
            senderName: myName,
            text: isCorrect ? `正解！「${currentWord}」` : text,
            timestamp: Date.now(),
            isSystem: isCorrect,
            isCorrect: isCorrect
        };

        await push(ref(db, `drawing_rooms/${roomId}/chat`), newMessage);
        setInputText('');
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            border: '1px solid #ccc',
            borderRadius: '8px',
            background: 'white',
            overflow: 'hidden'
        }}>
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{
                        alignSelf: msg.isSystem ? 'center' : (msg.senderId === myId ? 'flex-end' : 'flex-start'),
                        maxWidth: '80%',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        background: msg.isSystem ? '#48bb78' : (msg.senderId === myId ? '#3182ce' : '#edf2f7'),
                        color: msg.isSystem || msg.senderId === myId ? 'white' : 'black',
                        fontSize: '0.9rem'
                    }}>
                        {!msg.isSystem && msg.senderId !== myId && (
                            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '2px' }}>{msg.senderName}</div>
                        )}
                        <div>{msg.text}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{
                padding: '10px',
                borderTop: '1px solid #eee',
                display: 'flex',
                gap: '8px'
            }}>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isDrawer ? "答えを描いてください" : "ひらがなで回答..."}
                    disabled={isDrawer} // Drawer cannot guess
                    style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                    }}
                />
                <button
                    type="submit"
                    disabled={!inputText.trim() || isDrawer}
                    style={{
                        background: '#3182ce',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0 12px',
                        cursor: 'pointer',
                        opacity: isDrawer ? 0.5 : 1
                    }}
                >
                    <IconSend size={20} />
                </button>
            </form>
        </div>
    );
};
