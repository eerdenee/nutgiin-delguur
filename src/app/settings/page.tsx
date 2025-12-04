"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Camera, Save, Banknote, Mail, CheckCircle } from "lucide-react";

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
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [avatar, setAvatar] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [currentRole, setCurrentRole] = useState("buyer");
    const [companyName, setCompanyName] = useState("");
    const [companyLogo, setCompanyLogo] = useState("");

    // Bank account info
    const [bankName, setBankName] = useState("");
    const [bankAccount, setBankAccount] = useState("");
    const [bankAccountName, setBankAccountName] = useState("");
    const [bankIBAN, setBankIBAN] = useState(""); // IBAN (optional)

    // Load initial data
    useEffect(() => {
        const savedProfile = localStorage.getItem("userProfile");
        if (savedProfile) {
            try {
                const parsed = JSON.parse(savedProfile);
                setName(parsed.name || "Бат-Эрдэнэ");
                setPhone(parsed.phone || "99112233");
                setEmail(parsed.email || "");
                setAvatar(parsed.avatar || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=800&auto=format&fit=crop&q=60");
                setCompanyName(parsed.companyName || "");
                setCompanyLogo(parsed.companyLogo || "");
                setBankName(parsed.bankName || "");
                setBankAccount(parsed.bankAccount || "");
                setBankAccountName(parsed.bankAccountName || "");
                setBankIBAN(parsed.bankIBAN || "");
            } catch (e) {
                console.error("Failed to parse profile", e);
            }
        } else {
            // Defaults
            setName("Бат-Эрдэнэ");
            setPhone("99112233");
            setAvatar("https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=800&auto=format&fit=crop&q=60");
        }

        // Load current role
        setCurrentRole(localStorage.getItem("userRole") || "buyer");
    }, []);

    const compressImage = (base64: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.src = base64;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const maxWidth = 500; // Resize to max 500px width
                const scale = maxWidth / img.width;

                if (scale >= 1) {
                    resolve(base64); // No need to resize
                    return;
                }

                canvas.width = maxWidth;
                canvas.height = img.height * scale;

                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.7)); // Compress to JPEG with 0.7 quality
            };
        });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("Зурагны хэмжээ хэт том байна. 5MB-аас бага хэмжээтэй зураг сонгоно уу.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                try {
                    const compressed = await compressImage(base64);
                    setAvatar(compressed);
                } catch (err) {
                    console.error("Compression failed", err);
                    setAvatar(base64); // Fallback to original
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        try {
            const profileData = {
                name,
                phone,
                email,
                avatar,
                companyName,
                companyLogo,
                bankName,
                bankAccount,
                bankAccountName,
                bankIBAN
            };
            localStorage.setItem("userProfile", JSON.stringify(profileData));

            // Dispatch event for other components
            window.dispatchEvent(new Event("profileUpdated"));

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Save failed:", error);
            alert("Хадгалахад алдаа гарлаа. Зурагны хэмжээ хэт том байж магадгүй.");
        }
    };

    const isValid = name.trim() && phone.trim();

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </Link>
                <h1 className="font-bold text-lg">Тохиргоо</h1>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto p-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative mb-4">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100">
                                {avatar ? (
                                    <Image
                                        src={avatar}
                                        alt="Avatar"
                                        width={96}
                                        height={96}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
                                        {name[0]}
                                    </div>
                                )}
                            </div>
                            <label
                                htmlFor="avatar-upload"
                                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-yellow-400 transition-colors shadow-lg"
                            >
                                <Camera className="w-4 h-4 text-secondary" />
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>
                        <p className="text-sm text-gray-500">Зураг солих</p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Нэр
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Нэрээ оруулна уу"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Утасны дугаар
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Утасны дугаар"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-blue-500" />
                                И-мэйл хаяг
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@gmail.com"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Нууц үг сэргээх, мэдэгдэл хүлээн авахад хэрэглэгдэнэ
                            </p>
                        </div>

                        {/* Company Branding - Only for Producers */}
                        {currentRole === 'producer' && (
                            <>
                                <div className="pt-4 border-t border-gray-200">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span>🏢</span>
                                        <span>Компанийн мэдээлэл (Премиум багц)</span>
                                    </h3>

                                    {/* Company Name */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                            Компанийн нэр
                                        </label>
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="Жишээ: Victory Cars"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Бүтээгдэхүүний картан дээр таны нэрийн оронд компанийн нэр харагдана
                                        </p>
                                    </div>

                                    {/* Company Logo URL */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                            Компанийн лого (URL)
                                        </label>
                                        <input
                                            type="url"
                                            value={companyLogo}
                                            onChange={(e) => setCompanyLogo(e.target.value)}
                                            placeholder="https://example.com/logo.png"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Лого нь бүтээгдэхүүний зурагны баруун дээд буланд харагдана (100x50px тохиромжтой)
                                        </p>
                                        {companyLogo && (
                                            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-600 mb-1">Урьдчилан харах:</p>
                                                <div className="bg-white p-2 rounded border border-gray-200 inline-block">
                                                    <Image
                                                        src={companyLogo}
                                                        alt="Company Logo Preview"
                                                        width={100}
                                                        height={50}
                                                        className="object-contain"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={!isValid}
                        className="w-full mt-8 px-6 py-4 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Хадгалах
                    </button>
                </div>

                {/* Bank Account Section - NEW */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-green-600" />
                        Төлбөр хүлээн авах данс
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Нэг удаа оруулаад, зар бүрт дахин бичих шаардлагагүй болно. Худалдан авагч дансыг хуулж авах боломжтой.
                    </p>

                    <div className="space-y-4">
                        {/* Bank Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Банк сонгох
                            </label>
                            <select
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors bg-white"
                            >
                                <option value="">-- Банк сонгоно уу --</option>
                                {BANKS.map((bank) => (
                                    <option key={bank.id} value={bank.name}>
                                        {bank.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Account Number */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Дансны дугаар
                            </label>
                            <input
                                type="text"
                                value={bankAccount}
                                onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ''))}
                                placeholder="1234567890"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono text-lg"
                            />
                        </div>

                        {/* Account Holder Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Дансны эзэмшигчийн нэр
                            </label>
                            <input
                                type="text"
                                value={bankAccountName}
                                onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                                placeholder="BAT-ERDENE"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors uppercase"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Латин үсгээр бичнэ үү (банканд бүртгэлтэй нэр)
                            </p>
                        </div>

                        {/* IBAN - Optional */}
                        <div className="pt-4 border-t border-gray-200">
                            <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                🌍 IBAN дугаар
                                <span className="text-xs font-normal text-gray-400">(Заавал биш)</span>
                            </label>
                            <input
                                type="text"
                                value={bankIBAN}
                                onChange={(e) => setBankIBAN(e.target.value.toUpperCase().replace(/\s/g, ''))}
                                placeholder="MN12 1234 5678 9012 3456 78"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono uppercase"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Олон улсын шилжүүлэг хүлээн авах бол IBAN оруулна уу
                            </p>
                        </div>
                    </div>

                    {/* Preview */}
                    {bankName && bankAccount && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">Данс бэлэн боллоо!</p>
                                    <p className="text-sm text-green-700 mt-1 font-mono">
                                        <strong>{bankName}</strong>: {bankAccount}
                                    </p>
                                    {bankAccountName && (
                                        <p className="text-xs text-green-600 mt-1">
                                            Эзэмшигч: {bankAccountName}
                                        </p>
                                    )}
                                    {bankIBAN && (
                                        <p className="text-xs text-blue-600 mt-1 font-mono">
                                            🌍 IBAN: {bankIBAN}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Save Bank Button */}
                    <button
                        onClick={handleSave}
                        className="w-full mt-4 px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Дансны мэдээлэл хадгалах
                    </button>
                </div>

                {/* Verification Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Баталгаажуулалт</h2>
                    {currentRole === 'producer' ? (
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-green-900">Таны хаяг баталгаажсан байна</p>
                                <p className="text-sm text-green-700">Та баталгаажсан үйлдвэрлэгч статустай байна</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-gray-600 mb-4">
                                Баталгаажсан үйлдвэрлэгч болж, итгэлийн тэмдэг авахыг хүсвэл доорх товчийг дарна уу.
                            </p>
                            <Link
                                href="/producer/verify"
                                className="block w-full px-6 py-4 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors text-center"
                            >
                                ✓ Баталгаажих хүсэлт илгээх
                            </Link>
                        </div>
                    )}
                </div>

                {/* Developer Zone */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">🔧 Developer Zone</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Тестийн зорилгоор хэрэглэгчийн төрлийг солих
                    </p>
                    <button
                        onClick={() => {
                            const currentRole = localStorage.getItem("userRole") || "buyer";
                            let newRole = "buyer";
                            if (currentRole === "buyer") newRole = "producer";
                            else if (currentRole === "producer") newRole = "admin";
                            else newRole = "buyer";

                            localStorage.setItem("userRole", newRole);
                            setCurrentRole(newRole);
                            window.dispatchEvent(new Event("roleUpdated"));
                            window.location.reload();
                        }}
                        className="w-full px-6 py-4 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                        🔄 Switch Role (Buyer {"->"} Producer {"->"} Admin)
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        Одоогийн төрөл: <strong>{currentRole}</strong>
                    </p>
                </div>
            </div>

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-bounce">
                    ✓ Амжилттай хадгалагдлаа
                </div>
            )}
        </div>
    );
}
