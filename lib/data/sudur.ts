// Suður – hlið í suðurbyggingu og staða þeirra gagnvart Schengen /
// non-Schengen. Sum hlið er hægt að "snúa" (turn around) milli svæða
// eftir áætlun. Staðan er geymd í vafranum (localStorage).
//
// ATH: Hliðin hér eru sýnigögn. Breytið listanum svo hann passi við
// raunveruleg hlið suðurbyggingar.

export type SudurHlid = {
  id: string;
  /** Birtingarheiti hliðs, t.d. "D1". */
  heiti: string;
  /** Hvort hægt sé að snúa hliðinu milli Schengen og non-Schengen. */
  snuanlegt: boolean;
  /** Sjálfgefin staða þegar ekkert hefur verið stillt. */
  sjalfgefid: SudurStada;
};

export type SudurStada = "schengen" | "non-schengen" | "snua";

export const SUDUR_STODUR: Record<SudurStada, { titill: string; lysing: string }> = {
  schengen: {
    titill: "Schengen",
    lysing: "Hlið stillt fyrir Schengen flug.",
  },
  "non-schengen": {
    titill: "Non-Schengen",
    lysing: "Hlið stillt fyrir non-Schengen flug.",
  },
  snua: {
    titill: "Verið að snúa",
    lysing: "Verið að snúa hliðinu milli Schengen og non-Schengen.",
  },
};

export const SUDUR_HLID: SudurHlid[] = [
  { id: "d1", heiti: "D1", snuanlegt: true, sjalfgefid: "schengen" },
  { id: "d2", heiti: "D2", snuanlegt: true, sjalfgefid: "schengen" },
  { id: "d3", heiti: "D3", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "d4", heiti: "D4", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "d5", heiti: "D5", snuanlegt: false, sjalfgefid: "schengen" },
  { id: "d6", heiti: "D6", snuanlegt: false, sjalfgefid: "schengen" },
  { id: "d7", heiti: "D7", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "d8", heiti: "D8", snuanlegt: false, sjalfgefid: "non-schengen" },
];
