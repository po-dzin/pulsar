"use client";

import type { AdminToast } from "@/presentation/components/admin/useAdminToasts";

type Props = {
  toast: AdminToast;
  onDismiss: (id: string) => void;
  testId?: string;
};

export const AdminToastItem = ({ toast, onDismiss, testId }: Props) => {
  return (
    <article className="admin-toast-item" data-testid={testId} data-type={toast.type}>
      <div className="admin-toast-content">
        <p className="admin-toast-title">{toast.title}</p>
        <p className="admin-toast-message">{toast.message}</p>
      </div>
      <button
        type="button"
        className="admin-toast-close"
        aria-label="Close notification"
        onClick={() => onDismiss(toast.id)}
        data-testid={`admin-toast-close-${toast.id}`}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </article>
  );
};
