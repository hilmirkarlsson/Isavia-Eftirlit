"use client";

import Link from "next/link";
import { useState } from "react";
import { useEftirlit } from "@/lib/store";
import { erVaktstjori } from "@/lib/data/starfsfolk";
import { allirStarfsmenn } from "@/lib/data/vaktir";

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
        className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {opid && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={() => setOpid(false)}>
          <div
            className="w-full max-w-3xl rounded-t-2xl bg-white p-2 pb-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-slate-200" />

            {stjori && (
              <>
                <p className="px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Vaktstjórn
                </p>
                <Valkostur href="/skipulag" tákn="🎲" label="Skipulagsgerð" onLokun={() => setOpid(false)} />
                <Valkostur href="/vaktir" tákn="👥" label="Vaktir" onLokun={() => setOpid(false)} />
                <div className="my-2 border-t border-slate-100" />
              </>
            )}

            <p className="px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Valmynd
            </p>
            <Valkostur href="/fylgdir" tákn="🧑‍✈️" label="Fylgdir" onLokun={() => setOpid(false)} />
            <button
              onClick={() => {
                setNotandi(null);
                setOpid(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 active:bg-slate-50"
            >
              <span className="text-lg">🔁</span> Skipta um notanda
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
  tákn: string;
  label: string;
  onLokun: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onLokun}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 active:bg-slate-50"
    >
      <span className="text-lg">{tákn}</span> {label}
    </Link>
  );
}
