// Stæði á Eiríkshlaði – fjarstæði (engin brú), aðgreind frá DMA stæðum
// (101–123) og hliðsstæðum (A/C/D). Staðan er ekki vistuð handvirkt eins
// og DMA, heldur reiknuð beint úr FIDS: er flug skráð á stæðinu núna?
import { Flug, flugTs } from "../fids";

export const EIRIKSHLAD_STAEDI: string[] = [
  "7", "8", "9", "10", "11", "12", "14",
  "40", "42", "44",
  "46L", "46R",
  "55", "57", "59", "61", "63",
  "70", "70L", "71", "72", "72L", "72R", "73", "74", "75", "75L", "75R", "76",
  "77R", "78", "79", "79R", "80L", "80R", "81L", "81R",
];

/** Hversu langt frá núinu (ms) flug telst vera "á stæðinu núna". */
const STAEDI_GLUGGI_MS = 3 * 60 * 60_000;

/** Flug (ef eitthvert) sem er á stæðinu núna, samkvæmt FIDS. */
export function flugAStaedi(staedi: string, flug: Flug[], nuMs = Date.now()): Flug | undefined {
  return flug.find(
    (f) => f.staedi === staedi && Math.abs(flugTs(f, nuMs) - nuMs) <= STAEDI_GLUGGI_MS
  );
}
