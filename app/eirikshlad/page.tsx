"use client";

import { useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { useFids } from "@/lib/fidsStore";
import { EIRIKSHLAD_STAEDI, flugAStaedi } from "@/lib/data/eirikshlad";

export default function EirikshladPage() {
  const { svar, nuMs } = useFids();

  const stoduliti = useMemo(() => {
    return EIRIKSHLAD_STAEDI.map((id) => ({
      id,
      flug: svar ? flugAStaedi(id, svar.flug, nuMs) : undefined,
    })).sort((a, b) => Number(a.id) - Number(b.id));
  }, [svar, nuMs]);

  const laus = stoduliti.filter((s) => !s.flug).length;
  const upptekin = stoduliti.length - laus;

  return (
    <div>
      <PageHeader
        titill="Stæði"
        undirtitill="Eiríkshlað"
        hægri={
          <div className="flex gap-1.5 text-xs font-semibold">
            <span className="rounded-full bg-blue-500 px-2 py-1">{laus} laus</span>
            <span className="rounded-full bg-red-500 px-2 py-1">{upptekin} upptekin</span>
          </div>
        }
      />

      <div className="p-3">
        {svar?.heimild === "synidaemi" && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            ⚠️ Sýnigögn birt – ekki náðist í rauntímagögn frá kefairport.is.
          </div>
        )}

        {!svar ? (
          <p className="py-10 text-center text-slate-400">Sæki flug…</p>
        ) : (
          <ul className="space-y-1.5">
            {stoduliti.map((s) => {
              const upptekid = !!s.flug;
              return (
                <li key={s.id}>
                  <div
                    className={`flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left shadow-sm ${
                      upptekid ? "border-red-200" : "border-blue-200"
                    }`}
                  >
                    <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                      {s.id}
                    </span>
                    <span className="flex-1">
                      {s.flug ? (
                        <span className="font-mono text-sm text-slate-700">
                          ✈ {s.flug.flugnumer} · {s.flug.reg}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">— laust —</span>
                      )}
                    </span>
                    <span
                      className={`rounded-md px-2.5 py-1.5 text-xs font-bold text-white ${
                        upptekid ? "bg-red-600" : "bg-blue-600"
                      }`}
                    >
                      {upptekid ? "Upptekið" : "Laust"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
