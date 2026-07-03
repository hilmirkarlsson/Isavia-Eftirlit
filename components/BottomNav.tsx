"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TENGLAR = [
  { href: "/heim", label: "Heim", icon: HomeIcon },
  { href: "/verkefni", label: "Verkefni", icon: ClipboardIcon },
  { href: "/dma", label: "DMA", icon: GridIcon },
  { href: "/sudur", label: "Suður", icon: GateIcon },
  { href: "/flug", label: "Flug", icon: PlaneIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-3xl items-stretch justify-around">
        {TENGLAR.map(({ href, label, icon: Icon }) => {
          // usePathname() getur skilað null (t.d. í prerender) – þá er enginn virkur.
          const virkur = pathname === href || (pathname?.startsWith(href + "/") ?? false);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                virkur ? "text-brand" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="h-6 w-6" active={virkur} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

type IconProps = { className?: string; active?: boolean };

function HomeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 11l9-7 9 7" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M5 10v10h14V10" strokeLinejoin="round" />
      <path d="M10 20v-6h4v6" strokeLinejoin="round" />
    </svg>
  );
}

function ClipboardIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4a1 1 0 011-1h4a1 1 0 011 1v1H9V4z" />
      <path d="M9 11h6M9 15h6" strokeLinecap="round" />
    </svg>
  );
}

function GridIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function GateIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 21V5l8-2 8 2v16" strokeLinejoin="round" />
      <path d="M4 21h16M9 21v-6h6v6" strokeLinejoin="round" />
    </svg>
  );
}

function PlaneIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
