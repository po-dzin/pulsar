"use client";

import { AdminToastItem } from "@/presentation/components/admin/AdminToastItem";
import type { AdminToast } from "@/presentation/components/admin/useAdminToasts";

type Props = {
  toasts: AdminToast[];
  onDismiss: (id: string) => void;
};

export const AdminToastViewport = ({ toasts, onDismiss }: Props) => {
  return (
    <section className="admin-toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <AdminToastItem key={toast.id} toast={toast} onDismiss={onDismiss} testId="admin-toast" />
      ))}
    </section>
  );
};
