"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { DmaStada } from "./data/dma";
import { SudurStada } from "./data/sudur";

// Einföld rauntímageymsla í vafranum (localStorage). Þetta heldur utan um
// stöðu sem vaktin uppfærir: hakaða þrep, stöðu DMA stæða og Suður hliða.
// Engin bakvinnsla/gagnagrunnur er nauðsynlegur til að forritið virki.

type EftirlitState = {
  /** verkefniId -> threpId -> hakað? */
  threp: Record<string, Record<string, boolean>>;
  /** dmaId -> staða */
  dma: Record<string, DmaStada>;
  /** sudurId -> staða */
  sudur: Record<string, SudurStada>;
  /** Dagsetning gagnanna (YYYY-MM-DD). Notað til að núllstilla þrep daglega. */
  dagur: string;
};

const TOMT: EftirlitState = { threp: {}, dma: {}, sudur: {}, dagur: "" };
const LYKILL = "eftirlit-kef-v1";

function idag(): string {
  return new Date().toISOString().slice(0, 10);
}

type Ctx = {
  state: EftirlitState;
  hladid: boolean;
  setThrep: (verkefniId: string, threpId: string, gildi: boolean) => void;
  hreinsaThrep: (verkefniId: string) => void;
  setDma: (id: string, stada: DmaStada) => void;
  setSudur: (id: string, stada: SudurStada) => void;
  nullstillaThrepDagsins: () => void;
};

const EftirlitContext = createContext<Ctx | null>(null);

export function EftirlitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EftirlitState>(TOMT);
  const [hladid, setHladid] = useState(false);

  // Hlaða úr localStorage við ræsingu.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LYKILL);
      if (raw) {
        const parsed = JSON.parse(raw) as EftirlitState;
        // Núllstilla hökuð þrep ef nýr dagur er hafinn.
        if (parsed.dagur !== idag()) {
          parsed.threp = {};
          parsed.dagur = idag();
        }
        setState({ ...TOMT, ...parsed, dagur: parsed.dagur || idag() });
      } else {
        setState({ ...TOMT, dagur: idag() });
      }
    } catch {
      setState({ ...TOMT, dagur: idag() });
    }
    setHladid(true);
  }, []);

  // Vista í localStorage við hverja breytingu (eftir hleðslu).
  useEffect(() => {
    if (!hladid) return;
    try {
      localStorage.setItem(LYKILL, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hladid]);

  const setThrep = (verkefniId: string, threpId: string, gildi: boolean) => {
    setState((s) => ({
      ...s,
      threp: {
        ...s.threp,
        [verkefniId]: { ...(s.threp[verkefniId] ?? {}), [threpId]: gildi },
      },
    }));
  };

  const hreinsaThrep = (verkefniId: string) => {
    setState((s) => {
      const next = { ...s.threp };
      delete next[verkefniId];
      return { ...s, threp: next };
    });
  };

  const setDma = (id: string, stada: DmaStada) => {
    setState((s) => ({ ...s, dma: { ...s.dma, [id]: stada } }));
  };

  const setSudur = (id: string, stada: SudurStada) => {
    setState((s) => ({ ...s, sudur: { ...s.sudur, [id]: stada } }));
  };

  const nullstillaThrepDagsins = () => {
    setState((s) => ({ ...s, threp: {}, dagur: idag() }));
  };

  return (
    <EftirlitContext.Provider
      value={{
        state,
        hladid,
        setThrep,
        hreinsaThrep,
        setDma,
        setSudur,
        nullstillaThrepDagsins,
      }}
    >
      {children}
    </EftirlitContext.Provider>
  );
}

export function useEftirlit(): Ctx {
  const ctx = useContext(EftirlitContext);
  if (!ctx) throw new Error("useEftirlit verður að nota innan EftirlitProvider");
  return ctx;
}
