"use client";

import { useCallback, useMemo, useState } from "react";
import { useEftirlit } from "@/lib/store";
import { useFids } from "@/lib/fidsStore";
import { allirStarfsmenn } from "@/lib/data/vaktir";
import { RUTU_UNDIRHOPAR, SUDUR_HLID, SUDUR_STODUR, SudurHlid, SudurStada, hlidNafn } from "@/lib/data/sudur";
import { Flug, erIcelandair, flugTs, hlidNumer } from "@/lib/fids";

// ATH: Sjálfvirk útreikningur á því hvaða hlið "þurfi" að snúa (byggt á FIDS-
// spá um Schengen/non-Schengen næsta flugs) var fjarlægður hér. Sú útreikning
// gekk út frá að hvert hlið hefði nákvæmlega tvær mögulegar stöður – núna
// hafa venjuleg hlið fimm (þ.m.t. hlutlaust, sem er sjálfgefið þar til vaktin
// veit annað), svo "krafist" staða er ekki lengur ótvíræð út frá FIDS einu
// og sér. Endurvekja þetta þegar til er rauntímatenging við Isavia sem segir
// með vissu hvaða hlið er í notkun hverju sinni.
export type GateInfo = {
  required: SudurStada;
  kind: "switch" | "waiting";
  reason: "boarding-closed" | "no-departures";
  flugTexti: string;
};

export type AdSnuaItem =
  | { type: "hlid"; hlid: SudurHlid; info: GateInfo }
  | { type: "rutuhlid"; hopur: (typeof RUTU_UNDIRHOPAR)[number]; gates: SudurHlid[]; info: GateInfo };

/** Reiknar upplýsingar fyrir Suður síðuna: núverandi staða hliða, komandi
 *  flug á Suður hliðum, og staðfestingarflæðið þegar vaktin stillir hlið
 *  handvirkt. Deilt milli Suður síðunnar og tilkynningar á heimasíðunni. */
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

  const mittNafn = allirStarfsmenn(state.vaktir).find((s) => s.id === state.notandi)?.nafn ?? "Óþekktur";

  const stada = useCallback(
    (h: SudurHlid): SudurStada => state.sudur[h.id]?.stada ?? h.sjalfgefid,
    [state.sudur]
  );
  const faersla = (h: SudurHlid) => state.sudur[h.id];

  const hlid = useMemo(() => SUDUR_HLID.filter((h) => h.gerd === "hlid"), []);
  const rutuhlid = useMemo(() => SUDUR_HLID.filter((h) => h.gerd === "rutuhlid"), []);

  // Sjálfvirk "þarf að snúa" spá er óvirk (sjá athugasemd að ofan) þangað til
  // rauntímatenging við Isavia er til staðar.
  const gateInfo: Record<string, GateInfo> = useMemo(() => ({}), []);
  const adSnua: AdSnuaItem[] = useMemo(() => [], []);

  // Flug (ekki Icelandair) sem nota Suður hlið – til að sýna lista af því
  // hvað er að koma og fara, og á hvaða hliði. Eingöngu upplýsandi listi,
  // stillir ekkert sjálfkrafa.
  const sudurNumer = useMemo(() => new Set(SUDUR_HLID.map((h) => h.numer)), []);
  const sudurFlug = useMemo(
    () =>
      flug
        .filter((f) => sudurNumer.has(hlidNumer(f.hlid) ?? -1) && !erIcelandair(f) && f.tegund === "arrival")
        .filter((f) => flugTs(f, nuMs) >= nuMs && flugTs(f, nuMs) <= nuMs + 7 * 3600_000)
        .sort((a, b) => flugTs(a, nuMs) - flugTs(b, nuMs)),
    [flug, sudurNumer, nuMs]
  );

  // Næsta brottför á hverjum rútuhliðahópi (24-27, 28-29) – bara upplýsandi
  // (hvenær er næsta brottför þaðan), ekki lengur með sjálfvirkri kröfu um
  // hvaða staða "ætti" að vera valin, sjá athugasemd efst í skránni.
  const rutuNaestaBrottfor = useMemo(
    () =>
      RUTU_UNDIRHOPAR.map((hopur) => {
        const gates = rutuhlid.filter((h) => hopur.numer.includes(h.numer));
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
    [flug, nuMs, rutuhlid]
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
