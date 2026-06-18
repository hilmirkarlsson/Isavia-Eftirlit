// Tegundir og hjálparföll fyrir flugupplýsingar (FIDS).
//
// Rauntímagögn eru sótt í gegnum /api/fids sem virkar sem milliþjónn
// (proxy) fyrir opinbera FIDS vef Keflavíkurflugvallar. Þegar ekki næst
// í gögnin (t.d. í þróunarumhverfi án nets) er notuð sýnigögn hér að neðan.

export type FlugTegund = "arrival" | "departure";

export type Flug = {
  id: string;
  tegund: FlugTegund;
  /** Flugnúmer, t.d. "FI 204". */
  flugnumer: string;
  /** Flugfélag. */
  flugfelag: string;
  /** Áfangastaður (brottflug) eða brottfararstaður (koma). */
  borg: string;
  /** Áætlaður tími (ISO eða "HH:MM"). */
  aaetlad: string;
  /** Rauntími / spá ef til. */
  raun?: string;
  /** Hlið. */
  hlid?: string;
  /** Stæði. */
  staedi?: string;
  /** Færiband (fyrir komur). */
  faeriband?: string;
  /** Staða, t.d. "Á áætlun", "Lent", "Boarding". */
  stada?: string;
  /** Schengen / non-Schengen ef vitað. */
  schengen?: "S" | "N";
};

export type FidsSvar = {
  uppfaert: string; // ISO tími
  heimild: "live" | "synidaemi";
  flug: Flug[];
};

// ---------------------------------------------------------------------------
// Sýnigögn – notuð sem varaleið þegar ekki næst í rauntímagögn.
// ---------------------------------------------------------------------------

function klstFraNu(min: number): string {
  const d = new Date(Date.now() + min * 60_000);
  return d.toTimeString().slice(0, 5);
}

export const SYNI_FLUG: Flug[] = [
  {
    id: "s-1",
    tegund: "arrival",
    flugnumer: "FI 204",
    flugfelag: "Icelandair",
    borg: "London (LHR)",
    aaetlad: klstFraNu(20),
    raun: klstFraNu(18),
    hlid: "D5",
    staedi: "12",
    faeriband: "3",
    stada: "Lendir",
    schengen: "N",
  },
  {
    id: "s-2",
    tegund: "arrival",
    flugnumer: "FI 318",
    flugfelag: "Icelandair",
    borg: "Kaupmannahöfn (CPH)",
    aaetlad: klstFraNu(45),
    hlid: "D2",
    staedi: "8",
    faeriband: "1",
    stada: "Á áætlun",
    schengen: "S",
  },
  {
    id: "s-3",
    tegund: "departure",
    flugnumer: "FI 451",
    flugfelag: "Icelandair",
    borg: "Boston (BOS)",
    aaetlad: klstFraNu(30),
    hlid: "D7",
    staedi: "15",
    stada: "Boarding",
    schengen: "N",
  },
  {
    id: "s-4",
    tegund: "departure",
    flugnumer: "OG 742",
    flugfelag: "Play",
    borg: "Alicante (ALC)",
    aaetlad: klstFraNu(60),
    hlid: "D1",
    staedi: "5",
    stada: "Á áætlun",
    schengen: "S",
  },
  {
    id: "s-5",
    tegund: "departure",
    flugnumer: "FI 614",
    flugfelag: "Icelandair",
    borg: "Frankfurt (FRA)",
    aaetlad: klstFraNu(75),
    hlid: "D3",
    staedi: "9",
    stada: "Á áætlun",
    schengen: "S",
  },
  {
    id: "s-6",
    tegund: "arrival",
    flugnumer: "OG 121",
    flugfelag: "Play",
    borg: "Tenerife (TFS)",
    aaetlad: klstFraNu(90),
    hlid: "D4",
    staedi: "11",
    faeriband: "2",
    stada: "Á áætlun",
    schengen: "S",
  },
];

export function syniSvar(): FidsSvar {
  return {
    uppfaert: new Date().toISOString(),
    heimild: "synidaemi",
    flug: SYNI_FLUG,
  };
}
