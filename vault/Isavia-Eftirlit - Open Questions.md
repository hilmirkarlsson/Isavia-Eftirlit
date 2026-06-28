---
title: Isavia-Eftirlit — Open Questions
date: 2026-06-28
project: Isavia-Eftirlit
tags: [project/isavia-eftirlit, dev-log, todo]
---

# Isavia-Eftirlit — Open Questions

Back to [[Isavia-Eftirlit - Session Summary]].

## ⏳ Fylgdir notification not popping up for anyone (IN APP)
User reports the in-app fylgd notification doesn't appear. Needs clarification — two interpretations:

1. **Card missing on Heim.** When a vaktstjóri marks a fylgd "Lokið", a card is meant to appear on everyone's Heim under "Verkefni á þessari klukkustund". Logic:
   - `app/heim/page.tsx`: `fylgdirNu = state.fylgdir.filter((f) => f.lokid)` — only shows fylgdir already marked **Lokið**.
   - Rendered around lines 222–267.
   - State syncs across clients by polling `/api/state` every `POLL_MS` (`lib/store.tsx` line ~329).
   - **Possible causes to check:** is the fylgd actually being marked `lokid` and persisted to shared backend? Is the polling refetch updating `state.fylgdir` on other devices? Does it only show for assigned staff vs everyone?

2. **Expected a real popup/toast/alert**, not just a card sitting in a list. If so, the current design (a passive card in the Heim list) is the mismatch — would need an actual toast/banner component.

**Next step:** confirm which of the two the user means, then trace `setFylgdLokid` → shared state persist → other-client refetch → render.

## ⚠️ Web Push off
VAPID env vars not set in Vercel — see [[Isavia-Eftirlit - Push Notifications]].

## Branch / workflow note
- All session work committed straight to **`main`** and pushed.
- Designated feature branch `claude/magical-dirac-glase0` is **far behind** main and missing all this session's work.
