"use client";

import { useCallback, useMemo, useState } from "react";
import { useEftirlit } from "@/lib/store";
import { useFids } from "@/lib/fidsStore";
import { VAKT } from "@/lib/data/starfsfolk";
import {
  RUTU_UNDIRHOPAR,
  SUDUR_HLID,
  SUDUR_STODUR,
  SudurHlid,
  SudurStada,
  hlidNafn,
} from "@/lib/data/sudur";
import {
  Flug,
  erBordingLokad,
  erIcelandair,
  flugSchengen,
  flugTs,
  hlidNumer,
} from "@/lib/fids";

// Upplýsingar um hvort snúa þarf hliði, út frá FIDS.
export type GateInfo = {
  required: SudurStada;
  kind: "switch" | "waiting"; // switch = óhætt að snúa núna, waiting = bíð eftir lokun bording
  reason: "boarding-closed" | "no-departures";
  flugTexti: string;
};

export type AdSnuaItem =
  | { type: "hlid"; hlid: SudurHlid; info: GateInfo }
  | { type: "rutuhlid"; hopur: (typeof RUTU_UNDIRHOPAR)[number]; gates: SudurHlid[]; info: GateInfo };

function sideFromFlight(f: Flug): SudurStada | null {
  const s = flugSchengen(f);
  if (s === "S") return "schengen";
  if (s === "N") return "non-schengen";
  return null;
}

/** Reiknar hvaða Suður hlið þarf að snúa, út frá FIDS og núverandi stöðu hliða.
 *  Deilt milli Suður síðunnar og tilkynningar á heimasíðunni. */
export function useSudurSnua() {
  const { state, setSudur } = useEftirlit();
  const [stadfesta, setStadfesta] = useState<{ hlid: SudurHlid; ny: SudurStada } | null>(null);
  const [stadfestaHopur, setStadfestaHopur] = useState<{
    hopur: { id: string; label: string; numer: number[] };
    gates: SudurHlid[];
    ny: SudurStada;
  } | null>(null);
  const [tilkynning, setTilkynning] = useState<string | null>(null);
  const { svar, nuMs } = useFids();
  const flug: Flug[] = svar?.flug ?? [];

  const mittNafn = VAKT.starfsfolk.find((s) => s.id === state.notandi)?.nafn ?? "Óþekktur";

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

  // Flug (ekki Icelandair) sem nota Suður hlið – til að sýna lista af því
  // hvað er að koma og fara, og á hvaða hliði, óháð því hvort snúa þarf.
  const sudurNumer = useMemo(() => new Set(SUDUR_HLID.map((h) => h.numer)), []);
  const sudurFlug = useMemo(
    () =>
      flug
        .filter((f) => sudurNumer.has(hlidNumer(f.hlid) ?? -1) && !erIcelandair(f) && f.tegund === "arrival")
        .filter((f) => flugTs(f, nuMs) >= nuMs && flugTs(f, nuMs) <= nuMs + 7 * 3600_000)
        .sort((a, b) => flugTs(a, nuMs) - flugTs(b, nuMs)),
    [flug, sudurNumer, nuMs]
  );

  // Næsta brottför á hverjum rútuhliðahópi (24-27, 28-29) – til að sjá hvenær
  // næst þarf að snúa þeim hliðum, óháð Icelandair flugum.
  const rutuNaestaBrottfor = useMemo(
    () =>
      RUTU_UNDIRHOPAR.map((hopur) => {
        const next = flug
          .filter(
            (f) =>
              f.tegund === "departure" &&
              !erIcelandair(f) &&
              hopur.numer.includes(hlidNumer(f.hlid) ?? -1) &&
              flugTs(f, nuMs) >= nuMs
          )
          .sort((a, b) => flugTs(a, nuMs) - flugTs(b, nuMs))[0];
        return { hopur, next };
      }),
    [flug, nuMs]
  );

  const adSnua = useMemo(() => {
    const result: AdSnuaItem[] = [];

    for (const h of hlid) {
      const info = gateInfo[h.id];
      if (info?.kind === "switch") result.push({ type: "hlid", hlid: h, info });
    }

    // Rútuhlið eru snúin saman sem hópur (24-27, 28-29) – því er aðeins
    // sagt til um að snúa hópnum þegar FIDS leyfir það fyrir ÖLL hliðin í
    // hópnum, ekki bara eitt af þeim.
    for (const hopur of RUTU_UNDIRHOPAR) {
      const gates = rutuhlid.filter((h) => hopur.numer.includes(h.numer));
      if (gates.length === 0) continue;
      const infos = gates.map((h) => gateInfo[h.id]);
      if (!infos.every((i): i is GateInfo => i?.kind === "switch")) continue;
      const required = infos[0]!.required;
      if (!infos.every((i) => i!.required === required)) continue;
      result.push({
        type: "rutuhlid",
        hopur,
        gates,
        info: { ...infos[0]!, flugTexti: infos.map((i) => i!.flugTexti).join(" · ") },
      });
    }

    return result;
  }, [gateInfo, hlid, rutuhlid]);

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

  return {
    mittNafn,
    flug,
    nuMs,
    stada,
    faersla,
    hlid,
    rutuhlid,
    gateInfo,
    sudurFlug,
    rutuNaestaBrottfor,
    adSnua,
    stadfesta,
    setStadfesta,
    stadfestaHopur,
    setStadfestaHopur,
    stadfestaSnuning,
    stadfestaHopSnuning,
    tilkynning,
  };
}
