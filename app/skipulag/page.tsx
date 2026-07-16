"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useEftirlit } from "@/lib/store";
import { VaktSkraning } from "@/lib/data/vaktir";
import {
  POSTUR_LITUR,
  Postur,
  Starfsmadur,
  TIMAR,
  TIMAR_NOTT,
  VAKT,
  VALDIR_STJORAR,
  Vakt,
  LANGIR_POSTAR,
  erVaktstjori,
  virkVakt,
} from "@/lib/data/starfsfolk";
import { gerdaSlembidSkipulag, virkStarfsfolk, giltDeiltSkipulag, Skipulag } from "@/lib/skipulagsgerd";
import { vaktFyrirKlst } from "@/lib/data/verkefni";
import { tokiHausar } from "@/lib/clientAuth";
import { IconSun, IconMoon, IconShuffle, IconCamera } from "@/components/Icons";

const HAMARK_MYND_BYTES = 8 * 1024 * 1024; // 8MB – sama mark og þjónninn (app/api/skipulag-mynd)
const PLAN_MINNI_LYKILL = "eftirlit-kef-sidasta-plangerd";

type PlanMinni = {
  vaktId: string;
  vaktgerd: "dagur" | "nott";
  dags: string;
};

function isoDagsetning(d: Date): string {
  const ar = d.getFullYear();
  const manudur = String(d.getMonth() + 1).padStart(2, "0");
  const dagur = String(d.getDate()).padStart(2, "0");
  return `${ar}-${manudur}-${dagur}`;
}

function morgundagurIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoDagsetning(d);
}

function lesaPlanMinni(): PlanMinni | null {
  try {
    const raw = localStorage.getItem(PLAN_MINNI_LYKILL);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlanMinni>;
    if (!parsed.vaktId || !parsed.vaktgerd || !parsed.dags) return null;
    return parsed as PlanMinni;
  } catch {
    return null;
  }
}

function vistaPlanMinni(minni: PlanMinni) {
  try {
    localStorage.setItem(PLAN_MINNI_LYKILL, JSON.stringify(minni));
  } catch {
    /* ignore */
  }
}

function naestaVaktId(vaktir: VaktSkraning[], sidastaVaktId: string | null): string {
  if (vaktir.length === 0) return "";
  if (!sidastaVaktId) return vaktir[0].id;
  const i = vaktir.findIndex((v) => v.id === sidastaVaktId);
  if (i < 0) return vaktir[0].id;
  return vaktir[(i + 1) % vaktir.length].id;
}

// Sameinar samliggjandi eins pósta í eitt bil.
function sameinaPosta(postar: Postur[]): { postur: Postur; byrjun: number; fjoldi: number }[] {
  const bil: { postur: Postur; byrjun: number; fjoldi: number }[] = [];
  postar.forEach((p, i) => {
    const sidasta = bil[bil.length - 1];
    if (sidasta && sidasta.postur === p) sidasta.fjoldi++;
    else bil.push({ postur: p, byrjun: i, fjoldi: 1 });
  });
  return bil;
}

/** Er þessi maður í "löngu" stöðunum (Schengen/DMA/Verkefni) þennan helming? */
function erILongumPostum(postarHelmingur: Postur[]): boolean {
  return postarHelmingur.some((p) => LANGIR_POSTAR.includes(p));
}

