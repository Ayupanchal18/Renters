# Renters Upgrade — Batch 1: Start Here

I reviewed all three reports. Your `03-execution-plan.md` is already very thorough — you don't need new prompts from scratch, you need a **sensible run order** and a couple of **quick-win prompts that aren't fully spelled out yet** (the ones from the gap analysis roadmap section A).

Below is **Batch 1**: a sequence of 6 prompts you can paste into Antigravity *today*, in order. Each is small, reviewable, and won't break existing pages. Run one, review the diff, test it, then move to the next.

---

## Recommended order & why

1. **Design tokens (1.1)** — everything downstream depends on this
2. **Scrollbar + theme polish (1.3, expanded)** — quick win, zero risk
3. **Component library upgrade (1.2)** — buttons/cards/inputs used everywhere
4. **Chart theme sync (quick win from gap analysis §A.2)** — small, isolated
5. **EMI Calculator widget (quick win from gap analysis §A.3)** — new self-contained feature, good first "feature" win
6. **Motion utilities (1.4)** — now that tokens + components exist, animations slot in cleanly

This gets you a visibly "premium-feeling" site within Batch 1, before touching any heavy features (maps, scheduler, document vault) which need more planning.

---

## Prompt 1 — Design Tokens System

```
Refactor /client/src/global.css and /tailwind.config.ts to establish a complete design 
token system under the prefix --rt-sys-*, without removing or renaming any existing 
--background, --primary, --muted-foreground, etc. variables (add the new tokens alongside 
them for now).

Add:
- Color tokens for Primary (Royal Indigo), Secondary (Coral), Tertiary (Gold Amber), 
  Success/Destructive/Warning, and Background/Border variants, each defined for both 
  light and dark mode using HSL space-separated values (e.g. "228 100% 58%") so Tailwind 
  opacity modifiers like bg-primary/20 keep working.
- Fluid typography tokens --rt-sys-text-sm through --rt-sys-text-2xl using clamp().
- Fluid spacing tokens --rt-sys-spacing-sm through --rt-sys-spacing-2xl.
- Radius tokens --rt-sys-radius-sm through --rt-sys-radius-xl, derived from the existing 
  --radius: 0.625rem base.
- Shadow tokens: a standard soft shadow and a --rt-sys-shadow-glow using the primary color 
  at low opacity.

Extend tailwind.config.ts theme.extend to map these new CSS variables under colors, 
spacing, borderRadius, and boxShadow so they're usable as Tailwind utilities 
(e.g. shadow-glow, rounded-rt-lg, text-rt-2xl).

Do not touch any component files in this task — tokens only.

Verify by running pnpm build successfully and confirming the new CSS variables resolve 
correctly in browser DevTools in both light and dark mode.
```

---

## Prompt 2 — Global Scrollbar & Theme-Aware Surface Polish

```
In /client/src/global.css, add global scrollbar styling that adapts to the active theme:

- Use `scrollbar-color: hsl(var(--muted-foreground)) hsl(var(--muted))` for Firefox.
- Add ::-webkit-scrollbar, ::-webkit-scrollbar-track, and ::-webkit-scrollbar-thumb rules 
  using var(--muted) and var(--muted-foreground)/var(--primary) on hover, with a width of 
  8px and rounded thumb (border-radius matching --radius).
- Apply this globally (html, body, and all overflow-y/overflow-x containers), so admin 
  sidebars, dashboards, and modals all inherit themed scrollbars in both light and dark mode.

Also audit /client/src/components/Navbar.jsx and any sidebar/dashboard layout components 
for inline scrollbar-affecting styles that might override this, and remove redundant 
overrides.

Do not change layout structure or component logic — styling only.

Verify by: opening /dashboard and /admin/analytics in both light and dark mode, scrolling 
any overflow container, and confirming the scrollbar thumb/track colors visually match 
the active theme (no default light-grey browser scrollbar appears in dark mode).
```

---

## Prompt 3 — Shared Component Library Upgrade (Buttons, Cards, Inputs, Select, Dialog)

```
Refactor the following files in /client/src/components/ui/ to use the new --rt-sys-* 
design tokens added in the previous task, without changing their exported component 
names, props, or signatures:

- button.jsx
- card.jsx
- input.jsx
- select.jsx
- dialog.jsx

Required changes:
- Buttons: add `transition-all duration-200 active:scale-95` for a subtle press effect, 
  and `hover:shadow-glow` on primary variant buttons.
- Inputs & Select: use border tokens that respond to theme, and add 
  `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 
  focus-visible:outline-none` for clear keyboard focus states.
- Cards: support an optional `glass` prop/variant that applies the existing `.glass` 
  utility (backdrop-blur + semi-transparent border) plus a subtle shadow-glow on hover 
  for interactive cards.
- Dialog: ensure overlay and content panels use the glass treatment and rt-sys radius 
  tokens, and that opening/closing transitions use the existing Radix animation classes.

Keep full backward compatibility — every existing usage of these components across the 
app must continue to render correctly with no prop changes required.

Verify by: visiting /login, /signup, and any page using Card/Dialog components, confirming 
buttons show a slight scale-down on click, inputs show a visible focus ring on Tab, and 
cards with the glass variant show blur + border in both themes.
```

