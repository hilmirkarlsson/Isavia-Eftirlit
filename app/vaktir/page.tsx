"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useEftirlit } from "@/lib/store";
import { VAKT, erVaktstjori } from "@/lib/data/starfsfolk";
import { VaktSkraning, allirStarfsmenn } from "@/lib/data/vaktir";

export default function VaktirPage() {
  const {
    state,
    hladid,
    addVakt,
    setVaktNafn,
    fjarlaegjaVakt,
    addVaktMedlimur,
    fjarlaegjaVaktMedlimur,
    seedVaktir,
  } = useEftirlit();
  const [nyVakt, setNyVakt] = useState("");

  const ég = allirStarfsmenn(state.vaktir).find((s) => s.id === state.notandi);
  const stjori = erVaktstjori(ég?.nafn);

  // Sjálfgefið sæði: núverandi starfsfólk forritsins er E-vaktin.
  const eVaktSeed = useMemo<VaktSkraning>(
    () => ({
      id: "vakt-e",
      nafn: "E",
      medlimir: VAKT.starfsfolk
        .filter((s) => !s.utkall)
        .map((s) => ({ id: `m-${s.id}`, nafn: s.nafn })),
    }),
    []
  );

  useEffect(() => {
    if (hladid && state.vaktir.length === 0) seedVaktir([eVaktSeed]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hladid, state.vaktir.length]);

  if (!stjori) {
    return (
      <div>
        <PageHeader titill="Vaktir" undirtitill="Aðeins fyrir vaktstjóra" />
        <p className="p-6 text-center text-sm text-slate-500">
          Aðeins vaktstjóri og aðstoðarvaktstjóri hafa aðgang að vaktayfirliti.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader titill="Vaktir" undirtitill="Hverjir eru á hverri vakt" />

      <div className="space-y-4 p-4">
        {state.vaktir.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
            Engin vakt skráð enn.
          </p>
        ) : (
          state.vaktir.map((vakt) => (
            <VaktKort
              key={vakt.id}
              vakt={vakt}
              onNafn={(nafn) => setVaktNafn(vakt.id, nafn)}
              onBaeta={(nafn) => addVaktMedlimur(vakt.id, nafn)}
              onFjarlaegjaMedlim={(id) => fjarlaegjaVaktMedlimur(vakt.id, id)}
              onFjarlaegja={() => fjarlaegjaVakt(vakt.id)}
            />
          ))
        )}

        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Bæta við vakt</h2>
          <div className="flex gap-2">
            <input
              value={nyVakt}
              onChange={(e) => setNyVakt(e.target.value)}
              placeholder="Heiti vaktar, t.d. B"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                if (!nyVakt.trim()) return;
                addVakt(nyVakt.trim());
                setNyVakt("");
              }}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white active:bg-brand-dark"
            >
              Bæta við
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function VaktKort({
  vakt,
  onNafn,
  onBaeta,
  onFjarlaegjaMedlim,
  onFjarlaegja,
}: {
  vakt: VaktSkraning;
  onNafn: (nafn: string) => void;
  onBaeta: (nafn: string) => void;
  onFjarlaegjaMedlim: (id: string) => void;
  onFjarlaegja: () => void;
}) {
  const [nyrMedlimur, setNyrMedlimur] = useState("");
  // Auðkenni þess meðlims sem beðið er staðfestingar á að eyða (are-you-sure).
  const [stadfestaMedlim, setStadfestaMedlim] = useState<string | null>(null);
  const [stadfestaVakt, setStadfestaVakt] = useState(false);

  const baeta = () => {
    if (!nyrMedlimur.trim()) return;
    onBaeta(nyrMedlimur.trim());
    setNyrMedlimur("");
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
          {vakt.nafn || "?"}
        </span>
        <input
          value={vakt.nafn}
          onChange={(e) => onNafn(e.target.value)}
          placeholder="Heiti vaktar"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-semibold"
        />
        <span className="shrink-0 text-xs text-slate-400">{vakt.medlimir.length} manns</span>
        {stadfestaVakt ? (
          <span className="flex shrink-0 items-center gap-1 text-xs">
            <span className="text-slate-500">Eyða vakt?</span>
            <button
              onClick={onFjarlaegja}
              className="rounded bg-red-500 px-2 py-1 font-semibold text-white active:bg-red-600"
            >
              Já
            </button>
            <button
              onClick={() => setStadfestaVakt(false)}
              className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-600"
            >
              Nei
            </button>
          </span>
        ) : (
          <button
            onClick={() => setStadfestaVakt(true)}
            className="shrink-0 px-1 text-slate-400 active:text-red-500"
          >
            ✕
          </button>
        )}
      </div>

      <ul className="space-y-1">
        {vakt.medlimir.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-2 rounded-lg bg-slate-100 px-2 py-1.5 text-sm"
          >
            <span className="flex-1 truncate text-slate-700">{m.nafn}</span>
            {stadfestaMedlim === m.id ? (
              <span className="flex shrink-0 items-center gap-1 text-xs">
                <span className="text-slate-500">Eyða?</span>
                <button
                  onClick={() => {
                    onFjarlaegjaMedlim(m.id);
                    setStadfestaMedlim(null);
                  }}
                  className="rounded bg-red-500 px-2 py-1 font-semibold text-white active:bg-red-600"
                >
                  Já
                </button>
                <button
                  onClick={() => setStadfestaMedlim(null)}
                  className="rounded bg-slate-200 px-2 py-1 font-semibold text-slate-600"
                >
                  Nei
                </button>
              </span>
            ) : (
              <button
                onClick={() => setStadfestaMedlim(m.id)}
                className="shrink-0 text-slate-400 active:text-red-500"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-2 flex gap-2">
        <input
          value={nyrMedlimur}
          onChange={(e) => setNyrMedlimur(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") baeta();
          }}
          placeholder="Nafn starfsmanns…"
          className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm"
        />
        <button
          onClick={baeta}
          disabled={!nyrMedlimur.trim()}
          className="shrink-0 rounded-lg bg-brand/10 px-3 py-2 text-lg font-bold leading-none text-brand active:bg-brand/20 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
