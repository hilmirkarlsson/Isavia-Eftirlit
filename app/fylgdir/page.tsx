"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useEftirlit } from "@/lib/store";
import { useFids } from "@/lib/fidsStore";
import {
  POSTUR_LITUR,
  Postur,
  TIMAR,
  TIMAR_NOTT,
  erVaktstjori,
  virkurTimaVisirFyrir,
} from "@/lib/data/starfsfolk";
import { Fylgd } from "@/lib/data/fylgdir";
import { allirStarfsmenn } from "@/lib/data/vaktir";
import { Flug, flugTs } from "@/lib/fids";
import { vaktFyrirKlst } from "@/lib/data/verkefni";
import { virkStarfsfolk } from "@/lib/skipulagsgerd";
import { Skipulag } from "@/lib/skipulagsgerd";

/** Pósturinn sem þessi starfsmaður er venjulega á, á tímapunkti fylgdarinnar. */
function postiTimi(
  allir: ReturnType<typeof allirStarfsmenn>,
  skipulag: Skipulag | null,
  timi: string | undefined,
  starfsmadurId: string
): Postur | null {
  if (!timi) return null;
  const [h, m] = timi.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  const nott = vaktFyrirKlst(h) === "nott";
  const timar = nott ? TIMAR_NOTT : TIMAR;
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  const visir = virkurTimaVisirFyrir(timar, nott, d);
  if (visir < 0) return null;
  if (nott) {
    const s = allir.find((x) => x.id === starfsmadurId);
    return s?.postarNott?.[visir] ?? null;
  }
  const virk = virkStarfsfolk(allir, skipulag);
  return virk.find((x) => x.id === starfsmadurId)?.postar[visir] ?? null;
}

export default function FylgdirPage() {
  const {
    state,
    addFylgd,
    setFylgdNafn,
    setFylgdTegund,
    addFylgdStarfsmadur,
    fjarlaegjaFylgdStarfsmadur,
    setFylgdStarfsmadurVerkefni,
    setFylgdTimi,
    setFylgdTilbuinn,
    setFylgdLokid,
    setFylgdFlug,
    fjarlaegjaFylgd,
  } = useEftirlit();
  const [nyttNafn, setNyttNafn] = useState("");
  const [flugvalFylgdId, setFlugvalFylgdId] = useState<string | null>(null);

  const allir = useMemo(() => allirStarfsmenn(state.vaktir), [state.vaktir]);
  const ég = allir.find((s) => s.id === state.notandi);
  const stjori = erVaktstjori(ég?.nafn);

  return (
    <div>
      <PageHeader titill="Fylgdir" undirtitill="Hver fylgir hverju verkefni" />

      <div className="space-y-4 p-4">
        {stjori && (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Ný fylgd</h2>
            <div className="flex gap-2">
              <input
                value={nyttNafn}
                onChange={(e) => setNyttNafn(e.target.value)}
                placeholder="Nafn fylgdar, t.d. VIP móttaka"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                onClick={() => {
                  if (!nyttNafn.trim()) return;
                  addFylgd(nyttNafn.trim());
                  setNyttNafn("");
                }}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white active:bg-brand-dark"
              >
                Bæta við
              </button>
            </div>
          </section>
        )}

        {!stjori && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Aðeins vaktstjórar geta bætt við fylgdum. Þú sérð allar skráðar fylgdir hér.
          </p>
        )}

        <section className="space-y-3">
          {state.fylgdir.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
              Engin fylgd skráð.
            </p>
          ) : (
            state.fylgdir.map((fylgd) => (
              <FylgdKort
                key={fylgd.id}
                fylgd={fylgd}
                allir={allir}
                skipulag={state.skipulag}
                ritstjornanlegt={stjori}
                onNafn={(nafn) => setFylgdNafn(fylgd.id, nafn)}
                onTegund={(tegund) => setFylgdTegund(fylgd.id, tegund)}
                onBaetaStarfsmanni={(id) => addFylgdStarfsmadur(fylgd.id, id)}
                onFjarlaegjaStarfsmann={(id) => fjarlaegjaFylgdStarfsmadur(fylgd.id, id)}
                onVerkefni={(id, verkefni) => setFylgdStarfsmadurVerkefni(fylgd.id, id, verkefni)}
                onTimi={(t) => setFylgdTimi(fylgd.id, t)}
                onTilbuinn={(t) => setFylgdTilbuinn(fylgd.id, t)}
                onTengjaFlug={() => setFlugvalFylgdId(fylgd.id)}
                onAftengjaFlug={() => setFylgdFlug(fylgd.id, null, null)}
                onLokid={(lokid) => setFylgdLokid(fylgd.id, lokid)}
                onFjarlaegja={() => fjarlaegjaFylgd(fylgd.id)}
              />
            ))
          )}
        </section>
      </div>

      {flugvalFylgdId && (
        <FlugvalGluggi
          onVelja={(f) => {
            setFylgdFlug(flugvalFylgdId, f.id, f.flugnumer);
            setFylgdTimi(flugvalFylgdId, (f.raun || f.aaetlad || "").slice(0, 5));
            setFlugvalFylgdId(null);
          }}
          onLoka={() => setFlugvalFylgdId(null)}
        />
      )}
    </div>
  );
}

