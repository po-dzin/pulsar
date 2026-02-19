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
  };
};

export const ConsultationForm = ({ labels }: Props) => {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");

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
  };

  return (
    <section className="card">
      <h2>{labels.title}</h2>
      <form onSubmit={submit} className="list">
        <label className="field">
          <span>{labels.name}</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="field">
          <span>{labels.contact}</span>
          <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} required />
        </label>
        <label className="field">
          <span>{labels.message}</span>
          <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} required />
        </label>
        <button className="button button-primary" type="submit" data-testid="consultation-form-submit" disabled={status === "loading"}>
          {labels.submit}
        </button>
      </form>
      {status === "success" ? <p className="muted">{labels.success}</p> : null}
      {status === "error" ? <p className="muted">Request failed, try again.</p> : null}
    </section>
  );
};
