---
name: match-existing-ui-pattern
description: Before adding a new card, color, or spacing value in this app, grep for how the same kind of element is already styled elsewhere and match it, rather than inventing a new variant. Use whenever adding a list/card UI or a color accent to any app/*/page.tsx file.
---

# Match the existing UI pattern instead of inventing a new one

This app (Isavia-Eftirlit) had drifted into several near-duplicate but subtly different styles for the same kind of thing before a 2026-07-05 cleanup pass: card corner radius, padding, list spacing, and which shade of blue to use all varied tab-to-tab despite looking like they were supposed to be the same design language.

## Steps

1. **Before styling a new card/list**, grep the established recipe and copy it exactly rather than approximating from memory:
   ```bash
   grep -n "rounded-xl border" app/*/page.tsx components/*.tsx
   ```
   The standard card is `rounded-xl border border-slate-200 bg-white p-3 shadow-sm`; list spacing between cards is `space-y-2` (or `lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0`, extending to `xl:grid-cols-3`/`2xl:grid-cols-4` on wide screens); page-level content padding is `p-4`. Settings/form panels (not repeated list cards) use `p-4` with `border-dashed` — a deliberately different sub-pattern, don't blend the two.
2. **Before using a blue accent**, use `bg-brand`/`text-brand`/`border-brand` (defined in `tailwind.config.ts`) — never a raw Tailwind `blue-*` or `sky-*` class. If you need a lighter/darker variant, use `bg-brand-light` or `bg-brand-dark` (already defined), not a different Tailwind color.
3. **Buttons and hover/press states are the one deliberate exception** — e.g. `active:bg-brand-dark` on `bg-brand` buttons, or the DMA "Allt hreint" button's distinct color when armed. Don't "fix" these into matching brand blue; they're intentionally distinct affordance colors.
4. If the same small piece of logic/data (e.g. a status→color mapping) is needed in more than one component, check whether it already exists in `lib/data/*.ts` before writing a second copy — duplicated mappings (like Suður's letter-color logic, once copy-pasted between the page and its notification component) drift out of sync silently.

## Why this exists

The 2026-07-05 session found: Verkefni's task list had no card styling at all (flat `divide-y` list) while every other tab used white rounded cards; DMA and Suður used raw `blue-500`/`blue-600`/`sky-500` instead of the brand color used in headers; DMA and Flug had drifted onto different page padding and card-gap spacing than the rest of the app. All of it had to be found by grepping every page and comparing, then unified — cheaper to check first than to unify later.
