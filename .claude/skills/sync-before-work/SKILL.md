---
name: sync-before-work
description: Confirm the local clone actually matches origin/main before planning or building a feature in this repo. Use at the start of any non-trivial task, especially before writing new components or reading existing ones to plan an implementation.
---

# Sync check before starting work

This repo has been cloned in more than one location on this machine (`C:\Projects\Isavia-Eftirlit` and `C:\Claude code\Isavia-Eftirlit` have both existed at different times), and the Obsidian vault notes that describe "what's already shipped" can lag behind what's actually on GitHub.

## Steps

1. Before reading component files to plan an implementation (not just before pushing), run:
   ```bash
   git fetch origin
   git log --oneline -5 origin/main
   git log --oneline -5 HEAD
   ```
2. If `HEAD` is behind `origin/main`, **do not build on top of the stale state**. Either `git pull` (if no local uncommitted work depends on the old state) or investigate why the clone drifted before proceeding.
3. Treat vault/README claims like "sidebar nav shipped" or "X is already done" as a hint, not ground truth — verify the actual file exists and does what's claimed (e.g. `grep` for the component, `git show origin/main:<path>`) before relying on it in a plan.

## Why this exists

On 2026-07-05, a local clone was several commits behind `origin/main` — missing a commit that had already added the desktop sidebar (inside `components/BottomNav.tsx`). Work was planned and partially built (a duplicate `Sidebar.tsx`) against the stale state before the mismatch surfaced, and only because `git push` was rejected as non-fast-forward. The fix cost a `git reset --hard origin/main` and redoing the incremental part on the real code. Checking `origin/main` at the start would have caught it immediately for free.
