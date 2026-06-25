"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

// Ljós/dökk stilling. Valið geymist per tæki í localStorage. Sjálfgefið fer
// eftir kerfisstillingu símans (prefers-color-scheme) þar til notandi velur
// sjálfur. `dark`-klasinn er settur á <html> svo CSS-yfirskriftirnar í
// globals.css virki á öllu forritinu.

type Tema = "light" | "dark";
const LYKILL = "eftirlit-kef-tema";

type Ctx = { tema: Tema; setTema: (t: Tema) => void; vixla: () => void };
const TemaContext = createContext<Ctx | null>(null);

function virkja(t: Tema) {
  const rot = document.documentElement;
  if (t === "dark") rot.classList.add("dark");
  else rot.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>("light");

  // Lesa upphafsgildi (sama rökvísi og forskriftin í <head>) við fyrstu teikningu.
  useEffect(() => {
    let valid: Tema;
    try {
      const vistad = localStorage.getItem(LYKILL) as Tema | null;
      valid =
        vistad === "dark" || vistad === "light"
          ? vistad
          : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    } catch {
      valid = "light";
    }
    setTemaState(valid);
    virkja(valid);
  }, []);

  const setTema = useCallback((t: Tema) => {
    setTemaState(t);
    virkja(t);
    try {
      localStorage.setItem(LYKILL, t);
    } catch {
      /* ignore */
    }
  }, []);

  const vixla = useCallback(
    () => setTema(document.documentElement.classList.contains("dark") ? "light" : "dark"),
    [setTema]
  );

  return <TemaContext.Provider value={{ tema, setTema, vixla }}>{children}</TemaContext.Provider>;
}

export function useTema(): Ctx {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error("useTema verður að nota innan ThemeProvider");
  return ctx;
}

// Forskrift sem keyrir FYRIR fyrstu teikningu svo dökk stilling blikki ekki
// ljós í örskotsstund (FOUC). Sett í <head> í layout.
export const TEMA_FORSKRIFT = `(function(){try{var t=localStorage.getItem('${LYKILL}');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;
