"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { signUpWithPhone } from "@/lib/auth";

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        password: "",
        confirmPassword: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Нууц үг таарахгүй байна");
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await signUpWithPhone(formData.phone, formData.password, formData.name);

            if (error) {
                console.error("Signup error:", error);
                if (error.message.includes("already registered")) {
                    setError("Энэ дугаар бүртгэлтэй байна");
                } else {
                    setError(error.message);
                }
                return;
            }

            if (data?.user) {
                // Save basic info to localStorage for backward compatibility/UI sync
                localStorage.setItem("userProfile", JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.phone}`
                }));

                // Redirect to dashboard
                router.push("/dashboard");
            } else {
                setError("Бүртгүүлэхэд алдаа гарлаа");
            }
        } catch (err) {
            console.error("Signup exception:", err);
            setError("Сүлжээний алдаа гарлаа");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="p-4">
                <Link href="/" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </Link>
            </div>

            <div className="flex-1 flex flex-col px-6 pt-4 pb-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Бүртгүүлэх</h1>
                    <p className="text-gray-500">Шинээр бүртгүүлж, Монголын шилдэг бүтээгдэхүүнүүдийг сонирхоорой.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 rounded-xl flex items-start gap-3 text-red-600 animate-shake">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Нэр
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="Таны нэр"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Утасны дугаар
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Phone className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="99112233"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Нууц үг
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-1">Хамгийн багадаа 6 тэмдэгт</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Нууц үг давтах
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-secondary font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-yellow-400 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                "Бүртгүүлэх"
                            )}
                        </button>
                    </div>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Эсвэл</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={async () => {
                        const { supabase } = await import("@/lib/supabase");
                        await supabase.auth.signInWithOAuth({
                            provider: 'google',
                            options: {
                                redirectTo: `${window.location.origin}/auth/callback`
                            }
                        });
                    }}
                    className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
                    Google-ээр бүртгүүлэх
                </button>

                <div className="mt-auto pt-6 text-center">
                    <p className="text-gray-600">
                        Бүртгэлтэй юу?{" "}
                        <Link href="/login" className="font-bold text-primary hover:text-yellow-600 transition-colors">
                            Нэвтрэх
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
