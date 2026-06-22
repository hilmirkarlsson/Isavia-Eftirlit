"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { DmaStada } from "./data/dma";
import { SudurStada } from "./data/sudur";
import { Verkefni } from "./data/verkefni";
import { Skipulag } from "./skipulagsgerd";
import { FylgdEntry, FylgdFlokkur, SJALFGEFNIR_FYLGDFLOKKAR } from "./data/fylgdir";

// Rauntímageymsla í vafranum (localStorage). Heldur utan um innskráðan
// notanda og stöðu sem vaktin uppfærir. Enginn bakvinnsla nauðsynleg.

export type VerkefniStada = "ekki-byrjad" | "i-gangi" | "lokid";

/** Gildi Ytri aðilar eyðublaðsins (gátlisti + athugasemd). */
export type YtriAdilarGogn = {
  reitir: Record<string, boolean>;
  athugasemd: string;
};

/** Staða hliðs í Suður ásamt því hver snéri því og hvenær. */
export type SudurFaersla = {
  stada: SudurStada;
  af: string; // nafn þess sem snéri
  kl: string; // ISO tími
};

type EftirlitState = {
  notandi: string | null; // id starfsmanns
  threp: Record<string, Record<string, boolean>>; // verkefniId -> threpId -> hakað
  verkefniStada: Record<string, VerkefniStada>; // verkefniId -> staða
  ytriAdilar: Record<string, YtriAdilarGogn>; // verkefniId -> eyðublað
  dma: Record<string, DmaStada>; // dmaId -> staða
  sudur: Record<string, SudurFaersla>; // sudurId -> staða + hver snéri
  dagur: string; // YYYY-MM-DD (til að núllstilla daglega)
  skipulag: Skipulag | null; // slembiraðað vaktaplan frá Skipulagsgerð
  verkefniYfirskrift: Record<string, Partial<Verkefni>>; // verkefniId -> breytingar vaktstjóra
  fylgdFlokkar: FylgdFlokkur[]; // pax / crew / töskur / sérsniðnir flokkar
  fylgdEntries: FylgdEntry[]; // úthlutanir á póstum á fylgdarflokka
};

const TOMT: EftirlitState = {
  notandi: null,
  threp: {},
  verkefniStada: {},
  ytriAdilar: {},
  dma: {},
  sudur: {},
  dagur: "",
  skipulag: null,
  verkefniYfirskrift: {},
  fylgdFlokkar: SJALFGEFNIR_FYLGDFLOKKAR,
  fylgdEntries: [],
};

const LYKILL = "eftirlit-kef-v3";

function idag(): string {
  return new Date().toISOString().slice(0, 10);
}

type Ctx = {
  state: EftirlitState;
  hladid: boolean;
  setNotandi: (id: string | null) => void;
  setThrep: (verkefniId: string, threpId: string, gildi: boolean) => void;
  setVerkefniStada: (verkefniId: string, stada: VerkefniStada) => void;
  setYtriAdilarReitur: (verkefniId: string, reitur: string, gildi: boolean) => void;
  setYtriAdilarAthugasemd: (verkefniId: string, texti: string) => void;
  setDma: (id: string, stada: DmaStada) => void;
  setSudur: (id: string, stada: SudurStada, af: string) => void;
  setSkipulag: (skipulag: Skipulag | null) => void;
  setVerkefniYfirskrift: (verkefniId: string, breyting: Partial<Verkefni>) => void;
  addFylgdFlokkur: (nafn: string) => void;
  addFylgdEntry: (flokkurId: string) => void;
  setFylgdEntryStarfsmadur: (entryId: string, starfsmadurId: string | null) => void;
  setFylgdEntryAthugasemd: (entryId: string, texti: string) => void;
  fjarlaegjaFylgdEntry: (entryId: string) => void;
};

const EftirlitContext = createContext<Ctx | null>(null);

