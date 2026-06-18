"use client";

import { useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { useEftirlit } from "@/lib/store";
import { SUDUR_HLID, SUDUR_STODUR, SudurStada } from "@/lib/data/sudur";

const STADA_STILL: Record<SudurStada, { bg: string; dot: string; text: string }> = {
  schengen: {
    bg: "border-blue-300 bg-blue-50 text-blue-800",
    dot: "bg-blue-500",
    text: "text-blue-800",
  },
  "non-schengen": {
    bg: "border-violet-300 bg-violet-50 text-violet-800",
    dot: "bg-violet-500",
    text: "text-violet-800",
  },
  snua: {
    bg: "border-amber-300 bg-amber-50 text-amber-800",
    dot: "bg-amber-500 animate-pulse",
    text: "text-amber-800",
  },
};

// Smellur hringar í gegnum stöðurnar.
const HRINGUR: SudurStada[] = ["schengen", "non-schengen", "snua"];

export default function SudurPage() {
  const { state, setSudur, hladid } = useEftirlit();

  const stada = (id: string, sjalfgefid: SudurStada): SudurStada =>
    state.sudur[id] ?? sjalfgefid;

  const taln = useMemo(() => {
    const t = { schengen: 0, "non-schengen": 0, snua: 0 } as Record<SudurStada, number>;
    for (const h of SUDUR_HLID) t[stada(h.id, h.sjalfgefid)]++;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sudur]);

  return (
    <div>
      <PageHeader
        titill="Suður"
        undirtitill="Hlið – Schengen / non-Schengen uppstilling"
      />

      <div className="p-4">
        {hladid && (
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <SamtalsReitur
              label="Schengen"
              fjoldi={taln.schengen}
              stada="schengen"
            />
            <SamtalsReitur
              label="Non-Schengen"
              fjoldi={taln["non-schengen"]}
              stada="non-schengen"
            />
            <SamtalsReitur label="Að snúa" fjoldi={taln.snua} stada="snua" />
          </div>
        )}

        <p className="mb-3 text-sm text-slate-500">
          Smelltu á hlið til að skipta um stöðu. Hlið merkt{" "}
          <span className="font-semibold">↻</span> er hægt að snúa milli
          Schengen og non-Schengen.
        </p>

        <div className="space-y-2">
          {SUDUR_HLID.map((h) => {
            const s = stada(h.id, h.sjalfgefid);
            const still = STADA_STILL[s];
            return (
              <button
                key={h.id}
                onClick={() => {
                  if (!h.snuanlegt) {
                    // Fast hlið: aðeins skipt milli Schengen og non-Schengen.
                    setSudur(h.id, s === "schengen" ? "non-schengen" : "schengen");
                  } else {
                    const i = HRINGUR.indexOf(s);
                    setSudur(h.id, HRINGUR[(i + 1) % HRINGUR.length]);
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left shadow-sm transition-colors active:scale-[0.99] ${still.bg}`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70 text-lg font-bold">
                  {h.heiti}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${still.dot}`} />
                    {SUDUR_STODUR[s].titill}
                  </div>
                  <p className="text-xs opacity-80">{SUDUR_STODUR[s].lysing}</p>
                </div>
                {h.snuanlegt ? (
                  <span className="text-xl opacity-60" title="Snúanlegt hlið">
                    ↻
                  </span>
                ) : (
                  <span
                    className="text-xs font-medium uppercase tracking-wide opacity-50"
                    title="Fast hlið"
                  >
                    fast
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SamtalsReitur({
  label,
  fjoldi,
  stada,
}: {
  label: string;
  fjoldi: number;
  stada: SudurStada;
}) {
  const still = STADA_STILL[stada];
  return (
    <div className={`rounded-xl border-2 py-2 ${still.bg}`}>
      <div className="text-2xl font-bold tabular-nums">{fjoldi}</div>
      <div className="text-[11px] font-medium uppercase tracking-wide opacity-80">
        {label}
      </div>
    </div>
  );
}
