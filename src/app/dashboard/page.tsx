"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Heart, Settings, LogOut, CheckCircle, ChevronRight, ArrowLeft, HelpCircle, X, Sparkles, ShieldCheck, Crown, BarChart3, Clock, Flag } from "lucide-react";
import { getUserSubscription, canPostMoreAds, SUBSCRIPTION_PLANS } from "@/lib/subscription";

export default function ProfilePage() {
    const [showTooltip, setShowTooltip] = useState(false);
    const [user, setUser] = useState({
        name: "",
        phone: "",
        isVerified: false,
        isSubscribed: false,
        subscriptionEnds: "",
        image: ""
    });

    const [counts, setCounts] = useState({
        myProducts: 0,
        favorites: 0
    });

    const [userRole, setUserRole] = useState<'buyer' | 'producer' | 'admin'>('buyer');
    const [subscription, setSubscription] = useState<any>(null);
    const [subscriptionInfo, setSubscriptionInfo] = useState<ReturnType<typeof getUserSubscription> | null>(null);
    const [adLimitInfo, setAdLimitInfo] = useState<ReturnType<typeof canPostMoreAds> | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                // Import dynamically to avoid server-side issues
                const { getCurrentProfile } = await import("@/lib/auth");
                const { supabase } = await import("@/lib/supabase");

                // Get current user from Auth
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (authUser) {
                    // Try to get profile from DB
                    const profile = await getCurrentProfile();

                    if (profile) {
                        setUser({
                            name: profile.name || authUser.user_metadata.full_name || authUser.email?.split('@')[0] || "Хэрэглэгч",
                            phone: profile.phone || "",
                            isVerified: profile.is_verified || false,
                            isSubscribed: profile.subscription_tier !== 'start',
                            subscriptionEnds: profile.subscription_expires_at || "",
                            image: profile.avatar_url || authUser.user_metadata.avatar_url || authUser.user_metadata.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`
                        });

                        // Save to localStorage for other components
                        localStorage.setItem("userProfile", JSON.stringify({
                            name: profile.name || authUser.user_metadata.full_name,
                            phone: profile.phone,
                            avatar: profile.avatar_url || authUser.user_metadata.avatar_url
                        }));
                    } else {
                        // Fallback to Auth metadata if profile doesn't exist yet
                        setUser({
                            name: authUser.user_metadata.full_name || authUser.email?.split('@')[0] || "Хэрэглэгч",
                            phone: "",
                            isVerified: false,
                            isSubscribed: false,
                            subscriptionEnds: "",
                            image: authUser.user_metadata.avatar_url || authUser.user_metadata.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`
                        });
                    }
                } else {
                    // Fallback to localStorage if not logged in (legacy)
                    const savedProfile = localStorage.getItem("userProfile");
                    if (savedProfile) {
                        const { name, phone, avatar } = JSON.parse(savedProfile);
                        setUser(prev => ({
                            ...prev,
                            name: name || prev.name,
                            phone: phone || prev.phone,
                            image: avatar || prev.image
                        }));
                    }
                }
            } catch (error) {
                console.error("Error loading profile:", error);
            }

            // Load counts
            const myAds = JSON.parse(localStorage.getItem("my_ads") || "[]");
            const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
            setCounts({
                myProducts: myAds.length,
                favorites: favorites.length
            });

            // Load user role
            const savedRole = localStorage.getItem("userRole") as 'buyer' | 'producer' | 'admin' | null;
            setUserRole(savedRole || 'buyer');

            // Load subscription using utility
            const subInfo = getUserSubscription();
            setSubscriptionInfo(subInfo);
            setAdLimitInfo(canPostMoreAds());

            // Legacy - raw subscription data
            const savedSub = localStorage.getItem("userSubscription");
            if (savedSub) {
                try {
                    const parsed = JSON.parse(savedSub);
                    if (parsed.paid && new Date(parsed.endDate) > new Date()) {
                        setSubscription(parsed);
                    } else {
                        setSubscription(null);
                    }
                } catch (e) {
                    console.error("Subscription parse error:", e);
                }
            }
        };

        loadProfile();
        window.addEventListener("profileUpdated", loadProfile);
        window.addEventListener("storage", loadProfile);
        window.addEventListener("adsUpdated", loadProfile);
        window.addEventListener("favoritesUpdated", loadProfile);
        window.addEventListener("roleUpdated", loadProfile);

        return () => {
            window.removeEventListener("profileUpdated", loadProfile);
            window.removeEventListener("storage", loadProfile);
            window.removeEventListener("adsUpdated", loadProfile);
            window.removeEventListener("favoritesUpdated", loadProfile);
            window.removeEventListener("roleUpdated", loadProfile);
        };
    }, []);

    const handleLogout = async () => {
        try {
            const { signOut } = await import("@/lib/auth");
            await signOut();

            // Clear local storage
            localStorage.removeItem("userProfile");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userSubscription");

            // Redirect to login
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const menuItems = [
        ...(userRole === 'admin' ? [
            {
                icon: ShieldCheck,
                label: "Админ самбар",
                href: "/admin"
            },
            {
                icon: Flag,
                label: "🛡️ Модерац / Report",
                href: "/admin/moderation"
            }
        ] : []),
        {
            icon: Sparkles,
            label: "Борлуулагч болох",
            href: "/dashboard/upgrade"
        },
        {
            icon: Package,
            label: "Миний бүтээгдэхүүнүүд",
            href: "/my-ads",
            count: counts.myProducts
        },
        {
            icon: Heart,
            label: "Хадгалсан",
            href: "/favorites",
            count: counts.favorites
        },
        {
            icon: Settings,
            label: "Тохиргоо",
            href: "/settings"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Top Header with Back Button - Mobile Only */}
            <div className="absolute top-4 left-4 z-30 md:hidden">
                <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-secondary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
            </div>

            {/* Desktop Back Link */}
            <div className="hidden md:block absolute top-6 left-6 z-30">
                <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-secondary transition-colors font-medium">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Буцах</span>
                </Link>
            </div>

            {/* Header Section with User Info */}
            <div className="bg-gradient-to-br from-primary via-yellow-400 to-yellow-500 px-4 pt-12 pb-12 md:pt-16">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col items-center text-center">
                        {/* Avatar */}
                        <div className="relative mb-4">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                                {user.image && user.image.startsWith('http') ? (
                                    <Image
                                        src={user.image}
                                        alt={user.name}
                                        width={96}
                                        height={96}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold">
                                        {user.name ? user.name[0]?.toUpperCase() : 'З'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User Info */}
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">
                            {user.name || "Зочин"}
                        </h1>
                        <p className="text-gray-700 font-medium mb-3">
                            {user.phone || "Бүртгэлгүй хэрэглэгч"}
                        </p>

                        {/* Status Badge */}
                        {userRole === 'producer' ? (
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500 text-white shadow-sm">
                                <span className="text-xs font-bold">✅ Баталгаажсан үйлдвэрлэгч</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/30 backdrop-blur-sm text-gray-900 border border-white/40 shadow-sm">
                                <span className="text-xs font-bold">
                                    {user.phone ? "🛍️ Худалдан авагч" : "👤 Зочин"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Menu List */}
            <div className="max-w-4xl mx-auto px-4 -mt-6">
                {/* Subscription Status */}
                {subscription ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mb-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xl">✓</span>
                                </div>
                                <div>
                                    <p className="font-bold text-green-900">🎉 {subscription.plan} багцтай</p>
                                    <p className="text-sm text-green-700">
                                        {new Date(subscription.endDate).toLocaleDateString('mn-MN')} хүртэл
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-gray-900">🆓 ЭХЛЭЛ багцтай</p>
                                <p className="text-sm text-gray-600">3 зарын хязгаартай · 7 хоног</p>
                            </div>
                            <Link href="/dashboard/upgrade" className="px-4 py-2 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors text-sm">
                                Сайжруулах
                            </Link>
                        </div>
                    </div>
                )}

                {/* Quick Stats for Paid Users */}
                {subscriptionInfo && subscriptionInfo.isPaid && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                            <Package className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-gray-900">{adLimitInfo?.remaining || 0}/{adLimitInfo?.limit || 0}</p>
                            <p className="text-xs text-gray-500">Үлдсэн зар</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                            <Clock className="w-5 h-5 text-green-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-gray-900">{subscriptionInfo.daysLeft}</p>
                            <p className="text-xs text-gray-500">Хоног үлдсэн</p>
                        </div>
                        <Link href="/dashboard/stats" className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center hover:bg-gray-50">
                            <BarChart3 className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-gray-900">📊</p>
                            <p className="text-xs text-gray-500">Статистик</p>
                        </Link>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {menuItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <item.icon className="w-5 h-5 text-gray-600" />
                                </div>
                                <span className="font-medium text-gray-900">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.count !== undefined && (
                                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                        {item.count}
                                    </span>
                                )}
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Auth Actions */}
                {user.phone ? (
                    <button
                        onClick={handleLogout}
                        className="w-full mt-6 mb-4 flex items-center justify-center gap-3 px-4 py-4 bg-white rounded-2xl shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors border border-gray-100"
                    >
                        <LogOut className="w-5 h-5 text-red-500" />
                        <span className="font-bold text-red-500">Гарах</span>
                    </button>
                ) : (
                    <div className="grid grid-cols-2 gap-3 mt-6 mb-4">
                        <Link
                            href="/login"
                            className="flex items-center justify-center px-4 py-4 bg-white rounded-2xl shadow-sm hover:bg-gray-50 transition-colors border border-gray-100 font-bold text-gray-900"
                        >
                            Нэвтрэх
                        </Link>
                        <Link
                            href="/signup"
                            className="flex items-center justify-center px-4 py-4 bg-primary text-secondary rounded-2xl shadow-sm hover:bg-yellow-400 transition-colors font-bold"
                        >
                            Бүртгүүлэх
                        </Link>
                    </div>
                )}
            </div>

            {/* Help Tooltip Modal */}
            {showTooltip && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTooltip(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="font-bold text-lg text-gray-900">Зөвлөгөө</h3>
                            <button onClick={() => setShowTooltip(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Зурагны хэмжээ: <strong>500x500px</strong> байвал тохиромжтой. Та өөрийн лого эсвэл бодит зургаа оруулна уу.
                        </p>
                        <button
                            onClick={() => setShowTooltip(false)}
                            className="w-full mt-4 py-2 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors"
                        >
                            Ойлголоо
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
