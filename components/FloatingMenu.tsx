"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { useEftirlit } from "@/lib/store";
import { erVaktstjori } from "@/lib/data/starfsfolk";
import { allirStarfsmenn } from "@/lib/data/vaktir";
import PushToggle from "@/components/PushToggle";
import { IconShuffle, IconUsers, IconEscort, IconSwap } from "@/components/Icons";

// Fljótandi „..." hnappur neðst í hægra horni – opnar valmynd fyrir alla,
// með aukavalkostum fyrir vaktstjóra/aðstoðarvaktstjóra.
export default function FloatingMenu() {
  const [opid, setOpid] = useState(false);
  const { state, setNotandi } = useEftirlit();

  const ég = allirStarfsmenn(state.vaktir).find((s) => s.id === state.notandi);
  const stjori = erVaktstjori(ég?.nafn);

  return (
    <>
      <button
        onClick={() => setOpid(true)}
        aria-label="Valmynd"
        className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/25 ring-1 ring-black/5 transition active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {opid && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setOpid(false)}
        >
          <div
            className="w-full max-w-3xl rounded-t-3xl bg-white p-2 pb-7 shadow-2xl ring-1 ring-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-2 mt-1 h-1.5 w-10 rounded-full bg-slate-200" />

            {stjori && (
              <>
                <p className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Vaktstjórn
                </p>
                <Valkostur href="/skipulag" tákn={<IconShuffle />} label="Skipulagsgerð" onLokun={() => setOpid(false)} />
                <Valkostur href="/vaktir" tákn={<IconUsers />} label="Vaktir" onLokun={() => setOpid(false)} />
                <div className="my-2 border-t border-slate-100" />
              </>
            )}

            <p className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Valmynd
            </p>
            <Valkostur href="/fylgdir" tákn={<IconEscort />} label="Fylgdir" onLokun={() => setOpid(false)} />
            <PushToggle onLokun={() => setOpid(false)} />
            <button
              onClick={() => {
                setNotandi(null);
                setOpid(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition active:bg-slate-50"
            >
              <span className="text-slate-400">
                <IconSwap />
              </span>{" "}
              Skipta um notanda
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Valkostur({
  href,
  tákn,
  label,
  onLokun,
}: {
  href: string;
  tákn: ReactNode;
  label: string;
  onLokun: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onLokun}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition active:bg-slate-50"
    >
      <span className="text-slate-400">{tákn}</span> {label}
    </Link>
  );
}
