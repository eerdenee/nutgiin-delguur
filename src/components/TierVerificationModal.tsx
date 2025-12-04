import { Package, ShieldCheck, FileText, Truck } from "lucide-react";

interface TierVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    nextTier: string;
}

export default function TierVerificationModal({ isOpen, onClose, nextTier }: TierVerificationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="font-bold text-xl text-gray-900 mb-2">Түвшин өсгөх баталгаажуулалт</h2>
                    <p className="text-sm text-gray-600 mb-6">
                        {nextTier} түвшинд шилжихийн тулд дараах мэдээллээ оруулна уу
                    </p>

                    {/* Step 1: Identity Verification */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary text-secondary rounded-full flex items-center justify-center text-xs font-bold">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            Өөрийгөө баталгаажуулах
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Иргэний үнэмлэхийн дугаар"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            />
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-primary transition-colors cursor-pointer">
                                <p className="text-sm text-gray-600 mb-2">Иргэний үнэмлэхийн зураг оруулах</p>
                                <button className="text-sm text-primary font-bold">Файл сонгох</button>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Service Agreement */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary text-secondary rounded-full flex items-center justify-center text-xs font-bold">
                                <FileText className="w-4 h-4" />
                            </div>
                            Үйлчилгээний гэрээ
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4 max-h-40 overflow-y-auto text-xs text-gray-700 mb-3 border border-gray-200">
                            <p className="mb-2"><strong>Үйлчилгээний нөхцөл:</strong></p>
                            <p className="mb-2">1. Та өөрийн бүтээгдэхүүний чанар, аюулгүй байдлыг хариуцна.</p>
                            <p className="mb-2">2. Хүргэлтийг цаг тухайд нь хийхийг зөвшөөрч байна.</p>
                            <p className="mb-2">3. Худал мэдээлэл өгсөн тохиолдолд эрх хасагдана.</p>
                            <p className="mb-2">4. Үйлчлүүлэгчтэй сайтаар дамжуулан аюулгүй харилцана.</p>
                            <p>5. Багцын үйлчилгээний төлбөр нь сар бүр төлөгдөнө.</p>
                        </div>
                        <label className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                            <input type="checkbox" className="w-4 h-4 text-primary rounded mt-0.5" />
                            <span className="text-sm text-gray-700">Үйлчилгээний нөхцөлтэй танилцаж зөвшөөрч байна</span>
                        </label>
                    </div>

                    {/* Step 3: Delivery Setup */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary text-secondary rounded-full flex items-center justify-center text-xs font-bold">
                                <Truck className="w-4 h-4" />
                            </div>
                            Хүргэлтийн тохиргоо
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Хүргэлтийн хаяг"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            />
                            <input
                                type="tel"
                                placeholder="Холбоо барих утас"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            />
                            <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-gray-700">
                                <option>Хүргэлтийн арга сонгох</option>
                                <option>Өөрөө хүргэх</option>
                                <option>Платформоор дамжуулан</option>
                                <option>Гуравдагч талаар</option>
                            </select>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                                <p className="font-bold mb-1">💡 Чухал мэдээлэл</p>
                                <p>Хүргэлтийн мэдээллээ оруулснаар үйлчлүүлэгчид таны бүтээгдэхүүнийг хаанаас хүлээж авах боломжтой болно.</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Болих
                        </button>
                        <button
                            onClick={() => {
                                alert("Баталгаажуулалт амжилттай илгээгдлээ! Админ 24 цагийн дотор хянана.");
                                onClose();
                            }}
                            className="flex-1 px-4 py-3 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors shadow-md"
                        >
                            Илгээх
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
