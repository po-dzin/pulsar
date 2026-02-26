"use client";

import { createContext, useContext, useEffect, useState } from "react";

type UiMode = "default" | "bento";

type UiModeContextType = {
    mode: UiMode;
    toggleMode: () => void;
};

const UiModeContext = createContext<UiModeContextType | null>(null);

export const useUiMode = () => {
    const ctx = useContext(UiModeContext);
    if (!ctx) throw new Error("useUiMode must be used within UiModeProvider");
    return ctx;
};

export const UiModeProvider = ({ children }: { children: React.ReactNode }) => {
    const [mode, setMode] = useState<UiMode>("default");

    useEffect(() => {
        // Attempt to read from localStorage on mount (client-side only)
        try {
            const stored = localStorage.getItem("impulse-ui-mode") as UiMode;
            if (stored === "bento") {
                setMode("bento");
                document.documentElement.setAttribute("data-ui-mode", "bento");
            }
        } catch { }
    }, []);

    const toggleMode = () => {
        setMode((prev) => {
            const next = prev === "default" ? "bento" : "default";
            if (next === "bento") {
                document.documentElement.setAttribute("data-ui-mode", "bento");
            } else {
                document.documentElement.removeAttribute("data-ui-mode");
            }
            try {
                localStorage.setItem("impulse-ui-mode", next);
            } catch { }
            return next;
        });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === ",") {
                e.preventDefault();
                toggleMode();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return <UiModeContext.Provider value={{ mode, toggleMode }}>{children}</UiModeContext.Provider>;
};
