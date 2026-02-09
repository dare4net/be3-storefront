/**
 * Storefront Messages/Chat Page
 * Displays all user conversations
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, User, Search, Send, Loader2, ArrowLeft, Package } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '@/lib/axios';
import { useAuth } from '@/components/providers/AuthContext';
import { useRouter } from 'next/navigation';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function MessagesPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [otherUserTyping, setOtherUserTyping] = useState(false);

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Fetch conversations list
    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/chat/conversations', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.data.success) {
                setConversations(res.data.conversations);
            }
        } catch (error) {
            console.error('[Chat] Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchConversations();
        }
    }, [isAuthenticated]);

    // Socket Connection
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket']
        });

        socketRef.current.on('chat:message', (message) => {
            if (selectedConv && message.conversation_id === selectedConv.id) {
                setMessages(prev => {
                    // Deduplicate
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
            }
            fetchConversations();
        });

        socketRef.current.on('chat:typing_update', (data) => {
            if (selectedConv && data.conversationId === selectedConv.id) {
                setOtherUserTyping(data.isTyping);
            }
        });

        return () => socketRef.current?.disconnect();
    }, [selectedConv]);

    // Handle Conversation Selection
    const selectConversation = async (conv) => {
        setSelectedConv(conv);
        setHistoryLoading(true);
        setMessages([]);
        setOtherUserTyping(false);

        try {
            const token = localStorage.getItem('token');
            const res = await api.get(`/chat/history/${conv.id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.data.success) {
                setMessages(res.data.messages);
            }
            socketRef.current?.emit('chat:join', { conversationId: conv.id, tenantId: conv.tenant_id });
        } catch (error) {
            console.error('[Chat] Failed to fetch history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedConv) return;

        const tempMessage = {
            id: `temp-${Date.now()}`,
            content: messageInput,
            sender_id: user.id,
            is_me: true,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMessage]);
        setMessageInput('');

        try {
            const token = localStorage.getItem('token');
            await api.post('/chat/send', {
                conversationId: selectedConv.id,
                content: tempMessage.content,
                type: 'text'
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
        } catch (error) {
            console.error('[Chat] Failed to send message:', error);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view messages</h2>
                    <p className="text-gray-600 mb-4">You need to be logged in to access your conversations</p>
                    <button
                        onClick={() => router.push('/auth/login')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Store
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 mt-4">My Messages</h1>
                    <p className="text-gray-600 mt-1">View and manage your conversations</p>
                </div>

                <div className="flex h-[calc(100vh-240px)] bg-white rounded-xl shadow-sm border overflow-hidden">
                    {/* Conversations Sidebar */}
                    <div className="w-1/3 border-r flex flex-col bg-gray-50/30">
                        <div className="p-4 border-b bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-10 flex justify-center text-gray-400">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="p-10 text-center text-gray-500 text-sm">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium">No conversations yet</p>
                                    <p className="text-xs mt-1">Start chatting about products you're interested in!</p>
                                </div>
                            ) : (
                                conversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => selectConversation(conv)}
                                        className={`w-full text-left p-4 hover:bg-white transition-all flex gap-3 border-b border-gray-100 ${selectedConv?.id === conv.id ? 'bg-white border-l-4 border-l-blue-600' : ''
                                            }`}
                                    >
                                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {conv.context_image ? (
                                                <img src={conv.context_image} alt="Product" className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-bold text-sm text-gray-900 truncate">
                                                    {conv.context_data || 'Product Inquiry'}
                                                </p>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                    {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : ''}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate mb-1">
                                                {conv.other_user_name || 'Store Support'}
                                            </p>
                                            <p className="text-xs text-gray-600 truncate font-medium">
                                                {conv.last_message || 'No messages yet'}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Content Area */}
                    <div className="flex-1 flex flex-col bg-white">
                        {selectedConv ? (
                            <>
                                <div className="p-4 border-b flex items-center justify-between bg-white shadow-sm z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                            {selectedConv.context_image ? (
                                                <img src={selectedConv.context_image} alt="Product" className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-gray-900">
                                                {selectedConv.context_data}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                {selectedConv.other_user_name || 'Store Support'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                                    {historyLoading ? (
                                        <div className="flex justify-center py-20">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                        </div>
                                    ) : (
                                        messages.map((msg, idx) => {
                                            const isMe = msg.is_me || (user && msg.sender_id === user.id);
                                            return (
                                                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${isMe
                                                        ? 'bg-blue-600 text-white rounded-br-none'
                                                        : 'bg-white text-gray-800 border rounded-bl-none border-gray-100'
                                                        }`}>
                                                        {msg.content}
                                                        <div className={`text-[9px] mt-1 opacity-70 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                    {otherUserTyping && (
                                        <div className="flex justify-start">
                                            <div className="text-[10px] text-gray-400 italic bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                                Typing...
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-3">
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim()}
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition shadow-lg shadow-blue-500/20"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/20">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <MessageSquare className="w-10 h-10 text-gray-200" />
                                </div>
                                <p className="text-sm font-medium">Select a conversation to start chatting</p>
                                <p className="text-xs mt-1">Your message history will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
