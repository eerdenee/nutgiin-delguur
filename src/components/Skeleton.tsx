"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular" | "rounded";
    width?: string | number;
    height?: string | number;
    animation?: "pulse" | "wave" | "none";
}

/**
 * Skeleton loading component
 */
export function Skeleton({
    className,
    variant = "rectangular",
    width,
    height,
    animation = "pulse",
}: SkeletonProps) {
    const baseStyles = "bg-gray-200";

    const animationStyles = {
        pulse: "animate-pulse",
        wave: "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]",
        none: "",
    };

    const variantStyles = {
        text: "rounded",
        circular: "rounded-full",
        rectangular: "",
        rounded: "rounded-lg",
    };

    return (
        <div
            className={cn(
                baseStyles,
                animationStyles[animation],
                variantStyles[variant],
                className
            )}
            style={{
                width: width,
                height: height,
            }}
        />
    );
}

/**
 * Product Card Skeleton
 */
export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
            {/* Image */}
            <Skeleton className="w-full h-48" />

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <Skeleton className="h-5 w-3/4 rounded" />

                {/* Price */}
                <Skeleton className="h-6 w-1/2 rounded" />

                {/* Location */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded" />
                </div>

                {/* Stats */}
                <div className="flex gap-4 pt-2">
                    <Skeleton className="h-4 w-12 rounded" />
                    <Skeleton className="h-4 w-12 rounded" />
                </div>
            </div>
        </div>
    );
}

/**
 * Product Grid Skeleton (multiple cards)
 */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

/**
 * Profile Skeleton
 */
export function ProfileSkeleton() {
    return (
        <div className="flex items-center gap-4">
            <Skeleton variant="circular" className="w-12 h-12" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
            </div>
        </div>
    );
}

/**
 * Message List Skeleton
 */
export function MessageListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <Skeleton variant="circular" className="w-10 h-10" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3 rounded" />
                        <Skeleton className="h-3 w-2/3 rounded" />
                    </div>
                    <Skeleton className="h-3 w-12 rounded" />
                </div>
            ))}
        </div>
    );
}

/**
 * Stats Card Skeleton
 */
export function StatsCardSkeleton() {
    return (
        <div className="bg-white rounded-xl p-4 space-y-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
        </div>
    );
}

/**
 * Form Skeleton
 */
export function FormSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                </div>
            ))}
            <Skeleton className="h-12 w-full rounded-lg" />
        </div>
    );
}

export default Skeleton;
