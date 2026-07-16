// Skipulagsgerð (Planmaker) – slembiraðar pósta fyrir alla starfsmenn vaktarinnar.
//
// Mannafla-reglur (staðfestar af notanda út frá raunverulegum vaktaplönum):
//   - Norður, DMA CCTV, Flughlað, Landside, CCTV og Afleysing rúlla í hópi A.
//   - DMA má hafa 2 menn samtímis; Verkefni getur líka verið tvímannað á
//     dagvakt eftir mannskap.
//   - DMA og Verkefni eru alltaf úthlutuð í 2 klst. blokkum.
//   - Schengen: 6 klst. samfelld vakt á dagvakt, en 2 klst. blokkir á næturvakt.
//
// Tveir hópar á hverjum 6 klst. helmingi:
//   - Hópur A (allt að 6 manns): meginrúlla – rúllar klukkustund fyrir
//     klukkustund í gegnum nauðsynlegu stöðurnar 5 OG Afleysingu (alls 6
//     "slotar"). Þetta er fullkominn Latin-ferningur þegar hópurinn er 6
//     manns: hver stöð, þ.m.t. Afleysing, er mönnuð af nákvæmlega einum
//     manni hverja klukkustund, og hver maður fær Afleysingu nákvæmlega
//     1 klst. af sínum 6 – ekki lengur.
//   - Hópur B: Schengen + DMA/Verkefni. Allar DMA/Verkefni úthlutanir eru
//     2 klst. blokkir; Schengen er 6 klst. á dagvakt en 2 klst. á næturvakt.
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

import { Postur, Starfsmadur, TIMAR, VAKT } from "./data/starfsfolk";
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

export type SlembiValkostir = {
  /** Starfsfólk sem má ekki byrja næsta plan á samfelldri Schengen/screening vakt ef hægt er að forðast það. */
  forbodnirSchengenFyrriHelmingurIds?: string[];
};

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
 * Aukastöður (hópur B). Dagvakt: fyrsti maður fær Schengen allan 6 tíma
 * helminginn, hinir skiptast á DMA/Verkefni í 2 tíma blokkum. Næturvakt:
 * Schengen, DMA og Verkefni rúlla öll í 2 tíma blokkum.
 */
function tveggjaTimaBlokkir(slotar: Postur[]): Postur[] {
  return slotar.flatMap((p) => [p, p]).slice(0, HELMINGUR);
}

function aukastodaRulla(fjoldi: number, vaktgerd: VerkefniVakt): Postur[][] {
  if (fjoldi <= 0) return [];

  if (vaktgerd === "dagur") {
    const result: Postur[][] = [Array(HELMINGUR).fill("Schengen")];
    const rotarar = fjoldi - 1;
    for (let i = 0; i < rotarar; i++) {
      // Fyrri helmingur rotara fer 2 klst. á DMA, seinni 2 klst. á Verkefni,
      // svo er skipt. Þetta heldur báðum póstum í hreinum 2 klst. blokkum.
      const byrjarDma = i % 2 === 0;
      result.push(
        tveggjaTimaBlokkir(byrjarDma ? ["DMA", "Verkefni", "DMA"] : ["Verkefni", "DMA", "Verkefni"])
      );
    }
    return result.slice(0, fjoldi);
  }

  const natturMynstur: Postur[][] = [
    tveggjaTimaBlokkir(["Schengen", "DMA", "Verkefni"]),
    tveggjaTimaBlokkir(["DMA", "Verkefni", "DMA"]),
    tveggjaTimaBlokkir(["DMA", "Schengen", "DMA"]),
    tveggjaTimaBlokkir(["Verkefni", "DMA", "Schengen"]),
  ];
  return natturMynstur.slice(0, fjoldi);
}

