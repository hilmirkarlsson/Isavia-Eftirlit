import { NextRequest, NextResponse } from "next/server";
import { VAKT, TIMAR, TIMAR_NOTT, Postur } from "@/lib/data/starfsfolk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Les mynd af vaktaplani (t.d. mynd tekin af pappírsplani eða skjáskot) og
// breytir í Skipulag-hlut með Claude vision API. Bráðabirgðalausn þangað til
// allir eru farnir að nota slembiraðaða planagerðina í forritinu.

const LEYFDIR_POSTAR: Postur[] = [
  "Norður",
  "DMA CCTV",
  "Flughlað",
  "Afleysing",
  "Landside",
  "CCTV",
  "DMA",
  "Verkefni",
  "Schengen",
  "Frí",
  "",
];

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { villa: "ANTHROPIC_API_KEY er ekki stillt á þjóninum." },
      { status: 500 }
    );
  }

  const form = await req.formData().catch(() => null);
  const skra = form?.get("mynd");
  if (!skra || !(skra instanceof Blob)) {
    return NextResponse.json({ villa: "Engin mynd fannst í beiðni." }, { status: 400 });
  }

  const bytes = Buffer.from(await skra.arrayBuffer());
  const base64 = bytes.toString("base64");
  const mediaType = skra.type || "image/jpeg";

  // Dag- eða næturplan: ræður hvaða tímarammar eru notaðir í leiðbeiningunum.
  const vaktgerd = form?.get("vaktgerd") === "nott" ? "nott" : "dagur";
  const timar = vaktgerd === "nott" ? TIMAR_NOTT : TIMAR;

  const starfsmenn = VAKT.starfsfolk.filter((s) => !s.utkall);
  const nafnalisti = starfsmenn.map((s) => `${s.id} = "${s.nafn}"`).join(", ");

  const prompt = `Þetta er mynd af vaktaplani fyrir eftirlitsdeild Keflavíkurflugvallar. \
Tímarammar planins, í réttri röð, eru: ${timar.join(", ")} (12 tímarammar). \
Starfsmenn og þeirra id: ${nafnalisti}. \
Leyfilegir póstar (notaðu nákvæmlega þessa stafstrengi): ${LEYFDIR_POSTAR.map((p) => `"${p}"`).join(", ")}. \
Lestu myndina og skilaðu HREINU JSON-i (engin skýring, engin markdown-girðing) sem er hlutur (object) \
þar sem hver lykill er starfsmanns-id úr listanum og gildið er fylki (array) af nákvæmlega 12 póstum, \
í sömu röð og tímarammarnir, fyrir þann starfsmann. Notaðu "" fyrir tóman/óljósan reit. \
Ef starfsmaður sést ekki á myndinni, skildu hann eftir úr JSON-inu.`;

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!claudeRes.ok) {
    return NextResponse.json(
      { villa: `Villa frá AI-þjónustu (${claudeRes.status})` },
      { status: 502 }
    );
  }

  const data = await claudeRes.json();
  const texti: string = data?.content?.[0]?.text ?? "";

  let hlutur: unknown;
  try {
    const hreinsad = texti.trim().replace(/^```(json)?/i, "").replace(/```$/, "");
    hlutur = JSON.parse(hreinsad);
  } catch {
    return NextResponse.json({ villa: "Gat ekki lesið svar AI sem JSON." }, { status: 502 });
  }

  if (typeof hlutur !== "object" || hlutur === null) {
    return NextResponse.json({ villa: "Óvænt svarform frá AI." }, { status: 502 });
  }

  const leyfdIds = new Set(starfsmenn.map((s) => s.id));
  const leyfdPostarSett = new Set<string>(LEYFDIR_POSTAR);
  const skipulag: Record<string, Postur[]> = {};

  for (const [id, postar] of Object.entries(hlutur as Record<string, unknown>)) {
    if (!leyfdIds.has(id)) continue;
    if (!Array.isArray(postar) || postar.length !== TIMAR.length) continue;
    if (!postar.every((p) => typeof p === "string" && leyfdPostarSett.has(p))) continue;
    skipulag[id] = postar as Postur[];
  }

  if (Object.keys(skipulag).length === 0) {
    return NextResponse.json({ villa: "Engin gild gögn fundust í myndinni." }, { status: 422 });
  }

  return NextResponse.json({ skipulag });
}
