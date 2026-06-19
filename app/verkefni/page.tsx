"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import YtriAdilarForm from "@/components/YtriAdilarForm";
import { useEftirlit, VerkefniStada } from "@/lib/store";
import {
  Verkefni,
  VerkefniVakt,
  vaktFyrirKlst,
  verkefniFyrirVakt,
} from "@/lib/data/verkefni";

export default function VerkefniPage() {
  const [vakt, setVakt] = useState<VerkefniVakt>(vaktFyrirKlst());
  const [opid, setOpid] = useState<string | null>(null);

  // Djúptengill frá heim (#verkefniId).
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    const v = [...verkefniFyrirVakt("dagur"), ...verkefniFyrirVakt("nott")].find(
      (x) => x.id === id
    );
    if (v) {
      setVakt(v.vakt);
      setOpid(id);
    }
  }, []);

  const listi = useMemo(() => verkefniFyrirVakt(vakt), [vakt]);

  return (
    <div>
      <PageHeader titill="Verkefni" undirtitill="Verkefni vaktarinnar" />

      {/* Dagur / nótt */}
      <div className="sticky top-[57px] z-10 border-b border-slate-200 bg-white p-2">
        <div className="flex rounded-xl bg-slate-100 p-1">
          <VaktHnappur
            virkur={vakt === "dagur"}
            onClick={() => setVakt("dagur")}
            label="Dagvakt"
            tákn="☀️"
          />
          <VaktHnappur
            virkur={vakt === "nott"}
            onClick={() => setVakt("nott")}
            label="Næturvakt"
            tákn="🌙"
          />
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {listi.map((v) => (
          <VerkefniLina
            key={v.id}
            verkefni={v}
            opid={opid === v.id}
            onToggle={() => setOpid(opid === v.id ? null : v.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function VaktHnappur({
  virkur,
  onClick,
  label,
  tákn,
}: {
  virkur: boolean;
  onClick: () => void;
  label: string;
  tákn: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
        virkur ? "bg-brand text-white shadow-sm" : "text-slate-500"
      }`}
    >
      <span>{tákn}</span>
      {label}
    </button>
  );
}

function VerkefniLina({
  verkefni,
  opid,
  onToggle,
}: {
  verkefni: Verkefni;
  opid: boolean;
  onToggle: () => void;
}) {
  const { state, setThrep, setVerkefniStada, hladid } = useEftirlit();
  const stada: VerkefniStada = state.verkefniStada[verkefni.id] ?? "ekki-byrjad";
  const haka = state.threp[verkefni.id] ?? {};
  const buin = verkefni.threp.filter((t) => haka[t.id]).length;

  const lokid = hladid && stada === "lokid";
  const iGangi = hladid && stada === "i-gangi";

  return (
    <li id={verkefni.id} className="scroll-mt-32 bg-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onToggle} className="flex flex-1 items-center gap-3 text-left">
          <span className="w-12 shrink-0 text-sm font-bold tabular-nums text-slate-700">
            {verkefni.timi}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={`font-semibold ${lokid ? "text-slate-400 line-through" : "text-slate-900"}`}
            >
              {verkefni.titill}
            </p>
            <p className="truncate text-xs text-slate-400">{verkefni.samantekt}</p>
          </div>
        </button>

        {/* Staðuhnappur (Start / Finish / lokið) */}
        {!hladid ? null : lokid ? (
          <CheckHringur />
        ) : iGangi ? (
          <button
            onClick={() => setVerkefniStada(verkefni.id, "lokid")}
            className="shrink-0 rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-sky-900 active:bg-sky-300"
          >
            Finish
          </button>
        ) : (
          <button
            onClick={() => {
              setVerkefniStada(verkefni.id, "i-gangi");
              if (!opid) onToggle();
            }}
            className="shrink-0 rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white active:bg-brand-dark"
          >
            Start
          </button>
        )}
      </div>

      {opid && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
          <p className="mb-3 text-sm leading-relaxed text-slate-600">{verkefni.lysing}</p>

          {verkefni.eydublad === "ytri-adilar" ? (
            <YtriAdilarForm verkefniId={verkefni.id} />
          ) : (
            <>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Þrep ({buin}/{verkefni.threp.length})
              </h3>
              <ul className="space-y-1">
                {verkefni.threp.map((t) => {
                  const checked = !!haka[t.id];
                  return (
                    <li key={t.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 active:bg-white">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setThrep(verkefni.id, t.id, e.target.checked)}
                          className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-brand focus:ring-brand"
                        />
                        <span
                          className={`text-sm ${checked ? "text-slate-400 line-through" : "text-slate-700"}`}
                        >
                          {t.text}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {stada !== "ekki-byrjad" && (
            <button
              onClick={() => setVerkefniStada(verkefni.id, "ekki-byrjad")}
              className="mt-3 text-xs font-medium text-slate-400 underline active:text-slate-600"
            >
              Núllstilla stöðu verkefnis
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function CheckHringur() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3}>
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
