---
title: Isavia-Eftirlit — Push Notifications
date: 2026-06-28
project: Isavia-Eftirlit
tags: [project/isavia-eftirlit, dev-log, web-push, vapid]
---

# Isavia-Eftirlit — Push Notifications

Back to [[Isavia-Eftirlit - Session Summary]].

## Status: **Built but dormant** ⚠️
The whole Web Push pipeline exists but is a **silent no-op** because the VAPID keys are not set on the server. `pushVirkt()` returns `false` → nothing sends, and the "Kveikja á tilkynningum" toggle stays hidden (so nobody can even subscribe).

## To turn it on
Set these in **Vercel → Project Settings → Environment Variables**, then redeploy:

```
VAPID_PUBLIC_KEY=BLDIEhbWkTqggC3XkHGMG0OOr_MGR62BQdIxx6mDeghMx7V2b74n3lx8enoEfPk3TQWaPt88MCKqFfeiOEpMpKY
VAPID_PRIVATE_KEY=1KNOfgU5tAWNfVRn4FxQIbE-U5_v2S-83I62GRvqeic
VAPID_SUBJECT=mailto:eftirlit@kefairport.is
```

(Keypair already generated and stored commented-out in `.env.example`. Can regenerate a fresh pair if preferred. Public & private MUST be from the same pair.)

## Architecture
| Piece | File |
|-------|------|
| Server send + VAPID config | `lib/push.ts` (`pushVirkt`, `sendaPush`) |
| Subscription storage (KV or Supabase, key `pushSubs`, **not** in `SHARED_KEYS`) | `lib/backend.ts` |
| API: register/unregister/get | `app/api/push/route.ts` |
| API: trigger send | `app/api/push/send/route.ts` |
| Browser client (subscribe/unsubscribe/trigger) | `lib/pushClient.ts` |
| Menu toggle (hides if unsupported/unconfigured) | `components/PushToggle.tsx` |
| Service worker `push` + `notificationclick` handlers | `public/sw.js` |
| Trigger on fylgd marked Lokið | `lib/store.tsx` → `setFylgdLokid` calls `sendaTilkynningu("Ný fylgd", …)` |

- Auto-purges invalid subscriptions on 404/410.
- `sendaPush(skilabod, fyrir?)` — `fyrir` is a list of starfsmaður-ids to target; else all.

## Note
This is the **OS-level push** system. The **in-app "fylgd" card** that shows on Heim (under "Verkefni á þessari klukkustund" when a fylgd is marked Lokið) is a separate thing — see [[Isavia-Eftirlit - Open Questions]].
