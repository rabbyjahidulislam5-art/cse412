"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Icon } from "./Icon";
import { uid } from "@/lib/format";
import type { ToastMsg } from "@/lib/types";

interface Ctx {
  toasts: ToastMsg[];
  push: (t: Omit<ToastMsg, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<ToastMsg, "id">) => {
      const id = uid("toast");
      setToasts((prev) => [...prev, { ...t, id }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  return (
    <ToastCtx.Provider value={{ toasts, push, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

const icons = {
  success: <Icon.CheckCircle size={18} />,
  error: <Icon.Alert size={18} />,
  info: <Icon.Info size={18} />,
  warning: <Icon.Alert size={18} />,
};

const styles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-brand-200 bg-brand-50 text-brand-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

function ToastViewport({
  toasts,
  dismiss,
}: {
  toasts: ToastMsg[];
  dismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:top-6 sm:right-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-glow animate-toast-in ${styles[t.type]}`}
        >
          <div className="mt-0.5 shrink-0">{icons[t.type]}</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold leading-tight">{t.title}</div>
            {t.message && (
              <div className="mt-0.5 text-xs opacity-80 break-words">
                {t.message}
              </div>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="shrink-0 rounded-md p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
          >
            <Icon.Close size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
