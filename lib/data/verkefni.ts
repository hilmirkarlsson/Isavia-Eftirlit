// Verkefni eftirlits á Keflavíkurflugvelli, flokkuð eftir klukkustund.
//
// ATH: Þetta eru sýnigögn (placeholder) sem byggð eru á dæmigerðum
// eftirlitsverkefnum. Breytið textanum, þrepunum og tímunum svo þau
// passi við raunverulegar verklagsreglur deildarinnar.

export type VerkefniStep = {
  id: string;
  text: string;
};

export type Verkefni = {
  id: string;
  titill: string;
  /** Klukkustundir sólarhringsins (0-23) sem verkefnið á að framkvæmast á. */
  klukkustundir: number[];
  /** Stutt lýsing sem birtist í listanum. */
  samantekt: string;
  /** Ítarlegri lýsing á því um hvað verkefnið snýst. */
  lysing: string;
  /** Þrep sem hægt er að haka við. */
  threp: VerkefniStep[];
  /** Forgangur – hefur áhrif á lit merkis. */
  forgangur: "hár" | "midlungs" | "lagur";
};

const allarKlst = Array.from({ length: 24 }, (_, i) => i);
const dagvakt = Array.from({ length: 18 }, (_, i) => i + 6); // 06-23

export const VERKEFNI: Verkefni[] = [
  {
    id: "fod-ganga",
    titill: "FOD ganga á flughlaði",
    klukkustundir: allarKlst,
    samantekt: "Skoða flughlað fyrir lausamuni (FOD) og fjarlægja.",
    lysing:
      "Foreign Object Debris (FOD) ganga. Gengið er skipulega um flughlað og leitað að lausamunum sem geta valdið tjóni á loftförum, hreyflum eða valdið slysi. Allt sem finnst er fjarlægt og skráð ef um endurtekið vandamál er að ræða.",
    threp: [
      { id: "1", text: "Klæðast endurskinsvesti og heyrnarhlíf" },
      { id: "2", text: "Ganga skipulega eftir merktum FOD-leiðum" },
      { id: "3", text: "Fjarlægja lausamuni og setja í FOD-box" },
      { id: "4", text: "Skoða svæði við hreyfla og hjólastæði sérstaklega" },
      { id: "5", text: "Skrá frávik ef við á" },
    ],
    forgangur: "hár",
  },
  {
    id: "brautareftirlit",
    titill: "Brautareftirlit (Runway inspection)",
    klukkustundir: [0, 6, 12, 18],
    samantekt: "Aksturseftirlit á flugbrautum og akstursbrautum.",
    lysing:
      "Reglubundið eftirlit með flugbrautum og akstursbrautum. Athugað er ástand yfirborðs, merkinga, ljósa og hvort lausamunir, fuglar eða dýr séu á svæðinu. Tilkynna þarf til flugturns áður en farið er inn á virkt svæði.",
    threp: [
      { id: "1", text: "Fá heimild frá flugturni (Tower) fyrir akstur inn á braut" },
      { id: "2", text: "Skoða yfirborð brautar fyrir skemmdir og lausamuni" },
      { id: "3", text: "Athuga ástand brautarljósa og merkinga" },
      { id: "4", text: "Kanna bremsuskilyrði / hálku ef við á" },
      { id: "5", text: "Tilkynna niðurstöðu og rýma braut" },
    ],
    forgangur: "hár",
  },
  {
    id: "dma-eftirlit",
    titill: "Eftirlit með DMA stæðum",
    klukkustundir: dagvakt,
    samantekt: "Yfirfara hvort DMA stæði séu hrein og tilbúin.",
    lysing:
      "Farið er yfir DMA stæðin og staðfest hvort þau séu hrein og laus við lausamuni, olíu eða annað. Uppfærið stöðu hvers stæðis í DMA flipanum (hreint / óhreint) eftir skoðun.",
    threp: [
      { id: "1", text: "Ganga um öll virk DMA stæði" },
      { id: "2", text: "Skoða yfirborð fyrir olíu, lausamuni og rusl" },
      { id: "3", text: "Uppfæra stöðu stæðis í DMA flipa" },
      { id: "4", text: "Boða þrif ef stæði er óhreint" },
    ],
    forgangur: "midlungs",
  },
  {
    id: "sudur-hlid",
    titill: "Yfirferð á Suður – hlið og Schengen",
    klukkustundir: dagvakt,
    samantekt: "Staðfesta uppstillingu hliða fyrir Schengen / non-Schengen.",
    lysing:
      "Yfirferð á suðurbyggingu. Staðfesta þarf hvaða hlið þarf að 'snúa' (turn around) milli Schengen og non-Schengen eftir áætlun. Uppfærið stöðu hliðanna í Suður flipanum og gætið þess að hurðir og rútur séu rétt stilltar.",
    threp: [
      { id: "1", text: "Bera saman áætlun og núverandi uppstillingu hliða" },
      { id: "2", text: "Auðkenna hlið sem þarf að snúa milli Schengen/non-Schengen" },
      { id: "3", text: "Staðfesta að hurðir/rennihurðir séu rétt stilltar" },
      { id: "4", text: "Uppfæra stöðu hvers hliðs í Suður flipa" },
      { id: "5", text: "Láta vita ef tafir verða á uppstillingu" },
    ],
    forgangur: "hár",
  },
  {
    id: "oryggishlid",
    titill: "Eftirlit með öryggishliðum",
    klukkustundir: [7, 10, 13, 16, 19, 22],
    samantekt: "Skoða aðgangshlið og öryggisgirðingu.",
    lysing:
      "Eftirlit með öryggishliðum og girðingu umhverfis haftasvæði. Athuga hvort hlið séu læst, óskemmd og hvort merki séu um óheimilan aðgang.",
    threp: [
      { id: "1", text: "Aka/ganga meðfram öryggisgirðingu" },
      { id: "2", text: "Staðfesta að öll hlið séu læst og óskemmd" },
      { id: "3", text: "Athuga myndavélar og lýsingu" },
      { id: "4", text: "Skrá og tilkynna frávik strax" },
    ],
    forgangur: "midlungs",
  },
  {
    id: "fuglavarnir",
    titill: "Fuglavarnir / wildlife eftirlit",
    klukkustundir: [5, 9, 14, 20],
    samantekt: "Fylgjast með fuglum og dýrum nærri brautum.",
    lysing:
      "Vakta fuglalíf og dýr á og við flugbrautir. Beita fælingaraðgerðum ef þörf krefur og tilkynna flugturni um virkni sem getur haft áhrif á flugumferð.",
    threp: [
      { id: "1", text: "Skima svæði nærri brautum fyrir fugla/dýr" },
      { id: "2", text: "Beita fælingu ef þörf er á" },
      { id: "3", text: "Tilkynna flugturni um virkni" },
      { id: "4", text: "Skrá tegund og fjölda" },
    ],
    forgangur: "lagur",
  },
  {
    id: "vaktaskipti",
    titill: "Vaktaskipti og skýrsla",
    klukkustundir: [7, 15, 23],
    samantekt: "Afhenda vakt, fara yfir frávik og opin verkefni.",
    lysing:
      "Við vaktaskipti er farið yfir stöðu opinna verkefna, frávik vaktarinnar og sérstök atriði sem næsta vakt þarf að vita af. Gengið er frá skráningu og búnaði.",
    threp: [
      { id: "1", text: "Fara yfir opin verkefni og frávik dagsins" },
      { id: "2", text: "Afhenda talstöð og búnað" },
      { id: "3", text: "Skrá samantekt vaktar" },
      { id: "4", text: "Staðfesta næstu verkefni við næstu vakt" },
    ],
    forgangur: "midlungs",
  },
];

/** Skilar verkefnum sem eiga við tiltekna klukkustund (0-23). */
export function verkefniFyrirKlst(klst: number): Verkefni[] {
  return VERKEFNI.filter((v) => v.klukkustundir.includes(klst));
}
