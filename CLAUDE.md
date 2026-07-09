# CLAUDE.md

Guidance for Claude Code when working in this repo (Isavia-Eftirlit).

## Project

Vaktatól (shift tool) for security/eftirlit at Keflavík Airport (KEF).
Next.js 14 (App Router) · TypeScript · React client components · Tailwind CSS.
Deployed on Vercel. Shared state via Vercel KV (Upstash Redis) **or** Supabase.

- App routes live in `app/*/page.tsx` (`heim`, `verkefni`, `dma`, `sudur`,
  `flug`, `skipulag`, `fylgdir`, `vaktir`).
- Brand accent is the `brand` color in `tailwind.config.ts` (orange
  `#E76425`, deepened `#CC4F0E`). Never hardcode a raw Tailwind color for the
  accent — use `bg-brand` / `text-brand` / `border-brand`.
- Dark mode is a **global CSS class-remap** in `app/globals.css`, not
  per-component `dark:` variants. See the vault note "Dark Mode Architecture".
- Shared screen header is `components/SkjaHaus.tsx` (brand header + optional
  in-header segmented tabs). Prefer it over ad-hoc headers on new pages.

## Obsidian vault

Dev-log notes live in `vault/*.md` as an Obsidian vault. Every note uses YAML
frontmatter (`title`, `date`, `project: Isavia-Eftirlit`, `tags`) and links
back to `[[Isavia-Eftirlit - Session Summary]]`, which is the hub.

## Conventions

### 🍌 "banana" → vault handout

**Whenever the user says `banana`** (on its own or in a message), create a new
**handout note in the Obsidian vault** (`vault/`) summarizing the work done so
far in the current session — treat it as the trigger to write up what just
happened.

Rules for the handout:
- File: `vault/Isavia-Eftirlit - <Short Topic>.md` (match the existing
  naming: project prefix + em-dash + a short topic title).
- Start with YAML frontmatter: `title`, `date` (today), `project:
  Isavia-Eftirlit`, and `tags` including `project/isavia-eftirlit`,
  `dev-log`, plus topic tags.
- Second line after the H1: `Back to [[Isavia-Eftirlit - Session Summary]].`
- Body: what was done, key files, decisions/trade-offs, commits (short SHAs),
  and how it was verified — mirror the tone/structure of the existing notes.
- Match the format of the notes already in `vault/`; don't invent a new one.
- After writing it, tell the user the note path. Don't commit/push it unless
  the user asks — the vault is committed with normal work, not auto-pushed.

## Git

- Feature work goes on the session's designated branch; `main` is kept live
  for the deployed app. Only push to `main` when the user asks to make work
  live.
- UI/styling changes should be verified rendered in a real browser (headless
  Chromium) in light + dark before committing — see the "Dark Mode
  Architecture" vault note for the exact technique.
