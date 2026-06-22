"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useEftirlit } from "@/lib/store";
import { useFids } from "@/lib/fidsStore";
import { DMA_STAEDI, DmaStada, DmaStaedi, reiknaStadaUrFids, sjalfgefinStada } from "@/lib/data/dma";
import { flugTs } from "@/lib/fids";

// Hversu oft tímabundin stæði eru endurreiknuð sjálfkrafa út frá FIDS.
const ENDURREIKNA_MS = 10 * 60_000;

export default function DmaPage() {
  const { state, setDma, hladid } = useEftirlit();
  const { svar } = useFids();
  const [skoda, setSkoda] = useState<"flug" | "listi">("flug");
  const [adeinsVirk, setAdeinsVirk] = useState(false);

  // Tímabundin stæði eru sjálfvirk – staðan er reiknuð úr FIDS (er flug skráð
  // á stæðinu núna?) og endurreiknuð á 10 mínútna fresti, óháð því hve oft
  // FIDS sjálft uppfærist undir hettunni.
  useEffect(() => {
    if (!svar) return;
    const reikna = () => {
      for (const s of DMA_STAEDI) {
        if (s.gerd === "varanlegt") continue;
        setDma(s.id, reiknaStadaUrFids(s, svar.flug));
      }
    };
    reikna();
    const t = setInterval(reikna, ENDURREIKNA_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svar]);

  const stada = (s: DmaStaedi): DmaStada => state.dma[s.id] ?? sjalfgefinStada(s);
  const erHreint = (s: DmaStaedi) => stada(s) === "hreint";

  const taln = useMemo(() => {
    let hreint = 0;
    let ohreint = 0;
    for (const s of DMA_STAEDI) {
      if ((state.dma[s.id] ?? sjalfgefinStada(s)) === "hreint") hreint++;
      else ohreint++;
    }
    return { hreint, ohreint };
  }, [state.dma]);

  return (
    <div>
      <PageHeader
        titill="DMA stæði"
        undirtitill="Háaleitishlað"
        hægri={
          hladid && (
            <div className="flex gap-1.5 text-xs font-semibold">
              <span className="rounded-full bg-blue-500 px-2 py-1">{taln.hreint} blá</span>
              <span className="rounded-full bg-red-500 px-2 py-1">{taln.ohreint} rauð</span>
            </div>
          )
        }
      />

      {/* Kort / listi */}
      <div className="sticky top-[57px] z-10 flex items-center gap-2 border-b border-slate-200 bg-white p-2">
        <div className="flex flex-1 rounded-lg bg-slate-100 p-1">
          <SkodaHnappur virkur={skoda === "flug"} onClick={() => setSkoda("flug")} label="DMA flug" />
          <SkodaHnappur virkur={skoda === "listi"} onClick={() => setSkoda("listi")} label="Listi" />
        </div>
        {skoda === "listi" && (
          <label className="flex items-center gap-2 rounded-lg px-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={adeinsVirk}
              onChange={(e) => setAdeinsVirk(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand"
            />
            Aðeins virk
          </label>
        )}
      </div>

      {skoda === "flug" ? (
        <DmaFlugSyn stada={stada} />
      ) : (
        <ListiSyn stada={stada} erHreint={erHreint} adeinsVirk={adeinsVirk} />
      )}
    </div>
  );
}

// Stæðisnúmer DMA svæðisins, til að finna flug sem nota þau (eftir StandCode/staedi).
const DMA_STAEDISNUMER = new Set(DMA_STAEDI.map((s) => s.id));

function DmaFlugSyn({ stada }: { stada: (s: DmaStaedi) => DmaStada }) {
  const { svar, nuMs } = useFids();

  const dmaFlug = useMemo(() => {
    if (!svar) return [];
    return svar.flug
      .filter((f) => f.staedi && DMA_STAEDISNUMER.has(f.staedi))
      .sort((a, b) => flugTs(a, nuMs) - flugTs(b, nuMs));
  }, [svar, nuMs]);

  const staediKort = useMemo(() => {
    const map = new Map<string, DmaStaedi>();
    for (const s of DMA_STAEDI) map.set(s.id, s);
    return map;
  }, []);

  return (
    <div className="p-3">
      <p className="mb-2 text-xs text-slate-500">
        Flug sem nota stæði á DMA svæðinu (Háaleitishlaði). Staðan er reiknuð
        sjálfvirkt úr FIDS og endurreiknuð á 10 mín. fresti: blátt þýðir
        stæðið er laust/DMA núna, rautt þýðir flug er á stæðinu (EKKI DMA).
      </p>

      {svar?.heimild === "synidaemi" && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          ⚠️ Sýnigögn birt – ekki náðist í rauntímagögn frá kefairport.is.
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
            const hreint = s ? stada(s) === "hreint" : false;
            return (
              <li
                key={f.id + f.flugnumer}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <span className="flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                  {f.staedi ?? "—"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-800">
                      {f.flugnumer} · {koma ? "Frá" : "Til"} {f.borg}
                    </p>
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
                  className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-bold text-white ${
                    hreint ? "bg-blue-600" : "bg-red-600"
                  }`}
                >
                  {hreint ? "DMA" : "EKKI DMA"}
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
  erHreint,
  adeinsVirk,
}: {
  stada: (s: DmaStaedi) => DmaStada;
  erHreint: (s: DmaStaedi) => boolean;
  adeinsVirk: boolean;
}) {
  let staedi = [...DMA_STAEDI].sort((a, b) => Number(a.id) - Number(b.id));
  if (adeinsVirk) staedi = staedi.filter((s) => erHreint(s));

  return (
    <div className="p-4">
      <ul className="space-y-1.5">
        {staedi.map((s) => {
          const hreint = erHreint(s);
          const last = s.gerd === "varanlegt";
          return (
            <li key={s.id}>
              <div
                className={`flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left shadow-sm ${
                  hreint ? "border-blue-200" : "border-red-200"
                }`}
              >
                <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                  {s.heiti}
                </span>
                <span className="flex-1">
                  {s.reg ? (
                    <span className="font-mono text-sm text-slate-700">✈ {s.reg}</span>
                  ) : (
                    <span className="text-sm text-slate-400">— laust —</span>
                  )}
                  {last && (
                    <span className="ml-2 text-[10px] font-medium uppercase text-slate-400">
                      varanlegt
                    </span>
                  )}
                </span>
                <span
                  className={`rounded-md px-2.5 py-1.5 text-xs font-bold text-white ${
                    hreint ? "bg-blue-600" : "bg-red-600"
                  }`}
                >
                  {hreint ? "DMA" : "EKKI DMA"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SkodaHnappur({
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
