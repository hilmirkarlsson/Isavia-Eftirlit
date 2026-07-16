"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useEftirlit } from "@/lib/store";
import {
  POSTUR_LITUR,
  Postur,
  Starfsmadur,
  TIMAR,
  TIMAR_NOTT,
  VAKT,
  Vakt,
  erVaktstjori,
  skipulagsRodun,
  virkVakt,
  virkurTimaVisirFyrir,
} from "@/lib/data/starfsfolk";
import SudurTilkynning from "@/components/SudurTilkynning";
import ThemeToggle from "@/components/ThemeToggle";
import Vaktnotur from "@/components/Vaktnotur";
import { useSudurSnua } from "@/lib/useSudurSnua";
import {
  VERKEFNI,
  Verkefni,
  verkefniNuna,
  vaktFyrirKlst,
  verkefniFyrirVakt,
  verkefniYfirTima,
} from "@/lib/data/verkefni";
import { virkStarfsfolk, giltDeiltSkipulag } from "@/lib/skipulagsgerd";
import { Fylgd } from "@/lib/data/fylgdir";
import { allirStarfsmenn, fjarverandiNofn } from "@/lib/data/vaktir";
import StadaBadge from "@/components/StadaBadge";
import { haptik } from "@/lib/haptics";

// Sameinar samliggjandi eins pósta í eitt bil (eins og samrunnar reitir
// í upprunalega skipulaginu).
function sameinaPosta(postar: Postur[]): { postur: Postur; byrjun: number; fjoldi: number }[] {
  const bil: { postur: Postur; byrjun: number; fjoldi: number }[] = [];
  postar.forEach((p, i) => {
    const sidasta = bil[bil.length - 1];
    if (sidasta && sidasta.postur === p) sidasta.fjoldi++;
    else bil.push({ postur: p, byrjun: i, fjoldi: 1 });
  });
  return bil;
}

