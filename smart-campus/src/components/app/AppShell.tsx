"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, IconName } from "../ui/Icon";
import { IconButton, Spinner } from "../ui/Primitives";
import { api } from "@/lib/api";
import { initials } from "@/lib/format";
import { useToast } from "../ui/Toast";
import type { SessionUser } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const NAV: NavItem[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: "Dashboard" },
  { href: "/app/financials", label: "Financials", icon: "Receipt" },
  { href: "/app/fines", label: "Fines & Library", icon: "Book" },
  { href: "/app/wallet", label: "Wallet", icon: "Wallet" },
  { href: "/app/advising", label: "Advising", icon: "Cap" },
  { href: "/app/settings", label: "Settings", icon: "Settings" },
];

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { push } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  async function logout() {
    setLoggingOut(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      push({ type: "info", title: "Signed out" });
      router.push("/login");
    } catch (e: any) {
      push({ type: "error", title: "Logout failed", message: e.message });
    } finally {
      setLoggingOut(false);
    }
  }

  const notifications = [
    { id: 1, title: "Tuition due in 7 days", time: "2h ago", type: "warning" },
    { id: 2, title: "Wallet topped up ৳5,000", time: "1d ago", type: "success" },
    { id: 3, title: "Library book overdue", time: "2d ago", type: "error" },
  ];

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
          <span className="text-xs font-extrabold">EWU</span>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-ink-900">Smart Campus</div>
          <div className="text-[11px] text-ink-500">East West University</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const IconComp = Icon[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-brand-600 text-white shadow-glow"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              }`}
            >
              <IconComp size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-100 p-3">
        <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 p-4">
          <div className="flex items-center gap-2 text-brand-700">
            <Icon.Shield size={16} />
            <span className="text-xs font-bold">Secured by OTP</span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-ink-500">
            Every payment is verified with a one-time code.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-ink-100 bg-white lg:block">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-slide-in-right bg-white shadow-2xl">
            <div className="flex justify-end p-2">
              <IconButton label="Close" onClick={() => setMobileOpen(false)}>
                <Icon.Close size={20} />
              </IconButton>
            </div>
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <IconButton
              label="Open menu"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Icon.Menu size={22} />
            </IconButton>

            <div className="hidden flex-1 sm:block">
              <h1 className="text-sm font-semibold text-ink-900 sm:text-base">
                {NAV.find((n) => pathname.startsWith(n.href))?.label || "Smart Campus"}
              </h1>
            </div>

            <div className="flex-1 sm:hidden" />

            {/* Notifications */}
            <div className="relative">
              <IconButton
                label="Notifications"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setMenuOpen(false);
                }}
              >
                <span className="relative">
                  <Icon.Bell size={20} />
                  <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                  </span>
                </span>
              </IconButton>
              {notifOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 max-w-[90vw] animate-scale-in rounded-2xl border border-ink-100 bg-white shadow-2xl">
                  <div className="border-b border-ink-100 px-4 py-3">
                    <h3 className="text-sm font-bold">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex gap-3 border-b border-ink-50 px-4 py-3 transition hover:bg-ink-50"
                      >
                        <span
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            n.type === "success"
                              ? "bg-emerald-500"
                              : n.type === "error"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-ink-800">{n.title}</p>
                          <p className="text-[11px] text-ink-400">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full px-4 py-2.5 text-center text-xs font-semibold text-brand-600 hover:bg-ink-50">
                    Mark all as read
                  </button>
                </div>
              )}
            </div>

            {/* Profile menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setMenuOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-ink-100"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ background: user.avatarColor }}
                >
                  {initials(user.name)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold text-ink-900">
                    {user.name}
                  </span>
                  <span className="block text-[10px] text-ink-500">
                    {user.studentId}
                  </span>
                </span>
                <Icon.ChevronDown size={16} className="hidden text-ink-400 sm:block" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 z-50 w-60 animate-scale-in rounded-2xl border border-ink-100 bg-white shadow-2xl">
                  <div className="border-b border-ink-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-ink-500">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/app/settings"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-50"
                    >
                      <Icon.Settings size={16} /> Settings
                    </Link>
                    <button
                      onClick={logout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                    >
                      {loggingOut ? <Spinner size={16} /> : <Icon.Logout size={16} />}
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page-enter mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
