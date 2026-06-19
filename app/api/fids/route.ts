import { NextResponse } from "next/server";
import https from "https";
import { Flug, FidsSvar, syniSvar } from "@/lib/fids";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

// Milliþjónn (proxy) fyrir FIDS gögn Keflavíkurflugvallar.
//
// Raunverulega vefþjónustan er:
//   https://fids.kefairport.is/api/flights?dateFrom=...&dateTo=...
// (sama og opinberi FIDS vefurinn notar). Vafrar geta ekki sótt þetta
// beint vegna CORS, þess vegna sækir þjónninn ÖLL flugin innan tímabils
// og skilar þeim áfram. Slóðin er stillanleg með FIDS_URL.
//
// Náist ekki í gögnin (t.d. í lokuðu umhverfi) er skilað sýnigögnum.

const FIDS_BASE = process.env.FIDS_URL || "https://fids.kefairport.is/api/flights";

/** "YYYY-MM-DDTHH:MM:SSZ" */
function isoZ(d: Date): string {
  return d.toISOString().slice(0, 19) + "Z";
}

/** Sækir JSON með Node https (leyfir ófullkomið vottorð eins og opinberi vefurinn). */
function saekjaJson(url: string, timeoutMs = 9000): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        rejectUnauthorized: false,
        headers: {
          Accept: "application/json",
          "User-Agent": "Eftirlit-KEF/1.0 (internal monitoring)",
        },
      },
      (res) => {
        const code = res.statusCode ?? 0;
        if (code < 200 || code >= 300) {
          res.resume();
          reject(new Error(`FIDS svar ${code}`));
          return;
        }
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error("Ógilt JSON frá FIDS"));
          }
        });
      }
    );
    req.setTimeout(timeoutMs, () => req.destroy(new Error("FIDS tímamörk")));
    req.on("error", reject);
  });
}

function reyna<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function timi(v: unknown): string {
  if (!v) return "";
  const s = String(v);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime()) && /\d{4}-\d{2}-\d{2}/.test(s)) {
    return d.toTimeString().slice(0, 5);
  }
  const m = s.match(/(\d{1,2})[:.]?(\d{2})/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  return s;
}

const KEF = "KEF";

function normalisera(raw: any, i: number): Flug {
  const g = (...keys: string[]): any => {
    for (const k of keys) {
      const v = raw?.[k];
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
  };

  const origin_iata = String(g("origin_iata", "originIata", "from_iata") ?? "").toUpperCase();
  const dest_iata = String(g("destination_iata", "destinationIata", "to_iata") ?? "").toUpperCase();

  // Stefna: koma ef KEF er áfangastaður, brottför ef KEF er upphafsstaður.
  let tegund: "arrival" | "departure";
  if (dest_iata === KEF) tegund = "arrival";
  else if (origin_iata === KEF) tegund = "departure";
  else tegund = dest_iata ? "departure" : "arrival";

  const koma = tegund === "arrival";
  const borg = koma
    ? String(g("origin", "origin_name") ?? origin_iata ?? "")
    : String(g("destination", "destination_name") ?? dest_iata ?? "");
  const iata = koma ? origin_iata : dest_iata;

  const prefix = String(g("flight_prefix", "airline", "carrier") ?? "");
  const num = String(g("flight_num", "flight_number", "number") ?? "");
  const flugnumer = `${prefix}${num ? " " + num : ""}`.trim() || String(g("flight_id", "id") ?? "—");

  const schengenRaw = String(g("schengen", "is_schengen", "schengen_status") ?? "").toLowerCase();
  const schengen =
    schengenRaw === "s" || schengenRaw === "true" || schengenRaw === "schengen" || schengenRaw === "1"
      ? ("S" as const)
      : schengenRaw === "n" || schengenRaw === "false" || schengenRaw === "non-schengen" || schengenRaw === "0"
      ? ("N" as const)
      : undefined;

  return {
    id: String(g("flight_id", "id", "uuid") ?? `${tegund}-${i}`),
    tegund,
    flugnumer,
    flugfelag: String(g("airline_name", "airline", "operator") ?? prefix ?? ""),
    borg,
    iata: iata || undefined,
    aaetlad: timi(g("sched_time", "scheduled_time", "scheduled", "std", "sta")),
    raun: reyna(() => timi(g("expected_time", "estimated_time", "actual_time", "atd", "ata")) || undefined, undefined),
    hlid: reyna(() => String(g("gate") ?? "") || undefined, undefined),
    staedi: reyna(() => String(g("stand", "bay") ?? "") || undefined, undefined),
    faeriband: reyna(() => String(g("belt", "carousel") ?? "") || undefined, undefined),
    stada: reyna(() => String(g("status", "remark", "state") ?? "") || undefined, undefined),
    reg: reyna(() => String(g("aircraft_reg", "registration", "reg") ?? "") || undefined, undefined),
    tegundVel: reyna(() => String(g("aircraft_type", "actype", "aircraft") ?? "") || undefined, undefined),
    handling: reyna(() => String(g("handling_agent", "handling", "agent") ?? "") || undefined, undefined),
    schengen,
  };
}

function finnaLista(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const key of ["flights", "Flights", "items", "Items", "data", "results"]) {
    if (Array.isArray(data[key])) return data[key];
  }
  for (const v of Object.values(data)) if (Array.isArray(v)) return v as any[];
  return [];
}

export async function GET() {
  try {
    const now = new Date();
    const dateFrom = isoZ(new Date(now.getTime() - 3 * 3600_000)); // 3 klst aftur í tímann
    const dateTo = isoZ(new Date(now.getTime() + 24 * 3600_000)); // 24 klst fram í tímann
    const sep = FIDS_BASE.includes("?") ? "&" : "?";
    const url = `${FIDS_BASE}${sep}dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`;

    const data = await saekjaJson(url);
    const listi = finnaLista(data);
    if (listi.length === 0) throw new Error("Engin flug í svari");

    const flug: Flug[] = listi.map((raw, i) => normalisera(raw, i));

    const svar: FidsSvar = { uppfaert: new Date().toISOString(), heimild: "live", flug };
    return NextResponse.json(svar, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const svar = syniSvar();
    return NextResponse.json(svar, {
      headers: {
        "Cache-Control": "no-store",
        "X-Fids-Fallback": "1",
        "X-Fids-Error": String(err instanceof Error ? err.message : err).slice(0, 120),
      },
    });
  }
}
