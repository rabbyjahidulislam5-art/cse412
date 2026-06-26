"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { CountUp, StatusBadge, Spinner } from "@/components/ui/Primitives";
import { api } from "@/lib/api";
import { taka, formatDate, formatDateTime } from "@/lib/format";
import type { SessionUser, WalletTransaction } from "@/lib/types";

interface Dash {
  user: SessionUser;
  walletBalance: number;
  outstandingDues: number;
  activeFines: number;
  finesTotal: number;
  advisingCredits: number;
  advisingMax: number;
  advisingMin: number;
  advisingLocked: boolean;
  term: string;
  upcomingInstallment?: { title: string; amount: number; dueDate: string };
  recentTxns: WalletTransaction[];
  overdueBooks: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const d = await api<Dash>("/api/dashboard");
      setData(d);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-400">
        <Spinner size={28} />
      </div>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();

  const stats = [
    {
      label: "Outstanding Dues",
      value: data.outstandingDues,
      icon: <Icon.Receipt size={20} />,
      color: "from-rose-500 to-rose-600",
      href: "/app/financials",
    },
    {
      label: "Wallet Balance",
      value: data.walletBalance,
      icon: <Icon.Wallet size={20} />,
      color: "from-emerald-500 to-emerald-600",
      href: "/app/wallet",
      decimals: 2,
    },
    {
      label: "Active Fines",
      value: data.finesTotal,
      sub: `${data.activeFines} item${data.activeFines === 1 ? "" : "s"}`,
      icon: <Icon.Book size={20} />,
      color: "from-amber-500 to-amber-600",
      href: "/app/fines",
    },
    {
      label: "Advising Credits",
      value: data.advisingCredits,
      sub: `of ${data.advisingMax}`,
      icon: <Icon.Cap size={20} />,
      color: "from-brand-500 to-brand-700",
      href: "/app/advising",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">
          {greeting}, {data.user.name.split(" ")[0]} 👋
        </h2>
        <p className="text-sm text-ink-500">
          Here&apos;s your campus overview for {data.term}.
        </p>
      </div>

      {/* Advising lock banner */}
      {data.advisingLocked && (
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <Icon.Lock size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-800">
                Course advising is locked
              </p>
              <p className="text-xs text-rose-600">
                You have {data.activeFines} pending fine
                {data.activeFines === 1 ? "" : "s"}. Clear them to unlock
                advising.
              </p>
            </div>
          </div>
          <Link href="/app/fines" className="btn btn-danger shrink-0">
            Pay Fines
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-glow sm:p-5"
          >
            <div
              className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-soft`}
            >
              {s.icon}
            </div>
            <div className="text-xs font-medium text-ink-500">{s.label}</div>
            <div className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">
              <CountUp
                value={s.value}
                prefix="৳"
                decimals={s.decimals || 0}
              />
            </div>
            {s.sub && <div className="text-[11px] text-ink-400">{s.sub}</div>}
            <Icon.ArrowRight
              size={16}
              className="absolute right-3 top-3 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500"
            />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Upcoming installment / quick actions */}
        <div className="space-y-4 lg:col-span-2">
          {data.upcomingInstallment && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white sm:p-6">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-medium text-white/70">
                    Next Installment Due
                  </div>
                  <div className="mt-1 text-2xl font-extrabold sm:text-3xl">
                    {taka(data.upcomingInstallment.amount)}
                  </div>
                  <div className="mt-1 text-sm text-white/80">
                    {data.upcomingInstallment.title} · due{" "}
                    {formatDate(data.upcomingInstallment.dueDate)}
                  </div>
                </div>
                <Link
                  href="/app/financials"
                  className="btn shrink-0 bg-white px-5 py-2.5 text-sm font-bold text-brand-700 hover:bg-white/90"
                >
                  Pay Now
                </Link>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-bold text-ink-900">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Top-up Wallet", icon: "Wallet", href: "/app/wallet", color: "text-emerald-600 bg-emerald-50" },
                { label: "Pay Tuition", icon: "Receipt", href: "/app/financials", color: "text-brand-600 bg-brand-50" },
                { label: "Scan & Pay", icon: "QrCode", href: "/app/wallet", color: "text-violet-600 bg-violet-50" },
                { label: "View Fines", icon: "Book", href: "/app/fines", color: "text-amber-600 bg-amber-50" },
              ].map((a) => {
                const IconComp = Icon[a.icon as keyof typeof Icon];
                return (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex flex-col items-center gap-2 rounded-xl border border-ink-100 p-3 text-center transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft"
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.color}`}>
                      <IconComp size={20} />
                    </span>
                    <span className="text-[11px] font-semibold text-ink-700">
                      {a.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h3 className="text-sm font-bold text-ink-900">
                Recent Transactions
              </h3>
              <Link
                href="/app/wallet"
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                View all
              </Link>
            </div>
            {data.recentTxns.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-ink-400">
                No transactions yet.
              </div>
            ) : (
              <div className="divide-y divide-ink-50">
                {data.recentTxns.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-5 py-3 transition hover:bg-ink-50"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        t.amount >= 0
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {t.amount >= 0 ? (
                        <Icon.ArrowDown size={16} />
                      ) : (
                        <Icon.ArrowUp size={16} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-800">
                        {t.title}
                      </p>
                      <p className="text-[11px] text-ink-400">
                        {formatDateTime(t.date)} · {t.reference}
                      </p>
                    </div>
                    <div
                      className={`shrink-0 text-sm font-bold ${
                        t.amount >= 0 ? "text-emerald-600" : "text-ink-800"
                      }`}
                    >
                      {t.amount >= 0 ? "+" : "−"}
                      {taka(Math.abs(t.amount))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-bold text-ink-900">
              Advising Status
            </h3>
            <div className="flex items-center justify-between rounded-xl bg-ink-50 p-3">
              <span className="text-xs font-medium text-ink-600">
                {data.term}
              </span>
              <StatusBadge status={data.advisingLocked ? "locked" : "available"} />
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">Credits selected</span>
                <span className="font-bold text-ink-900">
                  {data.advisingCredits} / {data.advisingMax}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (data.advisingCredits / data.advisingMax) * 100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between pt-1 text-[11px] text-ink-400">
                <span>Min {data.advisingMin}</span>
                <span>Max {data.advisingMax}</span>
              </div>
            </div>
            <Link href="/app/advising" className="btn btn-outline mt-4 w-full">
              {data.advisingLocked ? "Locked — view fines" : "Manage advising"}
            </Link>
          </div>

          {data.overdueBooks > 0 && (
            <div className="card border-amber-200 bg-amber-50/50 p-5">
              <div className="flex items-center gap-2 text-amber-700">
                <Icon.Alert size={18} />
                <h3 className="text-sm font-bold">{data.overdueBooks} overdue book(s)</h3>
              </div>
              <p className="mt-1 text-xs text-amber-700/80">
                Return or extend to avoid additional fines.
              </p>
              <Link href="/app/fines" className="btn btn-outline mt-3 w-full border-amber-300 text-amber-700">
                Go to Library
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
