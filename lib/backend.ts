import { Redis } from "@upstash/redis";
import { supabaseAdmin, supabaseConfigured } from "./supabase/server";
import {
  SHARED_KEYS,
  SharedKey,
  StateOp,
  SharedState,
  setjaSamanShared,
} from "./sharedState";

// ---------------------------------------------------------------------------
// Bakgrunnur fyrir sameiginlegt vaktaástand. Styður TVENNT og velur sjálfkrafa:
//
//   1. Vercel KV (Upstash Redis)  – ef KV/Upstash umhverfisbreytur eru til.
//      Samstilling gerist með reglulegri sækingu (polling) frá tækjunum.
//   2. Supabase (Postgres)        – ef Supabase breytur eru til. Gefur líka
//      rauntíma-push (sjá lib/supabase/browser.ts).
//
// Ef hvorugt er uppsett skilar `backendConfigured()` false og forritið keyrir
// í staðbundnum ham (localStorage). Supabase er tekið fram yfir KV ef BÆÐI er
// uppsett (þá fæst rauntími sjálfkrafa).
// ---------------------------------------------------------------------------

const KV_PREFIX = "eftirlit:";
const VERSION_KEY = "eftirlit:version";

// Vercel KV setur KV_REST_API_*; Upstash-samþætting setur UPSTASH_REDIS_REST_*.
// Styðjum bæði heitin.
const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const kvConfigured = Boolean(kvUrl && kvToken);

let kvClient: Redis | null = null;
function kv(): Redis | null {
  if (!kvUrl || !kvToken) return null;
  if (!kvClient) kvClient = new Redis({ url: kvUrl, token: kvToken });
  return kvClient;
}

export type BackendType = "supabase" | "kv" | null;

export function backendType(): BackendType {
  if (supabaseConfigured) return "supabase";
  if (kvConfigured) return "kv";
  return null;
}

export function backendConfigured(): boolean {
  return backendType() !== null;
}

const DAGLEG_SVID: SharedKey[] = ["threp", "verkefniStada", "ytriAdilar"];

/** Núllstillir dagleg gögn ef dagsetning hefur breyst (báðir bakgrunnar). */
export async function ensureToday(today: string): Promise<void> {
  const t = backendType();
  if (t === "supabase") {
    const sb = supabaseAdmin();
    if (sb) await sb.rpc("ensure_today", { p_today: today });
    return;
  }
  if (t === "kv") {
    const r = kv();
    if (!r) return;
    const meta = (await r.get<{ dagur?: string }>(KV_PREFIX + "meta")) ?? {};
    if (meta.dagur !== today) {
      for (const k of DAGLEG_SVID) await r.set(KV_PREFIX + k, {});
      await r.set(KV_PREFIX + "meta", { ...meta, dagur: today });
      await r.incr(VERSION_KEY);
    }
  }
}

/** Útgáfunúmer (KV) – hækkar við hverja skrift svo tæki sjái að eitthvað
 *  breyttist án þess að sækja allt. Supabase skilar null (rauntími sér um push). */
export async function getVersion(): Promise<number | null> {
  if (backendType() !== "kv") return null;
  const r = kv();
  if (!r) return null;
  return (await r.get<number>(VERSION_KEY)) ?? 0;
}

/** Les allt sameiginlegt ástand og setur saman í SharedState. */
export async function readAll(today: string): Promise<SharedState> {
  const t = backendType();
  if (t === "supabase") {
    const sb = supabaseAdmin();
    if (!sb) return setjaSamanShared({}, today);
    const { data } = await sb.from("shared_state").select("key, value");
    const radir: Record<string, unknown> = {};
    for (const row of data ?? []) radir[row.key as string] = row.value;
    return setjaSamanShared(radir, today);
  }
  if (t === "kv") {
    const r = kv();
    if (!r) return setjaSamanShared({}, today);
    const keys = [...SHARED_KEYS];
    const values = await r.mget<unknown[]>(...keys.map((k) => KV_PREFIX + k));
    const radir: Record<string, unknown> = {};
    keys.forEach((k, i) => {
      if (values[i] != null) radir[k] = values[i];
    });
    return setjaSamanShared(radir, today);
  }
  return setjaSamanShared({}, today);
}

// ---------------------------------------------------------------------------
// Áskriftir fyrir ýtitilkynningar (push). Geymdar á þjóninum EINGÖNGU – aldrei
// sendar í SharedState til tækjanna. Notar sama bakgrunn (KV eða Supabase) en
// undir lykli sem er ekki hluti af SHARED_KEYS, svo readAll/sækingin hunsar hann.
// ---------------------------------------------------------------------------

export type PushAskrift = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  notandi: string | null; // hvaða starfsmaður er skráður á þessu tæki
};

const PUSH_KEY = "pushSubs";

export async function lesaPushAskriftir(): Promise<PushAskrift[]> {
  const t = backendType();
  if (t === "supabase") {
    const sb = supabaseAdmin();
    if (!sb) return [];
    const { data } = await sb.from("shared_state").select("value").eq("key", PUSH_KEY).maybeSingle();
    const v = (data?.value ?? []) as PushAskrift[];
    return Array.isArray(v) ? v : [];
  }
  if (t === "kv") {
    const r = kv();
    if (!r) return [];
    return (await r.get<PushAskrift[]>(KV_PREFIX + PUSH_KEY)) ?? [];
  }
  return [];
}

export async function skrifaPushAskriftir(askriftir: PushAskrift[]): Promise<void> {
  const t = backendType();
  if (t === "supabase") {
    const sb = supabaseAdmin();
    if (sb) await sb.rpc("set_state", { p_key: PUSH_KEY, p_value: askriftir });
    return;
  }
  if (t === "kv") {
    const r = kv();
    if (r) await r.set(KV_PREFIX + PUSH_KEY, askriftir);
  }
}

/** Beitir lista af skrif-aðgerðum (merge/set) atómískt eftir bakgrunni. */
export async function applyOps(ops: StateOp[]): Promise<void> {
  const t = backendType();
  if (t === "supabase") {
    const sb = supabaseAdmin();
    if (!sb) return;
    for (const op of ops) {
      if (op.op === "merge") {
        await sb.rpc("merge_state", { p_key: op.key, p_patch: op.value });
      } else {
        await sb.rpc("set_state", { p_key: op.key, p_value: op.value });
      }
    }
    return;
  }
  if (t === "kv") {
    const r = kv();
    if (!r) return;
    for (const op of ops) {
      const k = KV_PREFIX + op.key;
      if (op.op === "merge") {
        const cur = ((await r.get<Record<string, unknown>>(k)) ?? {}) as Record<string, unknown>;
        await r.set(k, { ...cur, ...op.value });
      } else {
        await r.set(k, op.value);
      }
    }
    await r.incr(VERSION_KEY);
  }
}
