/**
 * ChatContext Provider
 * 
 * Manages the global state of the chat widget (open/close, current conversation context).
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext();

export function ChatProvider({ children }) {
    const [chatState, setChatState] = useState({
        isOpen: false,
        type: null, // 'product' | 'order'
        referenceId: null,
        title: 'Chat with us'
    });

    const openChat = useCallback((type, referenceId, title = 'Chat with us') => {
        setChatState({
            isOpen: true,
            type,
            referenceId,
            title
        });
    }, []);

    const closeChat = useCallback(() => {
        setChatState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <ChatContext.Provider value={{ chatState, openChat, closeChat }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
}
