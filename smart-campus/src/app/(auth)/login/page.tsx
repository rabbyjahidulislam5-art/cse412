"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import {
  AuthCard,
  ErrorBanner,
  Field,
  PasswordInput,
  SubmitButton,
} from "@/components/auth/AuthPrimitives";
import { Spinner } from "@/components/ui/Primitives";

export default function LoginPage() {
  const router = useRouter();
  const { push } = useToast();
  const [email, setEmail] = useState("demo@ewubd.edu");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP step (when 2FA enabled)
  const [otp, setOtp] = useState({
    id: "",
    code: "",
    demo: "",
    verifying: false,
  });
  const [needsOtp, setNeedsOtp] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ requiresOtp?: boolean; otpId?: string; demoCode?: string; ok?: boolean }>(
        "/api/auth/login",
        { method: "POST", body: { email, password } }
      );
      if (res.requiresOtp) {
        setOtp({ id: res.otpId!, code: "", demo: res.demoCode || "", verifying: false });
        setNeedsOtp(true);
        return;
      }
      push({ type: "success", title: "Welcome back!" });
      router.push("/app/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtp((s) => ({ ...s, verifying: true }));
    try {
      await api("/api/auth/login/verify", {
        method: "POST",
        body: { otpId: otp.id, code: otp.code },
      });
      push({ type: "success", title: "Logged in securely" });
      router.push("/app/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOtp((s) => ({ ...s, verifying: false }));
    }
  }

  if (needsOtp) {
    return (
      <AuthCard
        title="Two-factor verification"
        subtitle="Enter the 6-digit code sent to your registered email."
        footer={
          <button
            onClick={() => {
              setNeedsOtp(false);
              setError(null);
            }}
            className="font-semibold text-brand-600 hover:underline"
          >
            ← Back to login
          </button>
        }
      >
        <form onSubmit={verifyOtp} className="space-y-4">
          <ErrorBanner message={error} />
          <div className="flex justify-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                inputMode="numeric"
                maxLength={1}
                value={otp.code[i] || ""}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(-1);
                  const arr = otp.code.padEnd(6, " ").split("");
                  arr[i] = v;
                  setOtp((s) => ({ ...s, code: arr.join("").trimEnd() }));
                  const next = e.target.parentElement?.children[i + 1] as HTMLInputElement;
                  next?.focus();
                }}
                className="h-12 w-10 rounded-xl border border-ink-200 text-center text-lg font-bold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:h-14 sm:w-12"
              />
            ))}
          </div>
          {otp.demo && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2 text-xs text-brand-700">
              <Icon.Info size={14} /> Demo code:{" "}
              <span className="font-bold tracking-widest">{otp.demo}</span>
            </div>
          )}
          <button className="btn btn-primary w-full py-3" disabled={otp.verifying}>
            {otp.verifying && <Spinner size={16} />} Verify & Continue
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Welcome back. Please enter your credentials."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-brand-600 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner message={error} />
        <Field
          label="Email or Student ID"
          icon={<Icon.Mail size={18} />}
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="demo@ewubd.edu"
          required
        />
        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
            Remember me
          </label>
          <Link href="/forgot" className="text-sm font-semibold text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 p-4 text-xs text-brand-800">
        <div className="mb-1 font-bold">Demo credentials</div>
        <div>Email: <span className="font-mono">demo@ewubd.edu</span></div>
        <div>Password: <span className="font-mono">demo1234</span></div>
        <div className="mt-1 text-brand-600">2FA is on — a demo OTP will be shown.</div>
      </div>
    </AuthCard>
  );
}
