"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Tryggir að forritið opnist alltaf á Heim þegar það er ræst (köld ræsing eða
// þegar það er tekið fram úr bakgrunni eftir smá stund), í stað þess að halda
// síðustu síðu (t.d. Flug) sem iOS gerir fyrir heimaskjáforrit (PWA).
const BAK_THROSKULDUR_MS = 90_000; // tekið fram úr bakgrunni eftir >90s → Heim

export default function OpnaAHeim() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Köld ræsing: nýtt JS-samhengi → sessionStorage tómt. Förum á Heim.
    try {
      if (!sessionStorage.getItem("opnad")) {
        sessionStorage.setItem("opnad", "1");
        if (pathname !== "/heim") router.replace("/heim");
      }
    } catch {
      /* ignore */
    }

    let falidKl = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        falidKl = Date.now();
      } else if (falidKl && Date.now() - falidKl > BAK_THROSKULDUR_MS) {
        falidKl = 0;
        router.replace("/heim");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // Keyrist einu sinni – við viljum ekki endurræsa við hverja síðuskiptingu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
