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
  mergaVerkefni,
} from "@/lib/data/verkefni";
import { VAKT, erVaktstjori } from "@/lib/data/starfsfolk";

export default function VerkefniPage() {
  const { state } = useEftirlit();
  const [vakt, setVakt] = useState<VerkefniVakt>(vaktFyrirKlst());
  const [opid, setOpid] = useState<string | null>(null);
  const [breytaId, setBreytaId] = useState<string | null>(null);

  const ég = VAKT.starfsfolk.find((s) => s.id === state.notandi);
  const stjori = erVaktstjori(ég?.nafn);

  const verkefniListi = useMemo(
    () => mergaVerkefni(state.verkefniYfirskrift),
    [state.verkefniYfirskrift]
  );

  // Djúptengill frá heim (#verkefniId).
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    const v = [
      ...verkefniFyrirVakt("dagur", verkefniListi),
      ...verkefniFyrirVakt("nott", verkefniListi),
    ].find((x) => x.id === id);
    if (v) {
      setVakt(v.vakt);
      setOpid(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listi = useMemo(
    () => verkefniFyrirVakt(vakt, verkefniListi),
    [vakt, verkefniListi]
  );

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
            stjori={stjori}
            ibreytingu={breytaId === v.id}
            onBreyta={() => setBreytaId(breytaId === v.id ? null : v.id)}
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
  stjori,
  ibreytingu,
  onBreyta,
}: {
  verkefni: Verkefni;
  opid: boolean;
  onToggle: () => void;
  stjori: boolean;
  ibreytingu: boolean;
  onBreyta: () => void;
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
          {stjori && (
            <button
              onClick={onBreyta}
              className="mb-3 text-xs font-semibold text-brand underline"
            >
              {ibreytingu ? "Loka breytingum" : "✏️ Breyta verkefni"}
            </button>
          )}

          {ibreytingu ? (
            <VerkefniEditForm verkefni={verkefni} onLokid={onBreyta} />
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </li>
  );
}

function VerkefniEditForm({
  verkefni,
  onLokid,
}: {
  verkefni: Verkefni;
  onLokid: () => void;
}) {
  const { setVerkefniYfirskrift } = useEftirlit();
  const [titill, setTitill] = useState(verkefni.titill);
  const [timi, setTimi] = useState(verkefni.timi);
  const [samantekt, setSamantekt] = useState(verkefni.samantekt);
  const [lysing, setLysing] = useState(verkefni.lysing);
  const [threpTexti, setThrepTexti] = useState(verkefni.threp.map((t) => t.text).join("\n"));

  const vista = () => {
    const threp = threpTexti
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text, i) => ({ id: `${verkefni.id}-${i}`, text }));
    setVerkefniYfirskrift(verkefni.id, { titill, timi, samantekt, lysing, threp });
    onLokid();
  };

  return (
    <div className="space-y-3">
      <Innslattur label="Titill" value={titill} onChange={setTitill} />
      <Innslattur label="Tími (HH:MM)" value={timi} onChange={setTimi} />
      <Innslattur label="Samantekt" value={samantekt} onChange={setSamantekt} />
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Lýsing</label>
        <textarea
          value={lysing}
          onChange={(e) => setLysing(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Þrep (eitt á línu)
        </label>
        <textarea
          value={threpTexti}
          onChange={(e) => setThrepTexti(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <button
        onClick={vista}
        className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white active:bg-brand-dark"
      >
        Vista breytingar
      </button>
    </div>
  );
}

function Innslattur({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
    </div>
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
