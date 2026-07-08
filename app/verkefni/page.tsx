"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import YtriAdilarForm from "@/components/YtriAdilarForm";
import { useEftirlit, VerkefniStada } from "@/lib/store";
import { Verkefni, VerkefniVakt, vaktFyrirKlst, verkefniFyrirVakt, verkefniYfirTima } from "@/lib/data/verkefni";
import { erVaktstjori } from "@/lib/data/starfsfolk";
import { allirStarfsmenn } from "@/lib/data/vaktir";
import { haptik, haptikStadfest } from "@/lib/haptics";
import { IconSun, IconMoon } from "@/components/Icons";
import StadaBadge from "@/components/StadaBadge";

export default function VerkefniPage() {
  const { state, hladid } = useEftirlit();
  const [vakt, setVakt] = useState<VerkefniVakt>(vaktFyrirKlst());
  const [opid, setOpid] = useState<string | null>(null);
  const [synaLokin, setSynaLokin] = useState(false);

  // Ein sameiginleg klukka fyrir alla síðuna – notuð til að merkja "yfir
  // tíma" verkefni og greina framtíðarverkefni frá aðgerðahæfum.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

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
  const lokin = useMemo(
    () => (hladid ? listi.filter((v) => state.verkefniStada[v.id] === "lokid") : []),
    [listi, state.verkefniStada, hladid]
  );

  // Ef verkefnið sem djúptengt er á er lokið þarf lokni hlutinn að vera
  // opinn svo röðin sjáist yfirhöfuð.
  useEffect(() => {
    if (opid && lokin.some((v) => v.id === opid)) setSynaLokin(true);
  }, [opid, lokin]);

  return (
    <div>
      {/* Haus með vaktarvali og framvindu – merkislitaður, dökkur í nætur-
          stillingu. Dagur/nótt-valið býr inni í hausnum (sbr. hönnunarkerfi). */}
      <header className="sticky top-0 z-20 bg-brand px-4 pb-3 pt-3 text-white shadow-sm dark:bg-[#131920] dark:bg-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold leading-tight">Verkefni</h1>
            <p className="text-sm font-semibold text-white/80">
              {vakt === "dagur" ? "Dagvakt" : "Næturvakt"}
              {hladid && ` · ${lokin.length} af ${listi.length} lokið`}
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="mt-3 flex rounded-2xl bg-white/15 p-1">
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
      </header>

      <div className="space-y-2 p-4">
        {/* Lokin verkefni falin bak við samanfellda græna stiku – "færri
            hlutir á skjá í einu". Smellur sýnir/felur loknu raðirnar. */}
        {lokin.length > 0 && (
          <button
            onClick={() => {
              haptik();
              setSynaLokin((v) => !v);
            }}
            className="flex w-full items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-left"
          >
            <svg
              className="h-5 w-5 shrink-0 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="flex-1 text-sm font-bold text-emerald-700">
              {lokin.length} {lokin.length === 1 ? "verkefni lokið" : "verkefnum lokið"} ·{" "}
              {lokin[0].timi}–{lokin[lokin.length - 1].timi}
            </span>
            <span className={`text-emerald-700 transition-transform ${synaLokin ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>
        )}

        <ul className="space-y-2">
          {listi.map((v) => {
            const lokid = hladid && state.verkefniStada[v.id] === "lokid";
            if (lokid && !synaLokin) return null;
            return (
              <VerkefniLina
                key={v.id}
                verkefni={v}
                opid={opid === v.id}
                onToggle={() => setOpid(opid === v.id ? null : v.id)}
                stjori={stjori}
                now={now}
                vakt={vakt}
              />
            );
          })}
        </ul>
      </div>
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
      className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${
        virkur ? "bg-white text-brand shadow-sm dark:bg-white/10" : "text-white/80"
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
  now,
  vakt,
}: {
  verkefni: Verkefni;
  opid: boolean;
  onToggle: () => void;
  stjori: boolean;
  now: Date | null;
  vakt: VerkefniVakt;
}) {
  const { state, setThrep, setVerkefniStada, hladid } = useEftirlit();
  const stada: VerkefniStada = state.verkefniStada[verkefni.id] ?? "ekki-byrjad";
  const haka = state.threp[verkefni.id] ?? {};
  const buin = verkefni.threp.filter((t) => haka[t.id]).length;

  const lokid = hladid && stada === "lokid";
  const iGangi = hladid && stada === "i-gangi";
  const yfirTima = hladid && stada === "ekki-byrjad" && !!now && verkefniYfirTima(verkefni, now);

  // Framtíðarverkefni (seinni klukkustund sömu virku vaktar) fá "EKKI BYRJAÐ"
  // merki í stað Hefja-hnapps – dregur ekki athygli fyrr en röðin kemur.
  const radgildiKlst = (h: number) => (vakt === "nott" && h < 17 ? h + 24 : h);
  const vaktVirk = !!now && vaktFyrirKlst(now.getHours()) === vakt;
  const framtid =
    hladid &&
    stada === "ekki-byrjad" &&
    vaktVirk &&
    !!now &&
    radgildiKlst(Number(verkefni.timi.split(":")[0])) > radgildiKlst(now.getHours());

  // Mínútur fram yfir áætlaðan tíma (fyrir undirtexta yfir tíma-raða).
  let minYfir = 0;
  if (yfirTima && now) {
    const radgildi = (h: number, m: number) => {
      const mins = h * 60 + m;
      return vakt === "nott" && mins < 17 * 60 ? mins + 1440 : mins;
    };
    const [h, m] = verkefni.timi.split(":").map(Number);
    minYfir = radgildi(now.getHours(), now.getMinutes()) - radgildi(h, m);
  }

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

  // Gátlisti verkefnis í gangi er alltaf opinn (engin auka snerting með
  // hanska); önnur verkefni opnast með smelli á röðina.
  const synaMeginmal = opid || iGangi;

  // Undirtexti: það gagnlegasta fyrir hverja stöðu.
  const klILysingu = verkefni.titill.match(/(\d{1,2}:\d{2})/)?.[1];
  const undirtexti = yfirTima ? (
    <p className="truncate text-sm font-medium text-red-600">{minYfir} mín fram yfir tíma</p>
  ) : iGangi && verkefni.threp.length > 0 ? (
    <p className="truncate text-sm text-slate-500">
      {buin} af {verkefni.threp.length} þrepum lokið
    </p>
  ) : klILysingu ? (
    <p className="truncate text-sm text-slate-500">Kl. {klILysingu}</p>
  ) : verkefni.threp.length > 0 ? (
    <p className="truncate text-sm text-slate-500">{verkefni.threp.length} eftirlitsstaðir</p>
  ) : (
    <p className="truncate text-sm text-slate-500">{verkefni.samantekt}</p>
  );

  return (
    <li
      id={verkefni.id}
      className={`scroll-mt-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
        yfirTima
          ? "border-l-4 border-l-[#9c2b1c]"
          : iGangi
          ? "border-l-4 border-l-[#c07f10]"
          : ""
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <button onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              <span
                className={`text-sm font-bold tabular-nums ${
                  yfirTima || iGangi ? "text-brand" : lokid ? "text-slate-400" : "text-slate-700"
                }`}
              >
                {verkefni.timi}
              </span>
              {yfirTima && <StadaBadge stada="yfir-tima" />}
              {iGangi && <StadaBadge stada="i-gangi" />}
            </div>
            <p
              className={`truncate text-lg font-bold ${
                lokid ? "text-slate-400 line-through" : "text-slate-900"
              }`}
            >
              {verkefni.titill}
            </p>
            {!lokid && undirtexti}
          </div>
        </button>

        {/* Aðgerð til hægri: Hefja / Ljúka / hak / EKKI BYRJAÐ-merki.
            Hefja sést öllum (hönnunarkerfið: stór aðgerðahnappur á röðinni) –
            gátlistinn opnast fyrst þegar verkefnið er hafið. */}
        {!hladid ? null : lokid ? (
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
            className={`h-[52px] shrink-0 rounded-xl border px-5 text-base font-bold ${
              ollThrepBuin
                ? "border-slate-300 bg-white text-slate-900 active:bg-slate-50"
                : "border-slate-300 bg-slate-50 text-slate-400"
            }`}
          >
            Ljúka
          </button>
        ) : framtid ? (
          <StadaBadge stada="ekki-byrjad" className="px-3 py-1.5" />
        ) : (
          <button
            onClick={() => {
              haptik();
              setVerkefniStada(verkefni.id, "i-gangi");
            }}
            className="h-[52px] shrink-0 rounded-xl bg-brand px-6 text-base font-bold text-white active:bg-brand-dark"
          >
            Hefja
          </button>
        )}
      </div>

      {synaMeginmal && (
        <div className="border-t border-slate-100 px-4 py-3">
          {stjori && opid && (
            <VerkefniStadaStjorn stada={stada} onVelja={(s) => setVerkefniStada(verkefni.id, s)} />
          )}

          {opid && (
            <p className="mb-3 text-sm leading-relaxed text-slate-600">{verkefni.lysing}</p>
          )}

          {!sjaFramvindu ? (
            <button
              onClick={() => setVerkefniStada(verkefni.id, "i-gangi")}
              className="h-[52px] w-full rounded-xl bg-brand px-4 text-base font-bold text-white active:bg-brand-dark"
            >
              Hefja verkefni
            </button>
          ) : verkefni.eydublad === "ytri-adilar" ? (
            <YtriAdilarForm verkefniId={verkefni.id} />
          ) : (
            <>
              {opid && (
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Þrep ({buin}/{verkefni.threp.length})
                </h3>
              )}
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
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-2 active:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setThrep(verkefni.id, t.id, e.target.checked)}
                          className="mt-0.5 h-6 w-6 shrink-0 rounded border-slate-300 text-brand focus:ring-brand"
                        />
                        <span
                          className={`text-base ${checked ? "text-slate-400 line-through" : "text-slate-700"}`}
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
