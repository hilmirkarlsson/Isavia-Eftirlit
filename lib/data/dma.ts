// DMA stæði á Háaleitishlaði.
//
// Tvær gerðir:
//  - "varanlegt" (permanent): alltaf BLÁTT. Þessi stæði eru alltaf virk
//    og er ekki hægt að breyta. (101–108 og 810/H-18 Silfur.)
//  - "timabundid" (temporary): sjálfgefið RAUTT. Hægt að gera BLÁTT
//    (hreint / virkt) í ákveðinn tíma og svo aftur rautt.
//
import { Flug, flugTs } from "../fids";

export type DmaGerd = "varanlegt" | "timabundid";
export type DmaStada = "hreint" | "ohreint"; // hreint = blátt, ohreint = rautt

export type DmaStaedi = {
  id: string;
  heiti: string;
  gerd: DmaGerd;
  svaedi: string;
  /** Skráning loftfars ef vitað (sýnigögn – uppfærist í rauntíma síðar). */
  reg?: string;
};

export const DMA_STAEDI: DmaStaedi[] = [
  // --- Tímabundin stæði (rauð, hægt að gera blá) ---
  { id: "119", heiti: "119", gerd: "timabundid", svaedi: "Efra" },
  { id: "118", heiti: "118", gerd: "timabundid", svaedi: "Efra" },
  { id: "117", heiti: "117", gerd: "timabundid", svaedi: "Efra" },
  { id: "116", heiti: "116", gerd: "timabundid", svaedi: "Efra" },
  { id: "120", heiti: "120", gerd: "timabundid", svaedi: "Efra" },
  { id: "121", heiti: "121", gerd: "timabundid", svaedi: "Efra" },
  { id: "115", heiti: "115", gerd: "timabundid", svaedi: "Austur", reg: "" },
  { id: "114", heiti: "114", gerd: "timabundid", svaedi: "Austur" },
  { id: "113", heiti: "113", gerd: "timabundid", svaedi: "Austur" },
  { id: "112", heiti: "112", gerd: "timabundid", svaedi: "Austur" },
  { id: "122", heiti: "122", gerd: "timabundid", svaedi: "Mið" },
  { id: "123", heiti: "123", gerd: "timabundid", svaedi: "Mið", reg: "ZZ331" },
  { id: "111", heiti: "111", gerd: "timabundid", svaedi: "Mið" },
  { id: "110", heiti: "110", gerd: "timabundid", svaedi: "Mið", reg: "N459BL" },
  { id: "109", heiti: "109", gerd: "timabundid", svaedi: "Mið", reg: "61007T" },

  // --- Varanleg stæði (alltaf blá) ---
  { id: "108", heiti: "108", gerd: "varanlegt", svaedi: "Vestur röð", reg: "" },
  { id: "107", heiti: "107", gerd: "varanlegt", svaedi: "Vestur röð", reg: "CGOHJ" },
  { id: "106", heiti: "106", gerd: "varanlegt", svaedi: "Vestur röð", reg: "164598" },
  { id: "105", heiti: "105", gerd: "varanlegt", svaedi: "Vestur röð", reg: "B537" },
  { id: "104", heiti: "104", gerd: "varanlegt", svaedi: "Vestur röð", reg: "GWZAP" },
  { id: "103", heiti: "103", gerd: "varanlegt", svaedi: "Vestur röð", reg: "HBFAM" },
  { id: "102", heiti: "102", gerd: "varanlegt", svaedi: "Vestur röð", reg: "168207" },
  { id: "101", heiti: "101", gerd: "varanlegt", svaedi: "Vestur röð", reg: "N972MC" },
];

/** Sjálfgefin staða stæðis: varanlegt = hreint (blátt), tímabundið = óhreint (rautt). */
export function sjalfgefinStada(s: DmaStaedi): DmaStada {
  return s.gerd === "varanlegt" ? "hreint" : "ohreint";
}

/** Hversu langt frá núinu (ms) flug telst vera "á stæðinu núna" – nógu vítt
 *  til að ná yfir lendingu/akstur í stæði og fram að brottflugi. */
const STAEDI_GLUGGI_MS = 3 * 60 * 60_000;

/**
 * Reiknar sjálfvirkt stöðu tímabundins stæðis út frá FIDS: ef flug er skráð
 * á stæðið núna (innan tímaglugga, ekki farið) er stæðið "ohreint" (EKKI
 * DMA – í notkun). Annars er það laust og þar með "hreint" (DMA).
 * Varanleg stæði eru alltaf hrein, óháð flugumferð.
 */
export function reiknaStadaUrFids(
  s: DmaStaedi,
  flug: Flug[],
  nuMs = Date.now()
): DmaStada {
  if (s.gerd === "varanlegt") return "hreint";
  const inotkun = flug.some(
    (f) => f.staedi === s.id && Math.abs(flugTs(f, nuMs) - nuMs) <= STAEDI_GLUGGI_MS
  );
  return inotkun ? "ohreint" : "hreint";
}
