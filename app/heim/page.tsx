"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useEftirlit } from "@/lib/store";
import {
  POSTUR_LITUR,
  Postur,
  Starfsmadur,
  TIMAR,
  TIMAR_NOTT,
  VAKT,
  Vakt,
  erVaktstjori,
  virkVakt,
  virkurTimaVisirFyrir,
} from "@/lib/data/starfsfolk";
import SudurTilkynning from "@/components/SudurTilkynning";
import Vaktnotur from "@/components/Vaktnotur";
import { useSudurSnua } from "@/lib/useSudurSnua";
import { VERKEFNI, verkefniNuna, vaktFyrirKlst } from "@/lib/data/verkefni";
import { virkStarfsfolk } from "@/lib/skipulagsgerd";
import { Fylgd } from "@/lib/data/fylgdir";
import { allirStarfsmenn } from "@/lib/data/vaktir";

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

  const vardstjoriId = state.vardstjoriId ?? "omar";
  const adstodarvardstjoriId = state.adstodarvardstjoriId ?? "agust";
  const vakt = virkVakt(VAKT, vardstjoriId, adstodarvardstjoriId);

  const vaktgerd = now ? vaktFyrirKlst(now.getHours()) : "dagur";
  const nott = vaktgerd === "nott";
  const timar = nott ? TIMAR_NOTT : TIMAR;

  const allir = useMemo(() => allirStarfsmenn(state.vaktir), [state.vaktir]);

  const starfsfolk = useMemo(() => {
    if (nott) {
      return allir
        .filter((s) => !s.utkall)
        .map((s) => ({ ...s, postar: s.postarNott ?? Array(TIMAR_NOTT.length).fill("") }));
    }
    return virkStarfsfolk(allir, state.skipulag);
  }, [allir, state.skipulag, nott]);
  const ég = starfsfolk.find((s) => s.id === state.notandi);
  const visir = now ? virkurTimaVisirFyrir(timar, nott, now) : -1;
  const naestiVisir = visir + 1;

  const verkefniNu = useMemo(() => (now ? verkefniNuna(now) : []), [now]);

  const klstNu = now ? now.getHours() : -1;

  // Fylgdir sem vaktstjóri hefur merkt "Lokið" – birtast öllum á heimasíðunni,
  // óháð klukkustund (ekki bara meðan fylgdin er í gangi).
  const fylgdirNu = useMemo<Fylgd[]>(() => state.fylgdir.filter((f) => f.lokid), [state.fylgdir]);

  // Innsigli FLE verkefni sem hefst eftir um klukkustund – notað til að minna
  // þann sem er á Norður á að undirbúa það (tilkynning með bláum ramma).
  const fleEftirKlst = useMemo(() => {
    if (klstNu < 0) return null;
    return (
      VERKEFNI.find(
        (v) => /innsigli fle/i.test(v.titill) && Number(v.timi.split(":")[0]) === (klstNu + 1) % 24
      ) ?? null
    );
  }, [klstNu]);

  const sudur = useSudurSnua();

  if (!ég) return null;

  const núPostur = visir >= 0 ? ég.postar[visir] : "";
  const næstiPostur = naestiVisir < timar.length ? ég.postar[naestiVisir] : "";
  const erÁSuður = núPostur === "Schengen";
  const erVerkefniPostur = núPostur === "Verkefni";
  const synaNordurFle = núPostur === "Norður" && !!fleEftirKlst;
  const stjori = erVaktstjori(ég.nafn, vakt);
  const stjoriHeiti =
    ég.nafn === vakt.vardstjori ? "Vaktstjóri" : "Aðstoðarvaktstjóri";

  return (
    <div>
      <header className="bg-brand px-4 pb-5 pt-4 text-white">
        <div className="flex items-start justify-between gap-3 pr-12">
          <div>
            <p className="text-xs text-white/70">
              {nott ? "Næturvakt" : "Dagvakt"} · Vakt {VAKT.vakt}
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
            {visir >= 0 ? `Núna · ${timar[visir]}` : "Vaktin er ekki byrjuð"}
          </p>
          <p className="mt-1 text-3xl font-bold">
            {stjori ? stjoriHeiti : núPostur || (visir >= 0 ? "—" : "Sjá skipulag")}
          </p>
          {!stjori && næstiPostur && (
            <p className="mt-2 text-sm text-white/80">
              Næst {timar[naestiVisir]}:{" "}
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
        {/* Tilkynning: Norður á að undirbúa Innsigli FLE eftir um klukkustund. */}
        {synaNordurFle && fleEftirKlst && (
          <Link
            href={`/verkefni#${fleEftirKlst.id}`}
            className="flex items-center gap-3 rounded-xl border-2 border-brand bg-brand/5 p-3 shadow-sm ring-1 ring-brand/30 active:bg-brand/10"
          >
            <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              {fleEftirKlst.timi}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-brand">Norður: {fleEftirKlst.titill} eftir klukkustund</p>
              <p className="truncate text-xs text-slate-500">
                Undirbúa innsigli FLE fyrir kl. {fleEftirKlst.timi}.
              </p>
            </div>
            <span className="ml-auto text-brand/40">›</span>
          </Link>
        )}

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
                    className={`flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm active:bg-slate-50 ${
                      erVerkefniPostur ? "border-brand ring-1 ring-brand/40" : "border-slate-200"
                    }`}
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

          {/* Fylgdir þessa klukkustund – allir sjá; blár rammi ef úthlutað mér. */}
          {fylgdirNu.length > 0 && (
            <ul className="mt-2 space-y-2">
              {fylgdirNu.map((f) => {
                const mittVerkefni = f.starfsmenn.find((sm) => sm.starfsmadurId === state.notandi);
                const mín = !!mittVerkefni;
                const postar = f.starfsmenn
                  .map((sm) => allir.find((s) => s.id === sm.starfsmadurId)?.nafn)
                  .filter(Boolean)
                  .join(", ");
                return (
                  <li
                    key={f.id}
                    className={`rounded-xl border bg-white p-3 shadow-sm ${
                      mín ? "border-brand ring-1 ring-brand/40" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand">
                        Fylgd
                      </span>
                      <span className="font-semibold text-slate-900">{f.nafn}</span>
                      {f.tegund && <span className="text-xs text-slate-500">· {f.tegund}</span>}
                      {f.flugnumer && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                          ✈ {f.flugnumer}
                        </span>
                      )}
                      {(f.tilbuinn || f.timi) && (
                        <span className="ml-auto font-mono text-xs text-slate-500">
                          {f.tilbuinn ? `Tilbúinn ${f.tilbuinn}` : f.timi}
                        </span>
                      )}
                    </div>
                    {postar && <p className="mt-1 truncate text-xs text-slate-500">{postar}</p>}
                    {mín && (
                      <div className="mt-2 rounded-lg bg-brand/10 p-2">
                        <p className="text-xs font-semibold text-brand">Úthlutað þínum pósti</p>
                        {mittVerkefni?.verkefni && (
                          <p className="mt-0.5 text-xs text-brand/90">{mittVerkefni.verkefni}</p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Mín vakt – allir tímarammar */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Mín staðsetning í dag
          </h2>
          {stjori ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <div className="text-xs font-semibold text-slate-400">
                {timar[0]}–{timar[timar.length - 1]}
              </div>
              <div className="mt-1 rounded-md bg-brand/10 px-1 py-1 text-sm font-semibold text-brand">
                {stjoriHeiti}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {timar.map((t, i) => {
                const p: Postur = ég.postar[i];
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
          )}
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
          {synaGrid && <SkipulagGrid visir={visir} timar={timar} starfsfolk={starfsfolk} vakt={vakt} />}
        </section>

        <Vaktnotur mittNafn={ég.nafn} stjori={stjori} />

        <p className="pt-2 text-center text-[11px] text-slate-400">
          Varðstjóri: {vakt.vardstjori} · Aðstoðarvarðstjóri:{" "}
          {vakt.adstodarvardstjori}
        </p>
      </div>
    </div>
  );
}

function SkipulagGrid({
  visir,
  timar,
  starfsfolk,
  vakt,
}: {
  visir: number;
  timar: string[];
  starfsfolk: (Starfsmadur & { postar: Postur[] })[];
  vakt: Vakt;
}) {
  return (
    <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-brand text-white">
            <th className="sticky left-0 z-10 bg-brand px-2 py-2 text-left font-semibold">
              Starfsmaður
            </th>
            {timar.map((t, i) => (
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
                  } ${
                    visir >= bil.byrjun && visir < bil.byrjun + bil.fjoldi
                      ? "ring-1 ring-inset ring-brand/50"
                      : ""
                  }`}
                >
                  {stjori ? stjoriHeiti : bil.postur}
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