function FylgdKort({
  fylgd,
  allir,
  skipulag,
  ritstjornanlegt,
  onNafn,
  onTegund,
  onBaetaStarfsmanni,
  onFjarlaegjaStarfsmann,
  onVerkefni,
  onTimi,
  onTilbuinn,
  onTengjaFlug,
  onAftengjaFlug,
  onLokid,
  onFjarlaegja,
}: {
  fylgd: Fylgd;
  allir: ReturnType<typeof allirStarfsmenn>;
  skipulag: Skipulag | null;
  ritstjornanlegt: boolean;
  onNafn: (nafn: string) => void;
  onTegund: (tegund: string) => void;
  onBaetaStarfsmanni: (id: string) => void;
  onFjarlaegjaStarfsmann: (id: string) => void;
  onVerkefni: (id: string, verkefni: string) => void;
  onTimi: (timi: string) => void;
  onTilbuinn: (timi: string) => void;
  onTengjaFlug: () => void;
  onAftengjaFlug: () => void;
  onLokid: (lokid: boolean) => void;
  onFjarlaegja: () => void;
}) {
  const [nyrStarfsmadur, setNyrStarfsmadur] = useState("");
  const [vistad, setVistad] = useState(false);
  const starfsmenn = fylgd.starfsmenn
    .map((sm) => {
      const s = allir.find((s) => s.id === sm.starfsmadurId);
      return s ? { ...sm, nafn: s.nafn } : undefined;
    })
    .filter((s): s is { starfsmadurId: string; verkefni: string; nafn: string } => !!s);

  if (!ritstjornanlegt) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">{fylgd.nafn}</span>
          {fylgd.tegund && (
            <span className="rounded bg-brand/10 px-1.5 py-0.5 text-xs font-semibold text-brand">
              {fylgd.tegund}
            </span>
          )}
          {fylgd.flugnumer && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
              ✈ {fylgd.flugnumer}
            </span>
          )}
          {fylgd.timi && <span className="font-mono text-xs text-slate-500">{fylgd.timi}</span>}
          {fylgd.tilbuinn && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
              Tilbúinn {fylgd.tilbuinn}
            </span>
          )}
          {fylgd.lokid && (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
              Lokið
            </span>
          )}
        </div>
        {starfsmenn.length > 0 ? (
          <ul className="mt-1 space-y-0.5 text-sm text-slate-600">
            {starfsmenn.map((s) => (
              <li key={s.starfsmadurId}>
                {s.nafn}
                {s.verkefni && <span className="text-slate-400"> · {s.verkefni}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-slate-600">Óúthlutað</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={fylgd.nafn}
          onChange={(e) => onNafn(e.target.value)}
          placeholder="Nafn fylgdar"
          className="min-w-[10rem] flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm font-semibold"
        />
        <input
          type="time"
          value={fylgd.timi}
          onChange={(e) => onTimi(e.target.value)}
          className="w-24 rounded-lg border border-slate-200 px-2 py-2 text-sm"
        />
        <button onClick={onFjarlaegja} className="shrink-0 px-1 text-slate-400 active:text-red-500">
          ✕
        </button>
      </div>

      <input
        value={fylgd.tegund}
        onChange={(e) => onTegund(e.target.value)}
        placeholder="Hvers konar fylgd er þetta? t.d. VIP, Hjólastóll, Töskur…"
        className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {fylgd.flugnumer ? (
          <button
            onClick={onAftengjaFlug}
            className="rounded-lg bg-brand/10 px-2 py-2 text-xs font-semibold text-brand active:bg-brand/20"
          >
            ✈ {fylgd.flugnumer} ✕
          </button>
        ) : (
          <button
            onClick={onTengjaFlug}
            className="rounded-lg border border-dashed border-slate-300 px-2 py-2 text-xs font-semibold text-slate-500 active:bg-slate-50"
          >
            + Tengja flug (koma eða brottför)
          </button>
        )}
        <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-500">
          <span className="font-semibold">Vera tilbúinn</span>
          <input
            type="time"
            value={fylgd.tilbuinn ?? ""}
            onChange={(e) => onTilbuinn(e.target.value)}
            className="rounded border border-slate-200 px-1 py-1 text-xs"
          />
          {fylgd.tilbuinn && (
            <button
              onClick={() => onTilbuinn("")}
              className="text-slate-400 active:text-red-500"
              aria-label="Hreinsa"
            >
              ✕
            </button>
          )}
        </label>
      </div>

      <div className="mt-2 space-y-1.5">
        {starfsmenn.map((s) => {
          const postur = postiTimi(allir, skipulag, fylgd.timi, s.starfsmadurId);
          return (
            <div
              key={s.starfsmadurId}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1.5"
            >
              <span className="shrink-0 text-xs font-medium text-slate-700">{s.nafn}</span>
              {postur && (
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${POSTUR_LITUR[postur] ?? ""}`}
                  title="Pósturinn sem viðkomandi er á á þessum tíma"
                >
                  {postur}
                </span>
              )}
              <input
                value={s.verkefni}
                onChange={(e) => onVerkefni(s.starfsmadurId, e.target.value)}
                placeholder="Verkefni þessa pósts…"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
              />
              <button
                onClick={() => onFjarlaegjaStarfsmann(s.starfsmadurId)}
                className="shrink-0 text-slate-400 active:text-red-500"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-2">
        <select
          value={nyrStarfsmadur}
          onChange={(e) => setNyrStarfsmadur(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm"
        >
          <option value="">+ Bæta pósti við fylgdina…</option>
          {allir
            .filter((s) => !fylgd.starfsmenn.some((sm) => sm.starfsmadurId === s.id))
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.nafn}
              </option>
            ))}
        </select>
        <button
          onClick={() => {
            if (!nyrStarfsmadur) return;
            onBaetaStarfsmanni(nyrStarfsmadur);
            setNyrStarfsmadur("");
          }}
          disabled={!nyrStarfsmadur}
          className="shrink-0 rounded-lg bg-brand/10 px-3 py-2 text-xs font-semibold text-brand active:bg-brand/20 disabled:opacity-40"
        >
          Bæta við
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            setVistad(true);
            setTimeout(() => setVistad(false), 1500);
          }}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            vistad ? "bg-emerald-100 text-emerald-700" : "bg-brand text-white active:bg-brand-dark"
          }`}
        >
          {vistad ? "Vistað ✓" : "Vista"}
        </button>
        <button
          onClick={() => onLokid(!fylgd.lokid)}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            fylgd.lokid
              ? "bg-emerald-600 text-white active:bg-emerald-700"
              : "bg-slate-100 text-slate-600 active:bg-slate-200"
          }`}
        >
          {fylgd.lokid ? "Lokið ✓ (birt öllum)" : "Lokið"}
        </button>
      </div>
    </div>
  );
}

function FlugvalGluggi({ onVelja, onLoka }: { onVelja: (f: Flug) => void; onLoka: () => void }) {
  const { svar, nuMs } = useFids();
  const [leit, setLeit] = useState("");
  const [tegundSia, setTegundSia] = useState<"allt" | "arrival" | "departure">("allt");

  const flug = useMemo(() => {
    if (!svar) return [];
    const q = leit.trim().toLowerCase();
    return svar.flug
      .filter((f) => tegundSia === "allt" || f.tegund === tegundSia)
      .filter((f) => !q || f.flugnumer.toLowerCase().includes(q) || f.borg.toLowerCase().includes(q))
      .sort((a, b) => flugTs(a, nuMs) - flugTs(b, nuMs))
      .slice(0, 50);
  }, [svar, nuMs, leit, tegundSia]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onLoka}>
      <div
        className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-t-2xl bg-white p-3 pb-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-slate-200" />
        <input
          autoFocus
          value={leit}
          onChange={(e) => setLeit(e.target.value)}
          placeholder="Leita eftir flugnúmeri eða áfangastað…"
          className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <div className="mb-2 flex gap-1.5">
          <SiaHnappur virkur={tegundSia === "allt"} onClick={() => setTegundSia("allt")} label="Allt" />
          <SiaHnappur virkur={tegundSia === "arrival"} onClick={() => setTegundSia("arrival")} label="Komur" />
          <SiaHnappur virkur={tegundSia === "departure"} onClick={() => setTegundSia("departure")} label="Brottfarir" />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {!svar ? (
            <p className="py-10 text-center text-slate-400">Sæki flug…</p>
          ) : flug.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Engin flug fundust.</p>
          ) : (
            flug.map((f) => (
              <li key={f.id}>
                <button
                  onClick={() => onVelja(f)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm active:bg-slate-50"
                >
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      f.tegund === "arrival" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {f.tegund === "arrival" ? "Koma" : "Brottför"}
                  </span>
                  <span className="flex-1 truncate">
                    <span className="font-semibold text-slate-800">{f.flugnumer}</span>{" "}
                    <span className="text-slate-500">· {f.borg}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{f.raun || f.aaetlad}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function SiaHnappur({ virkur, onClick, label }: { virkur: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
        virkur ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </button>
  );
}
