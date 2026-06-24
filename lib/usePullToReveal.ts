"use client";

import { useEffect, useRef } from "react";

// Lítil hjálp: kallar `onReveal` þegar notandinn "togar niður" efst á síðunni
// (eins og pull-to-refresh). Notað í Flug til að sýna fyrri flug og uppfæra
// gögnin þegar skrunað er upp fyrir efsta flugið. Throttlað svo eitt tog
// kveiki bara einu sinni.
export function usePullToReveal(onReveal: () => void, throttleMs = 700) {
  const ref = useRef(onReveal);
  ref.current = onReveal;

  useEffect(() => {
    let startY = 0;
    let togar = false;
    let sidast = 0;

    const efst = () => window.scrollY <= 2;
    const kveikja = () => {
      const nu = Date.now();
      if (nu - sidast < throttleMs) return;
      sidast = nu;
      ref.current();
    };

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
      togar = efst();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!togar) return;
      const dy = (e.touches[0]?.clientY ?? 0) - startY;
      if (dy > 60) {
        togar = false;
        kveikja();
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (efst() && e.deltaY < -24) kveikja();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("wheel", onWheel);
    };
  }, [throttleMs]);
}
