"use client";

import type { ReactNode } from "react";
import { useEftirlit } from "@/lib/store";
import { VAKT } from "@/lib/data/starfsfolk";

// Einföld innskráning: notandi velur nafn sitt af vaktalistanum. Engin
// lykilorð – hentugt fyrir sameiginlegt tæki á vaktinni.
export default function LoginGate({ children }: { children: ReactNode }) {
  const { state, hladid, setNotandi } = useEftirlit();

  if (!hladid) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Hleð…
      </div>
    );
  }

  const valinn = VAKT.starfsfolk.find((s) => s.id === state.notandi);
  if (valinn) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col bg-brand">
      <div className="px-6 pb-4 pt-12 text-center text-white">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold">
          KEF
        </div>
        <h1 className="text-2xl font-bold">Eftirlit KEF</h1>
        <p className="mt-1 text-sm text-white/80">
          {VAKT.heiti} · Vakt {VAKT.vakt} ·{" "}
          {new Date(VAKT.dagsetning).toLocaleDateString("is-IS", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <p className="mt-4 text-sm font-medium text-white/90">Veldu nafnið þitt</p>
      </div>

      <div className="flex-1 rounded-t-3xl bg-slate-100 p-4">
        <ul className="mx-auto max-w-md space-y-2">
          {VAKT.starfsfolk.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => setNotandi(s.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm active:bg-slate-50"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    s.utkall ? "bg-amber-100 text-amber-700" : "bg-brand/10 text-brand"
                  }`}
                >
                  {upphafsstafir(s.nafn)}
                </span>
                <span className="font-medium text-slate-800">{s.nafn}</span>
                <span className="ml-auto text-slate-300">›</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function upphafsstafir(nafn: string): string {
  const hlutar = nafn.trim().split(/\s+/);
  if (hlutar.length === 1) return hlutar[0].slice(0, 2).toUpperCase();
  return (hlutar[0][0] + hlutar[hlutar.length - 1][0]).toUpperCase();
}
