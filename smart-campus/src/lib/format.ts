// Formatting helpers (no external deps)

export function taka(amount: number, opts?: { compact?: boolean }): string {
  const n = Number(amount) || 0;
  if (opts?.compact && Math.abs(n) >= 1000) {
    if (Math.abs(n) >= 10000000)
      return `৳${(n / 10000000).toFixed(2).replace(/\.00$/, "")}Cr`;
    if (Math.abs(n) >= 100000)
      return `৳${(n / 100000).toFixed(2).replace(/\.00$/, "")}L`;
    return `৳${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `৳${n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso: string | number | Date): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | number | Date): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string | Date): string {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(d);
}

export function daysBetween(a: string | Date, b: string | Date): number {
  const ms =
    new Date(b).getTime() - new Date(a).getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function maskAccount(num: string): string {
  if (!num) return "";
  const digits = num.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return `•••• ${digits.slice(-4)}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
