import { NextRequest, NextResponse } from "next/server";
import { lesaPushAskriftir, skrifaPushAskriftir, PushAskrift } from "@/lib/backend";
import { pushVirkt, pushOpinberLykill } from "@/lib/push";
import { gildurToki } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: skilar hvort push sé uppsett (VAPID-lyklar til) og opinbera lyklinum
// sem vafrinn þarf til að skrá áskrift. Lykillinn er OPINBER (per definition
// VAPID-staðals), engin auðkenning nauðsynleg fyrir GET.
export async function GET() {
  return NextResponse.json({ virkt: pushVirkt(), opinberLykill: pushOpinberLykill() });
}

// POST: skráir (eða uppfærir) push-áskrift fyrir þetta tæki. Krefst tóka svo
// ekki sé hægt að skrá óviðkomandi endapunkta (sjá lib/auth.ts).
export async function POST(req: NextRequest) {
  if (!gildurToki(req.headers.get("X-Eftirlit-Token"))) {
    return NextResponse.json({ ok: false, villa: "óheimilt" }, { status: 401 });
  }
  if (!pushVirkt()) return NextResponse.json({ ok: false, virkt: false }, { status: 503 });

  const body = (await req.json().catch(() => null)) as {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    notandi?: string | null;
  } | null;

  const sub = body?.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ ok: false, villa: "ógild áskrift" }, { status: 400 });
  }

  const ny: PushAskrift = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    notandi: body?.notandi ?? null,
  };

  const allar = await lesaPushAskriftir();
  const an = allar.filter((a) => a.endpoint !== ny.endpoint);
  an.push(ny);
  await skrifaPushAskriftir(an);

  return NextResponse.json({ ok: true });
}

// DELETE: afskráir áskrift (notandi slekkur á tilkynningum).
export async function DELETE(req: NextRequest) {
  if (!gildurToki(req.headers.get("X-Eftirlit-Token"))) {
    return NextResponse.json({ ok: false, villa: "óheimilt" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) return NextResponse.json({ ok: false }, { status: 400 });
  const allar = await lesaPushAskriftir();
  await skrifaPushAskriftir(allar.filter((a) => a.endpoint !== body.endpoint));
  return NextResponse.json({ ok: true });
}
