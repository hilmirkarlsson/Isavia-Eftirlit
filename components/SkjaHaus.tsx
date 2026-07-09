"use client";

import type { ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";

// Samræmdur skjáhaus hönnunarkerfisins (sbr. Verkefni/Heim): merkislitaður
// flötur (dökkur í næturstillingu), feitletraður titill, undirtitill í
// hvítu/80 og stillingar (flipar, leit …) INNI í hausnum í stað sér-stiku.
export default function SkjaHaus({
  titill,
  undirtitill,
  haegri,
  children,
}: {
  titill: string;
  undirtitill?: ReactNode;
  haegri?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 bg-brand px-4 pb-3 pt-3 text-white shadow-sm dark:bg-[#131920] dark:bg-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight">{titill}</h1>
          {undirtitill && (
            <p className="truncate text-sm font-semibold text-white/80">{undirtitill}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {haegri}
          <ThemeToggle />
        </div>
      </div>
      {children && <div className="mt-3 space-y-2">{children}</div>}
    </header>
  );
}

/** Flipaval í hausnum – hvít pilla fyrir virka flipann (dempuð dökk í nótt). */
export function HausFlipar({
  flipar,
}: {
  flipar: { label: string; virkur: boolean; onClick: () => void; tákn?: ReactNode }[];
}) {
  return (
    <div className="flex rounded-2xl bg-white/15 p-1">
      {flipar.map((f) => (
        <button
          key={f.label}
          onClick={f.onClick}
          className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${
            f.virkur ? "bg-white text-brand shadow-sm dark:bg-white/10" : "text-white/80"
          }`}
        >
          {f.tákn && <span>{f.tákn}</span>}
          {f.label}
        </button>
      ))}
    </div>
  );
}
