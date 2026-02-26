"use client";

import { useUiMode } from "@/presentation/components/UiModeProvider";
import { useEffect, useState } from "react";

export const LandingBentoWrapper = ({ children }: { children: React.ReactNode }) => {
    const { mode } = useUiMode();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isBento = mounted && mode === "bento";

    return (
        <div className={isBento ? "landing-bento-grid" : "landing-standard-stack"}>
            {children}
        </div>
    );
};
