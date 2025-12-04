"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { MOCK_PRODUCTS } from "@/lib/data";

export default function FavoritesPage() {
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadFavorites = () => {
            const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
            setFavoriteIds(saved);
            setIsLoading(false);
        };

        loadFavorites();
        window.addEventListener("favoritesUpdated", loadFavorites);
        return () => window.removeEventListener("favoritesUpdated", loadFavorites);
    }, []);

    const favoriteProducts = MOCK_PRODUCTS.filter(p => favoriteIds.includes(p.id));

    if (isLoading) {
        return <div className="min-h-screen bg-gray-50" />;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </Link>
                <h1 className="font-bold text-lg">Хадгалсан бүтээгдэхүүнүүд</h1>
            </div>

            <div className="p-4">
                {favoriteProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        {favoriteProducts.map((product) => (
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
