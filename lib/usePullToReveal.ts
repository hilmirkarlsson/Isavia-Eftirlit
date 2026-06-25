"use client";

import { useEffect, useRef } from "react";

// Lítil hjálp: kallar `onReveal` þegar notandinn "togar niður" efst á síðunni
// (eins og pull-to-refresh). Notað í Flug og DMA til að sýna fyrri flug og
// uppfæra gögnin þegar skrunað er upp fyrir efsta flugið. Throttlað svo eitt
// tog kveiki bara einu sinni.
//
// Athugasemd um áreiðanleika: fyrri útgáfa krafðist þess að `window.scrollY`
// væri núll-ish í EINU augnabliki (touchstart eða eitt wheel-event) – á
// mörgum símum/touchpadum gerist það ekki nákvæmlega því skrunið er
// "elastic"/í mörgum litlum skrefum, svo togið misheppnaðist af og til.
// Núna er staðan "er ég efst" könnuð í HVERJU touchmove-skrefi (ekki bara í
// upphafi) og wheel-hreyfingar eru SUMMAÐAR meðan verið er efst, í stað þess
// að krefjast þess að eitt einstakt wheel-event sé nógu stórt.
export function usePullToReveal(onReveal: () => void, throttleMs = 700) {
  const ref = useRef(onReveal);
  ref.current = onReveal;

  useEffect(() => {
    let startY = 0;
    let togar = false;
    let kveikt = false;
    let sidast = 0;
    let wheelSafn = 0;
    let wheelTimer: ReturnType<typeof setTimeout> | null = null;

    const efst = () => window.scrollY <= 8;
    const kveikja = () => {
      const nu = Date.now();
      if (nu - sidast < throttleMs) return;
      sidast = nu;
      ref.current();
    };

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
      togar = efst();
      kveikt = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!togar || kveikt) return;
      if (!efst()) return; // notandi komst af stað aftur niður síðuna – sleppa
      const dy = (e.touches[0]?.clientY ?? 0) - startY;
      if (dy > 45) {
        kveikt = true;
        kveikja();
      }
    };
    const onTouchEnd = () => {
      togar = false;
      kveikt = false;
    };
    const onWheel = (e: WheelEvent) => {
      if (!efst()) {
        wheelSafn = 0;
        return;
      }
      if (e.deltaY < 0) {
        wheelSafn += e.deltaY;
        if (wheelTimer) clearTimeout(wheelTimer);
        wheelTimer = setTimeout(() => {
          wheelSafn = 0;
        }, 400);
        if (wheelSafn < -40) {
          wheelSafn = 0;
          kveikja();
        }
      } else {
        wheelSafn = 0;
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("wheel", onWheel);
      if (wheelTimer) clearTimeout(wheelTimer);
    };
  }, [throttleMs]);
}
