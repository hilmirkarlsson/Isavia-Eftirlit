"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import YtriAdilarForm from "@/components/YtriAdilarForm";
import { useEftirlit, VerkefniStada } from "@/lib/store";
import { Verkefni, VerkefniVakt, vaktFyrirKlst, verkefniFyrirVakt } from "@/lib/data/verkefni";
import { erVaktstjori } from "@/lib/data/starfsfolk";
import { allirStarfsmenn } from "@/lib/data/vaktir";
import { haptik, haptikStadfest } from "@/lib/haptics";
import { IconSun, IconMoon } from "@/components/Icons";

export default function VerkefniPage() {
  const { state } = useEftirlit();
  const [vakt, setVakt] = useState<VerkefniVakt>(vaktFyrirKlst());
  const [opid, setOpid] = useState<string | null>(null);

  const ég = allirStarfsmenn(state.vaktir).find((s) => s.id === state.notandi);
  const stjori = erVaktstjori(ég?.nafn);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            tákn={<IconSun className="h-4 w-4" />}
          />
          <VaktHnappur
            virkur={vakt === "nott"}
            onClick={() => setVakt("nott")}
            label="Næturvakt"
            tákn={<IconMoon className="h-4 w-4" />}
          />
        </div>
      </div>

      {stjori && <VerkefniYfirlit listi={listi} vakt={vakt} />}

      <ul className="space-y-2 p-4">
        {listi.map((v) => (
          <VerkefniLina
            key={v.id}
            verkefni={v}
            opid={opid === v.id}
            onToggle={() => setOpid(opid === v.id ? null : v.id)}
            stjori={stjori}
          />
        ))}
      </ul>
    </div>
  );
}

