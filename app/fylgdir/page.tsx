"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useEftirlit } from "@/lib/store";
import { VAKT } from "@/lib/data/starfsfolk";
import { FylgdEntry } from "@/lib/data/fylgdir";

export default function FylgdirPage() {
  const { state, addFylgdFlokkur, addFylgdEntry, setFylgdEntryStarfsmadur, setFylgdEntryAthugasemd, fjarlaegjaFylgdEntry } =
    useEftirlit();
  const [nyrFlokkur, setNyrFlokkur] = useState("");

  return (
    <div>
      <PageHeader titill="Fylgdir" undirtitill="Hver fylgir hverju verkefni" />

      <div className="space-y-4 p-4">
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Upplýsingar</h2>
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

        {state.fylgdFlokkar.map((flokkur) => {
          const entries = state.fylgdEntries.filter((e) => e.flokkurId === flokkur.id);
          return (
            <section key={flokkur.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-800">{flokkur.nafn}</h2>
                <button
                  onClick={() => addFylgdEntry(flokkur.id)}
                  className="rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand active:bg-brand/20"
                >
                  + Bæta við
                </button>
              </div>

              {entries.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400">Engin úthlutun skráð.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {entries.map((entry) => (
                    <FylgdLina
                      key={entry.id}
                      entry={entry}
                      onStarfsmadur={(id) => setFylgdEntryStarfsmadur(entry.id, id)}
                      onAthugasemd={(t) => setFylgdEntryAthugasemd(entry.id, t)}
                      onFjarlaegja={() => fjarlaegjaFylgdEntry(entry.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function FylgdLina({
  entry,
  onStarfsmadur,
  onAthugasemd,
  onFjarlaegja,
}: {
  entry: FylgdEntry;
  onStarfsmadur: (id: string | null) => void;
  onAthugasemd: (texti: string) => void;
  onFjarlaegja: () => void;
}) {
  return (
    <li className="flex items-center gap-2 px-4 py-2.5">
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
      <button onClick={onFjarlaegja} className="shrink-0 px-1 text-slate-400 active:text-red-500">
        ✕
      </button>
    </li>
  );
}
