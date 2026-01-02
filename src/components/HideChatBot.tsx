'use client';
import { useEffect } from 'react';
import { useChatVisibility } from '@/contexts/ChatVisibilityContext';

export default function HideChatBot() {
    const { hideChat, showChat } = useChatVisibility();
    useEffect(() => {
        hideChat();
        return () => showChat();
    }, []);
    return null;
}
