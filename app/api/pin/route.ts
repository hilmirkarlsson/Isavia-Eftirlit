import { NextRequest, NextResponse } from "next/server";
import { gildurPin, reiknaToki } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Athugar PIN-númer (tímaóháður samanburður, sjá lib/auth.ts) – PIN-ið sjálft
// er aldrei sent til vafrans. Við réttan PIN fær tækið auðkenningartóka sem
// það notar til að fá aðgang að /api/state og /api/skipulag-mynd (sjá
// lib/clientAuth.ts) – annars væru þær leiðir opnar öllum sem finna slóðina.

/** Er PIN-vörn virk yfirhöfuð? Alltaf virk – sjálfgefið PIN er notað ef vant. */
export async function GET() {
  return NextResponse.json({ krafist: true });
}

export async function POST(req: NextRequest) {
  const { pin } = (await req.json().catch(() => ({}))) as { pin?: unknown };
  if (!gildurPin(pin)) return NextResponse.json({ ok: false });
  return NextResponse.json({ ok: true, token: reiknaToki() });
}
