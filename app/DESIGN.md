---
name: Olist Store
description: Operator console in the Olist brand, light and dark, for KPIs, catalog administration and an agentic assistant
colors:
  ground: '#ffffff'
  raised: '#f5f7fb'
  raised-2: '#edf1f7'
  hairline: '#e5e8ed'
  hairline-strong: '#c9d0dc'
  ink: '#001647'
  ink-2: '#4d5c7e'
  ink-3: '#696d8c'
  brand: '#0a4ee4'
  brand-deep: '#0a1f9c'
  teal: '#8dd7d7'
  amber: '#f0a028'
  signal: '#d92d20'
  positive: '#0e8a5f'
  chart-1: '#0a4ee4'
  chart-2: '#3d74ec'
  chart-3: '#0a1f9c'
  chart-4: '#8dd7d7'
  chart-5: '#f0a028'
  chart-grid: '#eef1f6'
  chart-scale: ['#e8effd', '#b6cbf7', '#6f97f0', '#0a4ee4', '#0a1f9c']
typography:
  hero-figure:
    fontFamily: 'Plus Jakarta Sans Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '68px'
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: '-0.04em'
  figure:
    fontFamily: 'Plus Jakarta Sans Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '32px'
    fontWeight: 600
    lineHeight: 1
    letterSpacing: '-0.04em'
  page-title:
    fontFamily: 'Plus Jakarta Sans Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '28px'
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: '-0.025em'
  section-title:
    fontFamily: 'Plus Jakarta Sans Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '14px'
    fontWeight: 600
    letterSpacing: '-0.01em'
  body:
    fontFamily: 'Plus Jakarta Sans Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '14px'
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "'tnum' 1"
  label:
    fontFamily: 'Plus Jakarta Sans Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '12px'
    fontWeight: 400
rounded:
  sm: '6px'
  md: '8px'
  lg: '12px'
  full: '9999px'
spacing:
  gutter-mobile: '16px'
  gutter: '40px'
  section: '48px'
  panel-gap: '48px'
components:
  button-primary:
    backgroundColor: '{colors.brand}'
    textColor: '#ffffff'
    rounded: '{rounded.md}'
    height: '36px'
  button-outline:
    backgroundColor: '{colors.ground}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    height: '36px'
  segment:
    backgroundColor: '{colors.ground}'
    textColor: '{colors.ink-2}'
    rounded: '{rounded.full}'
    height: '36px'
  segment-selected:
    backgroundColor: 'rgb(10 78 228 / 0.08)'
    borderColor: '{colors.brand}'
    textColor: '{colors.ink}'
    rounded: '{rounded.full}'
    height: '36px'
  input:
    backgroundColor: '{colors.ground}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    height: '36px'
  sheet:
    backgroundColor: '{colors.ground}'
    textColor: '{colors.ink}'
---

# Design System: Olist Store

## Overview

Olist Store wears the identity of Olist, the Brazilian marketplace the dataset comes from (D18). It reads like olist.com: a white page, deep navy type, and Olist blue for everything the operator can act on or should notice. The operator opens it to read the business at a glance and to ask the assistant, so figures are the largest thing on each screen and the rest stays quiet.

**Key Characteristics:**

- White ground, navy ink, Olist blue as the one accent.
- Plus Jakarta Sans everywhere; figures semibold with tight tracking, as in Olist headlines.
- Hairline dividers instead of cards; elevation only for overlays.
- Charts in the blue ramp; teal and amber only when a chart needs a second or third series.
- Red only for errors and destructive actions.
- Motion answers the operator: the accent dot glides, numerals tick, sheets slide, the map flies to a state.

## Colors

Taken from olist.com (`--rebrand-primary-color`, `--rebrand-secondary-color` and the navy text colors of the site).

### Brand

