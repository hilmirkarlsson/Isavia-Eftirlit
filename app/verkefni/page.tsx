"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useEftirlit } from "@/lib/store";
import { Verkefni, verkefniFyrirKlst } from "@/lib/data/verkefni";

function tvistafa(n: number): string {
  return n.toString().padStart(2, "0");
}

const FORGANGUR_STILL: Record<Verkefni["forgangur"], string> = {
  hár: "bg-red-100 text-red-700",
  midlungs: "bg-amber-100 text-amber-700",
  lagur: "bg-slate-100 text-slate-600",
};

const FORGANGUR_TEXTI: Record<Verkefni["forgangur"], string> = {
  hár: "Hár forgangur",
  midlungs: "Miðlungs",
  lagur: "Lágur",
};

export default function VerkefniPage() {
  const nuKlst = new Date().getHours();
  const [klst, setKlst] = useState(nuKlst);
  const [opid, setOpid] = useState<string | null>(null);

  const verkefni = useMemo(() => verkefniFyrirKlst(klst), [klst]);

  return (
    <div>
      <PageHeader
        titill="Verkefni"
        undirtitill="Eftirlit – verkefni vaktarinnar eftir klukkustund"
      />

      <KlstVelari klst={klst} setKlst={setKlst} nuKlst={nuKlst} />

      <div className="space-y-3 p-4">
        {verkefni.length === 0 && (
          <p className="rounded-lg bg-white p-6 text-center text-slate-500 shadow-sm">
            Engin skráð verkefni á þessari klukkustund.
          </p>
        )}
        {verkefni.map((v) => (
          <VerkefniKort
            key={v.id}
            verkefni={v}
            opid={opid === v.id}
            onToggle={() => setOpid(opid === v.id ? null : v.id)}
          />
        ))}
      </div>
    </div>
  );
}

function KlstVelari({
  klst,
  setKlst,
  nuKlst,
}: {
  klst: number;
  setKlst: (n: number) => void;
  nuKlst: number;
}) {
  return (
    <div className="sticky top-[57px] z-10 border-b border-slate-200 bg-white px-2 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setKlst((klst + 23) % 24)}
          className="rounded-lg bg-slate-100 px-3 py-2 text-lg font-bold text-slate-700 active:bg-slate-200"
          aria-label="Fyrri klukkustund"
        >
          ‹
        </button>

        <div className="flex flex-1 items-center justify-center gap-2">
          <span className="text-2xl font-bold tabular-nums text-brand">
            {tvistafa(klst)}:00
          </span>
          {klst === nuKlst && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              Núna
            </span>
          )}
          {klst !== nuKlst && (
            <button
              onClick={() => setKlst(nuKlst)}
              className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand active:bg-brand/20"
            >
              Fara á núna
            </button>
          )}
        </div>

        <button
          onClick={() => setKlst((klst + 1) % 24)}
          className="rounded-lg bg-slate-100 px-3 py-2 text-lg font-bold text-slate-700 active:bg-slate-200"
          aria-label="Næsta klukkustund"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function VerkefniKort({
  verkefni,
  opid,
  onToggle,
}: {
  verkefni: Verkefni;
  opid: boolean;
  onToggle: () => void;
}) {
  const { state, setThrep, hreinsaThrep, hladid } = useEftirlit();
  const haka = state.threp[verkefni.id] ?? {};
  const buid = verkefni.threp.filter((t) => haka[t.id]).length;
  const allt = verkefni.threp.length;
  const klarad = buid === allt && allt > 0;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${
        klarad ? "border-green-300" : "border-slate-200"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-50"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${FORGANGUR_STILL[verkefni.forgangur]}`}
            >
              {FORGANGUR_TEXTI[verkefni.forgangur]}
            </span>
            {klarad && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                ✓ Lokið
              </span>
            )}
          </div>
          <h2 className="mt-1 font-semibold text-slate-900">{verkefni.titill}</h2>
          <p className="text-sm text-slate-500">{verkefni.samantekt}</p>
        </div>
        <div className="flex flex-col items-center">
          <ProgressHringur buid={hladid ? buid : 0} allt={allt} />
          <span
            className={`mt-1 text-slate-400 transition-transform ${opid ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </div>
      </button>

      {opid && (
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="mb-3 text-sm leading-relaxed text-slate-600">
            {verkefni.lysing}
          </p>

          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Þrep ({hladid ? buid : 0}/{allt})
          </h3>
          <ul className="space-y-1">
            {verkefni.threp.map((t) => {
              const checked = !!haka[t.id];
              return (
                <li key={t.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 active:bg-slate-50">
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

          {buid > 0 && (
            <button
              onClick={() => hreinsaThrep(verkefni.id)}
              className="mt-3 text-xs font-medium text-slate-400 underline active:text-slate-600"
            >
              Núllstilla þrep
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressHringur({ buid, allt }: { buid: number; allt: number }) {
  const hlutfall = allt === 0 ? 0 : buid / allt;
  const r = 14;
  const c = 2 * Math.PI * r;
  const klarad = buid === allt && allt > 0;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke={klarad ? "#16a34a" : "#005595"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - hlutfall)}
        transform="rotate(-90 18 18)"
      />
      <text
        x="18"
        y="18"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-slate-600 text-[9px] font-bold"
      >
        {buid}/{allt}
      </text>
    </svg>
  );
}
