"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    if (process.env.NODE_ENV === 'development') {
                        console.log("[SW] Registered:", registration.scope);
                    }
                })
                .catch((error) => {
                    if (process.env.NODE_ENV === 'development') {
                        console.error("[SW] Registration failed:", error);
                    }
                });
        }
    }, []);

    return null;
}
