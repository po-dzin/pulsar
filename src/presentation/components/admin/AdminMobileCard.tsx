"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  showToggle?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
};

export const AdminMobileCard = ({ title, subtitle, expanded, onToggle, showToggle = true, actions, children }: Props) => {
  return (
    <article className="admin-mobile-card">
      <div className="admin-mobile-card-head">
        <div>
          <p className="admin-mobile-card-title">{title}</p>
          {subtitle ? <p className="muted admin-mobile-card-subtitle">{subtitle}</p> : null}
        </div>
        {showToggle ? (
          <button type="button" className="button button-muted admin-expand-btn" onClick={onToggle}>
            {expanded ? "Hide" : "Details"}
          </button>
        ) : null}
      </div>
      {actions ? <div className="admin-mobile-card-actions">{actions}</div> : null}
      {expanded ? <div className="admin-mobile-card-body">{children}</div> : null}
    </article>
  );
};
