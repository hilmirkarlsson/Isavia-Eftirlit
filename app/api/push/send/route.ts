import { NextRequest, NextResponse } from "next/server";
import { sendaPush } from "@/lib/push";
import { gildurToki } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST: sendir ýtitilkynningu. Kallað innan úr forritinu (t.d. þegar fylgd er
// merkt Lokið). `fyrir` er valkvæður listi af starfsmanna-id – ef tómur fara
// skilaboðin á alla áskrifendur. Krefst tóka – annars gæti hver sem er sent
// falskar tilkynningar á allt starfsfólk (sjá lib/auth.ts).
export async function POST(req: NextRequest) {
  if (!gildurToki(req.headers.get("X-Eftirlit-Token"))) {
    return NextResponse.json({ ok: false, villa: "óheimilt" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    titill?: string;
    texti?: string;
    slod?: string;
    fyrir?: string[];
  } | null;

  if (!body?.titill || !body?.texti) {
    return NextResponse.json({ ok: false, villa: "vantar titil/texta" }, { status: 400 });
  }

  try {
    await sendaPush({ titill: body.titill, texti: body.texti, slod: body.slod }, body.fyrir);
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
