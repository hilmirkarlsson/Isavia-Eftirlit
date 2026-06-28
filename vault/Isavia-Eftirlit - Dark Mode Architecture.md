---
title: Isavia-Eftirlit — Dark Mode Architecture
date: 2026-06-28
project: Isavia-Eftirlit
tags: [project/isavia-eftirlit, dev-log, css, dark-mode]
---

# Isavia-Eftirlit — Dark Mode Architecture

Back to [[Isavia-Eftirlit - Session Summary]].

## How it works
- `tailwind.config.ts` → `darkMode: "class"`.
- `lib/theme.tsx` adds a `.dark` class to `<html>`. Provides `ThemeProvider` / `useTema()`, persists to `localStorage` key `eftirlit-kef-tema`, defaults to `prefers-color-scheme`.
- `TEMA_FORSKRIFT` is a FOUC-prevention inline `<script>` injected in `app/layout.tsx` `<head>`.
- `components/ThemeToggle.tsx` — sun/moon button, lives inside the blue page header.

## The key design choice: **global CSS class-remap**
Instead of adding `dark:` variants to every component, dark mode **re-maps the common light Tailwind classes** in one place in `app/globals.css`:

```css
html.dark .bg-white      { background-color: #18222f; }
html.dark .bg-slate-50   { background-color: #1d2836; }
html.dark .text-slate-900{ color: #f1f5f9; }
/* …etc */
```

`html.dark .bg-white` has higher specificity than `.bg-white`, so it always wins — works on **all pages automatically**.

## ⚠️ The trade-off (source of recurring bugs)
Any class/element **not in the override list stays light**. Known gap categories:
- **Color background classes** not listed — e.g. `bg-blue-50`, `bg-violet-50`, `bg-amber-50` (fixed for Suður gate cards in commit `977ee77`).
- **Opacity variants** beyond `/95 /90 /80`.
- **Native form controls** (`<select>`, `<input>`, `<textarea>`) with no explicit `bg-white` class — browser renders them white by default; the remap can't touch a class that isn't there.
- **Inline styles / literal hex** anywhere.

> **Rule of thumb:** when something is "still white in dark mode", find the exact Tailwind bg class on that element and add a `html.dark .<class>` override, OR add dark styling for the native element.

## Verification technique
Headless Chromium screenshots in both themes:
- `playwright-core` installed separately in `/tmp` (project has no Playwright dep).
- Binary: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (note the versioned dir).
- Bypass gates via `page.addInitScript` setting `localStorage`: `eftirlit-kef-pin-ok=1`, `eftirlit-kef-notandi=hilmir`.
- Use Playwright context `colorScheme: 'light' | 'dark'`.
