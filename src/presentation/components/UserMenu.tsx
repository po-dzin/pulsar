"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/infrastructure/supabase/client";

type Props = {
    isAuthenticated: boolean;
    avatarUrl?: string | null;
    displayName?: string | null;
    loginLabel: string;
    profileLabel: string;
    signOutLabel: string;
    profileHref: string;
};

export const UserMenu = ({
    isAuthenticated,
    avatarUrl,
    displayName,
    loginLabel,
    profileLabel,
    signOutLabel,
    profileHref,
}: Props) => {
    const [busy, setBusy] = useState(false);
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const signIn = async () => {
        setBusy(true);
        const supabase = getSupabaseBrowserClient();
        const nextPath = `${window.location.pathname}${window.location.search}`;
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
        await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
        setBusy(false);
    };

    const signOut = async () => {
        setBusy(true);
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.signOut();
        window.location.assign("/");
    };

    if (!isAuthenticated) {
        return (
            <button
                type="button"
                className="button button-accent"
                onClick={signIn}
                disabled={busy}
                data-testid="google-auth-button"
            >
                {loginLabel}
            </button>
        );
    }

    /* ── Authenticated: avatar + dropdown ── */
    const initials = displayName
        ? displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
        : "?";

    return (
        <div className="user-menu-wrapper" ref={wrapperRef}>
            <button
                type="button"
                className="avatar-btn"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={open}
                aria-label={displayName ?? "User menu"}
                data-testid="user-avatar-button"
            >
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt={displayName ?? "Avatar"}
                        width={38}
                        height={38}
                        className="avatar-img"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <span className="avatar-initials">{initials}</span>
                )}
            </button>

            {open && (
                <div className="user-menu-dropdown" role="menu">
                    {displayName && (
                        <p className="user-menu-name">{displayName}</p>
                    )}
                    <Link
                        href={profileHref}
                        className="user-menu-item"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                    >
                        {profileLabel}
                    </Link>
                    <button
                        type="button"
                        className="user-menu-item user-menu-item--danger"
                        role="menuitem"
                        onClick={signOut}
                        disabled={busy}
                    >
                        {signOutLabel}
                    </button>
                </div>
            )}
        </div>
    );
};
