"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, PlusCircle, Heart, User } from "lucide-react";

export default function BottomNav() {
    const pathname = usePathname();

    // Hide bottom nav on specific routes if needed (e.g. login, post ad)
    if (pathname === "/login" || pathname === "/signup" || pathname === "/dashboard/post") return null;

    const isActive = (path: string) => pathname === path;

    return (
        <nav
            role="navigation"
            aria-label="Үндсэн навигаци"
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 pb-safe z-50 md:hidden"
        >
            <div className="flex items-end justify-around">
                <Link href="/" className={`flex flex-col items-center justify-center gap-0.5 ${isActive("/") ? "text-primary-dark" : "text-gray-400"}`}>
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Нүүр</span>
                </Link>

                <Link href="/messages" className={`flex flex-col items-center justify-center gap-0.5 ${isActive("/messages") ? "text-primary-dark" : "text-gray-400"}`}>
                    <MessageCircle className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Чат</span>
                </Link>

                <Link href="/dashboard/post" className="flex flex-col items-center justify-center -mt-6">
                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 border-white text-secondary mb-1">
                        <PlusCircle className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-600">Бүтээгдэхүүн нэмэх</span>
                </Link>

                <Link href="/favorites" className={`flex flex-col items-center justify-center gap-0.5 ${isActive("/favorites") ? "text-primary-dark" : "text-gray-400"}`}>
                    <Heart className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Хадгалсан</span>
                </Link>

                <Link href="/dashboard" className={`flex flex-col items-center justify-center gap-0.5 ${isActive("/dashboard") ? "text-primary-dark" : "text-gray-400"}`}>
                    <User className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Профайл</span>
                </Link>
            </div>
        </nav>
    );
}
