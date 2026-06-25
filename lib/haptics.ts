// Létt titringssvörun (haptic feedback) við smelli á síma sem styðja það.
// Gerir ekkert á tækjum/vöfrum án stuðnings (t.d. flestir borðtölvuvafrar,
// iOS Safari). Óhætt að kalla hvar sem er.

export function haptik(mynstur: number | number[] = 10) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(mynstur);
    }
  } catch {
    /* ignore */
  }
}

// Aðeins sterkari svörun fyrir staðfestingar (t.d. "Lokið", hliðaskipti).
export function haptikStadfest() {
  haptik([12, 40, 12]);
}
