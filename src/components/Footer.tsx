import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, ShieldCheck } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[var(--card-bg)] border-t border-[var(--card-border)] pt-12 pb-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand & Contact */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center gap-1 mb-4">
                            <span className="text-xl font-bold text-secondary">Nutgiin</span>
                            <span className="text-xl font-bold text-primary">Delguur</span>
                        </Link>
                        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                            Монгол орны өнцөг булан бүрээс шилдэг бүтээгдэхүүнийг шууд үйлдвэрлэгчээс нь.
                        </p>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>info@nutgiindelguur.mn</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>7700-0000</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-[var(--foreground)] mb-4">Үндсэн цэс</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><Link href="/" className="hover:text-primary transition-colors">Нүүр хуудас</Link></li>
                            <li><Link href="/dashboard/post" className="hover:text-primary transition-colors">Зар оруулах</Link></li>
                            <li><Link href="/messages" className="hover:text-primary transition-colors">Зурвас</Link></li>
                            <li><Link href="/favorites" className="hover:text-primary transition-colors">Хадгалсан</Link></li>
                        </ul>
                    </div>

                    {/* Support & Legal */}
                    <div>
                        <h3 className="font-bold text-[var(--foreground)] mb-4">Тусламж</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><Link href="/help" className="hover:text-primary transition-colors">Түгээмэл асуулт</Link></li>
                            <li><Link href="/safety" className="hover:text-primary transition-colors flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Аюулгүй ажиллагаа</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition-colors">Үйлчилгээний нөхцөл</Link></li>
                            <li><Link href="/license" className="hover:text-primary transition-colors">Лицензийн гэрээ</Link></li>
                            <li><Link href="/feedback" className="hover:text-primary transition-colors">Санал хүсэлт</Link></li>
                        </ul>
                    </div>

                    {/* Socials */}
                    <div>
                        <h3 className="font-bold text-[var(--foreground)] mb-4">Биднийг дагаарай</h3>
                        <div className="flex gap-4" role="group" aria-label="Сошиал сүлжээ холбоосууд">
                            <a
                                href="#"
                                aria-label="Facebook хуудас руу очих"
                                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                <Facebook className="w-5 h-5" aria-hidden="true" />
                            </a>
                            <a
                                href="#"
                                aria-label="Instagram хуудас руу очих"
                                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                <Instagram className="w-5 h-5" aria-hidden="true" />
                            </a>
                            <a
                                href="#"
                                aria-label="Twitter хуудас руу очих"
                                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                <Twitter className="w-5 h-5" aria-hidden="true" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-[var(--card-border)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--muted)]">
                    <p>&copy; {currentYear} Nutgiin Delguur. Бүх эрх хуулиар хамгаалагдсан.</p>
                    <div className="flex gap-4">
                        <Link href="/terms" className="hover:text-gray-900">Нууцлалын бодлого</Link>
                        <Link href="/terms" className="hover:text-gray-900">Үйлчилгээний нөхцөл</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