export function EftirlitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EftirlitState>(TOMT);
  const [hladid, setHladid] = useState(false);

  useEffect(() => {
    let next: EftirlitState = { ...TOMT, dagur: idag() };
    try {
      const raw = localStorage.getItem(LYKILL);
      if (raw) {
        const parsed = JSON.parse(raw) as EftirlitState;
        next = { ...TOMT, ...parsed };
        // Núllstilla dagleg gögn (þrep + verkefnastöðu) á nýjum degi.
        if (parsed.dagur !== idag()) {
          next.threp = {};
          next.verkefniStada = {};
          next.ytriAdilar = {};
          next.dagur = idag();
        }
      }
    } catch {
      /* nota TOMT */
    }
    setState(next);
    setHladid(true);
  }, []);

  useEffect(() => {
    if (!hladid) return;
    try {
      localStorage.setItem(LYKILL, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hladid]);

  const ctx: Ctx = {
    state,
    hladid,
    setNotandi: (id) => setState((s) => ({ ...s, notandi: id })),
    setThrep: (verkefniId, threpId, gildi) =>
      setState((s) => ({
        ...s,
        threp: {
          ...s.threp,
          [verkefniId]: { ...(s.threp[verkefniId] ?? {}), [threpId]: gildi },
        },
      })),
    setVerkefniStada: (verkefniId, stada) =>
      setState((s) => ({
        ...s,
        verkefniStada: { ...s.verkefniStada, [verkefniId]: stada },
      })),
    setYtriAdilarReitur: (verkefniId, reitur, gildi) =>
      setState((s) => {
        const fyrir = s.ytriAdilar[verkefniId] ?? { reitir: {}, athugasemd: "" };
        return {
          ...s,
          ytriAdilar: {
            ...s.ytriAdilar,
            [verkefniId]: { ...fyrir, reitir: { ...fyrir.reitir, [reitur]: gildi } },
          },
        };
      }),
    setYtriAdilarAthugasemd: (verkefniId, texti) =>
      setState((s) => {
        const fyrir = s.ytriAdilar[verkefniId] ?? { reitir: {}, athugasemd: "" };
        return {
          ...s,
          ytriAdilar: { ...s.ytriAdilar, [verkefniId]: { ...fyrir, athugasemd: texti } },
        };
      }),
    setDma: (id, stada) => setState((s) => ({ ...s, dma: { ...s.dma, [id]: stada } })),
    setSudur: (id, stada, af) =>
      setState((s) => ({
        ...s,
        sudur: { ...s.sudur, [id]: { stada, af, kl: new Date().toISOString() } },
      })),
    setSkipulag: (skipulag) => setState((s) => ({ ...s, skipulag })),
    setVerkefniYfirskrift: (verkefniId, breyting) =>
      setState((s) => ({
        ...s,
        verkefniYfirskrift: {
          ...s.verkefniYfirskrift,
          [verkefniId]: { ...(s.verkefniYfirskrift[verkefniId] ?? {}), ...breyting },
        },
      })),
    addFylgdFlokkur: (nafn) =>
      setState((s) => ({
        ...s,
        fylgdFlokkar: [...s.fylgdFlokkar, { id: `flokkur-${Date.now()}`, nafn }],
      })),
    addFylgdEntry: (flokkurId) =>
      setState((s) => ({
        ...s,
        fylgdEntries: [
          ...s.fylgdEntries,
          { id: `fylgd-${Date.now()}`, flokkurId, starfsmadurId: null, athugasemd: "" },
        ],
      })),
    setFylgdEntryStarfsmadur: (entryId, starfsmadurId) =>
      setState((s) => ({
        ...s,
        fylgdEntries: s.fylgdEntries.map((e) =>
          e.id === entryId ? { ...e, starfsmadurId } : e
        ),
      })),
    setFylgdEntryAthugasemd: (entryId, texti) =>
      setState((s) => ({
        ...s,
        fylgdEntries: s.fylgdEntries.map((e) =>
          e.id === entryId ? { ...e, athugasemd: texti } : e
        ),
      })),
    fjarlaegjaFylgdEntry: (entryId) =>
      setState((s) => ({
        ...s,
        fylgdEntries: s.fylgdEntries.filter((e) => e.id !== entryId),
      })),
  };

  return <EftirlitContext.Provider value={ctx}>{children}</EftirlitContext.Provider>;
}

export function useEftirlit(): Ctx {
  const ctx = useContext(EftirlitContext);
  if (!ctx) throw new Error("useEftirlit verður að nota innan EftirlitProvider");
  return ctx;
}
