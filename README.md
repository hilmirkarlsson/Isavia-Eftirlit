# Eftirlit KEF

Vaktatól fyrir eftirlitsdeild á Keflavíkurflugvelli. Hannað fyrir síma og
spjaldtölvur sem starfsfólk notar á vaktinni (stór smellisvæði, snertivænt).

## 🔗 Opna forritið

> **Hlekkur á forritið (vefslóð):** https://isavia-eftirlit.vercel.app

Forritið er komið í loftið og keyrir á Vercel. Opnaðu hlekkinn að ofan í síma
eða spjaldtölvu og notaðu „Add to Home Screen" til að setja það upp sem app
(sjá PWA stuðning hér að neðan).

Vercel er tengt þessu GitHub safni og endurbyggir/sendir út sjálfkrafa eftir
hverja sameiningu (merge) í `main`.

Til að keyra forritið á eigin tölvu: `npm install` og svo `npm run dev`, opnaðu
síðan **http://localhost:3000**.

## Sjálfhýsing á eigin netþjóni (án Vercel)

Forritið er venjulegt Next.js forrit – það er ekkert sem bindur það við
Vercel. Til að keyra það á eigin netþjón (t.d. VPS frá Hetzner, DigitalOcean
o.fl.):

1. **Fáðu netþjón** – ódýr VPS (1–2 GB vinnsluminni er nóg) með Ubuntu/Debian
   og opinberri IP-tölu. Settu upp [Docker](https://docs.docker.com/engine/install/)
   á honum.
2. **Settu lén á IP-töluna** – kauptu lén (eða notaðu undirlén sem þú átt) og
   bættu við A-færslu sem bendir á IP-tölu netþjónsins.
3. **Afritaðu kóðann á netþjóninn**, t.d. með `git clone`.
4. Búðu til `.env` skrá (afritaðu `.env.example`) og settu `DOMAIN=` lénið þitt.
5. Keyrðu:
   ```bash
   docker compose up -d --build
   ```
   Caddy (innifalið í `docker-compose.yml`) sækir sjálfkrafa HTTPS vottorð
   frá Let's Encrypt fyrir lénið og framsendir umferð á forritið.
6. Opna `https://<lénið-þitt>` í síma – þar er hægt að "Add to Home Screen"
   til að setja það upp sem forrit (sjá PWA stuðning hér að neðan).

Til að uppfæra eftir breytingar: `git pull && docker compose up -d --build`.

## Samstilling milli tækja (sameiginlegur bakgrunnur)

Sjálfgefið geymir hvert tæki vaktastöðuna sína í eigin vafra (localStorage) –
hún samstillist þá **ekki** milli síma/spjaldtölva. Til að allir sjái sömu
mynd (DMA stæði, Suður, verkefnastaða, þrep, eyðublöð, skipulag og fylgdir)
er hægt að tengja ókeypis bakgrunn. Forritið virkar áfram án hans – þá er það
einfaldlega í staðbundnum ham. `notandi` (hver er skráður inn) er alltaf per
tæki; aðeins sameiginlega vaktastaðan samstillist.

Það eru **tvær leiðir** og forritið velur sjálfkrafa eftir því hvaða
umhverfisbreytur eru til (Supabase er tekið fram yfir KV ef bæði eru sett):

### Leið 1 – Vercel KV (einfaldast, mælt með)

Engin SQL, engir lyklar afritaðir handvirkt – Vercel sér um allt.

1. Vercel verkefnið þitt → **Storage** → **Create Database** → veldu **KV**
   (Upstash Redis) → gefðu nafn → **Create**.
2. Tengdu hann við verkefnið (**Connect Project**) – Vercel setur þá sjálfkrafa
   `KV_REST_API_URL` og `KV_REST_API_TOKEN` í umhverfisbreyturnar.
3. **Endurútgáfa (Redeploy)** í **Deployments**.

Eftir þetta samstillast tækin á ~6 sekúndna fresti. (Ódýrt: hver sæking notar
útgáfunúmer og sækir bara þegar eitthvað hefur raunverulega breyst.)

### Leið 2 – Supabase (rauntíma push, ~1s)

Gefur samstundis uppfærslur í stað 6s sækingar. Krefst lítillar SQL-uppsetningar:

1. **Búðu til ókeypis Supabase verkefni** á [supabase.com](https://supabase.com).
2. **SQL Editor** → **New query** → límdu inn allt úr
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. **Project Settings → API** → náðu í `Project URL`, `anon public` lykilinn og
   `service_role` lykilinn.
4. Settu í Vercel **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public lykillinn
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role lykillinn
5. **Redeploy**.

> **Öryggi:** `service_role` lykillinn fer EINGÖNGU í umhverfisbreytur, aldrei
> í kóða eða vafrann. Öll skrif fara gegnum þjóninn (`/api/state`); vafrinn fær
> aðeins lesaðgang fyrir rauntíma (RLS í `schema.sql`).

## Netaðgangur (FIDS allowlist)

Til að rauntíma flugupplýsingar virki þarf hýsillinn að hafa útgönguaðgang
(egress) að þessum hýsingum:

- `www.kefairport.is`  ← lifandi flug-API (nauðsynlegt)
- `kefairport.com`  ← valfrjálst

**Vercel / eigin tölva / flugvallarnet:** opið út á netið, virkar sjálfkrafa.

**Claude Code á vefnum:** bættu hýsingunum hér að ofan við „allowed domains“
í netstillingum umhverfisins (sjá
https://code.claude.com/docs/en/claude-code-on-the-web). Breytingin tekur
gildi í nýrri setu/keyrslu.

Athugun á tengingu (skilar 200 ef leyft, annars 403 „Host not in allowlist“):

```bash
npm run check:fids
```

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
- **Öll** flugin sem völlurinn birtir (komur OG brottfarir) – ekki bara þau
  næstu, heldur allt tímabilið (3 klst aftur í tímann til 24 klst fram).
  **Uppfærist sjálfkrafa á hverri mínútu.**
- **Smelltu á flug** til að sjá allt: áætlað/rauntími, staða, hlið, stæði,
  færiband, skráning vélar, tegund vélar, þjónustuaðili, flugfélag og leið.
- Sía eftir **hliðahópum** (21-23, 24-29, 31-36, 15), komur/brottfarir og
  leit eftir hliði eða flugnúmeri. Hlið lituð eftir gangi (A, C, D).
- Gögnin eru sótt um milliþjón (`/api/fids`) frá raunverulegu FIDS API
  vallarins: `https://www.kefairport.is/api/sourceData` – gagnaveitan á bak við
  https://www.kefairport.is/fids (stillanlegt með
  `FIDS_URL`). Náist ekki í rauntímagögn eru **sýnigögn** birt með viðvörun.

  > Athugið: í Claude Code veflotum þarf hýsillinn að hafa netaðgang að
  > `www.kefairport.is` (egress allowlist). Í eigin keyrslu eða á Vercel
  > með opnu neti birtast öll rauntímaflug sjálfkrafa.

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
