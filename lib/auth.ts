import crypto from "crypto";

// Sameiginlegt auðkenningarlag fyrir API-leiðir. Byggir á sama PIN og
// PinGate notar (svo enginn ný innskráning er nauðsynleg) en bætir við
// tóka-kerfi svo /api/state og /api/skipulag-mynd séu ekki galopnar.
//
// Tæki sem hefur slegið inn réttan PIN fær tóka (afleiddan af PIN-inu með
// HMAC) sem það sendir í haus á eftirfarandi beiðnum. Þjónninn sannreynir
// tókann gegn sama PIN-i – tímaóháð (timing-safe) svo lengdar/staf-mismunur
// leki ekki í gegnum svartíma.

/** PIN-ið sem er í gildi núna – EINGÖNGU úr umhverfisbreytu. Ekkert
 *  sjálfgefið gildi: PIN í kóða væri opinbert (repo-ið er sýnilegt) og þar
 *  sem tókinn er afleiddur af PIN-inu myndi þekkt sjálfgefið PIN opna bæði
 *  hliðið OG allar vernduðu API-leiðirnar. Ósett = allt lokað (fail closed). */
function virktPin(): string | null {
  return process.env.EFTIRLIT_PIN || null;
}

/** Er PIN yfirhöfuð stillt á þjóninum? Ósett = enginn kemst inn. */
export function pinStilltur(): boolean {
  return virktPin() !== null;
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

/** Er innslegið PIN rétt? Ef ekkert PIN er stillt er svarið alltaf nei. */
export function gildurPin(pin: unknown): boolean {
  const vaentPin = virktPin();
  if (!vaentPin) return false;
  if (typeof pin !== "string" || pin.length === 0) return false;
  return jafngildir(pin, vaentPin);
}

/** Tóki afleiddur af núgildandi PIN-i – gefinn til tækis sem hefur þegar
 *  slegið inn réttan PIN, og notaður til að sannreyna API-beiðnir án þess
 *  að senda PIN-ið sjálft í hverri beiðni. Null ef ekkert PIN er stillt. */
export function reiknaToki(): string | null {
  const pin = virktPin();
  if (!pin) return null;
  return crypto.createHmac("sha256", pin).update("eftirlit-kef-adgangur").digest("hex");
}

/** Er tóki úr beiðni (haus) gildur? Ef ekkert PIN er stillt: alltaf nei. */
export function gildurToki(token: unknown): boolean {
  if (typeof token !== "string" || token.length === 0) return false;
  const vaentur = reiknaToki();
  if (!vaentur) return false;
  return jafngildir(token, vaentur);
}
