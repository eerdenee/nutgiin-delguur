"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>("system");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("theme") as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
            applyTheme(savedTheme);
        }
    }, []);

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement;

        if (newTheme === "system") {
            const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            root.classList.toggle("dark", systemDark);
        } else {
            root.classList.toggle("dark", newTheme === "dark");
        }
    };

    const toggleTheme = () => {
        const themes: Theme[] = ["light", "dark", "system"];
        const currentIndex = themes.indexOf(theme);
        const newTheme = themes[(currentIndex + 1) % themes.length];

        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
    };

    if (!mounted) return null;

    const icons = {
        light: <Sun className="w-5 h-5" />,
        dark: <Moon className="w-5 h-5" />,
        system: <Monitor className="w-5 h-5" />,
    };

    const labels = {
        light: "Цайвар горим",
        dark: "Бараан горим",
        system: "Системийн",
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-[var(--background)] hover:bg-[var(--card-border)] transition-colors"
            aria-label={`Горим солих: ${labels[theme]}`}
            title={labels[theme]}
        >
            {icons[theme]}
        </button>
    );
}
