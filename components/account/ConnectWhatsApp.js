"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Phone, CheckCircle, Loader2, Trash2, Copy, ExternalLink } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

export default function ConnectWhatsApp({ token, tenant }) {
    const [phone, setPhone] = useState("");
    const [status, setStatus] = useState("idle"); // idle | loading | sent | error
    const [code, setCode] = useState(null);
    const [waMeLink, setWaMeLink] = useState(null);
    const [linked, setLinked] = useState([]); // array of { wa_phone, connected_at }
    const [loadingLinked, setLoadingLinked] = useState(true);
    const [copied, setCopied] = useState(false);

    // Fetch already-linked numbers on mount
    useEffect(() => {
        const fetchLinked = async () => {
            setLoadingLinked(true);
            try {
                const res = await api.get("/wa-auth/status", {
                    headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": tenant?.id },
                });
                setLinked(res.data?.connected || []);
            } catch {
                // silently fail — not critical
            } finally {
                setLoadingLinked(false);
            }
        };
        if (token) fetchLinked();
    }, [token, tenant]);

    const handleInitiate = async (e) => {
        e.preventDefault();
        if (!phone.trim()) return;

        setStatus("loading");
        setCode(null);
        setWaMeLink(null);

        try {
            const res = await api.post(
                "/wa-auth/initiate",
                { phone: phone.trim() },
                { headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": tenant?.id } }
            );
            setCode(res.data.code);
            setWaMeLink(res.data.wa_me_link);
            setStatus("sent");
        } catch (err) {
            setStatus("error");
        }
    };

    const handleDisconnect = async (waPhone) => {
        try {
            await api.delete("/wa-auth/disconnect", {
                data: { phone: waPhone },
                headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": tenant?.id },
            });
            setLinked((prev) => prev.filter((n) => n.wa_phone !== waPhone));
        } catch {
            // silently fail
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-xl bg-white border border-gray-100 p-5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-bold text-gray-900">Connect WhatsApp</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
                Link your WhatsApp number to shop, track orders, and get support directly from the chat.
            </p>

            {/* Already-linked numbers */}
            {loadingLinked ? (
                <div className="flex items-center gap-2 mb-4">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                    <span className="text-xs text-gray-400">Loading linked numbers…</span>
                </div>
            ) : linked.length > 0 ? (
                <div className="space-y-2 mb-4">
                    {linked.map((n) => (
                        <div
                            key={n.wa_phone}
                            className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-green-900">+{n.wa_phone}</p>
                                    <p className="text-[11px] text-green-600">
                                        Connected {new Date(n.connected_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDisconnect(n.wa_phone)}
                                title="Disconnect"
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : null}

            {/* Add new number form */}
            {status !== "sent" ? (
                <form onSubmit={handleInitiate} className="flex gap-2">
                    <div className="relative flex-1">
                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="2348012345678"
                            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={status === "loading" || !phone.trim()}
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {status === "loading" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            "Connect"
                        )}
                    </button>
                </form>
            ) : (
                /* Verification code display */
                <div className="space-y-3">
                    <p className="text-xs text-gray-600 font-medium">
                        Send this code to <span className="text-green-700 font-bold">Be3 on WhatsApp</span>:
                    </p>

                    {/* Code box */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                        <span className="text-2xl font-black tracking-widest text-gray-900 flex-1 text-center">
                            {code}
                        </span>
                        <button
                            onClick={copyCode}
                            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                            title="Copy code"
                        >
                            {copied ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    {/* wa.me button */}
                    {waMeLink && (
                        <a
                            href={waMeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Message Be3 on WhatsApp
                            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                        </a>
                    )}

                    <p className="text-[11px] text-gray-400 text-center">
                        Code expires in 10 minutes.{" "}
                        <button
                            onClick={() => { setStatus("idle"); setCode(null); }}
                            className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            Try different number
                        </button>
                    </p>
                </div>
            )}

            {status === "error" && (
                <p className="text-xs text-red-600 mt-2">Something went wrong. Please try again.</p>
            )}
        </div>
    );
}
