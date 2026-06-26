"use client";
import React, { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  Button,
  ConfirmDialog,
  Spinner,
  StatusBadge,
} from "@/components/ui/Primitives";
import { Field, PasswordInput } from "@/components/auth/AuthPrimitives";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { initials, timeAgo } from "@/lib/format";
import type { Account, ActiveSession } from "@/lib/types";

interface Data {
  account: Account;
  sessions: ActiveSession[];
}

export default function SettingsPage() {
  const { push } = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profile" | "security" | "sessions">("profile");

  // profile form
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    program: "",
    department: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // password form
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

  // 2FA
  const [twoFA, setTwoFA] = useState(false);
  const [saving2fa, setSaving2fa] = useState(false);

  // sessions
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  async function load() {
    try {
      const d = await api<Data>("/api/settings");
      setData(d);
      setProfile({
        name: d.account.name,
        phone: d.account.phone,
        program: d.account.program,
        department: d.account.department,
      });
      setTwoFA(d.account.twoFactorEnabled);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api("/api/settings/profile", { method: "PATCH", body: profile });
      push({ type: "success", title: "Profile updated" });
      load();
    } catch (e: any) {
      push({ type: "error", title: "Update failed", message: e.message });
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePw(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next !== pw.confirm)
      return push({ type: "warning", title: "Passwords do not match" });
    setSavingPw(true);
    try {
      await api("/api/settings/password", {
        method: "POST",
        body: { current: pw.current, next: pw.next },
      });
      push({ type: "success", title: "Password changed" });
      setPw({ current: "", next: "", confirm: "" });
    } catch (e: any) {
      push({ type: "error", title: "Failed", message: e.message });
    } finally {
      setSavingPw(false);
    }
  }

  async function toggle2FA() {
    setSaving2fa(true);
    try {
      await api("/api/settings/security", {
        method: "POST",
        body: { action: "toggle-2fa", enabled: !twoFA },
      });
      setTwoFA(!twoFA);
      push({
        type: "success",
        title: `2FA ${!twoFA ? "enabled" : "disabled"}`,
      });
    } catch (e: any) {
      push({ type: "error", title: "Failed", message: e.message });
    } finally {
      setSaving2fa(false);
    }
  }

  async function revokeSession() {
    if (!revokeId) return;
    setRevoking(true);
    try {
      await api("/api/settings/security", {
        method: "POST",
        body: { action: "revoke-session", sessionId: revokeId },
      });
      push({ type: "success", title: "Session revoked" });
      setRevokeId(null);
      load();
    } catch (e: any) {
      push({ type: "error", title: "Failed", message: e.message });
    } finally {
      setRevoking(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-400">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="card flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold text-white"
          style={{ background: data.account.avatarColor }}
        >
          {initials(data.account.name)}
        </span>
        <div className="text-center sm:text-left">
          <h2 className="text-lg font-extrabold text-ink-900">{data.account.name}</h2>
          <p className="text-sm text-ink-500">{data.account.email}</p>
          <div className="mt-1 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className="chip bg-brand-100 text-brand-700">{data.account.studentId}</span>
            {data.account.emailVerified ? (
              <span className="chip bg-emerald-100 text-emerald-700">
                <Icon.Check size={12} /> Verified
              </span>
            ) : (
              <span className="chip bg-amber-100 text-amber-700">
                <Icon.Alert size={12} /> Unverified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-ink-100 p-1">
        {(
          [
            { id: "profile", label: "Profile" },
            { id: "security", label: "Security" },
            { id: "sessions", label: "Sessions" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? "bg-white text-brand-700 shadow-soft" : "text-ink-500 hover:text-ink-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === "profile" && (
        <form onSubmit={saveProfile} className="card space-y-4 p-5 sm:p-6">
          <h3 className="text-sm font-bold text-ink-900">Personal Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              icon={<Icon.User size={18} />}
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
            <Field
              label="Phone"
              icon={<Icon.Phone size={18} />}
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <Field
            label="Program"
            value={profile.program}
            onChange={(e) => setProfile((p) => ({ ...p, program: e.target.value }))}
          />
          <Field
            label="Department"
            value={profile.department}
            onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Email (read-only)</label>
              <input value={data.account.email} disabled className="input bg-ink-50 text-ink-500" />
            </div>
            <div>
              <label className="label">Student ID (read-only)</label>
              <input value={data.account.studentId} disabled className="input bg-ink-50 text-ink-500" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={savingProfile}>
              <Icon.Check size={16} /> Save Changes
            </Button>
          </div>
        </form>
      )}

      {/* Security */}
      {tab === "security" && (
        <div className="space-y-4">
          <form onSubmit={savePw} className="card space-y-4 p-5 sm:p-6">
            <h3 className="text-sm font-bold text-ink-900">Change Password</h3>
            <PasswordInput
              label="Current password"
              value={pw.current}
              onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <PasswordInput
                label="New password"
                value={pw.next}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                required
              />
              <PasswordInput
                label="Confirm new password"
                value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={savingPw}>
                Update Password
              </Button>
            </div>
          </form>

          {/* 2FA */}
          <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon.Shield size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-ink-900">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-ink-500">
                  Require an OTP on login and for all financial actions.
                </p>
              </div>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-3">
              <span className="text-xs font-semibold text-ink-600">
                {twoFA ? "On" : "Off"}
              </span>
              <button
                type="button"
                onClick={toggle2FA}
                disabled={saving2fa}
                className={`relative h-6 w-11 rounded-full transition ${
                  twoFA ? "bg-brand-600" : "bg-ink-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    twoFA ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      )}

      {/* Sessions */}
      {tab === "sessions" && (
        <div className="card overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-4">
            <h3 className="text-sm font-bold text-ink-900">Active Sessions</h3>
            <p className="text-[11px] text-ink-400">
              Devices currently signed into your account.
            </p>
          </div>
          <div className="divide-y divide-ink-50">
            {data.sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-4 transition hover:bg-ink-50 sm:p-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
                  <Icon.User size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    {s.device} · {s.browser}
                    {s.current && (
                      <span className="ml-2 chip bg-emerald-100 text-emerald-700">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-ink-400">
                    {s.location} · {s.ip} · Active {timeAgo(s.lastActive)}
                  </p>
                </div>
                {!s.current && (
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                    onClick={() => setRevokeId(s.id)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!revokeId}
        onClose={() => setRevokeId(null)}
        onConfirm={revokeSession}
        loading={revoking}
        title="Revoke session?"
        message="This will sign out that device immediately."
        confirmLabel="Revoke"
        danger
      />
    </div>
  );
}
