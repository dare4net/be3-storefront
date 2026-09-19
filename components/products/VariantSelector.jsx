"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { CheckCircle2, Layers } from "lucide-react";

export default function VariantSelector({ currentHandle, variants = [], parentProduct = null, currentProduct = null }) {
    const router = useRouter();

    // Build base model option
    // If we're on a variant page, parent is the base model.
    // If we're on the parent page, the parent IS the current product.
    const baseModel = parentProduct || (!currentProduct?.parent_id ? currentProduct : null);

    // Combine: base model first, then all variants
    const allOptions = [
        ...(baseModel ? [{ ...baseModel, _isBase: true }] : []),
        ...variants.map(v => ({ ...v, _isBase: false }))
    ];

    if (allOptions.length <= 1) return null;

    // Figure out the base price for delta calculations
    const basePrice = parseFloat(baseModel?.price || allOptions[0]?.price || 0);

    return (
        <div className="py-5 space-y-3 border-t border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                        Available Configurations
                    </h3>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">
                    {allOptions.length} option{allOptions.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-2">
                {allOptions.map((opt) => {
                    const isActive = opt.handle === currentHandle;
                    const optPrice = parseFloat(opt.price || 0);
                    const delta = optPrice - basePrice;
                    const label = opt.variant_label || (opt._isBase ? "Base Model" : opt.name);

                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => !isActive && router.push(`/products/${opt.handle}`)}
                            className={cn(
                                "relative group text-left px-4 py-3 border-2 transition-all duration-200",
                                isActive
                                    ? "shadow-sm"
                                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/80 cursor-pointer"
                            )}
                            style={{
                                borderRadius: 'var(--btn-radius, 0.75rem)',
                                ...(isActive ? {
                                    borderColor: 'var(--primary)',
                                    backgroundColor: 'var(--accent-soft, rgba(37, 99, 235, 0.08))'
                                } : {})
                            }}
                        >
                            {/* Active check */}
                            {isActive && (
                                <CheckCircle2 className="absolute top-2 right-2 w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                            )}

                            {/* Label */}
                            <span
                                className={cn(
                                    "block text-xs font-bold truncate pr-5",
                                    isActive ? "font-extrabold" : "text-gray-800"
                                )}
                                style={isActive ? { color: 'var(--primary)' } : {}}
                            >
                                {label}
                            </span>

                            {/* Price row */}
                            <div className="flex items-center gap-1.5 mt-1">
                                <span
                                    className="text-sm font-black"
                                    style={isActive ? { color: 'var(--primary)' } : { color: '#374151' }}
                                >
                                    ${optPrice.toFixed(2)}
                                </span>
                                {!opt._isBase && delta !== 0 && (
                                    <span className={cn(
                                        "text-[10px] font-semibold rounded-full px-1.5 py-0.5",
                                        delta > 0
                                            ? "bg-orange-50 text-orange-500"
                                            : "bg-green-50 text-green-500"
                                    )}>
                                        {delta > 0 ? "+" : ""}{delta.toFixed(0)}
                                    </span>
                                )}
                                {opt._isBase && (
                                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-400 rounded-full px-1.5 py-0.5">
                                        base
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
