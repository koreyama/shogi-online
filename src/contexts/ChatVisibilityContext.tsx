'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatVisibilityContextType {
    isVisible: boolean;
    showChat: () => void;
    hideChat: () => void;
}

const ChatVisibilityContext = createContext<ChatVisibilityContextType | undefined>(undefined);

export function ChatVisibilityProvider({ children }: { children: ReactNode }) {
    const [isVisible, setIsVisible] = useState(true);

    const showChat = () => setIsVisible(true);
    const hideChat = () => setIsVisible(false);

    return (
        <ChatVisibilityContext.Provider value={{ isVisible, showChat, hideChat }}>
            {children}
        </ChatVisibilityContext.Provider>
    );
}

export function useChatVisibility() {
    const context = useContext(ChatVisibilityContext);
    if (context === undefined) {
        throw new Error('useChatVisibility must be used within a ChatVisibilityProvider');
    }
    return context;
}
