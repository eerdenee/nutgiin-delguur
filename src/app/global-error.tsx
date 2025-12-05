"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
        <html>
            <body>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f9fafb',
                    padding: '1rem',
                }}>
                    <div style={{
                        maxWidth: '28rem',
                        width: '100%',
                        backgroundColor: 'white',
                        borderRadius: '1rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        padding: '2rem',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: '4rem',
                            height: '4rem',
                            backgroundColor: '#fee2e2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                        </div>

                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: '#111827',
                            marginBottom: '0.5rem',
                        }}>
                            Системийн алдаа
                        </h2>
                        <p style={{
                            color: '#6b7280',
                            marginBottom: '1.5rem',
                        }}>
                            Маш хүлцэл өчье, системд алдаа гарлаа. Бид энийг засаж байна.
                        </p>

                        <button
                            onClick={reset}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: '#fbbf24',
                                color: '#1f2937',
                                fontWeight: 'bold',
                                borderRadius: '0.75rem',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Дахин оролдох
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
