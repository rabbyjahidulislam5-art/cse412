# Smart Campus — East West University

A production-grade, fully-functional **Smart Campus** web application built with
**Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and a server-side
in-memory data layer. It implements authentication, dashboard, financials,
fines & library, wallet, course advising, and settings — every button, modal,
and form is wired to a working backend with a secure OTP system.

## ✨ Features

| Module | What works |
| --- | --- |
| **Auth** | Login (with 2FA OTP step), Registration (email OTP), Forgot/Reset password (OTP), Logout, Session cookies (JWT via `jose`) |
| **Dashboard** | Count-up wallet/dues/fines/credits, advising lock banner, quick actions, recent transactions, advising status |
| **Financials** | Fee breakdown, installment plan, payment history, **downloadable printable receipts** (HTML → Print/PDF), Pay via OTP |
| **Fines & Library** | Active fines list, **Extend 2 Days** logic (reduces linked fine ৳50/day), Dispute fine, Pay Fine via OTP |
| **Wallet** | Top-up via bKash/Nagad, **Scan & Pay (QR)**, Bank-ledger-style transaction history, OTP before every action |
| **Advising** | Real-time credit deduction, min/max enforcement, seat availability, **lock/unlock based on pending fines**, finalize |
| **Settings** | Profile edit, password change, 2FA toggle, active session tracking & revoke |
| **Secure OTP** | Every financial action (top-up, tuition, fine, QR pay) + login triggers a 6-digit OTP modal |

## 🚀 Getting Started

```bash
cd smart-campus
npm install
npm run dev
```

Open **http://localhost:3000** → you'll be redirected to `/login`.

### Demo credentials

```
Email:    demo@ewubd.edu
Password: demo1234
```

2FA is enabled on the demo account, so a **demo OTP code** is shown on screen
(in a dashed hint box) — type it to complete login. The same applies to all
financial actions: a demo OTP is displayed so you can complete the flow.

## 🔐 Environment

Copy `.env.local.example` to `.env.local` and set a strong secret:

```
SESSION_SECRET=replace-with-32+-random-characters
```

The app runs fine without it in development (a dev fallback is used), but you
should set it for anything beyond local testing.

## 🧱 Architecture

```
smart-campus/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/            # login, register, forgot (split-screen layout)
│  │  ├─ app/               # protected app (dashboard, financials, ...)
│  │  ├─ api/               # route handlers (auth, otp, dashboard, ...)
│  │  ├─ layout.tsx         # root layout + ToastProvider
│  │  └─ globals.css        # Tailwind + design system
│  ├─ components/
│  │  ├─ ui/                # Icon, Toast, Primitives, Modal, OtpModal, QrCode
│  │  ├─ app/               # AppShell (sidebar + topbar)
│  │  └─ auth/              # AuthPrimitives
│  └─ lib/
│     ├─ db.ts              # in-memory store + seeded demo data
│     ├─ ledger.ts          # all money/advising business logic
│     ├─ otp.ts             # OTP issue/verify/resend
│     ├─ session.ts         # JWT cookie sessions
│     ├─ types.ts           # shared domain types
│     ├─ format.ts          # taka/date helpers
│     └─ api.ts             # client fetch wrapper
```

### Data layer

State lives in a module-level in-memory store (`src/lib/db.ts`) persisted for
the lifetime of the server process and shared across all route handlers. All
mutations go through `src/lib/ledger.ts` so balances, fees, fines, transactions
and receipts stay consistent. Swap this for PostgreSQL/Prisma by replacing the
functions in `db.ts` — the rest of the app is unaffected.

### OTP flow

1. Client calls `POST /api/otp/challenge` with `{ purpose, payload }`.
2. Server stores the OTP + payload and returns an `otpId`.
3. Client collects the 6-digit code in the `OtpModal`.
4. Client calls `POST /api/otp/verify-execute` → server verifies and runs the
   bound action atomically.

## 📱 Responsiveness

Built mobile-first with breakpoints from `360px` up to `2560px` (4K). The
sidebar collapses into a drawer under `lg`, modals become bottom-sheets on
mobile, and all grids stack gracefully with no horizontal scrolling.

## 🛠 Tech

- Next.js 14 App Router (Server + Client Components)
- TypeScript (strict)
- Tailwind CSS with a custom EWU brand design system
- `jose` for JWT cookie sessions
- `bcryptjs` for password hashing (with a built-in fallback if not installed)
- Zero UI libraries — every component and icon is hand-built

## ⚠️ Notes

- The QR code is a visual representation rendered in SVG. For real
  scannability, swap `components/ui/QrCode.tsx` for a library like `qrcode`.
- Passwords fall back to a salted SHA-256 hash if `bcryptjs` isn't installed.
  Always install it (`npm install`) for production-grade hashing.
```
