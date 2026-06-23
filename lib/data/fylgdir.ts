// Fylgdir – yfirlit yfir hver fylgir hvaða verkefni (pax, crew, töskur o.fl.).
// Flokkar eru sjálfgefnir en starfsfólk getur bætt fleiri við eftir þörfum.

export type FylgdFlokkur = {
  id: string;
  nafn: string;
};

export const SJALFGEFNIR_FYLGDFLOKKAR: FylgdFlokkur[] = [
  { id: "pax", nafn: "Pax" },
  { id: "crew", nafn: "Crew" },
  { id: "toskur", nafn: "Töskur" },
];

export type FylgdEntry = {
  id: string;
  flokkurId: string;
  starfsmadurId: string | null;
  athugasemd: string;
  /** Tími úthlutunar (HH:MM). Fyllist sjálfkrafa við tengingu flugs, annars handvirkt. */
  timi: string;
  /** Tengt flug úr FIDS (valkvætt). */
  flugId?: string;
  flugnumer?: string;
};
