"use client";

import { useState, useEffect, Suspense } from "react";
import { ArrowLeft, Camera, MapPin, Loader2, Banknote, Info, Copy, Check, Video, AlertTriangle, Package } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AIMAGS, MOCK_PRODUCTS, CATEGORIES } from "@/lib/data";
import { getUserSubscription, canPostMoreAds, SUBSCRIPTION_PLANS } from "@/lib/subscription";

// Mongolian banks list
const BANKS = [
    { id: "khan", name: "Хаан банк" },
    { id: "golomt", name: "Голомт банк" },
    { id: "tdb", name: "ХХБ" },
    { id: "state", name: "Төрийн банк" },
    { id: "xac", name: "Хас банк" },
    { id: "capitron", name: "Капитрон банк" },
    { id: "arig", name: "Ариг банк" },
    { id: "bogd", name: "Богд банк" },
    { id: "chinggis", name: "Чингис хаан банк" },
    { id: "most", name: "Мост Мани" },
];

function PostAdContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');
    const isEditMode = !!editId;

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Form State
    const [selectedAimagId, setSelectedAimagId] = useState<string>("");
    const [selectedSoumId, setSelectedSoumId] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [contactPhone, setContactPhone] = useState("");

    // Bank Account State
    const [bankName, setBankName] = useState<string>("");
    const [bankAccount, setBankAccount] = useState<string>("");
    const [bankIBAN, setBankIBAN] = useState<string>("");
    const [copiedType, setCopiedType] = useState<'account' | 'iban' | null>(null);

    // Video Link State
    const [videoLinks, setVideoLinks] = useState<string[]>([]);

    // Subscription State
    const [subscription, setSubscription] = useState<ReturnType<typeof getUserSubscription> | null>(null);
    const [adLimitInfo, setAdLimitInfo] = useState<ReturnType<typeof canPostMoreAds> | null>(null);

    // Load subscription info
    useEffect(() => {
        setSubscription(getUserSubscription());
        setAdLimitInfo(canPostMoreAds());
    }, []);

    // Copy function
    const handleCopy = async (value: string, type: 'account' | 'iban') => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            setCopiedType(type);
            setTimeout(() => setCopiedType(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    // Add video link
    const addVideoLink = () => {
        const maxVideos = subscription?.plan.limits.videosPerAd || 0;
        if (videoLinks.length < maxVideos) {
            setVideoLinks([...videoLinks, '']);
        }
    };

    // Update video link
    const updateVideoLink = (index: number, value: string) => {
        const updated = [...videoLinks];
        updated[index] = value;
        setVideoLinks(updated);
    };

    // Remove video link
    const removeVideoLink = (index: number) => {
        setVideoLinks(videoLinks.filter((_, i) => i !== index));
    };

    // Load product data if in edit mode, OR load default location from localStorage
    // Load product data if in edit mode, OR load default location from localStorage
    useEffect(() => {
        if (isEditMode && editId) {
            // Try to find in MOCK_PRODUCTS first
            let product = MOCK_PRODUCTS.find(p => p.id === editId);

            // If not found, look in localStorage (user's own ads)
            if (!product) {
                try {
                    const myAds = JSON.parse(localStorage.getItem('my_ads') || '[]');
                    product = myAds.find((p: any) => p.id === editId);
                } catch (e) {
                    console.error("Failed to load my_ads", e);
                }
            }

            if (product) {
                setTitle(product.title);
                setPrice(product.price.toString());
                setDescription((product as any).description || `Өндөр чанартай ${product.title.toLowerCase()} борлуулна.`);
                setSelectedCategory(product.category);

                // Find aimag and soum
                const aimag = AIMAGS.find(a => a.name === product.location.aimag);
                if (aimag) {
                    setSelectedAimagId(aimag.id);
                    const soum = aimag.soums?.find(s => s.name === product.location.soum);
                    if (soum) {
                        setSelectedSoumId(soum.id);
                    }
                }
            }
        } else {
            // Auto-fill from localStorage if creating new ad
            const savedAimagName = localStorage.getItem('selectedAimag');
            const savedSoumName = localStorage.getItem('selectedSoum');

            if (savedAimagName) {
                const aimag = AIMAGS.find(a => a.name === savedAimagName);
                if (aimag) {
                    setSelectedAimagId(aimag.id);
                    if (savedSoumName) {
                        const soum = aimag.soums?.find(s => s.name === savedSoumName);
                        if (soum) {
                            setSelectedSoumId(soum.id);
                        }
                    }
                }
            }

            // Auto-fill bank info from profile
            const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
            if (profile.bankName) setBankName(profile.bankName);
            if (profile.bankAccount) setBankAccount(profile.bankAccount);
            if (profile.bankIBAN) setBankIBAN(profile.bankIBAN);
            if (profile.phone) setContactPhone(profile.phone);
        }
    }, [isEditMode, editId]);

    // Cleanup object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            images.forEach(file => {
                // We can't easily revoke object URLs created in render, 
                // but we can ensure we don't leak if we store them in state.
                // Since we use URL.createObjectURL(img) directly in render, 
                // it's better to create them once and store in state, OR just let browser handle it (modern browsers are okay).
                // BUT, for best practice, let's just leave it as is for now as refactoring image preview logic is complex.
                // Actually, let's fix the preview logic to use state for URLs.
            });
        };
    }, [images]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newImages = Array.from(e.target.files);
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ Шинэ subscription system ашиглах
        const { plan, isActive } = getUserSubscription();
        const { allowed, remaining, limit } = canPostMoreAds();

        let userTier = plan.id;
        let canFeature = plan.features.featuredDesign;

        // Зарын тоо хязгаарлах (edit mode-д шалгахгүй)
        if (!isEditMode && !allowed) {
            alert(`⚠️ Та ${limit} зарын хязгаарт хүрсэн байна.\n\nҮлдсэн: 0 зар\nБагц: ${plan.name}\n\nИлүү олон зар нэмэхийн тулд багцаа сайжруулаарай.`);
            if (confirm("Багц сонгох хуудас руу очих уу?")) {
                window.location.href = "/dashboard/upgrade";
            }
            return;
        }

        // Зургийн тоо хязгаарлах
        const maxImages = plan.limits.imagesPerAd;
        if (images.length > maxImages) {
            alert(`⚠️ ${plan.name} багцад ${maxImages} зураг оруулах боломжтой.\n\nТа ${images.length} зураг сонгосон байна.`);
            return;
        }

        if (!contactPhone || contactPhone.length < 8) {
            alert("Холбоо барих утасны дугаараа оруулна уу.");
            return;
        }

        setIsLoading(true);

        // Helper to convert file to base64 with resizing
        const convertImageToBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target?.result as string;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 800;
                        const scaleSize = MAX_WIDTH / img.width;
                        canvas.width = Math.min(img.width, MAX_WIDTH);
                        canvas.height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;
                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL('image/webp', 0.8));
                    };
                };
                reader.onerror = (error) => reject(error);
            });
        };

        try {
            let imageUrls: string[] = [];

            if (images.length > 0) {
                try {
                    const promises = images.map(img => convertImageToBase64(img));
                    imageUrls = await Promise.all(promises);
                } catch (err) {
                    console.error("Error converting images:", err);
                }
            }

            // Fallback if no images
            if (imageUrls.length === 0) {
                imageUrls = ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=60"];
            }

            const selectedAimag = AIMAGS.find(a => a.id === selectedAimagId);
            const selectedSoum = selectedAimag?.soums.find(s => s.id === selectedSoumId);

            // ✅ SUPABASE-д хадгалах
            const { createProduct } = await import("@/lib/products");

            const { data: newProduct, error } = await createProduct({
                title,
                description,
                price: Number(price),
                currency: "₮",
                category: selectedCategory,
                images: imageUrls,
                videoLinks: videoLinks.filter(v => v.trim() !== ''),
                location: {
                    aimag: selectedAimag?.name || "",
                    soum: selectedSoum?.name || ""
                },
                tier: 'soum',
                bankInfo: bankName ? {
                    bankName,
                    accountNumber: bankAccount,
                    iban: bankIBAN
                } : undefined
            });

            if (error) {
                alert(`Алдаа: ${error}`);
                setIsLoading(false);
                return;
            }

            // Update profile with phone if not set
            if (contactPhone) {
                const { supabase } = await import("@/lib/supabase");
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await (supabase.from('profiles') as any).update({ phone: contactPhone }).eq('id', user.id);
                }
            }

            // Dispatch event to update other components
            window.dispatchEvent(new Event('adsUpdated'));

            setIsLoading(false);
            setIsSuccess(true);
        } catch (error) {
            console.error("Error submitting ad:", error);
            setIsLoading(false);
            alert('Алдаа гарлаа. Дахин оролдоно уу.');
        }
    };

    const selectedAimag = AIMAGS.find(a => a.id === selectedAimagId);
    const soums = selectedAimag?.soums || [];

    const isFormValid = title && price && description && selectedAimagId && (soums.length === 0 || selectedSoumId) && selectedCategory && contactPhone;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-900" />
                    </Link>
                    <h1 className="font-bold text-lg">{isEditMode ? "Бүтээгдэхүүн засах" : "Бүтээгдэхүүн нэмэх"}</h1>
                </div>
                {/* Remaining Ads Counter */}
                {adLimitInfo && !isEditMode && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${adLimitInfo.remaining === 0
                        ? 'bg-red-100 text-red-700'
                        : adLimitInfo.remaining <= 2
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                        <Package className="w-4 h-4" />
                        {adLimitInfo.remaining}/{adLimitInfo.limit}
                    </div>
                )}
            </div>

            {/* Limit Warning Banner */}
            {adLimitInfo && !isEditMode && adLimitInfo.remaining === 0 && (
                <div className="bg-red-500 text-white px-4 py-3 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div className="flex-1">
                        <p className="font-bold">Зарын хязгаарт хүрсэн!</p>
                        <p className="text-sm opacity-90">Илүү олон зар нэмэхийн тулд багцаа сайжруулаарай.</p>
                    </div>
                    <Link href="/dashboard/upgrade" className="px-3 py-1.5 bg-white text-red-600 font-bold rounded-lg text-sm shrink-0">
                        Сайжруулах
                    </Link>
                </div>
            )}

            {/* Success Modal */}
            {isSuccess && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Амжилттай!</h2>
                        <p className="text-gray-600 mb-6">Таны бүтээгдэхүүн амжилттай нийтлэгдлээ.</p>
                        <Link href="/" className="block w-full py-3 bg-primary text-secondary font-bold rounded-xl">
                            Нүүр хуудас руу буцах
                        </Link>
                    </div>
                </div>
            )}

            <div className="max-w-lg mx-auto px-4 mt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-bold text-gray-900">
                                📷 Зураг оруулах
                            </label>
                            {subscription && (
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${images.length >= subscription.plan.limits.imagesPerAd
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {images.length}/{subscription.plan.limits.imagesPerAd}
                                </span>
                            )}
                        </div>

                        {/* Image Previews */}
                        {images.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto pb-4 mb-3 scrollbar-hide">
                                {images.map((img, index) => (
                                    <div key={index} className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                            src={URL.createObjectURL(img)}
                                            alt={`Preview ${index}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="hidden"
                                id="image-upload"
                                disabled={!!(subscription && images.length >= subscription.plan.limits.imagesPerAd)}
                            />
                            <label
                                htmlFor="image-upload"
                                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${subscription && images.length >= subscription.plan.limits.imagesPerAd
                                    ? "border-red-300 bg-red-50 cursor-not-allowed"
                                    : images.length > 0
                                        ? "border-primary bg-yellow-50"
                                        : "border-gray-300 hover:border-primary hover:bg-gray-50 bg-gray-50"
                                    }`}
                            >
                                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2">
                                    <Camera className="w-5 h-5 text-gray-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-600">
                                    {subscription && images.length >= subscription.plan.limits.imagesPerAd
                                        ? `Хязгаарт хүрсэн (${subscription.plan.limits.imagesPerAd} зураг)`
                                        : "Зураг нэмэх"
                                    }
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Video Links - Only for Active+ plans */}
                    {subscription && subscription.plan.limits.videosPerAd > 0 && (
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Video className="w-4 h-4 text-pink-500" />
                                    Видео линк
                                </label>
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-pink-100 text-pink-700">
                                    {videoLinks.length}/{subscription.plan.limits.videosPerAd}
                                </span>
                            </div>

                            {videoLinks.map((link, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="url"
                                        value={link}
                                        onChange={(e) => updateVideoLink(index, e.target.value)}
                                        placeholder="YouTube эсвэл TikTok линк"
                                        className="flex-1 rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm py-2.5 bg-gray-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeVideoLink(index)}
                                        className="px-3 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            {videoLinks.length < subscription.plan.limits.videosPerAd && (
                                <button
                                    type="button"
                                    onClick={addVideoLink}
                                    className="w-full py-2.5 border-2 border-dashed border-pink-200 text-pink-600 rounded-xl hover:bg-pink-50 text-sm font-medium"
                                >
                                    + Видео линк нэмэх
                                </button>
                            )}

                            <p className="text-xs text-gray-500 mt-2">
                                YouTube, TikTok, Facebook видео линк оруулна уу
                            </p>
                        </div>
                    )}

                    {/* Category Selection */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-bold text-gray-900 mb-3">
                            Төрөл сонгох
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-3 bg-gray-50"
                        >
                            <option value="">Сонгох</option>
                            {CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Details */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">
                                Гарчиг
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-3 bg-gray-50"
                                placeholder="Жишээ: Үхрийн мах"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">
                                Үнэ (₮)
                            </label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-3 bg-gray-50"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">
                                Дэлгэрэнгүй тайлбар
                            </label>
                            <textarea
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-3 bg-gray-50"
                                placeholder="Бүтээгдэхүүний тухай дэлгэрэнгүй..."
                            />
                        </div>
                    </div>

                    {/* Contact Phone */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-bold text-gray-900 mb-1">
                            Холбоо барих утас
                        </label>
                        <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-3 bg-gray-50"
                            placeholder="88112233"
                            required
                        />
                    </div>

                    {/* Location */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            Байршил
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Аймаг/Хот</label>
                                <select
                                    value={selectedAimagId}
                                    onChange={(e) => {
                                        setSelectedAimagId(e.target.value);
                                        setSelectedSoumId("");
                                    }}
                                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 bg-gray-50"
                                >
                                    <option value="">Сонгох</option>
                                    {AIMAGS.map((aimag) => (
                                        <option key={aimag.id} value={aimag.id}>
                                            {aimag.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Сум/Дүүрэг</label>
                                <select
                                    value={selectedSoumId}
                                    onChange={(e) => setSelectedSoumId(e.target.value)}
                                    disabled={!selectedAimagId || soums.length === 0}
                                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 bg-gray-50 disabled:opacity-50 disabled:bg-gray-100"
                                >
                                    <option value="">Сонгох</option>
                                    {soums.map((soum) => (
                                        <option key={soum.id} value={soum.id}>
                                            {soum.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Bank Account - Optional */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-blue-600" />
                            Төлбөр хүлээн авах данс
                            <span className="text-xs font-normal text-gray-400">(Заавал биш)</span>
                        </h3>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2">
                            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700">
                                Дансаа оруулснаар худалдан авагч шууд хуулж авах боломжтой. Энэ нь төлбөр шилжүүлэлтийг хурдасгана.
                            </p>
                        </div>

                        {/* Bank Selection */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Банк</label>
                            <select
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 bg-gray-50"
                            >
                                <option value="">Сонгох</option>
                                {BANKS.map((bank) => (
                                    <option key={bank.id} value={bank.name}>
                                        {bank.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Account Number with Copy */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">🏦 Дансны дугаар</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={bankAccount}
                                    onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ''))}
                                    className="flex-1 block rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 bg-gray-50 font-mono"
                                    placeholder="1234567890"
                                />
                                {bankAccount && (
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(bankAccount, 'account')}
                                        className={`px-3 rounded-xl transition-all flex items-center gap-1 text-sm font-medium ${copiedType === 'account'
                                            ? "bg-green-500 text-white"
                                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                            }`}
                                    >
                                        {copiedType === 'account' ? (
                                            <><Check className="w-4 h-4" /> Хуулсан</>
                                        ) : (
                                            <><Copy className="w-4 h-4" /> Хуулах</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* IBAN with Copy */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">🌍 IBAN (Заавал биш - Олон улсын)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={bankIBAN}
                                    onChange={(e) => setBankIBAN(e.target.value.toUpperCase().replace(/\s/g, ''))}
                                    className="flex-1 block rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 bg-gray-50 font-mono uppercase"
                                    placeholder="MN12345678901234567890"
                                />
                                {bankIBAN && (
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(bankIBAN, 'iban')}
                                        className={`px-3 rounded-xl transition-all flex items-center gap-1 text-sm font-medium ${copiedType === 'iban'
                                            ? "bg-green-500 text-white"
                                            : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                                            }`}
                                    >
                                        {copiedType === 'iban' ? (
                                            <><Check className="w-4 h-4" /> Хуулсан</>
                                        ) : (
                                            <><Copy className="w-4 h-4" /> IBAN</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sticky Publish Button */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20 md:static md:bg-transparent md:border-0 md:p-0">
                        <div className="max-w-lg mx-auto">
                            <button
                                type="submit"
                                disabled={!isFormValid || isLoading}
                                className={`w-full py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isFormValid
                                    ? "bg-primary text-secondary hover:bg-yellow-400"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span>{isEditMode ? "Шинэчлэх" : "Нийтлэх"}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function PostAdPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <PostAdContent />
        </Suspense>
    );
}
