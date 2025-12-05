"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Lock, ArrowRight, Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Нууц үг таарахгүй байна");
            return;
        }

        if (formData.phone.length !== 8) {
            setError("Утасны дугаар 8 оронтой байх ёстой");
            return;
        }

        if (!formData.name.trim()) {
            setError("Нэрээ оруулна уу");
            return;
        }

        setIsLoading(true);

        try {
            // Import dynamically to avoid server-side issues
            const { signUpWithPhone } = await import("@/lib/auth");

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
            }
        } catch (err: any) {
            console.error("Unexpected error:", err);
            setError("Алдаа гарлаа. Дахин оролдоно уу.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                    Бүртгүүлэх
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Бүртгэлтэй юу?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-primary hover:text-yellow-600 transition-colors"
                    >
                        Нэвтрэх
                    </Link>
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium leading-6 text-gray-900"
                        >
                            Нэр
                        </label>
                        <div className="mt-2 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="block w-full rounded-xl border-0 py-3 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                placeholder="Таны нэр"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="phone"
                            className="block text-sm font-medium leading-6 text-gray-900"
                        >
                            Утасны дугаар
                        </label>
                        <div className="mt-2 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                required
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone: e.target.value })
                                }
                                className="block w-full rounded-xl border-0 py-3 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                placeholder="88112233"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium leading-6 text-gray-900"
                        >
                            Нууц үг
                        </label>
                        <div className="mt-2 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                className="block w-full rounded-xl border-0 py-3 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium leading-6 text-gray-900"
                        >
                            Нууц үг давтах
                        </label>
                        <div className="mt-2 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                    setFormData({ ...formData, confirmPassword: e.target.value })
                                }
                                className="block w-full rounded-xl border-0 py-3 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full justify-center rounded-xl bg-primary px-3 py-3 text-sm font-bold leading-6 text-secondary shadow-sm hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Бүртгүүлэх <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500">Эсвэл</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={async () => {
                                setIsLoading(true);
                                try {
                                    const { supabase } = await import("@/lib/supabase");
                                    const { error } = await supabase.auth.signInWithOAuth({
                                        provider: 'google',
                                        options: {
                                            redirectTo: `${window.location.origin}/auth/callback`,
                                        },
                                    });
                                    if (error) throw error;
                                } catch (error) {
                                    console.error("Error logging in:", error);
                                    setIsLoading(false);
                                }
                            }}
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-3 py-3 text-sm font-bold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                                <path
                                    d="M12.0003 20.45c-4.6667 0-8.45-3.7833-8.45-8.45 0-4.6667 3.7833-8.45 8.45-8.45 2.2833 0 4.4333.8333 6.0667 2.35l-2.3833 2.3833c-.8833-.85-2.1667-1.3833-3.6833-1.3833-3.15 0-5.7 2.55-5.7 5.7 0 3.15 2.55 5.7 5.7 5.7 2.9167 0 4.9667-1.6667 5.4-4.2h-5.4v-3.35h8.8333c.1.5833.15 1.1833.15 1.8167 0 5.25-3.5167 9-8.9834 9z"
                                    fill="currentColor"
                                />
                            </svg>
                            Google-ээр бүртгүүлэх
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
