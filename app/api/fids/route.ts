import { NextResponse } from "next/server";
import https from "https";
import { Flug, FidsSvar, syniSvar } from "@/lib/fids";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

// Milliþjónn (proxy) fyrir FIDS gögn Keflavíkurflugvallar.
//
// Raunverulega vefþjónustan (sama og opinberi vefurinn www.kefairport.is/fids
// notar – staðfest úr JS-bunkanum þar) er:
//   https://www.kefairport.is/api/sourceData?from=...&to=...
// Vafrar geta ekki sótt þetta beint vegna CORS, þess vegna sækir þjónninn
// ÖLL flugin innan tímabils og skilar þeim áfram. Slóðin er stillanleg
// með FIDS_URL.
//
// Náist ekki í gögnin (t.d. í lokuðu umhverfi) er skilað sýnigögnum.

const FIDS_BASE = process.env.FIDS_URL || "https://www.kefairport.is/api/sourceData";

/** Sækir JSON með Node https. */
function saekjaJson(url: string, timeoutMs = 9000): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
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
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return "";
  return d.toTimeString().slice(0, 5);
}

/** Eitt flug úr "value" fylkinu í /api/sourceData svarinu. */
function normalisera(raw: any, i: number): Flug {
  const g = (...keys: string[]): any => {
    for (const k of keys) {
      const v = raw?.[k];
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
  };

  const koma = raw?.DepartureArrivalType === "A";
  const tegund: "arrival" | "departure" = koma ? "arrival" : "departure";

  const flugnumer = `${raw?.AirlineIATA ?? ""} ${raw?.FlightNumber ?? ""}`.trim() || `—${i}`;

  const rawTs = raw?.EstimatedDateTime ?? raw?.ActualDateTime ?? raw?.ScheduledDateTime;
  const ts = rawTs ? Date.parse(String(rawTs)) : NaN;

  return {
    id: String(raw?.AODBFlightId ?? `${tegund}-${i}`),
    tegund,
    flugnumer,
    flugfelag: String(raw?.AirlineDesc ?? raw?.AirlineName ?? raw?.AirlineIATA ?? ""),
    borg: String(raw?.OriginDestAirportDesc ?? raw?.OriginDestAirportIATA ?? ""),
    iata: raw?.OriginDestAirportIATA || undefined,
    aaetlad: timi(raw?.ScheduledDateTime),
    raun: reyna(() => timi(raw?.EstimatedDateTime ?? raw?.ActualDateTime) || undefined, undefined),
    hlid: reyna(() => String(raw?.GateCode ?? "") || undefined, undefined),
    staedi: reyna(() => String(raw?.StandCode ?? "") || undefined, undefined),
    faeriband: reyna(() => String(raw?.BaggageClaimUnit ?? "") || undefined, undefined),
    stada: reyna(() => String(raw?.FlightStatusDesc ?? "") || undefined, undefined),
    reg: reyna(() => String(raw?.Registration ?? "") || undefined, undefined),
    tegundVel: reyna(() => String(raw?.AircraftTypeIATA ?? "") || undefined, undefined),
    handling: reyna(
      () =>
        String(
          g(
            "HandlingAgent",
            "HandlingAgentIATA",
            "HandlingAgentDesc",
            "GroundHandlerIATA",
            "GroundHandler",
            "GroundHandlingAgent",
            "HandlerIATA",
            "Handler",
            "ServiceProvider",
            "ServiceProviderIATA"
          ) ?? ""
        ) || undefined,
      undefined
    ),
    schengen: undefined,
    ts: Number.isNaN(ts) ? undefined : ts,
  };
}

export async function GET() {
  try {
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 3600_000).toISOString();
    const to = new Date(now.getTime() + 24 * 3600_000).toISOString();
    const sep = FIDS_BASE.includes("?") ? "&" : "?";
    const url = `${FIDS_BASE}${sep}from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    const data = await saekjaJson(url);
    if (!data?.ok || !Array.isArray(data.value) || data.value.length === 0) {
      throw new Error("Engin flug í svari");
    }

    const flug: Flug[] = data.value.map((raw: any, i: number) => normalisera(raw, i));

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
