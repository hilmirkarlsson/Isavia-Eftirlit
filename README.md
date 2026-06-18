# Eftirlit KEF

Vaktatól fyrir eftirlit á Keflavíkurflugvelli. Hannað fyrir síma og
spjaldtölvur sem starfsfólk notar á vaktinni. Smelliskil og stór
smellisvæði henta vel á snertiskjái.

## Eiginleikar

Forritið er með fjóra flipa neðst á skjánum:

### 1. Verkefni

- Verkefni vaktarinnar flokkuð eftir **klukkustund** — flettið milli
  klukkustunda eða smellið á **„Fara á núna“**.
- Smellið á verkefni til að sjá **lýsingu** á því um hvað það snýst.
- Hvert verkefni hefur **þrep með hökum** (toggle) sem hægt er að merkja
  við jafnóðum. Framvindan birtist sem hringur (t.d. 3/5) og verkefnið
  merkist „Lokið“ þegar öll þrep eru kláruð.
- Hökuð þrep **núllstillast sjálfkrafa á nýjum degi**.

### 2. DMA

- Yfirlit yfir **DMA stæði** flokkuð eftir svæði.
- Smellið á stæði til að skipta milli **hreint** (grænt) og **óhreint**
  (rautt). Talning efst sýnir heildarstöðu.

### 3. Suður

- **Hlið í suðurbyggingu** og staða þeirra: **Schengen**, **non-Schengen**
  eða **„verið að snúa“** (turn around).
- Smellið á hlið til að skipta um stöðu. Hlið merkt ↻ er **snúanleg**
  milli Schengen og non-Schengen; föst hlið skipta aðeins milli Schengen
  og non-Schengen.

### 4. Flug (FIDS)

- **Rauntíma flugupplýsingar** Keflavíkurflugvallar — komur og brottfarir.
- Leit eftir flugnúmeri, borg eða flugfélagi. Uppfærist sjálfkrafa á
  mínútu fresti.
- Gögnin eru sótt í gegnum milliþjón (`/api/fids`) til að komast hjá
  CORS-takmörkunum. **Náist ekki í rauntímagögn eru sýnigögn birt** og
  borði birtist sem segir frá því.

## Keyrsla

```bash
npm install
npm run dev      # þróun á http://localhost:3000
```

Framleiðsla:

```bash
npm run build
npm run start
```

## FIDS gögn

`/api/fids` sækir gögnin frá kefairport.is og normaliserar þau. Þar sem
nákvæmt snið FIDS getur breyst er lesturinn **sveigjanlegur** og slóðin
er stillanleg með umhverfisbreytunni `FIDS_URL` (sjá `.env.example`).
Þegar forritið keyrir í umhverfi með netaðgang að vellinum birtast
rauntímaflug sjálfkrafa; annars eru sýnigögn notuð svo allt virki áfram.

## Gögn sem þarf að aðlaga

Eftirfarandi eru **sýnigögn** sem á að aðlaga að raunverulegum
verklagsreglum og uppsetningu vallarins:

- `lib/data/verkefni.ts` — verkefni, þrep og á hvaða klukkustundum þau eru.
- `lib/data/dma.ts` — listi DMA stæða og svæða.
- `lib/data/sudur.ts` — hlið suðurbyggingar og hvaða hlið eru snúanleg.

Staða (hökuð þrep, DMA staða, Suður staða) er geymd í vafranum
(`localStorage`) svo enginn gagnagrunnur er nauðsynlegur.

## Tækni

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS.
