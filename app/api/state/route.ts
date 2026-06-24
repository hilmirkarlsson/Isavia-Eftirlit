import { NextRequest, NextResponse } from "next/server";
import {
  backendConfigured,
  ensureToday,
  getVersion,
  readAll,
  applyOps,
} from "@/lib/backend";
import { SHARED_KEYS, StateOp } from "@/lib/sharedState";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function idag(): string {
  return new Date().toISOString().slice(0, 10);
}

const LEYFDIR_LYKLAR = new Set<string>(SHARED_KEYS);

// GET: skilar öllu sameiginlegu ástandi. Tækin senda ?v=<útgáfa>; ef ekkert
// hefur breyst (KV) skilum við aðeins { unchanged: true } svo sækingin sé ódýr.
// Ef bakgrunnur er ekki uppsettur → { configured: false } og vafrinn fer í
// staðbundinn ham.
export async function GET(req: NextRequest) {
  if (!backendConfigured()) {
    // Tímabundin villuleit (?debug=1): birtir EINGÖNGU hvort breytur séu til
    // staðar (true/false), aldrei gildi þeirra. Hjálpar að greina hvers
    // vegna bakgrunnur greinist ekki án þess að leka neinum lyklum.
    if (req.nextUrl.searchParams.get("debug") === "1") {
      return NextResponse.json({
        configured: false,
        debug: {
          KV_REST_API_URL: Boolean(process.env.KV_REST_API_URL),
          KV_REST_API_TOKEN: Boolean(process.env.KV_REST_API_TOKEN),
          UPSTASH_REDIS_REST_URL: Boolean(process.env.UPSTASH_REDIS_REST_URL),
          UPSTASH_REDIS_REST_TOKEN: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
          NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
          SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          VERCEL_ENV: process.env.VERCEL_ENV ?? null,
        },
      });
    }
    return NextResponse.json({ configured: false });
  }

  const today = idag();
  await ensureToday(today);

  const version = await getVersion();
  const beidnaUtgafa = req.nextUrl.searchParams.get("v");
  if (version !== null && beidnaUtgafa !== null && Number(beidnaUtgafa) === version) {
    return NextResponse.json({ configured: true, unchanged: true, version });
  }

  const state = await readAll(today);
  return NextResponse.json({ configured: true, state, version });
}

// POST: tekur við lista af aðgerðum (merge/set), skrifar gegnum þjóninn og
// skilar nýju útgáfunúmeri svo skrifandi tækið sæki ekki sína eigin breytingu.
export async function POST(req: NextRequest) {
  if (!backendConfigured()) {
    return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as { ops?: StateOp[] } | null;
  const ops = body?.ops;
  if (!Array.isArray(ops) || ops.length === 0) {
    return NextResponse.json({ ok: false, villa: "engar aðgerðir" }, { status: 400 });
  }

  for (const op of ops) {
    if (!op || !LEYFDIR_LYKLAR.has(op.key) || (op.op !== "merge" && op.op !== "set")) {
      return NextResponse.json({ ok: false, villa: `ógild aðgerð: ${op?.key}` }, { status: 400 });
    }
  }

  try {
    await applyOps(ops);
  } catch (e) {
    const villa = e instanceof Error ? e.message : "óþekkt villa";
    return NextResponse.json({ ok: false, villa }, { status: 500 });
  }

  const version = await getVersion();
  return NextResponse.json({ ok: true, version });
}
