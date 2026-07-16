import crypto from "crypto";

// Sameiginlegt auðkenningarlag fyrir API-leiðir. Byggir á sama lykilorði og
// PasswordGate notar (svo engin ný innskráning er nauðsynleg) en bætir við
// tóka-kerfi svo /api/state og /api/skipulag-mynd séu ekki galopnar.
//
// Tæki sem hefur slegið inn rétt lykilorð fær tóka (afleiddan af lykilorðinu með
// HMAC) sem það sendir í haus á eftirfarandi beiðnum. Þjónninn sannreynir
// tókann gegn sama leyndarmáli – tímaóháð (timing-safe) svo lengdar/staf-mismunur
// leki ekki í gegnum svartíma.

/** Lykilorðið sem er í gildi núna – EINGÖNGU úr umhverfisbreytu. Ekkert
 *  sjálfgefið gildi: lykilorð í kóða væri opinbert (repo-ið er sýnilegt) og þar
 *  sem tókinn er afleiddur af lykilorðinu myndi þekkt gildi opna bæði hliðið
 *  OG allar vernduðu API-leiðirnar. Ósett = allt lokað (fail closed).
 *
 *  EFTIRLIT_PIN er tímabundið fallback fyrir örugga útgáfu á lifandi kerfi:
 *  setja á EFTIRLIT_PASSWORD í Vercel og fjarlægja gamla PIN-breytu eftir prófun. */
function virktLeyndarmal(): string | null {
  return process.env.EFTIRLIT_PASSWORD || process.env.EFTIRLIT_PIN || null;
}

/** Er lykilorð yfirhöfuð stillt á þjóninum? Ósett = enginn kemst inn. */
export function lykilordStillt(): boolean {
  return virktLeyndarmal() !== null;
}

/** Tímaóháður (timing-safe) strengjasamanburður. */
export function jafngildir(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    // Berum saman við sjálft sig svo heildartími leki ekki lengdarmuninn.
    crypto.timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

/** Er innslegið lykilorð rétt? Ef ekkert lykilorð er stillt er svarið alltaf nei. */
export function giltLykilord(password: unknown): boolean {
  const vaent = virktLeyndarmal();
  if (!vaent) return false;
  if (typeof password !== "string" || password.length === 0) return false;
  return jafngildir(password, vaent);
}

/** Tóki afleiddur af núgildandi lykilorði – gefinn til tækis sem hefur þegar
 *  slegið það rétt inn, og notaður til að sannreyna API-beiðnir án þess
 *  að senda lykilorðið sjálft í hverri beiðni. Null ef ekkert lykilorð er stillt. */
export function reiknaToki(): string | null {
  const leyndarmal = virktLeyndarmal();
  if (!leyndarmal) return null;
  return crypto.createHmac("sha256", leyndarmal).update("eftirlit-kef-adgangur").digest("hex");
}

/** Er tóki úr beiðni (haus) gildur? Ef ekkert lykilorð er stillt: alltaf nei. */
export function gildurToki(token: unknown): boolean {
  if (typeof token !== "string" || token.length === 0) return false;
  const vaentur = reiknaToki();
  if (!vaentur) return false;
  return jafngildir(token, vaentur);
}
