# Dreifa Fan-Out Review — Isavia-Eftirlit

**Scope:** `app/`, `lib/`, `components/` — 41 files, all reviewed (32 via parallel subagents in waves 1–4, 4 more in a partial wave 5, the final 7 reviewed directly after the user stopped further subagent use).

> ## ⚠️ Status update — 2026-07-19
> **This review is historical. All 5 🔴 critical items below have since been fixed** — the original verdict ("not shippable without fixing the 🔴 items") no longer holds. Verified against current source, not this report:
>
> | # | Critical item | Resolved by |
> |---|---|---|
> | 1 | No auth on `/api/state` | HMAC token gate (`gildurToki`) on GET+POST — `4008bf8` |
> | 2 | Open paid `/api/skipulag-mynd` | Token gate + 8MB cap + type allowlist + timeout — `4008bf8` |
> | 3 | PIN timing-attack + hardcoded `6030` | Replaced by fail-closed timing-safe password gate (`lib/auth.ts`) + brute-force rate limiting (`lib/hradatakmork.ts`) — `4008bf8` |
> | 4 | Non-atomic KV writes | Server-side Lua merge in one round-trip (`MERGE_LUA`, `lib/backend.ts`) |
> | 5 | SSRF + unbounded body in FIDS proxy | Host allowlist + https-only + 10MB/9s caps (`app/api/fids/route.ts`) |
>
> Cross-cutting "Supabase `error` ignored" is also resolved (`readAll`/`applyOps`/`ensureToday` now throw). Of the 🟠 majors: the night-shift randomize no-op and `useSudurSnua` unstable-array issues were fixed in later work; the symmetric DMA time-window (`lib/data/dma.ts`) was fixed 2026-07-19 (direction-aware occupancy). Remaining 🟠/🟡/🔵 items below are cleanups, not blockers.

---

## Verdict

**Not shippable as-is for the planned multi-shift trial without fixing the 🔴 items.** The app works and the architecture (shared-state sync, FIDS proxy, role gating) is sound, but it currently has: zero authentication on the shared-state API (anyone with the URL can read/write all shift data), a paid LLM endpoint with no auth or upload limit (open to cost-abuse), a write-race in the KV backend that can silently drop one device's edit when two people tap at once, and a PIN check vulnerable to timing attacks with a hardcoded fallback. None of these are hard to fix — most are an hour or two each — but they should land before wider rollout.

---

## Top Issues (ordered by severity × blast radius)

1. **🔴 No auth on `/api/state` (GET+POST)** — `app/api/state/route.ts:24,44`. Anyone who can reach the URL can read and overwrite all shared shift state (DMA stands, gates, tasks, escorts) with no token/secret check. This is the single biggest exposure now that the backend is live. **Fix:** require a shared secret (header or signed cookie) before any backend call.

