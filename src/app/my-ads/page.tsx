"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Edit, Trash2, Package, TrendingUp, ShieldCheck, Clock, AlertTriangle, Loader2 } from "lucide-react";
import TierUpgradeNotification from "@/components/TierUpgradeNotification";
import { getTierUpgradeRequirement, TierUpgradeRequirement, VerificationStatus } from "@/lib/verificationSystem";
import { getDaysUntilExpiration } from "@/lib/subscription";
import { ProductGridSkeleton } from "@/components/Skeleton";

export default function MyAdsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);

    // Verification System State
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeRequirement, setUpgradeRequirement] = useState<TierUpgradeRequirement | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
        level: 'none',
        isVerified: false
    });

    // Load ads from Supabase
    useEffect(() => {
        const loadAds = async () => {
            try {
                const { supabase } = await import("@/lib/supabase");
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setIsLoggedIn(false);
                    setIsLoading(false);
                    return;
                }

                setIsLoggedIn(true);

                // Get user's products from Supabase
                const { getUserProducts } = await import("@/lib/products");
                const { data, error } = await getUserProducts();

                if (!error && data) {
                    // Transform to component format
                    const transformedProducts = data.map((p: any) => ({
                        id: p.id,
                        title: p.title,
                        price: p.price,
                        currency: p.currency || '₮',
                        location: p.location,
                        image: p.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
                        images: p.images || [],
                        category: p.category,
                        description: p.description,
                        tier: p.tier || 'soum',
                        views: p.views || 0,
                        saves: p.saves || 0,
                        callClicks: p.call_clicks || 0,
                        chatClicks: p.chat_clicks || 0,
                        createdAt: p.created_at,
                        subscriptionTier: p.tier || 'free',
                        status: p.status,
                    }));
                    setProducts(transformedProducts);
                }

                // Check for tier upgrades
                const hasSeenUpgrade = localStorage.getItem('has_seen_aimag_upgrade');
                if (!hasSeenUpgrade && data && data.length > 0) {
                    const mockCurrentTier = 'soum';
                    const mockNextTier = 'aimag';
                    const requirement = getTierUpgradeRequirement(mockCurrentTier, mockNextTier);
                    if (requirement.message) {
                        setUpgradeRequirement(requirement);
                        setShowUpgradeModal(true);
                    }
                }
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Error loading ads:', err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadAds();

        // Listen for updates
        window.addEventListener('adsUpdated', loadAds);
        return () => window.removeEventListener('adsUpdated', loadAds);
    }, []);

    const handleDeleteClick = (productId: string) => {
        setProductToDelete(productId);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;

        setIsDeleting(true);
        try {
            const { deleteProduct } = await import("@/lib/products");
            const { error } = await deleteProduct(productToDelete);

            if (!error) {
                setProducts(prev => prev.filter(p => p.id !== productToDelete));
                window.dispatchEvent(new Event('adsUpdated'));
            } else {
                alert('Устгахад алдаа гарлаа: ' + error);
            }
        } catch (err) {
            alert('Устгахад алдаа гарлаа');
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
            setProductToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteDialog(false);
        setProductToDelete(null);
    };

    const handleUpgradeVerify = () => {
        setVerificationStatus({
            level: 'id_card',
            isVerified: false
        });
        localStorage.setItem('has_seen_aimag_upgrade', 'true');
    };

    const handleUpgradeSkip = () => {
        localStorage.setItem('has_seen_aimag_upgrade', 'true');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                    <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-900" />
                    </Link>
                    <h1 className="font-bold text-lg">Миний бүтээгдэхүүнүүд</h1>
                </div>
                <div className="p-4">
                    <ProductGridSkeleton count={4} />
                </div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                    <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-900" />
                    </Link>
                    <h1 className="font-bold text-lg">Миний бүтээгдэхүүнүүд</h1>
                </div>
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Package className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">Нэвтрэх шаардлагатай</h3>
                    <p className="text-sm text-gray-500 mb-6">Өөрийн бүтээгдэхүүнүүдээ харахын тулд нэвтэрнэ үү.</p>
                    <Link href="/login" className="px-6 py-2.5 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors">
                        Нэвтрэх
                    </Link>
                </div>
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
                <h1 className="font-bold text-lg">Миний бүтээгдэхүүнүүд</h1>
                {products.length > 0 && (
                    <span className="ml-auto text-sm text-gray-500">{products.length} бүтээгдэхүүн</span>
                )}
            </div>

            {/* Growth Status Card */}
            <div className="p-4 pb-0">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-1">Одоогийн түвшин</p>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    Сумын түвшин
                                    {verificationStatus.isVerified && <ShieldCheck className="w-5 h-5 text-green-400" />}
                                </h2>
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                            <p className="text-sm font-medium mb-2">Дараагийн түвшин: <strong>Аймгийн түвшин</strong></p>
                            <div className="w-full bg-black/20 rounded-full h-2 mb-1">
                                <div className="bg-green-400 h-2 rounded-full w-[80%]"></div>
                            </div>
                            <p className="text-xs text-blue-200 text-right">80% биелсэн</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products List */}
            <div className="p-4">
                {products.length > 0 ? (
                    <div className="space-y-3">
                        {products.map((product) => {
                            const daysLeft = product.createdAt
                                ? getDaysUntilExpiration(product.createdAt, product.subscriptionTier)
                                : 999;
                            const expired = daysLeft <= 0;
                            const expiringSoon = daysLeft > 0 && daysLeft <= 3;

                            return (
                                <div
                                    key={product.id}
                                    className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${expired ? 'border-red-200 opacity-60' : 'border-gray-100'
                                        }`}
                                >
                                    {/* Expiration Warning Banner */}
                                    {expired && (
                                        <div className="bg-red-500 text-white px-3 py-1.5 text-xs font-bold flex items-center gap-2">
                                            <AlertTriangle className="w-3 h-3" />
                                            Хугацаа дууссан - Энэ зар харагдахгүй
                                        </div>
                                    )}
                                    {expiringSoon && (
                                        <div className="bg-yellow-500 text-white px-3 py-1.5 text-xs font-bold flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            {daysLeft === 1 ? 'Маргааш дуусна!' : `${daysLeft} хоногийн дараа дуусна`}
                                        </div>
                                    )}

                                    <div className="flex gap-3 p-3">
                                        {/* Image */}
                                        <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                                            <Image
                                                src={product.image}
                                                alt={product.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">
                                                {product.title}
                                            </h3>
                                            <p className="text-lg font-bold text-primary mb-1">
                                                {product.currency}{product.price.toLocaleString()}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>👁️ {product.views || 0}</span>
                                                <span>❤️ {product.saves || 0}</span>
                                                {!expired && daysLeft < 999 && (
                                                    <span className={`flex items-center gap-1 ${expiringSoon ? 'text-yellow-600' : 'text-gray-400'}`}>
                                                        <Clock className="w-3 h-3" />
                                                        {daysLeft}д
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2">
                                            <Link
                                                href={`/dashboard/post?id=${product.id}`}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteClick(product.id)}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Engagement Stats Bar */}
                                    <div className="bg-gray-50 px-3 py-2 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-600">Хандалт (Engagement Score)</span>
                                        <span className="text-sm font-bold text-primary">
                                            {(product.views || 0) * 1 + (product.saves || 0) * 3 + ((product.callClicks || 0) + (product.chatClicks || 0)) * 10}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Package className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">Танд одоогоор нийтэлсэн бүтээгдэхүүн алга</h3>
                        <p className="text-sm text-gray-500 mb-6">Эхний бүтээгдэхүүнээ оруулж эхлээрэй</p>
                        <Link
                            href="/dashboard/post"
                            className="px-6 py-3 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors"
                        >
                            Бүтээгдэхүүн оруулах
                        </Link>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">Бүтээгдэхүүн устгах</h3>
                        <p className="text-gray-600 mb-6">
                            Та энэ бүтээгдэхүүнийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Болих
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Устгах
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tier Upgrade Notification Modal */}
            {upgradeRequirement && (
                <TierUpgradeNotification
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    requirement={upgradeRequirement}
                    onVerify={handleUpgradeVerify}
                    onSkip={handleUpgradeSkip}
                />
            )}
        </div>
    );
}
