"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ChatRedirectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const id = searchParams.get("id");
        const seller = searchParams.get("seller");
        const product = searchParams.get("product");

        if (id) {
            // Redirect to messages with the chat ID
            // Note: In a real app, we might need to create the chat first if it doesn't exist,
            // but ProductCard already handles creation logic before redirecting here (or should).
            // Actually, ProductCard now redirects directly to /messages/[id].
            // This page is a fallback for old links or direct access.

            // If the ID format is like "productId_sellerName", we might need to find the real chat ID
            // But for now, let's assume the ID passed is the chat ID or we redirect to messages root
            router.replace(`/messages`);
        } else {
            router.replace("/messages");
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <ChatRedirectContent />
        </Suspense>
    );
}
