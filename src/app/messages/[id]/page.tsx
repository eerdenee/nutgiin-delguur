"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Send, ShoppingBag } from "lucide-react";
import { useParams } from "next/navigation";
import { MOCK_PRODUCTS } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

// Mock messages data
const MOCK_MESSAGES = {
    "1": [
        { id: "m1", text: "Сайн байна уу? Архангайн ааруулын талаар асуумаар байна.", sender: "them" as const, timestamp: "14:30" },
        { id: "m2", text: "Сайн байна уу! Тийм ээ, юу асуух вэ?", sender: "me" as const, timestamp: "14:32" },
        { id: "m3", text: "Үнийг бага зэрэг хөнгөлж болох уу?", sender: "them" as const, timestamp: "14:35" },
        { id: "m4", text: "10 кг-аас дээш авбал 5% хөнгөлнө.", sender: "me" as const, timestamp: "14:37" },
    ],
    "2": [
        { id: "m5", text: "Адууны махыг хэзээ авч болох вэ?", sender: "them" as const, timestamp: "10:15" },
        { id: "m6", text: "Маргааш өглөө авч болно.", sender: "me" as const, timestamp: "10:20" },
        { id: "m7", text: "Баярлалаа, маргааш авна.", sender: "them" as const, timestamp: "10:22" },
    ],
    "3": [
        { id: "m8", text: "Сайн байна уу? Эсгий таавчигийн талаар асуумаар байна.", sender: "them" as const, timestamp: "16:20" },
        { id: "m9", text: "Сайн байна уу! Тийм ээ, юу асуух вэ?", sender: "me" as const, timestamp: "16:25" },
    ],
    "4": [
        { id: "m10", text: "Адууны махыг хэзээ авч болох вэ?", sender: "them" as const, timestamp: "10:15" },
        { id: "m11", text: "Маргааш өглөө авч болно.", sender: "me" as const, timestamp: "10:20" },
    ],
};

const MOCK_USERS = {
    "1": { name: "Бат-Эрдэнэ", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=800&auto=format&fit=crop&q=60" },
    "2": { name: "Дорж", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60" },
    "3": { name: "Болд", avatar: "" },
    "4": { name: "Дорж", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60" },
};

export default function ChatRoomPage() {
    const params = useParams();
    const chatId = params.id as string;
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [user, setUser] = useState<any>({ name: "Хэрэглэгч", avatar: "" });
    const [productInfo, setProductInfo] = useState<any>(null);

    // Load messages, user info, and product info
    useEffect(() => {
        // 1. Load messages
        const savedMessages = localStorage.getItem(`chat_messages_${chatId}`);
        if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
        } else {
            // Seed with mock if empty
            const mock = MOCK_MESSAGES[chatId as keyof typeof MOCK_MESSAGES] || [];
            setMessages(mock);
            if (mock.length > 0) {
                localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(mock));
            }
        }

        // 2. Load conversation details
        const conversations = JSON.parse(localStorage.getItem("chat_conversations") || "[]");
        const conversation = conversations.find((c: any) => c.id === chatId);

        if (conversation) {
            setUser({
                name: conversation.userName,
                avatar: conversation.userAvatar
            });

            // 3. Load Product Info
            if (conversation.productId) {
                // Try MOCK_PRODUCTS first
                let product = MOCK_PRODUCTS.find(p => p.id === conversation.productId);

                // If not found, try localStorage (my_ads)
                if (!product) {
                    const myAds = JSON.parse(localStorage.getItem('my_ads') || '[]');
                    product = myAds.find((p: any) => p.id === conversation.productId);
                }

                if (product) {
                    setProductInfo(product);
                }
            }

            // 4. Mark as read
            if (conversation.unread) {
                const updatedConversations = conversations.map((c: any) =>
                    c.id === chatId ? { ...c, unread: false } : c
                );
                localStorage.setItem("chat_conversations", JSON.stringify(updatedConversations));
                window.dispatchEvent(new Event("chatUpdated"));
            }
        } else {
            // Fallback to mock user
            const mockUser = MOCK_USERS[chatId as keyof typeof MOCK_USERS];
            if (mockUser) setUser(mockUser);
        }
    }, [chatId]);

    const handleSend = () => {
        if (message.trim()) {
            const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

            const newMessage = {
                id: crypto.randomUUID(),
                text: message.trim(),
                sender: "me" as const,
                timestamp: timestamp
            };

            const updatedMessages = [...messages, newMessage];
            setMessages(updatedMessages);
            setMessage("");

            // Save messages
            localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(updatedMessages));

            // Update conversation last message
            const conversations = JSON.parse(localStorage.getItem("chat_conversations") || "[]");
            let updatedConversations = conversations.map((c: any) => {
                if (c.id === chatId) {
                    return {
                        ...c,
                        lastMessage: newMessage.text,
                        timestamp: timestamp,
                        lastMessageTime: new Date().toISOString(),
                        unread: false
                    };
                }
                return c;
            });

            // If conversation doesn't exist, add it
            if (!conversations.find((c: any) => c.id === chatId)) {
                updatedConversations.push({
                    id: chatId,
                    userName: user.name,
                    userAvatar: user.avatar,
                    lastMessage: newMessage.text,
                    timestamp: timestamp,
                    lastMessageTime: new Date().toISOString(),
                    unread: false
                });
            }

            // Sort by time
            updatedConversations.sort((a: any, b: any) =>
                new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
            );

            localStorage.setItem("chat_conversations", JSON.stringify(updatedConversations));
            window.dispatchEvent(new Event("chatUpdated"));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="px-4 py-3 flex items-center gap-3">
                    <Link href="/messages" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-900" />
                    </Link>
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden relative">
                        {user.avatar ? (
                            <Image src={user.avatar} alt={user.name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                {user.name[0]}
                            </div>
                        )}
                    </div>
                    <h1 className="font-bold text-lg">{user.name}</h1>
                </div>

                {/* Product Snippet (New Feature) */}
                {productInfo && (
                    <Link href={`/product/${productInfo.id}`} className="block bg-gray-50 px-4 py-2 border-t hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 overflow-hidden relative flex-shrink-0">
                                <Image src={productInfo.image} alt={productInfo.title} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-gray-900 truncate">{productInfo.title}</h3>
                                <p className="text-xs text-primary font-bold">
                                    {formatPrice(productInfo.price, productInfo.currency)}
                                </p>
                            </div>
                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                        </div>
                    </Link>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32 md:pb-24">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${msg.sender === "me"
                            ? "bg-primary text-secondary rounded-br-sm"
                            : "bg-white text-gray-900 rounded-bl-sm shadow-sm"
                            }`}>
                            <p className="text-sm">{msg.text}</p>
                            <span className={`text-[10px] mt-1 block ${msg.sender === "me" ? "text-gray-700" : "text-gray-500"}`}>
                                {msg.timestamp}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-20 md:pb-4 z-20">
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Зурвас бичих..."
                        className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!message.trim()}
                        className="w-12 h-12 bg-primary text-secondary rounded-full flex items-center justify-center hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
