// Verkefni eftirlits – dag- og næturvakt. Heiti og tímar eru tekin beint
// úr verkefnalista deildarinnar (KEF). Lýsingar og þrep eru bráðabirgða
// og verða uppfærð þegar hvert verkefni er útskýrt nánar.

export type VerkefniVakt = "dagur" | "nott";

export type VerkefniStep = {
  id: string;
  text: string;
};

export type Verkefni = {
  id: string;
  titill: string;
  /** Tími verkefnis á forminu "HH:MM". */
  timi: string;
  vakt: VerkefniVakt;
  samantekt: string;
  lysing: string;
  threp: VerkefniStep[];
  /** Ef sett, opnar verkefnið sérstakt eyðublað í stað venjulegra þrepa. */
  eydublad?: "ytri-adilar";
};

// Þrep sniðin að hverju verkefni – lýsa því sem verkefnið raunverulega er,
// ekki almennu ferli. ATH: Drög – leiðréttast þegar raunveruleg verklýsing
// hvers verkefnis liggur fyrir.
function threp(...textar: string[]): VerkefniStep[] {
  return textar.map((text, i) => ({ id: String(i + 1), text }));
}

const THREP_STORI_HRINGUR = () =>
  threp(
    "Aka stóra eftirlitshringinn og skoða girðingar og hlið á leiðinni",
    "Athuga að hlið séu læst og innsigli óhreyfð",
    "Fylgjast með óvenjulegri umferð eða mannaferðum á svæðinu",
    "Skrá frávik og tilkynna vaktstjóra ef við á"
  );

const THREP_LITLI_HRINGUR = () =>
  threp(
    "Aka litla eftirlitshringinn",
    "Athuga hlið og aðgangsstaði á leiðinni",
    "Skrá frávik og tilkynna vaktstjóra ef við á"
  );

const THREP_YTRI_MORK = () =>
  threp(
    "Aka meðfram ytri mörkum vallarins",
    "Skoða girðingar – göt, skemmdir eða ummerki um inngöngu",
    "Athuga læsingar á hliðum ytri marka",
    "Skrá frávik og staðsetningu skemmda ef við á"
  );

const THREP_STARFSM_BILAR = () =>
  threp(
    "Velja starfsmenn og bíla af handahófi til skoðunar",
    "Sannreyna aðgangskort og heimildir starfsmanna",
    "Skoða bíla – merkingar, leyfi og innihald",
    "Skrá fjölda skoðana og frávik ef við á"
  );

const THREP_INNSIGLI = (svaedi: string) =>
  threp(
    `Fara yfir innsigli ${svaedi}`,
    "Bera innsigli saman við skráningu",
    "Skrá frávik og tilkynna vaktstjóra ef innsigli er rofið eða skemmt"
  );

const THREP_ETD = () =>
  threp(
    "Kvarða ETD tæki samkvæmt leiðbeiningum",
    "Skrá niðurstöður kvörðunar",
    "Tilkynna vaktstjóra ef tæki stenst ekki kvörðun"
  );

const THREP_APA = () =>
  threp(
    "Fylgjast með framkvæmd starfsmannaleitar í APA",
    "Sannreyna að verklagi sé fylgt",
    "Skrá frávik ef við á"
  );

