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

export default function RegisterPage() {
  const router = useRouter();
  const { push } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    studentId: "",
    program: "",
    phone: "",
    password: "",
    confirm: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP verification step
  const [otpId, setOtpId] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const pwStrong = form.password.length >= 8;
  const pwMatch = form.password === form.confirm && form.confirm.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pwStrong) return setError("Password must be at least 8 characters.");
    if (!pwMatch) return setError("Passwords do not match.");
    if (!form.agree) return setError("Please accept the terms to continue.");
    setLoading(true);
    try {
      const res = await api<{ otpId: string; demoCode?: string }>("/api/auth/register", {
        method: "POST",
        body: form,
      });
      setOtpId(res.otpId);
      setDemoCode(res.demoCode || "");
      push({ type: "info", title: "Verification code sent", message: "Check the demo hint." });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!otpId) return;
    setVerifying(true);
    try {
      await api("/api/auth/verify-email", {
        method: "POST",
        body: { otpId, code },
      });
      push({ type: "success", title: "Account created!", message: "You can now sign in." });
      router.push("/login");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setVerifying(false);
    }
  }

  if (otpId) {
    return (
      <AuthCard
        title="Verify your email"
        subtitle={`We sent a 6-digit code to ${form.email}.`}
        footer={
          <button
            onClick={() => {
              setOtpId(null);
              setError(null);
            }}
            className="font-semibold text-brand-600 hover:underline"
          >
            ← Back to edit details
          </button>
        }
      >
        <form onSubmit={verify} className="space-y-4">
          <ErrorBanner message={error} />
          <Field
            label="Verification code"
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
          <button className="btn btn-primary w-full py-3" disabled={verifying}>
            {verifying && <Spinner size={16} />} Verify & Create Account
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Register to access the Smart Campus platform."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner message={error} />
        <Field
          label="Full name"
          icon={<Icon.User size={18} />}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Arif Hossain"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Student ID"
            icon={<Icon.Cap size={18} />}
            value={form.studentId}
            onChange={(e) => set("studentId", e.target.value)}
            placeholder="2021-1-60-012"
            required
          />
          <Field
            label="Phone"
            icon={<Icon.Phone size={18} />}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+8801XXXXXXXXX"
          />
        </div>
        <Field
          label="Email"
          icon={<Icon.Mail size={18} />}
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="you@ewubd.edu"
          required
        />
        <Field
          label="Program"
          value={form.program}
          onChange={(e) => set("program", e.target.value)}
          placeholder="B.Sc. in Computer Science & Engineering"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordInput
            label="Password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="Min 8 characters"
            required
          />
          <PasswordInput
            label="Confirm"
            value={form.confirm}
            onChange={(e) => set("confirm", e.target.value)}
            placeholder="Re-type password"
            required
          />
        </div>
        {form.confirm.length > 0 && (
          <div className={`text-xs ${pwMatch ? "text-emerald-600" : "text-rose-600"}`}>
            {pwMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
          </div>
        )}
        <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={form.agree}
            onChange={(e) => set("agree", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          <span>
            I agree to the{" "}
            <span className="font-semibold text-brand-600">Terms of Service</span> and{" "}
            <span className="font-semibold text-brand-600">Privacy Policy</span>.
          </span>
        </label>
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
    </AuthCard>
  );
}
