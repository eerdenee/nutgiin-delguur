"use client";

import { AlertCircle, CheckCircle, Upload, X } from "lucide-react";
import { useState } from "react";
import { TierUpgradeRequirement } from "@/lib/verificationSystem";

interface TierUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    requirement: TierUpgradeRequirement;
    onVerify: () => void;
    onSkip?: () => void;
}

export default function TierUpgradeModal({
    isOpen,
    onClose,
    requirement,
    onVerify,
    onSkip
}: TierUpgradeModalProps) {
    const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
    const [idBackFile, setIdBackFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        const file = e.target.files?.[0];
        if (file) {
            if (side === 'front') setIdFrontFile(file);
            else setIdBackFile(file);
        }
    };

    const handleSubmit = async () => {
        if (!idFrontFile || !idBackFile) {
            alert('Иргэний үнэмлэхний хоёр талын зургийг оруулна уу!');
            return;
        }

        setIsUploading(true);

        // Simulate upload (replace with real upload logic)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Store verification request in localStorage
        const verificationRequest = {
            idFrontFile: idFrontFile.name,
            idBackFile: idBackFile.name,
            requestedAt: new Date().toISOString(),
            tier: requirement.nextTier,
            status: 'pending'
        };

        const existing = JSON.parse(localStorage.getItem('verification_requests') || '[]');
        existing.push(verificationRequest);
        localStorage.setItem('verification_requests', JSON.stringify(existing));

        alert('✅ Баталгаажуулалтын хүсэлт илгээгдлээ! 24-48 цагийн дотор хянагдана.');

        setIsUploading(false);
        onVerify();
        onClose();
    };

    const tierNames = {
        soum: 'Сумын',
        aimag: 'Аймгийн',
        national: 'Улсын'
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-yellow-400 to-amber-500 p-6 rounded-t-3xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {requirement.isMandatory ? (
                                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-7 h-7 text-white" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-7 h-7 text-white" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {requirement.isMandatory ? '🔴 ЗААВАЛ БАТАЛГААЖУУЛАХ' : '🟡 Санал болгох'}
                                </h2>
                                <p className="text-sm text-gray-700">
                                    {tierNames[requirement.currentTier]} → {tierNames[requirement.nextTier]} түвшин
                                </p>
                            </div>
                        </div>
                        {!requirement.isMandatory && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-900" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Message */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                            {requirement.message}
                        </p>
                    </div>

                    {/* Fee Display */}
                    {requirement.fee && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">Баталгаажуулалтын хураамж:</span>
                                <span className="text-2xl font-bold text-amber-600">{requirement.fee.toLocaleString()}₮</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                                💡 Энэ нь нэг удаагийн төлбөр. Баталгаажуулсны дараа Улс даяар үүрд харагдана.
                            </p>
                        </div>
                    )}

                    {/* Upload Section */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Иргэний үнэмлэх оруулах
                        </h3>

                        {/* Front Side */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Урд тал
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'front')}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                            />
                            {idFrontFile && (
                                <p className="text-xs text-green-600 mt-1">✓ {idFrontFile.name}</p>
                            )}
                        </div>

                        {/* Back Side */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ар тал
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'back')}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                            />
                            {idBackFile && (
                                <p className="text-xs text-green-600 mt-1">✓ {idBackFile.name}</p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        {!requirement.isMandatory && onSkip && (
                            <button
                                onClick={() => {
                                    onSkip();
                                    onClose();
                                }}
                                className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Дараа хийх
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={!idFrontFile || !idBackFile || isUploading}
                            className={`flex-1 py-3 px-4 font-bold rounded-xl transition-colors ${idFrontFile && idBackFile && !isUploading
                                    ? 'bg-primary text-secondary hover:bg-yellow-400'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isUploading ? 'Илгээж байна...' : 'Баталгаажуулах'}
                        </button>
                    </div>

                    {/* Info */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-xs text-gray-600">
                            🔒 Таны мэдээлэл 100% нууцлагдана. Зөвхөн баталгаажуулалтын зорилгоор хэрэглэгдэнэ.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
