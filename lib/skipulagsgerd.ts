// Skipulagsgerð (Planmaker) – slembiraðar pósta fyrir alla starfsmenn vaktarinnar
// en heldur sömu uppbyggingu og upprunalega vaktaplanið:
//
//   Fyrstu 6 tímarammar: meginrúllun um Norður / DMA CCTV / Flughlað /
//   Afleysing / Landside / CCTV – einn maður í hverri stöðu, skiptir um stöðu
//   á hverri klukkustund (hringekja).
//   Seinni 6 tímarammar: þeir sem voru ekki í meginrúllunni fyrri hlutann fara
//   í hana seinni hlutann (og öfugt) – alltaf eitt plan í byrjun, annað seinni
//   hlutann.
//   Þeir sem eru ekki í meginrúllunni á hverjum tíma fara á aukastöðu: á
//   dagvakt fara tveir á samfellt 6 tíma Schengen-vakt, restin rúllar á
//   DMA/Verkefni á 2 tíma fresti. Á næturvakt er engin Schengen-vakt – allir
//   sem ekki eru í meginrúllunni rúlla á DMA/Verkefni á 2 tíma fresti.
//
// Útkallsmaður (lausa stöðan) er undanskilinn slembiröðun – hann heldur sinni
// föstu 12 tíma rúllun um meginstöðurnar óháð planinu.

import { Postur, Starfsmadur, TIMAR } from "./data/starfsfolk";
import { VerkefniVakt } from "./data/verkefni";

const MEGINSTODUR: Postur[] = [
  "Norður",
  "DMA CCTV",
  "Flughlað",
  "Afleysing",
  "Landside",
  "CCTV",
];

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

/** 6 staka rúlla: maður á vísi `i` fær stöðu (i + offset) % 6 á hverri klst. */
function meginrullaFyrir(fjoldiIHopi: number, offset: number): Postur[][] {
  return Array.from({ length: fjoldiIHopi }, (_, i) =>
    Array.from({ length: HELMINGUR }, (_, klst) => MEGINSTODUR[(i + offset + klst) % 6])
  );
}

/** Tveir til vals: DMA fyrst eða Verkefni fyrst, 2 tíma blokkir. */
function dmaVerkefniRulla(fyrstDma: boolean): Postur[] {
  const blokkir: Postur[] = fyrstDma
    ? ["DMA", "DMA", "Verkefni", "Verkefni", "DMA", "DMA"]
    : ["Verkefni", "Verkefni", "DMA", "DMA", "Verkefni", "Verkefni"];
  return blokkir;
}

/**
 * Býr til nýtt, slembiraðað skipulag fyrir starfsmenn vaktarinnar.
 * Heldur útkallsmanni óbreyttum (hans staða er regluleg lausastaða, ekki
 * úthlutuð manneskja).
 */
export function gerdaSlembidSkipulag(
  starfsfolk: Starfsmadur[],
  vaktgerd: VerkefniVakt
): Skipulag {
  const skipulag: Skipulag = {};

  const utkall = starfsfolk.find((s) => s.utkall);
  if (utkall) skipulag[utkall.id] = utkall.postar.slice();

  const adrir = stokka(starfsfolk.filter((s) => !s.utkall));
  const fjoldiIRullu = Math.min(6, adrir.length);
  const rullaHopur1 = adrir.slice(0, fjoldiIRullu); // í meginrúllu fyrri hluta
  const aukastodaHopur1 = adrir.slice(fjoldiIRullu); // á aukastöðu fyrri hluta

  // Seinni hluta skiptast hóparnir á: aukastöðuhópurinn fer núna í
  // meginrúlluna (allt að 6), og meginrúlluhópurinn fer á aukastöðu.
  const rullaHopur2 = aukastodaHopur1.slice(0, 6);
  const aukastodaHopur2 = [...rullaHopur1, ...aukastodaHopur1.slice(6)];

  const fyrriRulla = meginrullaFyrir(rullaHopur1.length, 0);
  rullaHopur1.forEach((s, i) => {
    skipulag[s.id] = fyrriRulla[i];
  });

  const seinniRulla = meginrullaFyrir(rullaHopur2.length, 0);
  rullaHopur2.forEach((s, i) => {
    skipulag[s.id] = [...(skipulag[s.id] ?? []), ...seinniRulla[i]];
  });

  // Aukastöður fyrri hluta.
  const schengenFjoldi = vaktgerd === "dagur" ? Math.min(2, aukastodaHopur1.length) : 0;
  aukastodaHopur1.forEach((s, i) => {
    const block: Postur[] =
      i < schengenFjoldi
        ? Array(HELMINGUR).fill("Schengen")
        : dmaVerkefniRulla(i % 2 === 0);
    skipulag[s.id] = [...(skipulag[s.id] ?? []), ...block];
  });

  // Aukastöður seinni hluta (meginrúlluhópur #1 lendir hér núna).
  const schengenFjoldi2 = vaktgerd === "dagur" ? Math.min(2, aukastodaHopur2.length) : 0;
  aukastodaHopur2.forEach((s, i) => {
    const block: Postur[] =
      i < schengenFjoldi2
        ? Array(HELMINGUR).fill("Schengen")
        : dmaVerkefniRulla(i % 2 === 1);
    skipulag[s.id] = [...(skipulag[s.id] ?? []), ...block];
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
