---
title: 2026-07-19 — Backlog audit, DMA time-window fix, Next 16 upgrade
date: 2026-07-19
project: Isavia-Eftirlit
tags: [project/isavia-eftirlit, dev-log, handout, claude-code]
---

# Handout — 2026-07-19

> Session on branch `claude/project-tasks-overview-f3zq40` (Claude Code on the web).
> All work committed and pushed to that branch — **not merged to `main` yet.**

## What was done

### 1. Backlog audit — most of the task list was already done
Cross-referenced the Obsidian Tasks list + handout follow-ups against git history and current source. Findings:

- **All 5 🔴 criticals from `dreifa-report.md` were already fixed** (password/token gate `4008bf8`, atomic KV Lua merge, FIDS SSRF allowlist + caps, rate limiting in `lib/hradatakmork.ts`). The report predated the fixes.
- **Already shipped on 07-16** (one big batch): FR24 live data, next-day plan setup, screening memory, shift countdown, app icon, task ownership for supervisors, planning block durations, password gate, desktop layout.
- **"Slembiraða" 1-hour-block bug** (2h posts coming out as 1h) — already fixed in `164855b` (07-16). Verified empirically: probe ran the generator 300×, day+night, headcounts 4→full — zero 1-hour DMA/Verkefni/Schengen blocks. If the live app still shows slivers, it's a pre-07-16 plan in shared state → press "Slembiraða nýju plani" once.
- **Once-per-24h shuffle limit**: decided to **skip** (the real complaint was the 1h blocks, which are fixed).

### 2. Fixed: DMA stand occupancy window (commit `06eb211`)
`fidsOhreinkun`/`flugAStaedi` in `lib/data/dma.ts` used a symmetric `Math.abs` 3h window → stands flagged DMA up to 3h *before* an arrival landed and 3h *after* a departure left. Replaced with directional `erAStaediNuna`: arrivals count from landing onward, departures only until departure.

### 3. Marked `dreifa-report.md` as historical (commit `5a80635`)
Added a dated status banner mapping each critical to the commit that fixed it, so the report stops reading as "app unshippable".

### 4. Upgraded Next.js 14 → 16.2.10 (commit `c195873`)
- npm audit: **5 vulns (4 high) → 2 moderate** (remainder = transitive postcss inside Next itself; only fix is an unstable canary — left alone).
- React stays 18.3.1 (Next 16 peer-deps allow it) to minimize blast radius.
- `next lint` removed in Next 16 → new ESLint 9 flat config `eslint.config.mjs`, `.eslintrc.json` deleted, `lint` script runs `eslint .` directly.
- `react-hooks@7` new strict rules (`set-state-in-effect`, `refs`, `immutability`) error on pre-existing working patterns → scoped to **warnings** (12 of them) for a later dedicated cleanup.
- tsconfig: build auto-set `jsx: react-jsx` + `.next/dev/types` include.
- Verified: build ✓, tsc ✓, eslint ✓, prod server boots, `/heim` renders, `/api/*` respond. Dockerfile already uses the standalone runner → self-host path unaffected.

## Known limitations / follow-ups

- **Branch not merged** — `claude/project-tasks-overview-f3zq40` holds 3 commits; merge to `main` to deploy (Vercel builds on merge).
- **Watch the first Vercel deploy on Next 16** — should be seamless, but it's a major bump.
- **12 lint warnings** from the new react-hooks rules — a real hooks-cleanup pass, deliberately not bundled into the upgrade.
- **PIN rotation off `6030`** — unblocked (re-login/token flow exists); just set `EFTIRLIT_PASSWORD` in Vercel + redeploy. Config only.
- **"Build a skill to update today's plan"** — still unscoped; unclear if it means a Claude skill or an in-app feature (photo-upload already updates the plan).
- **FLE areas** — reset vs persist completed checks when switching area: still an open product decision.
- **Needs live app/phone**: confirm login on prod, confirm newest deploy, test FLE selector on a phone.
- **Post-sale (blocked)**: live Suður "snúa hliði" data, individual Isavia-email SSO, Austurhlað→DMA modelling.
- **`/banana` doesn't work in web sessions** — it's a personal command on the local machine only. Commit it to the repo's `.claude/` to make it work everywhere; this handout was written by hand instead.
