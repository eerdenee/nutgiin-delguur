"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Heart, Phone, MessageCircle, Share2, TrendingUp, Crown, Clock, Package } from "lucide-react";
import { getUserSubscription, getDaysUntilExpiration, canPostMoreAds } from "@/lib/subscription";

interface AdStats {
    id: string;
    title: string;
    image: string;
    createdAt: string;
    subscriptionTier?: string;
    views: number;
    saves: number;
    callClicks: number;
    chatClicks: number;
    shares: number;
}

export default function StatsPage() {
    const [ads, setAds] = useState<AdStats[]>([]);
    const [subscription, setSubscription] = useState<ReturnType<typeof getUserSubscription> | null>(null);
    const [adLimitInfo, setAdLimitInfo] = useState<ReturnType<typeof canPostMoreAds> | null>(null);
    const [totalStats, setTotalStats] = useState({ views: 0, saves: 0, callClicks: 0, chatClicks: 0, shares: 0 });

    useEffect(() => {
        setSubscription(getUserSubscription());
        setAdLimitInfo(canPostMoreAds());

        const myAds = JSON.parse(localStorage.getItem('my_ads') || '[]');
        setAds(myAds);

        const totals = myAds.reduce((acc: typeof totalStats, ad: AdStats) => ({
            views: acc.views + (ad.views || 0),
            saves: acc.saves + (ad.saves || 0),
            callClicks: acc.callClicks + (ad.callClicks || 0),
            chatClicks: acc.chatClicks + (ad.chatClicks || 0),
            shares: acc.shares + (ad.shares || 0)
        }), { views: 0, saves: 0, callClicks: 0, chatClicks: 0, shares: 0 });

        setTotalStats(totals);
    }, []);

    const statCards = [
        { label: "Нийт үзэлт", value: totalStats.views, icon: Eye, color: "text-blue-500", bg: "bg-blue-50" },
        { label: "Хадгалсан", value: totalStats.saves, icon: Heart, color: "text-pink-500", bg: "bg-pink-50" },
        { label: "Залгасан", value: totalStats.callClicks, icon: Phone, color: "text-green-500", bg: "bg-green-50" },
        { label: "Чат", value: totalStats.chatClicks, icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-50" },
        { label: "Хуваалцсан", value: totalStats.shares, icon: Share2, color: "text-orange-500", bg: "bg-orange-50" },
    ];

    // Check permission
    if (!subscription?.plan.features.statistics) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                    <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="font-bold text-lg">Статистик</h1>
                </div>
                <div className="max-w-md mx-auto px-4 py-12 text-center">
                    <div className="bg-white rounded-2xl p-8 shadow-sm">
                        <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Статистик харах эрхгүй</h2>
                        <p className="text-gray-600 mb-6">ИДЭВХТЭЙ эсвэл БИЗНЕС багц руу шилжинэ үү.</p>
                        <Link href="/dashboard/upgrade" className="inline-block px-6 py-3 bg-primary text-secondary font-bold rounded-xl">
                            Багц сайжруулах
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="font-bold text-lg">📊 Статистик</h1>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Subscription Info */}
                <div className={`rounded-2xl p-4 ${subscription.plan.id === 'business'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                    : 'bg-gradient-to-r from-primary to-yellow-400'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-80">Багц</p>
                            <p className="text-xl font-bold">{subscription.plan.name}</p>
                        </div>
                        {adLimitInfo && (
                            <div className="text-right">
                                <p className="text-sm opacity-80">Үлдсэн зар</p>
                                <p className="text-xl font-bold">{adLimitInfo.remaining}/{adLimitInfo.limit}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Total Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {statCards.map((stat, i) => (
                        <div key={i} className={`${stat.bg} rounded-xl p-4 text-center`}>
                            <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-xs text-gray-600">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Ads List with Stats */}
                <div className="bg-white rounded-2xl shadow-sm p-4">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Зар бүрийн статистик
                    </h2>

                    {ads.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Танд зар байхгүй байна</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {ads.map((ad) => {
                                const daysLeft = getDaysUntilExpiration(ad.createdAt, ad.subscriptionTier);
                                const isExpiring = daysLeft <= 3;

                                return (
                                    <div key={ad.id} className="border border-gray-100 rounded-xl p-4">
                                        <div className="flex gap-4">
                                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                                                <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 mb-1">{ad.title}</h3>
                                                <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isExpiring ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    <Clock className="w-3 h-3" />
                                                    {daysLeft === 0 ? 'Өнөөдөр дуусна' : `${daysLeft} хоног үлдсэн`}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-gray-100">
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-gray-900">{ad.views || 0}</p>
                                                <p className="text-xs text-gray-500">Үзэлт</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-gray-900">{ad.saves || 0}</p>
                                                <p className="text-xs text-gray-500">Хадгалсан</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-gray-900">{ad.callClicks || 0}</p>
                                                <p className="text-xs text-gray-500">Дуудлага</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-gray-900">{ad.chatClicks || 0}</p>
                                                <p className="text-xs text-gray-500">Чат</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-gray-900">{ad.shares || 0}</p>
                                                <p className="text-xs text-gray-500">Хуваалц</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
