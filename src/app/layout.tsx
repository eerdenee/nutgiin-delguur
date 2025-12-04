import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const montserrat = Montserrat({
    variable: "--font-montserrat",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
    title: "NutgiinDelguur - Монгол Үйлдвэрлэлийн Талбар",
    description: "🇲🇳 Монголын үндэсний үйлдвэрлэгчдийн бүтээгдэхүүнийг түгээх цахим платформ. Монгол бүтээгдэхүүн, орон нутгийн үйлдвэрлэл.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="mn">
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased`}
            >
                {children}
                <Footer />
                <BottomNav />
            </body>
        </html>
    );
}
