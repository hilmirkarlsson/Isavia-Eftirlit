// Vaktir – yfirlit yfir hvaða starfsfólk er á hverri vakt (E, B, …).
//
// Þetta er sýn fyrir vaktstjóra svo þeir sjái hverjir eru á hverri vakt og
// geti bætt við vöktum og fólki. Geymt í sameiginlegu ástandi (shared state)
// svo það samstillist milli tækja. Núverandi vakt forritsins (starfsfólkið í
// VAKT) er E-vaktin – hún er sjálfgefið sæði ef enginn listi er til.

export type VaktMedlimur = {
  id: string;
  nafn: string;
};

export type VaktSkraning = {
  id: string;
  /** Heiti vaktar, t.d. "E", "B". */
  nafn: string;
  medlimir: VaktMedlimur[];
};
