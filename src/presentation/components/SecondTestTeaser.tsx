"use client";

import { useState } from "react";
import type { Locale } from "@/domain/psychosomatic/model";

type Props = {
  locale: Locale;
  title: string;
  body: string;
  cta: string;
};

export const SecondTestTeaser = ({ locale, title, body, cta }: Props) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");

    const response = await fetch("/api/waitlist/second-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });

    if (response.ok) {
      setStatus("success");
      setEmail("");
      return;
    }

    setStatus("error");
  };

  return (
    <section className="card">
      <h3>{title}</h3>
      <p className="muted">{body}</p>
      <form onSubmit={submit} className="inline-row">
        <input
          className="input waitlist-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
        />
        <button className="button button-muted" type="submit" disabled={status === "loading"}>
          {cta}
        </button>
      </form>
      {status === "success" ? <p className="muted">Done. You are in the waitlist.</p> : null}
      {status === "error" ? <p className="muted">Failed to join waitlist.</p> : null}
    </section>
  );
};
