"use client";
import React from "react";

// Minimal, dependency-free SVG icon set used across the app.
// Each icon inherits color via `currentColor` and accepts standard SVG props.

type P = React.SVGProps<SVGSVGElement> & { size?: number };
const base = (size: number): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const Icon = {
  Dashboard: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  Wallet: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5" />
      <circle cx="16" cy="13" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  ),
  Receipt: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  ),
  Book: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 0 4 21.5z" />
      <path d="M4 17.5A1.5 1.5 0 0 1 5.5 16H20" />
    </svg>
  ),
  Cap: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M22 9 12 5 2 9l10 4 10-4z" />
      <path d="M6 11v5c0 1 2.5 3 6 3s6-2 6-3v-5" />
      <path d="M22 9v5" />
    </svg>
  ),
  Settings: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9 2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 6.3 3.4l.1.1a1.7 1.7 0 0 0 1.9.3H8.5A1.7 1.7 0 0 0 9.5 2.5a2 2 0 1 1 4 0 1.7 1.7 0 0 0 1.1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1.1 2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.6 1z" />
    </svg>
  ),
  Bell: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9z" />
      <path d="M10.3 21a2 2 0 0 0 3.4 0" />
    </svg>
  ),
  Logout: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
  Search: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Menu: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  Close: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  Check: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  CheckCircle: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  ),
  Alert: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  Info: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  Lock: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
  Shield: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Plus: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Minus: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M5 12h14" />
    </svg>
  ),
  ArrowUp: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ),
  ArrowDown: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  ),
  ArrowRight: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  Download: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </svg>
  ),
  QrCode: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4" />
    </svg>
  ),
  Clock: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Calendar: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  User: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  ),
  Phone: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </svg>
  ),
  Mail: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  Eye: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M9.9 4.2A9.8 9.8 0 0 1 12 4c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3 3.8M6.6 6.6A17.6 17.6 0 0 0 2 11s3.5 7 10 7a9.8 9.8 0 0 0 4.3-1M3 3l18 18M9.5 9.5a3 3 0 0 0 4.2 4.2" />
    </svg>
  ),
  ChevronDown: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  ChevronRight: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  Refresh: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  ),
  Trash: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  ),
  Edit: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  ),
  Sparkle: ({ size = 20, ...p }: P) => (
    <svg {...base(size)} {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  ),
  Logo: ({ size = 28, ...p }: P) => (
    <svg {...base(size)} {...p} strokeWidth={0} fill="currentColor">
      <rect width="24" height="24" rx="6" />
      <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">EWU</text>
    </svg>
  ),
};

export type IconName = keyof typeof Icon;
