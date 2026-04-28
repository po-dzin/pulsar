"use client";

import { useState } from "react";
import { signInWithGoogle, signOutBrowserUser } from "@/infrastructure/supabase/client";

type Props = {
  isAuthenticated: boolean;
  loginLabel: string;
  logoutLabel: string;
};

export const AuthControls = ({ isAuthenticated, loginLabel, logoutLabel }: Props) => {
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    try {
      const nextPath = `${window.location.pathname}${window.location.search}`;
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      await signInWithGoogle(redirectTo);
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      const ok = await signOutBrowserUser();
      if (ok) {
        window.location.assign("/");
      }
    } finally {
      setBusy(false);
    }
  };

  if (isAuthenticated) {
    return (
      <button type="button" className="button button-muted" onClick={signOut} disabled={busy}>
        {logoutLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="button button-accent"
      onClick={signIn}
      disabled={busy}
    >
      {loginLabel}
    </button>
  );
};
