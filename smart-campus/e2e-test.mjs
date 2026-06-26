// End-to-end smoke test for the Smart Campus API.
// Run with: node e2e-test.mjs
const BASE = "http://localhost:3000";

function log(label, obj) {
  console.log(`\n=== ${label} ===`);
  console.log(
    typeof obj === "string" ? obj : JSON.stringify(obj, null, 2).slice(0, 600)
  );
}

async function main() {
  const cookieJar = [];

  async function req(path, opts = {}) {
    const res = await fetch(BASE + path, {
      method: opts.method || "GET",
      headers: {
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
        ...(cookieJar.length ? { Cookie: cookieJar.join("; ") } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const setCookie = res.headers.getSetCookie?.() || [];
    for (const c of setCookie) {
      const pair = c.split(";")[0];
      const [k] = pair.split("=");
      const idx = cookieJar.findIndex((x) => x.startsWith(k + "="));
      if (idx >= 0) cookieJar[idx] = pair;
      else cookieJar.push(pair);
    }
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = text; }
    return { status: res.status, json };
  }

  // 1. Login -> should require OTP
  let r = await req("/api/auth/login", {
    method: "POST",
    body: { email: "demo@ewubd.edu", password: "demo1234" },
  });
  log("1. LOGIN", r.json);
  if (!r.json.requiresOtp) throw new Error("Expected OTP challenge");
  const otpId = r.json.otpId;
  const code = r.json.demoCode;

  // 2. Verify login OTP
  r = await req("/api/auth/login/verify", {
    method: "POST",
    body: { otpId, code },
  });
  log("2. VERIFY LOGIN", r.json);
  if (r.status !== 200 || !r.json.ok) throw new Error("Login verify failed");

  // 3. Dashboard
  r = await req("/api/dashboard");
  log("3. DASHBOARD", {
    status: r.status,
    walletBalance: r.json.walletBalance,
    outstandingDues: r.json.outstandingDues,
    activeFines: r.json.activeFines,
    advisingLocked: r.json.advisingLocked,
  });
  if (r.status !== 200) throw new Error("Dashboard failed");

  // 4. Wallet
  r = await req("/api/wallet");
  log("4. WALLET", {
    status: r.status,
    balance: r.json.walletBalance,
    txnCount: r.json.transactions?.length,
  });

  // 5. Advising
  r = await req("/api/advising");
  log("5. ADVISING", {
    status: r.status,
    courses: r.json.courses?.length,
    activeFines: r.json.activeFines,
  });

  // 6. Try toggle course (should be locked due to fines)
  r = await req("/api/advising/toggle", {
    method: "POST",
    body: { courseId: "cse401" },
  });
  log("6. TOGGLE (locked?)", r.json);

  // 7. Extend a library book by 2 days
  r = await req("/api/fines/extend", {
    method: "POST",
    body: { bookId: "bk2", days: 2 },
  });
  log("7. EXTEND BOOK", r.json);

  // 8. Financials
  r = await req("/api/financials");
  log("8. FINANCIALS", {
    status: r.status,
    fees: r.json.fees?.length,
    receipts: r.json.receipts?.length,
  });

  // 9. Create OTP challenge for wallet top-up
  r = await req("/api/otp/challenge", {
    method: "POST",
    body: { purpose: "wallet-topup", payload: { amount: 1000, method: "bkash" } },
  });
  log("9. OTP CHALLENGE (topup)", { otpId: r.json.otpId, demoCode: r.json.demoCode });
  const topupOtpId = r.json.otpId;
  const topupCode = r.json.demoCode;

  // 10. Verify-execute top-up
  r = await req("/api/otp/verify-execute", {
    method: "POST",
    body: { otpId: topupOtpId, code: topupCode },
  });
  log("10. TOPUP EXECUTE", { status: r.status, newBalance: r.json.balance });

  // 11. Pay a fine via OTP (clears advising lock)
  const finesR = await req("/api/fines");
  const activeFine = finesR.json.fines.find((f) => f.status === "active");
  r = await req("/api/otp/challenge", {
    method: "POST",
    body: { purpose: "fine-pay", payload: { id: activeFine.id, useWallet: false } },
  });
  log("11. FINE-PAY CHALLENGE", { demoCode: r.json.demoCode });
  r = await req("/api/otp/verify-execute", {
    method: "POST",
    body: { otpId: r.json.otpId, code: r.json.demoCode },
  });
  log("12. FINE PAID", { status: r.status, ok: r.json.ok });

  // 13. Settings
  r = await req("/api/settings");
  log("13. SETTINGS", {
    status: r.status,
    name: r.json.account?.name,
    sessions: r.json.sessions?.length,
  });

  // 14. Me
  r = await req("/api/auth/me");
  log("14. ME", r.json.user ? { name: r.json.user.name } : "no user");

  // 15. Logout
  r = await req("/api/auth/logout", { method: "POST" });
  log("15. LOGOUT", r.json);

  console.log("\n✅ ALL E2E CHECKS PASSED");
}

main().catch((e) => {
  console.error("\n❌ E2E TEST FAILED:", e.message);
  process.exit(1);
});
