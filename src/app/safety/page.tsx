import Link from "next/link";
import { ArrowLeft, ShieldCheck, AlertTriangle, UserCheck, Phone, Eye, Lock } from "lucide-react";

export default function SafetyPage() {
    const safetyTips = [
        {
            icon: UserCheck,
            title: "Биечлэн уулзаж барааг шалгах",
            description: "Боломжтой бол худалдагчтай биечлэн уулзаж, барааг өөрийн нүдээр шалгаарай. Зураг дээр сайн харагдах бараа бодит байдал дээр өөр байж болно."
        },
        {
            icon: Phone,
            title: "Утсаар ярьж баталгаажуулах",
            description: "Худалдагчтай утсаар ярьж, барааны талаар дэлгэрэнгүй асууж, итгэл үнэмшил төрүүлсний дараа л төлбөр төлөөрэй."
        },
        {
            icon: Lock,
            title: "Урьдчилгаа төлбөрөөс зайлсхийх",
            description: "Барааг хараагүй байхдаа бүрэн дүнгээр урьдчилж төлөхөөс зайлсхийгээрэй. Боломжтой бол гар дээр авч өгөх арга хэлбэрийг сонгоорой."
        },
        {
            icon: Eye,
            title: "Хэт хямд үнэд анхаарах",
            description: "Хэрэв бараа зах зээлийн үнээс хэт доогуур бол сэжиглээрэй. Залилан нь ихэвчлэн 'хямд үнэ'-ээр хэрэглэгчийг татдаг."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Буцах</span>
                </Link>

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 mb-6">
                    <div className="flex items-center gap-3 mb-8 border-b pb-6">
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Аюулгүй ажиллагаа</h1>
                    </div>

                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Nutgiin Delguur нь зөвхөн худалдагч болон худалдан авагчийг холбох платформ юм. Бид худалдааны явц дахь аливаа залилан, хохирлыг хариуцах боломжгүй тул та доорх зөвлөмжийг анхааралтай уншиж, өөрийгөө хамгаалаарай.
                    </p>

                    <div className="space-y-6">
                        {safetyTips.map((tip, index) => (
                            <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                                    <tip.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">{tip.title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{tip.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Report Section */}
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-900 mb-2">Залилан мэдээлэх</h3>
                            <p className="text-sm text-red-800 mb-4">
                                Хэрэв та залилангийн хохирогч болсон эсвэл сэжигтэй зар олсон бол бидэнд мэдэгдээрэй. Бид шуурхай арга хэмжээ авах болно.
                            </p>
                            <Link
                                href="/feedback"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                                Мэдээлэл илгээх
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
