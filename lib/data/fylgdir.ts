// Fylgdir – nafngreindir hópar sem fylgja flugi (pax, crew, töskur o.fl.).
// Hver fylgd hefur nafn, frjálsan texta um hvers konar fylgd þetta er,
// einn eða fleiri pósta/starfsmenn og getur tengst flugi (komu eða brottför).

export type Fylgd = {
  id: string;
  nafn: string;
  tegund: string; // frjálst skráð, t.d. "VIP", "Hjólastóll", "Sérstök farþegar"
  starfsmenn: string[]; // id-ar starfsmanna sem sinna fylgdinni
  /** Tími úthlutunar (HH:MM). Fyllist sjálfkrafa við tengingu flugs, annars handvirkt. */
  timi: string;
  /** Tengt flug úr FIDS (valkvætt) – koma eða brottför. */
  flugId?: string;
  flugnumer?: string;
};
