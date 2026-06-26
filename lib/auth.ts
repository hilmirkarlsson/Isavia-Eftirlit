import crypto from "crypto";

// Sameiginlegt auðkenningarlag fyrir API-leiðir. Byggir á sama PIN og
// PinGate notar (svo enginn ný innskráning er nauðsynleg) en bætir við
// tóka-kerfi svo /api/state og /api/skipulag-mynd séu ekki galopnar.
//
// Tæki sem hefur slegið inn réttan PIN fær tóka (afleiddan af PIN-inu með
// HMAC) sem það sendir í haus á eftirfarandi beiðnum. Þjónninn sannreynir
// tókann gegn sama PIN-i – tímaóháð (timing-safe) svo lengdar/staf-mismunur
// leki ekki í gegnum svartíma.

const SJALFGEFID_PIN = "6030";

/** PIN-ið sem er í gildi núna (úr umhverfisbreytu, annars sjálfgefið). */
function virktPin(): string {
  return process.env.EFTIRLIT_PIN || SJALFGEFID_PIN;
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

/** Er innslegið PIN rétt? */
export function gildurPin(pin: unknown): boolean {
  if (typeof pin !== "string" || pin.length === 0) return false;
  return jafngildir(pin, virktPin());
}

/** Tóki afleiddur af núgildandi PIN-i – gefinn til tækis sem hefur þegar
 *  slegið inn réttan PIN, og notaður til að sannreyna API-beiðnir án þess
 *  að senda PIN-ið sjálft í hverri beiðni. */
export function reiknaToki(): string {
  return crypto.createHmac("sha256", virktPin()).update("eftirlit-kef-adgangur").digest("hex");
}

/** Er tóki úr beiðni (haus) gildur? */
export function gildurToki(token: unknown): boolean {
  if (typeof token !== "string" || token.length === 0) return false;
  return jafngildir(token, reiknaToki());
}
