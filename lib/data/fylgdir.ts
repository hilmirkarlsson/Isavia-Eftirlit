// Fylgdir – nafngreindir hópar sem fylgja flugi (pax, crew, töskur o.fl.).
// Hver fylgd hefur nafn, frjálsan texta um hvers konar fylgd þetta er,
// einn eða fleiri pósta/starfsmenn (hver með sína úthlutun) og getur
// tengst flugi (komu eða brottför).

export type FylgdStarfsmadur = {
  starfsmadurId: string;
  /** Hvað þessi póstur á að gera í fylgdinni, t.d. "Tekur á móti", "Töskur". */
  verkefni: string;
};

export type Fylgd = {
  id: string;
  nafn: string;
  tegund: string; // frjálst skráð, t.d. "VIP", "Hjólastóll", "Sérstök farþegar"
  starfsmenn: FylgdStarfsmadur[]; // póstar sem sinna fylgdinni, hver með sína úthlutun
  /** Tími úthlutunar (HH:MM). Fyllist sjálfkrafa við tengingu flugs, annars handvirkt. */
  timi: string;
  /** Valkvætt: hvenær pósturinn á að vera tilbúinn (HH:MM) – t.d. mæta á undan flugi. */
  tilbuinn?: string;
  /** Tengt flug úr FIDS (valkvætt) – koma eða brottför. */
  flugId?: string;
  flugnumer?: string;
};

