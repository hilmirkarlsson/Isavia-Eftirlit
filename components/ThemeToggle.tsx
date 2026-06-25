"use client";

import { useTema } from "@/lib/theme";
import { haptik } from "@/lib/haptics";

// Lítill hnappur efst í hægra horni sem víxlar milli ljósrar og dökkrar
// stillingar. Fastur (fixed) svo hann sé alltaf á sama stað, ofan á haus.
export default function ThemeToggle() {
  const { tema, vixla } = useTema();
  const dokkt = tema === "dark";

  return (
    <button
      onClick={() => {
        haptik();
        vixla();
      }}
      aria-label={dokkt ? "Skipta í ljósa stillingu" : "Skipta í dökka stillingu"}
      className="fixed right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white shadow-sm backdrop-blur active:scale-95"
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
