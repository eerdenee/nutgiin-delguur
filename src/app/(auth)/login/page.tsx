"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Lock, Loader2, AlertCircle } from "lucide-react";
import { signInWithPhone, getCurrentProfile } from "@/lib/auth";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        phone: "",
        password: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const { data, error } = await signInWithPhone(formData.phone, formData.password);

            if (error) {
                console.error("Login error:", error);
                setError("Утасны дугаар эсвэл нууц үг буруу байна");
                return;
            }

            if (data?.user) {
                // Get profile to sync with localStorage
                const profile: any = await getCurrentProfile();

                // Save basic info to localStorage for backward compatibility/UI sync
                localStorage.setItem("userProfile", JSON.stringify({
                    name: profile?.name || "",
                    phone: formData.phone,
                    avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.phone}`
                }));

                // Redirect to dashboard
                router.push("/dashboard");
            } else {
                setError("Нэвтрэхэд алдаа гарлаа");
            }
        } catch (err) {
            console.error("Login exception:", err);
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

            <div className="flex-1 flex flex-col px-6 pt-10 pb-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Нэвтрэх</h1>
                    <p className="text-gray-500">Тавтай морил! Бүртгэлтэй хаягаараа нэвтэрнэ үү.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 rounded-xl flex items-start gap-3 text-red-600 animate-shake">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
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
                        <div className="flex justify-end mt-2">
                            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-yellow-600 transition-colors">
                                Нууц үгээ мартсан?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-secondary font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-yellow-400 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            "Нэвтрэх"
                        )}
                    </button>
                </form>

                <div className="mt-auto pt-6 text-center">
                    <p className="text-gray-600">
                        Бүртгэлгүй юу?{" "}
                        <Link href="/signup" className="font-bold text-primary hover:text-yellow-600 transition-colors">
                            Бүртгүүлэх
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
