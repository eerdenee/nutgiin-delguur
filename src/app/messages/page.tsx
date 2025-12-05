"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { MessageListSkeleton } from "@/components/Skeleton";

interface Conversation {
    id: string;
    participant_id: string;
    participant_name: string;
    participant_avatar: string;
    product_id: string | null;
    product_title: string | null;
    product_image: string | null;
    last_message: string;
    last_message_at: string;
    unread_count: number;
}

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const loadConversations = async () => {
            try {
                const { supabase } = await import("@/lib/supabase");
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setIsLoggedIn(false);
                    setIsLoading(false);
                    return;
                }

                setIsLoggedIn(true);

                const { getConversations } = await import("@/lib/messages");
                const { data, error } = await getConversations();

                if (!error && data) {
                    setConversations(data);
                }
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Error loading conversations:', err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadConversations();

        // Poll for new messages every 30 seconds
        const interval = setInterval(loadConversations, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Өчигдөр';
        } else if (days < 7) {
            return `${days} өдрийн өмнө`;
        } else {
            return date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                    <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-900" />
                    </Link>
                    <h1 className="font-bold text-lg">Мессеж</h1>
                </div>
                <div className="p-4">
                    <MessageListSkeleton count={5} />
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
                    <h1 className="font-bold text-lg">Мессеж</h1>
                </div>
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <MessageCircle className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">Нэвтрэх шаардлагатай</h3>
                    <p className="text-sm text-gray-500 mb-6">Мессежүүдээ харахын тулд нэвтэрнэ үү.</p>
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
                <h1 className="font-bold text-lg">Мессеж</h1>
                {conversations.length > 0 && (
                    <span className="ml-auto text-sm text-gray-500">
                        {conversations.filter(c => c.unread_count > 0).length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {conversations.reduce((sum, c) => sum + c.unread_count, 0)} шинэ
                            </span>
                        )}
                    </span>
                )}
            </div>

            {/* Conversations List */}
            <div className="divide-y divide-gray-100">
                {conversations.length > 0 ? (
                    conversations.map((conv) => (
                        <Link
                            key={conv.id}
                            href={`/messages/${conv.participant_id}${conv.product_id ? `?product=${conv.product_id}` : ''}`}
                            className="flex items-center gap-3 p-4 bg-white hover:bg-gray-50 transition-colors"
                        >
                            {/* Avatar */}
                            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                                <Image
                                    src={conv.participant_avatar}
                                    alt={conv.participant_name}
                                    fill
                                    className="object-cover"
                                />
                                {conv.unread_count > 0 && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {conv.unread_count}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className={`font-bold text-gray-900 truncate ${conv.unread_count > 0 ? 'text-black' : ''}`}>
                                        {conv.participant_name}
                                    </h3>
                                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                        {formatTime(conv.last_message_at)}
                                    </span>
                                </div>
                                {conv.product_title && (
                                    <p className="text-xs text-primary font-medium truncate mb-0.5">
                                        {conv.product_title}
                                    </p>
                                )}
                                <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                    {conv.last_message}
                                </p>
                            </div>

                            {/* Product thumbnail */}
                            {conv.product_image && (
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                        src={conv.product_image}
                                        alt=""
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                        </Link>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">Мессеж алга</h3>
                        <p className="text-sm text-gray-500 mb-6">Борлуулагчтай холбогдохын тулд бүтээгдэхүүн дээр чат дарна уу.</p>
                        <Link href="/" className="px-6 py-2.5 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors">
                            Бүтээгдэхүүн харах
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
