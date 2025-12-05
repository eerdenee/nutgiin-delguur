"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Upload, Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProducerVerifyPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        phone: "",
        businessName: "",
    });
    const [files, setFiles] = useState<{
        idFront: File | null;
        idBack: File | null;
        selfie: File | null;
    }>({
        idFront: null,
        idBack: null,
        selfie: null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idFront' | 'idBack' | 'selfie') => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'verification');

        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session?.access_token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Image upload failed');
        }

        const data = await response.json();
        return data.url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert("Нэвтрэх шаардлагатай");
                router.push("/login");
                return;
            }

            if (!files.idFront || !files.idBack || !files.selfie) {
                alert("Бүх зургийг оруулна уу");
                return;
            }

            // 2. Upload images
            const idFrontUrl = await uploadImage(files.idFront);
            const idBackUrl = await uploadImage(files.idBack);
            const selfieUrl = await uploadImage(files.selfie);

            // 3. Insert into verification_requests
            const verificationData = {
                user_id: user.id,
                phone: formData.phone,
                business_name: formData.businessName,
                id_front_url: idFrontUrl,
                id_back_url: idBackUrl,
                selfie_url: selfieUrl,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            const { error } = await (supabase
                .from('verification_requests') as any)
                .insert(verificationData);

            if (error) throw error;

            setIsSuccess(true);
            setTimeout(() => {
                router.push("/dashboard");
            }, 3000);

        } catch (error) {
            console.error("Error submitting verification:", error);
            alert("Алдаа гарлаа. Дахин оролдоно уу.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Хүсэлт амжилттай илгээгдлээ!</h2>
                <p className="text-gray-600 mb-8 max-w-sm">
                    Таны мэдээллийг админ шалгаад 24 цагийн дотор хариу мэдэгдэх болно.
                </p>
                <Link href="/dashboard" className="text-primary font-bold hover:underline">
                    Дэшбоард руу буцах
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </Link>
                <h1 className="font-bold text-lg">Үйлдвэрлэгч болох</h1>
            </div>

            <div className="max-w-lg mx-auto px-4 mt-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-800">
                        Та зар оруулахын тулд өөрийн биеийн байцаалтыг баталгаажуулах шаардлагатай. Энэ нь хуурамч зар болон залилангаас сэргийлэх зорилготой юм.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Info */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900">Хувийн мэдээлэл</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Утасны дугаар <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-3"
                                placeholder="99112233"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Бизнесийн нэр (Заавал биш)
                            </label>
                            <input
                                type="text"
                                value={formData.businessName}
                                onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-3"
                                placeholder="Жишээ: Монгол Гутал ХХК"
                            />
                        </div>
                    </div>

                    {/* ID Uploads */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-6">
                        <h3 className="font-bold text-gray-900">Бичиг баримт</h3>

                        {/* ID Front */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Иргэний үнэмлэх (Урд тал) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    required
                                    onChange={e => handleFileChange(e, 'idFront')}
                                    className="hidden"
                                    id="id-front"
                                />
                                <label
                                    htmlFor="id-front"
                                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${files.idFront ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-primary hover:bg-gray-50"
                                        }`}
                                >
                                    {files.idFront ? (
                                        <div className="flex items-center gap-2 text-green-700">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="text-sm font-medium">Зураг сонгогдлоо</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Camera className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-xs text-gray-500">Зураг оруулах</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* ID Back */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Иргэний үнэмлэх (Ард тал) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    required
                                    onChange={e => handleFileChange(e, 'idBack')}
                                    className="hidden"
                                    id="id-back"
                                />
                                <label
                                    htmlFor="id-back"
                                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${files.idBack ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-primary hover:bg-gray-50"
                                        }`}
                                >
                                    {files.idBack ? (
                                        <div className="flex items-center gap-2 text-green-700">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="text-sm font-medium">Зураг сонгогдлоо</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Camera className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-xs text-gray-500">Зураг оруулах</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Selfie */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Үнэмлэхээ барьсан селфи зураг <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    required
                                    onChange={e => handleFileChange(e, 'selfie')}
                                    className="hidden"
                                    id="selfie"
                                />
                                <label
                                    htmlFor="selfie"
                                    className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${files.selfie ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-primary hover:bg-gray-50"
                                        }`}
                                >
                                    {files.selfie ? (
                                        <div className="flex items-center gap-2 text-green-700">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="text-sm font-medium">Зураг сонгогдлоо</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Camera className="w-10 h-10 text-gray-400 mb-2" />
                                            <span className="text-xs text-gray-500">Зураг оруулах</span>
                                            <span className="text-[10px] text-gray-400 mt-1 text-center px-4">
                                                Нүүр царай болон үнэмлэхний мэдээлэл тод гарсан байх ёстой
                                            </span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-primary text-secondary font-bold rounded-xl shadow-lg hover:bg-yellow-400 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                <span>Хүсэлт илгээх</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
