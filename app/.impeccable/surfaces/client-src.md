---
version: 1
slug: "client-src"
primary_target: "client/src"
related_targets: []
---

# Olist Store app shell (Dashboard, Products, Explore)

Mode: Operate. Audience: the Olist store operator, desktop, daily. Task: read the business, then maintain the catalog; ask Genie ad-hoc questions. Interface copy in English. Dark theme pinned by the user.

## Direction contract

THESIS: The operator's numbers set like an Elenco bossa nova sleeve: photographic black, oversized light white numerals, and one red dot that marks only what changed or what is selected. Refuses the grey zinc card grid with a blue accent and sparkline tiles.

OWN-WORLD: Black ground #0c0c0b, raised #151514 and #1d1d1b, hairlines #2a2a28, ink #f2f1ec, secondary #a3a39e, muted #77776f, single red #e0342b. Archivo variable: wide stretch for brand and section titles, condensed light for numerals, normal for UI. Charts monochrome in an ink-to-grey ramp; red only for the highlighted or selected datum. No cards with shadows: regions divided by hairlines and space.

STORY: The operator sees how the business is doing in one glance, notices the KPI that moved most (red dot), narrows the period by dragging on the trend, then moves to Products to fix the catalog.

FIRST VIEWPORT: Top bar with brand, nav (red dot under the active item), date range and category filters at right, freshness. Below, a KPI row: GMV oversized at left, five KPIs beside it, red dot on the largest move. Then trend (2/3) with a category breakdown (1/3), then state breakdown, top products and top sellers.

FORM: Elenco Sleeve, my top-ranked grounded candidate (rank 1), chosen by the user as the pick card; seed key b04bba5e.

Signature interaction: the red dot glides between nav items and filter states (shared layout animation), and numerals tick to new values when filters change. Motion 150–250 ms, ease-out, respects reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
