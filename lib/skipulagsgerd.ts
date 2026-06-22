// Skipulagsgerð (Planmaker) – slembiraðar pósta fyrir alla starfsmenn vaktarinnar.
//
// Mannafla-reglur (staðfestar af notanda út frá raunverulegum vaktaplönum):
//   - Norður, DMA CCTV, Flughlað, Landside, CCTV: alltaf nákvæmlega 1 maður
//     hvor – þetta eru "nauðsynlegu stöðurnar" og þær mega ALDREI vera
//     mannlausar á meðan einhver er á Afleysingu eða öðrum aukastöðum.
//   - DMA: alltaf nákvæmlega 2 menn.
//   - Verkefni: alltaf 2 menn á dagvakt, 1 maður á næturvakt.
//   - Schengen: alltaf nákvæmlega 1 maður – samfelld 6 klst. vakt á dagvakt
//     (tveir mismunandi einstaklingar skiptast á milli helminga dagsins),
//     en á 2 klst. fresti (eins og DMA/Verkefni) á næturvakt.
//   - Afleysing: afgangsstaðan – mönnuð EFTIR að allar ofangreindar stöður
//     eru full mannaðar. Getur haft fleiri en einn mann ef framboð er meira
//     en þörf, en er fyrst og fremst "auka" fólk.
//
// Vaktinni er skipt í tvo 6 klst. helminga (TIMAR 05:30–16:30). Þeir sem eru
// í nauðsynlegu rúllunni fyrri helminginn fara á aukastöður (DMA/Verkefni/
// Schengen/Afleysing) seinni helminginn og öfugt, svo álagið dreifist.
//
// Útkallsmaður (lausa stöðan) er undanskilinn slembiröðun – hann heldur
// sinni föstu 12 tíma rúllun um meginstöðurnar óháð planinu. Vaktstjóri og
// aðstoðarvaktstjóri taka heldur ekki þátt – þeir eru valdir sérstaklega.

import { Postur, Starfsmadur, TIMAR } from "./data/starfsfolk";
import { VerkefniVakt } from "./data/verkefni";

const NAUDSYNLEGAR_STODUR: Postur[] = [
  "Norður",
  "DMA CCTV",
  "Flughlað",
  "Landside",
  "CCTV",
];

const ESSENTIAL_FJOLDI = NAUDSYNLEGAR_STODUR.length; // 5

const HELMINGUR = TIMAR.length / 2; // 6

export type Skipulag = Record<string, Postur[]>;

