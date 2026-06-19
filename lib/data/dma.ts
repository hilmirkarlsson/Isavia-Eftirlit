// DMA stæði á Háaleitishlaði.
//
// Tvær gerðir:
//  - "varanlegt" (permanent): alltaf BLÁTT. Þessi stæði eru alltaf virk
//    og er ekki hægt að breyta. (101–108 og 810/H-18 Silfur.)
//  - "timabundid" (temporary): sjálfgefið RAUTT. Hægt að gera BLÁTT
//    (hreint / virkt) í ákveðinn tíma og svo aftur rautt.
//
// x/y eru staðsetning miðju merkis á kortinu, sem hlutfall (0–100) af
// breidd/hæð myndarinnar. Þetta er ætlað ofan á gervihnattamyndina
// (public/dma-map.jpg). Fínstillið x/y svo merkin lendi rétt á stæðunum.

export type DmaGerd = "varanlegt" | "timabundid";
export type DmaStada = "hreint" | "ohreint"; // hreint = blátt, ohreint = rautt

export type DmaStaedi = {
  id: string;
  heiti: string;
  gerd: DmaGerd;
  svaedi: string;
  /** Staðsetning á korti (hlutfall 0–100). */
  x: number;
  y: number;
  /** Skráning loftfars ef vitað (sýnigögn – uppfærist í rauntíma síðar). */
  reg?: string;
};

export const DMA_STAEDI: DmaStaedi[] = [
  // --- Tímabundin stæði (rauð, hægt að gera blá) ---
  { id: "119", heiti: "119", gerd: "timabundid", svaedi: "Efra", x: 48, y: 19 },
  { id: "118", heiti: "118", gerd: "timabundid", svaedi: "Efra", x: 55, y: 19 },
  { id: "117", heiti: "117", gerd: "timabundid", svaedi: "Efra", x: 61, y: 19 },
  { id: "116", heiti: "116", gerd: "timabundid", svaedi: "Efra", x: 67, y: 19 },
  { id: "120", heiti: "120", gerd: "timabundid", svaedi: "Efra", x: 56, y: 36 },
  { id: "121", heiti: "121", gerd: "timabundid", svaedi: "Efra", x: 56, y: 46 },
  { id: "115", heiti: "115", gerd: "timabundid", svaedi: "Austur", x: 84, y: 34, reg: "" },
  { id: "114", heiti: "114", gerd: "timabundid", svaedi: "Austur", x: 84, y: 40 },
  { id: "113", heiti: "113", gerd: "timabundid", svaedi: "Austur", x: 84, y: 45 },
  { id: "112", heiti: "112", gerd: "timabundid", svaedi: "Austur", x: 84, y: 50 },
  { id: "122", heiti: "122", gerd: "timabundid", svaedi: "Mið", x: 40, y: 51 },
  { id: "123", heiti: "123", gerd: "timabundid", svaedi: "Mið", x: 36, y: 61, reg: "ZZ331" },
  { id: "111", heiti: "111", gerd: "timabundid", svaedi: "Mið", x: 39, y: 81 },
  { id: "110", heiti: "110", gerd: "timabundid", svaedi: "Mið", x: 39, y: 86, reg: "N459BL" },
  { id: "109", heiti: "109", gerd: "timabundid", svaedi: "Mið", x: 37, y: 91, reg: "61007T" },
  { id: "835", heiti: "835", gerd: "timabundid", svaedi: "Vestur", x: 17, y: 84 },

  // --- Varanleg stæði (alltaf blá) ---
  { id: "810", heiti: "810", gerd: "varanlegt", svaedi: "Silfur (H-18)", x: 43, y: 97 },
  { id: "108", heiti: "108", gerd: "varanlegt", svaedi: "Vestur röð", x: 32, y: 91, reg: "" },
  { id: "107", heiti: "107", gerd: "varanlegt", svaedi: "Vestur röð", x: 30, y: 94, reg: "CGOHJ" },
  { id: "106", heiti: "106", gerd: "varanlegt", svaedi: "Vestur röð", x: 28, y: 96, reg: "164598" },
  { id: "105", heiti: "105", gerd: "varanlegt", svaedi: "Vestur röð", x: 26, y: 97, reg: "B537" },
  { id: "104", heiti: "104", gerd: "varanlegt", svaedi: "Vestur röð", x: 24, y: 98, reg: "GWZAP" },
  { id: "103", heiti: "103", gerd: "varanlegt", svaedi: "Vestur röð", x: 22, y: 99, reg: "HBFAM" },
  { id: "102", heiti: "102", gerd: "varanlegt", svaedi: "Vestur röð", x: 20, y: 99, reg: "168207" },
  { id: "101", heiti: "101", gerd: "varanlegt", svaedi: "Vestur röð", x: 18, y: 100, reg: "N972MC" },
];

/** Sjálfgefin staða stæðis: varanlegt = hreint (blátt), tímabundið = óhreint (rautt). */
export function sjalfgefinStada(s: DmaStaedi): DmaStada {
  return s.gerd === "varanlegt" ? "hreint" : "ohreint";
}

export const DMA_SVAEDI = ["Efra", "Austur", "Mið", "Vestur", "Vestur röð", "Silfur (H-18)"];
