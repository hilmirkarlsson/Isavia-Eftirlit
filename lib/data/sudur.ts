// Suður – hlið og Schengen / non-Schengen uppstilling á Keflavíkurflugvelli.
//
// Tvenns konar hlið, tvenns konar staðamódel:
//  - "hlid"      : venjuleg landgangshlið (contact gates) – fimm stig:
//                  Schengen/Non-Schengen krossað við Komur/Brottför, eða
//                  "hlutlaust" (ekkert flug notar hliðið núna). Sjálfgefið
//                  er HVERT slíkt hlið "hlutlaust" – við höfum enga
//                  rauntímatengingu við Isavia til að vita með vissu hvað er
//                  í gangi á hverju hliði, svo vaktin stillir handvirkt þegar
//                  hún veit það, í stað þess að forritið giski. Þegar
//                  Isavia-bakendinn kemur (rauntíma hliðaúthlutun) getur
//                  "hlutlaust" orðið sjálfvirkt reiknað í stað sjálfgefið.
//  - "rutuhlid"  : rútuhlið 24–29 – farþegar fara með rútu út á stæði. Þau
//                  eru einfaldari: alltaf annað hvort Schengen eða
//                  Non-Schengen, ekkert hlutlaust og engin Komur/Brottför
//                  skipting (rútuhlið eru notuð samfellt í hvora áttina sem
//                  er meðan þau eru stillt á aðra hvora hliðina).
//
// ATH: Flug Icelandair (flugnúmer sem byrja á "FI") eru UNDANSKILIN –
// Icelandair sér sjálft um að snúa þeim hliðum.
//
// ATH: Listinn er besta ágiskun. Leiðréttið hvaða hlið tilheyra Suður,
// hver eru rútuhlið og hver eru snúanleg.

// Fimm stig venjulegra landgangshliða, auk tveggja hlutlausu-lausu staðanna
// sem rútuhlið nota (bara Schengen/Non-Schengen, engin átt).
export type SudurStada =
  | "schengen-komur"
  | "schengen-brottfor"
  | "non-schengen-komur"
  | "non-schengen-brottfor"
  | "hlutlaust"
  | "schengen"
  | "non-schengen";

/** Stigin sem venjuleg landgangshlið bjóða upp á (rútuhlið nota "schengen"/"non-schengen" beint). */
export const HLID_STODUR: SudurStada[] = [
  "schengen-komur",
  "schengen-brottfor",
  "non-schengen-komur",
  "non-schengen-brottfor",
  "hlutlaust",
];

export type SudurGerd = "hlid" | "rutuhlid";

export type SudurHlid = {
  id: string;
  heiti: string;
  numer: number;
  gerd: SudurGerd;
  /** Hægt að stilla milli staðanna sem eiga við þessa hliðsgerð. */
  snuanlegt: boolean;
  sjalfgefid: SudurStada;
  /** Bókstafur fyrir Schengen hlið – sjálfgefið "C", t.d. "A" á hliði 15. */
  schengenBokstafur?: "A" | "C";
};

export const SUDUR_STODUR: Record<SudurStada, { titill: string; lysing: string }> = {
  "schengen-komur": { titill: "Schengen · Komur", lysing: "Hlið stillt fyrir komu á Schengen flugi." },
  "schengen-brottfor": { titill: "Schengen · Brottför", lysing: "Hlið stillt fyrir brottför á Schengen flugi." },
  "non-schengen-komur": { titill: "Non-Schengen · Komur", lysing: "Hlið stillt fyrir komu á non-Schengen flugi." },
  "non-schengen-brottfor": { titill: "Non-Schengen · Brottför", lysing: "Hlið stillt fyrir brottför á non-Schengen flugi." },
  hlutlaust: { titill: "Hlutlaust", lysing: "Ekkert flug notar hliðið núna – engin staða valin." },
  schengen: { titill: "Schengen", lysing: "Rútuhlið stillt fyrir Schengen flug." },
  "non-schengen": { titill: "Non-Schengen", lysing: "Rútuhlið stillt fyrir non-Schengen flug." },
};

