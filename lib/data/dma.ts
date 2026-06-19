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
  { id: "119", heiti: "119", gerd: "timabundid", svaedi: "Efra", x: 47.9, y: 10.7 },
  { id: "118", heiti: "118", gerd: "timabundid", svaedi: "Efra", x: 53.6, y: 10.9 },
  { id: "117", heiti: "117", gerd: "timabundid", svaedi: "Efra", x: 59, y: 11.4 },
  { id: "116", heiti: "116", gerd: "timabundid", svaedi: "Efra", x: 64.4, y: 12.2 },
  { id: "120", heiti: "120", gerd: "timabundid", svaedi: "Efra", x: 55.1, y: 22.2 },
  { id: "121", heiti: "121", gerd: "timabundid", svaedi: "Efra", x: 54.5, y: 27.8 },
  { id: "115", heiti: "115", gerd: "timabundid", svaedi: "Austur", x: 86, y: 20.4, reg: "" },
  { id: "114", heiti: "114", gerd: "timabundid", svaedi: "Austur", x: 85.8, y: 23.5 },
  { id: "113", heiti: "113", gerd: "timabundid", svaedi: "Austur", x: 85.4, y: 27.2 },
  { id: "112", heiti: "112", gerd: "timabundid", svaedi: "Austur", x: 85, y: 29.2 },
  { id: "122", heiti: "122", gerd: "timabundid", svaedi: "Mið", x: 39, y: 31.2 },
  { id: "123", heiti: "123", gerd: "timabundid", svaedi: "Mið", x: 34.5, y: 37.5, reg: "ZZ331" },
  { id: "111", heiti: "111", gerd: "timabundid", svaedi: "Mið", x: 40.4, y: 51.5 },
  { id: "110", heiti: "110", gerd: "timabundid", svaedi: "Mið", x: 37.9, y: 55.5, reg: "N459BL" },
  { id: "109", heiti: "109", gerd: "timabundid", svaedi: "Mið", x: 35.9, y: 60.2, reg: "61007T" },
  { id: "835", heiti: "835", gerd: "timabundid", svaedi: "Vestur", x: 12.3, y: 53.1 },

  // --- Varanleg stæði (alltaf blá) ---
  { id: "810", heiti: "810", gerd: "varanlegt", svaedi: "Silfur (H-18)", x: 44.2, y: 65.6 },
  { id: "108", heiti: "108", gerd: "varanlegt", svaedi: "Vestur röð", x: 30.7, y: 64.6, reg: "" },
  { id: "107", heiti: "107", gerd: "varanlegt", svaedi: "Vestur röð", x: 27.7, y: 68.7, reg: "CGOHJ" },
  { id: "106", heiti: "106", gerd: "varanlegt", svaedi: "Vestur röð", x: 24.6, y: 72.5, reg: "164598" },
  { id: "105", heiti: "105", gerd: "varanlegt", svaedi: "Vestur röð", x: 21.5, y: 76.6, reg: "B537" },
  { id: "104", heiti: "104", gerd: "varanlegt", svaedi: "Vestur röð", x: 18.5, y: 80.3, reg: "GWZAP" },
  { id: "103", heiti: "103", gerd: "varanlegt", svaedi: "Vestur röð", x: 15.4, y: 83.9, reg: "HBFAM" },
  { id: "102", heiti: "102", gerd: "varanlegt", svaedi: "Vestur röð", x: 12.3, y: 87.5, reg: "168207" },
  { id: "101", heiti: "101", gerd: "varanlegt", svaedi: "Vestur röð", x: 9.3, y: 91.3, reg: "N972MC" },
];

/** Sjálfgefin staða stæðis: varanlegt = hreint (blátt), tímabundið = óhreint (rautt). */
export function sjalfgefinStada(s: DmaStaedi): DmaStada {
  return s.gerd === "varanlegt" ? "hreint" : "ohreint";
}

export const DMA_SVAEDI = ["Efra", "Austur", "Mið", "Vestur", "Vestur röð", "Silfur (H-18)"];
