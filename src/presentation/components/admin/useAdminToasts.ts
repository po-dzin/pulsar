"use client";

import { useContext } from "react";
import { AdminToastContext } from "@/presentation/components/admin/AdminToastProvider";

export type AdminToastType = "success" | "error" | "info" | "warning";

export type AdminToastInput = {
  type: AdminToastType;
  title: string;
  message: string;
  durationMs?: number;
};

export type AdminToast = AdminToastInput & {
  id: string;
};

export const useAdminToasts = () => {
  const context = useContext(AdminToastContext);
  if (!context) {
    throw new Error("useAdminToasts must be used inside AdminToastProvider");
  }

  return context;
};
