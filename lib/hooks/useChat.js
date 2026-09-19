/**
 * useChat Hook
 * 
 * Manages Socket.io lifecycle and chat state for the storefront.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/components/providers/AuthContext';
import { useTenant } from '@/components/providers/TenantContext';
import api from '@/lib/axios'; // Use main API instance with Auth interceptors

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function useChat(conversationType, referenceId) {
    const { user, token } = useAuth();
    const tenant = useTenant();
    const [messages, setMessages] = useState([]);
    const [conversation, setConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const socketRef = useRef(null);

    // Initialize conversation
    const initializeChat = useCallback(async () => {
        if (!user || !tenant || !referenceId) return;

        setLoading(true);
        try {
            // Direct call to Backend (bypass Next.js Proxy to ensure Auth handling)
            const res = await api.post('/chat/initialize', {
                type: conversationType,
                referenceId
            });

            if (res.data.success) {
                setConversation(res.data.conversation);
                // Fetch history
                const historyRes = await api.get(`/chat/history/${res.data.conversation.id}`);
                setMessages(historyRes.data.messages || []);
            }
        } catch (error) {
            console.error('[useChat] Failed to initialize chat:', error);
        } finally {
            setLoading(false);
        }
    }, [user, tenant, conversationType, referenceId]);

    // Socket Setup
    useEffect(() => {
        if (!conversation || !token) return;

        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket']
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('[Socket] Connected to server');
            socket.emit('chat:join', {
                conversationId: conversation.id,
                tenantId: tenant.id
            });
        });

        socket.on('chat:message', (message) => {
            setMessages(prev => {
                // Prevent duplicates if already added by sendMessage
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
        });

        socket.on('chat:typing_update', (data) => {
            if (data.userId !== user.id) {
                setOtherUserTyping(data.isTyping);
            }
        });

        // Disconnect socket before page is hidden (for bfcache eligibility in production)
        const handlePageHide = () => {
            socket.disconnect();
        };
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            window.removeEventListener('pagehide', handlePageHide);
            socket.disconnect();
        };
    }, [conversation, token, tenant?.id, user?.id]);

    const sendMessage = async (content) => {
        if (!content.trim() || !conversation) return;

        try {
            const res = await api.post('/chat/send', {
                conversationId: conversation.id,
                content,
                type: 'text'
            });

            // Manually append message if successful to ensure UI updates immediately
            if (res.data.success && res.data.message) {
                const newMessage = res.data.message;
                // Identify as 'me' for UI styling if not already set
                newMessage.is_me = true;

                setMessages(prev => {
                    if (prev.some(m => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
            }
        } catch (error) {
            console.error('[useChat] Failed to send message:', error);
        }
    };

    const setTyping = (typing) => {
        if (!conversation || !socketRef.current) return;
        setIsTyping(typing);
        socketRef.current.emit('chat:typing', {
            conversationId: conversation.id,
            tenantId: tenant.id,
            userId: user.id,
            isTyping: typing
        });
    };

    return {
        messages,
        conversation,
        loading,
        otherUserTyping,
        initializeChat,
        sendMessage,
        setTyping,
        isTyping
    };
}
