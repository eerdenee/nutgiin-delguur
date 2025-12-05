"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeleton";

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const loadFavorites = async () => {
            try {
                const { supabase } = await import("@/lib/supabase");
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setIsLoggedIn(false);
                    setIsLoading(false);
                    return;
                }

                setIsLoggedIn(true);

                // Get favorites from Supabase
                const { getUserFavorites } = await import("@/lib/products");
                const { data, error } = await getUserFavorites();

                if (!error && data) {
                    // Transform to ProductCard format
                    const transformedFavorites = data.map((p: any) => ({
                        id: p.id,
                        title: p.title,
                        price: p.price,
                        currency: p.currency || '₮',
                        location: p.location,
                        image: p.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
                        images: p.images || [],
                        category: p.category,
                        seller: {
                            name: p.seller?.name || 'Борлуулагч',
                            phone: p.seller?.phone || '',
                            isVerified: p.seller?.is_verified || false,
                            image: p.seller?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.user_id,
                        },
                        createdAt: p.created_at,
                        description: p.description,
                        tier: p.tier || 'soum',
                        views: p.views || 0,
                        saves: p.saves || 0,
                    }));
                    setFavorites(transformedFavorites);
                }
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Error loading favorites:', err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadFavorites();

        // Listen for updates
        window.addEventListener("favoritesUpdated", loadFavorites);
        return () => window.removeEventListener("favoritesUpdated", loadFavorites);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                    <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-900" />
                    </Link>
                    <h1 className="font-bold text-lg">Хадгалсан бүтээгдэхүүнүүд</h1>
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
                    <h1 className="font-bold text-lg">Хадгалсан бүтээгдэхүүнүүд</h1>
                </div>
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Heart className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">Нэвтрэх шаардлагатай</h3>
                    <p className="text-sm text-gray-500 mb-6">Хадгалсан бүтээгдэхүүнээ харахын тулд нэвтэрнэ үү.</p>
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
                <h1 className="font-bold text-lg">Хадгалсан бүтээгдэхүүнүүд</h1>
                {favorites.length > 0 && (
                    <span className="ml-auto text-sm text-gray-500">{favorites.length} бүтээгдэхүүн</span>
                )}
            </div>

            <div className="p-4">
                {favorites.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        {favorites.map((product) => (
                            <ProductCard key={product.id} {...product} isCompact={true} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Heart className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">Хадгалсан бүтээгдэхүүн алга</h3>
                        <p className="text-sm text-gray-500 mb-6">Та таалагдсан бүтээгдэхүүнээ зүрхэн дээр дарж хадгалаарай.</p>
                        <Link href="/" className="px-6 py-2.5 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors">
                            Бүтээгдэхүүн харах
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
