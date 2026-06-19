// Tegundir og hjálparföll fyrir flugupplýsingar (FIDS).
//
// Rauntímagögn eru sótt í gegnum /api/fids sem virkar sem milliþjónn
// (proxy) fyrir opinbera FIDS vef Keflavíkurflugvallar og skilar ÖLLUM
// flugum sem vefurinn birtir. Þegar ekki næst í gögnin (t.d. í
// þróunarumhverfi án nets) er notuð sýnigögn hér að neðan.

export type FlugTegund = "arrival" | "departure";

export type Flug = {
  id: string;
  tegund: FlugTegund;
  flugnumer: string;
  flugfelag: string;
  borg: string;
  aaetlad: string;
  raun?: string;
  hlid?: string;
  staedi?: string;
  faeriband?: string;
  stada?: string;
  reg?: string; // skráning loftfars
  schengen?: "S" | "N";
};

export type FidsSvar = {
  uppfaert: string;
  heimild: "live" | "synidaemi";
  flug: Flug[];
};

/** Er flugið Icelandair (FI)? Notað t.d. í Suður þar sem FI er undanskilið. */
export function erIcelandair(f: Flug): boolean {
  return /^fi\b/i.test(f.flugnumer.replace(/\s+/g, " ").trim());
}

/** Hliðahópar eins og í upprunalega forritinu. */
export const HLIDAHOPAR: { id: string; label: string; numer: number[] }[] = [
  { id: "21-23", label: "21-23", numer: [21, 22, 23] },
  { id: "24-29", label: "24-29", numer: [24, 25, 26, 27, 28, 29] },
  { id: "31-36", label: "31-36", numer: [31, 32, 33, 34, 35, 36] },
  { id: "15", label: "15", numer: [15] },
];

/** Nær tölunni úr hliði (t.d. "D22B" -> 22, "C34" -> 34). */
export function hlidNumer(hlid?: string): number | null {
  if (!hlid) return null;
  const m = hlid.match(/(\d{1,3})/);
  return m ? Number(m[1]) : null;
}

// ---------------------------------------------------------------------------
// Sýnigögn – notuð sem varaleið þegar ekki næst í rauntímagögn.
// ---------------------------------------------------------------------------

function klstFraNu(min: number): string {
  const d = new Date(Date.now() + min * 60_000);
  return d.toTimeString().slice(0, 5);
}

export const SYNI_FLUG: Flug[] = [
  { id: "s-1", tegund: "departure", flugnumer: "AS 355", flugfelag: "Alaska", borg: "Seattle (SEA)", aaetlad: klstFraNu(-15), raun: klstFraNu(-15), hlid: "D22B", staedi: "22", stada: "Departed", reg: "N823AK", schengen: "N" },
  { id: "s-2", tegund: "arrival", flugnumer: "FI 451", flugfelag: "Icelandair", borg: "London Heathrow (LHR)", aaetlad: klstFraNu(12), raun: klstFraNu(10), hlid: "D21", staedi: "21", faeriband: "3", stada: "Estimated", reg: "TFISN", schengen: "N" },
  { id: "s-3", tegund: "departure", flugnumer: "UA 913", flugfelag: "United", borg: "Chicago (ORD)", aaetlad: klstFraNu(20), hlid: "D31", staedi: "31", stada: "Estimated", reg: "N74856", schengen: "N" },
  { id: "s-4", tegund: "arrival", flugnumer: "FI 501", flugfelag: "Icelandair", borg: "Amsterdam (AMS)", aaetlad: klstFraNu(26), hlid: "C23", staedi: "23", faeriband: "1", stada: "Estimated", reg: "TFICA", schengen: "S" },
  { id: "s-5", tegund: "departure", flugnumer: "FI 435", flugfelag: "Icelandair", borg: "Edinburgh (EDI)", aaetlad: klstFraNu(34), hlid: "D35", staedi: "35", stada: "Estimated", reg: "TFICV", schengen: "N" },
  { id: "s-6", tegund: "arrival", flugnumer: "FI 543", flugfelag: "Icelandair", borg: "Paris CDG (CDG)", aaetlad: klstFraNu(44), hlid: "C34", staedi: "34", faeriband: "2", stada: "Estimated", reg: "TFIAD", schengen: "S" },
  { id: "s-7", tegund: "arrival", flugnumer: "FI 533", flugfelag: "Icelandair", borg: "Munich (MUC)", aaetlad: klstFraNu(57), hlid: "C32", staedi: "32", faeriband: "4", stada: "Estimated", reg: "TFICI", schengen: "S" },
  { id: "s-8", tegund: "arrival", flugnumer: "FI 537", flugfelag: "Icelandair", borg: "Prague (PRG)", aaetlad: klstFraNu(66), hlid: "C22", staedi: "22", faeriband: "2", stada: "Estimated", reg: "TFICB", schengen: "S" },
  { id: "s-9", tegund: "departure", flugnumer: "FI 454", flugfelag: "Icelandair", borg: "London Heathrow (LHR)", aaetlad: klstFraNu(70), hlid: "D25", staedi: "25", stada: "Scheduled", reg: "TFIAC", schengen: "N" },
  { id: "s-10", tegund: "departure", flugnumer: "FI 853", flugfelag: "Icelandair", borg: "Chicago (ORD)", aaetlad: klstFraNu(85), hlid: "D33", staedi: "33", stada: "Scheduled", reg: "TFICD", schengen: "N" },
  { id: "s-11", tegund: "departure", flugnumer: "FI 821", flugfelag: "Icelandair", borg: "Raleigh (RDU)", aaetlad: klstFraNu(105), hlid: "D23", staedi: "23", stada: "Scheduled", reg: "TFICA", schengen: "N" },
  { id: "s-12", tegund: "departure", flugnumer: "FI 657", flugfelag: "Icelandair", borg: "Minneapolis St Paul (MSP)", aaetlad: klstFraNu(105), hlid: "D28", staedi: "28", stada: "Scheduled", reg: "TFICT", schengen: "N" },
  { id: "s-13", tegund: "departure", flugnumer: "OG 742", flugfelag: "Play", borg: "Alicante (ALC)", aaetlad: klstFraNu(95), hlid: "C15", staedi: "15", stada: "Scheduled", reg: "TFAEW", schengen: "S" },
  { id: "s-14", tegund: "arrival", flugnumer: "OG 121", flugfelag: "Play", borg: "Tenerife (TFS)", aaetlad: klstFraNu(120), hlid: "C24", staedi: "24", faeriband: "5", stada: "Scheduled", reg: "TFAEX", schengen: "S" },
];

export function syniSvar(): FidsSvar {
  return {
    uppfaert: new Date().toISOString(),
    heimild: "synidaemi",
    flug: SYNI_FLUG,
  };
}
