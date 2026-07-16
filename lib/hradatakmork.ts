import { Redis } from "@upstash/redis";
import { supabaseAdmin } from "./supabase/server";

// Hraðatakmörkun (rate limiting) fyrir lykilorðsinnslátt. Hún ver bæði gegn
// giskun og gegn því að læsa kynninguna í óþægilegt ástand með mörgum röngum
// tilraunum í röð.
//
// Teljarinn VERÐUR að lifa utan keyrslunnar: á Vercel getur hver beiðni lent
// á nýrri lambda-instansu, svo teljari í minni safnast aldrei upp (sannreynt
// gegn live-uppfærslunni 2026-07-03 – 6 hraðar tilraunir, engin 429).
// Forgangsröð geymslu:
//   1. Upstash/KV (sömu breytur og lib/backend.ts) – atómískt INCR+EXPIRE.
//   2. Supabase shared_state – sami "þjónslyklar utan SHARED_KEYS" siður og
//      pushSubs; les-breyta-skrifa er örlítið kappaksturs-viðkvæmt undir
//      samtímakalli en telur rétt fyrir raðbundnar ágiskanir, sem er
//      árásarmynstrið sem skiptir máli.
//   3. Minni – aðeins síðasta hálmstrá (staðbundin keyrsla, next dev).

const GLUGGI_SEK = 60;
const HAMARK_TILRAUNA = 5;
const LYKILL_FORSKEYTI = "eftirlit:password-tilraunir:";

const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let kvClient: Redis | null = null;
function kv(): Redis | null {
  if (!kvUrl || !kvToken) return null;
  if (!kvClient) kvClient = new Redis({ url: kvUrl, token: kvToken });
  return kvClient;
}

// Fallback í minni þegar hvorki KV né Supabase er uppsett.
const iMinni = new Map<string, { fjoldi: number; rennurUt: number }>();

export type TilraunSvar = { leyft: boolean; bidSek: number };

type Teljari = { fjoldi: number; rennurUt: number };

const SUPABASE_LYKILL = "passwordTilraunir"; // utan SHARED_KEYS – readAll hunsar hann

/** Uppfærir teljara fyrir auðkenni innan fasts glugga og skilar nýju gildi. */
function naestiTeljari(f: Teljari | undefined, nu: number): Teljari {
  if (!f || f.rennurUt < nu) return { fjoldi: 1, rennurUt: nu + GLUGGI_SEK * 1000 };
  return { fjoldi: f.fjoldi + 1, rennurUt: f.rennurUt };
}

function svara(f: Teljari, nu: number): TilraunSvar {
  if (f.fjoldi > HAMARK_TILRAUNA) {
    return { leyft: false, bidSek: Math.max(Math.ceil((f.rennurUt - nu) / 1000), 1) };
  }
  return { leyft: true, bidSek: 0 };
}

async function medSupabase(audkenni: string, nu: number): Promise<TilraunSvar | null> {
  const sb = supabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb
    .from("shared_state")
    .select("value")
    .eq("key", SUPABASE_LYKILL)
    .maybeSingle();
  if (error) throw new Error(`passwordTilraunir lesa: ${error.message}`);

  const allt = (data?.value ?? {}) as Record<string, Teljari>;
  const f = naestiTeljari(allt[audkenni], nu);

  // Skrifum allan hlutinn til baka og grisju útrunna teljara í leiðinni,
  // svo lykillinn safni ekki gömlum IP-tölum endalaust.
  const hreinsad: Record<string, Teljari> = { [audkenni]: f };
  for (const [k, v] of Object.entries(allt)) {
    if (k !== audkenni && v && v.rennurUt >= nu) hreinsad[k] = v;
  }
  const { error: skrifVilla } = await sb.rpc("set_state", {
    p_key: SUPABASE_LYKILL,
    p_value: hreinsad,
  });
  if (skrifVilla) throw new Error(`passwordTilraunir skrifa: ${skrifVilla.message}`);

  return svara(f, nu);
}

/** Skráir eina lykilorðstilraun frá gefnu auðkenni (t.d. IP-tölu) og svarar hvort
 *  hún sé innan marka. Föst gluggaaðferð: 5 tilraunir á hverjum 60 sek.
 *  Bili geymslan er svarið "leyft" – lykilorðssamanburðurinn sjálfur ver hliðið,
 *  betra að tefja ekki starfsfólk þegar bakgrunnurinn hikstar. */
export async function lykilordsTilraunLeyfd(audkenni: string): Promise<TilraunSvar> {
  const nu = Date.now();
  try {
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

    const svarSb = await medSupabase(audkenni, nu);
    if (svarSb) return svarSb;
  } catch {
    return { leyft: true, bidSek: 0 };
  }

  const f = naestiTeljari(iMinni.get(audkenni), nu);
  iMinni.set(audkenni, f);
  return svara(f, nu);
}
