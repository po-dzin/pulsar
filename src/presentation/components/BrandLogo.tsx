"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";

interface BrandLogoProps {
    href: string;
    text: string;
}

export const BrandLogo = ({ href, text }: BrandLogoProps) => {
    const containerRef = useRef<HTMLAnchorElement>(null);
    const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

    // Mutable state escapes React closure traps and makes rAF hyper-fast
    const physics = useRef({
        isHovering: false,
        mouseX: 0,
        mouseY: 0,
        waveStart: 0,
        waveX: 0,
        waveY: 0,
        rAF: 0,
    });

    const render = useCallback((now: number) => {
        const p = physics.current;
        let waveActive = false;
        let waveRadius = 0;
        const waveSpeed = 0.4;
        const waveThickness = 50;

        if (p.waveStart > 0) {
            waveRadius = (now - p.waveStart) * waveSpeed;
            if (waveRadius < 2000) {
                waveActive = true;
            } else {
                p.waveStart = 0; // End wave
            }
        }

        letterRefs.current.forEach((el) => {
            if (!el) return;

            let targetIntensity = 0;

            if (p.isHovering || waveActive) {
                const rect = el.getBoundingClientRect();
                const elCenterX = rect.left + rect.width / 2;
                const elCenterY = rect.top + rect.height / 2;

                if (p.isHovering) {
                    const dx = p.mouseX - elCenterX;
                    const dy = p.mouseY - elCenterY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const spotlightRadius = 60;

                    if (dist < spotlightRadius) {
                        const baseIntensity = 1 - Math.max(0, dist / spotlightRadius);
                        targetIntensity = Math.max(targetIntensity, Math.pow(baseIntensity, 0.5));
                    }
                }

                if (waveActive) {
                    const dx = p.waveX - elCenterX;
                    const dy = p.waveY - elCenterY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const distFromCrest = Math.abs(dist - waveRadius);

                    if (distFromCrest < waveThickness) {
                        const intensity = 1 - Math.max(0, distFromCrest / waveThickness);
                        targetIntensity = Math.max(targetIntensity, intensity * 1.5);
                    }
                }
            }

            targetIntensity = Math.min(1, Math.max(0, targetIntensity));

            // Quick read to prevent unnecessary style mutations
            const currentVal = el.style.getPropertyValue("--intensity");
            const stringVal = targetIntensity.toFixed(3);
            if (currentVal !== stringVal) {
                el.style.setProperty("--intensity", stringVal);
            }
        });

        if (p.isHovering || waveActive) {
            p.rAF = requestAnimationFrame((ts) => render(ts));
        } else {
            // Loop pauses naturally when idle. Ensure everything is blacked out.
            letterRefs.current.forEach((el) => {
                if (el && el.style.getPropertyValue("--intensity") !== "0.000") {
                    el.style.setProperty("--intensity", "0.000");
                }
            });
            p.rAF = 0;
        }
    }, []);

    const startLoop = useCallback(() => {
        if (!physics.current.rAF) {
            physics.current.rAF = requestAnimationFrame(render);
        }
    }, [render]);

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                // Expand hit area slightly to make the effect feel organic before cursor directly enters
                const rect = containerRef.current.getBoundingClientRect();
                const buffer = 40;
                const isOver = (
                    e.clientX >= rect.left - buffer &&
                    e.clientX <= rect.right + buffer &&
                    e.clientY >= rect.top - buffer &&
                    e.clientY <= rect.bottom + buffer
                );
                physics.current.isHovering = isOver;
            } else {
                physics.current.isHovering = false;
            }

            physics.current.mouseX = e.clientX;
            physics.current.mouseY = e.clientY;

            if (physics.current.isHovering) startLoop();
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
    }, [startLoop]);

    const handleClick = (e: React.MouseEvent) => {
        if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
            physics.current.waveStart = performance.now();
            physics.current.waveX = e.clientX;
            physics.current.waveY = e.clientY;
            startLoop();
        }
    };

    return (
        <Link
            href={href}
            className="brand brand-interactive"
            ref={containerRef}
            onClick={handleClick}
            aria-label={text}
        >
            {text.split("").map((char, i) => (
                <span
                    key={i}
                    className="brand-char"
                    data-char={char === " " ? "\u00A0" : char}
                    ref={(el) => {
                        letterRefs.current[i] = el;
                    }}
                >
                    {char === " " ? "\u00A0" : char}
                </span>
            ))}
        </Link>
    );
};
