"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Link2, Upload, X, Sparkles, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { useTenant } from "@/components/providers/TenantContext";
import { useSearch } from "@/components/providers/SearchContext";

export default function ImageSearchWidget({ config = {} }) {
    const tenant = useTenant();
    const { runImageSearch } = useSearch();

    const [mode, setMode] = useState("url"); // 'url' | 'upload'
    const [urlInput, setUrlInput] = useState("");
    const [previewSrc, setPreviewSrc] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);

    const fileInputRef = useRef(null);

    const handleSearch = useCallback(
        async (source) => {
            if (!source || !tenant?.id) return;
            setError(null);
            setIsSearching(true);
            try {
                await runImageSearch(source);
            } catch (e) {
                setError(e?.response?.data?.message || e.message || "Image search failed.");
            } finally {
                setIsSearching(false);
            }
        },
        [tenant?.id, runImageSearch]
    );

    const handleUrlSubmit = (e) => {
        e.preventDefault();
        const trimmed = urlInput.trim();
        if (!trimmed) return;
        setPreviewSrc(trimmed);
        handleSearch(trimmed);
    };

    const processFile = useCallback(
        (file) => {
            if (!file || !file.type.startsWith("image/")) {
                setError("Please upload a valid image file.");
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target.result;
                setPreviewSrc(base64);
                handleSearch(base64);
            };
            reader.readAsDataURL(file);
        },
        [handleSearch]
    );

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) processFile(file);
        },
        [processFile]
    );

    const clearSearch = () => {
        setPreviewSrc(null);
        setUrlInput("");
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        // Clear image search results by reverting to regular mode
        if (typeof runImageSearch === "function") runImageSearch(null);
    };

    const label = config.label || "Search by Image";
    const subLabel = config.sublabel || "Upload a photo or paste a URL to find visually similar products";

    return (
        <section
            className={
                config.container === false
                    ? ""
                    : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
            }
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Camera className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900 leading-tight">{label}</h3>
                    <p className="text-xs text-gray-500">{subLabel}</p>
                </div>
                {previewSrc && (
                    <button
                        onClick={clearSearch}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear
                    </button>
                )}
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4 w-fit">
                {[
                    { id: "url", icon: Link2, label: "Paste URL" },
                    { id: "upload", icon: Upload, label: "Upload Photo" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setMode(tab.id); setError(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === tab.id
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-800"
                            }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex gap-4 flex-col md:flex-row items-start">
                {/* Input Area */}
                <div className="flex-1 w-full">
                    {mode === "url" ? (
                        <form onSubmit={handleUrlSubmit} className="flex gap-2">
                            <div className="flex-1 relative">
                                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="https://example.com/product-image.jpg"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all bg-white"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!urlInput.trim() || isSearching}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200/50"
                            >
                                {isSearching ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4" />
                                )}
                                {isSearching ? "Searching..." : "Search"}
                            </button>
                        </form>
                    ) : (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${isDragOver
                                    ? "border-indigo-500 bg-indigo-50 scale-[1.01]"
                                    : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/30"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            {isSearching ? (
                                <>
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    <p className="text-sm font-semibold text-indigo-600">Analyzing image...</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-white shadow-md rounded-xl flex items-center justify-center">
                                        <Upload className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-gray-700">
                                            {isDragOver ? "Drop your image here" : "Drag & drop or click to upload"}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP up to 10MB</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 font-medium bg-red-50 rounded-xl px-4 py-2.5 border border-red-100">
                            <X className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Image Preview */}
                {previewSrc && (
                    <div className="relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-200 shadow-lg shadow-indigo-100">
                        <img
                            src={previewSrc}
                            alt="Search preview"
                            className="w-full h-full object-cover"
                            onError={() => { setError("Failed to load image from URL."); setPreviewSrc(null); }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent" />
                        <div className="absolute bottom-1.5 left-0 right-0 text-center">
                            <span className="text-[9px] font-bold text-white uppercase tracking-wider">Query</span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
