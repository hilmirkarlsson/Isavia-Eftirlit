import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Athugar PIN-númer gegn EFTIRLIT_PIN – PIN-ið sjálft er aldrei sent til
// vafrans, eingöngu true/false svar. Sjálfgefið PIN er notað ef
// umhverfisbreytan EFTIRLIT_PIN er ekki stillt á þjóninum.
const SJALFGEFID_PIN = "6030";

/** Er PIN-vörn virk yfirhöfuð? Alltaf virk – sjálfgefið PIN er notað ef vant. */
export async function GET() {
  return NextResponse.json({ krafist: true });
}

export async function POST(req: NextRequest) {
  const vaentPin = process.env.EFTIRLIT_PIN || SJALFGEFID_PIN;

  const { pin } = (await req.json().catch(() => ({}))) as { pin?: string };
  return NextResponse.json({ ok: pin === vaentPin });
}
