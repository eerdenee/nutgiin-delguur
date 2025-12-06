"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, MapPin, Heart, CheckCircle, Star, MessageCircle, Flag, AlertTriangle, X } from "lucide-react";
import { reportProduct, hasUserReported, REPORT_REASONS, type ReportReason } from "@/lib/moderation";

interface ProductCardProps {
    id: string;
    title: string;
    price: number;
    currency: string;
    location: { aimag: string; soum: string };
    image: string;
    seller: {
        name: string;
        phone: string;
        image?: string;
        isVerified?: boolean;
        isBusiness?: boolean;
        companyName?: string;
        companyLogo?: string;
    };
    isFeatured?: boolean;
    isCompact?: boolean;
    hideButton?: boolean;
    ranking?: number;
    createdAt?: string;
    tier?: 'soum' | 'aimag' | 'national';
}

export default function ProductCard({
    id,
    title,
    price,
    currency,
    location,
    image,
    seller,
    isFeatured,
    isCompact,
    hideButton,
    ranking,
    createdAt,
    tier
}: ProductCardProps) {
    const router = useRouter();
    const [isLiked, setIsLiked] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('');
    const [reportDescription, setReportDescription] = useState('');
    const [reportStatus, setReportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [reportMessage, setReportMessage] = useState('');
    const [alreadyReported, setAlreadyReported] = useState(false);

    // Check if user already reported
    useEffect(() => {
        setAlreadyReported(hasUserReported(id));
    }, [id]);

    // Smart Badge Logic
    let newBadgeText = "ШИНЭ";
    let isNew = false;

    if (createdAt) {
        const diff = new Date().getTime() - new Date(createdAt).getTime();
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * 60 * 60 * 1000;
        const sevenDays = 7 * oneDay;

        if (diff < sevenDays) {
            isNew = true;
            if (diff < oneHour) newBadgeText = "САЯХАН";
            else if (diff < oneDay) newBadgeText = "ӨНӨӨДӨР";
        }
    }

    useEffect(() => {
        const checkLiked = () => {
            const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
            setIsLiked(favorites.includes(id));
        };

        checkLiked();
        window.addEventListener("favoritesUpdated", checkLiked);
        window.addEventListener("storage", checkLiked);

        return () => {
            window.removeEventListener("favoritesUpdated", checkLiked);
            window.removeEventListener("storage", checkLiked);
        };
    }, [id]);

    const toggleLike = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        let newFavorites;

        if (favorites.includes(id)) {
            newFavorites = favorites.filter((favId: string) => favId !== id);
        } else {
            newFavorites = [...favorites, id];

            // Update Saves count
            try {
                const myAds = JSON.parse(localStorage.getItem('my_ads') || '[]');
                const adIndex = myAds.findIndex((p: any) => p.id === id);
                if (adIndex !== -1) {
                    myAds[adIndex].saves = (myAds[adIndex].saves || 0) + 1;
                    localStorage.setItem('my_ads', JSON.stringify(myAds));
                }
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.error("Error updating saves:", err);
                }
            }
        }

        localStorage.setItem("favorites", JSON.stringify(newFavorites));
        window.dispatchEvent(new Event("favoritesUpdated"));
    };

    const handleReport = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!alreadyReported) {
            setShowReportModal(true);
        }
    };

    const submitReport = () => {
        if (!selectedReason) return;

        setReportStatus('loading');
        const result = reportProduct(id, selectedReason, reportDescription);

        if (result.success) {
            setReportStatus('success');
            setReportMessage(result.message);
            setAlreadyReported(true);
            setTimeout(() => {
                setShowReportModal(false);
                setReportStatus('idle');
                setSelectedReason('');
                setReportDescription('');
            }, 2000);
        } else {
            setReportStatus('error');
            setReportMessage(result.message);
        }
    };

    const handleChatClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Update engagement stats (chatClicks)
        try {
            const myAds = JSON.parse(localStorage.getItem('my_ads') || '[]');
            const adIndex = myAds.findIndex((p: any) => p.id === id);

            if (adIndex !== -1) {
                myAds[adIndex].chatClicks = (myAds[adIndex].chatClicks || 0) + 1;
                localStorage.setItem('my_ads', JSON.stringify(myAds));
                // Dispatch event to update UI immediately if needed
                window.dispatchEvent(new Event('adsUpdated'));
            }
        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error("Error updating stats:", err);
            }
        }

        // 2. Create/Find chat conversation
        const conversations = JSON.parse(localStorage.getItem("chat_conversations") || "[]");
        let existingChat = conversations.find((c: any) =>
            c.productId === id || c.sellerId === seller.phone
        );

        if (!existingChat) {
            const newChat = {
                id: Date.now().toString(),
                productId: id,
                sellerId: seller.phone,
                userName: seller.name,
                userAvatar: seller.image || "",
                lastMessage: `${title} - Сайн байна уу?`,
                timestamp: new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }),
                lastMessageTime: new Date(),
                unread: false
            };
            conversations.unshift(newChat);
            localStorage.setItem("chat_conversations", JSON.stringify(conversations));

            // Initial message
            localStorage.setItem(`chat_messages_${newChat.id}`, JSON.stringify([
                {
                    id: "1",
                    text: `Сайн байна уу? ${title}-ийн талаар асуух зүйл байна.`,
                    sender: "me",
                    timestamp: new Date().toISOString()
                }
            ]));

            existingChat = newChat;
        }

        // 3. Navigate to messages (Smooth)
        router.push(`/messages/${existingChat.id}`);
    };

    const handleCallClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Update call clicks
        try {
            const myAds = JSON.parse(localStorage.getItem('my_ads') || '[]');
            const adIndex = myAds.findIndex((p: any) => p.id === id);

            if (adIndex !== -1) {
                myAds[adIndex].callClicks = (myAds[adIndex].callClicks || 0) + 1;
                localStorage.setItem('my_ads', JSON.stringify(myAds));
            }
        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error("Error updating stats:", err);
            }
        }

        window.location.href = `tel:${seller.phone}`;
    };

    return (
        <>
            <Link href={`/product/${id}`} className="block h-full">
                <div className={`group bg-white rounded-2xl transition-all duration-300 overflow-hidden flex flex-col h-full relative ${isFeatured
                    ? "border border-yellow-400/50 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40"
                    : "border border-gray-100 shadow-sm hover:shadow-md"
                    }`}>

                    {/* --- BADGES STACK (LEFT SIDE) --- */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-20 items-start">
                        {/* 1. Ranking Badge */}
                        {ranking && ranking <= 5 && (
                            <div className={`bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-white font-black rounded-full shadow-lg flex items-center justify-center border-2 border-white ${isCompact ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"}`}>
                                #{ranking}
                            </div>
                        )}

                        {/* 2. National Tier Badge */}
                        {tier === 'national' && (
                            <div className={`bg-red-600 text-white font-bold rounded-full shadow-md flex items-center justify-center border border-white ${isCompact ? "text-[8px] px-2 py-0.5" : "text-[10px] px-2 py-1"}`}>
                                🇲🇳 УЛС
                            </div>
                        )}

                        {/* 3. Smart New Badge */}
                        {isNew && (
                            <div className={`${newBadgeText === 'САЯХАН' ? 'bg-green-500' : (newBadgeText === 'ӨНӨӨДӨР' ? 'bg-teal-500' : 'bg-blue-500')} text-white font-bold rounded-full shadow-md flex items-center justify-center border border-white ${isCompact ? "text-[8px] px-2 py-0.5" : "text-[10px] px-2 py-1"}`}>
                                {newBadgeText}
                            </div>
                        )}

                        {/* 4. Featured Badge */}
                        {isFeatured && (
                            <div className={`bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold rounded-full shadow-md flex items-center gap-1 tracking-wider uppercase border border-white ${isCompact ? "text-[8px] px-2 py-0.5" : "text-[10px] px-3 py-1"}`}>
                                <Star className={`${isCompact ? "w-2.5 h-2.5" : "w-3 h-3"} fill-white`} />
                                Онцлох
                            </div>
                        )}
                    </div>

                    <div className={`relative overflow-hidden bg-gray-100 ${isCompact ? "aspect-square" : "aspect-[4/3]"}`}>
                        <Image
                            src={image}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {seller.isBusiness && seller.companyLogo && (
                            <div className={`absolute top-2 right-2 bg-white rounded-md shadow-md p-0.5 ${isCompact ? "w-12 h-8" : "w-14 h-9"}`}>
                                <Image
                                    src={seller.companyLogo}
                                    alt={seller.companyName || "Company Logo"}
                                    width={isCompact ? 48 : 56}
                                    height={isCompact ? 32 : 36}
                                    className="object-contain w-full h-full"
                                />
                            </div>
                        )}

                        <button
                            onClick={toggleLike}
                            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
                            className={`absolute ${seller.isBusiness && seller.companyLogo
                                ? 'bottom-2 right-2'
                                : 'top-2 right-2'
                                } bg-white/80 backdrop-blur-sm rounded-full transition-colors ${isCompact ? "p-1.5" : "p-2"} group/heart z-20`}
                        >
                            <Heart
                                className={`${isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} transition-colors ${isLiked
                                    ? "fill-red-500 text-red-500"
                                    : "text-gray-600 group-hover/heart:text-red-500"
                                    }`}
                            />
                        </button>

                        {/* Report Button */}
                        <button
                            onClick={handleReport}
                            aria-label="Report product"
                            className={`absolute ${seller.isBusiness && seller.companyLogo
                                ? 'bottom-2 right-10'
                                : 'top-2 right-10'
                                } bg-white/80 backdrop-blur-sm rounded-full transition-colors ${isCompact ? "p-1.5" : "p-2"} group/flag z-20 ${alreadyReported ? 'opacity-50' : ''}`}
                            disabled={alreadyReported}
                        >
                            <Flag
                                className={`${isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} transition-colors ${alreadyReported
                                    ? "fill-orange-500 text-orange-500"
                                    : "text-gray-600 group-hover/flag:text-orange-500"
                                    }`}
                            />
                        </button>

                        <div className={`absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white rounded-lg ${isCompact ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-1"}`}>
                            <MapPin className={`${isCompact ? "w-2.5 h-2.5" : "w-3 h-3"} text-primary`} />
                            <span className="font-medium">{location.aimag}</span>
                        </div>
                    </div>

                    <div className={`flex flex-col flex-1 ${isCompact ? "p-2" : "p-3"}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`rounded-full bg-gray-100 overflow-hidden relative border border-gray-200 ${isCompact ? "w-5 h-5" : "w-6 h-6"}`}>
                                {seller.image ? (
                                    <Image src={seller.image} alt={seller.name} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary text-[10px] font-bold">
                                        {seller.name[0]}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className={`text-gray-600 font-medium line-clamp-1 ${isCompact ? "text-[10px]" : "text-xs"}`}>
                                    {seller.isBusiness && seller.companyName ? seller.companyName : seller.name}
                                </span>
                                {seller.isVerified && (
                                    <CheckCircle className={`${isCompact ? "w-2.5 h-2.5" : "w-3 h-3"} text-green-500 fill-green-500/20`} />
                                )}
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className={`font-bold text-gray-900 line-clamp-2 mb-1 leading-tight group-hover:text-primary transition-colors min-h-[2.5em] ${isCompact ? "text-xs" : "text-sm"}`}>
                                {title}
                            </h3>
                            <p className={`text-amber-700 font-bold truncate ${isCompact ? "text-sm" : "text-lg"}`}>
                                {price === 0 ? "Үнэ тохиролцоно" : `${currency}${price.toLocaleString()}`}
                            </p>
                        </div>

                        {!hideButton && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleCallClick}
                                    aria-label="Call seller"
                                    className={`flex items-center justify-center gap-1 w-full bg-gray-50 text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95 border border-gray-100 ${isCompact ? "py-1.5 text-xs" : "py-2 text-sm"}`}
                                >
                                    <Phone className={`${isCompact ? "w-3 h-3" : "w-4 h-4"}`} />
                                    Залгах
                                </button>
                                <button
                                    onClick={handleChatClick}
                                    aria-label="Chat with seller"
                                    className={`flex items-center justify-center gap-1 w-full bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-all active:scale-95 shadow-sm ${isCompact ? "py-1.5 text-xs" : "py-2 text-sm"}`}
                                >
                                    <MessageCircle className={`${isCompact ? "w-3 h-3" : "w-4 h-4"}`} />
                                    Чатлах
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Link >

            {/* Report Modal */}
            {
                showReportModal && (
                    <div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={(e) => { e.stopPropagation(); setShowReportModal(false); }}
                    >
                        <div
                            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {reportStatus === 'success' ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 mb-2">Баярлалаа!</h3>
                                    <p className="text-gray-600">{reportMessage}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 border-b flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Flag className="w-5 h-5 text-orange-500" />
                                            <h2 className="font-bold text-lg">Бүтээгдэхүүн мэдээлэх</h2>
                                        </div>
                                        <button
                                            onClick={() => setShowReportModal(false)}
                                            aria-label="Close report modal"
                                            className="p-1 hover:bg-gray-100 rounded-full"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="p-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Шалтгаан сонгох *
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {Object.entries(REPORT_REASONS).map(([key, value]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => setSelectedReason(key as ReportReason)}
                                                        className={`p-3 rounded-xl text-sm font-medium transition-all border ${selectedReason === key
                                                            ? 'bg-orange-50 border-orange-500 text-orange-700'
                                                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {value.labelMn}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Нэмэлт тайлбар (заавал биш)
                                            </label>
                                            <textarea
                                                value={reportDescription}
                                                onChange={(e) => setReportDescription(e.target.value)}
                                                className="w-full p-3 border rounded-xl h-20 resize-none text-sm"
                                                placeholder="Дэлгэрэнгүй тайлбар бичих..."
                                            />
                                        </div>

                                        {reportStatus === 'error' && (
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
                                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                <p className="text-sm text-red-700">{reportMessage}</p>
                                            </div>
                                        )}

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                            <p className="text-xs text-yellow-800">
                                                <strong>⚠️ Анхааруулга:</strong> 15+ хүн мэдээлвэл бүтээгдэхүүн автоматаар нуугдана.
                                                Худал мэдээлэл өгвөл таны аккаунтад хязгаарлалт тавигдаж болно.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 border-t flex gap-2">
                                        <button
                                            onClick={() => setShowReportModal(false)}
                                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold"
                                        >
                                            Болих
                                        </button>
                                        <button
                                            onClick={submitReport}
                                            disabled={!selectedReason || reportStatus === 'loading'}
                                            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {reportStatus === 'loading' ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Илгээж байна...
                                                </>
                                            ) : (
                                                <>
                                                    <Flag className="w-4 h-4" />
                                                    Мэдээлэх
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )
            }
        </>
    );
}
