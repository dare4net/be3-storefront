/**
 * ChatButton Component
 * 
 * A client-side button to trigger the global chat widget.
 */

'use client';

import { MessageCircle } from "lucide-react";
import { useChatContext } from "@/components/providers/ChatContext";

export default function ChatButton({ productId, productName, className }) {
    const { openChat } = useChatContext();

    return (
        <button
            onClick={() => openChat('product', productId, productName)}
            className={className}
        >
            <MessageCircle className="w-4 h-4" />
            Chat with Seller
        </button>
    );
}
