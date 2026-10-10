---
name: Olist Store
description: Dark operator console for KPIs, catalog administration and Genie questions
colors:
  ground: '#0c0c0b'
  raised: '#151514'
  raised-2: '#1d1d1b'
  hairline: '#2a2a28'
  hairline-strong: '#3a3a37'
  ink: '#f2f1ec'
  ink-2: '#a3a39e'
  ink-3: '#77776f'
  signal: '#e0342b'
  positive: '#8fbf9a'
  chart-1: '#f2f1ec'
  chart-2: '#b9b8b2'
  chart-3: '#85847e'
  chart-4: '#5a5a55'
  chart-5: '#3b3b38'
  chart-grid: '#1f1f1d'
typography:
  hero-figure:
    fontFamily: 'Archivo Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '76px'
    fontWeight: 200
    lineHeight: 0.95
    letterSpacing: '-0.03em'
    fontVariation: "'wdth' 82"
  figure:
    fontFamily: 'Archivo Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '34px'
    fontWeight: 300
    lineHeight: 1
    letterSpacing: '-0.03em'
    fontVariation: "'wdth' 82"
  page-title:
    fontFamily: 'Archivo Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '28px'
    fontWeight: 300
    lineHeight: 1.25
    letterSpacing: '-0.02em'
  section-title:
    fontFamily: 'Archivo Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '13px'
    fontWeight: 600
    fontVariation: "'wdth' 118"
  body:
    fontFamily: 'Archivo Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '14px'
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "'tnum' 1"
  label:
    fontFamily: 'Archivo Variable, ui-sans-serif, system-ui, sans-serif'
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
    backgroundColor: '{colors.ink}'
    textColor: '{colors.ground}'
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
    backgroundColor: '{colors.ground}'
    textColor: '{colors.ink}'
    rounded: '{rounded.full}'
    height: '36px'
  input:
    backgroundColor: '{colors.ground}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    height: '36px'
  sheet:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.ink}'
---

# Design System: Olist Store

## Overview

**Creative North Star: "The Elenco Sleeve"**

Olist Store reads like a 1960s Elenco bossa nova record cover: photographic black, oversized light white numerals, and a single red dot that marks only what changed or what is selected. The operator opens it to read the business at a glance, so numbers are the largest thing on every screen and everything else steps back into greys.

The interface is restrained but not plain. Character comes from type scale, the condensed light figures against wide-set section titles, and the red dot. The dot glides between navigation items, filter states and the KPI that moved most. There are no cards with shadows. Regions are divided by hairlines and space.

**Key Characteristics:**

- Black ground, warm white ink, one red signal colour.
- Figures set large, light and condensed, with tabular numerals everywhere.
- Hairline dividers instead of cards; elevation only for overlays.
- Monochrome charts; colour appears only as the signal.
- Motion answers the operator: dot glides, numerals tick, sheets slide.

## Colors

A monochrome photographic palette with one red accent.

### Primary

