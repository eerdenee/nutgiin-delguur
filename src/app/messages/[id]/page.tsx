"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    product_id: string | null;
    content: string;
    is_read: boolean;
    created_at: string;
    sender?: {
        id: string;
        name: string;
        avatar_url: string;
    };
}

interface Participant {
    id: string;
    name: string;
    avatar_url: string;
}

interface Product {
    id: string;
    title: string;
    price: number;
    images: string[];
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const participantId = resolvedParams.id;

    const [messages, setMessages] = useState<Message[]>([]);
    const [participant, setParticipant] = useState<Participant | null>(null);
    const [product, setProduct] = useState<Product | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get product ID from URL
    const [productId, setProductId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            setProductId(params.get('product'));
        }
    }, []);

    // Load messages and participant info
    useEffect(() => {
        const loadChat = async () => {
            try {
                const { supabase } = await import("@/lib/supabase");
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setIsLoggedIn(false);
                    setIsLoading(false);
                    return;
                }

                setIsLoggedIn(true);
                setCurrentUserId(user.id);

                // Get participant info
                const { data: participantData } = await (supabase
                    .from('profiles') as any)
                    .select('id, name, avatar_url')
                    .eq('id', participantId)
                    .single();

                if (participantData) {
                    setParticipant({
                        id: participantData.id,
                        name: participantData.name || 'Хэрэглэгч',
                        avatar_url: participantData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participantId}`,
                    });
                }

                // Get product info if productId exists
                if (productId) {
                    const { data: productData } = await (supabase
                        .from('products') as any)
                        .select('id, title, price, images')
                        .eq('id', productId)
                        .single();

                    if (productData) {
                        setProduct(productData);
                    }
                }

                // Get messages
                const { getMessages } = await import("@/lib/messages");
                const { data: messagesData } = await getMessages(participantId, productId || undefined);
                setMessages(messagesData || []);

                // Subscribe to new messages
                const { subscribeToMessages } = await import("@/lib/messages");
                const unsubscribe = subscribeToMessages(user.id, (newMsg) => {
                    if (newMsg.sender_id === participantId) {
                        setMessages(prev => [...prev, newMsg]);
                    }
                });

                return () => unsubscribe();
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Error loading chat:', err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (participantId) {
            loadChat();
        }
    }, [participantId, productId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const { sendMessage } = await import("@/lib/messages");
            const { data, error } = await sendMessage(participantId, newMessage.trim(), productId || undefined);

            if (!error && data) {
                setMessages(prev => [...prev, data]);
                setNewMessage("");
                inputRef.current?.focus();
            } else {
                alert(error || 'Илгээхэд алдаа гарлаа');
            }
        } catch (err) {
            alert('Илгээхэд алдаа гарлаа');
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('mn-MN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                    <Link href="/messages" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-900" />
                    </Link>
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="w-32 h-5 rounded" />
                </div>
                <div className="flex-1 p-4 space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                            <Skeleton className={`w-48 h-12 rounded-2xl`} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <p className="text-gray-600 mb-4">Нэвтрэх шаардлагатай</p>
                <Link href="/login" className="px-6 py-2.5 bg-primary text-secondary font-bold rounded-xl">
                    Нэвтрэх
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                <Link href="/messages" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </Link>
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image
                        src={participant?.avatar_url || ''}
                        alt={participant?.name || ''}
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="font-bold text-gray-900 truncate">{participant?.name || 'Хэрэглэгч'}</h1>
                    {product && (
                        <p className="text-xs text-primary truncate font-medium">{product.title}</p>
                    )}
                </div>
            </div>

            {/* Product Preview */}
            {product && (
                <Link
                    href={`/product/${product.id}`}
                    className="bg-white border-b px-4 py-3 flex items-center gap-3 hover:bg-gray-50"
                >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                            src={product.images?.[0] || ''}
                            alt={product.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                        <p className="text-sm font-bold text-primary">₮{product.price.toLocaleString()}</p>
                    </div>
                </Link>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        <p>Мессеж эхлүүлэхийн тулд бичнэ үү</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isOwn = msg.sender_id === currentUserId;
                        const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender_id !== msg.sender_id);

                        return (
                            <div
                                key={msg.id}
                                className={`flex items-end gap-2 ${isOwn ? 'justify-end' : ''}`}
                            >
                                {!isOwn && showAvatar && (
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                        <Image
                                            src={msg.sender?.avatar_url || participant?.avatar_url || ''}
                                            alt=""
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                {!isOwn && !showAvatar && <div className="w-8" />}

                                <div
                                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${isOwn
                                        ? 'bg-primary text-secondary rounded-br-md'
                                        : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    <p className={`text-xs mt-1 ${isOwn ? 'text-yellow-900/60' : 'text-gray-400'}`}>
                                        {formatTime(msg.created_at)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-3">
                <div className="flex items-center gap-2 max-w-screen-lg mx-auto">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Мессеж бичих..."
                        className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isSending}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || isSending}
                        className="p-3 bg-primary text-secondary rounded-full hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