export default function SkipulagPage() {
  const {
    state,
    hladid,
    setSkipulag,
    setNaeturskipulag,
    setVardstjoriId,
    setAdstodarvardstjoriId,
    samstillaSjalfvirkaVakt,
    setVaktFjarvist,
  } = useEftirlit();
  const [vaktgerd, setVaktgerd] = useState(vaktFyrirKlst());
  const [valinVaktId, setValinVaktId] = useState<string>("");
  const [dags, setDags] = useState(morgundagurIso);
  const [hladaUpp, setHladaUpp] = useState(false);
  const [uppVilla, setUppVilla] = useState<string | null>(null);
  const skraInntak = useRef<HTMLInputElement>(null);
  const upphafStillt = useRef(false);

  function munaValdaPlangerd() {
    if (!valinVakt) return;
    vistaPlanMinni({ vaktId: valinVakt.id, vaktgerd, dags });
  }

  async function velMynd(e: React.ChangeEvent<HTMLInputElement>) {
    const skra = e.target.files?.[0];
    e.target.value = "";
    if (!skra) return;
    if (skra.size > HAMARK_MYND_BYTES) {
      setUppVilla("Myndin er of stór (hámark 8MB).");
      return;
    }

    setHladaUpp(true);
    setUppVilla(null);
    try {
      const form = new FormData();
      form.append("mynd", skra);
      form.append("vaktgerd", vaktgerd);
      const res = await fetch("/api/skipulag-mynd", {
        method: "POST",
        headers: tokiHausar(),
        body: form,
      });
      const data = (await res.json()) as { skipulag?: Skipulag; villa?: string };
      if (!res.ok || !data.skipulag) {
        setUppVilla(data.villa ?? "Ekki tókst að lesa myndina.");
        return;
      }
      if (vaktgerd === "nott") setNaeturskipulag(data.skipulag, dags);
      else setSkipulag(data.skipulag, dags);
      munaValdaPlangerd();
    } catch {
      setUppVilla("Villa kom upp við að senda myndina.");
    } finally {
      setHladaUpp(false);
    }
  }

  const vardstjoriId = state.vardstjoriId ?? "rannveig";
  const adstodarvardstjoriId = state.adstodarvardstjoriId ?? "jon-marino";
  const vakt = virkVakt(VAKT, vardstjoriId, adstodarvardstjoriId);

  const ég = VAKT.starfsfolk.find((s) => s.id === state.notandi);
  const stjori = erVaktstjori(ég?.nafn, vakt);

  const timar = vaktgerd === "nott" ? TIMAR_NOTT : TIMAR;

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
    if (hladid) samstillaSjalfvirkaVakt(eVaktSeed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hladid, state.vaktir, eVaktSeed]);

  useEffect(() => {
    if (!hladid || upphafStillt.current || state.vaktir.length === 0) return;
    upphafStillt.current = true;
    const minni = lesaPlanMinni();
    setValinVaktId(naestaVaktId(state.vaktir, minni?.vaktId ?? null));
    if (minni?.vaktgerd) setVaktgerd(minni.vaktgerd);
    setDags(morgundagurIso());
  }, [hladid, state.vaktir]);

  const valinVakt = state.vaktir.find((v) => v.id === valinVaktId) ?? state.vaktir[0] ?? null;

  // Fjarverandi meðlimir valinnar vaktar – lesið úr sameiginlega ástandinu svo
  // valið haldist milli tækja og milli vakta (næsta plan man hverjir voru á).
  const fjarvistListi = (valinVakt && state.fjarvist[valinVakt.id]) || [];
  const erFjarverandi = (medlimurId: string) => fjarvistListi.includes(medlimurId);
  const setjaMaetingu = (medlimurId: string, mettur: boolean) => {
    if (!valinVakt) return;
    const nytt = mettur
      ? fjarvistListi.filter((id) => id !== medlimurId)
      : [...new Set([...fjarvistListi, medlimurId])];
    setVaktFjarvist(valinVakt.id, nytt);
  };

  // Starfsfólkið sem planið er reiknað fyrir: mættir meðlimir valinnar vaktar.
  // Nöfn sem passa við fasta starfsfólkslistann (E) halda id-i sínu (svo planið
  // birtist líka á Heim og næturvaktarsniðmát virki); önnur nöfn fá tóma pósta.
  const grunnStarfsfolk = useMemo<Starfsmadur[]>(() => {
    const utkallMadur = VAKT.starfsfolk.find((s) => s.utkall);
    if (!valinVakt) return VAKT.starfsfolk;
    const mettir = valinVakt.medlimir
      .filter((m) => !erFjarverandi(m.id))
      .map<Starfsmadur>((m) => {
        const r = VAKT.starfsfolk.find(
          (s) => !s.utkall && s.nafn.toLowerCase() === m.nafn.toLowerCase()
        );
        return r ?? { id: m.id, nafn: m.nafn, postar: Array(TIMAR.length).fill("") as Postur[] };
      });
    return utkallMadur ? [...mettir, utkallMadur] : mettir;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valinVakt, fjarvistListi]);

  const starfsfolk = useMemo(() => {
    if (vaktgerd === "nott") {
      const naetur = giltDeiltSkipulag(state.naeturskipulag);
      return grunnStarfsfolk
        .filter((s) => !s.utkall)
        .map((s) => ({
          ...s,
          postar: (naetur?.[s.id] ??
            s.postarNott ??
            Array(TIMAR_NOTT.length).fill("")) as Postur[],
        }));
    }
    return virkStarfsfolk(grunnStarfsfolk, giltDeiltSkipulag(state.skipulag));
  }, [grunnStarfsfolk, state.skipulag, state.naeturskipulag, vaktgerd]);

  if (!stjori) {
    return (
      <div>
        <PageHeader titill="Skipulagsgerð" undirtitill="Aðeins fyrir vaktstjóra" />
        <p className="p-6 text-center text-sm text-slate-500">
          Aðeins vaktstjóri og aðstoðarvaktstjóri hafa aðgang að Skipulagsgerð.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader titill="Skipulagsgerð" undirtitill="Slembiraðað vaktaplan" />

      <div className="space-y-4 p-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm text-slate-600">
            Velja vaktstjóra og aðstoðarvaktstjóra dagsins. Þeir taka ekki
            þátt í slembiröðuninni hér fyrir neðan.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Vaktstjóri</span>
              <select
                value={vardstjoriId}
                onChange={(e) => setVardstjoriId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
              >
                {VALDIR_STJORAR.map((id) => (
                  <option key={id} value={id}>
                    {VAKT.starfsfolk.find((s) => s.id === id)?.nafn ?? id}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">
                Aðstoðarvaktstjóri
              </span>
              <select
                value={adstodarvardstjoriId}
                onChange={(e) => setAdstodarvardstjoriId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
              >
                {VALDIR_STJORAR.map((id) => (
                  <option key={id} value={id}>
                    {VAKT.starfsfolk.find((s) => s.id === id)?.nafn ?? id}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-brand/20 bg-white p-4 shadow-sm ring-1 ring-brand/10">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-brand">Næsta plan</p>
            <p className="mt-1 text-sm text-slate-600">
              Sjálfgefið er morgundagurinn og næsta vakt eftir síðustu plangerð.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[180px_1fr_180px]">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Dagsetning</span>
              <input
                type="date"
                value={dags}
                onChange={(e) => setDags(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
              />
            </label>

            <div>
              <span className="mb-1 block text-xs font-semibold text-slate-500">Vaktgerð</span>
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => setVaktgerd("dagur")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold ${
                    vaktgerd === "dagur" ? "bg-brand text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  <IconSun className="h-4 w-4" /> Dagvakt
                </button>
                <button
                  onClick={() => setVaktgerd("nott")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold ${
                    vaktgerd === "nott" ? "bg-brand text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  <IconMoon className="h-4 w-4" /> Næturvakt
                </button>
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Vakt</span>
              <select
                value={valinVakt?.id ?? ""}
                onChange={(e) => setValinVaktId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
              >
                {state.vaktir.map((v) => (
                  <option key={v.id} value={v.id}>
                    Vakt {v.nafn}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Vakt og mæting – velja hvaða vakt tekur við og hverjir eru mættir. */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm text-slate-600">
            Hakaðu við hverjir eru mættir á vakt {valinVakt?.nafn ?? "?"} {dags.split("-").reverse().join(".")}.
            Afhakaðu þá sem eru fjarverandi – aðeins mættir taka þátt í slembiröðuninni.
          </p>

          {valinVakt && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Mæting ({valinVakt.medlimir.filter((m) => !erFjarverandi(m.id)).length}/
                  {valinVakt.medlimir.length})
                </span>
                <button
                  onClick={() => setVaktFjarvist(valinVakt.id, [])}
                  className="text-xs font-semibold text-brand active:underline"
                >
                  Velja alla
                </button>
              </div>
              {valinVakt.medlimir.length === 0 ? (
                <p className="text-xs text-slate-400">Engir á þessari vakt enn.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-1.5">
                  {valinVakt.medlimir.map((m) => {
                    const mettur = !erFjarverandi(m.id);
                    return (
                      <li key={m.id}>
                        <label
                          className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-sm ${
                            mettur ? "border-brand/40 bg-brand/5" : "border-slate-200 bg-slate-50 text-slate-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={mettur}
                            onChange={(e) => setjaMaetingu(m.id, e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-brand"
                          />
                          <span className="truncate">{m.nafn}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm text-slate-600">
            Býr til nýtt slembiraðað plan: tveir hópar á hvern 6 tíma
            helming. Hópur A (allt að 6) rúllar klukkustund fyrir klukkustund
            í gegnum Norður, DMA CCTV, Flughlað, Landside, CCTV og Afleysingu
            – hver fær Afleysingu nákvæmlega 1 klst. Hópur B fær samfellda
            Schengen-vakt (1 maður) og rúllar DMA/Verkefni klukkustund fyrir
            klukkustund, mest 2 klst. samfleytt á DMA – engin Afleysing í
            þeim hópi. Hóparnir skiptast á milli helminga.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const plan = gerdaSlembidSkipulag(grunnStarfsfolk, vaktgerd, [
                  vardstjoriId,
                  adstodarvardstjoriId,
                ]);
                if (vaktgerd === "nott") setNaeturskipulag(plan, dags);
                else setSkipulag(plan, dags);
                munaValdaPlangerd();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white active:bg-brand-dark"
            >
              <IconShuffle className="h-4 w-4" /> Slembiraða nýju plani
            </button>
            {(vaktgerd === "nott" ? state.naeturskipulag : state.skipulag) && (
              <button
                onClick={() => (vaktgerd === "nott" ? setNaeturskipulag(null) : setSkipulag(null))}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-500 active:bg-slate-50"
              >
                Núllstilla
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm text-slate-600">
            Hlaða upp mynd af nýjasta planinu (t.d. ljósmynd af pappírsplani)
            – AI les myndina og setur planið inn sjálfkrafa fyrir{" "}
            <b>{vaktgerd === "nott" ? "næturvaktina" : "dagvaktina"}</b> (veldu
            dag/nótt að ofan). Planið birtist þá öllum á Heim, án þess að
            uppfæra þurfi forritið.
          </p>
          <input
            ref={skraInntak}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={velMynd}
          />
          <button
            onClick={() => skraInntak.current?.click()}
            disabled={hladaUpp}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand px-4 py-3 text-sm font-semibold text-brand active:bg-brand/5 disabled:opacity-50"
          >
            <IconCamera className="h-4 w-4" />
            {hladaUpp ? "Les mynd…" : "Hlaða upp mynd af plani"}
          </button>
          {uppVilla && <p className="mt-2 text-sm text-red-600">{uppVilla}</p>}
        </div>

        {(() => {
          const planDags = vaktgerd === "nott" ? state.naeturskipulagDags : state.skipulagDags;
          return planDags ? (
            <p className="text-center text-sm font-semibold text-slate-600">
              {vaktgerd === "nott" ? "Næturvakt" : "Dagvakt"}:{" "}
              {planDags.split("-").reverse().join(".")}
            </p>
          ) : null;
        })()}

        <SkipulagTafla starfsfolk={starfsfolk} vakt={vakt} timar={timar} helmingur={0} titill={`Fyrri hluti (${timar[0]}–${timar[HELMINGUR]})`} />
        <SkipulagTafla starfsfolk={starfsfolk} vakt={vakt} timar={timar} helmingur={1} titill={`Seinni hluti (${timar[HELMINGUR]}–${timar[timar.length - 1]})`} />
      </div>
    </div>
  );
}

const HELMINGUR = TIMAR.length / 2;

function SkipulagTafla({
  starfsfolk,
  vakt,
  timar,
  helmingur,
  titill,
}: {
  starfsfolk: (Starfsmadur & { postar: Postur[] })[];
  vakt: Vakt;
  timar: string[];
  helmingur: 0 | 1;
  titill: string;
}) {
  const dalkar = timar.slice(helmingur * HELMINGUR, helmingur * HELMINGUR + HELMINGUR);

  const radir = starfsfolk.map((s) => ({
    s,
    stjori: erVaktstjori(s.nafn, vakt),
    postarHelmingur: s.postar.slice(helmingur * HELMINGUR, helmingur * HELMINGUR + HELMINGUR),
  }));

  // Vaktstjórar fyrst, svo langir póstar (Schengen/DMA/Verkefni), svo stuttir.
  const flokkadar = [...radir].sort((a, b) => {
    const flokkur = (r: typeof a) => (r.stjori ? 0 : erILongumPostum(r.postarHelmingur) ? 1 : 2);
    return flokkur(a) - flokkur(b);
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
        {titill}
      </p>
      <table className="min-w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-brand text-white">
            <th className="sticky left-0 z-10 bg-brand px-2 py-2 text-left font-semibold">
              Starfsmaður
            </th>
            {dalkar.map((t) => (
              <th key={t} className="px-1.5 py-2 font-semibold">
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {flokkadar.map(({ s, stjori, postarHelmingur }) => {
            const stjoriHeiti =
              s.nafn === vakt.vardstjori ? "Vaktstjóri" : "Aðstoðarvaktstjóri";
            return (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1.5 font-medium text-slate-700">
                  {s.nafn}
                </td>
                {sameinaPosta(postarHelmingur).map((bil, k) => (
                  <td
                    key={k}
                    colSpan={bil.fjoldi}
                    className={`whitespace-nowrap px-1.5 py-1.5 text-center ${
                      stjori ? "bg-brand/10 text-brand" : POSTUR_LITUR[bil.postur] ?? ""
                    }`}
                  >
                    {stjori ? stjoriHeiti : bil.postur || "—"}
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
