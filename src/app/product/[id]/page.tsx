"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Phone, MapPin, ShieldAlert, MessageCircle, CheckCircle, Copy, Check, AlertTriangle, Banknote, Video, Play } from "lucide-react";
import { MOCK_PRODUCTS } from "@/lib/data";
import ReviewSection from "@/components/ReviewSection";
import { formatPrice, getSmartBadge } from "@/lib/utils";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    // Try to find in MOCK_PRODUCTS first
    let product = MOCK_PRODUCTS.find((p) => p.id === id);

    // If not found, check localStorage
    if (!product && typeof window !== 'undefined') {
        const savedAds = JSON.parse(localStorage.getItem('my_ads') || '[]');
        // @ts-ignore
        product = savedAds.find((p) => p.id === id);
    }

    const [isSaved, setIsSaved] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [copied, setCopied] = useState(false);
    const [copiedType, setCopiedType] = useState<'account' | 'iban' | null>(null);
    const [showPaymentWarning, setShowPaymentWarning] = useState(false);

    const router = useRouter();

    // Increment Views on Mount
    useEffect(() => {
        if (product && typeof window !== 'undefined') {
            const viewedKey = `viewed_${id}`;
            const hasViewed = sessionStorage.getItem(viewedKey);

            if (!hasViewed) {
                try {
                    const myAds = JSON.parse(localStorage.getItem('my_ads') || '[]');
                    const adIndex = myAds.findIndex((p: any) => p.id === id);

                    if (adIndex !== -1) {
                        myAds[adIndex].views = (myAds[adIndex].views || 0) + 1;
                        localStorage.setItem('my_ads', JSON.stringify(myAds));
                    }
                    sessionStorage.setItem(viewedKey, 'true');
                } catch (err) {
                    console.error("Error updating views:", err);
                }
            }
        }
    }, [id, product]);

    useEffect(() => {
        const checkSaved = () => {
            const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
            setIsSaved(favorites.includes(id));
        };

        checkSaved();
        window.addEventListener("favoritesUpdated", checkSaved);
        window.addEventListener("storage", checkSaved);

        return () => {
            window.removeEventListener("favoritesUpdated", checkSaved);
            window.removeEventListener("storage", checkSaved);
        };
    }, [id]);

    const toggleSave = () => {
        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        let newFavorites;

        if (favorites.includes(id)) {
            newFavorites = favorites.filter((favId: string) => favId !== id);
        } else {
            newFavorites = [...favorites, id];

            // Update Saves count in product stats
            try {
                const myAds = JSON.parse(localStorage.getItem('my_ads') || '[]');
                const adIndex = myAds.findIndex((p: any) => p.id === id);
                if (adIndex !== -1) {
                    myAds[adIndex].saves = (myAds[adIndex].saves || 0) + 1;
                    localStorage.setItem('my_ads', JSON.stringify(myAds));
                }
            } catch (err) {
                console.error("Error updating saves:", err);
            }
        }

        localStorage.setItem("favorites", JSON.stringify(newFavorites));
        window.dispatchEvent(new Event("favoritesUpdated"));
        setIsSaved(!isSaved);
    };

    const startChat = (product: any) => {
        const conversations = JSON.parse(localStorage.getItem("chat_conversations") || "[]");
        let existingChat = conversations.find((c: any) =>
            c.productId === product.id || c.sellerId === product.seller.phone
        );

        if (!existingChat) {
            const newChat = {
                id: crypto.randomUUID(),
                productId: product.id,
                sellerId: product.seller.phone,
                userName: product.seller.name,
                userAvatar: product.seller.image || "",
                lastMessage: `${product.title} - Сайн байна уу?`,
                timestamp: new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }),
                lastMessageTime: new Date(),
                unread: false
            };

            conversations.unshift(newChat);
            localStorage.setItem("chat_conversations", JSON.stringify(conversations));

            localStorage.setItem(`chat_messages_${newChat.id}`, JSON.stringify([
                {
                    id: "1",
                    text: `Сайн байна у|у? ${product.title}-ийн талаар асуух зүйл байна.`,
                    sender: "me",
                    timestamp: new Date().toISOString()
                }
            ]));

            existingChat = newChat;
        }

        router.push(`/messages/${existingChat.id}`);
    };

    const handleChatClick = () => {
        // Update chat clicks
        try {
            const myAds = JSON.parse(localStorage.getItem('my_ads') || '[]');
            const adIndex = myAds.findIndex((p: any) => p.id === id);
            if (adIndex !== -1) {
                myAds[adIndex].chatClicks = (myAds[adIndex].chatClicks || 0) + 1;
                localStorage.setItem('my_ads', JSON.stringify(myAds));
            }
        } catch (err) {
            console.error("Error updating chat clicks:", err);
        }
        startChat(product);
    };

    const handleCallClick = () => {
        // Update call clicks
        try {
            const myAds = JSON.parse(localStorage.getItem('my_ads') || '[]');
            const adIndex = myAds.findIndex((p: any) => p.id === id);
            if (adIndex !== -1) {
                myAds[adIndex].callClicks = (myAds[adIndex].callClicks || 0) + 1;
                localStorage.setItem('my_ads', JSON.stringify(myAds));
            }
        } catch (err) {
            console.error("Error updating call clicks:", err);
        }
        window.location.href = `tel:${product?.seller.phone}`;
    };

    // Copy bank account or IBAN to clipboard
    const handleCopyBankAccount = async (type: 'account' | 'iban' = 'account') => {
        const valueToCopy = type === 'iban'
            ? (product as any).seller?.bankIBAN
            : (product as any).seller?.bankAccount;

        if (!valueToCopy) return;

        try {
            await navigator.clipboard.writeText(valueToCopy);
            setCopied(true);
            setCopiedType(type);
            setShowPaymentWarning(true);

            // Reset copied state after 3 seconds
            setTimeout(() => {
                setCopied(false);
                setCopiedType(null);
            }, 3000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">Бүтээгдэхүүн олдсонгүй</h2>
                    <Link href="/" className="text-primary hover:underline mt-2 block">
                        Нүүр хуудас руу буцах
                    </Link>
                </div>
            </div>
        );
    }

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return "Саяхан";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} минутын өмнө`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} цагийн өмнө`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} өдрийн өмнө`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} сарын өмнө`;
        return `${Math.floor(months / 12)} жилийн өмнө`;
    };

    const images = (product as any).images || [product.image];
    const badge = getSmartBadge((product as any).createdAt || new Date().toISOString());
    const bankAccount = (product as any).seller?.bankAccount;
    const bankName = (product as any).seller?.bankName;
    const bankIBAN = (product as any).seller?.bankIBAN;
    const videoLinks = (product as any).videoLinks || [];

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Payment Warning Modal */}
            {showPaymentWarning && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowPaymentWarning(false)}>
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">⚠️ Чухал анхааруулга!</h3>
                        </div>

                        <div className="space-y-4 text-sm text-gray-600">
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <p className="font-bold text-red-800 mb-2">🚫 ТҮРҮҮЛЖ МӨНГӨ БҮҮ ШИЛЖҮҮЛ!</p>
                                <p className="text-red-700">
                                    Энэ товч нь зөвхөн төлбөр шилжүүлэх явцыг <strong>хурдасгах</strong> зорилготой.
                                    Худалдагчтай сайн ярилцаж, тохиролцсоны дараа л мөнгөө шилжүүлнэ үү.
                                </p>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <p className="font-bold text-green-800 mb-2">✅ Зөв арга:</p>
                                <ul className="text-green-700 space-y-1">
                                    <li>1. Худалдагчтай чатлах эсвэл залгах</li>
                                    <li>2. Барааны талаар дэлгэрэнгүй асуух</li>
                                    <li>3. Үнэ, хүргэлтийн талаар тохиролцох</li>
                                    <li>4. Боломжтой бол биетээр үзэх</li>
                                    <li>5. <strong>Зөвхөн тохиролцсоны дараа</strong> төлбөр шилжүүлэх</li>
                                </ul>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="font-medium text-blue-800">
                                    💡 <strong>Дансны дугаар хуулагдлаа:</strong> {bankAccount}
                                </p>
                                <p className="text-blue-700 text-xs mt-1">
                                    Банкны апп руугаа орж Paste хийнэ үү.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowPaymentWarning(false)}
                            className="w-full mt-6 bg-primary text-secondary font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors"
                        >
                            Ойлголоо
                        </button>
                    </div>
                </div>
            )}

            {/* Fixed Navigation Header */}
            <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
                <div className="flex items-center justify-between px-4 py-3">
                    <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-900" />
                    </Link>
                    <h1 className="font-bold text-lg text-gray-900">Дэлгэрэнгүй</h1>
                    <button
                        onClick={toggleSave}
                        className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Heart className={`w-6 h-6 ${isSaved ? "fill-red-500 text-red-500" : "text-gray-900"}`} />
                    </button>
                </div>
            </div>

            <div className="pt-16">
                {/* Image Gallery */}
                <div className="relative w-full h-80 bg-gray-50 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                    {images.map((img: string, index: number) => (
                        <div
                            key={index}
                            className="flex-shrink-0 w-[80%] h-full flex items-center justify-center snap-center px-2"
                        >
                            <div className="relative w-full aspect-[4/3] max-h-full">
                                <Image
                                    src={img}
                                    alt={`${product.title} - ${index + 1}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-contain rounded-xl shadow-sm"
                                    priority={index === 0}
                                />
                            </div>
                        </div>
                    ))}
                    {images.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm font-medium">
                            {currentImageIndex + 1} / {images.length}
                        </div>
                    )}
                </div>

                {/* Video Links Section */}
                {videoLinks.length > 0 && (
                    <div className="px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center gap-2 mb-2">
                                <Video className="w-4 h-4 text-pink-500" />
                                <span className="text-sm font-bold text-gray-900">Видео</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto">
                                {videoLinks.map((link: string, idx: number) => {
                                    // YouTube thumbnail extraction
                                    const youtubeMatch = link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
                                    const thumbnailUrl = youtubeMatch
                                        ? `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`
                                        : null;

                                    return (
                                        <a
                                            key={idx}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="relative flex-shrink-0 w-32 h-20 bg-gray-200 rounded-lg overflow-hidden group"
                                        >
                                            {thumbnailUrl ? (
                                                <img src={thumbnailUrl} alt="Video" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500">
                                                    <Video className="w-8 h-8 text-white" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                                                <Play className="w-8 h-8 text-white fill-white" />
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div className="px-4 py-4 max-w-4xl mx-auto">
                    {/* Title & Price */}
                    <div className="mb-6">
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                                {product.title}
                            </h2>
                            {badge && (
                                <span className={`${badge.color} text-white text-xs font-bold px-2 py-1 rounded-full shrink-0`}>
                                    {badge.text}
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-bold text-primary">
                            {formatPrice(product.price, product.currency)}
                        </p>
                    </div>

                    {/* Location & Date */}
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-6 pb-6 border-b border-gray-100">
                        <MapPin className="w-4 h-4" />
                        <span>
                            {product.location.aimag}, {product.location.soum}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{timeAgo((product as any).createdAt || new Date().toISOString())}</span>
                    </div>

                    {/* Seller Info */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-500 overflow-hidden relative">
                            {product.seller.image ? (
                                <Image src={product.seller.image} alt={product.seller.name} fill className="object-cover" />
                            ) : (
                                product.seller.name[0]
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 flex items-center gap-1">
                                {product.seller.name}
                                {product.seller.isVerified && (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                            </h3>
                            <p className="text-sm text-gray-500">2023 оноос гишүүн</p>
                        </div>
                    </div>

                    {/* Bank Account Copy Button */}
                    {bankAccount && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                            <div className="flex items-center gap-2 mb-3">
                                <Banknote className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-blue-900">Төлбөр шилжүүлэх</span>
                            </div>

                            {/* Main Account */}
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100">
                                <div className="flex-1">
                                    <p className="text-xs text-blue-600 mb-0.5">🏦 {bankName || "Банк"}</p>
                                    <p className="font-mono text-lg font-bold text-blue-900">{bankAccount}</p>
                                </div>
                                <button
                                    onClick={() => handleCopyBankAccount('account')}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${copied && copiedType === 'account'
                                        ? "bg-green-500 text-white"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                        }`}
                                >
                                    {copied && copiedType === 'account' ? (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Хуулсан!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-5 h-5" />
                                            Хуулах
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* IBAN - if available */}
                            {bankIBAN && (
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100 mt-2">
                                    <div className="flex-1">
                                        <p className="text-xs text-purple-600 mb-0.5">🌍 IBAN (Олон улсын)</p>
                                        <p className="font-mono text-sm font-bold text-purple-900">{bankIBAN}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCopyBankAccount('iban')}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${copied && copiedType === 'iban'
                                            ? "bg-green-500 text-white"
                                            : "bg-purple-600 text-white hover:bg-purple-700"
                                            }`}
                                    >
                                        {copied && copiedType === 'iban' ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Хуулсан!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                IBAN
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            <p className="text-xs text-blue-600 mt-3">
                                💡 Дарсны дараа банкны апп руугаа орж Paste хийнэ үү
                            </p>
                        </div>
                    )}

                    {/* Description */}
                    <div className="mb-8">
                        <h3 className="font-bold text-gray-900 mb-2">Тайлбар</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {(product as any).description || `Өндөр чанартай ${product.title.toLowerCase()} борлуулна. Шууд үйлдвэрлэгчээс. Шинэ бөгөөд органик.`}
                        </p>
                    </div>

                    {/* Safety Warning */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-8">
                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-900 mb-1">⚠️ Анхааруулга</p>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <strong>Түрүүлж мөнгө бүү шилжүүлээрэй!</strong> Энэ сайт нь зөвхөн зар нийтлэх талбар бөгөөд худалдааны эрсдлийг хариуцахгүй.
                                Худалдагчтай сайтар ярилцаж, тохиролцсоны дараа л мөнгөө шилжүүлнэ үү. Боломжтой бол барааг биетээр үзээрэй.
                            </p>
                        </div>
                    </div>

                    {/* Review Section */}
                    <ReviewSection productId={product.id} />
                </div>

                {/* Sticky Action Bar - Mobile */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3 sm:hidden z-40">
                    <button
                        onClick={toggleSave}
                        className={`p-3 rounded-xl border transition-colors ${isSaved
                            ? "bg-red-50 border-red-100 text-red-500"
                            : "bg-white border-gray-200 text-gray-900"
                            }`}
                    >
                        <Heart className={`w-6 h-6 ${isSaved ? "fill-current" : ""}`} />
                    </button>
                    <button
                        onClick={handleCallClick}
                        className="flex-1 bg-white border border-gray-200 text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <Phone className="w-5 h-5" />
                        Залгах
                    </button>
                    <button
                        onClick={handleChatClick}
                        className="flex-1 bg-primary text-secondary font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-yellow-500/20"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Чатлах
                    </button>
                </div>

                {/* Desktop Action Bar */}
                <div className="hidden sm:flex max-w-4xl mx-auto px-4 gap-4 mb-12">
                    <button
                        onClick={toggleSave}
                        className={`px-6 py-3 rounded-xl border transition-colors flex items-center gap-2 font-medium ${isSaved
                            ? "bg-red-50 border-red-100 text-red-500"
                            : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                            }`}
                    >
                        <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
                        {isSaved ? "Хадгалсан" : "Хадгалах"}
                    </button>
                    <button
                        onClick={handleCallClick}
                        className="px-8 py-3 bg-white border border-gray-200 text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                        <Phone className="w-5 h-5" />
                        Залгах
                    </button>
                    <button
                        onClick={handleChatClick}
                        className="px-8 py-3 bg-primary text-secondary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Чатлах
                    </button>
                </div>
            </div>
        </div>
    );
}
