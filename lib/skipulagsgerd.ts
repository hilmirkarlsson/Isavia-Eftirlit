// Skipulagsgerð (Planmaker) – slembiraðar pósta fyrir alla starfsmenn vaktarinnar.
//
// Mannafla-reglur (staðfestar af notanda út frá raunverulegum vaktaplönum):
//   - Norður, DMA CCTV, Flughlað, Landside, CCTV, Afleysing, Verkefni,
//     Schengen: alltaf nákvæmlega 1 maður hvor, á hverri klukkustund.
//   - DMA er EINA stöðin sem má hafa 2 menn samtímis.
//   - Verkefni: 2 menn á dagvakt, 1 maður á næturvakt (DMA er alltaf 2).
//   - Schengen: samfelld vakt allan helminginn (einn maður), bæði á dag- og
//     næturvakt – tveir mismunandi einstaklingar skiptast á milli helminga.
//
// Tveir hópar á hverjum 6 klst. helmingi:
//   - Hópur A (allt að 6 manns): meginrúlla – rúllar klukkustund fyrir
//     klukkustund í gegnum nauðsynlegu stöðurnar 5 OG Afleysingu (alls 6
//     "slotar"). Þetta er fullkominn Latin-ferningur þegar hópurinn er 6
//     manns: hver stöð, þ.m.t. Afleysing, er mönnuð af nákvæmlega einum
//     manni hverja klukkustund, og hver maður fær Afleysingu nákvæmlega
//     1 klst. af sínum 6 – ekki lengur.
//   - Hópur B: Schengen (samfellt) + DMA/Verkefni á 2 klst. fresti. ENGIN
//     Afleysing í þessum hópi.
//   - Ef fleiri eru í boði en bæði hóparnir taka er afgangurinn án stöðu
//     þann helming (eðlilegt þegar yfirmannað er).
//
// Vaktinni er skipt í tvo 6 klst. helminga (TIMAR 05:30–16:30). Hópur A
// fyrri helminginn fer í hóp B seinni helminginn og öfugt, svo álagið
// dreifist og sami maður er aldrei í tveimur hópum samtímis.
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

// Meginrúllan (hópur A) rúllar í gegnum nauðsynlegu stöðurnar OG Afleysingu,
// hver klukkustund er sérstakur "slot" – þannig fær hver maður í hópnum
// Afleysingu nákvæmlega 1 klst. af sínum 6 og engin stöð fær fleiri en 1
// mann samtímis (nema hópur B-DMA, sem er handleggt sérstaklega).
const MEGINRULLA_SLOTAR: Postur[] = [...NAUDSYNLEGAR_STODUR, "Afleysing"];
const MEGINRULLA_FJOLDI = MEGINRULLA_SLOTAR.length; // 6

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
 * Meginrúlla hóps A fyrir einn helming vaktarinnar: maður á vísi `i` fær
 * stöðu (-i + offset + klst) % 6 úr MEGINRULLA_SLOTAR (5 nauðsynlegar stöður
 * + Afleysing). Þar sem hópurinn er nákvæmlega 6 manns og slotarnir 6 er
 * þetta fullkominn Latin-ferningur – hver stöð (þ.m.t. Afleysing) er mönnuð
 * af nákvæmlega einum manni hverja klukkustund, og hver maður fær Afleysingu
 * nákvæmlega 1 klst. af 6. Ef færri en 6 eru í hópnum verður einhver stöð
 * mannlaus þá klukkustund (eðlilegt þegar undirmannað er).
 */
