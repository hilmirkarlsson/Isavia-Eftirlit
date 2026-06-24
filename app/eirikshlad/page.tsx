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
          <div className="flex items-center gap-2" role="status" aria-label={`${laus} stæði laus, ${upptekin} upptekin`}>
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-300 opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-300" />
            </span>
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 p-1 text-xs font-semibold">
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1">
                <span className="tabular-nums">{laus}</span>
                <span className="font-normal text-white/70">laus</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1">
                <span className="tabular-nums">{upptekin}</span>
                <span className="font-normal text-white/70">upptekin</span>
              </span>
            </div>
          </div>
        }
      />

      <div className="p-3">
        {svar?.heimild === "synidaemi" && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
            <p>Sýnigögn birt – ekki náðist í rauntímagögn frá kefairport.is.</p>
          </div>
        )}

        {!svar ? (
          <ul className="space-y-1.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
              >
                <span className="h-9 w-12 shrink-0 animate-pulse rounded-lg bg-slate-100" />
                <span className="h-3.5 flex-1 animate-pulse rounded bg-slate-100" />
                <span className="h-6 w-20 shrink-0 animate-pulse rounded-full bg-slate-100" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-1.5">
            {stoduliti.map((s, i) => {
              const upptekid = !!s.flug;
              return (
                <li
                  key={s.id}
                  className="animate-row-in"
                  style={{ animationDelay: `${Math.min(i * 12, 280)}ms` }}
                >
                  <div
                    className={`flex w-full items-center gap-3 rounded-xl border border-slate-200 border-l-4 bg-white px-3 py-2.5 text-left shadow-sm ${
                      upptekid ? "border-l-red-500" : "border-l-blue-500"
                    }`}
                  >
                    <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-mono text-sm font-bold tabular-nums text-slate-700">
                      {s.id}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {s.flug ? (
                        <span className="font-mono text-sm text-slate-700">
                          <span className="text-slate-400">✈</span> {s.flug.flugnumer}
                          <span className="text-slate-300"> · </span>
                          {s.flug.reg}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Laust</span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white ${
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
