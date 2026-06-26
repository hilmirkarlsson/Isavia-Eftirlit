import { NextResponse } from "next/server";
import https from "https";
import { Flug, FidsSvar, syniSvar } from "@/lib/fids";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

// Milliþjónn (proxy) fyrir FIDS gögn Keflavíkurflugvallar.
//
// Notar https://fids.kefairport.is/api/flights – innra rauntímakerfi
// vallarins. Þetta er mun fyllri uppspretta en opinbera vefsvæðið
// (www.kefairport.is), enda inniheldur hún líka flug sem ekki eru birt
// almenningi (public_display: 0) – t.d. einka- og ríkisflug sem nota DMA
// stæði. Slóðin er stillanleg með FIDS_URL.
//
// Náist ekki í gögnin (t.d. í lokuðu umhverfi) er skilað sýnigögnum.

// Leyfðir hýsingar fyrir FIDS_URL – kemur í veg fyrir að breytan (sem mætti
// fyrir slysni eða mistök stillast á annan/innri vef) sendi þjóninn í
// óviðkomandi netslóð (SSRF). Bætið við hér ef vallarkerfi flytjast.
const LEYFDAR_HYSINGAR = new Set(["fids.kefairport.is"]);
const HAMARK_SVAR_BYTES = 10 * 1024 * 1024; // 10MB

/** Sannreynir FIDS_URL gegn allowlist – kallað í request-tíma (ekki við
 *  module-hleðslu) svo ógild stilling falli yfir í sýnigögn eins og önnur
 *  FIDS-villa, í stað þess að brjóta alla leiðina. */
function virktFidsSlod(): string {
  const slod = process.env.FIDS_URL || "https://fids.kefairport.is/api/flights";
  const url = new URL(slod); // hendir ef ógild slóð – grípið af kallanda
  if (url.protocol !== "https:" || !LEYFDAR_HYSINGAR.has(url.hostname)) {
    throw new Error(`FIDS_URL er ekki á leyfðri hýsingu: ${url.hostname}`);
  }
  return url.toString();
}

/** Sækir JSON með Node https – takmarkar svarstærð og heildartíma beiðnar. */
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

/** Búa til lýsandi stöðutexta úr þeim reitum sem til eru, svo
 *  erBordingLokad() (sem leitar að orðum eins og "closed"/"departed") virki
 *  áfram – þessi uppspretta gefur ekki einn samfelldan stöðutexta eins og
 *  gamla almenna vefsvæðið gerði. */
function stadaTexti(raw: any): string | undefined {
  if (raw?.cancelled === 1) return "Cancelled";
  if (raw?.status) return String(raw.status);
  if (raw?.gate_closed_time) return "Gate Closed";
  if (raw?.final_call_time) return "Final Call";
  if (raw?.boarding_time) return "Boarding";
  return undefined;
}

/** Eitt flug úr fylkinu sem /api/flights skilar. */
function normalisera(raw: any, i: number): Flug {
  const koma = String(raw?.destination_iata ?? "").toUpperCase() === "KEF";
  const tegund: "arrival" | "departure" = koma ? "arrival" : "departure";

  const flugnumer =
    `${raw?.flight_prefix ?? ""} ${raw?.flight_num ?? ""}`.trim() || String(raw?.flt ?? "") || `—${i}`;

  // Forgangsraða raunverulegum/áætluðum tíma fram yfir upprunalega áætlun,
  // til samræmis við fyrri útgáfu þessa proxy.
  const rawTs = raw?.expected_time ?? raw?.block_time ?? raw?.sched_time;
  const ts = rawTs ? Date.parse(String(rawTs)) : NaN;

  return {
    id: String(raw?.m_id ?? `${tegund}-${i}`),
    tegund,
    flugnumer,
    flugfelag: String(raw?.airline_name_friendly ?? raw?.airline_name ?? raw?.flight_prefix ?? ""),
    borg: String(koma ? raw?.origin ?? "" : raw?.destination ?? ""),
    iata: (koma ? raw?.origin_iata : raw?.destination_iata) || undefined,
    aaetlad: timi(raw?.sched_time),
    raun: reyna(() => timi(raw?.expected_time ?? raw?.block_time) || undefined, undefined),
    hlid: reyna(() => String(raw?.gate ?? "") || undefined, undefined),
    staedi: reyna(() => String(raw?.stand ?? "") || undefined, undefined),
    faeriband: reyna(() => String(raw?.belt ?? "") || undefined, undefined),
    stada: stadaTexti(raw),
    reg: reyna(() => String(raw?.aircraft_reg ?? "") || undefined, undefined),
    tegundVel: reyna(() => String(raw?.aircraft_type ?? "") || undefined, undefined),
    handling: reyna(() => String(raw?.handling_agent ?? "") || undefined, undefined),
    schengen: raw?.schengen === 1 ? "S" : raw?.schengen === 0 ? "N" : undefined,
    ts: Number.isNaN(ts) ? undefined : ts,
  };
}

export async function GET() {
  try {
    const data = await saekjaJson(virktFidsSlod());
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Engin flug í svari");
    }

    const flug: Flug[] = data.map((raw: any, i: number) => normalisera(raw, i));

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
