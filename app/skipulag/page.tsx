"use client";

import { useMemo, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useEftirlit } from "@/lib/store";
import {
  POSTUR_LITUR,
  Postur,
  TIMAR,
  VAKT,
  VALDIR_STJORAR,
  Vakt,
  erVaktstjori,
  virkVakt,
} from "@/lib/data/starfsfolk";
import { gerdaSlembidSkipulag, virkStarfsfolk, Skipulag } from "@/lib/skipulagsgerd";
import { vaktFyrirKlst } from "@/lib/data/verkefni";

// Sameinar samliggjandi eins pósta í eitt bil.
function sameinaPosta(postar: Postur[]): { postur: Postur; byrjun: number; fjoldi: number }[] {
  const bil: { postur: Postur; byrjun: number; fjoldi: number }[] = [];
  postar.forEach((p, i) => {
    const sidasta = bil[bil.length - 1];
    if (sidasta && sidasta.postur === p) sidasta.fjoldi++;
    else bil.push({ postur: p, byrjun: i, fjoldi: 1 });
  });
  return bil;
}

export default function SkipulagPage() {
  const { state, setSkipulag, setVardstjoriId, setAdstodarvardstjoriId } = useEftirlit();
  const [vaktgerd, setVaktgerd] = useState(vaktFyrirKlst());
  const [hladaUpp, setHladaUpp] = useState(false);
  const [uppVilla, setUppVilla] = useState<string | null>(null);
  const skraInntak = useRef<HTMLInputElement>(null);

  async function velMynd(e: React.ChangeEvent<HTMLInputElement>) {
    const skra = e.target.files?.[0];
    e.target.value = "";
    if (!skra) return;

    setHladaUpp(true);
    setUppVilla(null);
    try {
      const form = new FormData();
      form.append("mynd", skra);
      const res = await fetch("/api/skipulag-mynd", { method: "POST", body: form });
      const data = (await res.json()) as { skipulag?: Skipulag; villa?: string };
      if (!res.ok || !data.skipulag) {
        setUppVilla(data.villa ?? "Ekki tókst að lesa myndina.");
        return;
      }
      setSkipulag(data.skipulag);
    } catch {
      setUppVilla("Villa kom upp við að senda myndina.");
    } finally {
      setHladaUpp(false);
    }
  }

  const vardstjoriId = state.vardstjoriId ?? "omar";
  const adstodarvardstjoriId = state.adstodarvardstjoriId ?? "agust";
  const vakt = virkVakt(VAKT, vardstjoriId, adstodarvardstjoriId);

  const ég = VAKT.starfsfolk.find((s) => s.id === state.notandi);
  const stjori = erVaktstjori(ég?.nafn, vakt);

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
            Velja vaktstjóra og aðstoðarvaktstjóra dagsins. Þeir taka ekki
            þátt í slembiröðuninni hér fyrir neðan.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Vaktstjóri</span>
              <select
                value={vardstjoriId}
                onChange={(e) => setVardstjoriId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
              >
                {VALDIR_STJORAR.map((id) => (
                  <option key={id} value={id}>
                    {VAKT.starfsfolk.find((s) => s.id === id)?.nafn ?? id}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">
                Aðstoðarvaktstjóri
              </span>
              <select
                value={adstodarvardstjoriId}
                onChange={(e) => setAdstodarvardstjoriId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
              >
                {VALDIR_STJORAR.map((id) => (
                  <option key={id} value={id}>
                    {VAKT.starfsfolk.find((s) => s.id === id)?.nafn ?? id}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

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
              onClick={() =>
                setSkipulag(
                  gerdaSlembidSkipulag(VAKT.starfsfolk, vaktgerd, [
                    vardstjoriId,
                    adstodarvardstjoriId,
                  ])
                )
              }
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

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm text-slate-600">
            Hlaða upp mynd af nýjasta planinu (t.d. ljósmynd af pappírsplani)
            – AI les myndina og setur planið inn sjálfkrafa. Þetta er
            bráðabirgðalausn þangað til allir eru farnir að nota
            slembiraðaða planagerðina hér fyrir ofan.
          </p>
          <input
            ref={skraInntak}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={velMynd}
          />
          <button
            onClick={() => skraInntak.current?.click()}
            disabled={hladaUpp}
            className="w-full rounded-xl border border-brand px-4 py-3 text-sm font-semibold text-brand active:bg-brand/5 disabled:opacity-50"
          >
            {hladaUpp ? "Les mynd…" : "📷 Hlaða upp mynd af plani"}
          </button>
          {uppVilla && <p className="mt-2 text-sm text-red-600">{uppVilla}</p>}
        </div>

        <SkipulagTafla starfsfolk={starfsfolk} vakt={vakt} />
      </div>
    </div>
  );
}

function SkipulagTafla({
  starfsfolk,
  vakt,
}: {
  starfsfolk: ReturnType<typeof virkStarfsfolk>;
  vakt: Vakt;
}) {
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
          {starfsfolk.map((s) => {
            const stjori = erVaktstjori(s.nafn, vakt);
            const stjoriHeiti =
              s.nafn === vakt.vardstjori ? "Vaktstjóri" : "Aðstoðarvaktstjóri";
            return (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1.5 font-medium text-slate-700">
                  {s.nafn}
                </td>
                {sameinaPosta(s.postar).map((bil, k) => (
                  <td
                    key={k}
                    colSpan={bil.fjoldi}
                    className={`whitespace-nowrap px-1.5 py-1.5 text-center ${
                      stjori ? "bg-brand/10 text-brand" : POSTUR_LITUR[bil.postur] ?? ""
                    }`}
                  >
                    {stjori ? stjoriHeiti : bil.postur || "—"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
