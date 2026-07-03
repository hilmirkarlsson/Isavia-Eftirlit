import { NextRequest, NextResponse } from "next/server";
import { gildurPin, pinStilltur, reiknaToki } from "@/lib/auth";
import { pinTilraunLeyfd } from "@/lib/hradatakmork";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Athugar PIN-númer (tímaóháður samanburður, sjá lib/auth.ts) – PIN-ið sjálft
// er aldrei sent til vafrans. Við réttan PIN fær tækið auðkenningartóka sem
// það notar til að fá aðgang að /api/state og /api/skipulag-mynd (sjá
// lib/clientAuth.ts) – annars væru þær leiðir opnar öllum sem finna slóðina.
//
// Öryggislag hér:
//  - EFTIRLIT_PIN ósett = allt lokað (ekkert sjálfgefið PIN í kóða).
//  - Hraðatakmörkun á IP: 4 stafa PIN má annars giska á á sekúndum.

/** Er PIN-vörn virk? Alltaf – ósett PIN þýðir lokað, ekki opið. */
export async function GET() {
  return NextResponse.json({ krafist: true });
}

/** Fyrsta IP-talan úr X-Forwarded-For (Vercel setur hana áreiðanlega). */
function bidjandiIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  return xff.split(",")[0].trim() || "othekkt";
}

export async function POST(req: NextRequest) {
  const { leyft, bidSek } = await pinTilraunLeyfd(bidjandiIp(req));
  if (!leyft) {
    return NextResponse.json(
      { ok: false, villa: `Of margar tilraunir – reyndu aftur eftir ${bidSek} sek.` },
      { status: 429 }
    );
  }

  if (!pinStilltur()) {
    return NextResponse.json(
      { ok: false, villa: "EFTIRLIT_PIN er ekki stillt á þjóninum – aðgangur lokaður." },
      { status: 503 }
    );
  }

  const { pin } = (await req.json().catch(() => ({}))) as { pin?: unknown };
  if (!gildurPin(pin)) return NextResponse.json({ ok: false });

  const token = reiknaToki();
  if (!token) {
    // Ætti ekki að gerast (pinStilltur var satt hér að ofan) en fail closed.
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true, token });
}
