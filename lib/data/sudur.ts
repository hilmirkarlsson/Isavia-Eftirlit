// Suður – hlið og Schengen / non-Schengen uppstilling.
//
// Eftirlit sér um að snúa hliðum milli Schengen og non-Schengen EFTIR
// því sem áætlun segir til um. ATH: Flug Icelandair (flugnúmer sem byrja
// á "FI") eru UNDANSKILIN – Icelandair sér sjálft um að snúa þeim hliðum.
//
// ATH: Listinn er besta ágiskun út frá FIDS skjámyndum. Leiðréttið hvaða
// hlið tilheyra Suður og hver eru snúanleg.

export type SudurStada = "schengen" | "non-schengen" | "snua";

export type SudurHlid = {
  id: string;
  heiti: string;
  /** Hægt að snúa milli Schengen og non-Schengen. */
  snuanlegt: boolean;
  sjalfgefid: SudurStada;
};

export const SUDUR_STODUR: Record<SudurStada, { titill: string; lysing: string }> = {
  schengen: { titill: "Schengen", lysing: "Hlið stillt fyrir Schengen flug." },
  "non-schengen": { titill: "Non-Schengen", lysing: "Hlið stillt fyrir non-Schengen flug." },
  snua: { titill: "Verið að snúa", lysing: "Verið að snúa hliðinu milli Schengen og non-Schengen." },
};

export const SUDUR_HLID: SudurHlid[] = [
  { id: "d21", heiti: "D21", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "d22", heiti: "D22", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "d23", heiti: "D23", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "d25", heiti: "D25", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "d28", heiti: "D28", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "d31", heiti: "D31", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "d33", heiti: "D33", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "d35", heiti: "D35", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "c22", heiti: "C22", snuanlegt: false, sjalfgefid: "schengen" },
  { id: "c23", heiti: "C23", snuanlegt: false, sjalfgefid: "schengen" },
  { id: "c32", heiti: "C32", snuanlegt: false, sjalfgefid: "schengen" },
  { id: "c34", heiti: "C34", snuanlegt: false, sjalfgefid: "schengen" },
];
