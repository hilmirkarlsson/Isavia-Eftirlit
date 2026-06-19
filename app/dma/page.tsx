"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useEftirlit } from "@/lib/store";
import {
  DMA_STAEDI,
  DMA_SVAEDI,
  DmaStada,
  DmaStaedi,
  sjalfgefinStada,
} from "@/lib/data/dma";

export default function DmaPage() {
  const { state, setDma, hladid } = useEftirlit();
  const [skoda, setSkoda] = useState<"kort" | "listi">("kort");
  const [adeinsVirk, setAdeinsVirk] = useState(false);

  const stada = (s: DmaStaedi): DmaStada => state.dma[s.id] ?? sjalfgefinStada(s);
  const erHreint = (s: DmaStaedi) => stada(s) === "hreint";

  const smella = (s: DmaStaedi) => {
    if (s.gerd === "varanlegt") return; // alltaf blátt, læst
    setDma(s.id, erHreint(s) ? "ohreint" : "hreint");
  };

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
          <SkodaHnappur virkur={skoda === "kort"} onClick={() => setSkoda("kort")} label="Kort" />
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

      {skoda === "kort" ? (
        <KortSyn stada={stada} erHreint={erHreint} smella={smella} />
      ) : (
        <ListiSyn
          stada={stada}
          erHreint={erHreint}
          smella={smella}
          adeinsVirk={adeinsVirk}
        />
      )}
    </div>
  );
}

function KortSyn({
  erHreint,
  smella,
}: {
  stada: (s: DmaStaedi) => DmaStada;
  erHreint: (s: DmaStaedi) => boolean;
  smella: (s: DmaStaedi) => void;
}) {
  return (
    <div className="p-3">
      <p className="mb-2 text-xs text-slate-500">
        Bláir reitir eru hreinir/virkir, rauðir eru óhreinir. Smelltu á
        tímabundið stæði til að gera það blátt í ákveðinn tíma. Varanleg stæði
        (101–108, 810) eru alltaf blá.
      </p>

      <div
        className="relative w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-700 bg-cover bg-center shadow-sm"
        style={{
          aspectRatio: "3 / 4",
          backgroundImage: "url(/dma-map.jpg)",
        }}
      >
        {/* Fellur til baka á dökkan bakgrunn ef myndin er ekki til staðar. */}
        {DMA_STAEDI.map((s) => {
          const hreint = erHreint(s);
          const last = s.gerd === "varanlegt";
          return (
            <button
              key={s.id}
              onClick={() => smella(s)}
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-md border-2 px-1.5 py-0.5 text-[11px] font-bold shadow-md transition-transform active:scale-95 ${
                hreint
                  ? "border-blue-300 bg-blue-600 text-white"
                  : "border-red-300 bg-red-600 text-white"
              } ${last ? "cursor-default opacity-95 ring-1 ring-white/40" : ""}`}
              title={
                last
                  ? `${s.heiti} · varanlegt (alltaf blátt)`
                  : `${s.heiti} · ${hreint ? "blátt/hreint" : "rautt/óhreint"} – smelltu til að breyta`
              }
            >
              {s.heiti}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-5 text-xs text-slate-600">
        <Skyring litur="bg-blue-600" texti="Hreint / virkt" />
        <Skyring litur="bg-red-600" texti="Óhreint" />
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-blue-600 ring-1 ring-white/60 ring-offset-1" />
          Varanlegt (læst)
        </span>
      </div>

      <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
        Til að sýna gervihnattamyndina: settu myndina þína sem{" "}
        <code className="font-mono">public/dma-map.jpg</code>. Fínstilltu
        staðsetningu reitanna (x/y) í <code className="font-mono">lib/data/dma.ts</code>.
      </p>
    </div>
  );
}

function ListiSyn({
  stada,
  erHreint,
  smella,
  adeinsVirk,
}: {
  stada: (s: DmaStaedi) => DmaStada;
  erHreint: (s: DmaStaedi) => boolean;
  smella: (s: DmaStaedi) => void;
  adeinsVirk: boolean;
}) {
  return (
    <div className="p-4">
      {DMA_SVAEDI.map((svaedi) => {
        let staedi = DMA_STAEDI.filter((s) => s.svaedi === svaedi);
        if (adeinsVirk) staedi = staedi.filter((s) => erHreint(s));
        if (staedi.length === 0) return null;
        return (
          <section key={svaedi} className="mb-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {svaedi}
            </h2>
            <ul className="space-y-1.5">
              {staedi.map((s) => {
                const hreint = erHreint(s);
                const last = s.gerd === "varanlegt";
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => smella(s)}
                      disabled={last}
                      className={`flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left shadow-sm ${
                        last ? "cursor-default" : "active:bg-slate-50"
                      } ${hreint ? "border-blue-200" : "border-red-200"}`}
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
                        {hreint ? "BLÁTT" : "DMA"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
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

function Skyring({ litur, texti }: { litur: string; texti: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-3 w-3 rounded-sm ${litur}`} />
      {texti}
    </span>
  );
}
