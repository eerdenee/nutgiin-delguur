"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Trash2 } from "lucide-react";

// Mock conversation data
const MOCK_CONVERSATIONS = [
    {
        id: "1",
        userName: "Бат-Эрдэнэ",
        userAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=800&auto=format&fit=crop&q=60",
        lastMessage: "10 кг-аас дээш авбал 5% хөнгөлнө.",
        timestamp: "14:37",
        lastMessageTime: new Date("2024-01-15T14:37:00"),
        unread: false,
    },
    {
        id: "2",
        userName: "Дорж",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60",
        lastMessage: "Баярлалаа, маргааш авна.",
        timestamp: "10:22",
        lastMessageTime: new Date("2024-01-15T10:22:00"),
        unread: false,
    },
    {
        id: "3",
        userName: "Болд",
        userAvatar: "",
        lastMessage: "Сайн байна уу! Тийм ээ, юу асуух вэ?",
        timestamp: "16:25",
        lastMessageTime: new Date("2024-01-15T16:25:00"),
        unread: true,
    },
    {
        id: "4",
        userName: "Дорж",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60",
        lastMessage: "Маргааш өглөө авч болно.",
        timestamp: "10:20",
        lastMessageTime: new Date("2024-01-15T10:20:00"),
        unread: false,
    },
].sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

export default function MessagesPage() {
    const router = useRouter();
    const [conversations, setConversations] = useState<any[]>([]);

    useEffect(() => {
        const savedConversations = localStorage.getItem("chat_conversations");

        if (savedConversations) {
            setConversations(JSON.parse(savedConversations));
        } else {
            localStorage.setItem("chat_conversations", JSON.stringify(MOCK_CONVERSATIONS));
            setConversations(MOCK_CONVERSATIONS);
        }

        const handleStorageChange = () => {
            const updated = localStorage.getItem("chat_conversations");
            if (updated) {
                setConversations(JSON.parse(updated));
            }
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("chatUpdated", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("chatUpdated", handleStorageChange);
        };
    }, []);

    const handleDeleteChat = (e: React.MouseEvent, conversationId: string | number) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm("Та энэ зурвасыг устгахдаа итгэлтэй байна уу?")) return;

        try {
            console.log("Deleting ID:", conversationId);

            // 1. Get current list from localStorage to be sure
            const currentList = JSON.parse(localStorage.getItem("chat_conversations") || "[]");

            // 2. Strict ID Filtering (Convert everything to String to be safe)
            const newList = currentList.filter((c: any) => String(c.id) !== String(conversationId));

            console.log("Remaining items:", newList.length);

            // 3. Update LocalStorage FIRST
            localStorage.setItem("chat_conversations", JSON.stringify(newList));

            // Also remove the specific message history
            localStorage.removeItem(`chat_messages_${conversationId}`);

            // 4. Force Update State (Pass a new array reference)
            setConversations([...newList]);

            // 5. Dispatch event for other tabs/components
            window.dispatchEvent(new Event("chatUpdated"));

        } catch (error) {
            console.error("Delete failed:", error);
            alert("Устгахад алдаа гарлаа. Дахин оролдоно уу.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </Link>
                <h1 className="font-bold text-lg">Зурвас</h1>
            </div>

            <div className="p-4">
                {conversations.length > 0 ? (
                    <div className="space-y-2">
                        {conversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                onClick={() => router.push(`/messages/${conversation.id}`)}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center overflow-hidden relative z-0 cursor-pointer"
                            >
                                <div className="p-4 flex items-center gap-3 flex-1 min-w-0 hover:bg-gray-50 transition-colors">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                                            {conversation.userAvatar ? (
                                                <img
                                                    src={conversation.userAvatar}
                                                    alt={conversation.userName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-lg font-bold text-gray-500">
                                                    {conversation.userName[0]}
                                                </span>
                                            )}
                                        </div>
                                        {conversation.unread && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between mb-1 gap-2">
                                            <h3 className="font-bold text-gray-900 truncate">{conversation.userName}</h3>
                                            <span className="text-xs text-gray-500 flex-shrink-0">{conversation.timestamp}</span>
                                        </div>
                                        <p className={`text-sm truncate ${conversation.unread ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                                            {conversation.lastMessage}
                                        </p>
                                    </div>
                                </div>

                                <div className="pr-4 pl-2 self-stretch flex items-center justify-center border-l border-gray-50 relative z-50">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log("Delete button clicked");
                                            handleDeleteChat(e, conversation.id);
                                        }}
                                        className="p-2 hover:bg-red-50 rounded-full transition-colors group relative z-50 pointer-events-auto"
                                        title="Устгах"
                                    >
                                        <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">Зурвас алга</h3>
                        <p className="text-sm text-gray-500 mb-6">Танд одоогоор зурвас ирээгүй байна.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
