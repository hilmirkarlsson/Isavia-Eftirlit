---
title: Isavia-Eftirlit — Appelsínugult Theme Redesign
date: 2026-07-09
project: Isavia-Eftirlit
tags: [project/isavia-eftirlit, dev-log, ui, theme, tailwind, dark-mode]
---

# Isavia-Eftirlit — Appelsínugult Theme Redesign

Back to [[Isavia-Eftirlit - Session Summary]].

> Reworked the whole app to the orange ("appelsínugult") redesign mockup, then
> rebuilt the Heim (1c personal + 1b supervisor) and Verkefni screens to match
> it exactly, and finally carried the same design system to DMA, Suður and FIDS.
> All pushed to **`main`** (kept live for the deployed app).

## 1. Brand retheme (Isavia blue → orange)
- `tailwind.config.ts` — `brand` swapped from Isavia blue `#00436f` to the
  mockup's orange **merkislitur** `#E76425`, pressed/active `#CC4F0E`, light
  tint `#DDA67F`. Because the app already uses `bg-brand` / `text-brand` /
  `border-brand` everywhere, this cascaded app-wide from one change.
- `app/globals.css` — recalibrated the light/dark neutral tokens to the
  mockup: light bg `#E9EDF1`, ink `#101C26`; night bg `#0E1114`, ink
  `#CFD6DC` (deliberately **not** white — less glare). `text-brand` dampened
  to `#DDA67F` in dark mode.
- Fixed the "yfir tíma" banner from amber → red so it no longer collides with
  the "í gangi" status color.
- Commit `7bf7aab`.

## 2. Status system + shared badge
- New `components/StadaBadge.tsx` — one status system (**Lokið / Í gangi /
  Ekki byrjað / Yfir tíma**) with color + shape + word, never color alone
  (sólarbirta / litblinda). Used in Verkefni rows and the Heim dashboard.
- `lib/data/verkefni.ts` — extracted `verkefniYfirTima()` so "is this task
  overdue" is defined once (night shift crosses midnight) and shared.
- Commit `384916a`.

## 3. Heim rebuilt — 1c (varðmenn) + 1b (vaktstjóri)
`app/heim/page.tsx` now branches on `stjori`:

**1c personal view** — greeting header ("Góðan dag / Góða vakt, {nafn}") with
user-switch + theme icons; a white **hero card overlapping the header** with a
42px post title, progress bar + "N mín eftir af þessum tímaramma", and a
"Næst" row; hourly tasks with a 52px **Hefja** button that starts the task and
deep-links into Verkefni; the day as a **vertical timeline** — struck-through
pills + green checks for past frames, ringed NÚNA row, future collapsed behind
"til 16:30 ▾", ending on a "vaktalok" marker.

**1b supervisor dashboard** — white sticky header with brand-caps meta
(vakt · date), "Yfirlit vaktstjóra", a VERKEFNI VAKTAR stat with red overtime
count and a big clock; left column = staðsetning list + red "Opna verkefni"
attention cards; right column = always-visible skipulag grid + skilaboð milli
vakta. Desktop sidebar (`components/BottomNav.tsx`) became the brand-colored
control-room rail with a user footer (avatar, name, role → tap to switch).

- Commits `384916a`, `0bd1a47`, polish `f4d7d3f`.

## 4. Verkefni rebuilt (1c)
`app/verkefni/page.tsx` — Dagvakt/Næturvakt segmented control moved **into the
brand header** with an "X af Y lokið" subtitle; completed tasks fold behind a
green "✓ N verkefnum lokið · HH:MM–HH:MM" bar; rows carry left accent borders
(deep red overdue `#9c2b1c`, amber in-progress `#c07f10`), state-specific
subtitles, an outlined **EKKI BYRJAÐ** pill on future tasks, 52px actions, and
in-progress checklists that stay open without a tap. Fixed a `min-width:auto`
flexbox bug that pushed the action button off-screen once the badge was added.

## 5. Night mode (mockup night screens)
`app/globals.css` — brand headers become dark surfaces `#131920` (via
`dark:bg-[#131920] dark:bg-none`), filled `.bg-brand` buttons dampen to
`#DDA67F` with dark text, and green/red status text gets muted dark variants.
Commit `384916a`.

## 6. DMA / Suður / FIDS — same design system
- New `components/SkjaHaus.tsx` — shared screen header (brand surface, dark in
  night mode; bold title + subtitle + theme toggle + optional in-header
  segmented tabs via `HausFlipar`). Replaces the old `PageHeader` + separate
  grey sticky sub-tab bar.
- **DMA** (`app/dma/page.tsx`) — DMA-flug/Listi tabs into the header, count
  chips beside the toggle, "Aðeins DMA" filter moved into the list view,
  cards/pills → rounded-2xl.
- **Suður** (`app/sudur/page.tsx`) — Hlið/Rútuhlið tabs into the header; cards
  rounded-2xl. **Bug fix:** gate status title overlapped the status `<select>`
  — title now truncates, select is fixed-width `w-24`.
- **FIDS** (`app/flug/page.tsx`) — Komur/Brottfarir tabs + search box into the
  header (search on a light field for legibility); flight cards rounded-2xl.
  Gate colour-coding (C green / D orange / A orange) left unchanged — it's
  meaningful, not theme.
- Commit `2ea40a3`.

## Verification
- Headless Chromium (Playwright at `/opt/node22/lib/node_modules/playwright`,
  browser `/opt/pw-browsers/chromium`) — screenshotted every screen in
  **light + dark**, phone + desktop, against high-res crops of the mockup HTML.
- Drove a full task lifecycle (Hefja → auto-open checklist → check steps →
  Ljúka → green done-bar) to confirm behavior, not just looks.
- Auth gate bypassed with a **local-only** `.env.local` `EFTIRLIT_PIN`
  (gitignored, removed before every commit).
- `npx tsc --noEmit` clean before each push.

## Notes / follow-ups
- `is-IS` `toLocaleDateString` isn't reliable in the headless Chromium build
  (fell back to `MM/DD/YYYY`) — the 1b header formats the date manually as
  `dd.mm.yyyy`.
- `node_modules` isn't committed; a fresh container needs `npm install` before
  typecheck/dev.
