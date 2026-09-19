"use client";

import { useState } from 'react';
import { cn } from "@/lib/utils";

export default function ProductVariantSelector() {
    const colors = [
        { name: "Black", hex: "#111111" },
        { name: "White", hex: "#f5f5f7" },
        { name: "Blue", hex: "#0071e3" },
        { name: "Midnight", hex: "#1d2951" },
    ];

    const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
    const unavailable = ["XS"];

    const [selectedColor, setSelectedColor] = useState(colors[0]);
    const [selectedSize, setSelectedSize] = useState("M");

    return (
        <div className="space-y-6">
            {/* Color */}
            <div>
                <p className="text-sm font-medium text-gray-900 mb-3">
                    Color — <span className="text-gray-500 font-normal">{selectedColor.name}</span>
                </p>
                <div className="flex gap-3">
                    {colors.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => setSelectedColor(color)}
                            title={color.name}
                            className={cn(
                                "w-8 h-8 rounded-full transition-all",
                                selectedColor.name === color.name
                                    ? "ring-2 ring-offset-2 ring-gray-900"
                                    : "ring-1 ring-gray-300 hover:ring-gray-500"
                            )}
                            style={{ backgroundColor: color.hex }}
                        />
                    ))}
                </div>
            </div>

            {/* Size */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-900">
                        Size — <span className="text-gray-500 font-normal">{selectedSize}</span>
                    </p>
                    <button className="text-sm text-gray-500 underline underline-offset-4 hover:text-gray-900 transition-colors">
                        Size guide
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                        const isUnavailable = unavailable.includes(size);
                        const isSelected = selectedSize === size;
                        return (
                            <button
                                key={size}
                                disabled={isUnavailable}
                                onClick={() => !isUnavailable && setSelectedSize(size)}
                                className={cn(
                                    "h-11 min-w-[44px] px-4 text-sm font-medium rounded-full border transition-all",
                                    isUnavailable
                                        ? "border-gray-200 text-gray-300 cursor-not-allowed line-through"
                                        : isSelected
                                            ? "bg-gray-900 text-white border-gray-900"
                                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-900"
                                )}
                            >
                                {size}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