/** Er staðan Schengen (í hvora átt sem er, eða rútuhlið án áttar)? */
function erSchengenStada(stada: SudurStada): boolean {
  return stada === "schengen-komur" || stada === "schengen-brottfor" || stada === "schengen";
}

/** Er staðan non-Schengen (í hvora átt sem er, eða rútuhlið án áttar)? */
function erNonSchengenStada(stada: SudurStada): boolean {
  return stada === "non-schengen-komur" || stada === "non-schengen-brottfor" || stada === "non-schengen";
}

// Bókstafur hliðs eftir stöðu: C = Schengen, D = non-Schengen (A á hliði 15),
// ekkert bókstafur í hlutlausri stöðu (hliðið sýnir þá bara númerið).
export function hlidBokstafur(stada: SudurStada, h?: SudurHlid): "A" | "C" | "D" | "" {
  if (erSchengenStada(stada)) return h?.schengenBokstafur ?? "C";
  if (erNonSchengenStada(stada)) return "D";
  return "";
}

/** Birtingarheiti hliðs eftir stöðu, t.d. C22 (Schengen), D22 (non-Schengen)
 *  eða bara 22 (hlutlaust). */
export function hlidNafn(h: SudurHlid, stada: SudurStada): string {
  const b = hlidBokstafur(stada, h);
  return `${b}${h.numer}`;
}

/** Hin staðan – bara notað fyrir rútuhlið, sem hafa einungis tvær stöður. */
export function hinRutuhlidStadan(stada: "schengen" | "non-schengen"): "schengen" | "non-schengen" {
  return stada === "schengen" ? "non-schengen" : "schengen";
}

// Litur á bókstafsmerki hliðs – notað samræmt hvar sem bókstafur er sýndur
// (Suður-síðan sjálf og tilkynningin um hlið sem þarf að snúa). Schengen
// (A/C) fær vörumerkjabláan, non-Schengen (D) fjólubláan. Hlutlaust (ekkert
// bókstafur) fær hlutlausan grán lit – þetta er eðlilega algengasta staðan,
// ekki eitthvað sem þarf að vekja athygli á eins og gult myndi gefa til kynna.
export const BOKSTAFUR_LITUR: Record<string, string> = {
  A: "bg-brand",
  C: "bg-brand",
  D: "bg-violet-600",
  "": "bg-slate-400",
};

// Undirhópar rútuhliða 24–29.
export const RUTU_UNDIRHOPAR: { id: string; label: string; numer: number[] }[] = [
  { id: "24-27", label: "24–27", numer: [24, 25, 26, 27] },
  { id: "28-29", label: "28–29", numer: [28, 29] },
];

export const SUDUR_HLID: SudurHlid[] = [
  // --- Venjuleg landgangshlið (snúanleg, fimm stig, sjálfgefið hlutlaust) ---
  { id: "g21", heiti: "21", numer: 21, gerd: "hlid", snuanlegt: true, sjalfgefid: "hlutlaust" },
  { id: "g22", heiti: "22", numer: 22, gerd: "hlid", snuanlegt: true, sjalfgefid: "hlutlaust" },
  { id: "g23", heiti: "23", numer: 23, gerd: "hlid", snuanlegt: true, sjalfgefid: "hlutlaust" },
  { id: "g31", heiti: "31", numer: 31, gerd: "hlid", snuanlegt: true, sjalfgefid: "hlutlaust" },
  { id: "g32", heiti: "32", numer: 32, gerd: "hlid", snuanlegt: true, sjalfgefid: "hlutlaust" },
  { id: "g33", heiti: "33", numer: 33, gerd: "hlid", snuanlegt: true, sjalfgefid: "hlutlaust" },
  { id: "g34", heiti: "34", numer: 34, gerd: "hlid", snuanlegt: true, sjalfgefid: "hlutlaust" },
  { id: "g35", heiti: "35", numer: 35, gerd: "hlid", snuanlegt: true, sjalfgefid: "hlutlaust" },
  { id: "g36", heiti: "36", numer: 36, gerd: "hlid", snuanlegt: true, sjalfgefid: "hlutlaust" },

  // --- Rútuhlið 24–29 (bus gates) – bara Schengen/Non-Schengen, ekkert hlutlaust ---
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
