import Link from "next/link";
import { ArrowLeft, Scale, Mail, AlertTriangle, CheckCircle, FileText, Shield, Bot, Trash2 } from "lucide-react";

export default function LicensePage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-10">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Буцах</span>
                </Link>

                <div className="flex items-center gap-3 mb-8 border-b pb-6">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                        <Scale className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Лицензийн гэрээ</h1>
                        <p className="text-sm text-gray-500">Хүчин төгөлдөр: 2025 оны 12-р сарын 04 | Хувилбар 5.0</p>
                    </div>
                </div>

                <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
                    <p className="text-lg font-medium text-gray-900">
                        Энэхүү Лицензийн гэрээ нь Nutgiin Delguur платформ дээрх контент ашиглалт, оюуны өмчийн эрх, болон зохиогчийн эрхийн зөрчлийг зохицуулна.
                    </p>

                    {/* Section 1 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">1. Хэрэглэгчийн контент</h2>
                        <p>
                            Та манай платформд зураг, тайлбар, видео оруулахдаа дараах <strong>хязгаарлагдмал</strong> эрхийг Nutgiin Delguur-т олгож байна:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-3">
                            <li>Тухайн контентыг <strong>зөвхөн платформ дотор</strong> харуулах, хуулбарлах.</li>
                            <li>Техникийн шаардлагын дагуу хэмжээг өөрчлөх, шахах (чанар алдагдуулахгүйгээр).</li>
                            <li>Платформын маркетингийн зорилгоор ашиглах (зөвхөн таны зөвшөөрлөөр).</li>
                        </ul>

                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-green-800 mb-2">Таны эрхийн хамгаалалт:</p>
                                    <ul className="text-sm text-green-700 space-y-1">
                                        <li>• Таны контентыг гуравдагч этгээдэд <strong>ЗАРАХГҮЙ</strong>.</li>
                                        <li>• Таны нэргүй маркетингийн материалд ашиглахын өмнө <strong>ЗӨВШӨӨРӨЛ</strong> авна.</li>
                                        <li>• Та хүссэн үедээ контентоо устгах хүсэлт гаргах эрхтэй.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">2. Таны өмчлөх эрх</h2>
                        <p>
                            Та оруулсан контентынхоо <strong>бүрэн эзэмшигч</strong> хэвээр үлдэнэ. Манай платформ нь:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-3">
                            <li>Таны контентын өмчлөлийг шилжүүлж авахгүй.</li>
                            <li>Таны контентыг өөр платформд дамжуулахгүй.</li>
                            <li>Таны зохиогчийн эрхийг (Attribution) хүндэтгэнэ.</li>
                        </ul>
                    </section>

                    {/* NEW: Section 3 - AI Generated Content */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Bot className="w-5 h-5 text-cyan-500" />
                            3. AI-аар үүсгэсэн контент
                        </h2>
                        <p>Хиймэл оюун ухаан (AI)-аар үүсгэсэн контентын лицензийн тухай:</p>

                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-cyan-50">
                                        <th className="text-left p-3 border">Контентын төрөл</th>
                                        <th className="text-left p-3 border">Зохиогчийн эрхийн эзэн</th>
                                        <th className="text-left p-3 border">Хариуцлага</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="p-3 border">Хэрэглэгчийн авсан зураг</td>
                                        <td className="p-3 border">Хэрэглэгч</td>
                                        <td className="p-3 border">Хэрэглэгч</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="p-3 border">AI-аар үүсгэсэн зураг</td>
                                        <td className="p-3 border">Оруулсан хэрэглэгч</td>
                                        <td className="p-3 border">Оруулсан хэрэглэгч</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 border">AI + Хэрэглэгчийн засвар</td>
                                        <td className="p-3 border">Оруулсан хэрэглэгч</td>
                                        <td className="p-3 border">Оруулсан хэрэглэгч</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 p-3 bg-amber-50 rounded-lg text-sm">
                            <p className="text-amber-800">
                                <strong>Анхааруулга:</strong> AI-аар үүсгэсэн контент нь өөр бүтээлийг хуулбарласан бол хэрэглэгч бүрэн хариуцна.
                            </p>
                        </div>
                    </section>

                    {/* Section 4 - Content Deletion Details */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            4. Контент устгах (Мартагдах эрх)
                        </h2>

                        <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                                <p className="text-sm"><strong>Зар устгах:</strong> Та өөрийн зарыг хүссэн үедээ шууд устгаж болно.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">2</div>
                                <p className="text-sm"><strong>Бүртгэл устгах:</strong> info@nutgiindelguur.mn хаягаар хүсэлт илгээнэ.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">3</div>
                                <p className="text-sm"><strong>Хугацаа:</strong> Бид хүсэлт хүлээн авснаас хойш <strong>14 хоногийн дотор</strong> бүх контентыг устгана.</p>
                            </div>
                        </div>

                        {/* Partial deletion paradox resolution */}
                        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                            <p className="font-medium text-purple-800 mb-2">🔮 Хэсэгчилсэн устгалт (Partial Deletion):</p>
                            <ul className="text-sm text-purple-700 space-y-2">
                                <li>• <strong>Зар:</strong> Бие даан устгагдана.</li>
                                <li>• <strong>Чат мессеж:</strong> Та өөрийн мессежийг устгаж болно. Бусад талын дэлгэцнээс "[Устгагдсан мессеж]" гэж харагдана.</li>
                                <li>• <strong>Бусдад илгээсэн зураг:</strong> Та өөрийн талаас устгаж болох ч, хүлээн авагч хадгалсан бол хариуцахгүй.</li>
                            </ul>
                        </div>

                        {/* Backup clarification */}
                        <div className="mt-3 p-3 bg-gray-100 rounded-lg text-sm">
                            <p className="text-gray-700">
                                <strong>📦 Backup тухай:</strong> Устгах хүсэлт гаргаснаас хойш системийн backup дээр мэдээлэл 90 хоног хүртэл үлдэж болно. Энэ нь зөвхөн системийн сэргээлтэд ашиглагдах бөгөөд хэнд ч харагдахгүй.
                            </p>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">5. Хориглох зүйлс</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Бусдын зохиогчийн эрхээр хамгаалагдсан зураг, видеог зөвшөөрөлгүй оруулах.</li>
                            <li>Nutgiin Delguur-ийн лого, дизайн, эх кодыг хуулбарлах, өөрчлөх, арилжааны зорилгоор ашиглах.</li>
                            <li>Автоматжуулсан аргаар (bot, scraper, crawler) сайтаас мэдээлэл цуглуулах.</li>
                            <li>Сайтын ажиллагаанд саад учруулах аливаа үйлдэл (DDOS г.м.).</li>
                            <li>Хэрэглэгчдийн мэдээллийг зөвшөөрөлгүй цуглуулах, худалдах.</li>
                        </ul>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">6. Барааны тэмдэг ба оюуны өмч</h2>
                        <p>
                            "Nutgiin Delguur", "Нутгийн Дэлгүүр", сайтын лого, дизайн, үг хэллэг болон бусад график элементүүд нь манай онцгой өмч юм. Эдгээрийг бичгээр зөвшөөрөл авалгүйгээр ашиглахыг хориглоно.
                        </p>
                    </section>

                    {/* Section 7 - DMCA */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">7. Зохиогчийн эрхийн зөрчлийн мэдэгдэл (DMCA)</h2>

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                            <p className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                7.1 Устгах мэдэгдэл (Takedown Notice)
                            </p>
                            <p className="text-sm text-blue-700 mb-2">
                                Хэрэв та өөрийн зохиогчийн эрхээр хамгаалагдсан контент зөвшөөрөлгүйгээр нийтлэгдсэн гэж үзвэл:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-blue-700">
                                <li>Таны бүтэн нэр, холбоо барих мэдээлэл.</li>
                                <li>Зөрчигдсөн контентын тодорхойлолт ба холбоос (URL).</li>
                                <li>Таны өмчлөлийг нотлох баримт.</li>
                                <li>Мэдэгдэл үнэн зөв гэдгийг баталсан тайлбар.</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl mb-4">
                            <p className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                7.2 Эсрэг мэдэгдэл (Counter-Notice)
                            </p>
                            <p className="text-sm text-purple-700 mb-2">
                                Хэрэв таны контентыг буруу мэдэгдлийн улмаас устгасан гэж үзвэл:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-purple-700">
                                <li>Таны бүтэн нэр, холбоо барих мэдээлэл.</li>
                                <li>Устгагдсан контентын тодорхойлолт.</li>
                                <li>Тухайн контент зохиогчийн эрхийг зөрчөөгүй гэсэн тайлбар.</li>
                                <li>Монгол Улсын шүүхийн харьяалалд орохыг зөвшөөрсөн баталгаа.</li>
                            </ul>
                        </div>

                        {/* False claims warning */}
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                            <p className="font-medium text-red-800 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                7.3 Хуурамч мэдэгдлийн хариуцлага
                            </p>
                            <p className="text-sm text-red-700">
                                Хуурамч DMCA мэдэгдэл илгээсэн этгээд нь хохирогч талд учирсан хохирлыг (хуульчийн төлбөр орно) нөхөн төлөх үүрэгтэй. Бид хуурамч мэдэгдэл илгээсэн этгээдийн бүртгэлийг хааж болно.
                            </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-500" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Зохиогчийн эрхийн мэдэгдэл илгээх:</p>
                                <p className="text-sm text-primary">copyright@nutgiindelguur.mn</p>
                            </div>
                        </div>

                        <div className="mt-3 p-3 bg-gray-100 rounded-lg text-sm">
                            <strong>Хариу өгөх хугацаа:</strong>
                            <ul className="mt-2 space-y-1">
                                <li>• Мэдэгдэл хүлээн авснаас хойш <strong>24 цагийн дотор</strong> баталгаажуулна.</li>
                                <li>• <strong>72 цагийн дотор</strong> зөрчилтэй контентыг шалгаж, шаардлагатай бол устгана.</li>
                                <li>• Эсрэг мэдэгдэл хүлээн авсны дараа <strong>10 ажлын өдрийн дотор</strong> эх мэдэгдэгчид хариу хүлээнэ.</li>
                                <li>• Маргаантай тохиолдолд <strong>14 хоногийн дотор</strong> шийдвэрлэнэ.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 8 - Data Retention */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">8. Өгөгдөл хадгалах хугацаа</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="text-left p-3 border">Мэдээллийн төрөл</th>
                                        <th className="text-left p-3 border">Хадгалах хугацаа</th>
                                        <th className="text-left p-3 border">Хуулийн үндэслэл</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="p-3 border">Идэвхтэй бүртгэлийн мэдээлэл</td>
                                        <td className="p-3 border">Бүртгэл идэвхтэй байх хугацаанд</td>
                                        <td className="p-3 border">Гэрээний үүрэг</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="p-3 border">Устгасан бүртгэлийн мэдээлэл</td>
                                        <td className="p-3 border">Хүсэлт гаргаснаас хойш 14 хоног</td>
                                        <td className="p-3 border">Хуулийн шаардлага</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 border">Системийн backup</td>
                                        <td className="p-3 border">90 хоног</td>
                                        <td className="p-3 border">Техникийн шаардлага</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="p-3 border">Төлбөрийн түүх</td>
                                        <td className="p-3 border">7 жил</td>
                                        <td className="p-3 border">Татварын хууль</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 border">Залилангийн гомдолтой холбоотой</td>
                                        <td className="p-3 border">Маргаан шийдвэрлэгдэх + 5 жил</td>
                                        <td className="p-3 border">Иргэний хууль</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="p-3 border">Нэвтрэлтийн лог (IP, цаг)</td>
                                        <td className="p-3 border">90 хоног</td>
                                        <td className="p-3 border">Аюулгүй байдал</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 border">DMCA мэдэгдлийн бүртгэл</td>
                                        <td className="p-3 border">3 жил</td>
                                        <td className="p-3 border">Оюуны өмчийн хууль</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Section 9 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">9. Гэрээг цуцлах</h2>
                        <p>Хэрэв та энэхүү гэрээг зөрчсөн тохиолдолд бид дараах арга хэмжээ авах эрхтэй:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-3">
                            <li>Таны бүртгэлийг түр түдгэлзүүлэх (48 цаг - 30 хоног).</li>
                            <li>Таны бүртгэлийг бүрмөсөн хаах.</li>
                            <li>Оруулсан бүх контентыг устгах.</li>
                            <li>Хуулийн байгууллагад мэдэгдэх (шаардлагатай бол).</li>
                        </ul>

                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-amber-800 mb-2">Гомдол гаргах эрх:</p>
                                    <p className="text-sm text-amber-700">
                                        Хэрэв та шийдвэртэй санал нийлэхгүй бол <strong>14 хоногийн дотор</strong> info@nutgiindelguur.mn хаягаар гомдол гаргаж болно. Бид 7 хоногийн дотор хянаж, хариу өгнө.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 10 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">10. Бусад заалтууд</h2>
                        <p>
                            Дараах заалтууд нь <Link href="/terms" className="text-primary hover:underline">Үйлчилгээний нөхцөл</Link>-д тодорхойлогдсон бөгөөд энэхүү Лицензийн гэрээнд мөн адил хамаарна:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-3">
                            <li>Тодорхойлолт (Definitions) - §0</li>
                            <li>Гэрээг хүлээн зөвшөөрөх - §1.5</li>
                            <li>Мэдэгдэл илгээх, хүлээн авах (Notices) - §7.5</li>
                            <li>Давагдашгүй хүчин зүйл (Force Majeure) - §10</li>
                            <li>Тусад нь байдал (Severability) - §11</li>
                            <li>Бүрэн гэрээ (Entire Agreement) - §12</li>
                            <li>Хэлний давамгайлал - §13</li>
                            <li>Өв залгамжлал - §14</li>
                            <li>AI-аар үүсгэсэн контент - §15</li>
                            <li>Олон улсын хэрэглэгч - §16</li>
                            <li>Идэвхгүй бүртгэл - §17</li>
                            <li>Компани шилжүүлэх - §18</li>
                            <li>Нөхөн төлөх үүрэг (Indemnification) - §20</li>
                            <li>Эрхээсээ татгалзахгүй байх (No Waiver) - §21</li>
                            <li>Гэрээ шилжүүлэх (Assignment) - §22</li>
                            <li>Үргэлжлэн хүчинтэй байх заалтууд (Survival) - §23</li>
                            <li>Гуравдагч этгээдийн эрх - §24</li>
                            <li>Хууль өөрчлөгдөх - §25</li>
                        </ul>
                    </section>

                    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-4 rounded-xl text-sm text-gray-600 mt-8 flex justify-between items-center border border-indigo-100">
                        <span>Сүүлд шинэчлэгдсэн: 2025 оны 12-р сарын 04</span>
                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600">Хувилбар: 6.0 Planck</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
