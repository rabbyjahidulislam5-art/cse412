"use client";
import React, { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  Button,
  ConfirmDialog,
  CountUp,
  EmptyState,
  Modal,
  Spinner,
  StatusBadge,
} from "@/components/ui/Primitives";
import { OtpModal, OtpRequest } from "@/components/ui/OtpModal";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { formatDate, taka } from "@/lib/format";
import type { Fine, LibraryBook } from "@/lib/types";

interface Data {
  fines: Fine[];
  books: LibraryBook[];
  walletBalance: number;
}

const FINE_ICON: Record<string, React.ReactNode> = {
  library: <Icon.Book size={20} />,
  disciplinary: <Icon.Alert size={20} />,
  "late-fee": <Icon.Clock size={20} />,
  other: <Icon.Info size={20} />,
};

export default function FinesPage() {
  const { push } = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [payFine, setPayFine] = useState<Fine | null>(null);
  const [useWallet, setUseWallet] = useState(true);
  const [otp, setOtp] = useState<OtpRequest | null>(null);
  const [extending, setExtending] = useState<string | null>(null);
  const [disputeFine, setDisputeFine] = useState<Fine | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  async function load() {
    try {
      setData(await api<Data>("/api/fines"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function extend(book: LibraryBook) {
    setExtending(book.id);
    try {
      await api("/api/fines/extend", { method: "POST", body: { bookId: book.id, days: 2 } });
      push({
        type: "success",
        title: "Due date extended",
        message: "Extended by 2 days.",
      });
      load();
    } catch (e: any) {
      push({ type: "error", title: "Could not extend", message: e.message });
    } finally {
      setExtending(null);
    }
  }

  function startPay(fine: Fine) {
    setPayFine(fine);
    setUseWallet(true);
  }

  function confirmPay() {
    if (!payFine) return;
    setOtp({
      purpose: "fine-pay",
      payload: { id: payFine.id, useWallet },
      title: "Pay Fine",
      subtitle: `${payFine.title} · ${taka(payFine.amount)}`,
      onSuccess: () => {
        setPayFine(null);
        load();
      },
    });
  }

  async function submitDispute() {
    if (!disputeFine) return;
    try {
      await api("/api/fines/dispute", {
        method: "POST",
        body: { fineId: disputeFine.id, reason: disputeReason },
      });
      push({ type: "success", title: "Dispute submitted", message: "The administration will review it." });
      setDisputeFine(null);
      setDisputeReason("");
      load();
    } catch (e: any) {
      push({ type: "error", title: "Failed", message: e.message });
    }
  }

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-400">
        <Spinner size={28} />
      </div>
    );
  }

  const activeFines = data.fines.filter((f) => f.status === "active");
  const finesTotal = activeFines.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="text-xs font-medium text-ink-500">Total Active Fines</div>
          <div className="mt-1 text-2xl font-extrabold text-amber-600">
            <CountUp value={finesTotal} prefix="৳" />
          </div>
          <div className="mt-0.5 text-[11px] text-ink-400">
            {activeFines.length} item{activeFines.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium text-ink-500">Books Borrowed</div>
          <div className="mt-1 text-2xl font-extrabold text-ink-900">
            <CountUp value={data.books.length} />
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-medium text-ink-500">Wallet Balance</div>
          <div className="mt-1 text-2xl font-extrabold text-brand-600">
            <CountUp value={data.walletBalance} prefix="৳" decimals={2} />
          </div>
        </div>
      </div>

      {/* Fines */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-4">
          <h3 className="text-sm font-bold text-ink-900">Active Fines</h3>
        </div>
        {data.fines.length === 0 ? (
          <EmptyState
            icon={<Icon.CheckCircle size={26} />}
            title="No fines"
            description="You're all clear!"
          />
        ) : (
          <div className="divide-y divide-ink-50">
            {data.fines.map((f) => (
              <div
                key={f.id}
                className="flex flex-col gap-3 p-4 transition hover:bg-ink-50 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
                    {FINE_ICON[f.type]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">{f.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{f.description}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
                      Issued {formatDate(f.issuedDate)} · Due {formatDate(f.dueDate)}
                      <StatusBadge status={f.status} />
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <span className="text-base font-extrabold text-ink-900">
                    {taka(f.amount)}
                  </span>
                  {f.status === "active" && (
                    <div className="flex gap-2">
                      <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setDisputeFine(f)}>
                        Dispute
                      </Button>
                      <Button className="px-4 py-1.5 text-xs" onClick={() => startPay(f)}>
                        <Icon.Wallet size={14} /> Pay
                      </Button>
                    </div>
                  )}
                  {f.status === "paid" && (
                    <span className="chip bg-emerald-100 text-emerald-700">
                      <Icon.Check size={14} /> Paid
                    </span>
                  )}
                  {f.status === "disputed" && (
                    <span className="chip bg-violet-100 text-violet-700">
                      <Icon.Clock size={14} /> Under Review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Library books */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-4">
          <h3 className="text-sm font-bold text-ink-900">Borrowed Books</h3>
          <p className="text-[11px] text-ink-400">
            Extend an overdue book by 2 days to reduce its linked fine (৳50/day).
          </p>
        </div>
        {data.books.length === 0 ? (
          <EmptyState
            icon={<Icon.Book size={26} />}
            title="No borrowed books"
            description="Books you borrow from the library will appear here."
          />
        ) : (
          <div className="divide-y divide-ink-50">
            {data.books.map((b) => {
              const canExtend = b.renewedCount < b.maxRenewals && b.status !== "returned";
              return (
                <div
                  key={b.id}
                  className="flex flex-col gap-3 p-4 transition hover:bg-ink-50 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon.Book size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">{b.title}</p>
                      <p className="text-xs text-ink-500">{b.author}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
                        Due {formatDate(b.dueDate)} · {b.renewedCount}/{b.maxRenewals} renewals
                        <StatusBadge status={b.status} />
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    {b.status === "overdue" && (
                      <span className="chip bg-rose-100 text-rose-700">
                        <Icon.Alert size={12} /> Overdue
                      </span>
                    )}
                    <Button
                      variant="outline"
                      className="px-3 py-1.5 text-xs"
                      disabled={!canExtend}
                      loading={extending === b.id}
                      onClick={() => extend(b)}
                    >
                      <Icon.Clock size={14} /> Extend 2 Days
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pay Fine modal */}
      <Modal
        open={!!payFine}
        onClose={() => setPayFine(null)}
        title="Pay Fine"
        subtitle={payFine?.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayFine(null)}>
              Cancel
            </Button>
            <Button onClick={confirmPay}>Continue to OTP</Button>
          </>
        }
      >
        {payFine && (
          <div className="space-y-4">
            <div className="rounded-xl bg-ink-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Fine amount</span>
                <span className="font-bold text-ink-900">{taka(payFine.amount)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-ink-500">Wallet balance</span>
                <span className="font-semibold text-ink-700">{taka(data.walletBalance)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  useWallet ? "border-brand-500 bg-brand-50" : "border-ink-200"
                }`}
              >
                <input
                  type="radio"
                  name="fm"
                  checked={useWallet}
                  onChange={() => setUseWallet(true)}
                  className="h-4 w-4 text-brand-600"
                />
                <Icon.Wallet size={18} className="text-brand-600" />
                <span className="text-sm font-semibold text-ink-900">Pay from Wallet</span>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  !useWallet ? "border-brand-500 bg-brand-50" : "border-ink-200"
                }`}
              >
                <input
                  type="radio"
                  name="fm"
                  checked={!useWallet}
                  onChange={() => setUseWallet(false)}
                  className="h-4 w-4 text-brand-600"
                />
                <Icon.Receipt size={18} className="text-violet-600" />
                <span className="text-sm font-semibold text-ink-900">Card / Net Banking</span>
              </label>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-3 py-2 text-xs text-brand-700">
              <Icon.Shield size={14} /> A 6-digit OTP will be required to complete.
            </div>
          </div>
        )}
      </Modal>

      {/* Dispute modal */}
      <Modal
        open={!!disputeFine}
        onClose={() => setDisputeFine(null)}
        title="Dispute Fine"
        subtitle={disputeFine?.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDisputeFine(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submitDispute}>
              Submit Dispute
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-600">
            Explain why you believe this fine is incorrect. The administration
            will review your request.
          </p>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={4}
            placeholder="e.g. The book was returned on time but not scanned properly."
            className="input resize-none"
          />
        </div>
      </Modal>

      <OtpModal request={otp} onClose={() => setOtp(null)} />
    </div>
  );
}