/** "HH:MM" + 60 mín (t.d. lok síðasta tímaramma = vaktalok). */
function klstSidar(timi: string): string {
  const [h, m] = timi.split(":").map(Number);
  return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function radMinutur(timi: string, nott: boolean): number {
  const [h, m] = timi.split(":").map(Number);
  const mins = h * 60 + m;
  return nott && mins < 17 * 60 ? mins + 24 * 60 : mins;
}

function formatNidurtalning(min: number): string {
  const heilar = Math.max(0, Math.ceil(min));
  const klst = Math.floor(heilar / 60);
  const minutur = heilar % 60;
  if (klst <= 0) return `${minutur} mín`;
  if (minutur === 0) return `${klst} klst`;
  return `${klst} klst ${minutur} mín`;
}

function posturErVinna(postur: Postur): boolean {
  return postur !== "" && postur !== "Frí";
}

function stutturTimi(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function HeimPage() {
  const { state, setNotandi, setVerkefniStada } = useEftirlit();
  const router = useRouter();
  const [synaGrid, setSynaGrid] = useState(false);
  const [synaAllaTima, setSynaAllaTima] = useState(false);
  const [synaFleSvar, setSynaFleSvar] = useState(false);

  // Klukka sem uppfærist svo "núna" haldist rétt.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const vardstjoriId = state.vardstjoriId ?? "rannveig";
  const adstodarvardstjoriId = state.adstodarvardstjoriId ?? "jon-marino";
  const vakt = virkVakt(VAKT, vardstjoriId, adstodarvardstjoriId);

  const vaktgerd = now ? vaktFyrirKlst(now.getHours()) : "dagur";
  const nott = vaktgerd === "nott";
  const timar = nott ? TIMAR_NOTT : TIMAR;

  // Dagsetning plansins (valin við slembiröðun) – dd.mm.yyyy, ef til.
  const planDags = nott ? state.naeturskipulagDags : state.skipulagDags;
  const planDagsTexti = planDags ? planDags.split("-").reverse().join(".") : null;

  const allir = useMemo(() => allirStarfsmenn(state.vaktir), [state.vaktir]);

  // Nöfn þeirra sem eru merktir fjarverandi (mætingarval vaktstjóra) – þeir
  // birtast ekki í skipulaginu sem allir sjá.
  const fjarverandi = useMemo(
    () => fjarverandiNofn(state.vaktir, state.fjarvist),
    [state.vaktir, state.fjarvist]
  );

  const allirMedPostum = useMemo(() => {
    if (nott) {
      const naetur = giltDeiltSkipulag(state.naeturskipulag);
      return allir
        .filter((s) => !s.utkall)
        .map((s) => ({
          ...s,
          postar: naetur?.[s.id] ?? s.postarNott ?? Array(TIMAR_NOTT.length).fill(""),
        }));
    }
    return virkStarfsfolk(allir, giltDeiltSkipulag(state.skipulag));
  }, [allir, state.skipulag, state.naeturskipulag, nott]);

  // Skipulagið sem birtist öllum – fjarverandi starfsfólk falið. `ég` er samt
  // fundið úr öllum listanum svo notandinn geti alltaf notað forritið.
  const starfsfolk = useMemo(
    () => allirMedPostum.filter((s) => !fjarverandi.has(s.nafn.toLowerCase())),
    [allirMedPostum, fjarverandi]
  );
  const ég = allirMedPostum.find((s) => s.id === state.notandi);
  const visir = now ? virkurTimaVisirFyrir(timar, nott, now) : -1;
  const naestiVisir = visir + 1;

  const verkefniNu = useMemo(() => (now ? verkefniNuna(now) : []), [now]);

  const klstNu = now ? now.getHours() : -1;

  // Fylgdir sem vaktstjóri hefur merkt "Lokið" – birtast öllum á heimasíðunni,
  // óháð klukkustund (ekki bara meðan fylgdin er í gangi).
  const fylgdirNu = useMemo<Fylgd[]>(() => state.fylgdir.filter((f) => f.lokid), [state.fylgdir]);

  // Innsigli FLE verkefni sem hefst eftir um klukkustund – notað til að minna
  // þann sem er á Norður á að undirbúa það (tilkynning með merkislituðum ramma).
  const fleEftirKlst = useMemo(() => {
    if (klstNu < 0) return null;
    return (
      VERKEFNI.find(
        (v) => /innsigli fle/i.test(v.titill) && Number(v.timi.split(":")[0]) === (klstNu + 1) % 24
      ) ?? null
    );
  }, [klstNu]);

  const sudur = useSudurSnua();

  // Verkefni vaktarinnar (allrar, ekki bara þessarar klukkustundar) – notað í
  // haus vaktstjóra (X/Y lokið) og "Verkefni sem þarfnast athygli" að neðan.
  const verkefniVaktar = useMemo(() => verkefniFyrirVakt(vaktgerd), [vaktgerd]);
  const fleVerkefniVaktar = useMemo(
    () => verkefniVaktar.find((v) => /innsigli fle/i.test(v.titill)) ?? null,
    [verkefniVaktar]
  );
  const verkefniLokidFjoldi = verkefniVaktar.filter((v) => state.verkefniStada[v.id] === "lokid").length;
  const verkefniIGangiFjoldi = verkefniVaktar.filter((v) => state.verkefniStada[v.id] === "i-gangi").length;
  const verkefniAthygli = useMemo(() => {
    if (!now) return [];
    const listi = verkefniVaktar.filter((v) => {
      const s = state.verkefniStada[v.id];
      return s === "i-gangi" || (s !== "lokid" && verkefniYfirTima(v, now));
    });
    // Yfir tíma fyrst (mest áríðandi), svo í gangi – hvor hópur í tímaröð.
    return listi.slice().sort((a, b) => {
      const aYfir = state.verkefniStada[a.id] !== "i-gangi" ? 0 : 1;
      const bYfir = state.verkefniStada[b.id] !== "i-gangi" ? 0 : 1;
      return aYfir - bYfir;
    });
  }, [verkefniVaktar, state.verkefniStada, now]);
  const verkefniNylegaLokid = useMemo(
    () =>
      verkefniVaktar
        .filter((v) => state.verkefniStada[v.id] === "lokid" && state.verkefniVinna[v.id]?.lokid)
        .slice()
        .sort((a, b) => {
          const aKl = state.verkefniVinna[a.id]?.lokid?.kl ?? "";
          const bKl = state.verkefniVinna[b.id]?.lokid?.kl ?? "";
          return bKl.localeCompare(aKl);
        })
        .slice(0, 4),
    [verkefniVaktar, state.verkefniStada, state.verkefniVinna]
  );
  const verkefniYfirTimaFjoldi = verkefniAthygli.filter(
    (v) => state.verkefniStada[v.id] !== "i-gangi"
  ).length;

  // Mínútur fram yfir áætlaðan tíma verkefnis (fyrir athygliskortin).
  const minYfir = (v: Verkefni): number => {
    if (!now) return 0;
    const radgildi = (h: number, m: number) => {
      const mins = h * 60 + m;
      return !nott || mins >= 17 * 60 ? mins : mins + 24 * 60;
    };
    const [h, m] = v.timi.split(":").map(Number);
    return Math.max(0, radgildi(now.getHours(), now.getMinutes()) - radgildi(h, m));
  };

  if (!ég) return null;

  const núPostur: Postur = visir >= 0 ? ég.postar[visir] : "";
  const næstiPostur: Postur = naestiVisir < timar.length ? ég.postar[naestiVisir] : "";

  // Mínútur liðnar/eftir af núverandi tímaramma (römm eru 60 mín, byrja á
  // hálftíma – t.d. 05:30). Notað fyrir framvindustikuna á "núna"-kortinu.
  let rammaFramvinda: number | null = null;
  let mínEftirRamma: number | null = null;
  if (visir >= 0 && now) {
    const radgildi = (h: number, m: number) => {
      const mins = h * 60 + m;
      return !nott || mins >= 17 * 60 ? mins : mins + 24 * 60;
    };
    const [bh, bm] = timar[visir].split(":").map(Number);
    const liðnar = radgildi(now.getHours(), now.getMinutes()) - radgildi(bh, bm);
    rammaFramvinda = Math.min(100, Math.max(0, (liðnar / 60) * 100));
    mínEftirRamma = Math.max(0, 60 - liðnar);
  }

  const erÁSuður = núPostur === "Schengen";
  const synaNordurFle = núPostur === "Norður" && !!fleEftirKlst;
  const stjori = erVaktstjori(ég.nafn, vakt);
  const fleVisir = fleVerkefniVaktar ? timar.findIndex((t) => t === fleVerkefniVaktar.timi) : -1;
  const fleManneskja = fleVisir >= 0 ? starfsfolk.find((s) => s.postar[fleVisir] === "Norður") : undefined;
  const egMedFle = !!fleManneskja && fleManneskja.id === ég.id;

  const vaktalok = klstSidar(timar[timar.length - 1]);
  const vinnutimar = ég.postar
    .map((postur, i) => (posturErVinna(postur) ? i : -1))
    .filter((i) => i >= 0);
  const fyrstiVinnutimi = vinnutimar[0] ?? -1;
  const sidastiVinnutimi = vinnutimar[vinnutimar.length - 1] ?? -1;
  const minNuna =
    now &&
    radMinutur(
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      nott
    );
  const vaktByrjunMin = fyrstiVinnutimi >= 0 ? radMinutur(timar[fyrstiVinnutimi], nott) : null;
  const vaktLokTimi = sidastiVinnutimi >= 0 ? klstSidar(timar[sidastiVinnutimi]) : null;
  const vaktLokMin = vaktLokTimi ? radMinutur(vaktLokTimi, nott) : null;
  const vaktLengdMin =
    vaktByrjunMin !== null && vaktLokMin !== null ? Math.max(vaktLokMin - vaktByrjunMin, 0) : 0;
  const minTilVaktLoka =
    typeof minNuna === "number" && vaktLokMin !== null ? Math.max(vaktLokMin - minNuna, 0) : null;
  const minTilVaktByrjar =
    typeof minNuna === "number" && vaktByrjunMin !== null ? Math.max(vaktByrjunMin - minNuna, 0) : null;
  const vaktFramvinda =
    typeof minNuna === "number" && vaktByrjunMin !== null && vaktLengdMin > 0
      ? Math.min(100, Math.max(0, ((minNuna - vaktByrjunMin) / vaktLengdMin) * 100))
      : 0;
  const erIVinnutima =
    typeof minNuna === "number" &&
    vaktByrjunMin !== null &&
    vaktLokMin !== null &&
    minNuna >= vaktByrjunMin &&
    minNuna < vaktLokMin;
  const klukka = now
    ? now.toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "--:--";

  // ---------------------------------------------------------------- 1b
  // Stjórnstöð – þétt borðtölvuyfirlit fyrir vaktstjóra: hvítur haus með
  // stöðutölum og klukku, staðsetning + verkefni sem þarfnast athygli
  // vinstra megin, skipulagstafla + skilaboð milli vakta hægra megin.
  if (stjori) {
    // Handvirkt dd.mm.yyyy – toLocaleDateString("is-IS") er ekki áreiðanlegt
    // í öllum vöfrum/keyrsluumhverfum (fellur á enskt snið).
    const dagsTexti = planDagsTexti ?? VAKT.dagsetning.split("-").reverse().join(".");
    const timaRammi =
      visir >= 0
        ? `${timar[visir]}–${naestiVisir < timar.length ? timar[naestiVisir] : vaktalok}`
        : "";
    const áVakt = starfsfolk.filter((s) => !erVaktstjori(s.nafn, vakt) && visir >= 0 && s.postar[visir]);

    return (
      <div>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 lg:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand">
                {nott ? "Næturvakt" : "Dagvakt"} · Vakt {VAKT.vakt} · {dagsTexti}
              </p>
              <h1 className="text-2xl font-bold leading-tight text-slate-900">Yfirlit vaktstjóra</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Verkefni vaktar
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {verkefniLokidFjoldi}/{verkefniVaktar.length}
                  {verkefniIGangiFjoldi > 0 && (
                    <span className="text-brand"> · {verkefniIGangiFjoldi} í gangi</span>
                  )}
                  {verkefniYfirTimaFjoldi > 0 && (
                    <span className="text-red-700"> · {verkefniYfirTimaFjoldi} yfir tíma</span>
                  )}
                </p>
              </div>
              <p className="text-4xl font-extrabold tabular-nums text-slate-900">{klukka}</p>
              <button
                onClick={() => setNotandi(null)}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 active:bg-slate-200 lg:hidden"
              >
                Skipta um notanda
              </button>
              <span className="hidden lg:block">
                <ThemeToggle aBjortu />
              </span>
            </div>
          </div>
        </header>

        <div className="space-y-5 p-4 lg:grid lg:grid-cols-[1fr_460px] lg:items-start lg:gap-6 lg:space-y-0 lg:p-6">
          <div className="space-y-5">
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Staðsetning starfsfólks núna{timaRammi && ` · ${timaRammi}`}
              </h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {visir < 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">Vaktin er ekki byrjuð.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {áVakt.map((s) => {
                      const p: Postur = s.postar[visir];
                      return (
                        <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                          <span className="min-w-0 flex-1 truncate text-base font-bold text-slate-900">
                            {s.nafn}
                          </span>
                          <span
                            className={`shrink-0 rounded-lg px-3 py-1 text-sm font-bold ${POSTUR_LITUR[p] ?? "text-slate-400"}`}
                          >
                            {p}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Verkefni sem þarfnast athygli
              </h2>
              {verkefniAthygli.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
                  Ekkert verkefni þarfnast athygli núna.
                </p>
              ) : (
                <ul className="space-y-2">
                  {verkefniAthygli.map((v) => {
                    const iGangi = state.verkefniStada[v.id] === "i-gangi";
                    const haka = state.threp[v.id] ?? {};
                    const buin = v.threp.filter((t) => haka[t.id]).length;
                    const vinna = state.verkefniVinna[v.id];
                    const vinnuTimi = stutturTimi(vinna?.byrjad?.kl ?? vinna?.sidast?.kl);
                    return (
                      <li
                        key={v.id}
                        className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${
                          iGangi ? "border-slate-200 bg-white" : "border-red-200 bg-red-50"
                        }`}
                      >
                        <StadaBadge stada={iGangi ? "i-gangi" : "yfir-tima"} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-slate-900">
                            {v.timi} · {v.titill}
                          </p>
                          {iGangi ? (
                            <p className="text-sm text-slate-500">
                              {vinna?.byrjad
                                ? `${vinna.byrjad.nafn} · ${buin}/${v.threp.length} þrep${
                                    vinnuTimi ? ` · frá ${vinnuTimi}` : ""
                                  }`
                                : `${buin}/${v.threp.length} þrep`}
                            </p>
                          ) : (
                            <p className="text-sm text-red-700">
                              {minYfir(v)} mín fram yfir áætlaðan tíma · enginn hefur hafið verkefnið
                            </p>
                          )}
                        </div>
                        {!iGangi && (
                          <Link
                            href={`/verkefni#${v.id}`}
                            className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white active:bg-brand-dark"
                          >
                            Opna verkefni
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {verkefniNylegaLokid.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Nýlega lokið
                </h2>
                <ul className="divide-y divide-emerald-100 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
                  {verkefniNylegaLokid.map((v) => {
                    const lokid = state.verkefniVinna[v.id]?.lokid;
                    return (
                      <li key={v.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3}>
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-slate-900">
                            {v.timi} · {v.titill}
                          </p>
                          <p className="truncate text-sm text-emerald-700">
                            {lokid?.nafn}
                            {stutturTimi(lokid?.kl) && ` · kl. ${stutturTimi(lokid?.kl)}`}
                          </p>
                        </div>
                        <Link
                          href={`/verkefni#${v.id}`}
                          className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 active:bg-emerald-100"
                        >
                          Skoða
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>

          <div className="space-y-5">
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                {nott ? "Skipulag næturinnar" : "Skipulag dagsins"}
                {planDagsTexti && ` · ${planDagsTexti}`}
              </h2>
              <SkipulagGrid visir={visir} timar={timar} starfsfolk={starfsfolk} vakt={vakt} />
            </section>

            <Vaktnotur mittNafn={ég.nafn} stjori={stjori} />

            <p className="pt-1 text-center text-[11px] text-slate-400">
              Varðstjóri: {vakt.vardstjori} · Aðstoðarvarðstjóri: {vakt.adstodarvardstjori}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- 1c
  // Vettvangur – sími varðmanna. Ein spurning ræður forgangi: "Hvar á ég að
  // vera og hvað geri ég næst?" Risastór núna-flötur, tímalína sem lóðréttur
  // listi, 52px aðgerðahnappar, færri hlutir á skjá í einu.
  const fyrstiSyndi = !synaAllaTima && visir >= 0 ? Math.max(0, visir - 1) : 0;
  const sidastiSyndi =
    !synaAllaTima && visir >= 0 ? Math.min(timar.length - 1, visir + 3) : timar.length - 1;
  const meiraFalid = sidastiSyndi < timar.length - 1 || fyrstiSyndi > 0;

  const hefjaVerkefni = (v: Verkefni) => {
    haptik();
    if ((state.verkefniStada[v.id] ?? "ekki-byrjad") === "ekki-byrjad") {
      setVerkefniStada(v.id, "i-gangi");
    }
    router.push(`/verkefni#${v.id}`);
  };

  return (
    <div>
      {/* Merkislitaður haus með kveðju – dökkur flötur í næturstillingu.
          Rúmur litaflötur fyrir neðan kveðjuna sem núna-kortið skarast við. */}
      <div className="bg-brand pb-28 text-white dark:bg-[#131920] dark:bg-none">
        <header className="flex items-center justify-between gap-3 px-4 pt-3">
          <div>
            <p className="text-xs font-semibold text-white/70">
              {nott ? "Næturvakt" : "Dagvakt"} · Vakt {VAKT.vakt}
            </p>
            <h1 className="text-2xl font-bold leading-tight">
              {nott ? "Góða vakt" : "Góðan dag"}, {ég.nafn}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setNotandi(null)}
              aria-label="Skipta um notanda"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-sm active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20c1.2-3.2 3.8-4.8 7-4.8s5.8 1.6 7 4.8" strokeLinecap="round" />
              </svg>
            </button>
            <ThemeToggle />
          </div>
        </header>
      </div>

      {/* Risastór núna-flötur – hvítt kort sem skarast við hausinn. */}
      <div className="-mt-20 px-4">
        <div className="rounded-2xl bg-white p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {visir >= 0 ? `Núna · ${timar[visir]}` : "Vaktin er ekki byrjuð"}
          </p>
          <p className="mt-1 break-words text-[42px] font-extrabold leading-none tracking-tight text-slate-900 dark:text-[#e3ded4]">
            {núPostur || (visir >= 0 ? "—" : "Sjá skipulag")}
          </p>
          {rammaFramvinda !== null && (
            <>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand transition-all dark:bg-[#dda67f] dark:bg-none"
                  style={{ width: `${rammaFramvinda}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {mínEftirRamma} mín eftir af þessum tímaramma
              </p>
            </>
          )}
          {næstiPostur && (
            <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
              <span className="font-bold text-slate-900">Næst {timar[naestiVisir]}</span>
              <span
                className={`rounded-lg px-3 py-1 text-sm font-bold ${POSTUR_LITUR[næstiPostur] ?? ""}`}
              >
                {næstiPostur}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Mín vakt
              </p>
              {vinnutimar.length === 0 ? (
                <>
                  <p className="mt-1 text-2xl font-black text-slate-900">Ekki á vakt</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Enginn vinnupóstur er skráður á þig í þessu plani.
                  </p>
                </>
              ) : erIVinnutima && minTilVaktLoka !== null && vaktLokTimi ? (
                <>
                  <p className="mt-1 text-3xl font-black tabular-nums text-slate-900">
                    {formatNidurtalning(minTilVaktLoka)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">eftir · vakt lýkur kl. {vaktLokTimi}</p>
                </>
              ) : minTilVaktByrjar !== null && minTilVaktByrjar > 0 && fyrstiVinnutimi >= 0 && vaktLokTimi ? (
                <>
                  <p className="mt-1 text-3xl font-black tabular-nums text-slate-900">
                    {formatNidurtalning(minTilVaktByrjar)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    þar til þú byrjar · {timar[fyrstiVinnutimi]}–{vaktLokTimi}
                  </p>
                </>
              ) : vaktLokTimi ? (
                <>
                  <p className="mt-1 text-2xl font-black text-emerald-700">Vakt lokið</p>
                  <p className="mt-1 text-sm text-slate-500">Þinni vakt lauk kl. {vaktLokTimi}.</p>
                </>
              ) : null}
            </div>

            {vinnutimar.length > 0 && vaktLokTimi && fyrstiVinnutimi >= 0 && (
              <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Tími</p>
                <p className="font-mono text-sm font-bold text-slate-700">
                  {timar[fyrstiVinnutimi]}–{vaktLokTimi}
                </p>
              </div>
            )}
          </div>

          {vinnutimar.length > 0 && (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand transition-all dark:bg-[#dda67f] dark:bg-none"
                  style={{ width: `${vaktFramvinda}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-400">
                <span>Byrjun</span>
                <span>{Math.round(vaktFramvinda)}%</span>
                <span>Lok</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {fleVerkefniVaktar && (
        <div className="mt-4 px-4">
          <div
            className={`rounded-2xl border bg-white p-3 shadow-sm ${
              synaFleSvar && egMedFle ? "border-brand ring-1 ring-brand/30" : "border-slate-200"
            }`}
          >
            <button
              onClick={() => {
                haptik();
                setSynaFleSvar((v) => !v);
              }}
              className="flex min-h-[56px] w-full items-center gap-3 text-left"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-sm font-black text-brand">
                FLE
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-extrabold text-slate-900">
                  Er ég með innsigli FLE þessa vakt?
                </span>
                <span className="block text-sm text-slate-500">
                  {fleVerkefniVaktar.timi} · {fleVerkefniVaktar.vakt === "dagur" ? "dagvakt" : "næturvakt"}
                </span>
              </span>
              <span className={`text-xl text-slate-300 transition-transform ${synaFleSvar ? "rotate-90" : ""}`}>
                ›
              </span>
            </button>

            {synaFleSvar && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                {fleManneskja ? (
                  <>
                    <p className={`text-lg font-black ${egMedFle ? "text-brand" : "text-slate-900"}`}>
                      {egMedFle ? "Já." : "Nei."}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {egMedFle
                        ? `Þú ert á Norðri kl. ${fleVerkefniVaktar.timi}, þannig FLE-innsiglið lendir hjá þér.`
                        : `${fleManneskja.nafn} er á Norðri kl. ${fleVerkefniVaktar.timi}.`}
                    </p>
                    {egMedFle && (
                      <Link
                        href={`/verkefni#${fleVerkefniVaktar.id}`}
                        className="mt-3 flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-bold text-white active:bg-brand-dark"
                      >
                        Opna FLE-innsigli
                      </Link>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-semibold text-slate-600">
                    Enginn er merktur á Norðri kl. {fleVerkefniVaktar.timi} í þessu skipulagi.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tilkynning um hlið sem þarf að snúa á Suður – sýnd hér ef ég er
          staðsett(ur) á Suður (Schengen) núna. */}
      {erÁSuður && (
        <div className="mt-4">
          <SudurTilkynning
            mittNafn={sudur.mittNafn}
            adSnua={sudur.adSnua}
            stadfesta={sudur.stadfesta}
            setStadfesta={sudur.setStadfesta}
            stadfestaHopur={sudur.stadfestaHopur}
            setStadfestaHopur={sudur.setStadfestaHopur}
            stadfestaSnuning={sudur.stadfestaSnuning}
            stadfestaHopSnuning={sudur.stadfestaHopSnuning}
            tilkynning={sudur.tilkynning}
            stada={sudur.stada}
            titilAukning=" á Suður"
          />
        </div>
      )}

      <div className="space-y-4 p-4">
        {/* Tilkynning: Norður á að undirbúa Innsigli FLE eftir um klukkustund. */}
        {synaNordurFle && fleEftirKlst && (
          <Link
            href={`/verkefni#${fleEftirKlst.id}`}
            className="flex items-center gap-3 rounded-2xl border-2 border-brand bg-brand/5 p-3 shadow-sm ring-1 ring-brand/30 active:bg-brand/10"
          >
            <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              {fleEftirKlst.timi}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-brand">Norður: {fleEftirKlst.titill} eftir klukkustund</p>
              <p className="truncate text-xs text-slate-500">
                Undirbúa innsigli FLE fyrir kl. {fleEftirKlst.timi}.
              </p>
            </div>
            <span className="ml-auto text-brand/40">›</span>
          </Link>
        )}

        {/* Verkefni á þessari klukkustund – með stórum Hefja-hnappi. */}
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            Verkefni á þessari klukkustund
          </h2>
          {verkefniNu.length === 0 ? (
            <p className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">
              Engin verkefni skráð á þessari klukkustund.{" "}
              <Link href="/verkefni" className="font-medium text-brand underline">
                Sjá öll verkefni
              </Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {verkefniNu.map((v) => {
                const stada = state.verkefniStada[v.id] ?? "ekki-byrjad";
                return (
                  <li
                    key={v.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold tabular-nums text-brand">{v.timi}</p>
                      <p className="truncate text-lg font-bold text-slate-900">{v.titill}</p>
                      <p className="truncate text-sm text-slate-500">
                        {v.threp.length > 0 ? `${v.threp.length} eftirlitsstaðir` : v.samantekt}
                      </p>
                    </div>
                    {stada === "lokid" ? (
                      <StadaBadge stada="lokid" />
                    ) : (
                      <button
                        onClick={() => hefjaVerkefni(v)}
                        className="h-[52px] shrink-0 rounded-xl bg-brand px-6 text-base font-bold text-white active:bg-brand-dark"
                      >
                        {stada === "i-gangi" ? "Opna" : "Hefja"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Fylgdir þessa klukkustund – allir sjá; merkislitarammi ef úthlutað mér. */}
          {fylgdirNu.length > 0 && (
            <ul className="mt-2 space-y-2">
              {fylgdirNu.map((f) => {
                const mittVerkefni = f.starfsmenn.find((sm) => sm.starfsmadurId === state.notandi);
                const mín = !!mittVerkefni;
                const postar = f.starfsmenn
                  .map((sm) => allir.find((s) => s.id === sm.starfsmadurId)?.nafn)
                  .filter(Boolean)
                  .join(", ");
                return (
                  <li
                    key={f.id}
                    className={`rounded-2xl border bg-white p-3 shadow-sm ${
                      mín ? "border-brand ring-1 ring-brand/40" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand">
                        Fylgd
                      </span>
                      <span className="font-semibold text-slate-900">{f.nafn}</span>
                      {f.tegund && <span className="text-xs text-slate-500">· {f.tegund}</span>}
                      {f.flugnumer && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                          ✈ {f.flugnumer}
                        </span>
                      )}
                      {(f.tilbuinn || f.timi) && (
                        <span className="ml-auto font-mono text-xs text-slate-500">
                          {f.tilbuinn ? `Tilbúinn ${f.tilbuinn}` : f.timi}
                        </span>
                      )}
                    </div>
                    {postar && <p className="mt-1 truncate text-xs text-slate-500">{postar}</p>}
                    {mín && (
                      <div className="mt-2 rounded-lg bg-brand/10 p-2">
                        <p className="text-xs font-semibold text-brand">Úthlutað þínum pósti</p>
                        {mittVerkefni?.verkefni && (
                          <p className="mt-0.5 text-xs text-brand/90">{mittVerkefni.verkefni}</p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Mín staðsetning – lóðrétt tímalína. Liðnir rammar dofnir með
            yfirstrikun og haki, núna-raminn upplýstur, framtíð felld saman
            ("til 16:30 ▾") svo færri hlutir séu á skjá í einu. */}
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            {nott ? "Mín staðsetning í nótt" : "Mín staðsetning í dag"}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {timar.map((t, i) => {
                if (i < fyrstiSyndi || i > sidastiSyndi) return null;
                const p: Postur = ég.postar[i];
                const liðið = visir >= 0 && i < visir;
                const núna = i === visir;
                const sidastaRod = i === sidastiSyndi;
                return (
                  <li
                    key={t}
                    className={`flex items-center gap-3 px-4 py-3 ${núna ? "bg-brand/5" : ""}`}
                  >
                    <span
                      className={`w-14 shrink-0 text-base font-bold tabular-nums ${
                        liðið ? "text-slate-400" : núna ? "text-brand" : "text-slate-900"
                      }`}
                    >
                      {t}
                    </span>
                    <span
                      className={`shrink-0 rounded-lg px-3 py-1 text-sm font-bold ${
                        liðið
                          ? "bg-slate-100 text-slate-400 line-through"
                          : POSTUR_LITUR[p] ?? "text-slate-300"
                      } ${núna ? "ring-1 ring-black/10" : ""}`}
                    >
                      {p || "—"}
                    </span>
                    <span className="ml-auto shrink-0">
                      {liðið ? (
                        <svg
                          className="h-5 w-5 text-emerald-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : núna ? (
                        <span className="text-xs font-bold uppercase tracking-wide text-brand">
                          Núna
                        </span>
                      ) : sidastaRod && meiraFalid ? (
                        <button
                          onClick={() => setSynaAllaTima(true)}
                          className="text-sm font-medium text-slate-400 active:text-slate-600"
                        >
                          til {timar[timar.length - 1]} ▾
                        </button>
                      ) : sidastaRod && synaAllaTima && visir >= 0 ? (
                        <button
                          onClick={() => setSynaAllaTima(false)}
                          className="text-sm font-medium text-slate-400 active:text-slate-600"
                        >
                          vaktalok {vaktalok} ▴
                        </button>
                      ) : sidastaRod ? (
                        <span className="text-sm text-slate-400">vaktalok {vaktalok}</span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Skipulag dagsins – allt starfsfólk */}
        <section>
          <button
            onClick={() => setSynaGrid((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-900 shadow-sm active:bg-slate-50"
          >
            <span>
              {nott ? "Skipulag næturinnar (allir)" : "Skipulag dagsins (allir)"}
              {planDagsTexti && ` · ${planDagsTexti}`}
            </span>
            <span className={`text-slate-400 transition-transform ${synaGrid ? "rotate-90" : ""}`}>
              ›
            </span>
          </button>
          {synaGrid && <SkipulagGrid visir={visir} timar={timar} starfsfolk={starfsfolk} vakt={vakt} />}
        </section>

        <p className="pt-2 text-center text-[11px] text-slate-400">
          Varðstjóri: {vakt.vardstjori} · Aðstoðarvarðstjóri:{" "}
          {vakt.adstodarvardstjori}
        </p>
      </div>
    </div>
  );
}

function SkipulagGrid({
  visir,
  timar,
  starfsfolk,
  vakt,
}: {
  visir: number;
  timar: string[];
  starfsfolk: (Starfsmadur & { postar: Postur[] })[];
  vakt: Vakt;
}) {
  // Röðun svo taflan lesist eins og planið: langir póstar (Schengen/DMA/
  // Verkefni) fyrri helming efst, 1-klst rúllandi póstar í miðju, langir
  // póstar seinni helming neðst (vaktstjórar efst). Stöðug röðun heldur
  // upprunalegri innbyrðis röð innan hvers flokks.
  const radad = [...starfsfolk].sort(
    (a, b) =>
      skipulagsRodun(a.postar, erVaktstjori(a.nafn, vakt)) -
      skipulagsRodun(b.postar, erVaktstjori(b.nafn, vakt))
  );

  return (
    <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-brand text-white">
            <th className="sticky left-0 z-10 bg-brand px-2 py-2 text-left font-semibold">
              Starfsmaður
            </th>
            {timar.map((t, i) => (
              <th
                key={t}
                className={`px-1.5 py-2 font-semibold ${i === visir ? "bg-brand-dark" : ""}`}
              >
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {radad.map((s) => {
            const stjori = erVaktstjori(s.nafn, vakt);
            const stjoriHeiti =
              s.nafn === vakt.vardstjori ? "Vaktstjóri" : "Aðstoðarvaktstjóri";
            return (
            <tr key={s.id} className="border-t border-slate-100">
              <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1.5 font-medium text-slate-700">
                {s.nafn}
              </td>
              {sameinaPosta(s.postar).map((bil, k) => (
                <td
                  key={k}
                  colSpan={bil.fjoldi}
                  className={`whitespace-nowrap px-1.5 py-1.5 text-center ${
                    stjori ? "bg-brand/10 text-brand" : POSTUR_LITUR[bil.postur] ?? ""
                  } ${
                    visir >= bil.byrjun && visir < bil.byrjun + bil.fjoldi
                      ? "ring-1 ring-inset ring-brand/50"
                      : ""
                  }`}
                >
                  {stjori ? stjoriHeiti : bil.postur}
                </td>
              ))}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
