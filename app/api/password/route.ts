import { NextRequest, NextResponse } from "next/server";
import { giltLykilord, lykilordStillt, reiknaToki } from "@/lib/auth";
import { lykilordsTilraunLeyfd } from "@/lib/hradatakmork";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Athugar lykilorð (tímaóháður samanburður, sjá lib/auth.ts) – lykilorðið sjálft
// er aldrei sent til vafrans. Við rétt lykilorð fær tækið auðkenningartóka sem
// það notar til að fá aðgang að /api/state og /api/skipulag-mynd (sjá
// lib/clientAuth.ts) – annars væru þær leiðir opnar öllum sem finna slóðina.
//
// Öryggislag hér:
//  - EFTIRLIT_PASSWORD ósett = allt lokað (ekkert sjálfgefið lykilorð í kóða).
//  - Hraðatakmörkun á IP: röng innsláttarruna má ekki valda kynningaráhættu.

/** Er lykilorðsvörn virk? Alltaf – ósett lykilorð þýðir lokað, ekki opið. */
export async function GET() {
  return NextResponse.json({ krafist: true });
}

/** Fyrsta IP-talan úr X-Forwarded-For (Vercel setur hana áreiðanlega). */
function bidjandiIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  return xff.split(",")[0].trim() || "othekkt";
}

export async function POST(req: NextRequest) {
  const { leyft, bidSek } = await lykilordsTilraunLeyfd(bidjandiIp(req));
  if (!leyft) {
    return NextResponse.json(
      { ok: false, villa: `Of margar tilraunir – reyndu aftur eftir ${bidSek} sek.` },
      { status: 429 }
    );
  }

  if (!lykilordStillt()) {
    return NextResponse.json(
      { ok: false, villa: "EFTIRLIT_PASSWORD er ekki stillt á þjóninum – aðgangur lokaður." },
      { status: 503 }
    );
  }

  const { password } = (await req.json().catch(() => ({}))) as { password?: unknown };
  if (!giltLykilord(password)) return NextResponse.json({ ok: false });

  const token = reiknaToki();
  if (!token) {
    // Ætti ekki að gerast (lykilordStillt var satt hér að ofan) en fail closed.
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true, token });
}
