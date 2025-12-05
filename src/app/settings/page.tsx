"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Camera, Save, Banknote, Mail, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [currentRole, setCurrentRole] = useState("buyer");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Profile Data
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [avatar, setAvatar] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [companyLogo, setCompanyLogo] = useState("");

    // Bank account info
    const [bankName, setBankName] = useState("");
    const [bankAccount, setBankAccount] = useState("");
    const [bankAccountName, setBankAccountName] = useState("");
    const [bankIBAN, setBankIBAN] = useState("");

    // Load initial data
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const { supabase } = await import("@/lib/supabase");
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setIsLoggedIn(false);
                    setIsLoading(false);
                    return;
                }

                setIsLoggedIn(true);
                setPhone(user.phone || "");
                setEmail(user.email || "");

                // Get profile
                const { data: profile } = await (supabase
                    .from('profiles') as any)
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setName(profile.name || "");
                    setAvatar(profile.avatar_url || "");
                    setCurrentRole(profile.role || "buyer");
                    setCompanyName(profile.company_name || "");
                    setCompanyLogo(profile.company_logo || "");
                    setBankName(profile.bank_name || "");
                    setBankAccount(profile.bank_account || "");
                    setBankAccountName(profile.bank_account_name || "");
                    setBankIBAN(profile.bank_iban || "");
                }
            } catch (err) {
                console.error("Error loading profile:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, []);

    const uploadAvatar = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'avatars');

        const { supabase } = await import("@/lib/supabase");
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session?.access_token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Image upload failed');
        }

        const data = await response.json();
        return data.url;
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Зурагны хэмжээ хэт том байна. 5MB-аас бага хэмжээтэй зураг сонгоно уу.");
                return;
            }

            try {
                setIsSaving(true);
                const url = await uploadAvatar(file);
                setAvatar(url);

                // Update profile immediately
                const { supabase } = await import("@/lib/supabase");
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await (supabase.from('profiles') as any)
                        .update({ avatar_url: url })
                        .eq('id', user.id);
                }
            } catch (err) {
                console.error("Upload failed", err);
                alert("Зураг хуулахад алдаа гарлаа");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            alert("Нэрээ оруулна уу");
            return;
        }

        setIsSaving(true);
        try {
            const { supabase } = await import("@/lib/supabase");
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const updates = {
                name,
                email, // Can update email if needed, but usually requires verification
                company_name: companyName,
                company_logo: companyLogo,
                bank_name: bankName,
                bank_account: bankAccount,
                bank_account_name: bankAccountName,
                bank_iban: bankIBAN,
                updated_at: new Date().toISOString(),
            };

            const { error } = await (supabase
                .from('profiles') as any)
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            // Update localStorage for backward compatibility
            localStorage.setItem("userProfile", JSON.stringify({
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
            }));

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Save failed:", error);
            alert("Хадгалахад алдаа гарлаа.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <p className="text-gray-600 mb-4">Нэвтрэх шаардлагатай</p>
                <Link href="/login" className="px-6 py-2.5 bg-primary text-secondary font-bold rounded-xl">
                    Нэвтрэх
                </Link>
            </div>
        );
    }

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
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                                ) : (
                                    <Camera className="w-4 h-4 text-secondary" />
                                )}
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                disabled={isSaving}
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
                                disabled
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 mt-1">Утасны дугаарыг өөрчлөх боломжгүй</p>
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
                        disabled={isSaving}
                        className="w-full mt-8 px-6 py-4 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Хадгалах
                    </button>
                </div>

                {/* Bank Account Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-green-600" />
                        Төлбөр хүлээн авах данс
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Нэг удаа оруулаад, зар бүрт дахин бичих шаардлагагүй болно.
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
                        </div>
                    </div>

                    {/* Save Bank Button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full mt-4 px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Дансны мэдээлэл хадгалах
                    </button>
                </div>

                {/* Verification Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Баталгаажуулалт</h2>
                    {currentRole === 'producer' ? (
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                            <CheckCircle className="w-6 h-6 text-green-600" />
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
            </div>

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-bounce flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Амжилттай хадгалагдлаа
                </div>
            )}
        </div>
    );
}