export const VERKEFNI: Verkefni[] = [
  // ---------------- DAGVAKT ----------------
  {
    id: "eftirlit-ytri-adilum",
    titill: "Eftirlit hjá ytri aðilum",
    timi: "05:30",
    vakt: "dagur",
    samantekt: "Eftirlit með flugverndarstarfsmönnum ytri aðila.",
    lysing:
      "Eftirlit hjá ytri aðilum. Opnar Ytri aðilar eyðublaðið með skráningu og uppflettingu leyfa.",
    threp: [],
    eydublad: "ytri-adilar",
  },
  {
    id: "innsigli-ytri-adilar-d",
    titill: "Innsigli ytri aðilar (d)",
    timi: "06:30",
    vakt: "dagur",
    samantekt: "Yfirferð á innsiglum hjá ytri aðilum (dagvakt).",
    lysing: "Innsigli ytri aðilar (dagvakt). Lýsing uppfærist síðar.",
    threp: THREP_INNSIGLI("hjá ytri aðilum"),
    eydublad: "ytri-adilar",
  },
  {
    id: "stori-hringur-1",
    titill: "Stóri hringur (1)",
    timi: "07:30",
    vakt: "dagur",
    samantekt: "Stóri eftirlitshringurinn – fyrsta ferð.",
    lysing: "Stóri hringur (1). Lýsing uppfærist síðar.",
    threp: THREP_STORI_HRINGUR(),
  },
  {
    id: "starfsm-bilar-1",
    titill: "Starfsm- og bílar (1)",
    timi: "08:30",
    vakt: "dagur",
    samantekt: "Eftirlit með starfsmönnum og bílum – fyrsta ferð.",
    lysing: "Starfsm- og bílar (1). Lýsing uppfærist síðar.",
    threp: THREP_STARFSM_BILAR(),
  },
  {
    id: "ytri-mork-1",
    titill: "Ytri mörk (1)",
    timi: "09:30",
    vakt: "dagur",
    samantekt: "Eftirlit með ytri mörkum – fyrsta ferð.",
    lysing: "Ytri mörk (1). Lýsing uppfærist síðar.",
    threp: THREP_YTRI_MORK(),
  },
  {
    id: "etd-calibration",
    titill: "ETD Calibration",
    timi: "10:00",
    vakt: "dagur",
    samantekt: "Kvörðun ETD búnaðar (sprengiefnaleit).",
    lysing: "ETD Calibration. Lýsing uppfærist síðar.",
    threp: THREP_ETD(),
  },
  {
    id: "litli-hringur-1",
    titill: "Litli hringur (1)",
    timi: "10:30",
    vakt: "dagur",
    samantekt: "Litli eftirlitshringurinn – fyrsta ferð.",
    lysing: "Litli hringur (1). Lýsing uppfærist síðar.",
    threp: THREP_LITLI_HRINGUR(),
  },
  {
    id: "apa-starfsmannaleit",
    titill: "Eftirlit í APA starfsmannaleit 13:00",
    timi: "11:00",
    vakt: "dagur",
    samantekt: "Eftirlit í APA starfsmannaleit (kl. 13:00).",
    lysing: "Eftirlit í APA starfsmannaleit 13:00. Lýsing uppfærist síðar.",
    threp: THREP_APA(),
  },
  {
    id: "litli-hringur-2",
    titill: "Litli Hringur (2)",
    timi: "11:30",
    vakt: "dagur",
    samantekt: "Litli eftirlitshringurinn – önnur ferð.",
    lysing: "Litli hringur (2). Lýsing uppfærist síðar.",
    threp: THREP_LITLI_HRINGUR(),
  },
  {
    id: "stori-hringur-2",
    titill: "Stóri hringur (2)",
    timi: "12:30",
    vakt: "dagur",
    samantekt: "Stóri eftirlitshringurinn – önnur ferð.",
    lysing: "Stóri hringur (2). Lýsing uppfærist síðar.",
    threp: THREP_STORI_HRINGUR(),
  },
  {
    id: "starfsm-bilar-2",
    titill: "Starfsm- og bílar (2)",
    timi: "14:30",
    vakt: "dagur",
    samantekt: "Eftirlit með starfsmönnum og bílum – önnur ferð.",
    lysing: "Starfsm- og bílar (2). Lýsing uppfærist síðar.",
    threp: THREP_STARFSM_BILAR(),
  },
  {
    id: "innsigli-fle-d",
    titill: "Innsigli FLE (d)",
    timi: "15:30",
    vakt: "dagur",
    samantekt: "Yfirferð á FLE innsiglum (dagvakt).",
    lysing: "Innsigli FLE (dagvakt). Lýsing uppfærist síðar.",
    threp: THREP_INNSIGLI("á FLE svæðinu"),
  },
  {
    id: "ytri-mork-2",
    titill: "Ytri Mörk (2)",
    timi: "16:30",
    vakt: "dagur",
    samantekt: "Eftirlit með ytri mörkum – önnur ferð.",
    lysing: "Ytri mörk (2). Lýsing uppfærist síðar.",
    threp: THREP_YTRI_MORK(),
  },

  // ---------------- NÆTURVAKT ----------------
  {
    id: "innsigli-ytri-adilar-n",
    titill: "Innsigli ytri aðilar (n)",
    timi: "17:30",
    vakt: "nott",
    samantekt: "Yfirferð á innsiglum hjá ytri aðilum (næturvakt).",
    lysing: "Innsigli ytri aðilar (næturvakt). Lýsing uppfærist síðar.",
    threp: THREP_INNSIGLI("hjá ytri aðilum"),
    eydublad: "ytri-adilar",
  },
  {
    id: "stori-hringur-3",
    titill: "Stóri hringur (3)",
    timi: "18:30",
    vakt: "nott",
    samantekt: "Stóri eftirlitshringurinn – þriðja ferð.",
    lysing: "Stóri hringur (3). Lýsing uppfærist síðar.",
    threp: THREP_STORI_HRINGUR(),
  },
  {
    id: "ytri-mork-3",
    titill: "Ytri Mörk (3)",
    timi: "19:30",
    vakt: "nott",
    samantekt: "Eftirlit með ytri mörkum – þriðja ferð.",
    lysing: "Ytri mörk (3). Lýsing uppfærist síðar.",
    threp: THREP_YTRI_MORK(),
  },
  {
    id: "starfsm-bilar-3",
    titill: "Starfsm- og bílar (3)",
    timi: "21:30",
    vakt: "nott",
    samantekt: "Eftirlit með starfsmönnum og bílum – þriðja ferð.",
    lysing: "Starfsm- og bílar (3). Lýsing uppfærist síðar.",
    threp: THREP_STARFSM_BILAR(),
  },
  {
    id: "litli-hringur-3",
    titill: "Litli hringur (3)",
    timi: "22:30",
    vakt: "nott",
    samantekt: "Litli eftirlitshringurinn – þriðja ferð.",
    lysing: "Litli hringur (3). Lýsing uppfærist síðar.",
    threp: THREP_LITLI_HRINGUR(),
  },
  {
    id: "starfsm-bilar-4",
    titill: "Starfsm- og bílar (4)",
    timi: "23:30",
    vakt: "nott",
    samantekt: "Eftirlit með starfsmönnum og bílum – fjórða ferð.",
    lysing: "Starfsm- og bílar (4). Lýsing uppfærist síðar.",
    threp: THREP_STARFSM_BILAR(),
  },
  {
    id: "ytri-mork-4",
    titill: "Ytri mörk (4)",
    timi: "00:30",
    vakt: "nott",
    samantekt: "Eftirlit með ytri mörkum – fjórða ferð.",
    lysing: "Ytri mörk (4). Lýsing uppfærist síðar.",
    threp: THREP_YTRI_MORK(),
  },
  {
    id: "innsigli-fle-n",
    titill: "Innsigli FLE (n)",
    timi: "01:30",
    vakt: "nott",
    samantekt: "Yfirferð á FLE innsiglum (næturvakt).",
    lysing: "Innsigli FLE (næturvakt). Lýsing uppfærist síðar.",
    threp: THREP_INNSIGLI("á FLE svæðinu"),
  },
  {
    id: "stori-hringur-4",
    titill: "Stóri hringur (4)",
    timi: "02:30",
    vakt: "nott",
    samantekt: "Stóri eftirlitshringurinn – fjórða ferð.",
    lysing: "Stóri hringur (4). Lýsing uppfærist síðar.",
    threp: THREP_STORI_HRINGUR(),
  },
  {
    id: "litli-hringur-4",
    titill: "Litli hringur (4)",
    timi: "04:30",
    vakt: "nott",
    samantekt: "Litli eftirlitshringurinn – fjórða ferð.",
    lysing: "Litli hringur (4). Lýsing uppfærist síðar.",
    threp: THREP_LITLI_HRINGUR(),
  },
];

