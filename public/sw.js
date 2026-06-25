// Einfaldur service worker fyrir Eftirlit KEF – cachar forritsskelina svo
// hægt sé að opna forritið (eldri skjáir) án nets, en sækir allt – HTML,
// CSS, JS – alltaf beint á netið fyrst. Skyndiminnið er EINGÖNGU varaleið
// þegar nettenging er ekki til staðar, svo aldrei sé hætta á að gömul
// útgáfa (t.d. CSS skrá sem er ekki lengur til eftir nýja útgáfu) sitji
// fast og sýnist sem "óstílað"/brotið forrit.

const CACHE = "eftirlit-kef-v3";
const SKEL = ["/heim", "/dma", "/flug", "/sudur", "/verkefni", "/vaktir", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SKEL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((c) => c.postMessage("ny-utgafa")))
  );
  self.clients.claim();
});

// --- Ýtitilkynningar (push) ------------------------------------------------
self.addEventListener("push", (event) => {
  let gogn = { titill: "Eftirlit KEF", texti: "", slod: "/heim" };
  try {
    if (event.data) gogn = { ...gogn, ...event.data.json() };
  } catch {
    /* nota sjálfgefið */
  }
  event.waitUntil(
    self.registration.showNotification(gogn.titill, {
      body: gogn.texti,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { slod: gogn.slod || "/heim" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const slod = event.notification.data?.slod || "/heim";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) {
          c.navigate(slod);
          return c.focus();
        }
      }
      return self.clients.openWindow(slod);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Aldrei skyndiminni fyrir API kall – gögnin þurfa að vera rauntíma.
  if (url.pathname.startsWith("/api/")) return;

  // Net fyrst fyrir allt – HTML, CSS, JS, myndir. Skyndiminni er bara
  // varaleið ef nettengingin dettur niður.
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return res;
      })
      .catch(() =>
        caches.match(request).then((r) => r || (request.mode === "navigate" ? caches.match("/heim") : undefined))
      )
  );
});
