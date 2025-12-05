import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { CountryProvider } from "@/context/CountryContext";

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

// SEO Metadata
export const metadata: Metadata = {
    title: {
        default: "Нутгийн Дэлгүүр - Монгол Үйлдвэрлэлийн Талбар",
        template: "%s | Нутгийн Дэлгүүр",
    },
    description: "🇲🇳 Монголын үндэсний үйлдвэрлэгчдийн бүтээгдэхүүнийг түгээх цахим платформ. Мах, сүү, арьс шир, ноос, гар урлал болон бусад орон нутгийн бүтээгдэхүүн.",
    keywords: [
        "монгол бүтээгдэхүүн",
        "орон нутгийн үйлдвэрлэл",
        "нутгийн дэлгүүр",
        "монгол мах",
        "монгол сүү",
        "гар урлал",
        "ноосон бүтээгдэхүүн",
        "арьс шир",
        "малчин",
        "үйлдвэрлэгч",
    ],
    authors: [{ name: "Нутгийн Дэлгүүр" }],
    creator: "Нутгийн Дэлгүүр",
    publisher: "Нутгийн Дэлгүүр",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nutgiin-delguur.vercel.app"),
    openGraph: {
        title: "Нутгийн Дэлгүүр - Монгол Үйлдвэрлэлийн Талбар",
        description: "Монголын үндэсний үйлдвэрлэгчдийн бүтээгдэхүүнийг түгээх цахим платформ",
        url: "/",
        siteName: "Нутгийн Дэлгүүр",
        locale: "mn_MN",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Нутгийн Дэлгүүр",
        description: "Монгол бүтээгдэхүүн, орон нутгийн үйлдвэрлэл",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon-16x16.png",
        apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
};

// Viewport configuration
export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#111827" },
    ],
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="mn">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased`}
            >
                <CountryProvider>
                    {children}
                    <Footer />
                    <BottomNav />
                </CountryProvider>
            </body>
        </html>
    );
}
