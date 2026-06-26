import { NextRequest, NextResponse } from "next/server";
import {
  backendConfigured,
  ensureToday,
  getVersion,
  readAll,
  applyOps,
} from "@/lib/backend";
import { SharedKey, StateOp } from "@/lib/sharedState";
import { gildurToki } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function idag(): string {
  return new Date().toISOString().slice(0, 10);
}

// "meta" er bókhald sem EINGÖNGU ensureToday (þjónninn) má skrifa í – ekki
// hluti af því sem vafrinn sendir, svo hann er vísvitandi undanskilinn hér.
const LEYFDIR_LYKLAR = new Set<SharedKey>([
  "dma",
  "sudur",
  "threp",
  "verkefniStada",
  "ytriAdilar",
  "fylgdir",
  "vaktir",
  "skipulag",
  "settings",
]);

const HAMARK_GILDI_BYTES = 200_000; // ~200KB á hverja aðgerð – nóg fyrir þetta gagnamagn

function hefurGildanAdgang(req: NextRequest): boolean {
  return gildurToki(req.headers.get("X-Eftirlit-Token"));
}

// GET: skilar öllu sameiginlegu ástandi. Tækin senda ?v=<útgáfa>; ef ekkert
// hefur breyst (KV) skilum við aðeins { unchanged: true } svo sækingin sé ódýr.
// Ef bakgrunnur er ekki uppsettur → { configured: false } og vafrinn fer í
// staðbundinn ham.
export async function GET(req: NextRequest) {
  if (!backendConfigured()) {
    return NextResponse.json({ configured: false });
  }
  if (!hefurGildanAdgang(req)) {
    return NextResponse.json({ ok: false, villa: "óheimilt" }, { status: 401 });
  }

  const today = idag();
  try {
    await ensureToday(today);

    const version = await getVersion();
    const beidnaUtgafa = req.nextUrl.searchParams.get("v");
    if (version !== null && beidnaUtgafa !== null && Number(beidnaUtgafa) === version) {
      return NextResponse.json({ configured: true, unchanged: true, version });
    }

    const state = await readAll(today);
    return NextResponse.json({ configured: true, state, version });
  } catch (e) {
    const villa = e instanceof Error ? e.message : "óþekkt villa";
    return NextResponse.json({ configured: true, ok: false, villa }, { status: 500 });
  }
}

// POST: tekur við lista af aðgerðum (merge/set), skrifar gegnum þjóninn og
// skilar nýju útgáfunúmeri svo skrifandi tækið sæki ekki sína eigin breytingu.
export async function POST(req: NextRequest) {
  if (!backendConfigured()) {
    return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  }
  if (!hefurGildanAdgang(req)) {
    return NextResponse.json({ ok: false, villa: "óheimilt" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { ops?: StateOp[] } | null;
  const ops = body?.ops;
  if (!Array.isArray(ops) || ops.length === 0) {
    return NextResponse.json({ ok: false, villa: "engar aðgerðir" }, { status: 400 });
  }

  for (const op of ops) {
    if (!op || !LEYFDIR_LYKLAR.has(op.key as SharedKey) || (op.op !== "merge" && op.op !== "set")) {
      return NextResponse.json({ ok: false, villa: `ógild aðgerð: ${op?.key}` }, { status: 400 });
    }
    if (op.op === "merge" && (typeof op.value !== "object" || op.value === null || Array.isArray(op.value))) {
      return NextResponse.json({ ok: false, villa: `merge krefst hlut: ${op.key}` }, { status: 400 });
    }
    let stærð = 0;
    try {
      stærð = JSON.stringify(op.value).length;
    } catch {
      return NextResponse.json({ ok: false, villa: `ekki JSON-vænt gildi: ${op.key}` }, { status: 400 });
    }
    if (stærð > HAMARK_GILDI_BYTES) {
      return NextResponse.json({ ok: false, villa: `gildi of stórt: ${op.key}` }, { status: 413 });
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
