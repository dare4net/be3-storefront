"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle, ShoppingBag } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/providers/CartContext";

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const { refreshCart } = useCart();

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                    <p className="text-gray-500">
                        Thank you for your purchase. Your order has been received and is being processed.
                    </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                    <p className="font-mono font-medium text-gray-900">{orderId}</p>
                </div>

                <div className="pt-4 space-y-3">
                    <Link
                        href="/"
                        className="block w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
