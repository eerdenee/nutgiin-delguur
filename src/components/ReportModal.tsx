"use client";

import { useState } from "react";
import { Flag, AlertTriangle, X, CheckCircle } from "lucide-react";
import { reportProduct, REPORT_REASONS, type ReportReason } from "@/lib/moderation";

interface ReportModalProps {
    productId: string;
    isOpen: boolean;
    onClose: () => void;
    onReportSuccess: () => void;
}

export default function ReportModal({ productId, isOpen, onClose, onReportSuccess }: ReportModalProps) {
    const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('');
    const [reportDescription, setReportDescription] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const submitReport = async () => {
        if (!selectedReason) return;

        setStatus('loading');

        try {
            const result = await reportProduct(productId, selectedReason, reportDescription);

            if (result.success) {
                setStatus('success');
                setMessage(result.message || 'Таны мэдээлэл амжилттай илгээгдлээ.');
                onReportSuccess();
                setTimeout(() => {
                    onClose();
                    setStatus('idle');
                    setSelectedReason('');
                    setReportDescription('');
                }, 2000);
            } else {
                setStatus('error');
                setMessage(result.message || 'Алдаа гарлаа. Дахин оролдоно уу.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Алдаа гарлаа. Дахин оролдоно уу.');
            if (process.env.NODE_ENV === 'development') {
                console.error("Report error:", err);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {status === 'success' ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">Баярлалаа!</h3>
                        <p className="text-gray-600">{message}</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Flag className="w-5 h-5 text-orange-500" />
                                <h2 className="font-bold text-lg">Бүтээгдэхүүн мэдээлэх</h2>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Close report modal"
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Шалтгаан сонгох *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(REPORT_REASONS).map(([key, value]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedReason(key as ReportReason)}
                                            className={`p-3 rounded-xl text-sm font-medium transition-all border ${selectedReason === key
                                                ? 'bg-orange-50 border-orange-500 text-orange-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            {value.labelMn}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="report-description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Нэмэлт тайлбар (заавал биш)
                                </label>
                                <textarea
                                    id="report-description"
                                    value={reportDescription}
                                    onChange={(e) => setReportDescription(e.target.value)}
                                    className="w-full p-3 border rounded-xl h-20 resize-none text-sm"
                                    placeholder="Дэлгэрэнгүй тайлбар бичих..."
                                />
                            </div>

                            {status === 'error' && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-700">{message}</p>
                                </div>
                            )}

                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                <p className="text-xs text-yellow-800">
                                    <strong>⚠️ Анхааруулга:</strong> 15+ хүн мэдээлвэл бүтээгдэхүүн автоматаар нуугдана.
                                    Худал мэдээлэл өгвөл таны аккаунтад хязгаарлалт тавигдаж болно.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border-t flex gap-2">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold"
                            >
                                Болих
                            </button>
                            <button
                                onClick={submitReport}
                                disabled={!selectedReason || status === 'loading'}
                                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Илгээж байна...
                                    </>
                                ) : (
                                    <>
                                        <Flag className="w-4 h-4" />
                                        Мэдээлэх
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
