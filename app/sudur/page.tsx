"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  FidsSvar,
  Flug,
  erBordingLokad,
  erIcelandair,
  flugSchengen,
  flugTs,
  hlidNumer,
} from "@/lib/fids";

type Sia = "hlid" | "rutuhlid";

const STADA_STILL: Record<SudurStada, { kort: string; dot: string }> = {
  schengen: { kort: "border-blue-300 bg-blue-50", dot: "bg-blue-500" },
  "non-schengen": { kort: "border-violet-300 bg-violet-50", dot: "bg-violet-500" },
  snua: { kort: "border-amber-300 bg-amber-50", dot: "bg-amber-500" },
};

const BOKSTAFUR_LITUR: Record<string, string> = {
  C: "bg-blue-600",
  D: "bg-violet-600",
  "": "bg-amber-500",
};

// Upplýsingar um hvort snúa þarf hliði, út frá FIDS.
type GateInfo = {
  required: SudurStada;
  kind: "switch" | "waiting"; // switch = óhætt að snúa núna, waiting = bíð eftir lokun bording
  reason: "boarding-closed" | "no-departures";
  flugTexti: string;
};

function sideFromFlight(f: Flug): SudurStada | null {
  const s = flugSchengen(f);
  if (s === "S") return "schengen";
  if (s === "N") return "non-schengen";
  return null;
}

