"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Banknote, CheckCircle, Mail, User, Phone, AlertCircle } from "lucide-react";

// Mongolian banks list
const BANKS = [
    { id: "khan", name: "Хаан банк" },
    { id: "golomt", name: "Голомт банк" },
    { id: "tdb", name: "ХХБ" },
    { id: "state", name: "Төрийн банк" },
    { id: "xac", name: "Хас банк" },
    { id: "capitron", name: "Капитрон банк" },
    { id: "arig", name: "Ариг банк" },
    { id: "bogd", name: "Богд банк" },
    { id: "chinggis", name: "Чингис хаан банк" },
    { id: "most", name: "Мост Мани" },
];

export default function SettingsPage() {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        smsNotifications: true,
        emailNotifications: true,
        bankName: "",
        bankAccount: "",
        bankAccountName: "" // Дансны эзэмшигчийн нэр
    });

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Load profile from localStorage
    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
        setFormData({
            name: profile.name || "",
            phone: profile.phone || "",
            email: profile.email || "",
            smsNotifications: profile.smsNotifications !== false,
            emailNotifications: profile.emailNotifications !== false,
            bankName: profile.bankName || "",
            bankAccount: profile.bankAccount || "",
            bankAccountName: profile.bankAccountName || ""
        });
    }, []);

    // Validate email
    const validateEmail = (email: string) => {
        if (!email) return true; // Optional field
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // Validate phone
    const validatePhone = (phone: string) => {
        if (!phone) return true; // Optional field
        return /^\d{8}$/.test(phone);
    };

    const handleSave = () => {
        const newErrors: { [key: string]: string } = {};

        if (!validateEmail(formData.email)) {
            newErrors.email = "И-мэйл хаяг буруу байна";
        }
        if (!validatePhone(formData.phone)) {
            newErrors.phone = "Утасны дугаар 8 оронтой байх ёстой";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        // Save to localStorage
        const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
        const updatedProfile = {
            ...profile,
            ...formData
        };
        localStorage.setItem("userProfile", JSON.stringify(updatedProfile));

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleDelete = () => {
        // Clear all user data
        localStorage.removeItem("userProfile");
        localStorage.removeItem("my_ads");
        localStorage.removeItem("favorites");
        localStorage.removeItem("chat_conversations");

        // Redirect to home
        window.location.href = "/";
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </Link>
                <h1 className="font-bold text-lg">Тохиргоо</h1>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {/* Personal Info Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Хувийн мэдээлэл
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Нэр
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Таны нэр"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                Утасны дугаар
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                maxLength={8}
                                placeholder="99112233"
                                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary focus:border-primary ${errors.phone ? "border-red-500" : "border-gray-200"
                                    }`}
                            />
                            {errors.phone && (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.phone}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                И-мэйл хаяг
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="example@gmail.com"
                                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary focus:border-primary ${errors.email ? "border-red-500" : "border-gray-200"
                                    }`}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.email}
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                Нууц үг сэргээх, мэдэгдэл хүлээн авахад хэрэглэгдэнэ
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bank Account Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-green-600" />
                        Төлбөр хүлээн авах данс
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Энд дансаа нэг удаа оруулаад, зар бүрт дахин бичих шаардлагагүй болно.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Банк сонгох
                            </label>
                            <select
                                value={formData.bankName}
                                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                            >
                                <option value="">-- Банк сонгоно уу --</option>
                                {BANKS.map((bank) => (
                                    <option key={bank.id} value={bank.name}>
                                        {bank.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Дансны дугаар
                            </label>
                            <input
                                type="text"
                                value={formData.bankAccount}
                                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value.replace(/\D/g, '') })}
                                placeholder="1234567890"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary font-mono text-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Дансны эзэмшигчийн нэр
                            </label>
                            <input
                                type="text"
                                value={formData.bankAccountName}
                                onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value.toUpperCase() })}
                                placeholder="BAT-ERDENE"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Латин үсгээр бичнэ үү (банканд бүртгэлтэй нэр)
                            </p>
                        </div>
                    </div>

                    {formData.bankName && formData.bankAccount && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">Данс амжилттай хадгалагдлаа!</p>
                                    <p className="text-sm text-green-700 mt-1">
                                        <strong>{formData.bankName}</strong>: {formData.bankAccount}
                                    </p>
                                    <p className="text-xs text-green-600 mt-2">
                                        Худалдан авагч нар таны дансыг шууд хуулж авах боломжтой болно.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notifications Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="font-bold text-base text-gray-900 mb-4">Мэдэгдэл</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">SMS мэдэгдэл</p>
                                <p className="text-sm text-gray-500">Шинэ зурвас, зар хүлээн авах</p>
                            </div>
                            <button
                                onClick={() => setFormData({ ...formData, smsNotifications: !formData.smsNotifications })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.smsNotifications ? "bg-primary" : "bg-gray-200"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.smsNotifications ? "translate-x-6" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">И-мэйл мэдэгдэл</p>
                                <p className="text-sm text-gray-500">Зар идэвхжсэн, сэтгэгдэл ирсэн</p>
                            </div>
                            <button
                                onClick={() => setFormData({ ...formData, emailNotifications: !formData.emailNotifications })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.emailNotifications ? "bg-primary" : "bg-gray-200"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.emailNotifications ? "translate-x-6" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 font-bold rounded-xl transition-all shadow-sm ${saved
                        ? "bg-green-500 text-white"
                        : "bg-primary text-secondary hover:bg-yellow-400 active:scale-95"
                        }`}
                >
                    {saved ? (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            Амжилттай хадгалагдлаа!
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Хадгалах
                        </>
                    )}
                </button>

                {/* Data Migration Section */}
                <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-6">
                    <h2 className="font-bold text-base text-blue-900 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Өгөгдөл шилжүүлэх
                    </h2>
                    <p className="text-sm text-blue-800 mb-4">
                        Таны хуучин оруулсан зар, мэдээллийг шинэ систем рүү шилжүүлэх.
                    </p>
                    <button
                        onClick={async () => {
                            if (!confirm("Та өгөгдлөө шилжүүлэхдээ итгэлтэй байна уу?")) return;
                            try {
                                const { migrateData } = await import("@/lib/migration");
                                const result = await migrateData();
                                if (result.success) {
                                    alert(`Амжилттай! Нийт ${result.migratedAds} зар шилжлээ.`);
                                } else {
                                    alert("Алдаа гарлаа. Та нэвтэрсэн эсэхээ шалгана уу.");
                                }
                            } catch (e) {
                                console.error(e);
                                alert("Алдаа гарлаа.");
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        Өгөгдөл шилжүүлэх
                    </button>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 rounded-2xl border-2 border-red-200 p-6">
                    <h2 className="font-bold text-base text-red-700 mb-2">Аюултай бүс</h2>
                    <p className="text-sm text-red-600 mb-4">
                        Бүртгэлээ устгавал таны бүх мэдээлэл, зар сурталчилгаа устах болно. Энэ үйлдлийг буцаах боломжгүй.
                    </p>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                        Бүртгэл устгах
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">Бүртгэл устгах уу?</h3>
                        <p className="text-gray-600 text-sm mb-6">
                            Та итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Болих
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
                            >
                                Устгах
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
