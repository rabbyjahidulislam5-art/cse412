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

export default function ForgotPage() {
  const router = useRouter();
  const { push } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otpId, setOtpId] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ otpId?: string; demoCode?: string }>("/api/auth/forgot", {
        method: "POST",
        body: { email },
      });
      if (res.otpId) {
        setOtpId(res.otpId);
        setDemoCode(res.demoCode || "");
      }
      setStep(2);
      push({ type: "info", title: "If the email exists, a code was sent." });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (!otpId) return setError("Please request a code first.");
    setLoading(true);
    try {
      await api("/api/auth/reset", {
        method: "POST",
        body: { otpId, code, password },
      });
      push({ type: "success", title: "Password reset!", message: "You can now sign in." });
      router.push("/login");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 1) {
    return (
      <AuthCard
        title="Forgot password"
        subtitle="Enter your email and we'll send a reset code."
        footer={
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            ← Back to login
          </Link>
        }
      >
        <form onSubmit={requestReset} className="space-y-4">
          <ErrorBanner message={error} />
          <Field
            label="Email address"
            icon={<Icon.Mail size={18} />}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@ewubd.edu"
            required
          />
          <SubmitButton loading={loading}>Send reset code</SubmitButton>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle={`Enter the code sent to ${email} and choose a new password.`}
      footer={
        <button
          onClick={() => {
            setStep(1);
            setError(null);
          }}
          className="font-semibold text-brand-600 hover:underline"
        >
          ← Use a different email
        </button>
      }
    >
      <form onSubmit={reset} className="space-y-4">
        <ErrorBanner message={error} />
        <Field
          label="Reset code"
          icon={<Icon.Shield size={18} />}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          required
        />
        {demoCode && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2 text-xs text-brand-700">
            <Icon.Info size={14} /> Demo code:{" "}
            <span className="font-bold tracking-widest">{demoCode}</span>
          </div>
        )}
        <PasswordInput
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 8 characters"
          required
        />
        <PasswordInput
          label="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-type password"
          required
        />
        <button className="btn btn-primary w-full py-3" disabled={loading}>
          {loading && <Spinner size={16} />} Reset password
        </button>
      </form>
    </AuthCard>
  );
}
