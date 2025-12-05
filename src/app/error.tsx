"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to Sentry
        Sentry.captureException(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Алдаа гарлаа
                </h2>
                <p className="text-gray-600 mb-6">
                    Уучлаарай, ямар нэг зүйл буруу болсон байна. Бид энэ алдааг аль хэдийн мэдэж, засаж байна.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={reset}
                        className="w-full py-3 bg-primary text-secondary font-bold rounded-xl hover:bg-yellow-400 transition-colors"
                    >
                        Дахин оролдох
                    </button>

                    <Link
                        href="/"
                        className="block w-full py-3 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Нүүр хуудас руу буцах
                    </Link>
                </div>

                {process.env.NODE_ENV === "development" && (
                    <details className="mt-6 text-left">
                        <summary className="text-sm text-gray-500 cursor-pointer">
                            Алдааны дэлгэрэнгүй (dev only)
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs overflow-auto max-h-40">
                            {error.message}
                            {error.stack}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}
