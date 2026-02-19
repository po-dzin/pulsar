"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: string;
  name: string;
  contact: string;
  status: "new" | "in_progress" | "done" | "archived";
  createdAt: string;
};

export const AdminLeadsPanel = () => {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetch("/api/admin/leads")
      .then((res) => res.json())
      .then((data) => setLeads(data.leads ?? []));
  }, []);

  const updateStatus = async (id: string, status: Lead["status"]) => {
    await fetch(`/api/admin/leads/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
  };

  return (
    <section className="card" data-testid="admin-leads-table">
      <h3>Leads</h3>
      <div className="list">
        {leads.map((lead, index) => (
          <div key={lead.id} className="answer-option">
            <div>
              <strong>{lead.name}</strong>
              <p className="muted">{lead.contact}</p>
            </div>
            <select
              className="select"
              value={lead.status}
              onChange={(e) => updateStatus(lead.id, e.target.value as Lead["status"])}
              data-testid={`lead-status-select-${index}`}
            >
              <option value="new">new</option>
              <option value="in_progress">in_progress</option>
              <option value="done">done</option>
              <option value="archived">archived</option>
            </select>
            <button
              type="button"
              className="button button-muted"
              onClick={() => updateStatus(lead.id, lead.status)}
              data-testid={`lead-status-save-${index}`}
            >
              Save
            </button>
          </div>
        ))}
        {leads.length === 0 ? <p className="muted">No leads yet.</p> : null}
      </div>
    </section>
  );
};