2. **🔴 KV writes are not atomic; concurrent edits can be lost** — `lib/backend.ts:108-137` (merge is read-then-write with no lock; comment claims "atómískt" but isn't). On a multi-device polling app, two people tapping near-simultaneously can silently drop one person's change. **Fix:** do the merge server-side in one round trip (Lua script / Redis hash fields), or move fully to Supabase where the RPC is a single statement.

3. **🔴 `/api/skipulag-mynd` (paid Anthropic vision call) has no auth and no upload size cap** — `app/api/skipulag-mynd/route.ts:25-40`. Anyone who finds the route can run up API costs indefinitely. **Fix:** add a session/PIN check at the top of `POST`, reject uploads over ~5MB, add a request timeout.

4. **🔴 PIN check is not timing-safe and has a hardcoded fallback** — `app/api/pin/route.ts:9,17,20`. `pin === vaentPin` leaks timing info character-by-character, and if `EFTIRLIT_PIN` is ever unset on a deploy, the gate silently accepts the public, source-committed `"6030"`. **Fix:** `crypto.timingSafeEqual`, and fail closed (no default) instead of falling back to a known PIN. Also add basic rate limiting — a 4-digit PIN with no lockout is brute-forceable in seconds.

5. **🔴 SSRF + unbounded body in the FIDS proxy** — `app/api/fids/route.ts:19-22,39-48`. `FIDS_URL` is trusted with no scheme/host allowlist, and the response body has no size cap. **Fix:** validate the URL against an allowlist at module load; cap accumulated response bytes.

6. **🟠 `useSudurSnua`'s `flug` array is a fresh reference every render**, defeating every `useMemo` downstream — `lib/useSudurSnua.ts:56`. Also, arrivals (not just departures) currently drive "turn the gate" decisions, which may tell staff to turn a gate before anyone has deplaned. **Fix:** `useMemo` the array; confirm with ops whether arrivals should drive turns.

7. **🟠 Night-shift "Slembiraða nýju plani" silently no-ops** — `app/skipulag/page.tsx:125-132,289-296`. On night shift the table reads from `postarNott`, completely ignoring `state.skipulag`, so pressing the randomize button does nothing visible — no error, no feedback. **Fix:** wire the night branch to read the generated plan too, or hide/disable the button on night shift.

---

## Cross-Cutting Patterns (matter more than any single nit)

- **No authentication anywhere in the new backend layer.** `/api/state`, `/api/skipulag-mynd`, and the PIN check itself are all open or weak. This is one systemic gap, not three separate ones — fixing auth once (e.g. a shared secret derived from the PIN session) would close all three.
- **React list keys built as `id + flugnumer` string concatenation with no separator**, repeated independently in `app/flug/page.tsx`, `app/dma/page.tsx`, and `app/sudur/page.tsx`. Same collision bug, copy-pasted three times — worth a shared helper.
- **Two "fake save" buttons** that flash a success state but persist nothing extra (state is already live-saved by every keystroke): the "Vista" button in `app/fylgdir/page.tsx:357-368` and the "Vista & skila inn" button in `components/YtriAdilarForm.tsx:117-120`. Same misleading pattern in two places — either remove both or give them real meaning (e.g. an explicit submit timestamp).
- **Supabase `{ data, error }` results have `error` ignored everywhere in `lib/backend.ts`** (lines 55-72, 84-106, 108-137). A failed query currently looks identical to "no data yet," which can present as data loss to users.
- **Symmetric time-window logic copy-pasted and subtly wrong** in two independent places: `lib/data/dma.ts:71-82` (`fidsOhreinkun`) and `lib/data/eirikshlad.ts:16-23` (`flugAStaedi`) both use `Math.abs(flugTs - now) <= window`, marking a stand occupied/dirty *before* a flight has actually arrived, not just after. Same bug, written twice.
- **Stale-closure / hydration-timing bugs cluster around `now`/`Date.now()` initialization**: `app/heim/page.tsx:53` (`now` starts `null`, causing a render flash + SSR mismatch), `app/skipulag/page.tsx:43` (shift type computed at render time, same mismatch risk), `components/OpnaAHeim.tsx:26-34` (pathname captured once, stale forever). Worth a shared `useNow()`/`useClientOnly()` pattern instead of solving it three different ways.
- **Zero test files exist anywhere in the codebase.** Every single file reviewed — 41 of 41 — flagged missing test coverage for its riskiest logic. The highest-value targets if testing is added at all: `lib/skipulagsgerd.ts` (staffing invariants), `lib/backend.ts` (merge/atomicity), `lib/store.tsx` (sync race conditions), and the FIDS time-window helpers (`flugTs`, `minuturAftur`, `fidsOhreinkun`).
- **Lookup-table fallbacks are inconsistent.** `BOKSTAFUR_LITUR[letter]` is missing a fallback in `components/SudurTilkynning.tsx:69` (produces literal `undefined` in a class string) but correctly has one elsewhere in `app/sudur/page.tsx:143`. Same table, two different safety levels.
- **No accessibility on custom modal/sheet UI anywhere**: `components/FloatingMenu.tsx`'s bottom sheet and the confirmation dialogs in `components/SudurTilkynning.tsx` have no `role="dialog"`, no focus trap, no Escape-to-close. Low priority for an internal tool, but cheap to fix once as a shared pattern.

---

## Per-File Table

| File | 🔴 | 🟠 | 🟡 | 🔵 | Takeaway |
|---|---|---|---|---|---|
| `app/fylgdir/page.tsx` | 1 | 2 | 4 | 3 | Time-parsing edge case + fake Save button |
| `app/skipulag/page.tsx` | 1 | 2 | 2 | 2 | Night-shift randomize silently no-ops |
| `app/heim/page.tsx` | 0 | 2 | 4 | 2 | Hydration-mismatch risk from `now=null` |
| `app/flug/page.tsx` | 0 | 2 | 4 | 2 | Unmemoized re-filtering + key collisions |
| `app/sudur/page.tsx` | 0 | 0 | 3 | 2 | Key collision risk; Invalid-Date display bug |
| `app/dma/page.tsx` | 0 | 2 | 3 | 2 | Cross-device redundant writes; key collision |
| `lib/store.tsx` | 0 | 3 | 4 | 3 | Sync race conditions: dropped refetch, no backoff |
| `lib/backend.ts` | 2 | 2 | 2 | 3 | Non-atomic writes — real lost-update risk |
| `lib/data/verkefni.ts` | 1 | 2 | 2 | 3 | Task-time matching ignores `:30` minutes |
| `app/verkefni/page.tsx` | 1 | 2 | 2 | 2 | Deep link opens row off-screen |
| `lib/data/starfsfolk.ts` | 0 | 1 | 2 | 3 | No invariant check on roster array lengths |
| `app/vaktir/page.tsx` | 0 | 0 | 4 | 2 | Per-keystroke writes to shared store |
| `components/YtriAdilarForm.tsx` | 0 | 2 | 3 | 2 | Fake submit button; typo'd component name |
| `components/SudurTilkynning.tsx` | 0 | 2 | 2 | 2 | Missing lookup fallback can crash/blank a badge |
| `app/eirikshlad/page.tsx` | 0 | 1 | 2 | 2 | Sort breaks on letter-suffixed stand IDs |
| `lib/skipulagsgerd.ts` | 0 | 3 | 3 | 2 | DMA under/overstaffing edge cases |
| `lib/sharedState.ts` | 0 | 3 | 3 | 2 | No runtime validation of stored data shape |
| `app/api/state/route.ts` | 0 | 2 | 3 | 2 | No auth; no payload validation |
| `app/api/fids/route.ts` | 1 | 2 | 4 | 2 | SSRF risk + timezone bug in time parsing |
| `app/api/skipulag-mynd/route.ts` | 2 | 3 | 3 | 1 | Open paid endpoint, no size limit |
| `app/api/pin/route.ts` | 2 | 2 | 2 | 1 | Timing attack + hardcoded default PIN |
| `lib/fids.ts` | 0 | 2 | 2 | 3 | Midnight-rollover only goes one direction |
| `lib/fidsStore.tsx` | 0 | 2 | 3 | 1 | Stale clock on mount; unmemoized context value |
| `lib/flugGluggi.ts` | 0 | 1 | 2 | 2 | No input guard on non-finite step values |
| `lib/data/vaktir.ts` | 0 | 2 | 3 | 2 | Dedup by name, not id — collision risk |
| `lib/data/sudur.ts` | 0 | 2 | 3 | 3 | `"snua"` state collapses to `"schengen"` |
| `lib/data/dma.ts` | 0 | 2 | 2 | 2 | Symmetric window dirties stand before arrival |
| `lib/data/fylgdir.ts` | 0 | 0 | 1 | 2 | Clean — minor type-safety nits only |
| `lib/data/eirikshlad.ts` | 1 | 1 | 2 | 2 | Picks first matching flight, not closest |
| `lib/usePullToReveal.ts` | 0 | 2 | 3 | 1 | Passive wheel listener can't intercept scroll |
| `lib/useSudurSnua.ts` | 2 | 2 | 3 | 2 | Unstable array reference defeats all memoization |
| `lib/supabase/server.ts` | 0 | 1 | 2 | 1 | Missing `server-only` import guard |
| `lib/supabase/browser.ts` | 0 | 0 | 0 | 0 | Clean |
| `components/FloatingMenu.tsx` | 0 | 2 | 3 | 2 | No focus trap / Escape on the bottom sheet |
| `components/BottomNav.tsx` | 1 | 3 | 1 | 1 | `usePathname()` can be `null` → crash |
| `app/page.tsx` | 0 | 0 | 0 | 0 | Clean |
| `components/PageHeader.tsx` | 0 | 0 | 0 | 0 | Clean |
| `components/PinGate.tsx` | 0 | 0 | 1 | 2 | Unlock flag never expires/re-validates |
| `components/SwRegister.tsx` | 0 | 1 | 0 | 1 | Missing listener cleanup |
| `app/layout.tsx` | 0 | 0 | 2 | 1 | `maximumScale: 1` blocks pinch-zoom (a11y) |
| `components/LoginGate.tsx` | 0 | 0 | 0 | 1 | Clean |
| `components/OpnaAHeim.tsx` | 0 | 1 | 1 | 0 | Stale-closure `pathname` in visibility handler |

---

## Quick Wins (cheap, do these first)

1. Add `import "server-only";` to `lib/supabase/server.ts` — one line, closes a real key-leak risk.
2. Guard `usePathname()` against `null` in `components/BottomNav.tsx:21` — one line, prevents a crash.
3. Fix the React key collision pattern (`id + flugnumer` → `` `${id}-${flugnumer}` ``) in `app/flug/page.tsx`, `app/dma/page.tsx`, `app/sudur/page.tsx` — same one-line fix, three files.
4. Add a fallback to `BOKSTAFUR_LITUR[letter]` lookups in `components/SudurTilkynning.tsx:69` and confirm the one in `app/sudur/page.tsx` stays — prevents a class-name `undefined`.
5. Fix `hinStadan("snua")` collapsing to `"schengen"` in `lib/data/sudur.ts:38-40` — one conditional.
6. Remove `maximumScale: 1` from `app/layout.tsx:31` — one line, real accessibility fix.
7. Add the missing `removeEventListener` cleanup in `components/SwRegister.tsx:17-21` — a few lines.
8. Either delete or properly wire the two fake "Vista" buttons in `app/fylgdir/page.tsx` and `components/YtriAdilarForm.tsx` — deletion is a few lines each.

---

**Summary:** 41 files reviewed. Findings: 13 🔴 critical, ~58 🟠 major, ~95 🟡 minor, ~75 🔵 nits (approximate — tallied from the per-file table above). **Most urgent single fix: add authentication to `/api/state` and `/api/skipulag-mynd`** — right now the entire shared backend and a paid AI endpoint are reachable by anyone with the URL, no PIN or token required.
