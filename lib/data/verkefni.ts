// Verkefni eftirlits – dag- og næturvakt. Heiti og tímar eru tekin beint
// úr verkefnalista deildarinnar (KEF). Lýsingar og þrep eru bráðabirgða
// og verða uppfærð þegar hvert verkefni er útskýrt nánar.

export type VerkefniVakt = "dagur" | "nott";

export type VerkefniStep = {
  id: string;
  text: string;
  /** Kafli/svæði sem þrepið tilheyrir (t.d. Landside) – notað fyrir hausa í löngum gátlistum. */
  section?: string;
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
// ekki almennu ferli.
function threp(...textar: string[]): VerkefniStep[] {
  return textar.map((text, i) => ({ id: String(i + 1), text }));
}

// Eins og threp() en með köflum: hver lykill er svæðisheiti og gildið er
// listi þrepa á því svæði. Þrep fá áfram raðnúmer 1..n í réttri röð svæða
// (svo hökun sem geymd er eftir t.id haldist stöðug), og bera section-merkið.
function threpKaflar(kaflar: Record<string, string[]>): VerkefniStep[] {
  let n = 0;
  return Object.entries(kaflar).flatMap(([section, textar]) =>
    textar.map((text) => ({ id: String(++n), text, section }))
  );
}

// Raunverulegir eftirlitsstaðir hringjanna, fengnir úr verkefnalista
// deildarinnar (2026-07-06). Hvert atriði er "Heiti #númer — staðsetning".
const THREP_LITLI_HRINGUR = () =>
  threp(
    "Hlið 3 #2753 — Hlið 3 við inngang flugvirkja ITS",
    "Bronshlið hlið #4996",
    "Airport Associates #12175 — 2. hæð CSRA",
    "Airport Associates #12168 — 3. hæð CSRA",
    "Airport Associates #12072 — Kaffistofa 2. hæð CSRA",
    "APA Snúningshlið og girðingareftirlit",
    "Gamla Gullnahlið - Snúningshlið — ATH Virkni",
    "Gullna hlið - Snúningshlið — ATH Virkni",
    "Neyðarstigi töskusalur #4922 — Neyðarstigi vestan við FLE við töskusal",
    "Töskusalur — Eftirlit inn í töskuflokkunarsal",
    "Hurð 16 #9550 — Gamla Offload",
    "Hurð 17 #2727 — Gamla Offload",
    "Hurð 18 #2719 — Gamla Offload",
    "Neyðarstigi #187 2924/2933 — Neyðarstigi austan við FLE",
    "Gönguhurð #2598 — Gönguhurð við neyðarstiga austan megin",
    "Koparhlið #4909",
    "Eftirlit með farangri, farmi og öðru sem fer um svæðið"
  );

const THREP_STORI_HRINGUR = () =>
  threp(
    "Nýja Neyðarhlið 12B - #2755 — Lás 37",
    "Neyðarhlið 12 #4950 — Lás 31",
    "Neyðarhlið 14 #2647 — Lás 3",
    "Við slökkvistöð #1824907 — Lás 29",
    "Silfurhlið Snúningshlið — ATH Virkni",
    "Neyðarhlið 19 #2728 — Lás 41",
    "Neyðarhlið 20 #2739 — Lás 24",
    "Neyðarhlið 21 #2772 — Lás 23",
    "Neyðarhlið 23 #2590 — Lás 16",
    "Efnishólf 1 #2670 — Efnishólfið er landside - Lás 22",
    "Efnishólf 2 #2667 — Efnishólfið er landside - Lás 7",
    "Malbikunarstöð #4899 — Malbikunarstöðin er Landside - Lás 27",
    "Neyðarhlið 25 #2905 — Lás 6",
    "Neyðarhlið 1 #2724 — Lás 1"
  );

const THREP_YTRI_MORK = () =>
  threp(
    "APA úti norður #12051 — Landside APA aðstaða",
    "APA úti norður #2661 — Landside APA Vöruhús",
    "APA úti norður #2619 — Landside APA Vöruhús",
    "APA úti norður #2639 — Landside APA Vöruhús",
    "APA úti norður #2680 — Landside APA Vöruhús",
    "APA úti norður #2675 — Landside APA Vöruhús",
    "APA úti norður #2636 — Landside APA Vöruhús",
    "APA úti norður #2655 — Landside APA Vöruhús",
    "Neyðarhlið 11B #2639",
    "Girðingaeftirlit frá Koparhliði að hliði 12B — Tekið er eftirlit frá Koparhliði Landside og alveg meðfram girðingu á malbikuðum vegi, eins langt og maður kemst."
  );

const THREP_STARFSM_BILAR = () =>
  threp(
    "Velja starfsmenn og bíla af handahófi til skoðunar",
    "Sannreyna aðgangskort og heimildir starfsmanna",
    "Skoða bíla – merkingar, leyfi og innihald",
    "Skrá fjölda skoðana og frávik ef við á"
  );

// "Innsigli ytri aðilar" er göngueftirlit með innsiglum/hurðum hjá ytri
// aðilum (flugskýli, Fálkavellir, IGS Cargo o.fl.) – EKKI sama og
// "Eftirlit hjá ytri aðilum" eyðublaðið (skráning flugverndarstarfsmanna),
// sjá THREP_ETD o.s.frv. fyrir neðan og components/YtriAdilarForm.tsx.
const THREP_INNSIGLI_YTRI_ADILAR = () =>
  threp(
    "Flugskýli #32999 — 1. hæð Gluggi/Neyðarútgangur",
    "Flugskýli #1049 — 2. hæð Gluggi/neyðarútgangur",
    "Flugskýli #1050 — 2. hæð Neyðarútgangur",
    "Flugskýli hurð 1.hæð #12136",
    "Line-Crossing í Gullnahliði",
    "Fálkavellir anddyri #1161 — 1. hæð anddyri landside",
    "Fálkavellir Lyfta — Athuga virkni á lyftu Lyklabox 1200",
    "Fálkavellir svalahurð norðaustur #12109 — 2. hæð",
    "Fálkavellir Svalahurð #1155 — 2. hæð svalahurð suð-austur Bergvík",
    "Fálkavellir Útihurð #1279 — 2. hæð suður",
    "Fálkavellir Gluggi #679 — 2. hæð Gluggi fyrir ofan suður útihurð",
    "Fálkavellir bílaplan #12090 — 1. hæð Bílaplan norður",
    "IGS Cargo #12096 — Gönguhurð Vestur Airside innsigli 9521",
    "IGS Cargo vopnaleit #3028 — Landside 1. hæð inn ganginn að vopnaleit",
    "IGS Cargo #3027 — 2. hæð Landside - Innsigli airside 1120",
    "IGS Cargo #1491 — 2. hæð Landside",
    "IGS Cargo #3026 — 2. hæð Landside",
    "Line-Crossing í Silfurhliði"
  );

// "Innsigli FLE" nær yfir alla flugstöðina (FLE) – þrjú svæði: Landside,
// Norður og East Wing. Sameinað í einn gátlista með svæðismerkingu fremst
// á hverju atriði, þar sem hringferðin er ein heild í dagskránni.
const THREP_INNSIGLI_FLE = () =>
  threpKaflar({
    Landside: [
      "Lyftuhurð VIP — A2-131 VIP lyfta",
      "Við innritunarborð 11 #2389 — 1. hæð landside A1-116",
      "Kaffistofa Tolls í kjallara #2769 — Kjallari við innritunarborð 1",
      "Lyftuhurð - Lyfta B2",
      "Lyfta B4 Tollagangi — 1. hæð landside B2-136",
      "East Wing #12187 — 1. hæð landside TC.10.CD070 2A/B gangur óskilamuna",
      "Tollasalur East Wing #12046/12047 — 1. hæð landside Vantar CEM númer",
      "Tollasalur East Wing #22004/12195 — Neyðarútgangur við Elko vantar CEM númer",
      "Neyðarhurð inn í Akureyrarlúgu #12100 — 1. hæð landside A3-U108",
      "Hurð hæ megin við AEY lúgu #33001",
      "Skrifstofa Tollstjóra #2956 — 3. hæð landside B1-315",
      "Lyftuhurð við mötuneyti — 3. hæð landside B2-336",
      "Mötuneytið #2722 — 3. hæð landside B2-333",
      "Stigagangur #2411 — 2. hæð landside B1-203 Innsigli 8494 airside",
      "Kjallari fyrir neðan Parking #12151 — Kjallari stigagangur B1",
      "Icelandair/Delta skrifstofa (Gamla WOW) #12150 — Kjallari norður A1",
      "Icelandair/Delta skrifstofa (Gamla WOW) #12172",
      "Stigagangur A skrifstofa IGS #12149 — Stigagangur A kjallari (A1-001)",
      "Stigagangur A #12133",
    ],
    Norður: [
      "Nýbygging vestur #12032 — 1. hæð norður A4-U111",
      "Neyðarhurð móti búningsherbergi #12038 — 1. hæð norður A4-U121",
      "Inní ruslageymslu #21999 — 1. hæð norður A4-U118",
      "Inní ruslageymslu #21998 — 1. hæð norður A4-U118",
      "Gangur frá starfsmannahliði #12034 — 1. hæð norður A4-U119",
      "Gangur frá starfsmannahliði #12111 — 1. hæð norður A4-U120",
      "Við Level 3 #9041 — 1. hæð norður A2-152",
      "Færibandasalur #12178 — A2-161",
      "Færibandasalur #2911 — 1. hæð norður Inn hjá Level 3",
      "Stigahús #2385/2386 — 1. hæð norður A2-141",
      "Þriðja hæð í stigagangi #2405 — 3. hæð norður A2-Læst hurð",
      "Skrifstofa ISAVIA #2699 — 3. hæð norður A2-340",
      "Inn í Reykherbergi #2429/2430 — 2. hæð norður A3-283.2/3",
      "Við Reykherbergi #9774 — 2. hæð norður A3-284",
      "Neyðarhurð við 66 Norður #4894 — 2. hæð norður A3-285",
      "C200 #9527 — 1. hæð norður C2-U101 við C200 lás nr. 39 á hurð",
      "Point verslun neyðarhurð #2902 — 2. hæð norður B3-266",
      "3 Hæð East Wing #12104",
      "Hæð East Wing #12049",
      "East Wing Mathöll #12105 — 2. hæð East Wing Iðnaðarsvæði milli Mathöll og reyksvæði farþega",
      "Inni í reykherbergi #2756/2752 — 2. hæð norður B3-265/3",
      "Þriðja hæð í stigagangi #9071 — 3. hæð norður B2-Læst hurð",
      "Stigahús við staffaslússu #12181",
      "Athuga virkni lyftu 2.hæð norður B2 bak við verslanir — Fyrir ofan Starfsmannaslússu, á ekki að opnast á 1. hæð",
      "Glerhurðir í vopnaleitarsal #2738 — 2. hæð norður B1-205",
      "Glerhurðir í vopnaleitarsal #2745 — 2. hæð norður A1-226",
      "Skimun #12198 — 2. hæð norður A1-204 Inn í remote skimun",
      "Kaffistofa vopnaleit #1824804 — 2. hæð norður A1-2XX Innsigli 1154 landside megin",
    ],
    "East Wing": [
      "Gangur East Wing #33000 — Á móti vörulyftu",
      "Gangur East Wing #12055 — Á móti vörulyftu",
      "Krossviðsplata á lyftuopi #12155/12154",
      "Hurð við lyftuop #12131",
      "Spónarplötur/Lyftuop #2720 — Kjallari TCS1.CG67.1A Flugverndarlás 25",
      "Hringstigi #22002 — Kjallari TC00.CG70.1-A, innsigli fyrir innan #1390",
      "Dog House 1 #12114 — Kjallari",
      "Dog House 2 #12179/12115 — Kjallari",
      "Dog House 3 #12113 — Kjallari",
      "Neyðarútgangur Austur #12180 — Kjallari TCS1.CA66.1-A",
      "Iðnaðarhurð #1872742 — Kjallari TCS1.CA66.1-B Flugverndarlás 2",
      "Dog House 4 #12116 — Kjallari",
    ],
  });

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
    timi: "06:30",
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
    timi: "12:30",
    vakt: "dagur",
    samantekt: "Innsiglaeftirlit hjá ytri aðilum – flugskýli, Fálkavellir, IGS Cargo (dagvakt).",
    lysing:
      "Göngueftirlit með innsiglum og hurðum/gluggum hjá ytri aðilum (flugskýli, Fálkavellir, IGS Cargo, line-crossing). Ekki sama og Eftirlit hjá ytri aðilum-eyðublaðið kl. 05:30.",
    threp: THREP_INNSIGLI_YTRI_ADILAR(),
  },
  {
    id: "stori-hringur-1",
    titill: "Stóri hringur (1)",
    timi: "08:30",
    vakt: "dagur",
    samantekt: "Stóri eftirlitshringurinn – fyrsta ferð.",
    lysing: "Stóri hringur (1). Lýsing uppfærist síðar.",
    threp: THREP_STORI_HRINGUR(),
  },
  {
    id: "starfsm-bilar-1",
    titill: "Starfsm- og bílar (1)",
    timi: "05:30",
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
    timi: "16:30",
    vakt: "dagur",
    samantekt: "Stóri eftirlitshringurinn – önnur ferð.",
    lysing: "Stóri hringur (2). Lýsing uppfærist síðar.",
    threp: THREP_STORI_HRINGUR(),
  },
  {
    id: "starfsm-bilar-2",
    titill: "Starfsm- og bílar (2)",
    timi: "13:30",
    vakt: "dagur",
    samantekt: "Eftirlit með starfsmönnum og bílum – önnur ferð.",
    lysing: "Starfsm- og bílar (2). Lýsing uppfærist síðar.",
    threp: THREP_STARFSM_BILAR(),
  },
  {
    id: "innsigli-fle-d",
    titill: "Innsigli FLE (d)",
    timi: "07:30",
    vakt: "dagur",
    samantekt: "Yfirferð á innsiglum í flugstöðinni – Landside, Norður og East Wing (dagvakt).",
    lysing: "Innsiglaeftirlit um alla flugstöðina: Landside, Norður og East Wing.",
    threp: THREP_INNSIGLI_FLE(),
  },
  {
    id: "ytri-mork-2",
    titill: "Ytri Mörk (2)",
    timi: "15:30",
    vakt: "dagur",
    samantekt: "Eftirlit með ytri mörkum – önnur ferð.",
    lysing: "Ytri mörk (2). Lýsing uppfærist síðar.",
    threp: THREP_YTRI_MORK(),
  },

  // ---------------- NÆTURVAKT ----------------
  // Röð og tímar úr skipulagi dagsins fyrir næturvakt E (14.07.2026).
  {
    id: "ytri-mork-3",
    titill: "Ytri Mörk (3)",
    timi: "17:30",
    vakt: "nott",
    samantekt: "Eftirlit með ytri mörkum – þriðja ferð.",
    lysing: "Ytri mörk (3). Lýsing uppfærist síðar.",
    threp: THREP_YTRI_MORK(),
  },
  {
    id: "starfsm-bilar-3",
    titill: "Starfsm- og bílar (3)",
    timi: "18:30",
    vakt: "nott",
    samantekt: "Eftirlit með starfsmönnum og bílum – þriðja ferð.",
    lysing: "Starfsm- og bílar (3). Lýsing uppfærist síðar.",
    threp: THREP_STARFSM_BILAR(),
  },
  {
    id: "litli-hringur-3",
    titill: "Litli hringur (3)",
    timi: "19:30",
    vakt: "nott",
    samantekt: "Litli eftirlitshringurinn – þriðja ferð.",
    lysing: "Litli hringur (3). Lýsing uppfærist síðar.",
    threp: THREP_LITLI_HRINGUR(),
  },
  {
    id: "innsigli-ytri-adilar-n",
    titill: "Innsigli ytri aðilar (n)",
    timi: "20:30",
    vakt: "nott",
    samantekt: "Innsiglaeftirlit hjá ytri aðilum – flugskýli, Fálkavellir, IGS Cargo (næturvakt).",
    lysing:
      "Göngueftirlit með innsiglum og hurðum/gluggum hjá ytri aðilum (flugskýli, Fálkavellir, IGS Cargo, line-crossing). Ekki sama og Eftirlit hjá ytri aðilum-eyðublaðið.",
    threp: THREP_INNSIGLI_YTRI_ADILAR(),
  },
  {
    id: "innsigli-fle-n",
    titill: "Innsigli FLE (n)",
    timi: "21:30",
    vakt: "nott",
    samantekt: "Yfirferð á innsiglum í flugstöðinni – Landside, Norður og East Wing (næturvakt).",
    lysing: "Innsiglaeftirlit um alla flugstöðina: Landside, Norður og East Wing.",
    threp: THREP_INNSIGLI_FLE(),
  },
  {
    id: "stori-hringur-3",
    titill: "Stóri hringur (3)",
    timi: "22:30",
    vakt: "nott",
    samantekt: "Stóri eftirlitshringurinn – þriðja ferð.",
    lysing: "Stóri hringur (3). Lýsing uppfærist síðar.",
    threp: THREP_STORI_HRINGUR(),
  },
  {
    id: "stori-hringur-4",
    titill: "Stóri hringur (4)",
    timi: "23:30",
    vakt: "nott",
    samantekt: "Stóri eftirlitshringurinn – fjórða ferð.",
    lysing: "Stóri hringur (4). Lýsing uppfærist síðar.",
    threp: THREP_STORI_HRINGUR(),
  },
  {
    id: "litli-hringur-4",
    titill: "Litli hringur (4)",
    timi: "02:30",
    vakt: "nott",
    samantekt: "Litli eftirlitshringurinn – fjórða ferð.",
    lysing: "Litli hringur (4). Lýsing uppfærist síðar.",
    threp: THREP_LITLI_HRINGUR(),
  },
  {
    id: "ytri-mork-4",
    titill: "Ytri mörk (4)",
    timi: "03:30",
    vakt: "nott",
    samantekt: "Eftirlit með ytri mörkum – fjórða ferð.",
    lysing: "Ytri mörk (4). Lýsing uppfærist síðar.",
    threp: THREP_YTRI_MORK(),
  },
  {
    id: "starfsm-bilar-4",
    titill: "Starfsm- og bílar (4)",
    timi: "04:30",
    vakt: "nott",
    samantekt: "Eftirlit með starfsmönnum og bílum – fjórða ferð.",
    lysing: "Starfsm- og bílar (4). Lýsing uppfærist síðar.",
    threp: THREP_STARFSM_BILAR(),
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

/**
 * Er verkefnið komið fram yfir tíma? Aðeins átt við meðan vaktin sem
 * verkefnið tilheyrir er í raun í gangi núna (sama rök og næturvakt sem fer
 * yfir miðnætti í verkefniFyrirVakt/virkurTimaVisirFyrir).
 */
export function verkefniYfirTima(v: Verkefni, now = new Date()): boolean {
  if (vaktFyrirKlst(now.getHours()) !== v.vakt) return false;
  const nott = v.vakt === "nott";
  const radgildi = (h: number, m: number) => {
    const mins = h * 60 + m;
    return !nott || mins >= 17 * 60 ? mins : mins + 24 * 60;
  };
  const [h, m] = v.timi.split(":").map(Number);
  return radgildi(h, m) < radgildi(now.getHours(), now.getMinutes());
}
