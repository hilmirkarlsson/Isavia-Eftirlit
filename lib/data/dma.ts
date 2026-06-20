// DMA stæði á Háaleitishlaði.
//
// Tvær gerðir:
//  - "varanlegt" (permanent): alltaf BLÁTT. Þessi stæði eru alltaf virk
//    og er ekki hægt að breyta. (101–108 og 810/H-18 Silfur.)
//  - "timabundid" (temporary): sjálfgefið RAUTT. Hægt að gera BLÁTT
//    (hreint / virkt) í ákveðinn tíma og svo aftur rautt.
//
// x/y eru staðsetning miðju merkis á kortinu, sem hlutfall (0–100) af
// breidd/hæð myndarinnar. w/h eru breidd/hæð stæðisins sjálfs (einnig
// hlutfall 0–100) svo hnappurinn þeki stæðið sjálft, ekki bara merkið.
// Þetta er ætlað ofan á gervihnattamyndina (public/dma-map.jpg).
// Fínstillið x/y/w/h svo hnappurinn lendi rétt yfir stæðinu.

export type DmaGerd = "varanlegt" | "timabundid";
export type DmaStada = "hreint" | "ohreint"; // hreint = blátt, ohreint = rautt

export type DmaStaedi = {
  id: string;
  heiti: string;
  gerd: DmaGerd;
  svaedi: string;
  /** Staðsetning miðju stæðis á korti (hlutfall 0–100). */
  x: number;
  y: number;
  /** Breidd/hæð stæðisins á korti (hlutfall 0–100). */
  w: number;
  h: number;
  /** Skráning loftfars ef vitað (sýnigögn – uppfærist í rauntíma síðar). */
  reg?: string;
};

export const DMA_STAEDI: DmaStaedi[] = [
  // --- Tímabundin stæði (rauð, hægt að gera blá) ---
  { id: "119", heiti: "119", gerd: "timabundid", svaedi: "Efra", x: 48.1, y: 11.6, w: 5.9, h: 6.6 },
  { id: "118", heiti: "118", gerd: "timabundid", svaedi: "Efra", x: 53.7, y: 12.2, w: 5.6, h: 7.0 },
  { id: "117", heiti: "117", gerd: "timabundid", svaedi: "Efra", x: 59.2, y: 12.2, w: 5.6, h: 7.0 },
  { id: "116", heiti: "116", gerd: "timabundid", svaedi: "Efra", x: 64.8, y: 12.2, w: 5.6, h: 7.0 },
  { id: "120", heiti: "120", gerd: "timabundid", svaedi: "Efra", x: 56.6, y: 21.9, w: 12.0, h: 6.6 },
  { id: "121", heiti: "121", gerd: "timabundid", svaedi: "Efra", x: 56.2, y: 28.1, w: 12.1, h: 5.5 },
  { id: "115", heiti: "115", gerd: "timabundid", svaedi: "Austur", x: 85.8, y: 20.5, w: 7.6, h: 2.9, reg: "" },
  { id: "114", heiti: "114", gerd: "timabundid", svaedi: "Austur", x: 85.8, y: 23.4, w: 7.6, h: 2.9 },
  { id: "113", heiti: "113", gerd: "timabundid", svaedi: "Austur", x: 85.8, y: 26.3, w: 7.6, h: 2.9 },
  { id: "112", heiti: "112", gerd: "timabundid", svaedi: "Austur", x: 85.8, y: 29.2, w: 7.6, h: 2.9 },
  { id: "122", heiti: "122", gerd: "timabundid", svaedi: "Mið", x: 39.6, y: 30.8, w: 11.0, h: 7.7 },
  { id: "123", heiti: "123", gerd: "timabundid", svaedi: "Mið", x: 34.9, y: 37.5, w: 11.1, h: 7.5, reg: "ZZ331" },
  { id: "111", heiti: "111", gerd: "timabundid", svaedi: "Mið", x: 40.4, y: 51.5, w: 5.6, h: 4.8 },
  { id: "110", heiti: "110", gerd: "timabundid", svaedi: "Mið", x: 37.9, y: 55.5, w: 5.6, h: 4.8, reg: "N459BL" },
  { id: "109", heiti: "109", gerd: "timabundid", svaedi: "Mið", x: 35.9, y: 60.2, w: 5.6, h: 4.8, reg: "61007T" },

  // --- Varanleg stæði (alltaf blá) ---
  { id: "108", heiti: "108", gerd: "varanlegt", svaedi: "Vestur röð", x: 30.7, y: 64.6, w: 3.5, h: 3.5, reg: "" },
  { id: "107", heiti: "107", gerd: "varanlegt", svaedi: "Vestur röð", x: 27.7, y: 68.7, w: 3.5, h: 3.5, reg: "CGOHJ" },
  { id: "106", heiti: "106", gerd: "varanlegt", svaedi: "Vestur röð", x: 24.6, y: 72.5, w: 3.5, h: 3.5, reg: "164598" },
  { id: "105", heiti: "105", gerd: "varanlegt", svaedi: "Vestur röð", x: 21.5, y: 76.6, w: 3.5, h: 3.5, reg: "B537" },
  { id: "104", heiti: "104", gerd: "varanlegt", svaedi: "Vestur röð", x: 18.5, y: 80.3, w: 3.5, h: 3.5, reg: "GWZAP" },
  { id: "103", heiti: "103", gerd: "varanlegt", svaedi: "Vestur röð", x: 15.4, y: 83.9, w: 3.5, h: 3.5, reg: "HBFAM" },
  { id: "102", heiti: "102", gerd: "varanlegt", svaedi: "Vestur röð", x: 12.3, y: 87.5, w: 3.5, h: 3.5, reg: "168207" },
  { id: "101", heiti: "101", gerd: "varanlegt", svaedi: "Vestur röð", x: 9.3, y: 91.3, w: 3.5, h: 3.5, reg: "N972MC" },
];

/** Sjálfgefin staða stæðis: varanlegt = hreint (blátt), tímabundið = óhreint (rautt). */
export function sjalfgefinStada(s: DmaStaedi): DmaStada {
  return s.gerd === "varanlegt" ? "hreint" : "ohreint";
}
