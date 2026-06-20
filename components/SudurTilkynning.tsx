"use client";

import { SUDUR_STODUR, SudurHlid, SudurStada, hlidBokstafur, hlidNafn } from "@/lib/data/sudur";
import { AdSnuaItem } from "@/lib/useSudurSnua";

const BOKSTAFUR_LITUR: Record<string, string> = {
  A: "bg-blue-600",
  C: "bg-blue-600",
  D: "bg-violet-600",
  "": "bg-amber-500",
};

type Props = {
  mittNafn: string;
  adSnua: AdSnuaItem[];
  stadfesta: { hlid: SudurHlid; ny: SudurStada } | null;
  setStadfesta: (v: { hlid: SudurHlid; ny: SudurStada } | null) => void;
  stadfestaHopur: { hopur: { id: string; label: string; numer: number[] }; gates: SudurHlid[]; ny: SudurStada } | null;
  setStadfestaHopur: (
    v: { hopur: { id: string; label: string; numer: number[] }; gates: SudurHlid[]; ny: SudurStada } | null
  ) => void;
  stadfestaSnuning: () => void;
  stadfestaHopSnuning: () => void;
  tilkynning: string | null;
  stada: (h: SudurHlid) => SudurStada;
  titilAukning?: string;
};

/** Tilkynning um hlið sem þarf að snúa á Suður, til sýnis hvar sem
 *  notandinn er staðsettur á Suður í dag (t.d. á heimasíðunni). */
export default function SudurTilkynning({
  mittNafn,
  adSnua,
  stadfesta,
  setStadfesta,
  stadfestaHopur,
  setStadfestaHopur,
  stadfestaSnuning,
  stadfestaHopSnuning,
  tilkynning,
  stada,
  titilAukning = "",
}: Props) {
  if (adSnua.length === 0 && !stadfesta && !stadfestaHopur && !tilkynning) return null;

  return (
    <>
      {adSnua.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
            <span className="flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-amber-500 text-xs text-white">
              !
            </span>
            Snúa þarf {adSnua.length} {adSnua.length === 1 ? "hliði" : "hliðum"}
            {titilAukning}
          </div>
          <ul className="mt-2 space-y-2">
            {adSnua.map((item) => {
              const { info } = item;
              const numerTexti = item.type === "hlid" ? `${item.hlid.numer}` : item.hopur.label;
              const key = item.type === "hlid" ? item.hlid.id : item.hopur.id;
              const letur = hlidBokstafur(info.required, item.type === "hlid" ? item.hlid : undefined);
              return (
                <li
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2"
                >
                  <span
                    className={`flex h-9 w-14 items-center justify-center rounded-md text-sm font-bold text-white ${BOKSTAFUR_LITUR[letur]}`}
                  >
                    {item.type === "hlid" ? letur : ""}
                    {numerTexti}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">Snúa í {letur}</p>
                    <p className="truncate text-xs text-slate-500">
                      {info.reason === "no-departures" ? "Engin brottför á hliði" : "Bording lokað"}{" "}
                      · {info.flugTexti}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      item.type === "hlid"
                        ? setStadfesta({ hlid: item.hlid, ny: info.required })
                        : setStadfestaHopur({ hopur: item.hopur, gates: item.gates, ny: info.required })
                    }
                    className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white active:bg-amber-700"
                  >
                    Snúa
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
                {stadfesta.hlid.gerd === "rutuhlid" ? "rútuhliði" : "hliði"} {stadfesta.hlid.numer}
              </b>{" "}
              úr <b>{hlidNafn(stadfesta.hlid, stada(stadfesta.hlid))}</b> í{" "}
              <b>{hlidNafn(stadfesta.hlid, stadfesta.ny)}</b> ({SUDUR_STODUR[stadfesta.ny].titill})?
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
    </>
  );
}
