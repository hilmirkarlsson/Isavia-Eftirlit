"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useEftirlit } from "@/lib/store";
import { useFids } from "@/lib/fidsStore";
import { VAKT, erVaktstjori } from "@/lib/data/starfsfolk";
import { FylgdEntry } from "@/lib/data/fylgdir";
import { Flug, flugTs } from "@/lib/fids";

export default function FylgdirPage() {
  const {
    state,
    addFylgdFlokkur,
    addFylgdEntry,
    setFylgdEntryFlokkur,
    setFylgdEntryStarfsmadur,
    setFylgdEntryAthugasemd,
    setFylgdEntryTimi,
    setFylgdEntryFlug,
    fjarlaegjaFylgdEntry,
  } = useEftirlit();
  const [nyrFlokkur, setNyrFlokkur] = useState("");
  const [flugvalEntryId, setFlugvalEntryId] = useState<string | null>(null);

  const ég = VAKT.starfsfolk.find((s) => s.id === state.notandi);
  const stjori = erVaktstjori(ég?.nafn);

  const flokkurNafn = (id: string) => state.fylgdFlokkar.find((f) => f.id === id)?.nafn ?? id;

  return (
    <div>
      <PageHeader titill="Fylgdir" undirtitill="Hver fylgir hverju verkefni" />

      <div className="space-y-4 p-4">
        {stjori && (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Nýr flokkur</h2>
            <div className="flex gap-2">
              <input
                value={nyrFlokkur}
                onChange={(e) => setNyrFlokkur(e.target.value)}
                placeholder="t.d. VIP, Sérstök farþegar..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                onClick={() => {
                  if (!nyrFlokkur.trim()) return;
                  addFylgdFlokkur(nyrFlokkur.trim());
                  setNyrFlokkur("");
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

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Fylgdir</h2>
            {stjori && (
              <button
                onClick={() => addFylgdEntry(state.fylgdFlokkar[0]?.id ?? "")}
                className="rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand active:bg-brand/20"
              >
                + Bæta við fylgd
              </button>
            )}
          </div>

          {state.fylgdEntries.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">Engin úthlutun skráð.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {state.fylgdEntries.map((entry) => (
                <FylgdLina
                  key={entry.id}
                  entry={entry}
                  flokkar={state.fylgdFlokkar}
                  flokkurNafn={flokkurNafn(entry.flokkurId)}
                  ritstjornanlegt={stjori}
                  onFlokkur={(id) => setFylgdEntryFlokkur(entry.id, id)}
                  onStarfsmadur={(id) => setFylgdEntryStarfsmadur(entry.id, id)}
                  onAthugasemd={(t) => setFylgdEntryAthugasemd(entry.id, t)}
                  onTimi={(t) => setFylgdEntryTimi(entry.id, t)}
                  onTengjaFlug={() => setFlugvalEntryId(entry.id)}
                  onAftengjaFlug={() => setFylgdEntryFlug(entry.id, null, null)}
                  onFjarlaegja={() => fjarlaegjaFylgdEntry(entry.id)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {flugvalEntryId && (
        <FlugvalGluggi
          onVelja={(f) => {
            setFylgdEntryFlug(flugvalEntryId, f.id, f.flugnumer);
            setFylgdEntryTimi(flugvalEntryId, (f.raun || f.aaetlad || "").slice(0, 5));
            setFlugvalEntryId(null);
          }}
          onLoka={() => setFlugvalEntryId(null)}
        />
      )}
    </div>
  );
}

function FylgdLina({
  entry,
  flokkar,
  flokkurNafn,
  ritstjornanlegt,
  onFlokkur,
  onStarfsmadur,
  onAthugasemd,
  onTimi,
  onTengjaFlug,
  onAftengjaFlug,
  onFjarlaegja,
}: {
  entry: FylgdEntry;
  flokkar: { id: string; nafn: string }[];
  flokkurNafn: string;
  ritstjornanlegt: boolean;
  onFlokkur: (id: string) => void;
  onStarfsmadur: (id: string | null) => void;
  onAthugasemd: (texti: string) => void;
  onTimi: (timi: string) => void;
  onTengjaFlug: () => void;
  onAftengjaFlug: () => void;
  onFjarlaegja: () => void;
}) {
  const starfsmadur = VAKT.starfsfolk.find((s) => s.id === entry.starfsmadurId);

  if (!ritstjornanlegt) {
    return (
      <li className="flex items-center gap-2 px-4 py-2.5 text-sm">
        <span className="w-12 shrink-0 font-mono text-xs text-slate-500">{entry.timi || "—"}</span>
        <span className="shrink-0 rounded bg-brand/10 px-1.5 py-0.5 text-xs font-semibold text-brand">
          {flokkurNafn}
        </span>
        <span className="flex-1 font-medium text-slate-700">{starfsmadur?.nafn ?? "Óúthlutað"}</span>
        {entry.flugnumer && (
          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
            ✈ {entry.flugnumer}
          </span>
        )}
        {entry.athugasemd && <span className="shrink-0 text-xs text-slate-400">{entry.athugasemd}</span>}
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-2 px-4 py-2.5">
      <input
        type="time"
        value={entry.timi}
        onChange={(e) => onTimi(e.target.value)}
        className="w-24 rounded-lg border border-slate-200 px-2 py-2 text-sm"
      />
      <select
        value={entry.flokkurId}
        onChange={(e) => onFlokkur(e.target.value)}
        className="w-28 rounded-lg border border-slate-200 px-2 py-2 text-sm"
      >
        {flokkar.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nafn}
          </option>
        ))}
      </select>
      <select
        value={entry.starfsmadurId ?? ""}
        onChange={(e) => onStarfsmadur(e.target.value || null)}
        className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm"
      >
        <option value="">Velja póst…</option>
        {VAKT.starfsfolk.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nafn}
          </option>
        ))}
      </select>
      <input
        value={entry.athugasemd}
        onChange={(e) => onAthugasemd(e.target.value)}
        placeholder="Athugasemd"
        className="w-28 rounded-lg border border-slate-200 px-2 py-2 text-sm"
      />
      {entry.flugnumer ? (
        <button
          onClick={onAftengjaFlug}
          className="shrink-0 rounded-lg bg-brand/10 px-2 py-2 text-xs font-semibold text-brand active:bg-brand/20"
        >
          ✈ {entry.flugnumer} ✕
        </button>
      ) : (
        <button
          onClick={onTengjaFlug}
          className="shrink-0 rounded-lg border border-dashed border-slate-300 px-2 py-2 text-xs font-semibold text-slate-500 active:bg-slate-50"
        >
          + Tengja flug
        </button>
      )}
      <button onClick={onFjarlaegja} className="shrink-0 px-1 text-slate-400 active:text-red-500">
        ✕
      </button>
    </li>
  );
}

function FlugvalGluggi({ onVelja, onLoka }: { onVelja: (f: Flug) => void; onLoka: () => void }) {
  const { svar, nuMs } = useFids();
  const [leit, setLeit] = useState("");

  const flug = useMemo(() => {
    if (!svar) return [];
    const q = leit.trim().toLowerCase();
    return svar.flug
      .filter((f) => !q || f.flugnumer.toLowerCase().includes(q) || f.borg.toLowerCase().includes(q))
      .sort((a, b) => flugTs(a, nuMs) - flugTs(b, nuMs))
      .slice(0, 50);
  }, [svar, nuMs, leit]);

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
