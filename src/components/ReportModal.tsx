
"use client";

import { useState } from "react";
import { Flag, AlertTriangle, X, Loader2 } from "lucide-react";
import { reportProduct } from "@/app/actions/moderation";

interface ReportModalProps {
    productId: string;
    isOpen: boolean;
    onClose: () => void;
}

const REASONS = [
    { id: 'illegal', label: 'Хууль бус бараа (Хар тамхи, зэвсэг г.м)', icon: AlertTriangle },
    { id: 'scam', label: 'Залилан / Хуурамч бараа', icon: AlertTriangle },
    { id: 'spam', label: 'Спам / Давхардсан зар', icon: Flag },
    { id: 'other', label: 'Бусад шалтгаан', icon: Flag },
];

export default function ReportModal({ productId, isOpen, onClose }: ReportModalProps) {
    const [selectedReason, setSelectedReason] = useState<string>("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReason) return;

        setIsSubmitting(true);
        try {
            // Call Server Action
            // Note: If you are using the mock version, you might need to adapt this.
            // For now, we assume the server action is wired up.
            const result = await reportProduct(productId, selectedReason, description);

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setSelectedReason("");
                    setDescription("");
                }, 2000);
            } else {
                alert(result.error || "Алдаа гарлаа");
            }
        } catch (error) {
            console.error(error);
            alert("Алдаа гарлаа.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                {success ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Flag className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Мэдээлэл илгээгдлээ</h3>
                        <p className="text-gray-600">Бид таны мэдээллийг шалгах болно.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <Flag className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Зар мэдээлэх</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Шалтгаан сонгох</label>
                                <div className="grid gap-2">
                                    {REASONS.map((reason) => (
                                        <button
                                            key={reason.id}
                                            type="button"
                                            onClick={() => setSelectedReason(reason.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedReason === reason.id
                                                ? "border-red-500 bg-red-50 text-red-700"
                                                : "border-gray-200 hover:bg-gray-50 text-gray-700"
                                                }`}
                                        >
                                            <reason.icon className={`w-5 h-5 ${selectedReason === reason.id ? "text-red-500" : "text-gray-400"}`} />
                                            <span className="font-medium">{reason.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Нэмэлт тайлбар (Заавал биш)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
                                    placeholder="Дэлгэрэнгүй мэдээлэл..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!selectedReason || isSubmitting}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${!selectedReason || isSubmitting
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-red-600 text-white hover:bg-red-700"
                                    }`}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Илгээх"
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
