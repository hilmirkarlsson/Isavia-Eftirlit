"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SkjaHaus, { HausFlipar } from "@/components/SkjaHaus";
import { useEftirlit } from "@/lib/store";
import { useFids } from "@/lib/fidsStore";
import { DMA_STAEDI, DmaStada, DmaStaedi, fidsOhreinkun, flugAStaedi, sjalfgefinStada } from "@/lib/data/dma";
import { flugTs } from "@/lib/fids";
import { usePullToReveal } from "@/lib/usePullToReveal";
import { NAESTU_KLST, minuturAftur } from "@/lib/flugGluggi";
import { haptik, haptikStadfest } from "@/lib/haptics";
import { erVaktstjori } from "@/lib/data/starfsfolk";
import { allirStarfsmenn } from "@/lib/data/vaktir";
import { IconAlert } from "@/components/Icons";

// Hversu oft tímabundin stæði eru endurreiknuð sjálfkrafa út frá FIDS.
const ENDURREIKNA_MS = 10 * 60_000;

export default function DmaPage() {
  const { state, setDma, hladid } = useEftirlit();
  const { svar } = useFids();
  const [skoda, setSkoda] = useState<"flug" | "listi">("flug");
  const [adeinsVirk, setAdeinsVirk] = useState(false);
  // Stæði sem beðið er staðfestingar á að hreinsa (fjarlægja DMA af).
  const [stadfestaHreinsun, setStadfestaHreinsun] = useState<DmaStaedi | null>(null);

  const ég = allirStarfsmenn(state.vaktir).find((s) => s.id === state.notandi);
  const stjori = erVaktstjori(ég?.nafn);

  // Tímabundin stæði byrja Ekki DMA og verða DMA sjálfkrafa þegar óhrein vél
  // mætir á þau (FIDS) – sjá `fidsOhreinkun`. Að fjarlægja DMA (hreinsa) er
  // alltaf handvirkt, með staðfestingu – sjá `smella`.
  useEffect(() => {
    if (!svar) return;
    const reikna = () => {
      for (const s of DMA_STAEDI) {
        if (s.gerd === "varanlegt") continue;
        const dma = fidsOhreinkun(s, svar.flug);
        if (dma) setDma(s.id, dma);
      }
    };
    reikna();
    const t = setInterval(reikna, ENDURREIKNA_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svar]);

  const stada = (s: DmaStaedi): DmaStada => state.dma[s.id] ?? sjalfgefinStada(s);
  // "hreint" = Ekki DMA (venjulegt stæði), sjá lib/data/dma.ts.
  const erEkkiDma = (s: DmaStaedi) => stada(s) === "hreint";

  // Ekki DMA → DMA: aðeins vaktstjórar/aðstoðarvaktstjórar mega merkja stæði
  // DMA (þeir meta hvort vél sé óhrein). Engin staðfesting þarf – fljótleg
  // aðgerð. DMA → Ekki DMA: hver sem er má hreinsa, en með staðfestingu svo
  // enginn hreinsi óvart stæði sem er í raun enn í notkun.
  const smella = (s: DmaStaedi) => {
    if (s.gerd === "varanlegt") return; // alltaf DMA, læst
    if (erEkkiDma(s)) {
      if (!stjori) return;
      haptik();
      setDma(s.id, "ohreint");
    } else {
      setStadfestaHreinsun(s);
    }
  };

  const stadfestaHreinsa = () => {
    if (!stadfestaHreinsun) return;
    haptikStadfest();
    setDma(stadfestaHreinsun.id, "hreint");
    setStadfestaHreinsun(null);
  };

  const taln = useMemo(() => {
    let dma = 0;
    let ekkiDma = 0;
    for (const s of DMA_STAEDI) {
      if ((state.dma[s.id] ?? sjalfgefinStada(s)) === "ohreint") dma++;
      else ekkiDma++;
    }
    return { dma, ekkiDma };
  }, [state.dma]);

  return (
    <div>
      <SkjaHaus
        titill="DMA stæði"
        undirtitill="Háaleitishlað"
        haegri={
          hladid && (
            <div className="flex gap-1.5 text-xs font-bold">
              <span className="rounded-full bg-white px-2.5 py-1 text-brand">{taln.dma} DMA</span>
              <span className="rounded-full bg-red-500 px-2.5 py-1 text-white">
                {taln.ekkiDma} Ekki DMA
              </span>
            </div>
          )
        }
      >
        <HausFlipar
          flipar={[
            { label: "DMA flug", virkur: skoda === "flug", onClick: () => setSkoda("flug") },
            { label: "Listi", virkur: skoda === "listi", onClick: () => setSkoda("listi") },
          ]}
        />
      </SkjaHaus>

      {skoda === "flug" ? (
        <DmaFlugSyn stada={stada} />
      ) : (
        <ListiSyn
          stada={stada}
          erEkkiDma={erEkkiDma}
          smella={smella}
          adeinsVirk={adeinsVirk}
          setAdeinsVirk={setAdeinsVirk}
          svar={svar}
          stjori={stjori}
        />
      )}

      {/* Staðfesting: fjarlægja DMA af stæði (hreinsa). */}
      {stadfestaHreinsun && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setStadfestaHreinsun(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-900">Hreinsa stæði?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Merkja stæði <b>{stadfestaHreinsun.heiti}</b> sem <b>Ekki DMA</b> (hreinsað)?
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setStadfestaHreinsun(null)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 active:bg-slate-200"
              >
                Hætta við
              </button>
              <button
                onClick={stadfestaHreinsa}
                className="flex-1 rounded-xl bg-brand px-4 py-3 font-semibold text-white active:bg-brand-dark"
              >
                Hreinsa stæði
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stæðisnúmer DMA svæðisins, til að finna flug sem nota þau (eftir StandCode/staedi).
const DMA_STAEDISNUMER = new Set(DMA_STAEDI.map((s) => s.id));

function DmaFlugSyn({ stada }: { stada: (s: DmaStaedi) => DmaStada }) {
  const { svar, nuMs, saekja } = useFids();
  // Hversu mörg „skrun-upp“ tog – stýrir hve langt aftur fyrri flug eru sýnd.
  const [bakSkref, setBakSkref] = useState(0);

  // Skrun upp efst: sýna fyrri flug OG uppfæra gögnin.
  usePullToReveal(
    useCallback(() => {
      setBakSkref((n) => (minuturAftur(n) >= NAESTU_KLST * 60 ? n : n + 1));
      void saekja();
    }, [saekja])
  );

  const undirMork = nuMs - minuturAftur(bakSkref) * 60_000 - 60_000;
  const yfirMork = nuMs + NAESTU_KLST * 3600_000;

  const dmaFlug = useMemo(() => {
    if (!svar) return [];
    return svar.flug
      .filter((f) => f.staedi && DMA_STAEDISNUMER.has(f.staedi))
      .filter((f) => {
        const t = flugTs(f, nuMs);
        return t >= undirMork && t <= yfirMork;
      })
      .sort((a, b) => flugTs(a, nuMs) - flugTs(b, nuMs));
  }, [svar, nuMs, undirMork, yfirMork]);

  // Næsta flug sem á eftir að koma/fara (fyrsta í röðinni sem er ekki liðið).
  const naestaId = useMemo(() => {
    const naesta = dmaFlug.find((f) => flugTs(f, nuMs) >= nuMs - 60_000);
    return naesta ? naesta.id + naesta.flugnumer : null;
  }, [dmaFlug, nuMs]);

  const synaFyrri = minuturAftur(bakSkref) < NAESTU_KLST * 60;

  const staediKort = useMemo(() => {
    const map = new Map<string, DmaStaedi>();
    for (const s of DMA_STAEDI) map.set(s.id, s);
    return map;
  }, []);

  return (
    <div className="p-4">
      <p className="mb-2 text-xs text-slate-500">
        Flug sem nota stæði á DMA svæðinu (Háaleitishlaði). Blátt merki þýðir
        DMA – óhrein vél stendur á stæðinu og það þarf sérstaka meðhöndlun.
        Rautt þýðir Ekki DMA – venjulegt stæði. Tímabundin stæði verða
        sjálfkrafa DMA þegar flug mætir, og fara aftur í Ekki DMA þegar
        DMA-vakt hreinsar þau í listanum (með staðfestingu).
      </p>
      <p
        className={`mb-2 text-center text-[11px] text-slate-400 ${
          synaFyrri ? "coarse-only" : ""
        }`}
      >
        {synaFyrri
          ? "↑ Skrunaðu upp til að sjá fyrri flug og uppfæra"
          : `Sýni allt að ${NAESTU_KLST} klst aftur í tímann`}
      </p>

      {svar?.heimild === "synidaemi" && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <IconAlert className="h-4 w-4 shrink-0" />
          Sýnigögn birt – ekki náðist í rauntímagögn frá kefairport.is.
        </div>
      )}

      {!svar ? (
        <p className="py-10 text-center text-slate-400">Sæki flug…</p>
      ) : dmaFlug.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          Engin flug fundust á DMA stæðum.
        </p>
      ) : (
        <ul className="space-y-2">
          {dmaFlug.map((f) => {
            const koma = f.tegund === "arrival";
            const s = f.staedi ? staediKort.get(f.staedi) : undefined;
            const ekkiDma = s ? stada(s) === "hreint" : false;
            const naesta = f.id + f.flugnumer === naestaId;
            const fyrri = flugTs(f, nuMs) < nuMs - 60_000;
            return (
              <li
                key={f.id + f.flugnumer}
                className={`flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm ${
                  naesta
                    ? "border-2 border-brand ring-2 ring-brand/20"
                    : "border-slate-200"
                } ${fyrri ? "opacity-60" : ""}`}
              >
                <span className="flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                  {f.staedi ?? "—"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-800">
                      {f.flugnumer} · {koma ? "Frá" : "Til"} {f.borg}
                    </p>
                    {naesta && (
                      <span className="shrink-0 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Næsta
                      </span>
                    )}
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        koma ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {koma ? "Koma" : "Brottför"}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {f.raun || f.aaetlad} · {f.flugfelag}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white ${
                    ekkiDma ? "bg-red-600" : "bg-brand"
                  }`}
                >
                  {ekkiDma ? "EKKI DMA" : "DMA"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ListiSyn({
  stada,
  erEkkiDma,
  smella,
  adeinsVirk,
  setAdeinsVirk,
  svar,
  stjori,
}: {
  stada: (s: DmaStaedi) => DmaStada;
  erEkkiDma: (s: DmaStaedi) => boolean;
  smella: (s: DmaStaedi) => void;
  adeinsVirk: boolean;
  setAdeinsVirk: (v: boolean) => void;
  svar: ReturnType<typeof useFids>["svar"];
  stjori: boolean;
}) {
  let staedi = [...DMA_STAEDI].sort((a, b) => Number(a.id) - Number(b.id));
  if (adeinsVirk) staedi = staedi.filter((s) => !erEkkiDma(s));

  return (
    <div className="p-4">
      <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-600">
        <input
          type="checkbox"
          checked={adeinsVirk}
          onChange={(e) => setAdeinsVirk(e.target.checked)}
          className="h-5 w-5 rounded border-slate-300 text-brand"
        />
        Aðeins DMA
      </label>
      <ul className="space-y-2">
        {staedi.map((s) => {
          const ekkiDma = erEkkiDma(s);
          const last = s.gerd === "varanlegt";
          // Almennt starfsfólk má ekki merkja stæði DMA (bara hreinsa) –
          // hnappurinn er læstur á Ekki DMA stæðum fyrir þau.
          const laest = last || (ekkiDma && !stjori);
          const flug = svar ? flugAStaedi(s, svar.flug) : undefined;
          return (
            <li key={s.id}>
              <button
                onClick={() => smella(s)}
                disabled={laest}
                className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm ${
                  laest ? "cursor-default" : "active:bg-slate-50"
                } ${ekkiDma ? "border-red-200" : "border-brand/25"} ${
                  laest && !last ? "opacity-60" : ""
                }`}
              >
                <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                  {s.heiti}
                </span>
                <span className="flex-1">
                  {flug?.reg ? (
                    <span className="font-mono text-sm text-slate-700">✈ {flug.reg}</span>
                  ) : (
                    <span className="text-sm text-slate-400">— laust —</span>
                  )}
                  {last && (
                    <span className="ml-2 text-[10px] font-medium uppercase text-slate-400">
                      varanlegt
                    </span>
                  )}
                  {laest && !last && (
                    <span className="ml-2 text-[10px] font-medium uppercase text-slate-400">
                      aðeins vaktstjóri
                    </span>
                  )}
                </span>
                <span
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white ${
                    ekkiDma ? "bg-red-600" : "bg-brand"
                  }`}
                >
                  {ekkiDma ? "EKKI DMA" : "DMA"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

