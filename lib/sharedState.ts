// Sameiginlegt vaktaástand – tegundir og hjálparföll sem bæði þjónninn
// (/api/state) og vafrinn (store.tsx) nota. Þetta er það ástand sem á að
// vera EINS á öllum tækjum (ólíkt `notandi` sem er per tæki).

import { DmaStada } from "./data/dma";
import { SudurStada } from "./data/sudur";
import { Skipulag } from "./skipulagsgerd";
import { Fylgd } from "./data/fylgdir";

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

/** Allt sameiginlegt ástand sem samstillist milli tækja. */
export type SharedState = {
  threp: Record<string, Record<string, boolean>>;
  verkefniStada: Record<string, VerkefniStada>;
  ytriAdilar: Record<string, YtriAdilarGogn>;
  dma: Record<string, DmaStada>;
  sudur: Record<string, SudurFaersla>;
  skipulag: Skipulag | null;
  fylgdir: Fylgd[];
  vardstjoriId: string | null;
  adstodarvardstjoriId: string | null;
  dagur: string;
};

/** Lyklar (raðir) í shared_state töflunni. */
export const SHARED_KEYS = [
  "dma",
  "sudur",
  "threp",
  "verkefniStada",
  "ytriAdilar",
  "fylgdir",
  "skipulag",
  "settings",
  "meta",
] as const;

export type SharedKey = (typeof SHARED_KEYS)[number];

/** Skrifaðgerð sem vafrinn sendir á /api/state. */
export type StateOp =
  | { key: SharedKey; op: "merge"; value: Record<string, unknown> }
  | { key: SharedKey; op: "set"; value: unknown };

/** Tóma byrjunarástandið. */
export function tomtSharedState(dagur: string): SharedState {
  return {
    threp: {},
    verkefniStada: {},
    ytriAdilar: {},
    dma: {},
    sudur: {},
    skipulag: null,
    fylgdir: [],
    vardstjoriId: null,
    adstodarvardstjoriId: null,
    dagur,
  };
}

/** Setur saman SharedState úr hráu key→value korti úr töflunni. */
export function setjaSamanShared(
  radir: Record<string, unknown>,
  dagur: string
): SharedState {
  const settings = (radir.settings ?? {}) as {
    vardstjoriId?: string | null;
    adstodarvardstjoriId?: string | null;
  };
  const meta = (radir.meta ?? {}) as { dagur?: string };
  const skipulagRod = (radir.skipulag ?? {}) as { skipulag?: Skipulag | null };

  return {
    dma: (radir.dma ?? {}) as SharedState["dma"],
    sudur: (radir.sudur ?? {}) as SharedState["sudur"],
    threp: (radir.threp ?? {}) as SharedState["threp"],
    verkefniStada: (radir.verkefniStada ?? {}) as SharedState["verkefniStada"],
    ytriAdilar: (radir.ytriAdilar ?? {}) as SharedState["ytriAdilar"],
    fylgdir: Array.isArray(radir.fylgdir) ? (radir.fylgdir as Fylgd[]) : [],
    skipulag: skipulagRod.skipulag ?? null,
    vardstjoriId: settings.vardstjoriId ?? null,
    adstodarvardstjoriId: settings.adstodarvardstjoriId ?? null,
    dagur: meta.dagur ?? dagur,
  };
}
