// Starfsfólk og SKIPULAG DAGSINS (vaktaskipulag) fyrir eftirlitsdeild.
//
// ⚠️ ATH – LEIÐRÉTTIÐ: Þetta er besta lesning úr ljósmyndinni af
// skipulagi dagsins (22.06.2026, vakt E & B). Rótering efri hópsins
// (Norður → DMA CCTV → Flughlað → Afleysing → Landside → CCTV) er
// nokkuð skýr, en neðri hópurinn (Verkefni / DMA / Schengen) er
// ágiskun. Lagfærið nöfn og pósta hér að neðan svo þetta passi nákvæmlega.

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
};

export type Vakt = {
  dagsetning: string; // ISO dagsetning
  heiti: string; // t.d. "Dagvakt"
  vakt: string; // t.d. "E & B"
  vardstjori: string;
  adstodarvardstjori: string;
  /** Tímarammar dagsins. */
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

// Rótering efri hópsins (6 póstar sem ganga á milli starfsfólks).
const ROT: Postur[] = ["Norður", "DMA CCTV", "Flughlað", "Afleysing", "Landside", "CCTV"];

/** Býr til 12 pósta með róteringu, út frá byrjunarstöðu í ROT. */
function rotering(byrjun: number): Postur[] {
  return TIMAR.map((_, i) => ROT[(byrjun + i) % ROT.length]);
}

export const VAKT: Vakt = {
  dagsetning: "2026-06-22",
  heiti: "Dagvakt",
  vakt: "E & B",
  vardstjori: "Ómar Þór Kristinsson",
  adstodarvardstjori: "Ágúst Þór Ingibjargarson",
  timar: TIMAR,
  starfsfolk: [
    { id: "pall", nafn: "Páll Steinar Sigurðsson", postar: rotering(0) },
    { id: "jon", nafn: "Jón Eysteinsson", postar: rotering(5) },
    { id: "hilmir", nafn: "Hilmir Karlsson", postar: rotering(4) },
    { id: "svala", nafn: "Svala Rún Stefánsdóttir", postar: rotering(3) },
    { id: "baldur", nafn: "Baldur Þórsson", postar: rotering(2) },
    { id: "utkall", nafn: "ÚTKALL !!!", postar: rotering(1) },
    // Neðri hópur – Verkefni / DMA / Schengen (ágiskun, leiðréttið):
    {
      id: "robert",
      nafn: "Róbert Ólafur Sigurðsson",
      postar: [
        "Verkefni", "Verkefni", "Verkefni", "DMA", "Verkefni", "DMA",
        "Schengen", "Schengen", "Schengen", "DMA", "Verkefni", "DMA",
      ],
    },
    {
      id: "benedikt",
      nafn: "Benedikt Guðjón Axelsson",
      postar: [
        "Verkefni", "DMA", "Verkefni", "Afleysing", "Landside", "CCTV",
        "Norður", "Verkefni", "DMA", "Verkefni", "DMA", "Verkefni",
      ],
    },
    {
      id: "gauti",
      nafn: "Gauti Már Karlsson",
      postar: [
        "DMA", "Verkefni", "Landside", "CCTV", "DMA CCTV", "Flughlað",
        "DMA", "Verkefni", "DMA", "CCTV", "Norður", "DMA CCTV",
      ],
    },
    {
      id: "olafur",
      nafn: "Ólafur H. Sigurbjörnsson",
      postar: [
        "Verkefni", "DMA", "Verkefni", "CCTV", "Norður", "DMA CCTV",
        "Flughlað", "Afleysing", "Verkefni", "DMA", "Verkefni", "DMA",
      ],
    },
    {
      id: "kamilla",
      nafn: "Kamilla Wilberg Antonsdóttir",
      postar: [
        "DMA", "Verkefni", "DMA", "CCTV", "Norður", "DMA CCTV",
        "Flughlað", "Afleysing", "Landside", "Verkefni", "DMA", "Verkefni",
      ],
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