// Yfirlit fyrir vaktstjóra: hve mörgum verkefnum er lokið og hver eru komin
// fram yfir tíma án þess að vera kláruð (aðeins fyrir vaktina sem er í gangi).
function VerkefniYfirlit({ listi, vakt }: { listi: Verkefni[]; vakt: VerkefniVakt }) {
  const { state, hladid } = useEftirlit();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const lokid = listi.filter((v) => state.verkefniStada[v.id] === "lokid").length;
  const total = listi.length;
  const virkVakt = now ? vaktFyrirKlst(now.getHours()) : null;

  // Raðgildi tíma (sömu rök og verkefniFyrirVakt – nótt fer yfir miðnætti).
  const radgildi = (h: number, m: number) => {
    const mins = h * 60 + m;
    if (vakt === "nott") return mins >= 17 * 60 ? mins : mins + 24 * 60;
    return mins;
  };

  const yfirTima = useMemo(() => {
    if (!now || virkVakt !== vakt) return [];
    const nuna = radgildi(now.getHours(), now.getMinutes());
    return listi.filter((v) => {
      if (state.verkefniStada[v.id] === "lokid") return false;
      const [h, m] = v.timi.split(":").map(Number);
      return radgildi(h, m) < nuna;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, listi, state.verkefniStada, vakt, virkVakt]);

  if (!hladid) return null;
  const hlutf = total > 0 ? Math.round((lokid / total) * 100) : 0;

  return (
    <div className="m-4 mb-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
        <span className="uppercase tracking-wide text-slate-400">Yfirlit vaktstjóra</span>
        <span className="text-slate-600">
          {lokid}/{total} lokið
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${hlutf}%` }} />
      </div>
      {yfirTima.length > 0 && (
        <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2">
          <p className="text-xs font-bold text-amber-800">
            {yfirTima.length} {yfirTima.length === 1 ? "verkefni" : "verkefni"} komin fram yfir tíma
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            {yfirTima.map((v) => `${v.timi} ${v.titill}`).join(" · ")}
          </p>
        </div>
      )}
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
  tákn: ReactNode;
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
}: {
  verkefni: Verkefni;
  opid: boolean;
  onToggle: () => void;
  stjori: boolean;
}) {
  const { state, setThrep, setVerkefniStada, hladid } = useEftirlit();
  const stada: VerkefniStada = state.verkefniStada[verkefni.id] ?? "ekki-byrjad";
  const haka = state.threp[verkefni.id] ?? {};
  const buin = verkefni.threp.filter((t) => haka[t.id]).length;

  const lokid = hladid && stada === "lokid";
  const iGangi = hladid && stada === "i-gangi";

  // Ekki má ljúka verkefni fyrr en öll þrep eru hökuð – annars segir skráin
  // "lokið" án þess að neitt hafi sannanlega verið gert. Verkefni með eyðublaði
  // (ytri aðilar) hafa sína eigin staðfestingu og eru undanskilin.
  const ollThrepBuin =
    verkefni.eydublad === "ytri-adilar" ||
    verkefni.threp.length === 0 ||
    buin === verkefni.threp.length;

  // Almennt starfsfólk sér ekki framvindu verkefnis fyrr en það er hafið –
  // vaktstjórar sjá hana alltaf, óháð stöðu.
  const sjaFramvindu = stjori || stada !== "ekki-byrjad";

  return (
    <li
      id={verkefni.id}
      className="scroll-mt-32 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
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

        {/* Staðuhnappur (Start / Finish / lokið) – falinn fyrir almenna
            starfsmenn þangað til verkefni er hafið. */}
        {!hladid || !sjaFramvindu ? null : lokid ? (
          <CheckHringur onAfturkalla={() => setVerkefniStada(verkefni.id, "i-gangi")} />
        ) : iGangi ? (
          <button
            onClick={() => {
              if (!ollThrepBuin) {
                // Þrep vantar – opna gátlistann í stað þess að ljúka.
                haptik();
                if (!opid) onToggle();
                return;
              }
              haptikStadfest();
              setVerkefniStada(verkefni.id, "lokid");
            }}
            aria-disabled={!ollThrepBuin}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold ${
              ollThrepBuin
                ? "bg-sky-200 text-sky-900 active:bg-sky-300"
                : "bg-slate-100 text-slate-400 ring-1 ring-slate-200"
            }`}
          >
            {ollThrepBuin ? "Ljúka" : `Ljúka (${buin}/${verkefni.threp.length})`}
          </button>
        ) : (
          <button
            onClick={() => {
              haptik();
              setVerkefniStada(verkefni.id, "i-gangi");
              if (!opid) onToggle();
            }}
            className="shrink-0 rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white active:bg-brand-dark"
          >
            Hefja
          </button>
        )}
      </div>

      {opid && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
          {stjori && <VerkefniStadaStjorn stada={stada} onVelja={(s) => setVerkefniStada(verkefni.id, s)} />}

          <p className="mb-3 text-sm leading-relaxed text-slate-600">{verkefni.lysing}</p>

          {!sjaFramvindu ? (
            <button
              onClick={() => setVerkefniStada(verkefni.id, "i-gangi")}
              className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white active:bg-brand-dark"
            >
              Hefja verkefni
            </button>
          ) : verkefni.eydublad === "ytri-adilar" ? (
            <YtriAdilarForm verkefniId={verkefni.id} />
          ) : (
            <>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Þrep ({buin}/{verkefni.threp.length})
              </h3>
              <ul className="space-y-1">
                {verkefni.threp.map((t, i) => {
                  const checked = !!haka[t.id];
                  const synaKafla = !!t.section && t.section !== verkefni.threp[i - 1]?.section;
                  return (
                    <li key={t.id}>
                      {synaKafla && (
                        <h4 className="mb-1 mt-3 border-b border-slate-200 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 first:mt-0">
                          {t.section}
                        </h4>
                      )}
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
        </div>
      )}
    </li>
  );
}

function VerkefniStadaStjorn({
  stada,
  onVelja,
}: {
  stada: VerkefniStada;
  onVelja: (stada: VerkefniStada) => void;
}) {
  const valkostir: { gildi: VerkefniStada; label: string }[] = [
    { gildi: "ekki-byrjad", label: "Ekki byrjað" },
    { gildi: "i-gangi", label: "Í gangi" },
    { gildi: "lokid", label: "Lokið" },
  ];
  return (
    <div className="mb-3 flex gap-1.5">
      {valkostir.map((v) => (
        <button
          key={v.gildi}
          onClick={() => onVelja(v.gildi)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${
            stada === v.gildi ? "bg-brand text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

// Grænt hak á loknu verkefni. Smellur afturkallar lokunina (aftur í "í gangi")
// svo fingurskot á sameiginlegu tæki skilji ekki eftir ranga skráningu.
function CheckHringur({ onAfturkalla }: { onAfturkalla: () => void }) {
  return (
    <button
      onClick={() => {
        haptik();
        onAfturkalla();
      }}
      aria-label="Afturkalla lokið verkefni"
      title="Afturkalla – aftur í „í gangi“"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 transition active:scale-95 active:bg-green-200"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3}>
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
