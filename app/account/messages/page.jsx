'use client';

import { useState, useEffect, useRef } from 'react';
import {
    MessageSquare, Search, Send, Loader2, ArrowLeft, Package
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '@/lib/axios';
import { useAuth } from '@/components/providers/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function ConvRow({ conv, active, onClick }) {
    const hasUnread = conv.unread_count > 0;
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left border-b border-gray-50 last:border-0",
                active ? "bg-blue-50/70" : "hover:bg-gray-50/70"
            )}
        >
            <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {conv.context_image
                    ? <img src={conv.context_image} alt="" className="w-full h-full object-cover" />
                    : <Package className="w-5 h-5 text-gray-300" />
                }
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={cn("text-sm truncate", hasUnread ? "font-bold text-gray-900" : "font-semibold text-gray-800")}>
                        {conv.context_data || 'Product Inquiry'}
                    </p>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                        {timeAgo(conv.last_message_at)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-400 truncate">{conv.last_message || 'No messages yet'}</p>
                    {hasUnread && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                            {conv.unread_count}
                        </span>
                    )}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{conv.other_user_name || 'Store Support'}</p>
            </div>
        </button>
    );
}

function Bubble({ msg, isMe }) {
    return (
        <div className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
            <div className={cn(
                "max-w-[75%] sm:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                isMe
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm"
            )}>
                <p>{msg.content}</p>
                <p className={cn("text-[9px] mt-1 text-right", isMe ? "text-blue-200" : "text-gray-400")}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
}

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
    const [search, setSearch] = useState('');
    const [mobileView, setMobileView] = useState(null); // null = list, conv = chat

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/chat/conversations', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.data.success) setConversations(res.data.conversations);
        } catch (e) {
            console.error('[Chat] Conversations:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) fetchConversations();
    }, [isAuthenticated]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        socketRef.current = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
        socketRef.current.on('chat:message', (msg) => {
            if (selectedConv && msg.conversation_id === selectedConv.id) {
                setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
            }
            fetchConversations();
        });
        socketRef.current.on('chat:typing_update', (data) => {
            if (selectedConv && data.conversationId === selectedConv.id)
                setOtherUserTyping(data.isTyping);
        });
        return () => socketRef.current?.disconnect();
    }, [selectedConv]);

    const selectConversation = async (conv) => {
        setSelectedConv(conv);
        setMobileView(conv);
        setHistoryLoading(true);
        setMessages([]);
        setOtherUserTyping(false);
        try {
            const token = localStorage.getItem('token');
            const res = await api.get(`/chat/history/${conv.id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.data.success) setMessages(res.data.messages);
            socketRef.current?.emit('chat:join', { conversationId: conv.id, tenantId: conv.tenant_id });
        } catch (e) {
            console.error('[Chat] History:', e);
        } finally {
            setHistoryLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedConv) return;
        const temp = { id: `temp-${Date.now()}`, content: messageInput, sender_id: user.id, is_me: true, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, temp]);
        setMessageInput('');
        try {
            const token = localStorage.getItem('token');
            await api.post('/chat/send', { conversationId: selectedConv.id, content: temp.content, type: 'text' }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
        } catch (e) { console.error('[Chat] Send:', e); }
    };

    const filtered = conversations.filter(c =>
        !search ||
        (c.context_data || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.other_user_name || '').toLowerCase().includes(search.toLowerCase())
    );

    /* ── Shared: conversation list ── */
    const ConvList = (
        <div className="flex flex-col h-full">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 bg-white flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-gray-900">Messages</h2>
                    <span className="text-xs text-gray-400">{conversations.length} chats</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                            <MessageSquare className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No conversations yet</p>
                        <p className="text-xs text-gray-400 mt-1">Start chatting from any product page</p>
                    </div>
                ) : filtered.map(conv => (
                    <ConvRow key={conv.id} conv={conv} active={selectedConv?.id === conv.id} onClick={() => selectConversation(conv)} />
                ))}
            </div>
        </div>
    );

    /* ── Shared: chat panel ── */
    const ChatPanel = selectedConv ? (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
                <button
                    className="md:hidden -ml-1 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-600"
                    onClick={() => { setMobileView(null); setSelectedConv(null); }}
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-2xl bg-gray-100 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {selectedConv.context_image
                        ? <img src={selectedConv.context_image} alt="" className="w-full h-full object-cover" />
                        : <Package className="w-5 h-5 text-gray-300" />
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{selectedConv.context_data || 'Product Inquiry'}</p>
                    <p className="text-xs text-gray-400">{selectedConv.other_user_name || 'Store Support'}</p>
                </div>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
                {historyLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <p className="text-sm text-gray-400">No messages yet. Say hello 👋</p>
                    </div>
                ) : messages.map((msg, idx) => {
                    const isMe = msg.is_me || (user && msg.sender_id === user.id);
                    return <Bubble key={msg.id || idx} msg={msg} isMe={isMe} />;
                })}
                {otherUserTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 shadow-sm px-4 py-2.5 rounded-2xl rounded-bl-sm">
                            <div className="flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            {/* Input */}
            <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 bg-white flex items-center gap-2 flex-shrink-0">
                <input ref={inputRef} type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                <button type="submit" disabled={!messageInput.trim()}
                    className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center transition-all flex-shrink-0">
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="w-14 h-14 bg-gray-100 rounded-3xl flex items-center justify-center mb-3">
                <MessageSquare className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Select a conversation</p>
            <p className="text-xs text-gray-400 mt-1">Your messages will appear here</p>
        </div>
    );

    return (
        <>
            {/* ── DESKTOP: fits inside account layout content area ── */}
            <div className="hidden md:flex bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 96px)' }}>
                {/* Conversation list */}
                <div className="w-72 flex-shrink-0 border-r border-gray-100 h-full overflow-hidden">
                    {ConvList}
                </div>
                {/* Chat */}
                <div className="flex-1 h-full overflow-hidden flex flex-col">
                    {ChatPanel}
                </div>
            </div>

            {/* ── MOBILE: break out of account layout padding, full-screen below mobile header ── */}
            <div className="md:hidden -mx-4 -my-4" style={{ height: 'calc(100vh - 56px)' }}>
                <div className="flex flex-col h-full bg-white">
                    {mobileView ? ChatPanel : ConvList}
                </div>
            </div>
        </>
    );
}
