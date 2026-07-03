import { Redis } from "@upstash/redis";

// Hraðatakmörkun (rate limiting) fyrir PIN-innslátt. 4 stafa PIN hefur aðeins
// 10.000 möguleika – án takmarkana mætti giska á það allt á nokkrum sekúndum.
//
// Notar sömu Upstash/KV umhverfisbreytur og lib/backend.ts ef þær eru til
// (teljari lifir þá milli serverless-keyrslna). Annars fallið aftur á teljara
// í minni – hann er per-instance á Vercel og því ekki vatnsheldur, en hægir
// samt verulega á vélrænum ágiskunum. Athugasemd hér frekar en falskt öryggi.

const GLUGGI_SEK = 60;
const HAMARK_TILRAUNA = 5;
const LYKILL_FORSKEYTI = "eftirlit:pin-tilraunir:";

const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let kvClient: Redis | null = null;
function kv(): Redis | null {
  if (!kvUrl || !kvToken) return null;
  if (!kvClient) kvClient = new Redis({ url: kvUrl, token: kvToken });
  return kvClient;
}

// Fallback í minni þegar KV er ekki uppsett.
const iMinni = new Map<string, { fjoldi: number; rennurUt: number }>();

export type TilraunSvar = { leyft: boolean; bidSek: number };

/** Skráir eina PIN-tilraun frá gefnu auðkenni (t.d. IP-tölu) og svarar hvort
 *  hún sé innan marka. Föst gluggaaðferð: 5 tilraunir á hverjum 60 sek. */
export async function pinTilraunLeyfd(audkenni: string): Promise<TilraunSvar> {
  const r = kv();
  if (r) {
    const lykill = LYKILL_FORSKEYTI + audkenni;
    const fjoldi = await r.incr(lykill);
    if (fjoldi === 1) await r.expire(lykill, GLUGGI_SEK);
    if (fjoldi > HAMARK_TILRAUNA) {
      const ttl = await r.ttl(lykill);
      return { leyft: false, bidSek: Math.max(ttl, 1) };
    }
    return { leyft: true, bidSek: 0 };
  }

  const nu = Date.now();
  const f = iMinni.get(audkenni);
  if (!f || f.rennurUt < nu) {
    iMinni.set(audkenni, { fjoldi: 1, rennurUt: nu + GLUGGI_SEK * 1000 });
    return { leyft: true, bidSek: 0 };
  }
  f.fjoldi += 1;
  if (f.fjoldi > HAMARK_TILRAUNA) {
    return { leyft: false, bidSek: Math.ceil((f.rennurUt - nu) / 1000) };
  }
  return { leyft: true, bidSek: 0 };
}
