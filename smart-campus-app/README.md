# 🎓 Smart Campus App — East West University

> A complete digital student portal with closed-loop digital wallet, library management, fine/payment tracking, advising clearance, and on-campus merchant payments — built for **East West University (CSE412 — Group 7)**.

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start (Docker)](#quick-start-docker)
- [Manual Setup](#manual-setup)
- [Environment Variables](#environment-variables)
- [Demo Credentials](#demo-credentials)
- [API Reference](#api-reference)
- [Page Reference](#page-reference)
- [Security Architecture](#security-architecture)
- [Database Schema](#database-schema)
- [Scheduled Jobs](#scheduled-jobs)
- [License](#license)

---

## Overview

The Smart Campus App is a unified platform replacing physical ID cards, cash handling, and paper-based library/fine records at East West University. It exposes four distinct role-based experiences:

| Role | Purpose |
|------|---------|
| 👨‍🎓 **Student** | Top-up wallet, QR payments, transfers, pay fines, advising clearance |
| 👨‍💼 **Admin** | User management, KYC approval, transaction monitoring, reports |
| 📚 **Library Staff** | Book catalog, issue/return, fine accrual, overdue reminders |
| 🏪 **Shop Owner** | Merchant QR codes, transaction feed, settlement, reports |

All money flows stay inside the campus closed-loop — students top up via SSLCommerz/bKash/Nagad, spend at merchants or pay fines, and merchants withdraw through verified bank channels.

---

## Key Features

### 💳 Digital Wallet
- Closed-loop balance with **BigInt paisa storage** (1 BDT = 100 paisa) for precision
- Top-up via **SSLCommerz / bKash / Nagad** with webhook confirmation
- P2P transfers between students (daily limits enforced)
- QR-based payments at campus merchants (HMAC-signed payloads)
- Withdrawals to mobile banking with OTP verification
- Atomic transactions with `SELECT FOR UPDATE` row locking

### 📚 Library Management
- Book catalog with ISBN tracking and copy counts
- Issue/return workflow with automatic due dates
- **Automatic fine accrual** for overdue books (10 BDT/day)
- Condition tracking on return (GOOD / DAMAGED / LOST)
- Overdue escalation & reminder emails

### 📋 Fines & Advising Clearance
- Fine types: LIBRARY, TUITION, LAB, DISCIPLINARY
- **Advising registration blocked** automatically when unpaid fines exist
- Auto-clearance triggers when fines are resolved
- Fine appeal workflow with admin review

### 🔐 Security
- JWT with **RS256** (15-min access + 7-day rotated refresh tokens)
- OTP-based email verification on registration
- Optional **TOTP 2FA** (RFC 6238) per account
- RBAC with 4 roles + middleware enforcement
- Rate limiting (global, auth, OTP, payment endpoints)
- Account lockout after 5 failed attempts
- Full audit logging of every financial action

### 📊 Admin Tools
- Real-time dashboards with KPIs
- KYC document review queue
- Transaction override (with audit trail)
- Financial reports with CSV export
- Security event monitoring
- Broadcast notifications

---

## Tech Stack

### Frontend
- **Next.js 15** (App Router, React 19, TypeScript)
- **Tailwind CSS** with custom design system (Inter font, 8px grid)
- **Zustand** for auth state
- **Axios** with JWT interceptor + silent refresh
- PWA-ready (manifest + service worker)

### Backend
- **Express.js** with MVC pattern
- **Prisma ORM** over **PostgreSQL 16**
- **Redis** for OTP/session storage & rate limiting
- **node-cron** for 12 scheduled jobs
- **Zod** for request validation
- **Nodemailer** for transactional email
- **otplib** for TOTP 2FA

### Infrastructure
- **Docker Compose** orchestration
- Multi-stage Docker builds
- Graceful shutdown handling
- Health checks for all services

---

## Project Structure

```
smart-campus-app/
├── docker-compose.yml
├── .env.example
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma          # 22+ models, all enums
│   │   └── seed.ts                # Demo data
│   └── src/
│       ├── server.ts              # HTTP server + graceful shutdown
│       ├── app.ts                 # Express app config
│       ├── config/                # App config + Prisma client
│       ├── controllers/           # 8 controllers (auth, wallet, fine, ...)
│       ├── routes/                # 8 route files
│       ├── middleware/            # auth, rateLimit, validate, errorHandler
│       ├── dtos/                  # Zod schemas
│       ├── utils/                 # crypto, otp, email, qr, response, pagination
│       └── jobs/                  # 12 scheduled jobs
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    └── src/
        ├── app/
        │   ├── page.tsx                       # Landing (P-001)
        │   ├── auth/                          # 9 auth pages
        │   │   ├── signup/  verify-otp/  kyc/
        │   │   ├── kyc-pending/  login/  2fa/
        │   │   ├── forgot-password/  reset-password/  locked/
        │   ├── student/                       # 13 student pages
        │   │   ├── dashboard/  wallet/  qr-pay/
        │   │   ├── fines/  advising/  ledger/
        │   │   ├── notifications/  security/
        │   │   ├── profile/  settings/  support/
        │   │   └── wallet/{topup,transfer,withdraw,history}/
        │   ├── admin/                         # 10 admin pages
        │   │   ├── dashboard/  students/  kyc/
        │   │   ├── transactions/  wallets/  fines/
        │   │   ├── reports/  security/  audit/  settings/
        │   ├── library/                       # 8 library pages
        │   │   ├── dashboard/  books/  issue/
        │   │   ├── return/  overdue/  fines/  reports/
        │   └── shop/                          # 7 shop pages
        │       ├── dashboard/  qr/  transactions/
        │       ├── settlement/  reports/  refunds/  profile/
        ├── components/             # AuthProvider, Modal, Sidebar, UI, hooks
        ├── lib/                    # api, store, utils
        └── styles/                 # globals.css design system
```

---

## Quick Start (Docker)

The fastest way to run everything. Requires [Docker Desktop](https://www.docker.com/products/docker-desktop).

```bash
# 1. Clone & enter
git clone <repo-url> && cd smart-campus-app

# 2. Create environment file
cp .env.example .env
# Edit .env — at minimum set the JWT/OTP/QR secrets (any random string)

# 3. Start all services
docker compose up -d

# 4. Run database migrations & seed
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```

Access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1
- **Health check**: http://localhost:5000/health

---

## Manual Setup

For local development without Docker.

### Prerequisites
- Node.js ≥ 18.0.0
- PostgreSQL 16 (running on localhost:5432)
- Redis (running on localhost:6379)

### Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit DATABASE_URL, REDIS_URL, secrets

# Generate Prisma client
npx prisma generate

# Create database & apply migrations
npx prisma migrate dev --name init

# Seed demo data
npm run seed

# Start dev server (hot reload)
npm run dev
```

Backend runs on **http://localhost:5000**.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure API URL
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# Start dev server
npm run dev
```

Frontend runs on **http://localhost:3000**.

---

## Environment Variables

See [`.env.example`](.env.example) for the complete list. Key variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://campus:campus@localhost:5432/smart_campus` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | RS256 private key for access tokens | (random 32+ bytes) |
| `JWT_REFRESH_SECRET` | RS256 private key for refresh tokens | (random 32+ bytes) |
| `OTP_HMAC_SECRET` | HMAC key for hashing OTPs | (random string) |
| `QR_HMAC_SECRET` | HMAC key for signing QR payloads | (random string) |
| `EMAIL_USER` / `EMAIL_PASS` | SMTP credentials | `smartcampus@ewubd.edu` |
| `SSLCOMMERZ_STORE_ID` | SSLCommerz gateway | — |
| `BKASH_APP_KEY` | bKash tokenized API | — |
| `NAGAD_MERCHANT_ID` | Nagad gateway | — |

> 🔒 **Generate secrets** with: `openssl rand -hex 32`

---

## Demo Credentials

After running `npm run seed`, log in with:

| Role | Email | Password |
|------|-------|----------|
| 👨‍🎓 Student | `student@ewubd.edu` | `Password123!` |
| 👨‍💼 Admin | `admin@ewubd.edu` | `Password123!` |
| 📚 Library | `library@ewubd.edu` | `Password123!` |
| 🏪 Shop | `shop@ewubd.edu` | `Password123!` |

The seeded student wallet starts with **৳5,000**.

---

## API Reference

Base URL: `http://localhost:5000/api/v1`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new student |
| POST | `/auth/verify-otp` | Verify registration OTP |
| POST | `/auth/login` | Login (returns JWT) |
| POST | `/auth/verify-2fa` | Verify TOTP 2FA challenge |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Revoke session |
| POST | `/auth/forgot-password` | Send recovery OTP |
| POST | `/auth/reset-password` | Reset with OTP + new password |
| POST | `/auth/2fa/setup` | Get TOTP secret + QR |
| POST | `/auth/2fa/enable` | Enable 2FA with token |

### Student (`/student/*`)
Profile, dashboard, notifications, activity log, sessions, password change, support tickets.

### Wallet (`/wallet/*`)
Balance, top-up initiate, transfer, QR pay, withdraw, transactions, ledger, summary.

### Fines (`/fines/*`)
List fines, pay individual/all, appeal, advising status.

### Admin (`/admin/*`)
Dashboard, students, KYC queue, transactions, fines (add/waive), wallets, audit logs, security events, reports, broadcast.

### Library (`/library/*`)
Dashboard, books (CRUD), issue, return, overdue, reminders, fines, search students, reports.

### Shop (`/shop/*`)
Dashboard, QR codes, transactions, settlement, withdrawal request, reports, profile, refunds.

### Webhooks (`/webhooks/*`)
SSLCommerz, bKash, Nagad payment confirmation.

---

## Page Reference

### Public (9 pages)
- P-001 Landing · P-002 Signup · P-003 OTP Verify · P-004 KYC Upload
- P-005 KYC Pending · P-006 Login · P-007 2FA Challenge
- P-008 Forgot Password · P-009 Reset Password · P-010 Account Locked

### Student (13 pages)
- S-001 Dashboard · S-002 Wallet · S-003 Top-up · S-005 Transfer · S-006 QR Pay
- S-007 History · S-007b Ledger · S-011 Fines · S-012 Advising
- S-017 Profile · S-018 Settings · S-019 Support
- + Notifications, Security, Withdraw

### Admin (10 pages)
- A-001 Dashboard · A-002/003 Students · A-004 KYC Queue · A-005 Wallets
- A-006 Transactions · A-008 Fines · A-014 Reports · A-015 Audit
- A-016 Security · A-017 Settings

### Library (8 pages)
- L-001 Dashboard · L-002 Books · L-004 Issue · L-005 Return
- L-006 Overdue · L-007 Fines · L-008 Reports

### Shop (7 pages)
- SH-001 Dashboard · SH-002 QR · SH-003 Transactions · SH-004 Settlement
- SH-005 Reports · SH-006 Refunds · SH-007 Profile

---

## Security Architecture

### Authentication Flow
```
Register → OTP email → Verify → KYC upload → Admin approval → Active
   ↓
Login → [if 2FA] → TOTP challenge → JWT access (15m) + refresh (7d, rotated)
```

### Token Strategy
- **Access tokens**: RS256-signed, 15-minute expiry, stateless
- **Refresh tokens**: 7-day expiry, stored hashed in DB, **rotated on each use**
- **Session revocation**: Per-session or all-sessions kill switch

### Financial Integrity
- All monetary values stored as **BigInt paisa** (no floating point)
- Every wallet operation runs in an atomic Prisma transaction
- `SELECT FOR UPDATE` row locks prevent double-spend
- Immutable ledger entry written for every balance change
- Reconciliation job compares ledger vs. wallet balances daily

### Rate Limiting
| Endpoint Group | Window | Max |
|----------------|--------|-----|
| Global | 1 min | 100 |
| Auth | 15 min | 10 |
| OTP | 1 hour | 5 |
| Payment | 1 min | 20 |

---

## Database Schema

The Prisma schema defines **22+ models** including:

`User`, `Wallet`, `Transaction`, `LedgerEntry`, `Book`, `BookIssue`, `Fine`, `FineAppeal`, `Merchant`, `MerchantSettlement`, `PaymentIntent`, `Withdrawal`, `KYCDocument`, `OTP`, `Notification`, `Session`, `AuditLog`, `SecurityEvent`, `SupportTicket`, `AdvisingClearance`, `Refund`

Key enums: `UserRole`, `UserStatus`, `KYCStatus`, `WalletStatus`, `TransactionType`, `TransactionDirection`, `TransactionStatus`, `FineType`, `FineStatus`, `BookCondition`, `PaymentIntentStatus`, `NotificationType`, `SecurityEventType`, `SupportTicketStatus`, `AppealStatus`, `MerchantStatus`, `WithdrawalStatus`.

View the complete schema at [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) or explore visually:

```bash
cd backend && npx prisma studio
```

---

## Scheduled Jobs

12 node-cron jobs run on the backend. See [`backend/src/jobs/runner.ts`](backend/src/jobs/runner.ts).

| Job | Schedule | Purpose |
|-----|----------|---------|
| Fine accumulation | Every hour | Accrue daily library overdue fines |
| Daily limit reset | 00:00 daily | Reset wallet top-up/transfer daily counters |
| Advising clearance check | 06:00 daily | Re-evaluate clearance blockers |
| Payment intent expiry | Every 5 min | Expire unpaid payment intents |
| Merchant settlement | 02:00 daily | Move pending → available balance |
| Overdue escalation | 09:00 daily | Send reminders / escalate long-overdue |
| Session cleanup | 03:00 daily | Purge expired sessions |
| Withdrawal processing | Every 30 min | Process pending withdrawal queue |
| OTP cleanup | Every 15 min | Remove expired OTPs |
| Notification dispatch | Every minute | Send queued notifications |
| Reconciliation | 01:00 daily | Verify ledger vs wallet balances |
| Security scan | 04:00 daily | Flag suspicious activity patterns |

---

## License

MIT © 2024 CSE412 Group 7 — East West University

---

**Built with ❤️ for East West University.**
