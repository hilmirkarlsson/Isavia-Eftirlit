// Suður – hlið og Schengen / non-Schengen uppstilling á Keflavíkurflugvelli.
//
// Eftirlit snýr hliðum milli Schengen og non-Schengen eftir áætlun.
//
// Tvær gerðir hliða:
//  - "hlid"      : venjuleg landgangshlið (contact gates).
//  - "rutuhlid"  : rútuhlið 24–29 – farþegar fara með rútu út á stæði.
//                  Þessi hlið þarf sérstaklega að vakta og snúa.
//
// ATH: Flug Icelandair (flugnúmer sem byrja á "FI") eru UNDANSKILIN –
// Icelandair sér sjálft um að snúa þeim hliðum.
//
// ATH: Listinn er besta ágiskun. Leiðréttið hvaða hlið tilheyra Suður,
// hver eru rútuhlið og hver eru snúanleg.

export type SudurStada = "schengen" | "non-schengen" | "snua";
export type SudurGerd = "hlid" | "rutuhlid";

export type SudurHlid = {
  id: string;
  heiti: string;
  numer: number;
  gerd: SudurGerd;
  /** Hægt að snúa milli Schengen og non-Schengen. */
  snuanlegt: boolean;
  sjalfgefid: SudurStada;
};

export const SUDUR_STODUR: Record<SudurStada, { titill: string; lysing: string }> = {
  schengen: { titill: "Schengen", lysing: "Hlið stillt fyrir Schengen flug." },
  "non-schengen": { titill: "Non-Schengen", lysing: "Hlið stillt fyrir non-Schengen flug." },
  snua: { titill: "Verið að snúa", lysing: "Verið að snúa hliðinu milli Schengen og non-Schengen." },
};

/** Hin staðan (til að snúa á milli). */
export function hinStadan(stada: SudurStada): SudurStada {
  return stada === "schengen" ? "non-schengen" : "schengen";
}

export const SUDUR_HLID: SudurHlid[] = [
  // --- Venjuleg landgangshlið (snúanleg) ---
  { id: "g21", heiti: "21", numer: 21, gerd: "hlid", snuanlegt: true, sjalfgefid: "schengen" },
  { id: "g22", heiti: "22", numer: 22, gerd: "hlid", snuanlegt: true, sjalfgefid: "schengen" },
  { id: "g23", heiti: "23", numer: 23, gerd: "hlid", snuanlegt: true, sjalfgefid: "schengen" },
  { id: "g31", heiti: "31", numer: 31, gerd: "hlid", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "g32", heiti: "32", numer: 32, gerd: "hlid", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "g33", heiti: "33", numer: 33, gerd: "hlid", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "g34", heiti: "34", numer: 34, gerd: "hlid", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "g35", heiti: "35", numer: 35, gerd: "hlid", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "g36", heiti: "36", numer: 36, gerd: "hlid", snuanlegt: true, sjalfgefid: "non-schengen" },

  // --- Rútuhlið 24–29 (bus gates) ---
  { id: "g24", heiti: "24", numer: 24, gerd: "rutuhlid", snuanlegt: true, sjalfgefid: "schengen" },
  { id: "g25", heiti: "25", numer: 25, gerd: "rutuhlid", snuanlegt: true, sjalfgefid: "schengen" },
  { id: "g26", heiti: "26", numer: 26, gerd: "rutuhlid", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "g27", heiti: "27", numer: 27, gerd: "rutuhlid", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "g28", heiti: "28", numer: 28, gerd: "rutuhlid", snuanlegt: true, sjalfgefid: "non-schengen" },
  { id: "g29", heiti: "29", numer: 29, gerd: "rutuhlid", snuanlegt: true, sjalfgefid: "non-schengen" },
];

/** Er hliðið rútuhlið (24–29)? */
export function erRutuhlid(h: SudurHlid): boolean {
  return h.gerd === "rutuhlid";
}