function stokka<T>(listi: T[]): T[] {
  const a = listi.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Rúlla nauðsynlegu stöðvanna fyrir einn helming vaktarinnar: maður á vísi
 * `i` fær stöðu (-i + offset + klst) % 5, sömu "keðju"-hegðun og raunveruleg
 * skipulög sýna. Ef færri en 5 eru í hópnum verður einhver stöð mannlaus þá
 * klukkustund (eðlilegt þegar undirmannað er) – en Afleysing tekur ALDREI
 * sæti þeirra, hún er ekki hluti af þessari rúllu.
 */
function nauðsynlegRullaFyrir(fjoldiIHopi: number, offset: number): Postur[][] {
  const n = ESSENTIAL_FJOLDI;
  return Array.from({ length: fjoldiIHopi }, (_, i) =>
    Array.from(
      { length: HELMINGUR },
      (_, klst) => NAUDSYNLEGAR_STODUR[(((-i + offset + klst) % n) + n) % n]
    )
  );
}

/** Fjöldi sem þarf í aukastöður (DMA + Verkefni + Schengen) hvern helming. */
function aukastodaThorf(vaktgerd: VerkefniVakt): number {
  // Dagvakt: DMA(2) + Verkefni(2) + Schengen(1) = 5.
  // Næturvakt: DMA(2) + Verkefni(1) + Schengen(1) = 4.
  return vaktgerd === "dagur" ? 5 : 4;
}

/**
 * Aukastöður á dagvakt: einn maður fær samfellda Schengen-vakt allan
 * helminginn, restin (allt að 4) rúllar DMA/DMA/Verkefni/Verkefni á 2 klst.
 * fresti svo alltaf séu nákvæmlega 2 á DMA og 2 á Verkefni samtímis.
 */
function dagAukastodaRulla(fjoldi: number): Postur[][] {
  if (fjoldi <= 0) return [];
  const blokkir = HELMINGUR / 2; // 3 tveggja klst. blokkir
  if (fjoldi >= ESSENTIAL_FJOLDI) {
    // ESSENTIAL_FJOLDI er hér 5: 1 Schengen + 4 í DMA/Verkefni rúllu.
    const result: Postur[][] = [Array(HELMINGUR).fill("Schengen")];
    const rotSlots: Postur[] = ["DMA", "DMA", "Verkefni", "Verkefni"];
    for (let i = 0; i < 4; i++) {
      const arr: Postur[] = [];
      for (let b = 0; b < blokkir; b++) {
        const slot = rotSlots[(i + b) % rotSlots.length];
        arr.push(slot, slot);
      }
      result.push(arr);
    }
    return result.slice(0, fjoldi);
  }
  // Undirmannað: föst úthlutun í forgangsröð, engin rúllun.
  const forgangur: Postur[] = ["Schengen", "DMA", "DMA", "Verkefni", "Verkefni"];
  return Array.from({ length: fjoldi }, (_, i) => Array(HELMINGUR).fill(forgangur[i]));
}

/**
 * Aukastöður á næturvakt: engin samfelld Schengen-vakt – DMA/DMA/Verkefni/
 * Schengen rúlla öll á 2 klst. fresti svo alltaf séu nákvæmlega 2 á DMA,
 * 1 á Verkefni og 1 á Schengen samtímis.
 */
function nottAukastodaRulla(fjoldi: number): Postur[][] {
  if (fjoldi <= 0) return [];
  const blokkir = HELMINGUR / 2; // 3 tveggja klst. blokkir
  const slots: Postur[] = ["DMA", "DMA", "Verkefni", "Schengen"];
  if (fjoldi >= slots.length) {
    const result: Postur[][] = [];
    for (let i = 0; i < slots.length; i++) {
      const arr: Postur[] = [];
      for (let b = 0; b < blokkir; b++) {
        const slot = slots[(i + b) % slots.length];
        arr.push(slot, slot);
      }
      result.push(arr);
    }
    return result.slice(0, fjoldi);
  }
  // Undirmannað: föst úthlutun í forgangsröð, engin rúllun.
  return Array.from({ length: fjoldi }, (_, i) => Array(HELMINGUR).fill(slots[i]));
}

/**
 * Býr til nýtt, slembiraðað skipulag fyrir starfsmenn vaktarinnar.
 * Heldur útkallsmanni óbreyttum (hans staða er regluleg lausastaða, ekki
 * úthlutuð manneskja). Vaktstjóri og aðstoðarvaktstjóri taka ekki þátt í
 * slembiröðuninni – þeir eru valdir sérstaklega, ekki úthlutaðir póstum.
 */
export function gerdaSlembidSkipulag(
  starfsfolk: Starfsmadur[],
  vaktgerd: VerkefniVakt,
  undanskildirIds: string[] = []
): Skipulag {
  const skipulag: Skipulag = {};

  const utkall = starfsfolk.find((s) => s.utkall);
  if (utkall) skipulag[utkall.id] = utkall.postar.slice();

  const adrir = stokka(
    starfsfolk.filter((s) => !s.utkall && !undanskildirIds.includes(s.id))
  );

  const aukaThorf = aukastodaThorf(vaktgerd);
  const aukastodaRullaFyrir = vaktgerd === "dagur" ? dagAukastodaRulla : nottAukastodaRulla;

  // Fyrri helmingur.
  const nauðsynlegir1 = adrir.slice(0, Math.min(ESSENTIAL_FJOLDI, adrir.length));
  const afgangur1 = adrir.slice(nauðsynlegir1.length);
  const aukastod1 = afgangur1.slice(0, Math.min(aukaThorf, afgangur1.length));
  const afleysing1 = afgangur1.slice(aukastod1.length);

  // Seinni helmingur: þeir sem voru ekki í nauðsynlegu rúllunni fyrri
  // hlutann fara í hana núna, og fyrri nauðsynlegir fara á aukastöður.
  const nauðsynlegir2 = afgangur1.slice(0, Math.min(ESSENTIAL_FJOLDI, afgangur1.length));
  const afgangur2 = [...nauðsynlegir1, ...afgangur1.slice(nauðsynlegir2.length)];
  const aukastod2 = afgangur2.slice(0, Math.min(aukaThorf, afgangur2.length));
  const afleysing2 = afgangur2.slice(aukastod2.length);

  const nauðsynlegRulla1 = nauðsynlegRullaFyrir(nauðsynlegir1.length, 0);
  nauðsynlegir1.forEach((s, i) => {
    skipulag[s.id] = nauðsynlegRulla1[i];
  });

  const nauðsynlegRulla2 = nauðsynlegRullaFyrir(nauðsynlegir2.length, 0);
  nauðsynlegir2.forEach((s, i) => {
    skipulag[s.id] = [...(skipulag[s.id] ?? []), ...nauðsynlegRulla2[i]];
  });

  const aukastodaRulla1 = aukastodaRullaFyrir(aukastod1.length);
  aukastod1.forEach((s, i) => {
    skipulag[s.id] = [...(skipulag[s.id] ?? []), ...aukastodaRulla1[i]];
  });

  const aukastodaRulla2 = aukastodaRullaFyrir(aukastod2.length);
  aukastod2.forEach((s, i) => {
    skipulag[s.id] = [...(skipulag[s.id] ?? []), ...aukastodaRulla2[i]];
  });

  afleysing1.forEach((s) => {
    skipulag[s.id] = [...(skipulag[s.id] ?? []), ...Array(HELMINGUR).fill("Afleysing")];
  });
  afleysing2.forEach((s) => {
    skipulag[s.id] = [...(skipulag[s.id] ?? []), ...Array(HELMINGUR).fill("Afleysing")];
  });

  return skipulag;
}

/** Skilar starfsfólkslista með pósta yfirskrifaða úr `skipulag` (ef til). */
export function virkStarfsfolk(starfsfolk: Starfsmadur[], skipulag: Skipulag | null): Starfsmadur[] {
  if (!skipulag) return starfsfolk;
  return starfsfolk.map((s) =>
    skipulag[s.id] ? { ...s, postar: skipulag[s.id] } : s
  );
}
