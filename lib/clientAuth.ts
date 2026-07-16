"use client";

// Vafrahlið auðkenningarins – les tókann sem PasswordGate vistaði eftir rétt
// lykilorð og bætir honum við sem haus á beiðnir til vernduðu API-leiðanna
// (/api/state, /api/skipulag-mynd).

export const TOKEN_LYKILL = "eftirlit-kef-token";
export const TOKEN_HAUS = "X-Eftirlit-Token";

/** Headers-hlutur með auðkenningarhaus, eða tómur hlutur ef enginn tóki er vistaður. */
export function tokiHausar(): Record<string, string> {
  try {
    const t = localStorage.getItem(TOKEN_LYKILL);
    return t ? { [TOKEN_HAUS]: t } : {};
  } catch {
    return {};
  }
}
