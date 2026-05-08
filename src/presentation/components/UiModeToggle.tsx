"use client";

import { useUiMode } from "@/presentation/components/UiModeProvider";

export const UiModeToggle = () => {
    const { mode, toggleMode } = useUiMode();

    return (
        <button
            className="theme-toggle"
            onClick={toggleMode}
            aria-label="Toggle UI Mode"
            title={mode === "bento" ? "Switch to Standard Mode (Ctrl+,)" : "Switch to BNT Mode (Ctrl+,)"}
            style={{ fontSize: "0.7rem", fontWeight: 700 }}
        >
            {mode === "bento" ? "BNT" : "STD"}
        </button>
    );
};
