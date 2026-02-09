/**
 * ChatWidget Component
 * 
 * A floating chat interface for the storefront, controlled by ChatContext.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, User, ExternalLink } from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';
import { useAuth } from '@/components/providers/AuthContext';
import { useChatContext } from '@/components/providers/ChatContext';

export default function ChatWidget() {
    const { chatState, closeChat } = useChatContext();
    const { isOpen, type, referenceId, title } = chatState;

    const [messageInput, setMessageInput] = useState('');
    const { isAuthenticated, user } = useAuth();

    // Custom hook handles socket and history
    const {
        messages,
        loading,
        initializeChat,
        sendMessage,
        setTyping,
        otherUserTyping
    } = useChat(type, referenceId);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && type && referenceId) {
            initializeChat();
        }
    }, [isOpen, type, referenceId, initializeChat]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        sendMessage(messageInput);
        setMessageInput('');
        setTyping(false);
    };

    if (!isAuthenticated || !isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            {/* Chat Window */}
            <div className="mb-4 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                {/* Header */}
                <div className="p-4 bg-blue-600 text-white flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-sm">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm tracking-tight">{title}</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <p className="text-[10px] font-medium opacity-90 uppercase tracking-wider">Online Assistance</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={closeChat}
                        className="p-2 hover:bg-white/20 rounded-xl transition duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Reference Banner (Product/Order Link) */}
                {referenceId && (
                    <div className="bg-blue-50/50 border-b px-4 py-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">
                            Ref: {type?.toUpperCase()} #{referenceId.toString().slice(0, 8)}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                            <ExternalLink className="w-3 h-3" />
                            View
                        </div>
                    </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">Loading conversation...</p>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-20 px-6">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">Start a Conversation</p>
                            <p className="text-xs text-gray-500">Ask us anything about this {type || 'item'}!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {messages.map((msg, idx) => {
                                const isMe = msg.is_me || (user && msg.sender_id === user.id);
                                return (
                                    <div
                                        key={idx}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm transition-all ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border-gray-100 border rounded-bl-none'
                                            }`}>
                                            {msg.content}
                                            <div className={`text-[9px] mt-1 opacity-70 ${isMe ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {otherUserTyping && (
                        <div className="flex justify-start">
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl shadow-sm border border-blue-50">
                                <div className="flex gap-1">
                                    <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium italic">Agent is typing</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form
                    onSubmit={handleSend}
                    className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center"
                >
                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => {
                                setMessageInput(e.target.value);
                                setTyping(e.target.value.length > 0);
                            }}
                            placeholder="Type a message..."
                            className="w-full px-5 py-2.5 bg-gray-50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:grayscale transition shadow-lg hover:shadow-blue-500/25 active:scale-95"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
