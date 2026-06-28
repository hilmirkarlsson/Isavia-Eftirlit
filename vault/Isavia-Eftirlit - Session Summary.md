---
title: Isavia-Eftirlit — Session Summary
date: 2026-06-28
project: Isavia-Eftirlit
tags: [project/isavia-eftirlit, dev-log, claude-code, nextjs]
---

# Isavia-Eftirlit — Session Summary

> Vaktatól (shift tool) for security/eftirlit at Keflavík Airport (KEF).
> Next.js 14 (App Router) · TypeScript · React client components · Tailwind CSS.
> Deployed on Vercel. Backend state via Vercel KV (Upstash Redis) **or** Supabase.

Related notes:
- [[Isavia-Eftirlit - Dark Mode Architecture]]
- [[Isavia-Eftirlit - Push Notifications]]
- [[Isavia-Eftirlit - Open Questions]]

---

## What was done this session

### 1. Dark mode (light/dark toggle)
- Added a **light/dark mode toggle** in the header (sun/moon icon).
- Implemented via a **global CSS class-remap** in `app/globals.css` rather than scattering Tailwind `dark:` variants everywhere. See [[Isavia-Eftirlit - Dark Mode Architecture]].
- Toggle is now **anchored inside each page's blue header bar** (not floating `fixed` over content), so it always sits on the blue background regardless of scroll.
  - Lives in `components/PageHeader.tsx` for most pages, and inline in `app/heim/page.tsx`'s sticky header.

### 2. Feature additions (earlier in session)
- **Night-aware Heim header** — shows `Næturvakt` / `Dagvakt` correctly.
- **DMA "Allt hreint"** (mark-all-clean) reset button.
- **Haptics** (`navigator.vibrate`) wired into key buttons.
- **Vaktstjóri task roll-up** on Verkefni — progress bar + overdue-task box.
- **Shift handover notes** ("Skilaboð milli vakta") — `components/Vaktnotur.tsx`.
- **Photo → live night roster sync** — uploaded plan photo fills the shared night roster, live on everyone's Heim.
- **Web Push notification system** — fully built, **dormant** until VAPID keys are set. See [[Isavia-Eftirlit - Push Notifications]].

### 3. Professional UI polish
- Shared SVG **icon system** (`components/Icons.tsx`) replacing emoji across menu, toggles, warning banners.
- Refined shadows / depth in `app/globals.css`.

---

## Bug fixes this session

| Fix | File(s) | Commit |
|-----|---------|--------|
| Suður gate cards stayed white in dark mode (`bg-blue-50` / `bg-violet-50` / `bg-amber-50` not in dark remap list) | `app/globals.css` | `977ee77` |
| Removed gate **A15/D15** from Suður (gate physically closed) | `lib/data/sudur.ts` | `40c4811` |
| Pin Heim's name/vakt bar like other tabs' headers (big blue header no longer scrolls away entirely) | `app/heim/page.tsx` | `6950797` |
| Anchor theme toggle to the blue header instead of floating fixed | `components/PageHeader.tsx`, `components/ThemeToggle.tsx`, `app/heim/page.tsx`, `app/layout.tsx` | `107de71` |

All commits pushed to **`main`**.

---

## Open / unresolved
- **"Fylgdir noti" not popping up for anyone** — under investigation. Two possible meanings being clarified:
  1. The *card* on Heim (appears when a fylgd is marked "Lokið") never shows.
  2. Expected an actual *popup/toast/alert*, not just a list card.
- Web Push is built but **off** (no VAPID env vars in Vercel).

See [[Isavia-Eftirlit - Open Questions]].
