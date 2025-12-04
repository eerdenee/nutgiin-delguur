"use client";

import { ArrowLeft, Check, QrCode } from "lucide-react";
import Link from "next/link";

export default function SubscriptionPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="bg-white px-4 py-4 border-b sticky top-0 z-10 flex items-center gap-4">
                <Link href="/dashboard" className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="font-bold text-lg">Subscription</h1>
            </div>

            <div className="p-4 max-w-md mx-auto space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Unlimited Access</h2>
                    <p className="text-gray-500 mb-6">Post unlimited ads for 30 days</p>

                    <div className="text-4xl font-bold text-primary mb-6">
                        ₮10,000 <span className="text-base text-gray-400 font-normal">/ month</span>
                    </div>

                    <ul className="text-left space-y-3 mb-8">
                        <li className="flex items-center gap-3 text-gray-600">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="w-4 h-4 text-green-600" />
                            </div>
                            Post unlimited ads
                        </li>
                        <li className="flex items-center gap-3 text-gray-600">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="w-4 h-4 text-green-600" />
                            </div>
                            Priority support
                        </li>
                        <li className="flex items-center gap-3 text-gray-600">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="w-4 h-4 text-green-600" />
                            </div>
                            Verified seller badge
                        </li>
                    </ul>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                        <div className="flex items-center justify-center mb-4">
                            <QrCode className="w-32 h-32 text-gray-900" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Scan with QPay</p>
                    </div>

                    <button className="w-full bg-primary text-secondary font-bold py-4 rounded-xl shadow-sm hover:bg-yellow-400 transition-colors active:scale-95">
                        Check Payment Status
                    </button>
                </div>
            </div>
        </div>
    );
}
