import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Athugar PIN-númer gegn umhverfisbreytu (EFTIRLIT_PIN) – PIN-ið sjálft er
// aldrei sent til vafrans, eingöngu true/false svar. Ef breytan er ekki sett
// er aðgangur opinn (engin PIN-vörn virk).

/** Er PIN-vörn virk yfirhöfuð (er EFTIRLIT_PIN stillt á þjóninum)? */
export async function GET() {
  return NextResponse.json({ krafist: !!process.env.EFTIRLIT_PIN });
}

export async function POST(req: NextRequest) {
  const vaentPin = process.env.EFTIRLIT_PIN;
  if (!vaentPin) return NextResponse.json({ ok: true });

  const { pin } = (await req.json().catch(() => ({}))) as { pin?: string };
  return NextResponse.json({ ok: pin === vaentPin });
}
