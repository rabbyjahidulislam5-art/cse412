"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  Button,
  CountUp,
  EmptyState,
  Modal,
  Spinner,
  StatusBadge,
} from "@/components/ui/Primitives";
import { OtpModal, OtpRequest } from "@/components/ui/OtpModal";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatDateTime, taka } from "@/lib/format";
import type { FeeLine, Installment, Receipt, WalletTransaction } from "@/lib/types";

interface Data {
  fees: FeeLine[];
  installments: Installment[];
  transactions: WalletTransaction[];
  receipts: Receipt[];
  walletBalance: number;
}

type PayTarget =
  | { kind: "fee"; id: string; title: string; amount: number }
  | { kind: "installment"; id: string; title: string; amount: number };

const CATEGORY_COLORS: Record<string, string> = {
  tuition: "bg-brand-600",
  lab: "bg-violet-500",
  library: "bg-amber-500",
  activity: "bg-emerald-500",
  other: "bg-ink-400",
};

export default function FinancialsPage() {
  const { push } = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"fees" | "installments" | "history">("fees");
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null);
  const [useWallet, setUseWallet] = useState(true);
  const [otp, setOtp] = useState<OtpRequest | null>(null);
  const [paying, setPaying] = useState(false);

  async function load() {
    try {
      setData(await api<Data>("/api/financials"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    if (!data) return { due: 0, paid: 0 };
    const due = data.fees
      .filter((f) => f.status !== "paid")
      .reduce((s, f) => s + f.amount, 0);
    const paid = data.fees
      .filter((f) => f.status === "paid")
      .reduce((s, f) => s + f.amount, 0);
    return { due, paid };
  }, [data]);

  function openPay(target: PayTarget) {
    setPayTarget(target);
    setUseWallet(true);
  }

  function confirmPay() {
    if (!payTarget) return;
    setPaying(true);
    setOtp({
      purpose: "tuition-pay",
      payload: { kind: payTarget.kind, id: payTarget.id, useWallet },
      title: "Confirm Payment",
      subtitle: `${payTarget.title} · ${taka(payTarget.amount)}`,
      onSuccess: () => {
        setPayTarget(null);
        load();
      },
    });
    setPaying(false);
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
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="text-xs font-medium text-ink-500">Outstanding Dues</div>
          <div className="mt-1 text-2xl font-extrabold text-rose-600">
            <CountUp value={totals.due} prefix="৳" />
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium text-ink-500">Already Paid</div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-600">
            <CountUp value={totals.paid} prefix="৳" />
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium text-ink-500">Wallet Balance</div>
          <div className="mt-1 text-2xl font-extrabold text-brand-600">
            <CountUp value={data.walletBalance} prefix="৳" decimals={2} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-ink-100 p-1">
        {(
          [
            { id: "fees", label: "Fee Breakdown" },
            { id: "installments", label: "Installment Plan" },
            { id: "history", label: "Payment History" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-white text-brand-700 shadow-soft"
                : "text-ink-500 hover:text-ink-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Fee breakdown */}
      {tab === "fees" && (
        <div className="card overflow-hidden">
          {data.fees.length === 0 ? (
            <EmptyState
              icon={<Icon.Receipt size={26} />}
              title="No fees"
              description="You have no outstanding fees right now."
            />
          ) : (
            <div className="divide-y divide-ink-50">
              {data.fees.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col gap-3 p-4 transition hover:bg-ink-50 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${
                        CATEGORY_COLORS[f.category]
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">
                        {f.label}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
                        Due {formatDate(f.dueDate)}
                        <StatusBadge status={f.status} />
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-base font-extrabold text-ink-900">
                      {taka(f.amount)}
                    </span>
                    {f.status !== "paid" ? (
                      <Button size="sm" onClick={() => openPay({ kind: "fee", id: f.id, title: f.label, amount: f.amount })}>
                        Pay
                      </Button>
                    ) : (
                      <span className="chip bg-emerald-100 text-emerald-700">
                        <Icon.Check size={14} /> Paid
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Installment plan */}
      {tab === "installments" && (
        <div className="card overflow-hidden">
          {data.installments.length === 0 ? (
            <EmptyState
              icon={<Icon.Calendar size={26} />}
              title="No installment plan"
              description="Your installment schedule will appear here."
            />
          ) : (
            <div className="divide-y divide-ink-50">
              {data.installments.map((ins, i) => (
                <div
                  key={ins.id}
                  className="flex flex-col gap-3 p-4 transition hover:bg-ink-50 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-600">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{ins.title}</p>
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        {ins.status === "paid" && ins.paidDate
                          ? `Paid ${formatDate(ins.paidDate)}`
                          : `Due ${formatDate(ins.dueDate)}`}{" "}
                        <StatusBadge status={ins.status} />
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-base font-extrabold text-ink-900">
                      {taka(ins.amount)}
                    </span>
                    {ins.status !== "paid" ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          openPay({
                            kind: "installment",
                            id: ins.id,
                            title: ins.title,
                            amount: ins.amount,
                          })
                        }
                      >
                        Pay
                      </Button>
                    ) : (
                      <span className="chip bg-emerald-100 text-emerald-700">
                        <Icon.Check size={14} /> Paid
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment history */}
      {tab === "history" && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-4">
              <h3 className="text-sm font-bold text-ink-900">Transaction History</h3>
            </div>
            {data.transactions.length === 0 ? (
              <EmptyState
                icon={<Icon.Receipt size={26} />}
                title="No transactions"
                description="Your payment history will appear here."
              />
            ) : (
              <div className="divide-y divide-ink-50">
                {data.transactions.map((t) => (
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
                      {t.amount >= 0 ? <Icon.ArrowDown size={16} /> : <Icon.ArrowUp size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-800">{t.title}</p>
                      <p className="text-[11px] text-ink-400">
                        {formatDateTime(t.date)} · {t.reference}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={`text-sm font-bold ${
                          t.amount >= 0 ? "text-emerald-600" : "text-ink-800"
                        }`}
                      >
                        {t.amount >= 0 ? "+" : "−"}
                        {taka(Math.abs(t.amount))}
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Receipts */}
          <div className="card overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-4">
              <h3 className="text-sm font-bold text-ink-900">Downloadable Receipts</h3>
            </div>
            {data.receipts.length === 0 ? (
              <EmptyState
                icon={<Icon.Download size={26} />}
                title="No receipts yet"
                description="Receipts are generated automatically after each payment."
              />
            ) : (
              <div className="divide-y divide-ink-50">
                {data.receipts.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-ink-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-800">
                        {r.purpose}
                      </p>
                      <p className="text-[11px] text-ink-400">
                        {formatDate(r.date)} · {r.reference}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-bold text-ink-900">
                        {taka(r.amount)}
                      </span>
                      <a
                        href={`/api/receipts/${r.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline px-3 py-1.5 text-xs"
                      >
                        <Icon.Download size={14} /> Receipt
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pay confirm modal */}
      <Modal
        open={!!payTarget}
        onClose={() => setPayTarget(null)}
        title="Confirm Payment"
        subtitle={payTarget?.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayTarget(null)}>
              Cancel
            </Button>
            <Button onClick={confirmPay} loading={paying}>
              Continue to OTP
            </Button>
          </>
        }
      >
        {payTarget && (
          <div className="space-y-4">
            <div className="rounded-xl bg-ink-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Amount</span>
                <span className="font-bold text-ink-900">
                  {taka(payTarget.amount)}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-ink-500">Wallet balance</span>
                <span className="font-semibold text-ink-700">
                  {taka(data.walletBalance)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  useWallet
                    ? "border-brand-500 bg-brand-50"
                    : "border-ink-200"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={useWallet}
                  onChange={() => setUseWallet(true)}
                  className="h-4 w-4 text-brand-600"
                />
                <Icon.Wallet size={18} className="text-brand-600" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-ink-900">Pay from Wallet</div>
                  <div className="text-[11px] text-ink-500">
                    Balance: {taka(data.walletBalance)}
                  </div>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  !useWallet
                    ? "border-brand-500 bg-brand-50"
                    : "border-ink-200"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={!useWallet}
                  onChange={() => setUseWallet(false)}
                  className="h-4 w-4 text-brand-600"
                />
                <Icon.Receipt size={18} className="text-violet-600" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-ink-900">Card / Net Banking</div>
                  <div className="text-[11px] text-ink-500">
                    Pay ৳{payTarget.amount.toLocaleString("en-IN")} directly
                  </div>
                </div>
              </label>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-3 py-2 text-xs text-brand-700">
              <Icon.Shield size={14} />
              A 6-digit OTP will be required to complete this payment.
            </div>
          </div>
        )}
      </Modal>

      <OtpModal request={otp} onClose={() => setOtp(null)} />
    </div>
  );
}
