"use client";
import React, { useEffect, useState } from "react";
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
import { QrCode } from "@/components/ui/QrCode";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime, maskAccount, taka } from "@/lib/format";
import type { WalletTransaction } from "@/lib/types";

interface Data {
  walletBalance: number;
  transactions: WalletTransaction[];
}

const QUICK = [500, 1000, 2000, 5000];

export default function WalletPage() {
  const { push } = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"topup" | "qrpay" | "history">("topup");

  // Top-up
  const [topupOpen, setTopupOpen] = useState(false);
  const [method, setMethod] = useState<"bkash" | "nagad">("bkash");
  const [amount, setAmount] = useState<number>(1000);
  const [acc, setAcc] = useState("");
  const [otp, setOtp] = useState<OtpRequest | null>(null);

  // QR pay
  const [qrAmount, setQrAmount] = useState<number>(0);
  const [merchant, setMerchant] = useState("Campus Café");
  const [qrOtp, setQrOtp] = useState<OtpRequest | null>(null);

  async function load() {
    try {
      setData(await api<Data>("/api/wallet"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  function confirmTopup() {
    if (amount <= 0) return push({ type: "warning", title: "Enter a valid amount" });
    if (amount > 50000) return push({ type: "warning", title: "Max top-up is ৳50,000" });
    if (acc.replace(/\D/g, "").length < 10)
      return push({ type: "warning", title: "Enter a valid account number" });
    setOtp({
      purpose: "wallet-topup",
      payload: { amount, method },
      title: "Confirm Top-up",
      subtitle: `${taka(amount)} via ${method.toUpperCase()}`,
      onSuccess: () => {
        setTopupOpen(false);
        setAcc("");
        load();
      },
    });
  }

  function confirmQrPay() {
    if (qrAmount <= 0) return push({ type: "warning", title: "Enter an amount" });
    if (data && qrAmount > data.walletBalance)
      return push({ type: "warning", title: "Insufficient balance" });
    setQrOtp({
      purpose: "qr-pay",
      payload: { amount: qrAmount, merchant },
      title: "Confirm QR Payment",
      subtitle: `${taka(qrAmount)} to ${merchant}`,
      onSuccess: () => {
        setQrAmount(0);
        load();
      },
    });
  }

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-400">
        <Spinner size={28} />
      </div>
    );
  }

  const credited = data.transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const debited = data.transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      {/* Wallet hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-900 p-6 text-white shadow-glow sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/80">
              <Icon.Wallet size={18} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                EWU Campus Wallet
              </span>
            </div>
            <span className="chip bg-white/15 text-white">
              <Icon.Shield size={12} /> Secured
            </span>
          </div>
          <div className="mt-5">
            <div className="text-xs text-white/70">Available Balance</div>
            <div className="mt-1 text-4xl font-extrabold sm:text-5xl">
              <CountUp value={data.walletBalance} prefix="৳" decimals={2} />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setTopupOpen(true);
                setTab("topup");
              }}
              className="btn bg-white px-5 py-2.5 text-sm font-bold text-brand-700 hover:bg-white/90"
            >
              <Icon.Plus size={16} /> Add Money
            </button>
            <button
              onClick={() => setTab("qrpay")}
              className="btn border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur hover:bg-white/20"
            >
              <Icon.QrCode size={16} /> Scan & Pay
            </button>
          </div>
        </div>
      </div>

      {/* In/out summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 text-emerald-600">
            <Icon.ArrowDown size={16} />
            <span className="text-xs font-medium text-ink-500">Money In</span>
          </div>
          <div className="mt-1 text-xl font-extrabold text-emerald-600 sm:text-2xl">
            <CountUp value={credited} prefix="৳" />
          </div>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 text-rose-600">
            <Icon.ArrowUp size={16} />
            <span className="text-xs font-medium text-ink-500">Money Out</span>
          </div>
          <div className="mt-1 text-xl font-extrabold text-rose-600 sm:text-2xl">
            <CountUp value={debited} prefix="৳" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-ink-100 p-1">
        {(
          [
            { id: "topup", label: "Top-up" },
            { id: "qrpay", label: "Scan & Pay" },
            { id: "history", label: "Transaction History" },
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

      {/* Top-up */}
      {tab === "topup" && (
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-ink-900">Top-up Wallet</h3>
          <div className="grid grid-cols-2 gap-3">
            {(["bkash", "nagad"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`flex items-center gap-3 rounded-xl border p-4 transition ${
                  method === m ? "border-brand-500 bg-brand-50" : "border-ink-200 hover:border-brand-300"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-extrabold text-white ${
                    m === "bkash" ? "bg-pink-600" : "bg-orange-500"
                  }`}
                >
                  {m === "bkash" ? "bK" : "Ng"}
                </span>
                <span className="text-sm font-bold capitalize text-ink-900">{m}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => setAmount(q)}
                className={`rounded-xl border py-2.5 text-sm font-bold transition ${
                  amount === q ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-700 hover:border-brand-300"
                }`}
              >
                ৳{q.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="label">Amount (BDT)</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">৳</span>
              <input
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="input pl-8"
                min={1}
                max={50000}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="label">{method === "bkash" ? "bKash" : "Nagad"} Account</label>
            <input
              value={acc}
              onChange={(e) => setAcc(e.target.value)}
              placeholder="01XXXXXXXXX"
              inputMode="numeric"
              className="input"
            />
            {acc && (
              <p className="mt-1 text-[11px] text-ink-400">
                Will charge from {maskAccount(acc)}
              </p>
            )}
          </div>

          <Button className="mt-5 w-full py-3" onClick={confirmTopup}>
            <Icon.Shield size={16} /> Top-up {taka(amount)}
          </Button>
        </div>
      )}

      {/* Scan & Pay */}
      {tab === "qrpay" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card flex flex-col items-center p-6">
            <h3 className="mb-1 text-sm font-bold text-ink-900">Your Wallet QR</h3>
            <p className="mb-4 text-center text-xs text-ink-500">
              Show this to campus merchants to receive payments.
            </p>
            <div className="rounded-2xl border-2 border-brand-100 bg-white p-4">
              <QrCode value={`ewu://wallet/${data.transactions[0]?.id || "demo"}`} size={208} />
            </div>
            <p className="mt-4 text-xs font-semibold text-ink-700">
              EWU Campus Wallet
            </p>
          </div>

          <div className="card p-6">
            <h3 className="mb-4 text-sm font-bold text-ink-900">Pay a Merchant</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Merchant</label>
                <select
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="input"
                >
                  <option>Campus Café</option>
                  <option>Library Print</option>
                  <option>Transport Pass</option>
                  <option>Canteen</option>
                </select>
              </div>
              <div>
                <label className="label">Amount</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">৳</span>
                  <input
                    type="number"
                    value={qrAmount || ""}
                    onChange={(e) => setQrAmount(Number(e.target.value))}
                    className="input pl-8"
                    min={1}
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink-400">
                  Balance: {taka(data.walletBalance)}
                </p>
              </div>
              <Button className="w-full py-3" onClick={confirmQrPay}>
                <Icon.QrCode size={16} /> Pay {qrAmount > 0 ? taka(qrAmount) : ""}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="card overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-4">
            <h3 className="text-sm font-bold text-ink-900">Transaction Ledger</h3>
          </div>
          {data.transactions.length === 0 ? (
            <EmptyState
              icon={<Icon.Wallet size={26} />}
              title="No transactions"
              description="Your wallet activity will appear here."
            />
          ) : (
            <div className="divide-y divide-ink-50">
              {data.transactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-ink-50">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      t.amount >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {t.amount >= 0 ? <Icon.ArrowDown size={16} /> : <Icon.ArrowUp size={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">{t.title}</p>
                    <p className="text-[11px] text-ink-400">
                      {formatDateTime(t.date)} · {t.reference} · {t.method?.toUpperCase()}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`text-sm font-bold ${t.amount >= 0 ? "text-emerald-600" : "text-ink-800"}`}>
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
      )}

      <OtpModal request={otp} onClose={() => setOtp(null)} />
      <OtpModal request={qrOtp} onClose={() => setQrOtp(null)} />
    </div>
  );
}
