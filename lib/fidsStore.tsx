"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { FidsSvar } from "./fids";

// Sameiginleg FIDS gögn fyrir allar síður – einn fetch/tímamælir í stað
// þess að hver síða (heim, flug, dma, suður) sæki sjálf á 60s fresti.
// Þannig sjá allar síður sömu mynd af gögnum á hverjum tíma.

type FidsCtx = {
  svar: FidsSvar | null;
  nuMs: number;
  saekja: () => Promise<void>;
};

const FidsContext = createContext<FidsCtx | null>(null);

export function FidsProvider({ children }: { children: ReactNode }) {
  const [svar, setSvar] = useState<FidsSvar | null>(null);
  const [nuMs, setNuMs] = useState(() => Date.now());

  const saekja = useCallback(async () => {
    try {
      const res = await fetch("/api/fids", { cache: "no-store" });
      if (res.ok) setSvar((await res.json()) as FidsSvar);
    } catch {
      /* hunsa – síðan virkar áfram með fyrri gögn */
    }
  }, []);

  useEffect(() => {
    saekja();
    const t = setInterval(() => {
      saekja();
      setNuMs(Date.now());
    }, 60_000);
    return () => clearInterval(t);
  }, [saekja]);

  return (
    <FidsContext.Provider value={{ svar, nuMs, saekja }}>
      {children}
    </FidsContext.Provider>
  );
}

export function useFids(): FidsCtx {
  const ctx = useContext(FidsContext);
  if (!ctx) throw new Error("useFids verður að nota innan FidsProvider");
  return ctx;
}