---

## Prompt 4 — Chart Theme Sync (Recharts Dark/Light Adaptation)

```
The Recharts-based components (RevenueChart.jsx, UserFunnelChart.jsx, 
GeographicHeatMap.jsx, CohortRetentionTable.jsx, and any sparkline charts in 
admin/Analytics.jsx) currently use hardcoded or static stroke/fill colors for grid 
lines, axes, and tooltips, which don't adapt when the user toggles light/dark mode.

Update these components to:
- Read the current theme from ThemeContext (or the existing theme hook used elsewhere 
  in the app).
- Compute grid line, axis, and tooltip colors from CSS variables (e.g. 
  `hsl(var(--foreground) / 0.06)` for grid lines, `hsl(var(--muted-foreground))` for 
  axis text, `hsl(var(--card))` + `hsl(var(--border))` for tooltip background/border).
- Re-render or update chart colors immediately when the theme toggles (no stale colors 
  until page refresh).

Do not change chart data, data-fetching logic, or layout — only color/theme reactivity.

Verify by: opening /admin/analytics, toggling the theme switcher, and confirming all 
chart grid lines, axis labels, and tooltips visually update to match the new theme 
without a page reload.
```

---

## Prompt 5 — EMI / Mortgage Calculator Widget (Buy Property Detail Page)

```
Create a new reusable component EmiCalculator.jsx in /client/src/components/ and add it 
to /client/src/pages/BuyPropertyDetail.jsx, placed below the property pricing section 
(use the existing layout grid — sidebar if one exists, otherwise a new card section 
after the description).

Requirements:
- Inputs: Property Price (pre-filled from the listing's price), Down Payment (% or 
  amount, toggleable), Loan Tenure (years, slider 5-30), Interest Rate (%, default 8.5, 
  editable).
- Output: Monthly EMI amount (large, prominent), Total Interest Payable, Total Amount 
  Payable — all updating live as inputs change (no submit button needed).
- Use the new design tokens and Card/Input components from /components/ui/ for styling — 
  glass card variant, rt-sys radius and spacing.
- Add a small breakdown chart (simple Recharts PieChart: Principal vs Interest) that also 
  respects theme colors per the previous task's pattern.
- Make the component fully responsive (stacks vertically on mobile, two-column on desktop).

Standard EMI formula: 
EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
where P = principal, R = monthly interest rate (annual/12/100), N = tenure in months.

Do not modify the property data-fetching logic — only consume the existing price field 
already available on the page.

Verify by: visiting any /buy/:slug page, confirming the calculator renders with the 
listing's price pre-filled, and that changing any input updates the EMI and pie chart 
instantly.
```

---

## Prompt 6 — Global Motion & Animation Utilities

```
In /client/src/global.css and /tailwind.config.ts, add a set of reusable animation 
utility classes:

- `.animate-page-enter`: fade-in + slight slide-up (translateY 8px to 0, opacity 0 to 1) 
  over var(--rt-sys-duration-normal, 200ms).
- `.hover-pop`: on hover, scale to 1.02 and lift with a soft shadow, transition 150ms.
- `.skeleton-wave`: a shimmering gradient animation for loading placeholders, using 
  --rt-sys colors so it adapts to theme.

Wrap the main route outlet in App.jsx (or the layout component that renders <Outlet />) 
with `.animate-page-enter` so every route transition gets the fade/slide effect.

Apply `.hover-pop` to PropertyCard.jsx for the listing card hover effect.

Wrap all of these in `@media (prefers-reduced-motion: reduce)` overrides that disable 
scaling/translation and reduce durations to near-zero.

Verify by: navigating between pages and confirming a smooth fade/slide-in on each route 
change, hovering a property card on /listings to see the pop effect, and enabling 
"reduce motion" in OS settings to confirm animations are minimized.
```

---

## After Batch 1

Once these 6 are done and verified, move on to:
- **Batch 2 — Quick Wins remainder + Listings/Map upgrades**: Leaflet marker clustering, sticky list/map split on `/rent-properties` and `/buy-properties` (this is the "Large" effort item from the gap table, so plan to break it into 3-4 sub-prompts).
- **Batch 3 — Direct Chat upgrades**: file/image sharing in `/messages`.
- **Batch 4 — Post Property multi-step wizard**.
- **Batch 5+**: Visit scheduler, document vault, neighborhood analytics, 3D tours (long-term items).

Tell me when Batch 1 is done (or if anything broke) and I'll write the next batch with the same level of detail — starting with the Listings/Map overhaul since it's your highest-priority "Large" effort item.
