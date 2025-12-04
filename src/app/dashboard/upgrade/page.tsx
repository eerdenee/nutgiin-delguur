"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle, Sparkles, Rocket, Zap, Crown, ArrowUpCircle, Building2, Image, Video, Users, Star } from "lucide-react";

export default function UpgradePage() {
    const pricingPlans = [
        {
            name: "ЭХЛЭЛ",
            tier: "start",
            price: "0₮",
            period: "",
            features: [
                "Сард 3 зар оруулах",
                "3 зураг оруулах эрх",
                "7 хоногийн хугацаатай",
                "Энгийн жагсаалт"
            ],
            borderColor: "border-gray-200",
            bgColor: "bg-white",
            textColor: "text-gray-900",
            buttonText: "Одоогийн багц",
            buttonClass: "bg-gray-100 text-gray-600 cursor-default",
            icon: <Rocket className="w-6 h-6 text-gray-400" />
        },
        {
            name: "ИДЭВХТЭЙ",
            tier: "active",
            price: "9,900₮",
            period: "/ сар",
            features: [
                "Сард 10 зар оруулах",
                "5 зураг + 1 Видео линк",
                "14 хоногийн хугацаатай",
                "Auto-Renew сунгалт",
                "Статистик харах"
            ],
            borderColor: "border-primary",
            bgColor: "bg-yellow-50",
            textColor: "text-gray-900",
            glow: true,
            recommended: true,
            buttonText: "Сонгох",
            buttonClass: "bg-primary text-secondary hover:bg-yellow-400",
            icon: <Zap className="w-6 h-6 text-primary" />
        },
        {
            name: "БИЗНЕС",
            tier: "business",
            price: "49,000₮",
            period: "/ сар",
            popular: true,
            features: [
                "Сард 100 зар оруулах",
                "10 зураг + 2 Видео линк",
                "30 хоногийн хугацаатай",
                "Компанийн лого харуулах",
                "Компанийн нэр бүртгэх",
                "Онцгой дизайн (Шар хүрээ)",
                "Дэлгэцний дээд байршил",
                "24/7 Тусламжийн үйлчилгээ",
                "Статистик + Аналитик"
            ],
            borderColor: "border-purple-400",
            bgColor: "bg-gradient-to-br from-purple-50 to-indigo-50",
            textColor: "text-purple-900",
            glow: true,
            buttonText: "Бизнес болох",
            buttonClass: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700",
            icon: <Building2 className="w-6 h-6 text-purple-600" />
        }
    ];

    const boostServices = [
        {
            name: "Дээшлүүлэх",
            price: "500₮",
            description: "Зарыг жагсаалтын хамгийн эхэнд аваачих",
            icon: <ArrowUpCircle className="w-6 h-6 text-blue-500" />,
            color: "bg-blue-50 border-blue-200"
        },
        {
            name: "Онцлох",
            price: "1,000₮",
            period: "/ 24 цаг",
            description: "Шар хүрээтэй, өнгөтэй болгох",
            icon: <Sparkles className="w-6 h-6 text-yellow-500" />,
            color: "bg-yellow-50 border-yellow-200"
        },
        {
            name: "VIP Байршил",
            price: "3,000₮",
            period: "/ 24 цаг",
            description: "Хамгийн дээр хадагдах",
            icon: <Crown className="w-6 h-6 text-purple-500" />,
            color: "bg-purple-50 border-purple-200"
        }
    ];

    const handleSelectPlan = (planName: string, price: string, tier: string) => {
        if (tier === "start") {
            alert("Та одоо ЭХЛЭЛ багцтай байна.");
            return;
        }

        // Багц мэдээллийг localStorage-д хадгалах
        const subscription = {
            plan: planName,
            price: price,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 хоног
            tier: tier
        };

        localStorage.setItem("userSubscription", JSON.stringify(subscription));

        // Төлбөрийн хуудас руу шилжих
        window.location.href = `/payment?plan=${encodeURIComponent(planName)}&price=${encodeURIComponent(price)}&tier=${tier}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10">
                <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </Link>
                <h1 className="font-bold text-lg">Багц сонгох</h1>
            </div>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-primary via-yellow-400 to-yellow-500 px-4 py-12">
                <div className="max-w-4xl mx-auto text-center">
                    <Sparkles className="w-12 h-12 text-white mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Борлуулалтаа нэмэгдүүл</h2>
                    <p className="text-gray-700 font-medium">
                        Өөрийн бүтээгдэхүүнээ олон мянган хэрэглэгчдэд хүргэж, онлайн борлуулалтаа эхлүүлээрэй
                    </p>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="max-w-5xl mx-auto px-4 -mt-8 mb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pricingPlans.map((plan, index) => (
                        <div
                            key={index}
                            className={`${plan.bgColor} border-2 ${plan.borderColor} rounded-2xl p-6 relative ${plan.glow ? "shadow-xl ring-2 ring-purple-200/50" : "shadow-lg"
                                } bg-white flex flex-col transition-transform hover:scale-[1.02] duration-300`}
                        >
                            {plan.recommended && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-secondary text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap z-10 shadow-sm">
                                    ⭐ Санал болгох
                                </div>
                            )}
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap z-10 shadow-sm flex items-center gap-1">
                                    <Crown className="w-3 h-3" /> БИЗНЕС
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <div className={`w-14 h-14 rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 border ${plan.tier === 'business' ? 'bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-200' : 'bg-white border-gray-100'
                                    }`}>
                                    {plan.icon}
                                </div>
                                <h3 className={`font-black text-xl mb-1 tracking-wide ${plan.tier === 'business' ? 'text-purple-700' : ''}`}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline justify-center gap-1 mt-3">
                                    <span className={`text-3xl font-black ${plan.textColor}`}>{plan.price}</span>
                                    {plan.period && <span className="text-xs text-gray-600 font-medium">{plan.period}</span>}
                                </div>
                            </div>

                            <div className={`rounded-xl p-4 mb-6 flex-grow border ${plan.tier === 'business' ? 'bg-purple-50/50 border-purple-100' : 'bg-gray-50/50 border-gray-100'
                                }`}>
                                <ul className="space-y-3">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                            <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.tier === 'business' ? 'text-purple-500' : 'text-green-500'
                                                }`} />
                                            <span className="font-medium">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={() => handleSelectPlan(plan.name, plan.price, plan.tier)}
                                className={`w-full py-3.5 rounded-xl font-bold transition-all text-sm mt-auto shadow-sm active:scale-95 ${plan.buttonClass}`}
                            >
                                {plan.buttonText}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Business Plan Features Highlight */}
            <div className="max-w-4xl mx-auto px-4 mb-12">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <Building2 className="w-8 h-8" />
                        <h3 className="font-bold text-xl">БИЗНЕС багцын онцлог</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/10 rounded-xl p-4 text-center">
                            <Image className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                            <p className="text-sm font-medium">10 Зураг</p>
                            <p className="text-xs text-white/70">Зар бүрт</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 text-center">
                            <Video className="w-8 h-8 mx-auto mb-2 text-pink-300" />
                            <p className="text-sm font-medium">2 Видео</p>
                            <p className="text-xs text-white/70">YouTube/TikTok</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 text-center">
                            <Users className="w-8 h-8 mx-auto mb-2 text-green-300" />
                            <p className="text-sm font-medium">100 Зар</p>
                            <p className="text-xs text-white/70">Сар бүр</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 text-center">
                            <Star className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                            <p className="text-sm font-medium">Компани Лого</p>
                            <p className="text-xs text-white/70">Брэнд таниулах</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Boost Services */}
            <div className="max-w-2xl mx-auto px-4 mb-12">
                <div className="flex items-center gap-2 mb-6">
                    <Rocket className="w-6 h-6 text-primary" />
                    <h3 className="font-bold text-xl text-gray-900">Нэмэлт үйлчилгээ (Boost)</h3>
                </div>

                <div className="grid gap-4">
                    {boostServices.map((service, index) => (
                        <div key={index} className={`flex items-center justify-between p-4 rounded-xl border ${service.color} bg-white shadow-sm hover:shadow-md transition-shadow`}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                    {service.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{service.name}</h4>
                                    <p className="text-sm text-gray-600">{service.description}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-primary">{service.price}</div>
                                {service.period && <div className="text-xs text-gray-500">{service.period}</div>}
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                    * Boost үйлчилгээг зар оруулсны дараа идэвхжүүлэх боломжтой
                </p>
            </div>

            {/* Plan Comparison Table */}
            <div className="max-w-4xl mx-auto px-4 mb-12">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">Багцуудын харьцуулалт</h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-2 font-medium text-gray-600">Онцлог</th>
                                <th className="text-center py-3 px-2 font-bold">ЭХЛЭЛ</th>
                                <th className="text-center py-3 px-2 font-bold text-primary">ИДЭВХТЭЙ</th>
                                <th className="text-center py-3 px-2 font-bold text-purple-600">БИЗНЕС</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="py-3 px-2 text-gray-700">Зарын тоо</td>
                                <td className="text-center py-3 px-2">3</td>
                                <td className="text-center py-3 px-2 text-primary font-medium">10</td>
                                <td className="text-center py-3 px-2 text-purple-600 font-bold">100</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-2 text-gray-700">Зургийн тоо</td>
                                <td className="text-center py-3 px-2">3</td>
                                <td className="text-center py-3 px-2">5</td>
                                <td className="text-center py-3 px-2 text-purple-600 font-bold">10</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-2 text-gray-700">Видео линк</td>
                                <td className="text-center py-3 px-2">❌</td>
                                <td className="text-center py-3 px-2">1</td>
                                <td className="text-center py-3 px-2 text-purple-600 font-bold">2</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-2 text-gray-700">Хугацаа</td>
                                <td className="text-center py-3 px-2">7 хоног</td>
                                <td className="text-center py-3 px-2">14 хоног</td>
                                <td className="text-center py-3 px-2 text-purple-600 font-bold">30 хоног</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-2 text-gray-700">Компани лого</td>
                                <td className="text-center py-3 px-2">❌</td>
                                <td className="text-center py-3 px-2">❌</td>
                                <td className="text-center py-3 px-2 text-green-500">✅</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-2 text-gray-700">Онцгой дизайн</td>
                                <td className="text-center py-3 px-2">❌</td>
                                <td className="text-center py-3 px-2">❌</td>
                                <td className="text-center py-3 px-2 text-green-500">✅</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-2 text-gray-700">Дээд байршил</td>
                                <td className="text-center py-3 px-2">❌</td>
                                <td className="text-center py-3 px-2">❌</td>
                                <td className="text-center py-3 px-2 text-green-500">✅</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Additional Info */}
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">Түгээмэл асуултууд</h3>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-1">Хэрхэн төлбөр төлөх вэ?</h4>
                            <p className="text-sm text-gray-600">Та QPay, банкны шилжүүлэг эсвэл бэлнээр төлбөр төлөх боломжтой.</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 mb-1">Багцаа цуцлах боломжтой юу?</h4>
                            <p className="text-sm text-gray-600">Тийм, та хүссэн үедээ багцаа цуцлах боломжтой. Төлсөн мөнгө буцаагдахгүй.</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 mb-1">БИЗНЕС багц ямар давуу талтай вэ?</h4>
                            <p className="text-sm text-gray-600">Компанийн лого, онцгой дизайн, илүү олон зар, дээд байршилд гарах зэрэг давуу талтай.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
