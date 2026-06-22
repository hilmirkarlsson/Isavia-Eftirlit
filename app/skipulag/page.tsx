"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useEftirlit } from "@/lib/store";
import { POSTUR_LITUR, TIMAR, VAKT, erVaktstjori } from "@/lib/data/starfsfolk";
import { gerdaSlembidSkipulag, virkStarfsfolk } from "@/lib/skipulagsgerd";
import { vaktFyrirKlst } from "@/lib/data/verkefni";

export default function SkipulagPage() {
  const { state, setSkipulag } = useEftirlit();
  const [vaktgerd, setVaktgerd] = useState(vaktFyrirKlst());

  const ég = VAKT.starfsfolk.find((s) => s.id === state.notandi);
  const stjori = erVaktstjori(ég?.nafn);

  const starfsfolk = useMemo(
    () => virkStarfsfolk(VAKT.starfsfolk, state.skipulag),
    [state.skipulag]
  );

  if (!stjori) {
    return (
      <div>
        <PageHeader titill="Skipulagsgerð" undirtitill="Aðeins fyrir vaktstjóra" />
        <p className="p-6 text-center text-sm text-slate-500">
          Aðeins vaktstjóri og aðstoðarvaktstjóri hafa aðgang að Skipulagsgerð.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader titill="Skipulagsgerð" undirtitill="Slembiraðað vaktaplan" />

      <div className="space-y-4 p-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm text-slate-600">
            Býr til nýtt slembiraðað plan: fyrstu 6 tímar í meginrúllu (Norður,
            DMA CCTV, Flughlað, Afleysing, Landside, CCTV), seinni 6 tímar
            önnur leið – alltaf eitt plan í byrjun, hitt seinni hlutann.{" "}
            {vaktgerd === "dagur"
              ? "Tveir fara á samfellda 6 tíma Schengen-vakt, restin rúllar DMA/Verkefni á 2 tíma fresti."
              : "Engin Schengen-vakt á næturvakt – allir sem ekki eru í meginrúllu rúlla DMA/Verkefni á 2 tíma fresti."}
          </p>

          <div className="mb-3 flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setVaktgerd("dagur")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                vaktgerd === "dagur" ? "bg-brand text-white shadow-sm" : "text-slate-500"
              }`}
            >
              ☀️ Dagvakt
            </button>
            <button
              onClick={() => setVaktgerd("nott")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                vaktgerd === "nott" ? "bg-brand text-white shadow-sm" : "text-slate-500"
              }`}
            >
              🌙 Næturvakt
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSkipulag(gerdaSlembidSkipulag(VAKT.starfsfolk, vaktgerd))}
              className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white active:bg-brand-dark"
            >
              🎲 Slembiraða nýju plani
            </button>
            {state.skipulag && (
              <button
                onClick={() => setSkipulag(null)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-500 active:bg-slate-50"
              >
                Núllstilla
              </button>
            )}
          </div>
        </div>

        <SkipulagTafla starfsfolk={starfsfolk} />
      </div>
    </div>
  );
}

function SkipulagTafla({ starfsfolk }: { starfsfolk: ReturnType<typeof virkStarfsfolk> }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-brand text-white">
            <th className="sticky left-0 z-10 bg-brand px-2 py-2 text-left font-semibold">
              Starfsmaður
            </th>
            {TIMAR.map((t) => (
              <th key={t} className="px-1.5 py-2 font-semibold">
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {starfsfolk.map((s) => (
            <tr key={s.id} className="border-t border-slate-100">
              <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1.5 font-medium text-slate-700">
                {s.nafn}
              </td>
              {s.postar.map((p, i) => (
                <td
                  key={i}
                  className={`whitespace-nowrap px-1.5 py-1.5 text-center ${POSTUR_LITUR[p] ?? ""}`}
                >
                  {p || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
