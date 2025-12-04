"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle, ChevronDown, Search, MessageCircle } from "lucide-react";

const FAQ_DATA = [
    {
        category: "Ерөнхий",
        questions: [
            {
                q: "Nutgiin Delguur гэж юу вэ?",
                a: "Nutgiin Delguur нь Монголын орон нутгийн үйлдвэрлэгчид, тариаланчид, бизнес эрхлэгчдийг худалдан авагчидтай холбох зуучлалын платформ юм. Бид бараа бүтээгдэхүүнийг шууд борлуулдаггүй, зөвхөн зар нийтлэх орон зай хангадаг."
            },
            {
                q: "Сайт үнэ төлбөртэй юу?",
                a: "Үндсэн зар оруулах нь үнэгүй. Гэхдээ таны зарыг илүү олон хүнд харуулах 'Онцлох зар', 'Аймгийн TOP', 'Улсын TOP' гэсэн төлбөртэй сонголтууд байдаг."
            }
        ]
    },
    {
        category: "Зар оруулах",
        questions: [
            {
                q: "Зарийг хэрхэн оруулах вэ?",
                a: "Доод талын '+ Зар нэмэх' товчийг дарж, барааны мэдээлэл, зураг, үнэ, байршлаа оруулаад 'Нийтлэх' дарна уу. Таны зар шууд харагдах болно."
            },
            {
                q: "Нэг хэрэглэгч хэдэн зар оруулж болох вэ?",
                a: "Хязгааргүй. Гэхдээ ижил агуулгатай зар давтан оруулахыг хориглоно."
            },
            {
                q: "Зарыг хэрхэн засах, устгах вэ?",
                a: "'Миний зарууд' хэсэгт орж, тухайн зар дээр дарж, 'Засах' эсвэл 'Устгах' сонголтыг ашиглана уу."
            }
        ]
    },
    {
        category: "Төлбөр",
        questions: [
            {
                q: "Төлбөрийг хэрхэн хийх вэ?",
                a: "Сайт нь төлбөрийн системийг хариуцдаггүй. Худалдагч болон худалдан авагч нь хоорондоо шууд тохиролцож, данс шилжүүлэг эсвэл бэлнээр тооцоо хийнэ."
            },
            {
                q: "'Онцлох зар' үйлчилгээний төлбөр хэд вэ?",
                a: "Онцлох зар нь долоо хоногт 5,000₮, сарын 15,000₮. Аймгийн TOP 5 нь сард 30,000₮, Улсын TOP 5 нь сард 100,000₮."
            }
        ]
    },
    {
        category: "Аюулгүй байдал",
        questions: [
            {
                q: "Хэрэв залилангийн хохирогч болвол яах вэ?",
                a: "Нэн даруй Цагдаагийн байгууллагад хандаж, бидэнд 'Санал хүсэлт' хэсгээр дамжуулан мэдэгдээрэй. Бид тухайн хэрэглэгчийн бүртгэлийг хаах арга хэмжээ авна."
            },
            {
                q: "Миний хувийн мэдээлэл хамгаалагдсан уу?",
                a: "Тийм. Бид таны нууц үгийг шифрлэн хадгалдаг бөгөөд утасны дугаарыг зөвхөн таны зөвшөөрлөөр нийтэд харуулна."
            }
        ]
    }
];

export default function HelpPage() {
    const [openIndex, setOpenIndex] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFAQ = FAQ_DATA.map(category => ({
        ...category,
        questions: category.questions.filter(
            q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.questions.length > 0);

    const toggleQuestion = (key: string) => {
        setOpenIndex(prev => prev === key ? null : key);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Буцах</span>
                </Link>

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <HelpCircle className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Тусламж</h1>
                    </div>

                    {/* Search */}
                    <div className="relative mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Асуулт хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                    </div>

                    {/* FAQ Accordion */}
                    <div className="space-y-6">
                        {filteredFAQ.map((category, catIndex) => (
                            <div key={catIndex}>
                                <h2 className="font-bold text-gray-900 mb-3 text-lg">{category.category}</h2>
                                <div className="space-y-2">
                                    {category.questions.map((item, qIndex) => {
                                        const key = `${catIndex}-${qIndex}`;
                                        const isOpen = openIndex === key;

                                        return (
                                            <div key={key} className="border border-gray-100 rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => toggleQuestion(key)}
                                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                                >
                                                    <span className="font-medium text-gray-900 pr-4">{item.q}</span>
                                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                                                </button>
                                                {isOpen && (
                                                    <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-3 bg-gray-50">
                                                        {item.a}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {filteredFAQ.length === 0 && (
                            <div className="text-center py-10 text-gray-500">
                                <HelpCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                <p>"{searchQuery}" гэсэн хайлтад тохирох асуулт олдсонгүй.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Support */}
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shrink-0">
                        <MessageCircle className="w-6 h-6" />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">Асуултад хариулт олдсонгүй юу?</h3>
                        <p className="text-sm text-gray-600">Бидэнтэй холбогдож, асуултаа илгээгээрэй.</p>
                    </div>
                    <Link
                        href="/feedback"
                        className="px-6 py-3 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors text-sm"
                    >
                        Холбогдох
                    </Link>
                </div>
            </div>
        </div>
    );
}
