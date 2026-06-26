"use client";
import React, { useEffect, useRef, useState } from "react";
import { Modal, Button, Spinner } from "./Primitives";
import { Icon } from "./Icon";
import { api } from "@/lib/api";
import { useToast } from "./Toast";

// A single, reusable OTP modal. It first creates a challenge (POST /api/otp/challenge),
// then verifies + executes the bound action (POST /api/otp/verify-execute).
// `purpose` must match an OTP purpose; `payload` is the action's data.

export interface OtpRequest {
  purpose: "wallet-topup" | "tuition-pay" | "fine-pay" | "qr-pay";
  payload: Record<string, unknown>;
  title: string;
  subtitle?: string;
  onSuccess: (data: any) => void;
}

export function OtpModal({
  request,
  onClose,
}: {
  request: OtpRequest | null;
  onClose: () => void;
}) {
  const { push } = useToast();
  const [otpId, setOtpId] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const open = !!request;

  // Create challenge when a request comes in
  useEffect(() => {
    if (!request) return;
    setCode(["", "", "", "", "", ""]);
    setOtpId(null);
    setDemoCode(null);
    setCreating(true);
    (async () => {
      try {
        const res = await api<{ otpId: string; demoCode?: string }>("/api/otp/challenge", {
          method: "POST",
          body: { purpose: request.purpose, payload: request.payload },
        });
        setOtpId(res.otpId);
        setDemoCode(res.demoCode ?? null);
        setResendIn(30);
        inputs.current[0]?.focus();
      } catch (e: any) {
        push({ type: "error", title: "Could not send code", message: e.message });
        onClose();
      } finally {
        setCreating(false);
      }
    })();
  }, [request]); // eslint-disable-line react-hooks/exhaustive-deps

  // resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  function handleChange(i: number, v: string) {
    const digit = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length) {
      e.preventDefault();
      const next = ["", "", "", "", "", ""];
      text.split("").forEach((d, i) => (next[i] = d));
      setCode(next);
      inputs.current[Math.min(text.length, 5)]?.focus();
    }
  }

  async function submit() {
    if (!otpId || !request) return;
    const full = code.join("");
    if (full.length < 6) {
      push({ type: "warning", title: "Enter all 6 digits" });
      return;
    }
    setLoading(true);
    try {
      const res = await api("/api/otp/verify-execute", {
        method: "POST",
        body: { otpId, code: full },
      });
      push({ type: "success", title: "Verified", message: "Action completed successfully." });
      request.onSuccess(res);
      onClose();
    } catch (e: any) {
      push({ type: "error", title: "Verification failed", message: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!otpId || resendIn > 0) return;
    try {
      const res = await api<{ otpId: string; demoCode?: string }>(
        "/api/auth/resend-otp",
        { method: "POST", body: { otpId } }
      );
      setOtpId(res.otpId);
      setDemoCode(res.demoCode ?? null);
      setResendIn(30);
      push({ type: "info", title: "New code sent" });
    } catch (e: any) {
      push({ type: "error", title: "Resend failed", message: e.message });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Icon.Shield size={18} className="text-brand-600" />
          {request?.title || "Verify it's you"}
        </span>
      }
      subtitle={request?.subtitle || "Enter the 6-digit code sent to your registered email."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading} disabled={creating}>
            Verify & Confirm
          </Button>
        </>
      }
    >
      {creating ? (
        <div className="flex items-center justify-center gap-2 py-8 text-ink-500">
          <Spinner /> Sending code…
        </div>
      ) : (
        <>
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={d}
                inputMode="numeric"
                maxLength={1}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKey(i, e)}
                className="h-12 w-10 rounded-xl border border-ink-200 bg-white text-center text-lg font-bold text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:h-14 sm:w-12"
              />
            ))}
          </div>

          {demoCode && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2 text-xs text-brand-700">
              <Icon.Info size={14} />
              Demo code: <span className="font-bold tracking-widest">{demoCode}</span>
            </div>
          )}

          <div className="mt-4 text-center text-xs text-ink-500">
            {resendIn > 0 ? (
              <>Resend code in {resendIn}s</>
            ) : (
              <button onClick={resend} className="font-semibold text-brand-600 hover:underline">
                Resend code
              </button>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
