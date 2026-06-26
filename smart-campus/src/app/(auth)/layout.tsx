import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Split-screen auth layout: marketing/brand panel on the left, form on the right.
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (user) redirect("/app/dashboard");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <span className="text-sm font-extrabold">EWU</span>
          </div>
          <div>
            <div className="text-lg font-bold">Smart Campus</div>
            <div className="text-xs text-white/70">East West University</div>
          </div>
        </div>

        <div className="relative z-10 text-white">
          <h1 className="text-4xl font-extrabold leading-tight xl:text-5xl">
            Your campus,
            <br />
            simplified.
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            Pay tuition, manage fines, top-up your wallet, and complete course
            advising — all from one secure, bank-grade dashboard.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
            {[
              { label: "OTP-secured payments", icon: "Shield" },
              { label: "Instant wallet top-up", icon: "Wallet" },
              { label: "Real-time advising", icon: "Cap" },
              { label: "Downloadable receipts", icon: "Receipt" },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-2xl bg-white/10 p-4 backdrop-blur"
              >
                <div className="text-sm font-semibold">{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} East West University · Aftabnagar, Dhaka
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-ink-50 px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
