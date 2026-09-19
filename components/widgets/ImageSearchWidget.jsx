"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Link2, Upload, X, Search, Loader2, ChevronDown } from "lucide-react";
import { useTenant } from "@/components/providers/TenantContext";
import { useSearch } from "@/components/providers/SearchContext";
import { cn } from "@/lib/utils";

export default function ImageSearchWidget({ config = {} }) {
    const tenant = useTenant();
    const { runImageSearch } = useSearch();

    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState("url"); // 'url' | 'upload'
    const [urlInput, setUrlInput] = useState("");
    const [previewSrc, setPreviewSrc] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);
    const [urlFocused, setUrlFocused] = useState(false);

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
            {/* Trigger Row */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-3 w-auto group"
            >
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
                    <Camera className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{label}</p>
                    <p className="text-xs text-gray-500">{subLabel}</p>
                </div>
                <ChevronDown className={cn(
                    "w-4 h-4 text-gray-400 transition-transform duration-200 ml-2",
                    isOpen && "rotate-180"
                )} />
            </button>

            {/* Collapsible Panel */}
            <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isOpen ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"
            )}>

            {/* Active Preview + Clear — only visible when expanded */}
            {previewSrc && (
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-blue-100 flex-shrink-0">
                        <img src={previewSrc} alt="" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs text-gray-500 flex-1">Image loaded — ready to search.</p>
                    <button
                        onClick={clearSearch}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear
                    </button>
                </div>
            )}

            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4 w-fit">
                {[
                    { id: "url", icon: Link2, label: "Paste URL" },
                    { id: "upload", icon: Upload, label: "Upload Photo" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setMode(tab.id); setError(null); }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                            mode === tab.id
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-800"
                        )}
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
                            {/* URL Input — matches SearchBar style */}
                            <div className={cn(
                                "relative flex items-center flex-1 h-11 bg-gray-100 rounded-xl border-2 transition-all duration-200 overflow-hidden",
                                urlFocused
                                    ? "bg-white border-blue-500 ring-4 ring-blue-50"
                                    : "border-transparent hover:bg-gray-200"
                            )}>
                                <div className="pl-4 pr-2 flex items-center justify-center text-gray-400">
                                    <Link2 className={cn("w-4 h-4 transition-colors", urlFocused && "text-blue-500")} />
                                </div>
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    onFocus={() => setUrlFocused(true)}
                                    onBlur={() => setUrlFocused(false)}
                                    placeholder="https://example.com/product-image.jpg"
                                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-500 text-gray-900 font-medium h-full"
                                />
                                {urlInput && (
                                    <button
                                        type="button"
                                        onClick={() => setUrlInput("")}
                                        className="px-3 h-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={!urlInput.trim() || isSearching}
                                className={cn(
                                    "h-11 px-5 flex items-center gap-2 text-sm font-bold rounded-xl transition-all duration-200",
                                    "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {isSearching ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4" />
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
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200",
                                isDragOver
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-gray-100"
                            )}
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
                                    <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                                    <p className="text-sm font-semibold text-blue-600">Analyzing image...</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-11 h-11 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center">
                                        <Upload className="w-5 h-5 text-blue-600" />
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

            </div>

            </div> {/* end collapsible panel */}
        </section>
    );
}
