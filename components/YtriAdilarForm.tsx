"use client";

import { useState } from "react";
import { useEftirlit } from "@/lib/store";

// Ytri aðilar eyðublað – sniðið eftir upprunalega forritinu.
// Tveir flipar: Skráning og Uppfletting leyfa.

type Lina = { id: string; texti: string };
type Hluti = { fyrirsogn: string; linur: Lina[] };

const SKRANING: Hluti[] = [
  {
    fyrirsogn: "Heimild flugverndarstarfsmanna ytri aðila:",
    linur: [
      { id: "adgangsheimild", texti: "Aðgangsheimild í grænum lit" },
      { id: "skjarettindi", texti: "Skjáréttindi þess sem vinnur við gegnumlýsingu" },
    ],
  },
  {
    fyrirsogn: "Skráning einstaklinga sem fara í gegnum skimun:",
    linur: [
      { id: "haldid-skraningar", texti: "Haldið utan um skráningar" },
      { id: "hlutfall-handleit", texti: "Hlutfall handleitar/quote í lagi" },
    ],
  },
  {
    fyrirsogn: "Prófanir á gegnumlýsingarvélum og málmleitartækjum:",
    linur: [
      { id: "haldid-profanir", texti: "Haldið utan um prófanir" },
      { id: "profun-gegnumlysing", texti: "Prófun gegnumlýsingarvélar ásættanleg" },
      { id: "profun-malmleit", texti: "Prófun málmleitartækja ásættanleg" },
    ],
  },
];

export default function YtriAdilarForm({ verkefniId }: { verkefniId: string }) {
  const { state, setYtriAdilarReitur, setYtriAdilarAthugasemd } = useEftirlit();
  const [flipi, setFlipi] = useState<"skraning" | "uppfletting">("skraning");
  const [synaAths, setSynaAths] = useState(false);
  const [vistad, setVistad] = useState(false);

  const gogn = state.ytriAdilar[verkefniId] ?? { reitir: {}, athugasemd: "" };

  const settGildi = (linaId: string, gildi: "ja" | "nei") => {
    // Eins og útvarpshnappar: velja annað slekkur á hinu.
    setYtriAdilarReitur(verkefniId, `${linaId}.ja`, gildi === "ja");
    setYtriAdilarReitur(verkefniId, `${linaId}.nei`, gildi === "nei");
    setVistad(false);
  };

  return (
    <div>
      {/* Undirflipar */}
      <div className="mb-3 flex rounded-lg bg-slate-100 p-1">
        <FlipiHnappur
          virkur={flipi === "skraning"}
          onClick={() => setFlipi("skraning")}
          label="Skráning"
        />
        <FlipiHnappur
          virkur={flipi === "uppfletting"}
          onClick={() => setFlipi("uppfletting")}
          label="Uppfletting leyfa"
        />
      </div>

      {flipi === "skraning" ? (
        <div className="space-y-4">
          {SKRANING.map((hluti) => (
            <div key={hluti.fyrirsogn}>
              <p className="mb-1.5 text-center text-xs font-medium text-slate-500">
                {hluti.fyrirsogn}
              </p>
              <div className="space-y-1.5">
                {hluti.linur.map((lina) => {
                  const ja = !!gogn.reitir[`${lina.id}.ja`];
                  const nei = !!gogn.reitir[`${lina.id}.nei`];
                  return (
                    <div
                      key={lina.id}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <span className="flex-1 text-sm text-slate-700">{lina.texti}</span>
                      <JaNei
                        gildi={ja ? "ja" : nei ? "nei" : null}
                        onSet={(g) => settGildi(lina.id, g)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {synaAths && (
            <textarea
              value={gogn.athugasemd}
              onChange={(e) => {
                setYtriAdilarAthugasemd(verkefniId, e.target.value);
                setVistad(false);
              }}
              placeholder="Athugasemd…"
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setSynaAths((v) => !v)}
              className="flex-1 rounded-lg bg-brand/10 px-4 py-3 text-sm font-semibold text-brand active:bg-brand/20"
            >
              + Athugasemd
            </button>
            <button
              onClick={() => setVistad(true)}
              className="flex-1 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white active:bg-brand-dark"
            >
              {vistad ? "✓ Vistað" : "Vista & skila inn"}
            </button>
          </div>
        </div>
      ) : (
        <UpplettingLeyfa />
      )}
    </div>
  );
}

function JaNei({
  gildi,
  onSet,
}: {
  gildi: "ja" | "nei" | null;
  onSet: (g: "ja" | "nei") => void;
}) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onSet("ja")}
        className={`h-8 w-12 rounded-md border text-xs font-bold ${
          gildi === "ja"
            ? "border-green-500 bg-green-500 text-white"
            : "border-slate-300 bg-white text-slate-400"
        }`}
      >
        Já
      </button>
      <button
        onClick={() => onSet("nei")}
        className={`h-8 w-12 rounded-md border text-xs font-bold ${
          gildi === "nei"
            ? "border-red-500 bg-red-500 text-white"
            : "border-slate-300 bg-white text-slate-400"
        }`}
      >
        Nei
      </button>
    </div>
  );
}

function UpplettingLeyfa() {
  const [leit, setLeit] = useState("");
  return (
    <div className="space-y-3">
      <input
        value={leit}
        onChange={(e) => setLeit(e.target.value)}
        placeholder="Leita að nafni, kennitölu eða skírteinisnúmeri…"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
        Uppfletting leyfa tengist leyfakerfinu síðar. Sláðu inn auðkenni til að
        fletta upp gildi flugverndarskírteinis.
      </div>
    </div>
  );
}

function FlipiHnappur({
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
      className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
        virkur ? "bg-white text-brand shadow-sm" : "text-slate-500"
      }`}
    >
      {label}
    </button>
  );
}