export default function SudurPage() {
  const { state, setSudur } = useEftirlit();
  const [sia, setSia] = useState<Sia>("hlid");
  const [stadfesta, setStadfesta] = useState<{ hlid: SudurHlid; ny: SudurStada } | null>(null);
  const [stadfestaHopur, setStadfestaHopur] = useState<{
    hopur: { id: string; label: string; numer: number[] };
    gates: SudurHlid[];
    ny: SudurStada;
  } | null>(null);
  const [tilkynning, setTilkynning] = useState<string | null>(null);
  const [flug, setFlug] = useState<Flug[]>([]);
  const [nuMs, setNuMs] = useState(() => Date.now());

  const mittNafn = VAKT.starfsfolk.find((s) => s.id === state.notandi)?.nafn ?? "Óþekktur";

  // Sækja FIDS og uppfæra á mínútu fresti.
  const saekja = useCallback(async () => {
    try {
      const res = await fetch("/api/fids", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as FidsSvar;
        setFlug(data.flug);
      }
    } catch {
      /* hunsa – kortið virkar áfram handvirkt */
    }
  }, []);
  useEffect(() => {
    saekja();
    const t = setInterval(() => {
      saekja();
      setNuMs(Date.now());
    }, 60_000);
    return () => clearInterval(t);
  }, [saekja]);

  const stada = useCallback(
    (h: SudurHlid): SudurStada => state.sudur[h.id]?.stada ?? h.sjalfgefid,
    [state.sudur]
  );
  const faersla = (h: SudurHlid) => state.sudur[h.id];

  const hlid = useMemo(() => SUDUR_HLID.filter((h) => h.gerd === "hlid"), []);
  const rutuhlid = useMemo(() => SUDUR_HLID.filter((h) => h.gerd === "rutuhlid"), []);

  // Reikna hvaða hlið þarf að snúa út frá FIDS.
  const gateInfo = useMemo(() => {
    const map: Record<string, GateInfo> = {};
    const now = nuMs;
    for (const h of SUDUR_HLID) {
      if (!h.snuanlegt) continue;
      const current = stada(h);

      // Flug (ekki FI) sem nota þetta hlið (eftir númeri).
      const atGate = flug.filter((f) => hlidNumer(f.hlid) === h.numer && !erIcelandair(f));
      if (atGate.length === 0) continue;

      const deps = atGate.filter((f) => f.tegund === "departure");

      // Næsta flug (koma eða brottför) sem á eftir að eiga sér stað.
      const upcoming = atGate
        .filter((f) => flugTs(f, now) >= now - 5 * 60_000)
        .sort((a, b) => flugTs(a, now) - flugTs(b, now));
      const next = upcoming[0];
      if (!next) continue;

      const required = sideFromFlight(next);
      if (!required || required === current) continue; // þegar rétt stillt

      // Er brottfararflug að taka bording núna (ekki lokað)?
      const blocking = deps.find((f) => {
        const t = flugTs(f, now);
        return !erBordingLokad(f) && t >= now - 60 * 60_000 && t <= now + 90 * 60_000;
      });

      const flugTexti = `${next.flugnumer} ${next.borg}`;
      if (blocking) {
        map[h.id] = { required, kind: "waiting", reason: "boarding-closed", flugTexti: `${blocking.flugnumer} ${blocking.borg}` };
      } else {
        map[h.id] = {
          required,
          kind: "switch",
          reason: deps.length > 0 ? "boarding-closed" : "no-departures",
          flugTexti,
        };
      }
    }
    return map;
  }, [flug, nuMs, stada]);

  const adSnua = useMemo(
    () =>
      SUDUR_HLID.filter((h) => gateInfo[h.id]?.kind === "switch").map((h) => ({
        hlid: h,
        info: gateInfo[h.id],
      })),
    [gateInfo]
  );

  const stadfestaSnuning = () => {
    if (!stadfesta) return;
    const { hlid: h, ny } = stadfesta;
    setSudur(h.id, ny, mittNafn);
    setTilkynning(`${hlidNafn(h, ny)} (${SUDUR_STODUR[ny].titill}) stillt af ${mittNafn}`);
    setStadfesta(null);
    setTimeout(() => setTilkynning(null), 4000);
  };

  const stadfestaHopSnuning = () => {
    if (!stadfestaHopur) return;
    const { hopur, gates, ny } = stadfestaHopur;
    for (const h of gates) setSudur(h.id, ny, mittNafn);
    setTilkynning(`Rútuhlið ${hopur.label} stillt í ${SUDUR_STODUR[ny].titill} af ${mittNafn}`);
    setStadfestaHopur(null);
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

      {/* Tilkynning efst: hlið sem þarf að snúa */}
      {adSnua.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
            <span className="flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-amber-500 text-xs text-white">
              !
            </span>
            Snúa þarf {adSnua.length} {adSnua.length === 1 ? "hliði" : "hliðum"}
          </div>
          <ul className="mt-2 space-y-2">
            {adSnua.map(({ hlid: h, info }) => (
              <li
                key={h.id}
                className="flex items-center gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2"
              >
                <span
                  className={`flex h-9 w-12 items-center justify-center rounded-md text-sm font-bold text-white ${BOKSTAFUR_LITUR[hlidBokstafur(info.required)]}`}
                >
                  {h.numer}
                  {hlidBokstafur(info.required)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Snúa í {hlidBokstafur(info.required)} ({SUDUR_STODUR[info.required].titill})
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {info.reason === "no-departures"
                      ? "Engin brottför á hliði"
                      : "Bording lokað"}{" "}
                    · {info.flugTexti}
                  </p>
                </div>
                <button
                  onClick={() => setStadfesta({ hlid: h, ny: info.required })}
                  className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white active:bg-amber-700"
                >
                  Snúa
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-4">
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
                  bid={gateInfo[h.id]?.kind === "waiting" ? gateInfo[h.id] : undefined}
                  onSnua={(ny) => setStadfesta({ hlid: h, ny })}
                />
              ))}
            </div>
          </section>
        ) : (
          RUTU_UNDIRHOPAR.map((hopur) => {
            const gates = rutuhlid.filter((h) => hopur.numer.includes(h.numer));
            if (gates.length === 0) return null;
            // Öll hliðin í hópnum eru snúin saman – ekki er hægt að snúa þeim
            // hverju í sínu lagi. Sýna hópstöðu/-hnapp út frá fyrsta hliðinu.
            const hopStada = stada(gates[0]);
            const hopNy = hinStadan(hopStada);
            return (
              <section key={hopur.id} className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Rútuhlið {hopur.label}
                  </h2>
                  <button
                    onClick={() => setStadfestaHopur({ hopur, gates, ny: hopNy })}
                    className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white active:bg-brand-dark"
                  >
                    Snúa hópnum í {hlidBokstafur(hopNy)} ({SUDUR_STODUR[hopNy].titill})
                  </button>
                </div>
                <div className="space-y-2">
                  {gates.map((h) => (
                    <HlidKort
                      key={h.id}
                      hlid={h}
                      stada={stada(h)}
                      faersla={faersla(h)}
                      bid={gateInfo[h.id]?.kind === "waiting" ? gateInfo[h.id] : undefined}
                      leyfaStakaSnuningu={false}
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

      {/* Staðfestingargluggi fyrir hóp af rútuhliðum */}
      {stadfestaHopur && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setStadfestaHopur(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-900">Staðfesta hliðaskipti</h2>
            <p className="mt-2 text-sm text-slate-600">
              Snúa <b>öllum rútuhliðum {stadfestaHopur.hopur.label}</b> saman í{" "}
              <b>{SUDUR_STODUR[stadfestaHopur.ny].titill}</b>?
            </p>
            <p className="mt-1 text-xs text-slate-400">Skráð sem: {mittNafn}</p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setStadfestaHopur(null)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 active:bg-slate-200"
              >
                Hætta við
              </button>
              <button
                onClick={stadfestaHopSnuning}
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

function HlidKort({
  hlid,
  stada,
  faersla,
  bid,
  onSnua,
  leyfaStakaSnuningu = true,
}: {
  hlid: SudurHlid;
  stada: SudurStada;
  faersla?: { af: string; kl: string };
  bid?: GateInfo;
  onSnua?: (ny: SudurStada) => void;
  leyfaStakaSnuningu?: boolean;
}) {
  const still = STADA_STILL[stada];
  const bokstafur = hlidBokstafur(stada);
  const ny = hinStadan(stada);

  return (
    <div className={`rounded-xl border-2 ${still.kort} p-3 shadow-sm`}>
      <div className="flex items-center gap-3">
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
          {bid && (
            <p className="mt-0.5 truncate text-xs font-medium text-amber-600">
              ⏳ Bíð eftir lokun bording – {bid.flugTexti}
            </p>
          )}
        </div>

        {hlid.snuanlegt && leyfaStakaSnuningu && onSnua && (
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
