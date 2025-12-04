"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, MessageSquare, AlertTriangle, Lightbulb, ThumbsUp, CheckCircle } from "lucide-react";

const FEEDBACK_TYPES = [
    { id: "suggestion", label: "Санал", icon: Lightbulb, color: "bg-blue-50 text-blue-600 border-blue-100" },
    { id: "complaint", label: "Гомдол", icon: AlertTriangle, color: "bg-red-50 text-red-600 border-red-100" },
    { id: "praise", label: "Талархал", icon: ThumbsUp, color: "bg-green-50 text-green-600 border-green-100" },
    { id: "other", label: "Бусад", icon: MessageSquare, color: "bg-gray-50 text-gray-600 border-gray-100" },
];

export default function FeedbackPage() {
    const [feedbackType, setFeedbackType] = useState<string>("suggestion");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In real app, save to database or send email
        const feedbackData = {
            type: feedbackType,
            name,
            email,
            message,
            timestamp: new Date().toISOString()
        };

        // Save to localStorage for demo
        const existingFeedback = JSON.parse(localStorage.getItem("feedback") || "[]");
        existingFeedback.push(feedbackData);
        localStorage.setItem("feedback", JSON.stringify(existingFeedback));

        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Баярлалаа!</h1>
                    <p className="text-gray-600 mb-6">
                        Таны санал хүсэлт амжилттай илгээгдлээ. Бид таны саналыг нягтлан үзэж, хариу өгөх болно.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors"
                    >
                        Нүүр хуудас руу буцах
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Буцах</span>
                </Link>

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Санал хүсэлт</h1>
                            <p className="text-sm text-gray-500">Таны санал бидний хөгжлийн түлхүүр</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Feedback Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Төрөл сонгох
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {FEEDBACK_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFeedbackType(type.id)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${feedbackType === type.id
                                            ? "border-primary bg-primary/5"
                                            : `border-transparent ${type.color}`
                                            }`}
                                    >
                                        <type.icon className="w-5 h-5" />
                                        <span className="text-sm font-medium">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Таны нэр
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Нэрээ оруулна уу"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                И-мэйл (Хариу авахыг хүсвэл)
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@mail.com"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                Дэлгэрэнгүй <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Санал хүсэлтээ дэлгэрэнгүй бичнэ үү..."
                                rows={5}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={!message.trim() || isSubmitting}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                                    Илгээж байна...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Илгээх
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
