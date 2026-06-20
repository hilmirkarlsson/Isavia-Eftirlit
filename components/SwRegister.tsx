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
    }
  }, []);
  return null;
}
