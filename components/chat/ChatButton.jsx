'use client';

import { MessageCircle } from "lucide-react";
import { useChatContext } from "@/components/providers/ChatContext";

export default function ChatButton({ productId, productName, className, style }) {
    const { openChat } = useChatContext();

    return (
        <button
            type="button"
            onClick={() => openChat('product', productId, productName)}
            className={className}
            style={style}
        >
            <MessageCircle className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Chat with Seller</span>
            <span className="sm:hidden">Chat</span>
        </button>
    );
}

