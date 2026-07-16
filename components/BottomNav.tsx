"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { IconEscort, IconShuffle, IconSwap, IconUsers } from "@/components/Icons";
import { useEftirlit } from "@/lib/store";
import { allirStarfsmenn } from "@/lib/data/vaktir";
import { VAKT, erVaktstjori, virkVakt } from "@/lib/data/starfsfolk";

const TENGLAR = [
  { href: "/heim", label: "Heim", icon: HomeIcon },
  { href: "/verkefni", label: "Verkefni", icon: ClipboardIcon },
  { href: "/dma", label: "DMA", icon: GridIcon },
  { href: "/sudur", label: "Suður", icon: GateIcon },
  { href: "/flug", label: "FIDS", icon: PlaneIcon },
];

const VAKTSTJORN = [
  { href: "/skipulag", label: "Skipulagsgerð", icon: ShuffleNavIcon },
  { href: "/vaktir", label: "Vaktir", icon: UsersNavIcon },
];

const HLIDAR_VALMYND = [{ href: "/fylgdir", label: "Fylgdir", icon: EscortNavIcon }];

export default function BottomNav() {
  const pathname = usePathname();
  const { state, setNotandi, hladid } = useEftirlit();
  // usePathname() getur skilað null (t.d. í prerender) – þá er enginn virkur.
  const erVirkur = (href: string) =>
    pathname === href || (pathname?.startsWith(href + "/") ?? false);

  // Notandi í fæti hliðarstikunnar (smellur skiptir um notanda).
  const ég = hladid ? allirStarfsmenn(state.vaktir).find((s) => s.id === state.notandi) : undefined;
  const vakt = virkVakt(VAKT, state.vardstjoriId ?? "rannveig", state.adstodarvardstjoriId ?? "jon-marino");
  const stjori = !!ég && erVaktstjori(ég.nafn, vakt);
  const hlutverk = !ég
    ? ""
    : ég.nafn === vakt.vardstjori
    ? "Vaktstjóri"
    : ég.nafn === vakt.adstodarvardstjori
    ? "Aðstoðarvaktstjóri"
    : "Varðmaður";

  return (
    <>
      {/* Botnstika – sími og spjaldtölva */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:hidden">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around">
          {TENGLAR.map(({ href, label, icon: Icon }) => {
            const virkur = erVirkur(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                  virkur ? "font-bold text-brand" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className={`rounded-full px-3.5 py-1 ${virkur ? "bg-brand/10" : ""}`}>
                  <Icon className="h-6 w-6" active={virkur} />
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Hliðarstika – borðtölvur (lg og stærra). Merkislitaður flötur með
          ljósum texta (stjórnstöðvarútlit), dökkur flötur í næturstillingu. */}
      <nav className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-brand text-white lg:flex dark:bg-[#131920] dark:bg-none">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-sm font-bold text-white">
            KEF
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Eftirlit KEF</p>
            <p className="text-[11px] text-white/60">Vaktatól · v2</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <SidebarGroup items={TENGLAR} erVirkur={erVirkur} />

          {stjori && (
            <>
              <SidebarLabel>Vaktstjórn</SidebarLabel>
              <SidebarGroup items={VAKTSTJORN} erVirkur={erVirkur} />
            </>
          )}

          <SidebarLabel>Valmynd</SidebarLabel>
          <SidebarGroup items={HLIDAR_VALMYND} erVirkur={erVirkur} />
        </div>
        {ég && (
          <button
            onClick={() => setNotandi(null)}
            title="Skipta um notanda"
            className="flex items-center gap-3 border-t border-white/15 px-5 py-4 text-left transition-colors hover:bg-white/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold uppercase">
              {ég.nafn.slice(0, 2)}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold leading-tight">{ég.nafn}</span>
              <span className="block text-[11px] text-white/60">{hlutverk}</span>
              <span className="block text-[11px] font-semibold text-white/80">Skipta um notanda</span>
            </span>
            <IconSwap className="ml-auto h-4 w-4 shrink-0 text-white/55" />
          </button>
        )}
      </nav>
    </>
  );
}

function SidebarLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-white/45">
      {children}
    </p>
  );
}

function SidebarGroup({
  items,
  erVirkur,
}: {
  items: { href: string; label: string; icon: (props: IconProps) => ReactNode }[];
  erVirkur: (href: string) => boolean;
}) {
  return (
    <div className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const virkur = erVirkur(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              virkur
                ? "bg-white/15 font-bold text-white"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5" active={virkur} />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function EscortNavIcon({ className }: IconProps) {
  return <IconEscort className={className} />;
}

function ShuffleNavIcon({ className }: IconProps) {
  return <IconShuffle className={className} />;
}

function UsersNavIcon({ className }: IconProps) {
  return <IconUsers className={className} />;
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