/** Skilar verkefnum fyrir tiltekna vakt, raðað eftir tíma (næturvakt fer yfir miðnætti). */
export function verkefniFyrirVakt(vakt: VerkefniVakt, listi: Verkefni[] = VERKEFNI): Verkefni[] {
  const v = listi.filter((x) => x.vakt === vakt);
  if (vakt === "dagur") {
    return v.slice().sort((a, b) => a.timi.localeCompare(b.timi));
  }
  // Næturvakt: 17:00–23:59 fyrst, svo 00:00–05:00.
  const radgildi = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const mins = h * 60 + m;
    return mins >= 17 * 60 ? mins : mins + 24 * 60;
  };
  return v.slice().sort((a, b) => radgildi(a.timi) - radgildi(b.timi));
}

/** Velur vakt út frá klukkustund: dagur 05–16, nótt annars. */
export function vaktFyrirKlst(klst = new Date().getHours()): VerkefniVakt {
  return klst >= 5 && klst < 17 ? "dagur" : "nott";
}

/** Verkefni sem eru í gangi á þessari klukkustund (sama klst og tími verkefnis). */
export function verkefniNuna(now = new Date()): Verkefni[] {
  const klst = now.getHours();
  return VERKEFNI.filter((v) => Number(v.timi.split(":")[0]) === klst);
}
