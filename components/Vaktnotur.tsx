"use client";

import { useState } from "react";
import { useEftirlit } from "@/lib/store";
import { haptik } from "@/lib/haptics";

// Skilaboð milli vakta – einföld vaktaskýrsla milli vaktstjóra og
// aðstoðarvaktstjóra (birt aðeins þeim, sjá heim/page.tsx). Höfundur eða
// vaktstjóri getur eytt.
export default function Vaktnotur({ mittNafn, stjori }: { mittNafn: string; stjori: boolean }) {
  const { state, addVaktnota, fjarlaegjaVaktnota } = useEftirlit();
  const [texti, setTexti] = useState("");

  const senda = () => {
    if (!texti.trim()) return;
    haptik();
    addVaktnota(texti, mittNafn);
    setTexti("");
  };

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Skilaboð milli vakta
      </h2>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <textarea
          value={texti}
          onChange={(e) => setTexti(e.target.value)}
          rows={2}
          placeholder="Skrifaðu minnispunkt fyrir næstu vakt…"
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none"
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={senda}
            disabled={!texti.trim()}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white active:bg-brand-dark disabled:opacity-40"
          >
            Bæta við
          </button>
        </div>
      </div>

      {state.vaktnotur.length > 0 && (
        <ul className="mt-2 space-y-2">
          {state.vaktnotur.map((n) => {
            const maEyda = stjori || n.af === mittNafn;
            return (
              <li
                key={n.id}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <p className="whitespace-pre-wrap text-sm text-slate-800">{n.texti}</p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {n.af} ·{" "}
                    {new Date(n.kl).toLocaleString("is-IS", {
                      day: "numeric",
                      month: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {maEyda && (
                    <button
                      onClick={() => {
                        haptik();
                        fjarlaegjaVaktnota(n.id);
                      }}
                      className="font-semibold text-red-500 active:underline"
                    >
                      Eyða
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
