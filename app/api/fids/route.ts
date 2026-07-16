import { NextResponse } from "next/server";
import https from "https";
import { Flug, FidsSvar, Fr24Flug, syniSvar } from "@/lib/fids";

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
const FR24_BASE = "https://fr24api.flightradar24.com";
const FR24_DEFAULT_AIRPORTS = "inbound:KEF,outbound:KEF";

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

type Fr24Row = Record<string, unknown>;

type Fr24Nidurstada =
  | { heimild: "missing-key" }
  | { heimild: "live" | "sandbox"; flug: Fr24Row[] }
  | { heimild: "error"; villa: string };

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

async function saekjaFr24(timeoutMs = 6000): Promise<Fr24Nidurstada> {
  const lykill = process.env.FR24_API_KEY || process.env.FR24_API_TOKEN;
  if (!lykill) return { heimild: "missing-key" };

  const sandbox = /^(1|true|yes)$/i.test(process.env.FR24_SANDBOX ?? "");
  const url = new URL(
    `${FR24_BASE}/api/${sandbox ? "sandbox/" : ""}live/flight-positions/full`
  );
  const airports = process.env.FR24_AIRPORTS || FR24_DEFAULT_AIRPORTS;
  const bounds = process.env.FR24_BOUNDS;
  if (airports) url.searchParams.set("airports", airports);
  if (bounds) url.searchParams.set("bounds", bounds);
  url.searchParams.set("limit", process.env.FR24_LIMIT || "300");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-version": "v1",
        Authorization: `Bearer ${lykill}`,
        "User-Agent": "Eftirlit-KEF/1.0 (internal monitoring)",
      },
    });
    if (!res.ok) throw new Error(`FR24 svar ${res.status}`);
    const json = (await res.json()) as { data?: unknown };
    const data = Array.isArray(json.data) ? json.data : [];
    return {
      heimild: sandbox ? "sandbox" : "live",
      flug: data.filter((row): row is Fr24Row => typeof row === "object" && row !== null),
    };
  } catch (err) {
    return {
      heimild: "error",
      villa: String(err instanceof Error ? err.message : err).slice(0, 120),
    };
  } finally {
    clearTimeout(timer);
  }
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

function tala(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function idTexti(v: unknown): string | undefined {
  const s = texti(v).trim();
  return s || undefined;
}

function hreinsaAuðkenni(v: unknown): string {
  return texti(v).replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function fr24Auðkenni(row: Fr24Row): string[] {
  return [
    row.reg,
    row.registration,
    row.callsign,
    row.flight,
    row.flight_number,
  ]
    .map(hreinsaAuðkenni)
    .filter(Boolean);
}

function fr24Map(rows: Fr24Row[]): Map<string, Fr24Row> {
  const map = new Map<string, Fr24Row>();
  for (const row of rows) {
    for (const key of fr24Auðkenni(row)) {
      if (!map.has(key)) map.set(key, row);
    }
  }
  return map;
}

function fr24Seen(row: Fr24Row): string | undefined {
  const raw = row.timestamp ?? row.last_seen ?? row.seen ?? row.updated;
  const n = tala(raw);
  if (n !== undefined) {
    return new Date(n > 10_000_000_000 ? n : n * 1000).toISOString();
  }
  const s = idTexti(raw);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function normaliseraFr24(row: Fr24Row, tengtFids: boolean): Fr24Flug {
  return {
    id: idTexti(row.fr24_id) || idTexti(row.id),
    flight: idTexti(row.flight) || idTexti(row.flight_number),
    callsign: idTexti(row.callsign) || idTexti(row.flight),
    reg: idTexti(row.reg) || idTexti(row.registration),
    origIata: idTexti(row.orig_iata) || idTexti(row.origin_iata) || idTexti(row.from_iata),
    destIata: idTexti(row.dest_iata) || idTexti(row.destination_iata) || idTexti(row.to_iata),
    lat: tala(row.lat),
    lon: tala(row.lon),
    altitudeFt: tala(row.alt),
    groundSpeedKt: tala(row.gspeed),
    headingDeg: tala(row.track) ?? tala(row.heading),
    verticalSpeedFpm: tala(row.vspeed),
    squawk: idTexti(row.squawk),
    seen: fr24Seen(row),
    tengtFids,
  };
}

function tengjaFr24(
  flug: Flug[],
  rows: Fr24Row[]
): { flug: Flug[]; tengd: number; fr24Flug: Fr24Flug[] } {
  const map = fr24Map(rows);
  let tengd = 0;
  const tengdAuðkenni = new Set<string>();
  const merkt = flug.map((f) => {
    const row = map.get(hreinsaAuðkenni(f.reg)) ?? map.get(hreinsaAuðkenni(f.flugnumer));
    if (!row) return f;
    tengd += 1;
    for (const key of fr24Auðkenni(row)) tengdAuðkenni.add(key);
    return {
      ...f,
      reg: f.reg || idTexti(row.reg) || idTexti(row.registration),
      fr24: {
        id: idTexti(row.fr24_id) || idTexti(row.id),
        callsign: idTexti(row.callsign) || idTexti(row.flight),
        lat: tala(row.lat),
        lon: tala(row.lon),
        altitudeFt: tala(row.alt),
        groundSpeedKt: tala(row.gspeed),
        headingDeg: tala(row.track) ?? tala(row.heading),
        verticalSpeedFpm: tala(row.vspeed),
        squawk: idTexti(row.squawk),
        seen: fr24Seen(row),
      },
    };
  });
  return {
    flug: merkt,
    tengd,
    fr24Flug: rows.map((row) =>
      normaliseraFr24(
        row,
        fr24Auðkenni(row).some((key) => tengdAuðkenni.has(key))
      )
    ),
  };
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

    const grunnFlug: Flug[] = listi.map(normalisera);
    const fr24 = await saekjaFr24();
    const tengt =
      "flug" in fr24
        ? tengjaFr24(grunnFlug, fr24.flug)
        : { flug: grunnFlug, tengd: 0, fr24Flug: [] };

    const svar: FidsSvar = {
      uppfaert: new Date().toISOString(),
      heimild: "live",
      flug: tengt.flug,
      fr24:
        fr24.heimild === "missing-key"
          ? { heimild: "missing-key" }
          : fr24.heimild === "error"
            ? { heimild: "error", villa: fr24.villa }
            : {
                heimild: fr24.heimild,
                fjoldi: fr24.flug.length,
                tengd: tengt.tengd,
                flug: tengt.fr24Flug,
              },
    };
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
