"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const SocketContext = createContext(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function SocketProvider({ children }) {
    const { user, token, isAuthenticated } = useAuth();
    const socketRef = useRef(null);
    const [socket, setSocket] = useState(null);

    // Auto-request FCM push permission and register token after login
    usePushNotifications();

    useEffect(() => {
        if (!isAuthenticated || !token) {
            // Disconnect if logged out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
            return;
        }

        // Already connected
        if (socketRef.current?.connected) return;

        const s = io(API_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionAttempts: 5,
        });

        s.on("connect", () => {
            console.log("[Socket] Connected:", s.id);
            // Join user notification room
            if (user?.id) {
                s.emit("join:user", user.id);
            }
        });

        s.on("disconnect", (reason) => {
            console.log("[Socket] Disconnected:", reason);
        });

        s.on("connect_error", (err) => {
            console.warn("[Socket] Connection error:", err.message);
        });

        socketRef.current = s;
        setSocket(s);

        return () => {
            s.disconnect();
            socketRef.current = null;
            setSocket(null);
        };
    }, [isAuthenticated, token, user?.id]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
