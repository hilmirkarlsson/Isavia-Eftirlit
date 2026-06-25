// Hjálparföll vaframegin fyrir ýtitilkynningar (push). Sjá lib/push.ts og
// /api/push fyrir þjónshlutann.

function base64ÍUint8(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export type PushStada = "ekki-stutt" | "ekki-uppsett" | "af" | "a";

/** Athugar hvort push sé stutt og uppsett, og hvort þetta tæki er áskrifandi. */
export async function pushStada(): Promise<PushStada> {
  if (typeof window === "undefined") return "ekki-stutt";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "ekki-stutt";
  }
  try {
    const res = await fetch("/api/push");
    const data = (await res.json()) as { virkt?: boolean };
    if (!data.virkt) return "ekki-uppsett";
  } catch {
    return "ekki-uppsett";
  }
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return sub ? "a" : "af";
}

/** Kveikir á tilkynningum fyrir þetta tæki (skráir áskrift). */
export async function kveiktiAPush(notandi: string | null): Promise<PushStada> {
  if (Notification.permission !== "granted") {
    const leyfi = await Notification.requestPermission();
    if (leyfi !== "granted") return "af";
  }
  const res = await fetch("/api/push");
  const data = (await res.json()) as { virkt?: boolean; opinberLykill?: string };
  if (!data.virkt || !data.opinberLykill) return "ekki-uppsett";

  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ÍUint8(data.opinberLykill),
    }));

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  await fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: json, notandi }),
  });
  return "a";
}

/** Slekkur á tilkynningum fyrir þetta tæki (afskráir áskrift). */
export async function slokktiAPush(): Promise<PushStada> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => {});
    await fetch("/api/push", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
  }
  return "af";
}

/** Sendir tilkynningu (kallað t.d. þegar fylgd er merkt Lokið). Aldrei blokkar. */
export function sendaTilkynningu(titill: string, texti: string, fyrir?: string[], slod?: string) {
  try {
    void fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titill, texti, fyrir, slod }),
    });
  } catch {
    /* ignore */
  }
}
