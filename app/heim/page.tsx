"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useEftirlit } from "@/lib/store";
import {
  POSTUR_LITUR,
  Postur,
  TIMAR,
  VAKT,
  virkurTimaVisir,
} from "@/lib/data/starfsfolk";
import SudurTilkynning from "@/components/SudurTilkynning";
import { useSudurSnua } from "@/lib/useSudurSnua";

// Sameinar samliggjandi eins pósta í eitt bil (eins og samrunnar reitir
// í upprunalega skipulaginu).
function sameinaPosta(postar: Postur[]): { postur: Postur; byrjun: number; fjoldi: number }[] {
  const bil: { postur: Postur; byrjun: number; fjoldi: number }[] = [];
  postar.forEach((p, i) => {
    const sidasta = bil[bil.length - 1];
    if (sidasta && sidasta.postur === p) sidasta.fjoldi++;
    else bil.push({ postur: p, byrjun: i, fjoldi: 1 });
  });
  return bil;
}
import { verkefniNuna } from "@/lib/data/verkefni";

export default function HeimPage() {
  const { state, setNotandi } = useEftirlit();
  const [synaGrid, setSynaGrid] = useState(false);

  // Klukka sem uppfærist svo "núna" haldist rétt.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const ég = VAKT.starfsfolk.find((s) => s.id === state.notandi);
  const visir = now ? virkurTimaVisir(now) : -1;
  const naestiVisir = visir + 1;

  const verkefniNu = useMemo(() => (now ? verkefniNuna(now) : []), [now]);

  const sudur = useSudurSnua();

  if (!ég) return null;

  const núPostur = visir >= 0 ? ég.postar[visir] : "";
  const næstiPostur = naestiVisir < TIMAR.length ? ég.postar[naestiVisir] : "";
  const erÁSuður = núPostur === "Schengen";

  return (
    <div>
      <header className="bg-brand px-4 pb-5 pt-4 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/70">
              {VAKT.heiti} · Vakt {VAKT.vakt}
            </p>
            <h1 className="text-xl font-bold">{ég.nafn}</h1>
          </div>
          <button
            onClick={() => setNotandi(null)}
            className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium active:bg-white/25"
          >
            Skipta um notanda
          </button>
        </div>

        {/* Hvar á ég að vera núna */}
        <div className="mt-4 rounded-2xl bg-white/10 p-4">
          <p className="text-xs uppercase tracking-wide text-white/70">
            {visir >= 0 ? `Núna · ${TIMAR[visir]}` : "Vaktin er ekki byrjuð"}
          </p>
          <p className="mt-1 text-3xl font-bold">
            {núPostur || (visir >= 0 ? "—" : "Sjá skipulag")}
          </p>
          {næstiPostur && (
            <p className="mt-2 text-sm text-white/80">
              Næst {TIMAR[naestiVisir]}:{" "}
              <span className="font-semibold">{næstiPostur}</span>
            </p>
          )}
        </div>
      </header>

      {/* Tilkynning um hlið sem þarf að snúa á Suður – sýnd hér ef ég er
          staðsett(ur) á Suður (Schengen) núna. */}
      {erÁSuður && (
        <SudurTilkynning
          mittNafn={sudur.mittNafn}
          adSnua={sudur.adSnua}
          stadfesta={sudur.stadfesta}
          setStadfesta={sudur.setStadfesta}
          stadfestaHopur={sudur.stadfestaHopur}
          setStadfestaHopur={sudur.setStadfestaHopur}
          stadfestaSnuning={sudur.stadfestaSnuning}
          stadfestaHopSnuning={sudur.stadfestaHopSnuning}
          tilkynning={sudur.tilkynning}
          stada={sudur.stada}
          titilAukning=" á Suður"
        />
      )}

      <div className="space-y-4 p-4">
        {/* Verkefni á þessari klukkustund */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Verkefni á þessari klukkustund
          </h2>
          {verkefniNu.length === 0 ? (
            <p className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">
              Engin verkefni skráð á þessari klukkustund.{" "}
              <Link href="/verkefni" className="font-medium text-brand underline">
                Sjá öll verkefni
              </Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {verkefniNu.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/verkefni#${v.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm active:bg-slate-50"
                  >
                    <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand">
                      {v.timi}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{v.titill}</p>
                      <p className="truncate text-xs text-slate-500">{v.samantekt}</p>
                    </div>
                    <span className="ml-auto text-slate-300">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Mín vakt – allir tímarammar */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Mín staðsetning í dag
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TIMAR.map((t, i) => {
              const p = ég.postar[i];
              const virk = i === visir;
              return (
                <div
                  key={t}
                  className={`rounded-xl border p-2 text-center ${
                    virk ? "border-brand ring-2 ring-brand/30" : "border-slate-200"
                  } bg-white shadow-sm`}
                >
                  <div className="text-xs font-semibold text-slate-400">{t}</div>
                  <div
                    className={`mt-1 rounded-md px-1 py-1 text-sm font-semibold ${POSTUR_LITUR[p] ?? ""}`}
                  >
                    {p || "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Skipulag dagsins – allt starfsfólk */}
        <section>
          <button
            onClick={() => setSynaGrid((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm active:bg-slate-50"
          >
            <span>Skipulag dagsins (allir)</span>
            <span className={`text-slate-400 transition-transform ${synaGrid ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>
          {synaGrid && <SkipulagGrid visir={visir} />}
        </section>

        <p className="pt-2 text-center text-[11px] text-slate-400">
          Varðstjóri: {VAKT.vardstjori} · Aðstoðarvarðstjóri:{" "}
          {VAKT.adstodarvardstjori}
        </p>
      </div>
    </div>
  );
}

function SkipulagGrid({ visir }: { visir: number }) {
  return (
    <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-brand text-white">
            <th className="sticky left-0 z-10 bg-brand px-2 py-2 text-left font-semibold">
              Starfsmaður
            </th>
            {TIMAR.map((t, i) => (
              <th
                key={t}
                className={`px-1.5 py-2 font-semibold ${i === visir ? "bg-brand-dark" : ""}`}
              >
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VAKT.starfsfolk.map((s) => (
            <tr key={s.id} className="border-t border-slate-100">
              <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1.5 font-medium text-slate-700">
                {s.nafn}
              </td>
              {sameinaPosta(s.postar).map((bil, k) => (
                <td
                  key={k}
                  colSpan={bil.fjoldi}
                  className={`whitespace-nowrap px-1.5 py-1.5 text-center ${POSTUR_LITUR[bil.postur] ?? ""} ${
                    visir >= bil.byrjun && visir < bil.byrjun + bil.fjoldi
                      ? "ring-1 ring-inset ring-brand/50"
                      : ""
                  }`}
                >
                  {bil.postur}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
