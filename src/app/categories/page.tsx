"use client";

import Link from "next/link";
import {
    ArrowLeft, Package, Milk, Beef, Cherry, Croissant, Wine, Shirt, Footprints,
    Scissors, Home, Gem, Leaf, Dog, Box, Truck
} from "lucide-react";
import { CATEGORIES } from "@/lib/data";

const iconMap: Record<string, any> = {
    Package,
    Milk,
    Beef,
    Cherry,
    Croissant,
    Wine,
    Shirt,
    Footprints,
    Scissors,
    Home,
    Gem,
    Leaf,
    Dog,
    Box,
    Truck
};

export default function CategoriesPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </Link>
                <h1 className="font-bold text-lg">Бүх ангилал</h1>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4">
                {CATEGORIES.map((cat) => {
                    const Icon = iconMap[cat.icon] || Package;
                    return (
                        <Link
                            href={`/?category=${cat.id}`}
                            key={cat.id}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95"
                        >
                            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-700">
                                <Icon className="w-8 h-8" />
                            </div>
                            <span className="font-bold text-gray-900 text-center">{cat.name}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
