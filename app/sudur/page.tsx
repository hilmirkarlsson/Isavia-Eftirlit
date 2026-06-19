"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useEftirlit } from "@/lib/store";
import { VAKT } from "@/lib/data/starfsfolk";
import {
  RUTU_UNDIRHOPAR,
  SUDUR_HLID,
  SUDUR_STODUR,
  SudurHlid,
  SudurStada,
  hinStadan,
  hlidBokstafur,
  hlidNafn,
} from "@/lib/data/sudur";

type Sia = "hlid" | "rutuhlid";

const STADA_STILL: Record<SudurStada, { kort: string; dot: string }> = {
  schengen: { kort: "border-blue-300 bg-blue-50", dot: "bg-blue-500" },
  "non-schengen": { kort: "border-violet-300 bg-violet-50", dot: "bg-violet-500" },
  snua: { kort: "border-amber-300 bg-amber-50", dot: "bg-amber-500" },
};

// Litur á C/D bókstaf.
const BOKSTAFUR_LITUR: Record<string, string> = {
  C: "bg-blue-600",
  D: "bg-violet-600",
  "": "bg-amber-500",
};

export default function SudurPage() {
  const { state, setSudur, hladid } = useEftirlit();
  const [sia, setSia] = useState<Sia>("hlid");
  const [stadfesta, setStadfesta] = useState<{ hlid: SudurHlid; ny: SudurStada } | null>(null);
  const [tilkynning, setTilkynning] = useState<string | null>(null);

  const mittNafn = VAKT.starfsfolk.find((s) => s.id === state.notandi)?.nafn ?? "Óþekktur";

  const stada = (h: SudurHlid): SudurStada => state.sudur[h.id]?.stada ?? h.sjalfgefid;
  const faersla = (h: SudurHlid) => state.sudur[h.id];

  const hlid = useMemo(() => SUDUR_HLID.filter((h) => h.gerd === "hlid"), []);
  const rutuhlid = useMemo(() => SUDUR_HLID.filter((h) => h.gerd === "rutuhlid"), []);

  const stadfestaSnuning = () => {
    if (!stadfesta) return;
    const { hlid: h, ny } = stadfesta;
    setSudur(h.id, ny, mittNafn);
    setTilkynning(`${hlidNafn(h, ny)} (${SUDUR_STODUR[ny].titill}) stillt af ${mittNafn}`);
    setStadfesta(null);
    setTimeout(() => setTilkynning(null), 4000);
  };

  return (
    <div>
      <PageHeader titill="Suður" undirtitill="Hliðaskipti – C (Schengen) / D (non-Schengen)" />

      {/* Sía: Hlið / Rútuhlið */}
      <div className="sticky top-[57px] z-10 border-b border-slate-200 bg-white p-2">
        <div className="flex rounded-xl bg-slate-100 p-1">
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
          ℹ️ <b>C = Schengen</b>, <b>D = non-Schengen</b>. Icelandair (FI) flug
          eru undanskilin – Icelandair snýr þeim sjálft.
        </div>

        {sia === "hlid" ? (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Hlið · Komur
            </h2>
            <div className="space-y-2">
              {hlid.map((h) => (
                <HlidKort
                  key={h.id}
                  hlid={h}
                  stada={stada(h)}
                  faersla={faersla(h)}
                  onSnua={(ny) => setStadfesta({ hlid: h, ny })}
                />
              ))}
            </div>
          </section>
        ) : (
          RUTU_UNDIRHOPAR.map((hopur) => {
            const gates = rutuhlid.filter((h) => hopur.numer.includes(h.numer));
            if (gates.length === 0) return null;
            return (
              <section key={hopur.id} className="mb-5">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Rútuhlið {hopur.label}
                </h2>
                <div className="space-y-2">
                  {gates.map((h) => (
                    <HlidKort
                      key={h.id}
                      hlid={h}
                      stada={stada(h)}
                      faersla={faersla(h)}
                      onSnua={(ny) => setStadfesta({ hlid: h, ny })}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
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
                {stadfesta.hlid.numer}
              </b>{" "}
              úr <b>{hlidNafn(stadfesta.hlid, stada(stadfesta.hlid))}</b> í{" "}
              <b>{hlidNafn(stadfesta.hlid, stadfesta.ny)}</b> (
              {SUDUR_STODUR[stadfesta.ny].titill})?
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

      {!hladid && null}
    </div>
  );
}

function HlidKort({
  hlid,
  stada,
  faersla,
  onSnua,
}: {
  hlid: SudurHlid;
  stada: SudurStada;
  faersla?: { af: string; kl: string };
  onSnua: (ny: SudurStada) => void;
}) {
  const still = STADA_STILL[stada];
  const bokstafur = hlidBokstafur(stada);
  const ny = hinStadan(stada);

  return (
    <div className={`rounded-xl border-2 ${still.kort} p-3 shadow-sm`}>
      <div className="flex items-center gap-3">
        {/* Hlið + bókstafur C/D */}
        <span
          className={`flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-lg text-white ${BOKSTAFUR_LITUR[bokstafur]}`}
        >
          <span className="text-lg font-bold leading-none">{hlidNafn(hlid, stada)}</span>
          {hlid.gerd === "rutuhlid" && (
            <span className="mt-0.5 text-[8px] font-bold uppercase opacity-90">Rúta</span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${still.dot}`} />
            {SUDUR_STODUR[stada].titill}
          </div>
          {faersla ? (
            <p className="truncate text-xs text-slate-500">
              Snúið af <b>{faersla.af}</b> · {klukkan(faersla.kl)}
            </p>
          ) : (
            <p className="text-xs text-slate-400">Sjálfgefin staða</p>
          )}
        </div>

        {hlid.snuanlegt && (
          <button
            onClick={() => onSnua(ny)}
            className="shrink-0 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white active:bg-brand-dark"
          >
            Snúa í {hlidBokstafur(ny)} ({SUDUR_STODUR[ny].titill})
          </button>
        )}
      </div>
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
      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
        virkur ? "bg-brand text-white shadow-sm" : "text-slate-500"
      }`}
    >
      {label}
    </button>
  );
}
