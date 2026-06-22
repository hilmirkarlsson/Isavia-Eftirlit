"use client";

import { useEffect } from "react";

// Skráir service worker-inn fyrir uppsetningu (Add to Home Screen) og
// offline app-skel skyndiminni. Keyrir aðeins í vafra, ekki á server.
export default function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* hunsa – forritið virkar áfram án service worker */
      });

      // Þegar nýr service worker tekur við (eftir uppfærslu) – endurlesa
      // síðuna sjálfkrafa svo notandi sitji ekki fastur á gamalli/skemmdri
      // útgáfu (t.d. uppsett app sem var opið yfir nóttina).
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data === "ny-utgafa") {
          window.location.reload();
        }
      });
    }
  }, []);
  return null;
}
