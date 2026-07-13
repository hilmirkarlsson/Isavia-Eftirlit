// Starfsfólk og SKIPULAG DAGSINS (vaktaskipulag) fyrir eftirlitsdeild.
//
// Nákvæm uppskrift úr skipulagi dagsins 11.07.2026 (vakt E - B).
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
  /** Póstur fyrir hvern tímaramma á næturvakt, í sömu röð og TIMAR_NOTT (ef til). */
  postarNott?: Postur[];
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

// Tímarammar næturvaktar (12 römmum, 17:30–04:30). Úr "Skipulag dagsins"
// fyrir næturvakt E, 13.07.2026.
export const TIMAR_NOTT = [
  "17:30",
  "18:30",
  "19:30",
  "20:30",
  "21:30",
  "22:30",
  "23:30",
  "00:30",
  "01:30",
  "02:30",
  "03:30",
  "04:30",
];

export const VAKT: Vakt = {
  dagsetning: "2026-07-11",
  heiti: "Dagvakt",
  vakt: "E - B",
  vardstjori: "Rannveig",
  adstodarvardstjori: "Jón",
  timar: TIMAR,
  starfsfolk: [
    {
      id: "rannveig",
      nafn: "Rannveig",
      postar: ["Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí"],
    },
    {
      id: "jon-marino",
      nafn: "Jón",
      postar: ["Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí"],
    },
    {
      id: "rafnar",
      nafn: "Rafnar",
      postar: ["Afleysing", "Landside", "CCTV", "Norður", "Flughlað", "Afleysing", "Schengen", "Schengen", "Schengen", "Schengen", "Schengen", "Schengen"],
      postarNott: ["Afleysing", "Landside", "CCTV", "Norður", "DMA CCTV", "Afleysing", "DMA", "DMA", "Verkefni", "Verkefni", "DMA", "DMA"],
    },
    {
      id: "nedas",
      nafn: "Nedas",
      postar: ["Flughlað", "Afleysing", "Landside", "CCTV", "Norður", "Flughlað", "Verkefni", "Verkefni", "DMA", "DMA", "DMA", "DMA"],
      // Ekki á næturvakt E (13.07.2026).
      postarNott: ["Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí"],
    },
    {
      id: "gudjon",
      nafn: "Guðjón",
      postar: ["Norður", "Flughlað", "Afleysing", "Landside", "CCTV", "Norður", "DMA", "DMA", "DMA", "DMA", "Verkefni", "Verkefni"],
      postarNott: ["Flughlað", "Afleysing", "Landside", "CCTV", "Norður", "DMA CCTV", "Schengen", "Schengen", "DMA", "DMA", "Verkefni", "Verkefni"],
    },
    {
      id: "kamilla",
      nafn: "Kamilla",
      postar: ["CCTV", "Norður", "Flughlað", "Afleysing", "Landside", "CCTV", "DMA", "DMA", "Verkefni", "Verkefni", "DMA", "DMA"],
      postarNott: ["Norður", "DMA CCTV", "Afleysing", "Flughlað", "Afleysing", "Landside", "CCTV", "Norður", "DMA CCTV", "Afleysing", "Flughlað", "Afleysing"],
    },
    {
      id: "hilmir",
      nafn: "Hilmir",
      postar: ["Landside", "CCTV", "Norður", "Flughlað", "Afleysing", "Landside", "CCTV", "Norður", "Flughlað", "Afleysing", "Landside", "CCTV"],
      postarNott: ["Landside", "CCTV", "Norður", "DMA CCTV", "Afleysing", "Flughlað", "Afleysing", "Landside", "CCTV", "Norður", "DMA CCTV", "Afleysing"],
    },
    {
      id: "stefan",
      nafn: "Stefán",
      postar: ["Schengen", "Schengen", "Schengen", "Schengen", "Schengen", "Schengen", "Flughlað", "Afleysing", "Landside", "CCTV", "Norður", "Flughlað"],
      postarNott: ["CCTV", "Norður", "DMA CCTV", "Afleysing", "Flughlað", "Afleysing", "DMA", "DMA", "Schengen", "Schengen", "DMA", "DMA"],
    },
    {
      id: "selma",
      nafn: "Selma",
      postar: ["DMA", "DMA", "DMA", "DMA", "Verkefni", "Verkefni", "Norður", "Flughlað", "Afleysing", "Landside", "CCTV", "Norður"],
      postarNott: ["Verkefni", "Verkefni", "DMA", "DMA", "Schengen", "Schengen", "Flughlað", "Afleysing", "Landside", "CCTV", "Norður", "DMA CCTV"],
    },
    {
      id: "baldur",
      nafn: "Baldur",
      postar: ["DMA", "DMA", "Verkefni", "Verkefni", "DMA", "DMA", "Afleysing", "Landside", "CCTV", "Norður", "Flughlað", "Afleysing"],
      postarNott: ["DMA", "DMA", "Verkefni", "Verkefni", "DMA", "DMA", "Afleysing", "Flughlað", "Afleysing", "Landside", "CCTV", "Norður"],
    },
    {
      id: "gauti",
      nafn: "Gauti",
      postar: ["Verkefni", "Verkefni", "DMA", "DMA", "DMA", "DMA", "Landside", "CCTV", "Norður", "Flughlað", "Afleysing", "Landside"],
      // Ekki á næturvakt E (13.07.2026).
      postarNott: ["Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí", "Frí"],
    },
    // Starfsfólk sem er aðeins á næturvakt E (13.07.2026) – engin dagvaktarpóstur.
    {
      id: "svala",
      nafn: "Svala",
      postar: ["", "", "", "", "", "", "", "", "", "", "", ""],
      postarNott: ["DMA CCTV", "Afleysing", "Flughlað", "Afleysing", "Landside", "CCTV", "Verkefni", "Verkefni", "DMA", "DMA", "Schengen", "Schengen"],
    },
    {
      id: "jon-eysteinsson",
      nafn: "Jón Eysteinsson",
      postar: ["", "", "", "", "", "", "", "", "", "", "", ""],
      postarNott: ["Afleysing", "Flughlað", "Afleysing", "Landside", "CCTV", "Norður", "DMA CCTV", "Afleysing", "Flughlað", "Afleysing", "Landside", "CCTV"],
    },
    {
      id: "linda",
      nafn: "Linda",
      postar: ["", "", "", "", "", "", "", "", "", "", "", ""],
      postarNott: ["Schengen", "Schengen", "DMA", "DMA", "Verkefni", "Verkefni", "Landside", "CCTV", "Norður", "DMA CCTV", "Afleysing", "Flughlað"],
    },
    {
      id: "kristmundur",
      nafn: "Kristmundur",
      postar: ["", "", "", "", "", "", "", "", "", "", "", ""],
      postarNott: ["DMA", "DMA", "Schengen", "Schengen", "DMA", "DMA", "Norður", "DMA CCTV", "Afleysing", "Flughlað", "Afleysing", "Landside"],
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

/** „Langir" póstar – samfelldir margra-klukkustunda póstar (ólíkt 1-klst
 *  rúllandi póstunum Norður/CCTV/Flughlað/Landside/Afleysing/DMA CCTV). */
export const LANGIR_POSTAR: Postur[] = ["Schengen", "DMA", "Verkefni"];

/**
 * Röðunarflokkur fyrir skipulagstöfluna svo röðin lesist eins og planið:
 *  0 – vaktstjórar efst,
 *  1 – þeir sem eru á löngum pósti (Schengen/DMA/Verkefni) FYRRI 6 tímana,
 *  2 – þeir sem rúlla 1-klst póstum allan daginn/nóttina (miðja),
 *  3 – þeir sem eru á löngum pósti SEINNI 6 tímana (neðst).
 */
export function skipulagsRodun(postar: Postur[], erStjori: boolean): number {
  if (erStjori) return 0;
  const midja = Math.floor(postar.length / 2);
  const langurFyrri = postar.slice(0, midja).some((p) => LANGIR_POSTAR.includes(p));
  const langurSeinni = postar.slice(midja).some((p) => LANGIR_POSTAR.includes(p));
  if (langurFyrri) return 1;
  if (langurSeinni) return 3;
  return 2;
}

/** Er þessi starfsmaður vaktstjóri eða aðstoðarvaktstjóri þessarar vaktar? */
export function erVaktstjori(nafn: string | undefined, vakt: Vakt = VAKT): boolean {
  if (!nafn) return false;
  return nafn === vakt.vardstjori || nafn === vakt.adstodarvardstjori;
}

/** Þeir sem hægt er að velja sem vaktstjóra/aðstoðarvaktstjóra (bráðabirgðalisti). */
export const VALDIR_STJORAR = ["rannveig", "jon-marino"];

/**
 * Skilar `vakt` með vardstjori/adstodarvardstjori yfirskrifuðum úr völdum
 * id-um (ef gild), annars óbreyttu (sjálfgefnu) gildi vaktarinnar.
 */
export function virkVakt(
  vakt: Vakt,
  vardstjoriId: string | null,
  adstodarvardstjoriId: string | null
): Vakt {
  const vardstjoriNafn = vakt.starfsfolk.find((s) => s.id === vardstjoriId)?.nafn;
  const adstodarvardstjoriNafn = vakt.starfsfolk.find((s) => s.id === adstodarvardstjoriId)?.nafn;
  return {
    ...vakt,
    vardstjori: vardstjoriNafn ?? vakt.vardstjori,
    adstodarvardstjori: adstodarvardstjoriNafn ?? vakt.adstodarvardstjori,
  };
}

/** Finnur vísi tímaramma sem á við klukkustund/mínútu núna (eða næsta á undan). */
export function virkurTimaVisir(now = new Date()): number {
  return virkurTimaVisirFyrir(TIMAR, false, now);
}

/**
 * Almenn útgáfa af virkurTimaVisir sem virkar bæði fyrir dagvakt (TIMAR,
 * 05:30–16:30, engin miðnættisbrjótur) og næturvakt (TIMAR_NOTT,
 * 17:30–04:30, fer yfir miðnætti – sömu brögð og röðun næturvaktarverkefna
 * í lib/data/verkefni.ts).
 */
export function virkurTimaVisirFyrir(timar: string[], nott: boolean, now = new Date()): number {
  const minNuna = now.getHours() * 60 + now.getMinutes();
  const radgildi = (mins: number) => (!nott || mins >= 17 * 60 ? mins : mins + 24 * 60);
  const mins = radgildi(minNuna);
  let visir = -1;
  timar.forEach((t, i) => {
    const [h, m] = t.split(":").map(Number);
    if (radgildi(h * 60 + m) <= mins) visir = i;
  });
  return visir; // -1 ef fyrir fyrsta ramma
}
