"use client";

import { useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { useEftirlit } from "@/lib/store";
import { DMA_STAEDI, DMA_SVAEDI, DmaStada } from "@/lib/data/dma";

export default function DmaPage() {
  const { state, setDma, hladid } = useEftirlit();

  const stada = (id: string): DmaStada => state.dma[id] ?? "hreint";

  const taln = useMemo(() => {
    let hreint = 0;
    let ohreint = 0;
    for (const s of DMA_STAEDI) {
      if ((state.dma[s.id] ?? "hreint") === "ohreint") ohreint++;
      else hreint++;
    }
    return { hreint, ohreint };
  }, [state.dma]);

  return (
    <div>
      <PageHeader
        titill="DMA stæði"
        undirtitill="Staða stæða – hrein og óhrein"
        hægri={
          hladid && (
            <div className="flex gap-2 text-xs font-semibold">
              <span className="rounded-full bg-green-500/90 px-2 py-1">
                {taln.hreint} hrein
              </span>
              <span className="rounded-full bg-red-500/90 px-2 py-1">
                {taln.ohreint} óhrein
              </span>
            </div>
          )
        }
      />

      <div className="p-4">
        <p className="mb-4 text-sm text-slate-500">
          Smelltu á stæði til að skipta milli{" "}
          <span className="font-semibold text-green-700">hreint</span> og{" "}
          <span className="font-semibold text-red-700">óhreint</span>.
        </p>

        {DMA_SVAEDI.map((svaedi) => {
          const staedi = DMA_STAEDI.filter((s) => s.svaedi === svaedi);
          if (staedi.length === 0) return null;
          return (
            <section key={svaedi} className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {svaedi}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {staedi.map((s) => {
                  const ohreint = stada(s.id) === "ohreint";
                  return (
                    <button
                      key={s.id}
                      onClick={() =>
                        setDma(s.id, ohreint ? "hreint" : "ohreint")
                      }
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-5 font-semibold shadow-sm transition-colors active:scale-[0.98] ${
                        ohreint
                          ? "border-red-300 bg-red-50 text-red-700"
                          : "border-green-300 bg-green-50 text-green-700"
                      }`}
                    >
                      <span className="text-lg">{s.heiti}</span>
                      <span className="flex items-center gap-1 text-xs font-medium">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${
                            ohreint ? "bg-red-500" : "bg-green-500"
                          }`}
                        />
                        {ohreint ? "Óhreint" : "Hreint"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
