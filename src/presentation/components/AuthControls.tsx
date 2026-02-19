"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/infrastructure/supabase/client";

type Props = {
  isAuthenticated: boolean;
  loginLabel: string;
  logoutLabel: string;
};

export const AuthControls = ({ isAuthenticated, loginLabel, logoutLabel }: Props) => {
  const [busy, setBusy] = useState(false);

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
      data-testid="google-auth-button"
    >
      {loginLabel}
    </button>
  );
};
