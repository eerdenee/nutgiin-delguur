"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/data";
import {
    Milk, Beef, Cherry, Croissant, Wine, Shirt, Footprints,
    Scissors, Home, Gem, Leaf, Dog, Box, Truck, Package
} from "lucide-react";

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

interface CategoryNavProps {
    selectedCategory?: string;
    onSelect?: (categoryId: string) => void;
}

export default function CategoryNav({ selectedCategory, onSelect }: CategoryNavProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const displayedCategories = isExpanded ? CATEGORIES : CATEGORIES.slice(0, 8);

    return (
        <div className="px-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-gray-900">Төрөл</h2>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-sm font-medium text-gray-500 hover:text-primary transition-colors"
                >
                    {isExpanded ? "Хураах" : "Бүгдийг харах"}
                </button>
            </div>
            <div className="grid grid-cols-4 gap-x-2 gap-y-6">
                {displayedCategories.map((cat) => {
                    const Icon = iconMap[cat.icon] || Package;
                    const isSelected = selectedCategory === cat.id;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => onSelect?.(cat.id)}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${isSelected
                                ? "bg-primary border-primary"
                                : "bg-yellow-50 border-yellow-100 group-hover:bg-primary group-hover:border-primary"
                                }`}>
                                <Icon className={`w-5 h-5 transition-colors ${isSelected ? "text-black" : "text-yellow-700 group-hover:text-black"
                                    }`} />
                            </div>
                            <span className={`text-[10px] text-center font-medium transition-colors leading-tight min-h-[2.5em] flex items-start justify-center ${isSelected ? "text-black font-bold" : "text-gray-700 group-hover:text-black"
                                }`}>
                                {cat.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
