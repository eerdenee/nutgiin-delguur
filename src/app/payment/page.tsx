"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { safeLocalStorage } from "@/lib/safeStorage";

function PaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan') || "Суурь";
    const price = searchParams.get('price') || "5,000₮";
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePaymentConfirm = async () => {
        setIsProcessing(true);

        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Төлбөр төлсөн тохиолдолд subscription идэвхжүүлэх
        const subscription = safeLocalStorage.get<any>("userSubscription", null);
        if (subscription && typeof subscription === 'object') {
            const success = safeLocalStorage.set("userSubscription", {
                ...subscription,
                paid: true,
                paidAt: new Date().toISOString()
            });

            if (!success) {
                alert("Алдаа гарлаа. Дахин оролдоно уу.");
                setIsProcessing(false);
                return;
            }
        }

        // Use router.push instead of window.location for better UX
        router.push("/dashboard?payment=success");
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                <Link href="/dashboard/upgrade" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </Link>
                <h1 className="font-bold text-lg">Төлбөр төлөх</h1>
            </div>

            <div className="max-w-md mx-auto p-4 mt-6">
                {/* Order Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                    <h2 className="font-bold text-lg mb-4">Захиалгын дэлгэрэнгүй</h2>
                    <div className="space-y-2 mb-4 pb-4 border-b">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Багц:</span>
                            <span className="font-bold">{plan}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Хугацаа:</span>
                            <span className="font-bold">30 хоног</span>
                        </div>
                    </div>
                    <div className="flex justify-between text-xl">
                        <span className="font-bold">Нийт:</span>
                        <span className="font-bold text-primary">{price}</span>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                    <h3 className="font-bold mb-4">Төлбөрийн хэрэгсэл сонгох</h3>

                    {/* QPay */}
                    <button className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-yellow-50 transition-all mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                                📱
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-bold">QPay</p>
                                <p className="text-sm text-gray-500">QR код уншуулах</p>
                            </div>
                            <div className="text-gray-400">→</div>
                        </div>
                    </button>

                    {/* Bank Transfer */}
                    <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                        <p className="font-bold mb-3 flex items-center gap-2">
                            <span className="text-xl">🏦</span>
                            Банкны шилжүүлэг
                        </p>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Банк:</span>
                                <span className="font-medium">Хаан банк</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Данс:</span>
                                <span className="font-mono font-medium">5123 4567 8901</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Нэр:</span>
                                <span className="font-medium">НутакМаркет ХХК</span>
                            </div>
                        </div>
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-800">
                                ⚠️ <strong>Гүйлгээний утга:</strong> {plan} - Таны утасны дугаар
                            </p>
                        </div>
                    </div>
                </div>

                {/* Confirm Button */}
                <button
                    onClick={handlePaymentConfirm}
                    disabled={isProcessing}
                    className="w-full py-4 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Төлбөр баталгаажуулж байна...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            Төлбөр төлсөн
                        </>
                    )}
                </button>

                <p className="text-center text-xs text-gray-500 mt-4">
                    Төлбөр төлсөний дараа таны багц автоматаар идэвхжинэ
                </p>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
            <PaymentContent />
        </Suspense>
    );
}
