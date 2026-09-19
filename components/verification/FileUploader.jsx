"use client";
import { useState, useRef } from "react";
import { Upload, CheckCircle, X, Loader2, FileText } from "lucide-react";
import api from "@/lib/axios";

/**
 * FileUploader — reusable document upload component.
 * Uploads via POST /media/upload-document (accepts JPG, PNG, WebP, PDF — max 10 MB).
 * Returns the Cloudinary URL via onUploaded(url).
 *
 * Props:
 *  folder      — Cloudinary folder e.g. "kyc/poi"
 *  label       — Field label text
 *  hint        — Small hint text beneath the label
 *  onUploaded  — callback(url: string) called after successful upload
 *  disabled    — locks the component
 *  currentUrl  — if already uploaded, show as confirmed
 */
export default function FileUploader({ folder, label, hint, onUploaded, disabled = false, currentUrl = null }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [previewUrl, setPreviewUrl] = useState(currentUrl || null);
    const inputRef = useRef(null);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError("");
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", folder);
            const res = await api.post("/media/upload-document", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (!res.data.success) throw new Error(res.data.error || "Upload failed");
            setPreviewUrl(res.data.url);
            onUploaded(res.data.url);
        } catch (err) {
            setError(err.response?.data?.error || err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const clear = () => {
        setPreviewUrl(null);
        onUploaded(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
                {label} <span className="text-red-500">*</span>
            </label>
            {hint && <p className="text-[11px] text-gray-400">{hint}</p>}

            {previewUrl ? (
                <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                    <span className="flex items-center gap-2 text-sm text-green-700 font-medium">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        Document uploaded
                    </span>
                    <div className="flex items-center gap-2">
                        <a href={previewUrl} target="_blank" rel="noreferrer"
                            className="text-xs font-bold text-blue-600 hover:underline">
                            View ↗
                        </a>
                        {!disabled && (
                            <button onClick={clear} className="text-gray-400 hover:text-red-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    disabled={disabled || uploading}
                    onClick={() => inputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-6 px-4 bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    ) : (
                        <FileText className="w-6 h-6 text-gray-400" />
                    )}
                    <span className="text-xs font-bold text-gray-500">
                        {uploading ? "Uploading…" : "Click to upload document"}
                    </span>
                    <span className="text-[10px] text-gray-400">JPG, PNG, WebP or PDF · max 10 MB</span>
                </button>
            )}

            {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleFile}
                disabled={disabled || uploading}
            />
        </div>
    );
}
