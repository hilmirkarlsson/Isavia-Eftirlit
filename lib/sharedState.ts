// Sameiginlegt vaktaástand – tegundir og hjálparföll sem bæði þjónninn
// (/api/state) og vafrinn (store.tsx) nota. Þetta er það ástand sem á að
// vera EINS á öllum tækjum (ólíkt `notandi` sem er per tæki).

import { DmaStada } from "./data/dma";
import { SudurStada } from "./data/sudur";
import { Skipulag } from "./skipulagsgerd";
import { Fylgd } from "./data/fylgdir";
import { VaktSkraning } from "./data/vaktir";

export type VerkefniStada = "ekki-byrjad" | "i-gangi" | "lokid";

export type VerkefniFaersla = {
  id: string;
  nafn: string;
  kl: string;
};

export type VerkefniVinna = {
  byrjad?: VerkefniFaersla;
  lokid?: VerkefniFaersla;
  sidast?: VerkefniFaersla;
};

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

/** Skilaboð/minnispunktur milli vakta (vaktaskýrsla). */
export type Vaktnota = {
  id: string;
  texti: string;
  af: string; // nafn höfundar
  kl: string; // ISO tími
};

/** Allt sameiginlegt ástand sem samstillist milli tækja. */
export type SharedState = {
  threp: Record<string, Record<string, boolean>>;
  verkefniStada: Record<string, VerkefniStada>;
  verkefniVinna: Record<string, VerkefniVinna>;
  ytriAdilar: Record<string, YtriAdilarGogn>;
  dma: Record<string, DmaStada>;
  sudur: Record<string, SudurFaersla>;
  skipulag: Skipulag | null;
  naeturskipulag: Skipulag | null;
  /** Dagsetning sem planið á við (ISO, valin við slembiröðun). */
  skipulagDags: string | null;
  naeturskipulagDags: string | null;
  fylgdir: Fylgd[];
  vaktir: VaktSkraning[];
  /**
   * Fjarverandi meðlimir per vakt: id vaktar → listi meðlima-id sem eru
   * fjarverandi (ekki á vaktinni í dag/nótt). Geymt svo mætingarvalið haldist
   * milli tækja OG milli vakta (næsta plan man hverjir voru á síðasta). Þeir
   * sem eru fjarverandi birtast ekki í skipulaginu (hvorki hér né á Heim).
   */
  fjarvist: Record<string, string[]>;
  vaktnotur: Vaktnota[];
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
  "verkefniVinna",
  "ytriAdilar",
  "fylgdir",
  "vaktir",
  "fjarvist",
  "vaktnotur",
  "skipulag",
  "naeturskipulag",
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
    verkefniVinna: {},
    ytriAdilar: {},
    dma: {},
    sudur: {},
    skipulag: null,
    naeturskipulag: null,
    skipulagDags: null,
    naeturskipulagDags: null,
    fylgdir: [],
    vaktir: [],
    fjarvist: {},
    vaktnotur: [],
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
  const skipulagRod = (radir.skipulag ?? {}) as { skipulag?: Skipulag | null; dags?: string | null };
  const naeturRod = (radir.naeturskipulag ?? {}) as { skipulag?: Skipulag | null; dags?: string | null };

  return {
    dma: (radir.dma ?? {}) as SharedState["dma"],
    sudur: (radir.sudur ?? {}) as SharedState["sudur"],
    threp: (radir.threp ?? {}) as SharedState["threp"],
    verkefniStada: (radir.verkefniStada ?? {}) as SharedState["verkefniStada"],
    verkefniVinna: (radir.verkefniVinna ?? {}) as SharedState["verkefniVinna"],
    ytriAdilar: (radir.ytriAdilar ?? {}) as SharedState["ytriAdilar"],
    fylgdir: Array.isArray(radir.fylgdir) ? (radir.fylgdir as Fylgd[]) : [],
    vaktir: Array.isArray(radir.vaktir) ? (radir.vaktir as VaktSkraning[]) : [],
    fjarvist: (radir.fjarvist ?? {}) as SharedState["fjarvist"],
    vaktnotur: Array.isArray(radir.vaktnotur) ? (radir.vaktnotur as Vaktnota[]) : [],
    skipulag: skipulagRod.skipulag ?? null,
    naeturskipulag: naeturRod.skipulag ?? null,
    skipulagDags: skipulagRod.dags ?? null,
    naeturskipulagDags: naeturRod.dags ?? null,
    vardstjoriId: settings.vardstjoriId ?? null,
    adstodarvardstjoriId: settings.adstodarvardstjoriId ?? null,
    dagur: meta.dagur ?? dagur,
  };
}
