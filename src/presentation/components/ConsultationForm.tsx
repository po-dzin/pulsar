"use client";

import { useState } from "react";

type Props = {
  labels: {
    title: string;
    name: string;
    contact: string;
    message: string;
    submit: string;
    success: string;
    authRequired: string;
    error: string;
  };
};

export const ConsultationForm = ({ labels }: Props) => {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "unauthorized">("idle");

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

      if (response.status === 401) {
        setStatus("unauthorized");
        return;
      }

      setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="card" id="consultation-request">
      <h2>{labels.title}</h2>
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
        <button className="button button-primary" type="submit" data-testid="consultation-form-submit" disabled={status === "loading"}>
          {labels.submit}
        </button>
      </form>
      {status === "success" ? <p className="muted" data-testid="consultation-success">{labels.success}</p> : null}
      {status === "unauthorized" ? <p className="muted" data-testid="consultation-error">{labels.authRequired}</p> : null}
      {status === "error" ? <p className="muted" data-testid="consultation-error">{labels.error}</p> : null}
    </section>
  );
};
