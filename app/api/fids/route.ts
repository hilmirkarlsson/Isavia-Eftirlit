import { NextResponse } from "next/server";
import { Flug, FidsSvar, syniSvar } from "@/lib/fids";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Milliþjónn (proxy) fyrir FIDS gögn Keflavíkurflugvallar.
//
// Vafrar geta ekki sótt gögnin beint frá kefairport.is vegna CORS, þess
// vegna sækir þjónninn gögnin og skilar þeim áfram. Slóðin er stillanleg
// með umhverfisbreytunni FIDS_URL ef opinbera slóðin breytist.
//
// Ef ekki næst í gögnin (t.d. í lokuðu þróunarumhverfi) er skilað
// sýnigögnum svo forritið virki áfram.

const FIDS_URL =
  process.env.FIDS_URL || "https://www.kefairport.is/json/flightinfo/keflavik";

function reyna<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Reynir að lesa tíma úr ýmsum formum og skila "HH:MM". */
function timi(v: unknown): string {
  if (!v) return "";
  const s = String(v);
  // ISO eða dagsetning
  const d = new Date(s);
  if (!Number.isNaN(d.getTime()) && /\d{4}-\d{2}-\d{2}/.test(s)) {
    return d.toTimeString().slice(0, 5);
  }
  // "HH:MM" eða "HHMM"
  const m = s.match(/(\d{1,2})[:.]?(\d{2})/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  return s;
}

/** Normaliserar eitt hrátt flug-objekt yfir í Flug. Sveigjanlegt gagnvart
 *  mismunandi reitanöfnum því nákvæmt snið FIDS er ekki staðfest. */
function normalisera(raw: any, tegund: "arrival" | "departure", i: number): Flug {
  const g = (...keys: string[]): any => {
    for (const k of keys) {
      if (raw?.[k] !== undefined && raw?.[k] !== null && raw?.[k] !== "") return raw[k];
    }
    return undefined;
  };

  return {
    id: String(g("Id", "id", "FlightId", "flightId") ?? `${tegund}-${i}`),
    tegund,
    flugnumer: String(g("No", "FlightNumber", "flightNumber", "Number", "flight") ?? "—"),
    flugfelag: String(g("Airline", "airline", "Carrier", "company") ?? ""),
    borg: String(
      g("AirportR", "Airport", "City", "destination", "origin", "DisplayName") ?? ""
    ),
    aaetlad: timi(g("Scheduled", "ScheduledTime", "scheduled", "STD", "STA", "Plan")),
    raun: reyna(
      () => timi(g("Estimated", "EstimatedTime", "Expected", "estimated", "Actual", "ATA", "ATD")),
      undefined
    ),
    hlid: reyna(() => String(g("Gate", "gate") ?? "") || undefined, undefined),
    staedi: reyna(() => String(g("Stand", "stand", "Bay") ?? "") || undefined, undefined),
    faeriband: reyna(
      () => String(g("Belt", "belt", "Carousel", "BaggageBelt") ?? "") || undefined,
      undefined
    ),
    stada: reyna(() => String(g("Status", "status", "Remark", "State") ?? "") || undefined, undefined),
    reg: reyna(
      () => String(g("Registration", "registration", "Reg", "AircraftReg", "TailNumber") ?? "") || undefined,
      undefined
    ),
    schengen: reyna(() => {
      const v = String(g("Schengen", "schengen", "IsSchengen") ?? "").toLowerCase();
      if (v === "s" || v === "true" || v === "schengen" || v === "1") return "S" as const;
      if (v === "n" || v === "false" || v === "non-schengen" || v === "0") return "N" as const;
      return undefined;
    }, undefined),
  };
}

/** Reynir að finna lista af flugum í óþekktu JSON sniði. */
function finnaLista(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const key of ["Flights", "flights", "Items", "items", "data", "Data", "results"]) {
    if (Array.isArray(data[key])) return data[key];
  }
  // Fyrsta array-gildið sem finnst
  for (const v of Object.values(data)) {
    if (Array.isArray(v)) return v as any[];
  }
  return [];
}

function giskaTegund(raw: any, fallback: "arrival" | "departure"): "arrival" | "departure" {
  const t = String(
    raw?.Type ?? raw?.type ?? raw?.Direction ?? raw?.direction ?? ""
  ).toLowerCase();
  if (t.startsWith("a") || t.includes("koma") || t.includes("arr")) return "arrival";
  if (t.startsWith("d") || t.includes("brott") || t.includes("dep")) return "departure";
  return fallback;
}

export async function GET() {
  try {
    const res = await fetch(FIDS_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Eftirlit-KEF/1.0 (internal monitoring tool)",
      },
      cache: "no-store",
      // Stutt tímamörk svo notandinn bíði ekki of lengi áður en
      // sýnigögn taka við.
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`FIDS svar ${res.status}`);

    const data = await res.json();
    const listi = finnaLista(data);
    if (listi.length === 0) throw new Error("Engin flug í svari");

    const flug: Flug[] = listi.map((raw, i) =>
      normalisera(raw, giskaTegund(raw, "departure"), i)
    );

    const svar: FidsSvar = {
      uppfaert: new Date().toISOString(),
      heimild: "live",
      flug,
    };
    return NextResponse.json(svar, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    // Varaleið: sýnigögn svo forritið virki áfram.
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
