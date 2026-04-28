"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/infrastructure/supabase/client";

type Labels = {
  requestButton: string;
  signInButton: string;
  modalTitle: string;
  name: string;
  contact: string;
  message: string;
  submit: string;
  cancel: string;
  success: string;
  error: string;
};

type Props = {
  isAuthenticated: boolean;
  labels: Labels;
};

export const ProductsRequestPanel = ({ isAuthenticated, labels }: Props) => {
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/leads/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, message }),
      });

      if (response.ok) {
        setStatus("success");
        setName("");
        setContact("");
        setMessage("");
        return;
      }

      setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="content-stack-md" data-testid="products-request-panel">
      {isAuthenticated ? (
        <div className="inline-row inline-row-start">
          <button
            type="button"
            className="button button-primary button-page-cta"
            data-testid="products-request-open-button"
            onClick={() => {
              setModalOpen(true);
              setStatus("idle");
            }}
          >
            {labels.requestButton}
          </button>
        </div>
      ) : (
        <div className="inline-row inline-row-start">
          <button
            type="button"
            className="button button-primary button-page-cta"
            data-testid="products-signin-button"
            onClick={signIn}
            disabled={busy}
          >
            {labels.signInButton}
          </button>
        </div>
      )}

      {modalOpen ? (
        <div className="confirm-dialog-overlay" data-testid="products-request-modal">
          <div className="confirm-dialog dialog-wide">
            <h3 className="confirm-dialog-title">{labels.modalTitle}</h3>
            <form onSubmit={submit} className="list" data-testid="consultation-form">
              <label className="field">
                <span>{labels.name}</span>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-testid="consultation-name-input"
                />
              </label>
              <label className="field">
                <span>{labels.contact}</span>
                <input
                  className="input"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                  data-testid="consultation-contact-input"
                />
              </label>
              <label className="field">
                <span>{labels.message}</span>
                <textarea
                  className="textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  data-testid="consultation-message-input"
                />
              </label>

              <div className="confirm-dialog-actions dialog-actions-tight">
                <button
                  type="button"
                  className="button button-muted button-page-cta"
                  onClick={() => setModalOpen(false)}
                  data-testid="products-request-cancel"
                >
                  {labels.cancel}
                </button>
                <button
                  className="button button-primary button-page-cta"
                  type="submit"
                  data-testid="consultation-form-submit"
                  disabled={status === "loading"}
                >
                  {labels.submit}
                </button>
              </div>
            </form>

            {status === "success" ? <p className="muted" data-testid="consultation-success">{labels.success}</p> : null}
            {status === "error" ? <p className="muted" data-testid="consultation-error">{labels.error}</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
};
