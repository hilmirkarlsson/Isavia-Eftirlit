---
name: verify-visual-change
description: Verify a UI/styling change in this Next.js app by actually rendering it in a browser (light + dark, mobile + desktop) before committing. Use whenever a change touches Tailwind classes, layout, colors, or component structure in app/ or components/.
---

# Verify a visual change before committing

This repo (Isavia-Eftirlit, a Next.js 14 App Router PWA) has shown real regressions and false confidence when styling changes were only typechecked, not rendered. Use this checklist for any change touching `app/**/page.tsx`, `app/globals.css`, `tailwind.config.ts`, or `components/**`.

## Steps

1. **Typecheck first** (cheap, catches structural mistakes fast):
   ```bash
   npx tsc --noEmit
   ```
2. **Make sure no stale dev server is holding port 3000** — a server started before your edit will serve stale/broken chunks after files change underneath it:
   ```bash
   taskkill //IM node.exe //F 2>/dev/null
   ```
3. **Start a fresh dev server in the background**, wait for "Ready", confirm the port:
   ```bash
   (npm run dev > /tmp/dev.log 2>&1 &) && sleep 6 && cat /tmp/dev.log
   ```
   If it says "Port 3000 is in use, trying 3001", another server is still running — kill it and restart, don't just follow it to 3001 (you'll end up comparing against the wrong instance).
4. **Load the claude-in-chrome tools** if not already loaded (`ToolSearch` with the core set), then `tabs_context_mcp` → `navigate` to the changed route(s) directly (e.g. `http://localhost:3000/dma`, not `/`) — client-side routing can otherwise land you somewhere unexpected.
5. **Screenshot at both a mobile width and a wide desktop width.** This app has distinct mobile (bottom tab bar) and desktop (`lg:` sidebar in `components/BottomNav.tsx`) layouts — a change can look right on one and broken on the other.
6. **Toggle dark mode and re-screenshot.** Dark mode here is a global CSS class-remap in `app/globals.css` (`html.dark .bg-white { ... }` etc.), not per-component `dark:` classes — a new raw color class can silently skip the remap and look wrong only in dark mode.
7. If a screenshot looks wrong (e.g. content appears clipped or cut off at the viewport edge), don't trust the screenshot alone — verify with JS before concluding there's a bug:
   ```js
   document.querySelector('main').getBoundingClientRect()
   ```
   A stale/partially-rendered screenshot has caused false "overflow" diagnoses in this repo before; the fix was just to wait and re-screenshot.
8. **Stop the dev server** (`taskkill //IM node.exe //F`) before committing — don't leave it running.

## Why this exists

During the 2026-07-05 desktop-layout work, a screenshot was initially misread as a layout overflow bug, and a stale/backgrounded dev server on an old port served broken output that looked like a real regression. Both were resolved by re-checking with JS measurements and restarting cleanly — this skill exists so that check happens by default instead of after confusion.
