"use client";
import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

// ---- Spinner ---------------------------------------------------------------
export function Spinner({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ---- Button ----------------------------------------------------------------
type Variant = "primary" | "ghost" | "outline" | "danger" | "gold";
type Size = "sm" | "md";
const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 hover:shadow-glow",
  ghost: "bg-transparent text-ink-700 hover:bg-ink-100",
  outline: "border border-ink-200 bg-white text-ink-800 hover:border-brand-400 hover:text-brand-600",
  danger: "bg-danger text-white hover:brightness-110",
  gold: "bg-gold-500 text-white hover:bg-gold-600",
};
const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
};
export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`btn ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? <Spinner size={16} /> : icon}
      {children}
    </button>
  );
}

// ---- IconButton ------------------------------------------------------------
export function IconButton({
  children,
  label,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      {...props}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-600 transition-all hover:bg-ink-100 hover:text-brand-600 active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

// ---- Modal -----------------------------------------------------------------
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  const maxW =
    size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-md";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxW} animate-slide-up rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {title && (
              <h3 className="truncate text-base font-bold text-ink-900 sm:text-lg">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-ink-500 sm:text-sm">{subtitle}</p>
            )}
          </div>
          <IconButton label="Close" onClick={onClose} className="-mr-2">
            <Icon.Close size={20} />
          </IconButton>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-ink-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- StatusBadge -----------------------------------------------------------
export function StatusBadge({
  status,
}: {
  status: string;
}) {
  const map: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700",
    success: "bg-emerald-100 text-emerald-700",
    active: "bg-amber-100 text-amber-700",
    due: "bg-amber-100 text-amber-700",
    overdue: "bg-rose-100 text-rose-700",
    unpaid: "bg-rose-100 text-rose-700",
    partial: "bg-amber-100 text-amber-700",
    upcoming: "bg-brand-100 text-brand-700",
    available: "bg-emerald-100 text-emerald-700",
    selected: "bg-brand-600 text-white",
    full: "bg-ink-200 text-ink-700",
    locked: "bg-rose-100 text-rose-700",
    disputed: "bg-violet-100 text-violet-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-rose-100 text-rose-700",
    borrowed: "bg-brand-100 text-brand-700",
    returned: "bg-ink-100 text-ink-600",
  };
  return (
    <span className={`chip capitalize ${map[status] || "bg-ink-100 text-ink-700"}`}>
      {status}
    </span>
  );
}

// ---- CountUp ---------------------------------------------------------------
export function CountUp({
  value,
  duration = 900,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <span className={`tabular ${className}`}>
      {prefix}
      {display.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

// ---- EmptyState ------------------------------------------------------------
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-ink-800">{title}</h4>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-ink-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---- ConfirmDialog ---------------------------------------------------------
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-600">{message}</p>
    </Modal>
  );
}
