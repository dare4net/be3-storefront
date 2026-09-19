"use client";
import { useState, useRef } from "react";
import { Video, CheckCircle, X, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/axios";

const MIN_DURATION = 5;
const MAX_DURATION = 10;

/**
 * VideoUploader — liveness video upload component.
 * Validates duration (5–10s) client-side before uploading.
 * Uploads via POST /media/upload-video.
 *
 * Props:
 *  onUploaded  — callback(url: string)
 *  disabled    — locks the component
 *  currentUrl  — pre-existing URL (submitted state)
 *  docTypeLabel — e.g. "International Passport" for instructions
 */
export default function VideoUploader({ onUploaded, disabled = false, currentUrl = null, docTypeLabel = "your identity document" }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [videoUrl, setVideoUrl] = useState(currentUrl || null);
    const [duration, setDuration] = useState(null);
    const inputRef = useRef(null);
    const hiddenVideoRef = useRef(null);

    const validateAndUpload = async (file) => {
        setError("");
        // Step 1: Read duration via hidden <video> element
        const objectUrl = URL.createObjectURL(file);
        hiddenVideoRef.current.src = objectUrl;
        await new Promise((resolve) => {
            hiddenVideoRef.current.onloadedmetadata = resolve;
        });
        const dur = hiddenVideoRef.current.duration;
        URL.revokeObjectURL(objectUrl);
        hiddenVideoRef.current.src = "";

        if (!isFinite(dur) || dur < MIN_DURATION) {
            setError(`Video is too short (${dur?.toFixed(1)}s). Minimum is ${MIN_DURATION} seconds.`);
            return;
        }
        if (dur > MAX_DURATION) {
            setError(`Video is too long (${dur?.toFixed(1)}s). Maximum is ${MAX_DURATION} seconds.`);
            return;
        }

        setDuration(dur);
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await api.post("/media/upload-video", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (!res.data.success) throw new Error(res.data.error || "Upload failed");
            setVideoUrl(res.data.url);
            onUploaded(res.data.url);
        } catch (err) {
            setError(err.response?.data?.error || err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (file) validateAndUpload(file);
    };

    const clear = () => {
        setVideoUrl(null);
        setDuration(null);
        onUploaded(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className="space-y-3">
            {/* Hidden video element for duration check */}
            <video ref={hiddenVideoRef} className="hidden" preload="metadata" />

            {/* Instructions */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Liveness Check Instructions</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>Record a <strong>5–10 second</strong> selfie video</li>
                    <li>Hold your <strong>{docTypeLabel}</strong> clearly in frame</li>
                    <li>Your face must be clearly visible and well-lit</li>
                    <li>Accepted formats: MP4, MOV, WebM · max 50 MB</li>
                </ul>
            </div>

            {videoUrl ? (
                <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                    <span className="flex items-center gap-2 text-sm text-green-700 font-medium">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        Video uploaded {duration ? `(${duration.toFixed(1)}s)` : ""}
                    </span>
                    <div className="flex items-center gap-2">
                        <a href={videoUrl} target="_blank" rel="noreferrer"
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
                    className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-amber-200 rounded-xl py-6 px-4 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    ) : (
                        <Video className="w-6 h-6 text-amber-400" />
                    )}
                    <span className="text-xs font-bold text-gray-600">
                        {uploading ? "Uploading video…" : "Click to upload liveness video"}
                    </span>
                    <span className="text-[10px] text-gray-400">MP4, MOV or WebM · 5–10 seconds · max 50 MB</span>
                </button>
            )}

            {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={handleFile}
                disabled={disabled || uploading}
            />
        </div>
    );
}
