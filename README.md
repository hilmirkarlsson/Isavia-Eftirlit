# Eftirlit KEF

Vaktatól fyrir eftirlitsdeild á Keflavíkurflugvelli. Hannað fyrir síma og
spjaldtölvur sem starfsfólk notar á vaktinni (stór smellisvæði, snertivænt).

## Innskráning

Starfsfólk velur nafnið sitt af vaktalistanum (engin lykilorð). Hægt er að
skipta um notanda hvenær sem er af **Heim** skjánum. Vaktalistinn er í
`lib/data/starfsfolk.ts`.

## Flipar

### Heim
- Sýnir innskráðum notanda **hvar hann á að vera núna** (póstur úr
  SKIPULAG DAGSINS) og hvað kemur næst.
- **Verkefni á þessari klukkustund** með beinum tengli.
- **Mín staðsetning í dag** – allir tímarammar notandans.
- **Skipulag dagsins (allir)** – heildar vaktatafla sem hægt er að opna.

### Verkefni
- **Dagvakt / Næturvakt** rofi (☀️ / 🌙), valið sjálfkrafa eftir tíma.
- Hvert verkefni hefur **Start → Finish → lokið** stöðu og opnast með
  smelli til að sýna lýsingu og **þrep með hökum**.
- Verkefnin **Eftirlit hjá ytri aðilum** og **Innsigli ytri aðilar** opna
  sérstakt **Ytri aðilar** eyðublað (Skráning / Uppfletting leyfa).
- Heiti og tímar verkefna eru í `lib/data/verkefni.ts`. Lýsingar og þrep
  eru bráðabirgða og verða uppfærð þegar hvert verkefni er útskýrt nánar.

### DMA
- **Kort** af Háaleitishlaði með litaða reiti: **blátt = hreint/virkt**,
  **rautt = óhreint**.
- **Varanleg stæði (101–108, 810)** eru alltaf blá og læst. **Tímabundin
  stæði (109–123, 835)** má gera blá í ákveðinn tíma og svo aftur rauð.
- **Listi** sýnir stæði með skráningu loftfars og stöðu (eins og upprunalega
  forritið), með síu „Aðeins virk“.

#### Mynd af DMA korti (Háaleitishlað)

Kortið notar gervihnattamynd af **DMA svæði á Háaleitishlaði** sem bakgrunn
(myndin „DMA SVÆÐI Á HÁALEITISHLAÐI“). Tvær leiðir til að bæta henni við:

1. **Hlekkur (URL):** settu slóð á myndina í umhverfisbreytuna
   `NEXT_PUBLIC_DMA_MAP_URL` (sjá `.env.example`). Dæmi:

   ```
   NEXT_PUBLIC_DMA_MAP_URL=https://<HLEKKUR-Á-MYNDINA>
   ```

   > 🔗 **Hlekkur á DMA kortið:** _<settu hlekkinn þinn hér>_
   >
   > Myndin sem var send í spjallinu vistast ekki sjálfkrafa sem skrá, svo
   > hlaðið henni upp (t.d. á GitHub `public/` möppuna, Google Drive eða
   > myndahýsingu) og límið hlekkinn hér og í `NEXT_PUBLIC_DMA_MAP_URL`.

2. **Staðbundin skrá:** vistið myndina sem `public/dma-map.jpg`
   (sjá `public/README-dma-map.txt`).

Staðsetning lituðu reitanna (x/y, hlutfall 0–100) er stillt fyrir
Háaleitishlað-uppsetninguna í `lib/data/dma.ts` og má fínstilla þar.

### Suður
- Hlið og staða þeirra: **Schengen / non-Schengen / verið að snúa**.
- **Icelandair (FI) flug eru undanskilin** – Icelandair snýr þeim sjálft.
- Hliðalisti í `lib/data/sudur.ts`.

### Flug (FIDS)
- **Öll** flugin sem kefairport.is birtir (komur og brottfarir), ekki bara
  þau næstu. **Uppfærist sjálfkrafa á hverri mínútu.**
- Sía eftir **hliðahópum** (21-23, 24-29, 31-36, 15) og leit eftir hliði
  eða flugnúmeri. Hlið lituð eftir gangi (C grænt, D blátt).
- Gögnin eru sótt um milliþjón (`/api/fids`) til að komast hjá CORS. Náist
  ekki í rauntímagögn eru **sýnigögn** birt með viðvörun.

## Keyrsla

```bash
npm install
npm run dev      # http://localhost:3000
```

Framleiðsla: `npm run build && npm run start`.

## Gögn sem þarf að aðlaga / leiðrétta

- `lib/data/starfsfolk.ts` — vaktalisti og SKIPULAG DAGSINS (besta lesning
  úr ljósmynd, **leiðréttið**).
- `lib/data/verkefni.ts` — verkefni dag-/næturvaktar (heiti rétt, lýsingar
  bráðabirgða).
- `lib/data/dma.ts` — DMA stæði, gerð (varanlegt/tímabundið) og staðsetning
  á korti.
- `lib/data/sudur.ts` — hlið suðurbyggingar.

Öll vaktastaða (innskráning, þrep, verkefnastaða, DMA, Suður, eyðublöð)
geymist í vafranum (`localStorage`) og núllstillist dagleg þrep á nýjum degi.

## Tækni

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS.
