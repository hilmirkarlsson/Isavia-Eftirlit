"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { FidsSvar, Flug, FlugTegund } from "@/lib/fids";

export default function FlugPage() {
  const [svar, setSvar] = useState<FidsSvar | null>(null);
  const [villa, setVilla] = useState<string | null>(null);
  const [hledur, setHledur] = useState(true);
  const [tegund, setTegund] = useState<FlugTegund>("departure");
  const [leit, setLeit] = useState("");

  const saekja = useCallback(async () => {
    try {
      setVilla(null);
      const res = await fetch("/api/fids", { cache: "no-store" });
      if (!res.ok) throw new Error(`Villa ${res.status}`);
      const data = (await res.json()) as FidsSvar;
      setSvar(data);
    } catch (e) {
      setVilla(e instanceof Error ? e.message : "Óþekkt villa");
    } finally {
      setHledur(false);
    }
  }, []);

  useEffect(() => {
    saekja();
    const t = setInterval(saekja, 60_000); // uppfæra á mínútu fresti
    return () => clearInterval(t);
  }, [saekja]);

  const flug = useMemo(() => {
    if (!svar) return [];
    const q = leit.trim().toLowerCase();
    return svar.flug
      .filter((f) => f.tegund === tegund)
      .filter(
        (f) =>
          !q ||
          f.flugnumer.toLowerCase().includes(q) ||
          f.borg.toLowerCase().includes(q) ||
          f.flugfelag.toLowerCase().includes(q)
      )
      .sort((a, b) => a.aaetlad.localeCompare(b.aaetlad));
  }, [svar, tegund, leit]);

  return (
    <div>
      <PageHeader
        titill="Flug (FIDS)"
        undirtitill="Flugupplýsingar Keflavíkurflugvallar"
        hægri={
          <button
            onClick={() => {
              setHledur(true);
              saekja();
            }}
            className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium active:bg-white/30"
          >
            ↻ Uppfæra
          </button>
        }
      />

      {/* Flipar: komur / brottfarir */}
      <div className="sticky top-[57px] z-10 border-b border-slate-200 bg-white">
        <div className="flex">
          <FlipiHnappur
            virkur={tegund === "departure"}
            onClick={() => setTegund("departure")}
            label="Brottfarir"
          />
          <FlipiHnappur
            virkur={tegund === "arrival"}
            onClick={() => setTegund("arrival")}
            label="Komur"
          />
        </div>
        <div className="px-3 pb-2">
          <input
            value={leit}
            onChange={(e) => setLeit(e.target.value)}
            placeholder="Leita að flugnúmeri, borg eða flugfélagi…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div className="p-4">
        {svar?.heimild === "synidaemi" && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            ⚠️ Sýnigögn birt – ekki náðist í rauntímagögn frá kefairport.is.
            Þegar forritið keyrir með netaðgang að vellinum birtast rauntímaflug
            sjálfkrafa.
          </div>
        )}
        {villa && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            Ekki tókst að sækja flug: {villa}
          </div>
        )}

        {hledur && !svar ? (
          <p className="py-10 text-center text-slate-400">Sæki flug…</p>
        ) : flug.length === 0 ? (
          <p className="py-10 text-center text-slate-400">Engin flug fundust.</p>
        ) : (
          <ul className="space-y-2">
            {flug.map((f) => (
              <FlugKort key={f.id + f.flugnumer} flug={f} />
            ))}
          </ul>
        )}

        {svar && (
          <p className="mt-4 text-center text-[11px] text-slate-400">
            {svar.heimild === "live" ? "Rauntímagögn" : "Sýnigögn"} · uppfært{" "}
            {new Date(svar.uppfaert).toLocaleTimeString("is-IS", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
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
      className={`flex-1 border-b-2 py-3 text-sm font-semibold transition-colors ${
        virkur
          ? "border-brand text-brand"
          : "border-transparent text-slate-400 hover:text-slate-600"
      }`}
    >
      {label}
    </button>
  );
}

function FlugKort({ flug }: { flug: Flug }) {
  const koma = flug.tegund === "arrival";
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex w-16 shrink-0 flex-col items-center">
          <span className="text-xl font-bold tabular-nums text-slate-900">
            {flug.aaetlad || "—"}
          </span>
          {flug.raun && flug.raun !== flug.aaetlad && (
            <span className="text-xs font-medium text-amber-600">{flug.raun}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-brand">{flug.flugnumer}</span>
            {flug.schengen && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  flug.schengen === "S"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-violet-100 text-violet-700"
                }`}
                title={flug.schengen === "S" ? "Schengen" : "Non-Schengen"}
              >
                {flug.schengen === "S" ? "Schengen" : "Non-S"}
              </span>
            )}
          </div>
          <p className="truncate font-medium text-slate-800">{flug.borg}</p>
          {flug.flugfelag && (
            <p className="truncate text-xs text-slate-400">{flug.flugfelag}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
          {flug.stada && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              {flug.stada}
            </span>
          )}
          <div className="flex gap-2 text-slate-500">
            {flug.hlid && (
              <span>
                Hlið <b className="text-slate-700">{flug.hlid}</b>
              </span>
            )}
            {koma && flug.faeriband && (
              <span>
                Band <b className="text-slate-700">{flug.faeriband}</b>
              </span>
            )}
            {flug.staedi && (
              <span>
                Stæði <b className="text-slate-700">{flug.staedi}</b>
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
