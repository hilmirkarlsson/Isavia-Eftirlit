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
  iata?: string; // IATA kóði hins vallarins
  aaetlad: string;
  raun?: string;
  hlid?: string;
  staedi?: string;
  faeriband?: string;
  stada?: string;
  reg?: string; // skráning loftfars
  tegundVel?: string; // tegund flugvélar
  handling?: string; // þjónustuaðili (handling agent)
  schengen?: "S" | "N";
  ts?: number; // tímastimpill (epoch ms) til röðunar – þvert á miðnætti
};

/** Tímastimpill flugs til röðunar. Notar ts ef til, annars giskar út frá
 *  "HH:MM" miðað við núið (flug meira en 6 klst í fortíð teljast morgundagur). */
export function flugTs(f: Flug, now = Date.now()): number {
  if (typeof f.ts === "number" && !Number.isNaN(f.ts)) return f.ts;
  const s = f.raun || f.aaetlad || "";
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return now;
  const d = new Date(now);
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  let t = d.getTime();
  if (t < now - 6 * 3600_000) t += 24 * 3600_000;
  return t;
}

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
  { id: "s-1", tegund: "departure", flugnumer: "AS 355", flugfelag: "Alaska", borg: "Seattle", iata: "SEA", aaetlad: klstFraNu(-15), raun: klstFraNu(-15), hlid: "D22B", staedi: "22", stada: "Departed", reg: "N823AK", tegundVel: "B739", handling: "IGS", schengen: "N" },
  { id: "s-2", tegund: "arrival", flugnumer: "FI 451", flugfelag: "Icelandair", borg: "London Heathrow", iata: "LHR", aaetlad: klstFraNu(12), raun: klstFraNu(10), hlid: "D21", staedi: "21", faeriband: "3", stada: "Estimated", reg: "TFISN", tegundVel: "B752", handling: "APA", schengen: "N" },
  { id: "s-3", tegund: "departure", flugnumer: "UA 913", flugfelag: "United", borg: "Chicago", iata: "ORD", aaetlad: klstFraNu(20), hlid: "D31", staedi: "31", stada: "Estimated", reg: "N74856", tegundVel: "B763", handling: "IGS", schengen: "N" },
  { id: "s-4", tegund: "arrival", flugnumer: "FI 501", flugfelag: "Icelandair", borg: "Amsterdam", iata: "AMS", aaetlad: klstFraNu(26), hlid: "C23", staedi: "23", faeriband: "1", stada: "Estimated", reg: "TFICA", tegundVel: "B38M", handling: "APA", schengen: "S" },
  { id: "s-5", tegund: "departure", flugnumer: "FI 435", flugfelag: "Icelandair", borg: "Edinburgh", iata: "EDI", aaetlad: klstFraNu(34), hlid: "D35", staedi: "35", stada: "Estimated", reg: "TFICV", tegundVel: "B38M", handling: "APA", schengen: "N" },
  { id: "s-6", tegund: "arrival", flugnumer: "FI 543", flugfelag: "Icelandair", borg: "Paris CDG", iata: "CDG", aaetlad: klstFraNu(44), hlid: "C34", staedi: "34", faeriband: "2", stada: "Estimated", reg: "TFIAD", tegundVel: "B752", handling: "APA", schengen: "S" },
  { id: "s-7", tegund: "arrival", flugnumer: "FI 533", flugfelag: "Icelandair", borg: "Munich", iata: "MUC", aaetlad: klstFraNu(57), hlid: "C32", staedi: "32", faeriband: "4", stada: "Estimated", reg: "TFICI", tegundVel: "B38M", handling: "APA", schengen: "S" },
  { id: "s-8", tegund: "arrival", flugnumer: "OG 121", flugfelag: "Play", borg: "Tenerife", iata: "TFS", aaetlad: klstFraNu(66), hlid: "A2", staedi: "2", faeriband: "2", stada: "Estimated", reg: "TFAEX", tegundVel: "A320", handling: "APA", schengen: "S" },
  { id: "s-9", tegund: "departure", flugnumer: "FI 454", flugfelag: "Icelandair", borg: "London Heathrow", iata: "LHR", aaetlad: klstFraNu(70), hlid: "D25", staedi: "25", stada: "Scheduled", reg: "TFIAC", tegundVel: "B752", handling: "APA", schengen: "N" },
  { id: "s-10", tegund: "departure", flugnumer: "FI 853", flugfelag: "Icelandair", borg: "Chicago", iata: "ORD", aaetlad: klstFraNu(85), hlid: "D33", staedi: "33", stada: "Scheduled", reg: "TFICD", tegundVel: "B763", handling: "APA", schengen: "N" },
  { id: "s-11", tegund: "departure", flugnumer: "OG 742", flugfelag: "Play", borg: "Alicante", iata: "ALC", aaetlad: klstFraNu(95), hlid: "A4", staedi: "4", stada: "Scheduled", reg: "TFAEW", tegundVel: "A321", handling: "APA", schengen: "S" },
  { id: "s-12", tegund: "departure", flugnumer: "FI 657", flugfelag: "Icelandair", borg: "Minneapolis St Paul", iata: "MSP", aaetlad: klstFraNu(105), hlid: "D28", staedi: "28", stada: "Scheduled", reg: "TFICT", tegundVel: "B752", handling: "APA", schengen: "N" },
  { id: "s-13", tegund: "arrival", flugnumer: "DY 1234", flugfelag: "Norwegian", borg: "Oslo", iata: "OSL", aaetlad: klstFraNu(110), hlid: "A1", staedi: "1", faeriband: "6", stada: "Scheduled", reg: "LNDYT", tegundVel: "B738", handling: "IGS", schengen: "S" },
  { id: "s-14", tegund: "departure", flugnumer: "FI 821", flugfelag: "Icelandair", borg: "Raleigh", iata: "RDU", aaetlad: klstFraNu(130), hlid: "D23", staedi: "23", stada: "Scheduled", reg: "TFICA", tegundVel: "B38M", handling: "APA", schengen: "N" },
  { id: "s-15", tegund: "arrival", flugnumer: "EZY 6045", flugfelag: "easyJet", borg: "Manchester", iata: "MAN", aaetlad: klstFraNu(150), hlid: "C26", staedi: "26", faeriband: "3", stada: "Scheduled", reg: "GEZUF", tegundVel: "A320", handling: "IGS", schengen: "N" },
  { id: "s-16", tegund: "departure", flugnumer: "TO 3791", flugfelag: "Transavia", borg: "Paris Orly", iata: "ORY", aaetlad: klstFraNu(165), hlid: "A3", staedi: "3", stada: "Scheduled", reg: "PHTVU", tegundVel: "B738", handling: "APA", schengen: "S" },
];

export function syniSvar(): FidsSvar {
  return {
    uppfaert: new Date().toISOString(),
    heimild: "synidaemi",
    flug: SYNI_FLUG,
  };
}
