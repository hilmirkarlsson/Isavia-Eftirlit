"use client";

import { useTema } from "@/lib/theme";
import { haptik } from "@/lib/haptics";

// Lítill hnappur sem víxlar milli ljósrar og dökkrar stillingar. Birtist
// yfirleitt inni í merkislituðum haus hverrar síðu (ekki fast/fixed yfir
// efni), svo hann helst á lituðum fleti óháð því hvert er skrunað.
// `aBjortu` er fyrir hvíta hausa (stjórnstöð) þar sem hvítt tákn sæist ekki.
export default function ThemeToggle({ aBjortu = false }: { aBjortu?: boolean }) {
  const { tema, vixla } = useTema();
  const dokkt = tema === "dark";

  return (
    <button
      onClick={() => {
        haptik();
        vixla();
      }}
      aria-label={dokkt ? "Skipta í ljósa stillingu" : "Skipta í dökka stillingu"}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm backdrop-blur active:scale-95 ${
        aBjortu ? "bg-slate-100 text-slate-600" : "bg-white/15 text-white"
      }`}
    >
      {dokkt ? (
        // Sól
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="4" />
          <path
            strokeLinecap="round"
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </svg>
      ) : (
        // Tungl
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
