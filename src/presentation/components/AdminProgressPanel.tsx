"use client";

import { useEffect, useState } from "react";

type Progress = {
  id: string;
  userId: string;
  overallPct: number;
  level: string;
  createdAt: string;
};

export const AdminProgressPanel = () => {
  const [rows, setRows] = useState<Progress[]>([]);

  useEffect(() => {
    fetch("/api/admin/progress")
      .then((res) => res.json())
      .then((data) => setRows(data.results ?? []));
  }, []);

  return (
    <section className="card" data-testid="admin-progress-table">
      <h3>Progress</h3>
      <div className="list">
        {rows.map((row) => (
          <div className="answer-option" key={row.id}>
            <span className="muted">{row.userId.slice(0, 8)}...</span>
            <strong>{row.overallPct}%</strong>
            <span>{row.level}</span>
          </div>
        ))}
        {rows.length === 0 ? <p className="muted">No progress data yet.</p> : null}
      </div>
    </section>
  );
};
