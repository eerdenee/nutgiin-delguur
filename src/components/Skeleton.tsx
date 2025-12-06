"use client";

import React from "react";

interface SkeletonProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular" | "rounded";
    width?: string | number;
    height?: string | number;
    animation?: "pulse" | "wave" | "none";
}

// Named export for { Skeleton } import
export function Skeleton({
    className = "",
    variant = "text",
    width,
    height,
    animation = "pulse",
}: SkeletonProps) {
    const baseStyles = "bg-[var(--card-border)]";

    const animationStyles = {
        pulse: "animate-pulse",
        wave: "animate-shimmer",
        none: "",
    };

    const variantStyles = {
        text: "rounded",
        circular: "rounded-full",
        rectangular: "",
        rounded: "rounded-xl",
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === "number" ? `${width}px` : width;
    if (height) style.height = typeof height === "number" ? `${height}px` : height;

    return (
        <div
            className={`${baseStyles} ${animationStyles[animation]} ${variantStyles[variant]} ${className}`}
            style={style}
            role="status"
            aria-label="Уншиж байна..."
        />
    );
}

// Default export for backward compatibility
export default Skeleton;

// ===== COMPOUND SKELETONS =====

export function ProductCardSkeleton({ isCompact = false }: { isCompact?: boolean }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <Skeleton
                variant="rectangular"
                className={isCompact ? "aspect-square" : "aspect-[4/3]"}
            />
            <div className={isCompact ? "p-2" : "p-3"}>
                <div className="flex items-center gap-2 mb-2">
                    <Skeleton variant="circular" width={isCompact ? 20 : 24} height={isCompact ? 20 : 24} />
                    <Skeleton variant="text" width={80} height={12} />
                </div>
                <Skeleton variant="text" className="mb-1" height={isCompact ? 14 : 16} />
                <Skeleton variant="text" width="60%" height={isCompact ? 14 : 16} />
                <Skeleton variant="text" width={100} height={isCompact ? 18 : 24} className="mt-2" />
                <div className="mt-3 grid grid-cols-2 gap-2">
                    <Skeleton variant="rounded" height={isCompact ? 30 : 36} />
                    <Skeleton variant="rounded" height={isCompact ? 30 : 36} />
                </div>
            </div>
        </div>
    );
}

export function ProductGridSkeleton({ count = 8, isCompact = true }: { count?: number; isCompact?: boolean }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} isCompact={isCompact} />
            ))}
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-gradient-to-br from-primary via-yellow-400 to-yellow-500 px-4 pt-12 pb-12 md:pt-16">
                <div className="max-w-4xl mx-auto flex flex-col items-center">
                    <Skeleton variant="circular" width={96} height={96} className="mb-4" />
                    <Skeleton variant="text" width={150} height={28} className="mb-2" />
                    <Skeleton variant="text" width={100} height={16} />
                </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 -mt-6">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-4 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center gap-3">
                                <Skeleton variant="circular" width={40} height={40} />
                                <Skeleton variant="text" width={120} height={18} />
                            </div>
                            <Skeleton variant="circular" width={20} height={20} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function ChatListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="divide-y divide-gray-100">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                    <Skeleton variant="circular" width={48} height={48} />
                    <div className="flex-1">
                        <Skeleton variant="text" width="70%" height={16} className="mb-2" />
                        <Skeleton variant="text" width="40%" height={14} />
                    </div>
                    <Skeleton variant="text" width={40} height={12} />
                </div>
            ))}
        </div>
    );
}

// Alias for MessageListSkeleton
export const MessageListSkeleton = ChatListSkeleton;
