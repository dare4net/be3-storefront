"use client";
import { CheckCircle, Clock, X, AlertCircle } from "lucide-react";

/** Maps a status string to its badge colour and label */
export function StatusBadge({ status }) {
    const map = {
        approved:  { cls: "bg-green-50 text-green-700 border-green-100",  icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Approved" },
        submitted: { cls: "bg-amber-50 text-amber-700 border-amber-100",  icon: <Clock className="w-3.5 h-3.5" />,       label: "Under Review" },
        rejected:  { cls: "bg-red-50 text-red-700 border-red-100",        icon: <X className="w-3.5 h-3.5" />,            label: "Rejected" },
        none:      { cls: "bg-gray-50 text-gray-500 border-gray-100",     icon: <AlertCircle className="w-3.5 h-3.5" />, label: "Not Started" },
    };
    const s = map[status] || map.none;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${s.cls}`}>
            {s.icon} {s.label}
        </span>
    );
}

/** Rejection reason alert box */
export function RejectionAlert({ reason }) {
    if (!reason) return null;
    return (
        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            <p className="font-bold text-xs uppercase tracking-wider mb-1">Rejection Reason</p>
            {reason}
        </div>
    );
}

/** Green "phase completed" banner */
export function ApprovedBanner({ label }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700 font-bold">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {label} — Approved ✓
        </div>
    );
}

/** Pending review notice */
export function PendingNotice({ message }) {
    return (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
            <Clock className="w-4 h-4 flex-shrink-0" />
            {message}
        </div>
    );
}
