"use client";

import { useState } from "react";
import { X, ShieldCheck, AlertTriangle, CheckCircle, Copy } from "lucide-react";

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    productTitle: string;
    price: number;
    sellerName: string;
    sellerPhone: string;
}

export default function OrderModal({ isOpen, onClose, productTitle, price, sellerName, sellerPhone }: OrderModalProps) {
    const [step, setStep] = useState<'confirm' | 'success'>('confirm');
    const [secureCode, setSecureCode] = useState<string>("");

    if (!isOpen) return null;

    const handleConfirm = () => {
        // Generate random 4-digit code
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setSecureCode(code);

        // Save order to localStorage (Mock)
        const newOrder = {
            id: Date.now().toString(),
            productTitle,
            price,
            sellerName,
            status: 'pending',
            secureCode: code,
            date: new Date().toISOString()
        };

        const existingOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
        localStorage.setItem('my_orders', JSON.stringify([newOrder, ...existingOrders]));

        // Dispatch event to update UI elsewhere if needed
        window.dispatchEvent(new Event('ordersUpdated'));

        setStep('success');
    };

    const handleCopyCode = async () => {
        try {
            // Try modern Clipboard API first
            await navigator.clipboard.writeText(secureCode);
            alert('✓ Код хуулагдлаа!');
        } catch (err) {
            // Fallback to legacy method
            try {
                const textarea = document.createElement('textarea');
                textarea.value = secureCode;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('✓ Код хуулагдлаа!');
            } catch (fallbackErr) {
                // If both fail, show the code in alert
                alert(`Кодыг manual copy хийнэ үү: ${secureCode}`);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
                    <h3 className="font-bold text-lg text-gray-900">Захиалга баталгаажуулах</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'confirm' ? (
                        <>
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">Аюулгүй худалдан авалт</h4>
                                    <p className="text-sm text-gray-600">
                                        Та захиалга өгснөөр танд <strong>4 оронтой нууц код</strong> үүснэ.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-bold mb-1">Анхаар:</p>
                                        <p>Бараагаа бүрэн хүлээж авч, шалгасны дараа л төлбөрөө шилжүүлж, нууц кодоо үйлдвэрлэгчид хэлээрэй.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Бүтээгдэхүүн:</span>
                                    <span className="font-bold text-gray-900">{productTitle}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Үнэ:</span>
                                    <span className="font-bold text-primary">₮{price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Үйлдвэрлэгч:</span>
                                    <span className="font-medium text-gray-900">{sellerName}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirm}
                                className="w-full py-3.5 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20"
                            >
                                Захиалах & Код авах
                            </button>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="font-bold text-xl text-gray-900 mb-2">Захиалга үүслээ!</h3>
                            <p className="text-gray-600 mb-6 text-sm">
                                Таны аюулгүй байдлын код үүслээ. Энэ кодыг бараагаа хүлээж авсны дараа л худалдагчид өгнө үү.
                            </p>

                            <div
                                className="bg-gray-100 rounded-xl p-6 mb-6 relative group cursor-pointer hover:bg-gray-200 transition-colors"
                                onClick={handleCopyCode}
                            >
                                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Таны нууц код</p>
                                <div className="text-4xl font-black text-gray-900 tracking-widest font-mono">
                                    {secureCode}
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Copy className="w-4 h-4 text-gray-400" />
                                </div>
                                <p className="text-xs text-gray-500 mt-3">
                                    👆 Дарж хуулах
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => window.location.href = `tel:${sellerPhone}`}
                                    className="w-full py-3 bg-white border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Худалдагч руу залгах ({sellerPhone})
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                                >
                                    Хаах
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
