import webpush from "web-push";
import { lesaPushAskriftir, skrifaPushAskriftir, PushAskrift } from "./backend";

// Ýtitilkynningar (Web Push). Krefst VAPID-lykla í umhverfisbreytum:
//   VAPID_PUBLIC_KEY   – opinber lykill (líka sendur í vafrann)
//   VAPID_PRIVATE_KEY  – leynilykill (aldrei í vafrann)
//   VAPID_SUBJECT      – mailto: eða slóð (valkvætt, sjálfgefið dæmi)
// Ef lyklarnir eru ekki settir er `pushVirkt()` false og allt verður no-op,
// svo óhætt er að keyra forritið án þeirra (hnappurinn felur sig þá).

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:eftirlit@kefairport.is";

let stillt = false;

export function pushVirkt(): boolean {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY);
}

export function pushOpinberLykill(): string {
  return PUBLIC_KEY;
}

function tryggjaStillt() {
  if (stillt || !pushVirkt()) return;
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  stillt = true;
}

export type PushSkilabod = {
  titill: string;
  texti: string;
  slod?: string; // hvert á að fara þegar smellt er (sjálfgefið /heim)
};

/**
 * Sendir tilkynningu á áskrifendur. Ef `fyrir` er gefið (listi af
 * starfsmanna-id) fara skilaboðin aðeins á þau tæki; annars á alla.
 * Hreinsar sjálfkrafa út áskriftir sem eru ekki lengur gildar (404/410).
 */
export async function sendaPush(skilabod: PushSkilabod, fyrir?: string[]): Promise<void> {
  if (!pushVirkt()) return;
  tryggjaStillt();

  const allar = await lesaPushAskriftir();
  if (allar.length === 0) return;

  const markhopur =
    fyrir && fyrir.length > 0
      ? allar.filter((a) => a.notandi && fyrir.includes(a.notandi))
      : allar;
  if (markhopur.length === 0) return;

  const buntur = JSON.stringify({
    titill: skilabod.titill,
    texti: skilabod.texti,
    slod: skilabod.slod ?? "/heim",
  });

  const ogildar = new Set<string>();
  await Promise.all(
    markhopur.map(async (a: PushAskrift) => {
      try {
        await webpush.sendNotification(
          { endpoint: a.endpoint, keys: a.keys },
          buntur
        );
      } catch (e) {
        const stada = (e as { statusCode?: number }).statusCode;
        if (stada === 404 || stada === 410) ogildar.add(a.endpoint);
      }
    })
  );

  if (ogildar.size > 0) {
    await skrifaPushAskriftir(allar.filter((a) => !ogildar.has(a.endpoint)));
  }
}
