"use client";

import { useUiMode } from "@/presentation/components/UiModeProvider";

export const UiModeToggle = () => {
    const { mode, toggleMode } = useUiMode();

    return (
        <button
            className="theme-toggle ui-mode-label"
            onClick={(event) => {
                toggleMode();
                event.currentTarget.blur();
            }}
            aria-label="Toggle UI Mode"
            title={mode === "bento" ? "Switch to Standard Mode" : "Switch to BNT Mode"}
        >
            {mode === "bento" ? "BNT" : "STD"}
        </button>
    );
};
