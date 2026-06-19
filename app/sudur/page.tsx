"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useEftirlit } from "@/lib/store";
import { VAKT } from "@/lib/data/starfsfolk";
import {
  SUDUR_HLID,
  SUDUR_STODUR,
  SudurHlid,
  SudurStada,
  hinStadan,
} from "@/lib/data/sudur";

type Sia = "allt" | "hlid" | "rutuhlid";

const STADA_STILL: Record<SudurStada, { kort: string; dot: string; bordi: string }> = {
  schengen: { kort: "border-blue-300 bg-blue-50", dot: "bg-blue-500", bordi: "bg-blue-600" },
  "non-schengen": { kort: "border-violet-300 bg-violet-50", dot: "bg-violet-500", bordi: "bg-violet-600" },
  snua: { kort: "border-amber-300 bg-amber-50", dot: "bg-amber-500", bordi: "bg-amber-600" },
};

export default function SudurPage() {
  const { state, setSudur, hladid } = useEftirlit();
  const [sia, setSia] = useState<Sia>("allt");
  const [stadfesta, setStadfesta] = useState<{ hlid: SudurHlid; ny: SudurStada } | null>(null);
  const [tilkynning, setTilkynning] = useState<string | null>(null);

  const mittNafn =
    VAKT.starfsfolk.find((s) => s.id === state.notandi)?.nafn ?? "Óþekktur";

  const stada = (h: SudurHlid): SudurStada => state.sudur[h.id]?.stada ?? h.sjalfgefid;
  const faersla = (h: SudurHlid) => state.sudur[h.id];

  const synd = useMemo(
    () => SUDUR_HLID.filter((h) => sia === "allt" || h.gerd === sia),
    [sia]
  );

  const taln = useMemo(() => {
    const t = { schengen: 0, "non-schengen": 0 } as Record<string, number>;
    for (const h of synd) {
      const s = state.sudur[h.id]?.stada ?? h.sjalfgefid;
      if (s === "schengen") t.schengen++;
      else if (s === "non-schengen") t["non-schengen"]++;
    }
    return t;
  }, [synd, state.sudur]);

  const stadfestaSnuning = () => {
    if (!stadfesta) return;
    setSudur(stadfesta.hlid.id, stadfesta.ny, mittNafn);
    setTilkynning(
      `${stadfesta.hlid.gerd === "rutuhlid" ? "Rútuhlið" : "Hlið"} ${stadfesta.hlid.heiti} snúið í ${SUDUR_STODUR[stadfesta.ny].titill} af ${mittNafn}`
    );
    setStadfesta(null);
    setTimeout(() => setTilkynning(null), 4000);
  };

  return (
    <div>
      <PageHeader titill="Suður" undirtitill="Hliðaskipti – Schengen / non-Schengen" />

      {/* Sía */}
      <div className="sticky top-[57px] z-10 border-b border-slate-200 bg-white p-2">
        <div className="flex rounded-xl bg-slate-100 p-1">
          <SiaHnappur virkur={sia === "allt"} onClick={() => setSia("allt")} label="Öll hlið" />
          <SiaHnappur virkur={sia === "hlid"} onClick={() => setSia("hlid")} label="Hlið" />
          <SiaHnappur
            virkur={sia === "rutuhlid"}
            onClick={() => setSia("rutuhlid")}
            label="Rútuhlið 24–29"
          />
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          ℹ️ Eftirlit snýr hliðum eftir áætlun. <b>Icelandair (FI) flug eru
          undanskilin</b> – Icelandair snýr þeim hliðum sjálft.
        </div>

        {hladid && (
          <div className="mb-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border-2 border-blue-300 bg-blue-50 py-2 text-blue-800">
              <div className="text-2xl font-bold tabular-nums">{taln.schengen}</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide">Schengen</div>
            </div>
            <div className="rounded-xl border-2 border-violet-300 bg-violet-50 py-2 text-violet-800">
              <div className="text-2xl font-bold tabular-nums">{taln["non-schengen"]}</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide">Non-Schengen</div>
            </div>
          </div>
        )}

        {sia === "rutuhlid" && (
          <p className="mb-3 text-sm text-slate-500">
            Rútuhlið 24–29: farþegar fara með rútu út á stæði. Fylgist með
            hvenær þarf að snúa þeim milli Schengen og non-Schengen.
          </p>
        )}

        <div className="space-y-2">
          {synd.map((h) => {
            const s = stada(h);
            const still = STADA_STILL[s];
            const f = faersla(h);
            const ny = hinStadan(s);
            return (
              <div
                key={h.id}
                className={`rounded-xl border-2 ${still.kort} p-3 shadow-sm`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-white/70 leading-none">
                    <span className="text-lg font-bold">{h.heiti}</span>
                    {h.gerd === "rutuhlid" && (
                      <span className="mt-0.5 text-[8px] font-bold uppercase text-slate-500">
                        Rúta
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${still.dot}`} />
                      {SUDUR_STODUR[s].titill}
                    </div>
                    {f ? (
                      <p className="truncate text-xs text-slate-500">
                        Snúið af <b>{f.af}</b> · {klukkan(f.kl)}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">Sjálfgefin staða</p>
                    )}
                  </div>

                  {h.snuanlegt && (
                    <button
                      onClick={() => setStadfesta({ hlid: h, ny })}
                      className="shrink-0 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white active:bg-brand-dark"
                    >
                      Snúa í {SUDUR_STODUR[ny].titill}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staðfestingargluggi */}
      {stadfesta && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setStadfesta(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-900">Staðfesta hliðaskipti</h2>
            <p className="mt-2 text-sm text-slate-600">
              Snúa{" "}
              <b>
                {stadfesta.hlid.gerd === "rutuhlid" ? "rútuhliði" : "hliði"}{" "}
                {stadfesta.hlid.heiti}
              </b>{" "}
              úr <b>{SUDUR_STODUR[stada(stadfesta.hlid)].titill}</b> í{" "}
              <b>{SUDUR_STODUR[stadfesta.ny].titill}</b>?
            </p>
            <p className="mt-1 text-xs text-slate-400">Skráð sem: {mittNafn}</p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setStadfesta(null)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 active:bg-slate-200"
              >
                Hætta við
              </button>
              <button
                onClick={stadfestaSnuning}
                className="flex-1 rounded-xl bg-brand px-4 py-3 font-semibold text-white active:bg-brand-dark"
              >
                Staðfesta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tilkynning eftir skipti */}
      {tilkynning && (
        <div className="fixed inset-x-0 bottom-20 z-30 flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
            <span>✓</span>
            {tilkynning}
          </div>
        </div>
      )}
    </div>
  );
}

function klukkan(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function SiaHnappur({
  virkur,
  onClick,
  label,
}: {
  virkur: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors sm:text-sm ${
        virkur ? "bg-brand text-white shadow-sm" : "text-slate-500"
      }`}
    >
      {label}
    </button>
  );
}
