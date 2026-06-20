"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { FidsSvar, Flug, FlugTegund, flugTs } from "@/lib/fids";

export default function FlugPage() {
  const [svar, setSvar] = useState<FidsSvar | null>(null);
  const [villa, setVilla] = useState<string | null>(null);
  const [hledur, setHledur] = useState(true);
  const [leit, setLeit] = useState("");
  const [flokkur, setFlokkur] = useState<FlugTegund>("arrival");
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

  const sia = useCallback(
    (tegund: FlugTegund) => {
      if (!svar) return [];
      const q = leit.trim().toLowerCase();
      return svar.flug
        .filter((f) => f.tegund === tegund)
        .filter(
          (f) =>
            !q ||
            f.flugnumer.toLowerCase().includes(q) ||
            f.borg.toLowerCase().includes(q) ||
            f.flugfelag.toLowerCase().includes(q) ||
            (f.hlid ?? "").toLowerCase().includes(q)
        )
        // Raða eftir raunverulegum tíma (Áætlað/rauntími, þvert á miðnætti).
        .sort((a, b) => flugTs(a, nuMs) - flugTs(b, nuMs));
    },
    [svar, leit, nuMs]
  );

  const komur = useMemo(() => sia("arrival"), [sia]);
  const brottfarir = useMemo(() => sia("departure"), [sia]);

  // Flug sem eru ekki farin/lent enn – miðað við raunverulegan tíma
  // (rauntími ef til, annars áætlaður). Fyrsta flugið er "næsta flug",
  // afgangurinn er listinn fyrir neðan, koll af kolli.
  const framtidKomur = useMemo(
    () => komur.filter((f) => flugTs(f, nuMs) >= nuMs - 60_000),
    [komur, nuMs]
  );
  const framtidBrottfarir = useMemo(
    () => brottfarir.filter((f) => flugTs(f, nuMs) >= nuMs - 60_000),
    [brottfarir, nuMs]
  );

  const valid = flokkur === "arrival" ? framtidKomur : framtidBrottfarir;
  const naestaFlug = valid[0] ?? null;
  const afgangur = valid.slice(1);

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
        {/* Komur / Brottfarir */}
        <div className="flex rounded-lg bg-slate-100 p-1">
          <FlokkurHnappur
            virkur={flokkur === "arrival"}
            onClick={() => setFlokkur("arrival")}
            label={`Komur (${komur.length})`}
          />
          <FlokkurHnappur
            virkur={flokkur === "departure"}
            onClick={() => setFlokkur("departure")}
            label={`Brottfarir (${brottfarir.length})`}
          />
        </div>
        {/* Leit */}
        <input
          value={leit}
          onChange={(e) => setLeit(e.target.value)}
          placeholder="Leita að hliði eða flugnúmeri…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
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
        ) : (
          <>
            {naestaFlug && <NaestaFlugKort flug={naestaFlug} />}
            <FlugBolkur
              titill={flokkur === "arrival" ? "Komur" : "Brottfarir"}
              flug={afgangur}
            />
          </>
        )}

        {svar && (
          <p className="mt-4 text-center text-[11px] text-slate-400">
            {svar.heimild === "live" ? "Rauntímagögn" : "Sýnigögn"} · uppfært{" "}
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

function FlokkurHnappur({
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
      className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
        virkur ? "bg-white text-brand shadow-sm" : "text-slate-500"
      }`}
    >
      {label}
    </button>
  );
}

function FlugBolkur({ titill, flug }: { titill: string; flug: Flug[] }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-slate-500">
        {titill} <span className="font-normal text-slate-400">({flug.length})</span>
      </h2>
      {flug.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Engin flug fundust.</p>
      ) : (
        <ul className="space-y-2">
          {flug.map((f) => (
            <FlugKort key={f.id + f.flugnumer} flug={f} />
          ))}
        </ul>
      )}
    </section>
  );
}

function NaestaFlugKort({ flug }: { flug: Flug }) {
  const [opid, setOpid] = useState(false);
  const koma = flug.tegund === "arrival";
  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-brand bg-white shadow-md ring-2 ring-brand/30">
      <div className="flex items-center justify-between bg-brand px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
        <span>{koma ? "Næsta koma" : "Næsta brottför"}</span>
        {flug.stada && <span className="opacity-90">{flug.stada}</span>}
      </div>
      <button onClick={() => setOpid((v) => !v)} className="flex w-full items-stretch gap-3 p-3 text-left">
        <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-brand/10 px-1 py-2">
          <span className="text-xl font-extrabold leading-none text-brand">{flug.hlid ?? "—"}</span>
          <span className="mt-1 text-xs font-semibold text-brand/80">{flug.flugnumer}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-2xl font-extrabold tabular-nums text-slate-900">
              {flug.raun || flug.aaetlad}
            </p>
            <span className={`text-slate-300 transition-transform ${opid ? "rotate-180" : ""}`}>▾</span>
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

      {opid && <FlugSmaatridi flug={flug} koma={koma} />}
    </div>
  );
}

/** Staðan getur innihaldið tíma (t.d. "Estimated 21:23") – tíminn er sýndur
 *  sérstaklega með flug.raun/aaetlad, svo hér er hann fjarlægður úr textanum. */
function stadaTexti(stada: string): string {
  return stada.replace(/\s*\d{1,2}[:.]\d{2}\s*$/, "").trim();
}

function FlugKort({ flug }: { flug: Flug }) {
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
    <li className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                <span className="text-red-600">{stadaTexti(flug.stada)}: </span>
              ) : flug.stada ? (
                <span className="text-slate-500">{stadaTexti(flug.stada)}: </span>
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

      {opid && <FlugSmaatridi flug={flug} koma={koma} />}
    </li>
  );
}

function FlugSmaatridi({ flug, koma }: { flug: Flug; koma: boolean }) {
  return (
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