function tryggjaSchengenEkkiBannadur(
  hopB: Starfsmadur[],
  varasjodur: Starfsmadur[],
  forbodnirIds: Set<string>
): { hopB: Starfsmadur[]; varasjodur: Starfsmadur[]; breytt: boolean } {
  if (hopB.length === 0 || !forbodnirIds.has(hopB[0].id)) {
    return { hopB, varasjodur, breytt: false };
  }

  const innanHops = hopB.findIndex((s) => !forbodnirIds.has(s.id));
  if (innanHops > 0) {
    const nyttHopB = hopB.slice();
    [nyttHopB[0], nyttHopB[innanHops]] = [nyttHopB[innanHops], nyttHopB[0]];
    return { hopB: nyttHopB, varasjodur, breytt: true };
  }

  const urVarasjodi = varasjodur.findIndex((s) => !forbodnirIds.has(s.id));
  if (urVarasjodi >= 0) {
    const nyttHopB = hopB.slice();
    const nyttVarasjodur = varasjodur.slice();
    const [varamadur] = nyttVarasjodur.splice(urVarasjodi, 1, nyttHopB[0]);
    nyttHopB[0] = varamadur;
    return { hopB: nyttHopB, varasjodur: nyttVarasjodur, breytt: true };
  }

  return { hopB, varasjodur, breytt: false };
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
  undanskildirIds: string[] = [],
  valkostir: SlembiValkostir = {}
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
  let hopA1 = adrir.slice(0, Math.min(MEGINRULLA_FJOLDI, adrir.length));
  const eftir1 = adrir.slice(hopA1.length);
  let hopB1 = eftir1.slice(0, Math.min(aukaThorf, eftir1.length));
  let idle1 = eftir1.slice(hopB1.length);

  const forbodnirSchengen = new Set(valkostir.forbodnirSchengenFyrriHelmingurIds ?? []);
  if (forbodnirSchengen.size > 0) {
    const hopA1Lengd = hopA1.length;
    const lagad = tryggjaSchengenEkkiBannadur(hopB1, [...hopA1, ...idle1], forbodnirSchengen);
    hopB1 = lagad.hopB;
    if (lagad.breytt) {
      hopA1 = lagad.varasjodur.slice(0, hopA1Lengd);
      idle1 = lagad.varasjodur.slice(hopA1Lengd);
    }
  }

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

  const aukastodaRulla1 = aukastodaRulla(hopB1.length, vaktgerd);
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

  const aukastodaRulla2 = aukastodaRulla(hopB2.length, vaktgerd);
  hopB2.forEach((s, i) => {
    skipulag[s.id] = [...(skipulag[s.id] ?? []), ...aukastodaRulla2[i]];
  });

  idle2.forEach((s) => {
    skipulag[s.id] = [...(skipulag[s.id] ?? []), ...Array(HELMINGUR).fill("")];
  });

  return skipulag;
}

/**
 * Skilar deildu skipulagi (slembiraðað/ljósmyndað plan) aðeins ef það á við
 * NÚVERANDI mannskap – þ.e. allir lyklar þess eru id úr núverandi VAKT. Þegar
 * starfsmannalistinn breytist situr gamalt, deilt skipulag eftir í
 * sameiginlega ástandinu og vísar í id sem eru ekki lengur til (eða á fólk af
 * annarri vakt). Þar sem sum id endurnýtast (t.d. "hilmir") myndi það
 * yfirskrifa rétta planið hjá þeim með gömlum, ótengdum póstum – svo við
 * hunsum plan sem inniheldur EINHVERN ókunnan lykil. Nýtt plan (líka fyrir
 * fækkaðan mannskap) inniheldur aðeins gild id og gildir áfram.
 */
export function giltDeiltSkipulag(skipulag: Skipulag | null): Skipulag | null {
  if (!skipulag) return null;
  const giltIds = new Set(VAKT.starfsfolk.map((s) => s.id));
  const allirGildir = Object.keys(skipulag).every((id) => giltIds.has(id));
  return allirGildir ? skipulag : null;
}

/** Skilar starfsfólkslista með pósta yfirskrifaða úr `skipulag` (ef til). */
export function virkStarfsfolk(starfsfolk: Starfsmadur[], skipulag: Skipulag | null): Starfsmadur[] {
  if (!skipulag) return starfsfolk;
  return starfsfolk.map((s) =>
    skipulag[s.id] ? { ...s, postar: skipulag[s.id] } : s
  );
}
