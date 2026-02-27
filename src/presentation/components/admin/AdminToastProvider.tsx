"use client";

import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AdminToastViewport } from "@/presentation/components/admin/AdminToastViewport";
import type { AdminToast, AdminToastInput } from "@/presentation/components/admin/useAdminToasts";

type ContextValue = {
  toasts: AdminToast[];
  pushToast: (payload: AdminToastInput) => void;
  dismissToast: (id: string) => void;
};

const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_DURATION_MS = 10000;

export const AdminToastContext = createContext<ContextValue | null>(null);

const createToastId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const AdminToastProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueue] = useState<AdminToast[]>([]);
  const timerMapRef = useRef<Map<string, number>>(new Map());

  const visibleToasts = useMemo(() => queue.slice(0, MAX_VISIBLE_TOASTS), [queue]);

  const dismissToast = useCallback((id: string) => {
    const timer = timerMapRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timerMapRef.current.delete(id);
    }
    setQueue((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((payload: AdminToastInput) => {
    const toast: AdminToast = {
      ...payload,
      durationMs: payload.durationMs ?? DEFAULT_DURATION_MS,
      id: createToastId(),
    };

    setQueue((prev) => [...prev, toast]);
  }, []);

  useEffect(() => {
    visibleToasts.forEach((toast) => {
      if (timerMapRef.current.has(toast.id)) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        dismissToast(toast.id);
      }, toast.durationMs ?? DEFAULT_DURATION_MS);
      timerMapRef.current.set(toast.id, timeoutId);
    });
  }, [dismissToast, visibleToasts]);

  useEffect(() => {
    const timers = timerMapRef.current;
    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
      timers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      toasts: visibleToasts,
      pushToast,
      dismissToast,
    }),
    [dismissToast, pushToast, visibleToasts]
  );

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      <AdminToastViewport toasts={visibleToasts} onDismiss={dismissToast} />
    </AdminToastContext.Provider>
  );
};
