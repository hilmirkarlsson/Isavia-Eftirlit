"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  FidsSvar,
  Flug,
  FlugTegund,
  HLIDAHOPAR,
  flugTs,
  hlidNumer,
} from "@/lib/fids";

export default function FlugPage() {
  const [svar, setSvar] = useState<FidsSvar | null>(null);
  const [villa, setVilla] = useState<string | null>(null);
  const [hledur, setHledur] = useState(true);
  const [tegund, setTegund] = useState<FlugTegund | "allt">("allt");
  const [hopur, setHopur] = useState<string | null>(null);
  const [leit, setLeit] = useState("");
  // Klukka sem uppfærist svo "næsta flug" haldist rétt milli uppfærslna.
  const [nuMs, setNuMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNuMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const saekja = useCallback(async () => {
    try {
      setVilla(null);
      const res = await fetch("/api/fids", { cache: "no-store" });
      if (!res.ok) throw new Error(`Villa ${res.status}`);
      setSvar((await res.json()) as FidsSvar);
    } catch (e) {
      setVilla(e instanceof Error ? e.message : "Óþekkt villa");
    } finally {
      setHledur(false);
    }
  }, []);

  // Uppfærist sjálfkrafa á hverri mínútu.
  useEffect(() => {
    saekja();
    const t = setInterval(saekja, 60_000);
    return () => clearInterval(t);
  }, [saekja]);

  const flug = useMemo(() => {
    if (!svar) return [];
    const q = leit.trim().toLowerCase();
    const hopurNumer = HLIDAHOPAR.find((h) => h.id === hopur)?.numer;
    return svar.flug
      .filter((f) => tegund === "allt" || f.tegund === tegund)
      .filter((f) => {
        if (!hopurNumer) return true;
        const n = hlidNumer(f.hlid);
        return n !== null && hopurNumer.includes(n);
      })
      .filter(
        (f) =>
          !q ||
          f.flugnumer.toLowerCase().includes(q) ||
          f.borg.toLowerCase().includes(q) ||
          f.flugfelag.toLowerCase().includes(q) ||
          (f.hlid ?? "").toLowerCase().includes(q)
      )
      // Raða eftir raunverulegum tíma (þvert á miðnætti), ekki "HH:MM" texta.
      .sort((a, b) => flugTs(a, nuMs) - flugTs(b, nuMs));
  }, [svar, tegund, hopur, leit, nuMs]);

  // Næsta flug = fyrsta flug sem er ekki farið/liðið (ts >= núna).
  const naestaId = useMemo(() => {
    const naest = flug.find((f) => flugTs(f, nuMs) >= nuMs - 60_000);
    return naest?.id ?? null;
  }, [flug, nuMs]);

  return (
    <div>
      <PageHeader
        titill="Flug (FIDS)"
        undirtitill={`Keflavíkurflugvöllur · ${svar ? svar.flug.length : "…"} flug`}
        hægri={
          <button
            onClick={() => {
              setHledur(true);
              saekja();
            }}
            className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium active:bg-white/30"
          >
            ↻
          </button>
        }
      />

      <div className="sticky top-[57px] z-10 space-y-2 border-b border-slate-200 bg-white p-2">
        {/* Leit */}
        <input
          value={leit}
          onChange={(e) => setLeit(e.target.value)}
          placeholder="Leita að hliði eða flugnúmeri…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        {/* Hliðahópar */}
        <div className="flex flex-wrap gap-1.5">
          {HLIDAHOPAR.map((h) => (
            <Chip
              key={h.id}
              virkur={hopur === h.id}
              onClick={() => setHopur(hopur === h.id ? null : h.id)}
              label={h.label}
            />
          ))}
          {hopur && (
            <button
              onClick={() => setHopur(null)}
              className="rounded-full px-2 py-1.5 text-xs font-medium text-slate-400 underline"
            >
              Hreinsa
            </button>
          )}
        </div>
        {/* Komur / brottfarir */}
        <div className="flex gap-1.5">
          <SegHnappur virkur={tegund === "allt"} onClick={() => setTegund("allt")} label="Allt" />
          <SegHnappur
            virkur={tegund === "arrival"}
            onClick={() => setTegund("arrival")}
            label="Komur"
          />
          <SegHnappur
            virkur={tegund === "departure"}
            onClick={() => setTegund("departure")}
            label="Brottfarir"
          />
        </div>
      </div>

      <div className="p-3">
        {svar?.heimild === "synidaemi" && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            ⚠️ Sýnigögn birt – ekki náðist í rauntímagögn frá kefairport.is.
            Þegar forritið keyrir með netaðgang að vellinum birtast öll
            rauntímaflug sjálfkrafa.
          </div>
        )}
        {villa && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            Ekki tókst að sækja flug: {villa}
          </div>
        )}

        {hledur && !svar ? (
          <p className="py-10 text-center text-slate-400">Sæki flug…</p>
        ) : flug.length === 0 ? (
          <p className="py-10 text-center text-slate-400">Engin flug fundust.</p>
        ) : (
          <ul className="space-y-2">
            {flug.map((f) => (
              <FlugKort key={f.id + f.flugnumer} flug={f} naesta={f.id === naestaId} />
            ))}
          </ul>
        )}

        {svar && (
          <p className="mt-4 text-center text-[11px] text-slate-400">
            {svar.heimild === "live" ? "Rauntímagögn" : "Sýnigögn"} · sýni {flug.length} af{" "}
            {svar.flug.length} · uppfært{" "}
            {new Date(svar.uppfaert).toLocaleTimeString("is-IS", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

function FlugKort({ flug, naesta }: { flug: Flug; naesta?: boolean }) {
  const [opid, setOpid] = useState(false);
  const koma = flug.tegund === "arrival";
  // Litur eftir gangi (C = grænt, D = blátt, A = appelsínugult) eins og á vellinum.
  const gangur = (flug.hlid ?? "").trim().charAt(0).toUpperCase();
  const hlidLitur =
    gangur === "C"
      ? "bg-green-500"
      : gangur === "D"
      ? "bg-sky-500"
      : gangur === "A"
      ? "bg-orange-500"
      : "bg-slate-400";

  return (
    <li
      className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
        naesta ? "border-brand ring-2 ring-brand/30" : "border-slate-200"
      }`}
    >
      {naesta && (
        <div className="bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          Næsta flug
        </div>
      )}
      <button onClick={() => setOpid((v) => !v)} className="flex w-full items-stretch gap-3 text-left">
        {/* Hlið + flugnúmer */}
        <div
          className={`flex w-20 shrink-0 flex-col items-center justify-center px-1 py-3 text-white ${hlidLitur}`}
        >
          <span className="text-xl font-extrabold leading-none">{flug.hlid ?? "—"}</span>
          <span className="mt-1 text-xs font-semibold opacity-90">{flug.flugnumer}</span>
        </div>

        {/* Upplýsingar */}
        <div className="min-w-0 flex-1 py-2.5 pr-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-lg font-bold tabular-nums text-slate-900">
              {flug.stada && /depart|lent|airborne|cancel/i.test(flug.stada) ? (
                <span className="text-red-600">{flug.stada}: </span>
              ) : flug.stada ? (
                <span className="text-slate-500">{flug.stada}: </span>
              ) : null}
              {flug.raun || flug.aaetlad}
            </span>
            <div className="flex items-center gap-1.5">
              {flug.schengen && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    flug.schengen === "S" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"
                  }`}
                >
                  {flug.schengen === "S" ? "Schengen" : "Non-S"}
                </span>
              )}
              <span className={`text-slate-300 transition-transform ${opid ? "rotate-180" : ""}`}>▾</span>
            </div>
          </div>
          <p className="truncate text-sm font-medium text-slate-800">
            {koma ? "Frá" : "Til"}: {flug.borg}
            {flug.iata ? ` (${flug.iata})` : ""}
          </p>
          <p className="truncate text-xs text-slate-400">
            {flug.flugfelag}
            {flug.staedi ? ` · Stæði ${flug.staedi}` : ""}
            {koma && flug.faeriband ? ` · Band ${flug.faeriband}` : ""}
          </p>
        </div>
      </button>

      {opid && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm">
          <Reitur label="Tegund" gildi={koma ? "Koma" : "Brottför"} />
          <Reitur label="Staða" gildi={flug.stada} />
          <Reitur label="Áætlað" gildi={flug.aaetlad} />
          <Reitur label="Áætlað/rauntími" gildi={flug.raun} />
          <Reitur label="Hlið" gildi={flug.hlid} />
          <Reitur label="Stæði" gildi={flug.staedi} />
          {koma && <Reitur label="Færiband" gildi={flug.faeriband} />}
          <Reitur label="Skráning" gildi={flug.reg} mono />
          <Reitur label="Tegund vélar" gildi={flug.tegundVel} />
          <Reitur label="Þjónustuaðili" gildi={flug.handling} />
          <Reitur label={koma ? "Brottfararstaður" : "Áfangastaður"} gildi={`${flug.borg}${flug.iata ? ` (${flug.iata})` : ""}`} />
          <Reitur label="Flugfélag" gildi={flug.flugfelag} />
        </dl>
      )}
    </li>
  );
}

function Reitur({ label, gildi, mono }: { label: string; gildi?: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`text-slate-800 ${mono ? "font-mono" : ""}`}>{gildi || "—"}</dd>
    </div>
  );
}

function Chip({
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
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        virkur ? "bg-brand text-white" : "bg-slate-100 text-slate-600 active:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function SegHnappur({
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
        virkur ? "bg-brand text-white" : "bg-slate-100 text-slate-600 active:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