- **Elenco Red** (#e0342b): the signal. The active nav item, the selected filter or segment, the KPI with the largest move, destructive confirmations, validation errors, the caret and text selection. Never decoration.

### Neutral

- **Photo Black** (#0c0c0b): page ground and chart background.
- **Raised Black** (#151514): sheets, dialogs, the Explore composer, table row hover.
- **Raised Black 2** (#1d1d1b): popovers, user chat bubbles, tooltips.
- **Hairline** (#2a2a28): dividers, table rules, unselected segment borders.
- **Hairline Strong** (#3a3a37): input borders and hover borders.
- **Warm White Ink** (#f2f1ec): primary text, figures, primary buttons, the leading chart series.
- **Ink 2** (#a3a39e): secondary text and values in tables.
- **Ink 3** (#77776f): labels, captions, axis text, table headers.
- **Positive** (#8fbf9a): only the tiny "Active" status dot for products.

### Named Rules

**The One Dot Rule.** Red appears as a dot or as signal text, at most once per group: one active nav item, one selected segment, one largest move. If two things on screen are red for the same reason, one of them is wrong.

**The Monochrome Data Rule.** Chart series use the ink-to-grey ramp (`--chart-1` to `--chart-5`). Categories are told apart by position and labels, never by hue.

## Typography

**Font:** Archivo Variable (self-hosted through `@fontsource-variable/archivo`), with weight 100–900 and width 62–125%.

**Character:** one family carries everything. The width axis does the work a second family would: condensed and light for figures, wide and semibold for section titles.

### Hierarchy

- **Hero figure** (200, 64px mobile / 76px desktop, line-height 0.95, width 82%): the lead KPI only.
- **Figure** (300, 34px, width 82%): the other KPIs.
- **Page title** (300, 28px, -0.02em): one per page.
- **Section title** (600, 13px, width 118%): panel headings, the brand.
- **Body** (400, 14px, tabular numerals): table cells, form values, Genie answers (max 70ch).
- **Label** (400, 12px): KPI labels, captions, axis text, table headers, hints. Sentence case, never all caps.

### Named Rules

**The Width Not Weight Rule.** Hierarchy between figures and titles comes from the width axis and size, not from bold. Figures stay light.

## Layout

Content sits in a 1440px container with 16px gutters on mobile, 24px on small screens and 40px from `lg`. The dashboard is a vertical sequence:

- the KPI strip, a 6-column grid on `xl` where the lead KPI takes 1.9 fractions, 3 columns on `md` and 2 on mobile;
- trend plus categories (2fr / 1fr);
- states, top products and top sellers (1fr / 1.4fr / 1.4fr).

Each band starts with a top hairline and 32px of padding, and bands are separated by 48px. Explore is a single 880px column with the composer sticky at the bottom. Below `xl`, every band collapses to one column, and tables scroll horizontally inside their own container.

## Elevation & Depth

Flat by default. Depth is tonal: ground, then raised, then raised-2. Shadows come only from shadcn overlays (sheet, dialog, popover, dropdown) to separate them from the page. The top bar uses a 90% ground with backdrop blur so content scrolling under it stays legible.

### Named Rules

**The No Card Rule.** Panels are not cards. Group with hairlines and space; reserve raised surfaces for things that float over the page.

## Shapes

- **Pills (full radius):** small toggles only (period presets, granularity, status filter, Genie suggestions).
- **8px:** buttons, inputs and selects.
- **12px:** sheets, dialogs, the composer and result tables.
- **2px:** chart bars, which are almost square-ended lines.

## Components

- **Segmented control:** pill buttons with a hairline border. The selected one gets an ink border and a 6px red dot, which glides with a spring (`layoutId`) when the selection moves. It is used for period, granularity, status and chart/table views.
- **KPI figure:** a label, then a figure animated by NumberFlow, then a change line with an arrow icon and the words better, worse, flat or largest move. Colour never carries the meaning alone.
- **Panel:** a section title plus a grey caption, with actions on the right. There is no container chrome.
- **Tables (shadcn):**
  - 12px grey headers;
  - 14px tabular cells, numbers right-aligned;
  - hairline rows and a raised hover;
  - sortable headers use `aria-sort` and an arrow icon.
- **Inactive products:** name struck through in Ink 3 and status "Inactive" with a hollow dot. They stay in the table.
- **Forms:** labels above the inputs, units as suffixes (BRL, g, cm), and errors in red below the field with `aria-invalid`. Create and edit happen in a right-hand sheet or inline on the detail page, never in a modal.
- **Dialogs:** alert dialogs only for destructive or state-changing confirmations (deactivate, delete permanently).
- **States:**
  - skeletons shaped like the final layout;
  - an empty state that says what to do next;
  - an error state with a red dot, the cause in plain words, the request id and "Try again".
- **Charts (bklit):** area chart for the trend and horizontal bar charts for rankings, both monochrome. Fake skeleton axes are hidden while data loads.

## Do's and Don'ts

- **Do** keep red for the signal; **don't** use it for decoration or branding blocks.
- **Do** set every number in tabular figures; **don't** recompute KPIs in the browser.
- **Do** say what changed in words next to arrows; **don't** rely on colour for direction.
- **Do** honour `prefers-reduced-motion` (handled globally and through `MotionConfig`); **don't** add page-load choreography.
- **Don't** add eyebrows or kickers above headings, gradient text, side-stripe borders, or cards around panels.