- **Olist Blue** (#0a4ee4): primary buttons, the accent dot (active nav item, selected filter or segment, KPI with the largest move, pending approval), focus rings, links on hover, the caret and text selection, the leading chart series.
- **Deep Blue** (#0a1f9c): the darkest step of the map scale and the secondary chart series.
- **Teal** (#8dd7d7) and **Amber** (#f0a028): supporting chart series only.

### Neutral

- **Ground** (#ffffff): page and chart background.
- **Raised** (#f5f7fb): table row hover, result table headers, code blocks.
- **Raised 2** (#edf1f7): user chat bubbles, hover fills.
- **Hairline** (#e5e8ed): dividers, table rules, unselected segment borders.
- **Hairline Strong** (#c9d0dc): input borders, hover borders, open approval cards.
- **Navy Ink** (#001647): primary text and figures.
- **Ink 2** (#4d5c7e): secondary text and table values.
- **Ink 3** (#696d8c): labels, captions, axis text, table headers.

### Status

- **Signal Red** (#d92d20): errors, validation messages, destructive confirmations.
- **Positive** (#0e8a5f): only the small "Active" status dot for products.

### Named Rules

**The One Accent Rule.** Blue marks what is selected or what moved, at most once per group: one active nav item, one selected segment, one largest move.

**The Red Means Wrong Rule.** Red never decorates and never means "selected". It appears only when something failed or is about to be removed.

**The Blue Ramp Rule.** Sequential data (the state map) uses `--chart-scale-01` to `--chart-scale-05`. In light mode the ramp runs from light to deep blue; in dark mode it runs from navy to bright blue. The stronger color always means more.

**The Token Rule.** Components never use literal colors (hex, `rgb()`, `text-white`, `bg-black/50`, Tailwind palette names such as `zinc-900`). They use the semantic utilities generated from the tokens (`bg-background`, `text-ink-2`, `bg-overlay`, `text-destructive-foreground`, `var(--chart-*)`). Literal values live only in `client/src/index.css`.

### Dark mode (D21)

Follows the shadcn dark-mode pattern: the tokens are redefined under `.dark`, Tailwind's `dark:` variant is `@custom-variant dark (&:is(.dark *))`, and a `light` or `dark` class sits on `<html>`. The user picks Light, Dark or System from the toggle in the top bar; the choice persists in `localStorage` (`olist-store-theme`) through the Zustand `useUiStore`, and an inline script in `index.html` applies the class before first paint.

| Token | Light | Dark |
|---|---|---|
| ground | #ffffff | #070e24 |
| raised | #f5f7fb | #0d1632 |
| raised-2 | #edf1f7 | #141e3d |
| hairline | #e5e8ed | #1c284a |
| hairline-strong | #c9d0dc | #2a3a63 |
| ink | #001647 | #edf1fa |
| ink-2 | #4d5c7e | #aab5cd |
| ink-3 | #696d8c | #8a96b2 |
| brand | #0a4ee4 | #5b8cf5 (navy text on top) |
| brand-deep | #0a1f9c | #a9c3ff |
| signal | #d92d20 | #f97066 (navy text on top) |
| positive | #0e8a5f | #34c98a |
| chart tooltip | navy panel, white text | off-white panel, navy text |
| chart-scale | #e8effd → #0a1f9c | #13224a → #a9c3ff |

Every text pair meets WCAG AA (4.5:1) on its dark surface.

## Typography

**Font:** Plus Jakarta Sans Variable (OFL, self-hosted through `@fontsource-variable/plus-jakarta-sans`), the global typeface of olist.com. Soleil, which olist.com also loads, is a commercial font and is not bundled.

### Hierarchy

- **Hero figure** (600, 56px mobile / 68px desktop, line-height 0.95, -0.04em): the lead KPI only.
- **Figure** (600, 32px, -0.04em): the other KPIs and assistant KPI results.
- **Page title** (700, 28px, -0.025em): one per page.
- **Section title** (600, 14px): panel headings.
- **Body** (400, 14px, tabular numerals): table cells, form values, assistant answers (max 70ch).
- **Label** (400, 12px): KPI labels, captions, axis text, table headers, hints. Sentence case, never all caps.
- **Wordmark:** "olist" in 800 Olist Blue with -0.05em tracking, followed by "store" in 500 Ink 2. It is typeset text, not the Olist logo artwork.

## Layout

Content sits in a 1440px container with 16px gutters on mobile, 24px on small screens and 40px from `lg`. The dashboard is a vertical sequence:

- the KPI strip, a 6-column grid on `xl` where the lead KPI takes 1.9 fractions, 3 columns on `md` and 2 on mobile;
- trend plus categories (2fr / 1fr);
- the Brazil state map with its metric switch and the top-states ranking (1.6fr / 1fr);
- top products and top sellers (1fr / 1fr).

Each band starts with a top hairline and 32px of padding, and bands are separated by 48px. The assistant is a single 880px column with the composer sticky at the bottom. Below `xl`, every band collapses to one column, and tables scroll horizontally inside their own container.

## Elevation & Depth

Flat by default. Depth is tonal: ground, then raised, then raised-2. Shadows come only from shadcn overlays (sheet, dialog, popover, dropdown). The top bar uses a 90% white with backdrop blur.

### Named Rules

**The No Card Rule.** Panels are not cards. Group with hairlines and space; reserve raised surfaces for things that float over the page.

## Shapes

- **Pills (full radius):** small toggles only (period presets, granularity, status filter, map metric, suggestions).
- **8px:** buttons, inputs and selects.
- **12px:** sheets, dialogs, the composer, approval cards and result tables.
- **2px:** chart bars.

## Components

- **Segmented control:** pill buttons with a hairline border. The selected one gets a blue border, a faint blue fill and a 6px blue dot that glides with a spring (`layoutId`). Used for period, granularity, status, map metric and chart/table/map views.
- **KPI figure:** a label, a figure animated by NumberFlow, then a change line with an arrow icon and the words better, worse, flat or largest move. Colour never carries the meaning alone.
- **Panel:** a section title plus a grey caption, with actions on the right. No container chrome.
- **State map (bklit `choropleth-chart`):**
  - Brazil's 27 states from a bundled Natural Earth GeoJSON (public domain), keyed by UF.
  - Fill from the blue ramp by quantile of the selected metric; states without sales stay Raised 2.
  - Hover shows the state name, the metric and its orders; click flies to the state, Escape flies back.
  - A five-step legend under the map gives the value range of each step, so the color is never the only cue. The ranking next to it lists the same values as text.
- **Tables (shadcn):** 12px grey headers, 14px tabular cells with numbers right-aligned, hairline rows and a raised hover. Sortable headers use `aria-sort`.
- **Inactive products:** name struck through in Ink 3 and status "Inactive" with a hollow dot.
- **Forms:** labels above the inputs, units as suffixes (BRL, g, cm), errors in red below the field with `aria-invalid`. Create and edit happen in a right-hand sheet or inline on the detail page.
- **Dialogs:** alert dialogs only for destructive or state-changing confirmations.
- **Assistant (the only chat, D19):**
  - User bubbles are Raised 2, right aligned. Assistant text is plain body copy with no bubble.
  - Each tool call shows a 12px grey activity line ("Asked Genie", "Read sales by state") with a check icon, or a shimmer while it runs.
  - Generative UI renders only through allowlisted views: the KPI figure grid, the product table or line, the state map, and the analytics result for Genie (bklit chart, state map or table, plus the SQL Genie ran).
- **Approval card:** white, 12px radius, Hairline Strong border while open, with the blue dot while it waits. The body shows the fields to create, a Now / After approval table for updates, or the target product for deactivation. The primary action names the change; deactivation uses the destructive button; Deny is outlined. After a decision the status line says what happened.
- **States:** skeletons shaped like the final layout; an empty state that says what to do next; an error state with a red dot, the cause in plain words, the request id and "Try again".

## Do's and Don'ts

- **Do** keep blue for actions and the accent dot; **don't** fill large areas with it.
- **Do** keep red for errors and destructive actions only.
- **Do** set every number in tabular figures; **don't** recompute KPIs in the browser.
- **Do** say what changed in words next to arrows and give the map a numeric legend; **don't** rely on colour alone.
- **Do** honour `prefers-reduced-motion` (handled globally and through `MotionConfig`).
- **Don't** copy Olist logo artwork, add eyebrows above headings, gradient text, or cards around panels.
