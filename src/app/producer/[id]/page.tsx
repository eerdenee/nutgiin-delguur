"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Star, Phone, Award } from "lucide-react";
import { MOCK_PRODUCERS, MOCK_PRODUCTS } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

export default function ProducerProfilePage() {
    const params = useParams();
    const producerId = params.id as string;

    const producer = MOCK_PRODUCERS.find((p) => p.id === producerId);
    const producerProducts = MOCK_PRODUCTS.filter((p) => p.seller.name.includes(producer?.name.split(" ")[0] || ""));

    if (!producer) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Үйлдвэрлэгч олдсонгүй</h1>
                    <Link href="/" className="text-primary font-bold hover:underline">
                        Нүүр хуудас руу буцах
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Image */}
            <div className="relative h-48 bg-gray-200">
                <img
                    src={producer.image}
                    alt={producer.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Link
                    href="/"
                    className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
            </div>

            {/* Profile Info */}
            <div className="relative px-4 -mt-12">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 mb-1">{producer.name}</h1>
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                                <MapPin className="w-4 h-4" />
                                {producer.location.aimag}, {producer.location.soum}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold text-yellow-700">{producer.rating}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {producer.isFamous && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary-dark text-xs font-bold rounded-lg">
                                <Award className="w-3 h-3" />
                                Шилдэг үйлдвэрлэгч
                            </span>
                        )}
                        {producer.products.map((p, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                                {p}
                            </span>
                        ))}
                    </div>

                    <button className="w-full bg-primary text-secondary font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors active:scale-95">
                        <Phone className="w-5 h-5" />
                        Холбоо барих
                    </button>
                </div>
            </div>

            {/* Products */}
            <div className="px-4 mt-6">
                <h2 className="font-bold text-lg text-gray-900 mb-4">Борлуулж буй бараанууд</h2>
                {producerProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {producerProducts.map((product) => (
                            <ProductCard key={product.id} {...product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <p className="text-gray-500 text-sm">Одоогоор бараа байхгүй байна.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
