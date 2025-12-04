"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Home, LayoutDashboard, User, LogOut, Phone } from "lucide-react";

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        name: string;
        phone: string;
        image?: string;
        isSubscribed?: boolean;
    } | null;
}

export default function SideMenu({ isOpen, onClose, user }: SideMenuProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Prevent scrolling on body
            document.body.style.overflow = "hidden";
            // Optional: Add padding to prevent layout shift if scrollbar disappears
            // document.body.style.paddingRight = "15px"; 
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            // Restore scrolling
            document.body.style.overflow = "unset";
            // document.body.style.paddingRight = "0px";
            return () => clearTimeout(timer);
        }

        // Cleanup function to ensure scrolling is restored if component unmounts
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
                    }`}
                onClick={onClose}
            />

            {/* Menu Drawer */}
            <div
                className={`relative w-3/4 max-w-[280px] bg-white h-full shadow-xl transform transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="p-5 border-b flex items-center justify-between bg-primary relative overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-12 h-12 bg-secondary text-white rounded-full flex items-center justify-center font-bold border-2 border-white/20 overflow-hidden">
                            {user?.image ? (
                                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                user ? user.name[0].toUpperCase() : <User className="w-6 h-6" />
                            )}
                        </div>
                        <div className="text-secondary">
                            <h3 className="font-bold text-lg leading-tight">
                                {user ? user.name : "Зочин"}
                            </h3>
                            {user && (
                                <div className="flex flex-col">
                                    <p className="text-xs opacity-80 mb-0.5">
                                        {user.phone}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className={`w-2 h-2 rounded-full ${user.isSubscribed ? "bg-green-500" : "bg-red-500"}`} />
                                        <span className="text-[10px] font-medium text-secondary/80">
                                            {user.isSubscribed ? "Идэвхтэй" : "Эрх дууссан"}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {!user && <p className="text-xs opacity-80">Нэвтрээгүй байна</p>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-black/10 rounded-full text-secondary hover:bg-black/20 transition-colors relative z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Links */}
                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="space-y-1 px-2">
                        <Link
                            href="/"
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                        >
                            <Home className="w-5 h-5 text-gray-400" />
                            Нүүр хуудас
                        </Link>

                        {user && (
                            <>
                                <Link
                                    href="/dashboard"
                                    onClick={onClose}
                                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                                >
                                    <LayoutDashboard className="w-5 h-5 text-gray-400" />
                                    Миний булан
                                </Link>
                                <Link
                                    href="/dashboard/post"
                                    onClick={onClose}
                                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                                >
                                    <Phone className="w-5 h-5 text-gray-400" />
                                    Зар оруулах
                                </Link>
                            </>
                        )}

                        {!user && (
                            <Link
                                href="/login"
                                onClick={onClose}
                                className="flex items-center gap-3 px-4 py-3 text-primary font-bold hover:bg-yellow-50 rounded-xl transition-colors"
                            >
                                <User className="w-5 h-5" />
                                Нэвтрэх
                            </Link>
                        )}
                    </nav>
                </div>

                {/* Footer */}
                {user && (
                    <div className="p-4 border-t">
                        <button
                            onClick={() => {
                                // Implement logout logic here
                                onClose();
                            }}
                            className="flex items-center gap-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
                        >
                            <LogOut className="w-5 h-5" />
                            Гарах
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
