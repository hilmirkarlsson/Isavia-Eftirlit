// Starfsfólk og SKIPULAG DAGSINS (vaktaskipulag) fyrir eftirlitsdeild.
//
// Nákvæm uppskrift úr skipulagi dagsins 22.06.2026 (vakt E & B).
// Hver starfsmaður hefur 12 pósta, í sömu röð og TIMAR (05:30–16:30).

export type Postur =
  | "Norður"
  | "DMA CCTV"
  | "Flughlað"
  | "Afleysing"
  | "Landside"
  | "CCTV"
  | "DMA"
  | "Verkefni"
  | "Schengen"
  | "Frí"
  | "";

export type Starfsmadur = {
  id: string;
  nafn: string;
  /** Póstur fyrir hvern tímaramma, í sömu röð og TIMAR. */
  postar: Postur[];
  /** Útkallsmaður – ekki nafngreindur einstaklingur, heldur laus staða. */
  utkall?: boolean;
};

export type Vakt = {
  dagsetning: string; // ISO dagsetning
  heiti: string; // t.d. "Dagvakt"
  vakt: string; // t.d. "E & B"
  vardstjori: string;
  adstodarvardstjori: string;
  timar: string[];
  starfsfolk: Starfsmadur[];
};

// Tímarammar skipulagsins (12 römmum, 05:30–16:30).
export const TIMAR = [
  "05:30",
  "06:30",
  "07:30",
  "08:30",
  "09:30",
  "10:30",
  "11:30",
  "12:30",
  "13:30",
  "14:30",
  "15:30",
  "16:30",
];

export const VAKT: Vakt = {
  dagsetning: "2026-06-22",
  heiti: "Dagvakt",
  vakt: "E & B",
  vardstjori: "Ómar",
  adstodarvardstjori: "Ágúst",
  timar: TIMAR,
  starfsfolk: [
    {
      id: "omar",
      nafn: "Ómar",
      postar: ["Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí"],
    },
    {
      id: "agust",
      nafn: "Ágúst",
      postar: ["Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí"],
    },
    {
      id: "pall",
      nafn: "Páll",
      postar: ["Norður", "DMA CCTV", "Flughlað", "Afleysing", "Landside", "CCTV", "Schengen", "Schengen", "Schengen", "Schengen", "Schengen", "Schengen"],
    },
    {
      id: "jon",
      nafn: "Jón",
      postar: ["CCTV", "Norður", "DMA CCTV", "Flughlað", "Afleysing", "Landside", "Verkefni", "Verkefni", "DMA", "DMA", "Verkefni", "Verkefni"],
    },
    {
      id: "hilmir",
      nafn: "Hilmir",
      postar: ["Landside", "CCTV", "Norður", "DMA CCTV", "Flughlað", "Afleysing", "Verkefni", "Verkefni", "DMA", "DMA", "Verkefni", "Verkefni"],
    },
    {
      id: "svala",
      nafn: "Svala",
      postar: ["Afleysing", "Landside", "CCTV", "Norður", "DMA CCTV", "Flughlað", "DMA", "DMA", "Verkefni", "Verkefni", "DMA", "DMA"],
    },
    {
      id: "baldur",
      nafn: "Baldur",
      postar: ["Flughlað", "Afleysing", "Landside", "CCTV", "Norður", "DMA CCTV", "DMA", "DMA", "Verkefni", "Verkefni", "DMA", "DMA"],
    },
    {
      id: "utkall",
      nafn: "ÚTKALL",
      postar: ["DMA CCTV", "Flughlað", "Afleysing", "Landside", "CCTV", "Norður", "Flughlað", "Afleysing", "Landside", "CCTV", "Norður", "DMA CCTV"],
      utkall: true,
    },
    {
      id: "robert",
      nafn: "Róbert",
      postar: ["Schengen", "Schengen", "Schengen", "Schengen", "Schengen", "Schengen", "DMA CCTV", "Flughlað", "Afleysing", "Landside", "CCTV", "Norður"],
    },
    {
      id: "benedikt",
      nafn: "Benedikt",
      postar: ["Verkefni", "Verkefni", "DMA", "DMA", "Verkefni", "Verkefni", "Norður", "DMA CCTV", "Flughlað", "Afleysing", "Landside", "CCTV"],
    },
    {
      id: "gauti",
      nafn: "Gauti",
      postar: ["DMA", "DMA", "Verkefni", "Verkefni", "DMA", "DMA", "Afleysing", "Landside", "CCTV", "Norður", "DMA CCTV", "Flughlað"],
    },
    {
      id: "olafur",
      nafn: "Ólafur",
      postar: ["Verkefni", "Verkefni", "DMA", "DMA", "Verkefni", "Verkefni", "Landside", "CCTV", "Norður", "DMA CCTV", "Flughlað", "Afleysing"],
    },
    {
      id: "kamilla",
      nafn: "Kamilla",
      postar: ["DMA", "DMA", "Verkefni", "Verkefni", "DMA", "DMA", "CCTV", "Norður", "DMA CCTV", "Flughlað", "Afleysing", "Landside"],
    },
  ],
};

/** Litur fyrir hvern póst (Tailwind klasar). */
export const POSTUR_LITUR: Record<Postur, string> = {
  "Norður": "bg-sky-100 text-sky-800",
  "DMA CCTV": "bg-indigo-100 text-indigo-800",
  "Flughlað": "bg-teal-100 text-teal-800",
  "Afleysing": "bg-amber-100 text-amber-800",
  "Landside": "bg-lime-100 text-lime-800",
  "CCTV": "bg-purple-100 text-purple-800",
  "DMA": "bg-orange-100 text-orange-800",
  "Verkefni": "bg-rose-100 text-rose-800",
  "Schengen": "bg-blue-100 text-blue-800",
  "Frí": "bg-slate-100 text-slate-400",
  "": "bg-slate-50 text-slate-300",
};

/** Er þessi starfsmaður vaktstjóri eða aðstoðarvaktstjóri þessarar vaktar? */
export function erVaktstjori(nafn: string | undefined, vakt: Vakt = VAKT): boolean {
  if (!nafn) return false;
  return nafn === vakt.vardstjori || nafn === vakt.adstodarvardstjori;
}

/** Finnur vísi tímaramma sem á við klukkustund/mínútu núna (eða næsta á undan). */
export function virkurTimaVisir(now = new Date()): number {
  const mins = now.getHours() * 60 + now.getMinutes();
  let visir = -1;
  TIMAR.forEach((t, i) => {
    const [h, m] = t.split(":").map(Number);
    if (h * 60 + m <= mins) visir = i;
  });
  return visir; // -1 ef fyrir fyrsta ramma
}
