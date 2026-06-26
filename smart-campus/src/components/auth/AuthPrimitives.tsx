"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "../ui/Icon";
import { Spinner } from "../ui/Primitives";

// Password input with show/hide toggle used across all auth forms.
export function PasswordInput({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
          <Icon.Lock size={18} />
        </span>
        <input
          {...props}
          type={show ? "text" : "password"}
          className="input pl-10 pr-10"
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition hover:text-ink-700"
        >
          {show ? <Icon.EyeOff size={18} /> : <Icon.Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export function Field({
  label,
  icon,
  ...props
}: { label: string; icon?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            {icon}
          </span>
        )}
        <input {...props} className={`input ${icon ? "pl-10" : ""}`} />
      </div>
    </div>
  );
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="animate-slide-up">
      <div className="mb-6 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <span className="text-xs font-extrabold">EWU</span>
          </div>
          <div>
            <div className="text-sm font-bold text-ink-900">Smart Campus</div>
            <div className="text-[11px] text-ink-500">East West University</div>
          </div>
        </div>
      </div>
      <h2 className="text-2xl font-extrabold text-ink-900">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>}
      <div className="mt-6">{children}</div>
      {footer && <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>}
    </div>
  );
}

export function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn btn-primary w-full py-3"
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 animate-fade-in">
      <Icon.Alert size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
