import { NextResponse } from "next/server";
import https from "https";
import { Flug, FidsSvar, syniSvar } from "@/lib/fids";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

// Milliþjónn (proxy) fyrir FIDS gögn Keflavíkurflugvallar.
//
// Notar opinbera FIDS-vef vallarins, https://www.kefairport.is/fids, sem
// sækir gögnin sín í https://www.kefairport.is/api/sourceData?from=…&to=….
// Sú slóð skilar {ok, value: [...]} með áætlunar-/raun-/væntum tímum, hliði,
// stæði (StandCode), færibandi, skráningu og stöðu. Slóðin (grunnurinn, án
// from/to) er stillanleg með FIDS_URL.
//
// Náist ekki í gögnin (t.d. í lokuðu umhverfi) er skilað sýnigögnum.

// Leyfðir hýsingar fyrir FIDS_URL – kemur í veg fyrir að breytan (sem mætti
// fyrir slysni eða mistök stillast á annan/innri vef) sendi þjóninn í
// óviðkomandi netslóð (SSRF). Bætið við hér ef vallarkerfi flytjast.
const LEYFDAR_HYSINGAR = new Set(["www.kefairport.is"]);
const HAMARK_SVAR_BYTES = 10 * 1024 * 1024; // 10MB

type FidsFlightRow = {
  AODBFlightId?: unknown;
  DepartureArrivalType?: unknown;
  AirlineIATA?: unknown;
  FlightNumber?: unknown;
  AirlineDesc?: unknown;
  OriginDestAirportDesc?: unknown;
  OriginDestAirportIATA?: unknown;
  ScheduledDateTime?: unknown;
  EstimatedDateTime?: unknown;
  ActualDateTime?: unknown;
  GateCode?: unknown;
  StandCode?: unknown;
  BaggageClaimUnit?: unknown;
  FlightStatusDesc?: unknown;
  FlightStatus?: unknown;
  Registration?: unknown;
  AircraftTypeIATA?: unknown;
};

/** Sannreynir FIDS_URL gegn allowlist – kallað í request-tíma (ekki við
 *  module-hleðslu) svo ógild stilling falli yfir í sýnigögn eins og önnur
 *  FIDS-villa, í stað þess að brjóta alla leiðina. */
function virktFidsSlod(): string {
  const slod = process.env.FIDS_URL || "https://www.kefairport.is/api/sourceData";
  const url = new URL(slod); // hendir ef ógild slóð – grípið af kallanda
  if (url.protocol !== "https:" || !LEYFDAR_HYSINGAR.has(url.hostname)) {
    throw new Error(`FIDS_URL er ekki á leyfðri hýsingu: ${url.hostname}`);
  }
  // sourceData krefst from/to – sama gluggi og áður: 3 klst aftur, 24 fram.
  const nu = Date.now();
  url.searchParams.set("from", new Date(nu - 3 * 3600_000).toISOString());
  url.searchParams.set("to", new Date(nu + 24 * 3600_000).toISOString());
  return url.toString();
}

/** Sækir JSON með Node https – takmarkar svarstærð og heildartíma beiðnar. */
function saekjaJson(url: string, timeoutMs = 9000): Promise<unknown> {
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
        let bytes = 0;
        res.setEncoding("utf8");
        res.on("data", (c: string) => {
          bytes += Buffer.byteLength(c);
          if (bytes > HAMARK_SVAR_BYTES) {
            req.destroy(new Error("FIDS svar of stórt"));
            return;
          }
          data += c;
        });
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

function texti(v: unknown): string {
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

function fidsListi(data: unknown): FidsFlightRow[] {
  const value = Array.isArray(data)
    ? data
    : typeof data === "object" && data !== null
      ? (data as { value?: unknown }).value
      : undefined;

  if (!Array.isArray(value)) return [];
  return value.filter((row): row is FidsFlightRow => typeof row === "object" && row !== null);
}

/** Eitt flug úr value-fylkinu sem /api/sourceData skilar. */
function normalisera(raw: FidsFlightRow, i: number): Flug {
  const koma = texti(raw.DepartureArrivalType).toUpperCase() === "A";
  const tegund: "arrival" | "departure" = koma ? "arrival" : "departure";

  const flugnumer =
    `${texti(raw.AirlineIATA)} ${texti(raw.FlightNumber)}`.trim() || `—${i}`;

  // Forgangsraða væntum/raunverulegum tíma fram yfir upprunalega áætlun,
  // til samræmis við fyrri útgáfu þessa proxy.
  const rawTs = raw.EstimatedDateTime ?? raw.ActualDateTime ?? raw.ScheduledDateTime;
  const ts = rawTs ? Date.parse(String(rawTs)) : NaN;

  return {
    id: texti(raw.AODBFlightId) || `${tegund}-${i}`,
    tegund,
    flugnumer,
    flugfelag: texti(raw.AirlineDesc) || texti(raw.AirlineIATA),
    borg: texti(raw.OriginDestAirportDesc),
    iata: texti(raw.OriginDestAirportIATA) || undefined,
    aaetlad: timi(raw.ScheduledDateTime),
    raun: reyna(() => timi(raw.EstimatedDateTime ?? raw.ActualDateTime) || undefined, undefined),
    hlid: reyna(() => texti(raw.GateCode) || undefined, undefined),
    staedi: reyna(() => texti(raw.StandCode) || undefined, undefined),
    faeriband: reyna(() => texti(raw.BaggageClaimUnit) || undefined, undefined),
    // FlightStatusDesc ("Departed", "Gate Closed", "Cancelled" …) passar við
    // orðamynstrin sem erBordingLokad() leitar að.
    stada: reyna(() => texti(raw.FlightStatusDesc) || texti(raw.FlightStatus) || undefined, undefined),
    reg: reyna(() => texti(raw.Registration) || undefined, undefined),
    tegundVel: reyna(() => texti(raw.AircraftTypeIATA) || undefined, undefined),
    // sourceData ber hvorki handling agent né schengen-merki; flugSchengen()
    // ályktar S/N áfram út frá bókstaf hliðsins (C/D).
    handling: undefined,
    schengen: undefined,
    ts: Number.isNaN(ts) ? undefined : ts,
  };
}

export async function GET() {
  try {
    const data = await saekjaJson(virktFidsSlod());
    const listi = fidsListi(data);
    if (listi.length === 0) {
      throw new Error("Engin flug í svari");
    }

    const flug: Flug[] = listi.map(normalisera);

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
