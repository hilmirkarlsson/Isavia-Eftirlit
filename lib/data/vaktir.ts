// Vaktir – yfirlit yfir hvaða starfsfólk er á hverri vakt (E, B, …).
//
// Þetta er sýn fyrir vaktstjóra svo þeir sjái hverjir eru á hverri vakt og
// geti bætt við vöktum og fólki. Geymt í sameiginlegu ástandi (shared state)
// svo það samstillist milli tækja. Núverandi vakt forritsins (starfsfólkið í
// VAKT) er E-vaktin – hún er sjálfgefið sæði ef enginn listi er til.

import { Starfsmadur, TIMAR, VAKT } from "./starfsfolk";

export type VaktMedlimur = {
  id: string;
  nafn: string;
};

export type VaktSkraning = {
  id: string;
  /** Heiti vaktar, t.d. "E", "B". */
  nafn: string;
  medlimir: VaktMedlimur[];
};

/**
 * Allir starfsmenn sem geta skráð sig inn: VAKT.starfsfolk (hardcoded E-vakt)
 * og allir meðlimir í öðrum vöktum (D o.fl.) sem ekki passa við nafn í þeim
 * lista. Þetta gerir fólki á öðrum vöktum kleift að velja nafnið sitt í
 * innskráningu og fá eigin Heim-skjá, ekki bara E-vaktina.
 */
export function allirStarfsmenn(vaktir: VaktSkraning[]): Starfsmadur[] {
  const allir = VAKT.starfsfolk.slice();
  const thekkt = new Set(allir.map((s) => s.nafn.toLowerCase()));
  for (const v of vaktir) {
    for (const m of v.medlimir) {
      const key = m.nafn.toLowerCase();
      if (thekkt.has(key)) continue;
      thekkt.add(key);
      allir.push({ id: m.id, nafn: m.nafn, postar: Array(TIMAR.length).fill("") });
    }
  }
  return allir;
}
