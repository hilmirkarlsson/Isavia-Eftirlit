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
import { Skipulag } from "./skipulagsgerd";
import { Fylgd } from "./data/fylgdir";

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
  fylgdir: Fylgd[]; // nafngreindir fylgdarhópar tengdir flugi
  vardstjoriId: string | null; // valinn vaktstjóri dagsins (null = sjálfgefið úr VAKT)
  adstodarvardstjoriId: string | null; // valinn aðstoðarvaktstjóri dagsins
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
  fylgdir: [],
  vardstjoriId: null,
  adstodarvardstjoriId: null,
};

const LYKILL = "eftirlit-kef-v4";

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
  setVardstjoriId: (id: string | null) => void;
  setAdstodarvardstjoriId: (id: string | null) => void;
  addFylgd: (nafn: string) => void;
  setFylgdNafn: (fylgdId: string, nafn: string) => void;
  setFylgdTegund: (fylgdId: string, tegund: string) => void;
  addFylgdStarfsmadur: (fylgdId: string, starfsmadurId: string) => void;
  fjarlaegjaFylgdStarfsmadur: (fylgdId: string, starfsmadurId: string) => void;
  setFylgdTimi: (fylgdId: string, timi: string) => void;
  setFylgdFlug: (fylgdId: string, flugId: string | null, flugnumer: string | null) => void;
  fjarlaegjaFylgd: (fylgdId: string) => void;
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
    setVardstjoriId: (id) => setState((s) => ({ ...s, vardstjoriId: id })),
    setAdstodarvardstjoriId: (id) => setState((s) => ({ ...s, adstodarvardstjoriId: id })),
    addFylgd: (nafn) =>
      setState((s) => ({
        ...s,
        fylgdir: [
          ...s.fylgdir,
          { id: `fylgd-${Date.now()}`, nafn, tegund: "", starfsmenn: [], timi: "" },
        ],
      })),
    setFylgdNafn: (fylgdId, nafn) =>
      setState((s) => ({
        ...s,
        fylgdir: s.fylgdir.map((f) => (f.id === fylgdId ? { ...f, nafn } : f)),
      })),
    setFylgdTegund: (fylgdId, tegund) =>
      setState((s) => ({
        ...s,
        fylgdir: s.fylgdir.map((f) => (f.id === fylgdId ? { ...f, tegund } : f)),
      })),
    addFylgdStarfsmadur: (fylgdId, starfsmadurId) =>
      setState((s) => ({
        ...s,
        fylgdir: s.fylgdir.map((f) =>
          f.id === fylgdId && !f.starfsmenn.includes(starfsmadurId)
            ? { ...f, starfsmenn: [...f.starfsmenn, starfsmadurId] }
            : f
        ),
      })),
    fjarlaegjaFylgdStarfsmadur: (fylgdId, starfsmadurId) =>
      setState((s) => ({
        ...s,
        fylgdir: s.fylgdir.map((f) =>
          f.id === fylgdId
            ? { ...f, starfsmenn: f.starfsmenn.filter((id) => id !== starfsmadurId) }
            : f
        ),
      })),
    setFylgdTimi: (fylgdId, timi) =>
      setState((s) => ({
        ...s,
        fylgdir: s.fylgdir.map((f) => (f.id === fylgdId ? { ...f, timi } : f)),
      })),
    setFylgdFlug: (fylgdId, flugId, flugnumer) =>
      setState((s) => ({
        ...s,
        fylgdir: s.fylgdir.map((f) =>
          f.id === fylgdId
            ? { ...f, flugId: flugId ?? undefined, flugnumer: flugnumer ?? undefined }
            : f
        ),
      })),
    fjarlaegjaFylgd: (fylgdId) =>
      setState((s) => ({
        ...s,
        fylgdir: s.fylgdir.filter((f) => f.id !== fylgdId),
      })),
  };

  return <EftirlitContext.Provider value={ctx}>{children}</EftirlitContext.Provider>;
}

export function useEftirlit(): Ctx {
  const ctx = useContext(EftirlitContext);
  if (!ctx) throw new Error("useEftirlit verður að nota innan EftirlitProvider");
  return ctx;
}