function meginRullaFyrir(fjoldiIHopi: number, offset: number): Postur[][] {
  const n = MEGINRULLA_FJOLDI;
  return Array.from({ length: fjoldiIHopi }, (_, i) =>
    Array.from(
      { length: HELMINGUR },
      (_, klst) => MEGINRULLA_SLOTAR[(((-i + offset + klst) % n) + n) % n]
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
 * Aukastöður (hópur B): einn maður fær samfellda Schengen-vakt allan
 * helminginn, restin rúllar DMA/Verkefni klukkustund fyrir klukkustund.
 * Sama Latin-ferninga-brögð og í meginrúllunni: rótari `i` er á DMA þá
 * klukkustund `h` þegar `(h + i) % rotarar < kDma`, annars Verkefni. Þetta
 * tryggir að DMA er ALDREI meira en 2 klst. samfleytt fyrir neinn rótara,
 * óháð fjölda rótara – ólíkt Verkefni og Schengen sem mega vera samfelld
 * lengur (Schengen er það alltaf, Verkefni getur orðið það).
 */
function aukastodaRulla(fjoldi: number): Postur[][] {
  if (fjoldi <= 0) return [];
  const result: Postur[][] = [Array(HELMINGUR).fill("Schengen")];
  const rotarar = fjoldi - 1;
  if (rotarar <= 0) return result.slice(0, fjoldi);
  const kDma = Math.min(2, rotarar);
  for (let i = 0; i < rotarar; i++) {
    const arr: Postur[] = Array.from({ length: HELMINGUR }, (_, h) =>
      (h + i) % rotarar < kDma ? "DMA" : "Verkefni"
    );
    result.push(arr);
  }
  return result.slice(0, fjoldi);
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

  // Fyrri helmingur: skiptum öllum í tvo ósamskarast hópa + afgang.
  //   Hópur A (allt að 6): meginrúlla um nauðsynlegu stöðurnar + Afleysingu.
  //   Hópur B (allt að aukaThorf): Schengen/DMA/Verkefni – engin Afleysing.
  //   Afgangur: of margir í boði, fá enga stöð þennan helming.
  const hopA1 = adrir.slice(0, Math.min(MEGINRULLA_FJOLDI, adrir.length));
  const eftir1 = adrir.slice(hopA1.length);
  const hopB1 = eftir1.slice(0, Math.min(aukaThorf, eftir1.length));
  const idle1 = eftir1.slice(hopB1.length);

  // Seinni helmingur: þeir sem voru í hópi B (og afgangi) fyrri hlutann fara
  // í meginrúlluna núna, og hópur A fyrri hlutann fer á aukastöður – sami
  // maður er aldrei í tveimur hópum samtímis, svo engar tvíúthlutanir verða.
  const pool2 = [...hopB1, ...idle1, ...hopA1];
  const hopA2 = pool2.slice(0, Math.min(MEGINRULLA_FJOLDI, pool2.length));
  const eftir2 = pool2.slice(hopA2.length);
  const hopB2 = eftir2.slice(0, Math.min(aukaThorf, eftir2.length));
  const idle2 = eftir2.slice(hopB2.length);

  // Fyrri helmingur fyrst – setur upphafsfylki fyrir alla.
  const meginRulla1 = meginRullaFyrir(hopA1.length, 0);
  hopA1.forEach((s, i) => {
    skipulag[s.id] = meginRulla1[i];
  });

  const aukastodaRulla1 = aukastodaRulla(hopB1.length);
  hopB1.forEach((s, i) => {
    skipulag[s.id] = aukastodaRulla1[i];
  });

  idle1.forEach((s) => {
    skipulag[s.id] = Array(HELMINGUR).fill("");
  });

  // Seinni helmingur – bætt við í lokin svo fylkin haldist í réttri röð.
  const meginRulla2 = meginRullaFyrir(hopA2.length, 0);
  hopA2.forEach((s, i) => {
    skipulag[s.id] = [...(skipulag[s.id] ?? []), ...meginRulla2[i]];
  });

  const aukastodaRulla2 = aukastodaRulla(hopB2.length);
  hopB2.forEach((s, i) => {
    skipulag[s.id] = [...(skipulag[s.id] ?? []), ...aukastodaRulla2[i]];
  });

  idle2.forEach((s) => {
    skipulag[s.id] = [...(skipulag[s.id] ?? []), ...Array(HELMINGUR).fill("")];
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
