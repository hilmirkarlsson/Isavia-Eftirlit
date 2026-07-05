"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import SudurTilkynning from "@/components/SudurTilkynning";
import {
  BOKSTAFUR_LITUR,
  HLID_STODUR,
  RUTU_UNDIRHOPAR,
  SUDUR_STODUR,
  SudurHlid,
  SudurStada,
  hinRutuhlidStadan,
  hlidBokstafur,
  hlidNafn,
} from "@/lib/data/sudur";
import { useSudurSnua } from "@/lib/useSudurSnua";

type Sia = "hlid" | "rutuhlid";

// Punktur við stöðuheitið – lúmsk vísbending um lit án þess að lita allt
// kortið (kortin eru öll hvít/samræmd, sjá HlidKort). Hlutlaust fær grán
// hlutlausan punkt, enda algengasta og eðlilegasta staðan.
const STADA_DOT: Record<SudurStada, string> = {
  "schengen-komur": "bg-brand",
  "schengen-brottfor": "bg-brand",
  schengen: "bg-brand",
  "non-schengen-komur": "bg-violet-500",
  "non-schengen-brottfor": "bg-violet-500",
  "non-schengen": "bg-violet-500",
  hlutlaust: "bg-slate-400",
};

export default function SudurPage() {
  const [sia, setSia] = useState<Sia>("hlid");
  const {
    mittNafn,
    stada,
    faersla,
    hlid,
    rutuhlid,
    sudurFlug,
    rutuNaestaBrottfor,
    adSnua,
    stadfesta,
    setStadfesta,
    stadfestaHopur,
    setStadfestaHopur,
    stadfestaSnuning,
    stadfestaHopSnuning,
    tilkynning,
  } = useSudurSnua();

  return (
    <div>
      <PageHeader titill="Suður" undirtitill="Hliðaskipti – C (Schengen) / D (non-Schengen)" />

      {/* Sía: Hlið / Rútuhlið */}
      <div className="sticky top-[57px] z-10 border-b border-slate-200 bg-white p-2">
        <div className="flex rounded-xl bg-slate-100 p-1">
          <SiaHnappur virkur={sia === "hlid"} onClick={() => setSia("hlid")} label="Hlið" />
          <SiaHnappur
            virkur={sia === "rutuhlid"}
            onClick={() => setSia("rutuhlid")}
            label="Rútuhlið 24–29"
          />
        </div>
      </div>

      {/* Tilkynning efst: hlið sem þarf að snúa (óvirk þangað til rauntímatenging
          við Isavia er til, sjá lib/useSudurSnua.ts – adSnua er alltaf tómt núna) */}
      <SudurTilkynning
        mittNafn={mittNafn}
        adSnua={adSnua}
        stadfesta={stadfesta}
        setStadfesta={setStadfesta}
        stadfestaHopur={stadfestaHopur}
        setStadfestaHopur={setStadfestaHopur}
        stadfestaSnuning={stadfestaSnuning}
        stadfestaHopSnuning={stadfestaHopSnuning}
        tilkynning={tilkynning}
        stada={stada}
      />

      {/* Flug á Suður hliðum (ekki Icelandair – þeir sjá sjálfir um sín hlið) */}
      {sia === "hlid" && sudurFlug.length > 0 && (
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            Komur á Suður hliðum næstu 7 klst ({sudurFlug.length})
          </h2>
          <ul className="space-y-1.5">
            {sudurFlug.map((f) => (
              <li
                key={f.id + f.flugnumer}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="w-12 shrink-0 text-center font-bold tabular-nums text-slate-700">
                  {f.raun || f.aaetlad}
                </span>
                <span className="flex h-7 w-12 shrink-0 items-center justify-center rounded-md bg-brand text-xs font-bold text-white">
                  {f.hlid ?? "—"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">
                    {f.flugnumer} · Frá {f.borg}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {f.handling ?? "—"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Næsta brottför á rútuhliðum – bara upplýsandi (hvenær), sjálfvirk
          krafa um Schengen/Non-Schengen var fjarlægð, sjá useSudurSnua.ts */}
      {sia === "rutuhlid" && (
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            Næsta brottför á rútuhliðum
          </h2>
          <ul className="space-y-1.5">
            {rutuNaestaBrottfor.map(({ hopur, next }) => (
              <li
                key={hopur.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="flex h-7 w-16 shrink-0 items-center justify-center rounded-md bg-slate-500 text-xs font-bold text-white">
                  {hopur.label}
                </span>
                {next ? (
                  <>
                    <span className="w-12 shrink-0 text-center font-bold tabular-nums text-slate-700">
                      {next.raun || next.aaetlad}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">
                        {next.flugnumer} · Til {next.borg}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-400">Engin brottför á næstunni</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-4">
        {sia === "hlid" ? (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Hlið · Komur
            </h2>
            <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0 xl:grid-cols-3">
              {hlid.map((h) => (
                <HlidKort
                  key={h.id}
                  hlid={h}
                  stada={stada(h)}
                  faersla={faersla(h)}
                  onSnua={(ny) => setStadfesta({ hlid: h, ny })}
                />
              ))}
            </div>
          </section>
        ) : (
          RUTU_UNDIRHOPAR.map((hopur) => {
            const gates = rutuhlid.filter((h) => hopur.numer.includes(h.numer));
            if (gates.length === 0) return null;
            // Öll hliðin í hópnum eru snúin saman – ekki er hægt að snúa þeim
            // hverju í sínu lagi. Rútuhlið hafa bara tvær stöður (Schengen/
            // Non-Schengen), sjá athugasemd í lib/data/sudur.ts.
            const hopStada = stada(gates[0]) as "schengen" | "non-schengen";
            const hopNy = hinRutuhlidStadan(hopStada);
            return (
              <section key={hopur.id} className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Rútuhlið {hopur.label}
                  </h2>
                  <button
                    onClick={() => setStadfestaHopur({ hopur, gates, ny: hopNy })}
                    className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white active:bg-brand-dark"
                  >
                    Snúa í {hlidBokstafur(hopNy)}
                  </button>
                </div>
                <div className="space-y-2">
                  {gates.map((h) => (
                    <HlidKort key={h.id} hlid={h} stada={stada(h)} faersla={faersla(h)} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

function HlidKort({
  hlid,
  stada,
  faersla,
  onSnua,
}: {
  hlid: SudurHlid;
  stada: SudurStada;
  faersla?: { af: string; kl: string };
  onSnua?: (ny: SudurStada) => void;
}) {
  const bokstafur = hlidBokstafur(stada, hlid);
  // Bara venjuleg landgangshlið (ekki rútuhlið) fá stöðuveljarann hér – hann
  // sýnir öll fimm stigin. Rútuhlið eru snúin sem hópur (sjá foreldursíðuna).
  const synaVeljara = hlid.gerd === "hlid" && !!onSnua;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-lg text-white ${BOKSTAFUR_LITUR[bokstafur]}`}
        >
          <span className="text-lg font-bold leading-none">{hlidNafn(hlid, stada)}</span>
          {hlid.gerd === "rutuhlid" && (
            <span className="mt-0.5 text-[8px] font-bold uppercase opacity-90">Rúta</span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${STADA_DOT[stada]}`} />
            {SUDUR_STODUR[stada].titill}
          </div>
          {faersla ? (
            <p className="truncate text-xs text-slate-500">
              Snúið af <b>{faersla.af}</b> · {klukkan(faersla.kl)}
            </p>
          ) : (
            <p className="text-xs text-slate-400">Sjálfgefin staða</p>
          )}
        </div>

        {synaVeljara && (
          <select
            value={stada}
            onChange={(e) => onSnua!(e.target.value as SudurStada)}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700"
          >
            {HLID_STODUR.map((s) => (
              <option key={s} value={s}>
                {SUDUR_STODUR[s].titill}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

function klukkan(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function SiaHnappur({
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
      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
        virkur ? "bg-brand text-white shadow-sm" : "text-slate-500"
      }`}
    >
      {label}
    </button>
  );
}
