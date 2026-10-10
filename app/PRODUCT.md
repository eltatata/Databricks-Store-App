# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A store operator at Olist, the Brazilian marketplace. They open the app at the start of the working day to read the business at a glance (sales, orders, customers, delivery performance) and spend the rest of the session maintaining the product catalog. They are fluent with admin tools and dashboards and expect them to be fast and predictable.

## Product Purpose

Olist Store is the operator's single place to read KPIs and manage products. Every number comes from the Gold layer of a Databricks medallion pipeline, synced into Lakebase Postgres, so the dashboard and the catalog read one governed source. Success means the operator trusts the numbers without cross-checking them, and can create, edit or deactivate a product in seconds.

## Positioning

The dashboard is not a BI embed: KPIs are precomputed in Gold and served from Postgres, so they match Genie and SQL exactly. Explore lets the operator ask questions in plain language against the same Gold tables through a Genie space. An AI assistant that can act on the catalog with human approval is planned for the next phase.

## Operating Context

- Desktop first, used during working hours. The app opens on the Dashboard; Products and Explore are secondary routes.
- Historical dataset: Olist orders from 2016-09 to 2018-10. A "data as of" freshness badge shows when Gold was last synced.
- Currency is Brazilian real (R$). States and categories come from the dataset as published (Portuguese category names translated to English slugs).
- No user roles: every signed-in workspace user has the same access. Identity comes from Databricks Apps.

## Capabilities and Constraints

- Dashboard: six KPIs (GMV, orders, AOV, distinct customers, average review score, late-delivery rate) for any date range, a sales trend by day or month, and breakdowns by category and state, plus top products, top sellers and freshness.
- Products: paginated, searchable and filterable list; create, edit (optimistic concurrency with a version number), soft delete, and permanent delete. Writes are audited with the operator's email.
- Explore: natural-language questions to the Genie space, answered with text, SQL-backed tables and an optional chart.
- KPIs are never recomputed in the browser.
- Built on Databricks Free Edition: one app, cold starts after the 24 h auto-stop are possible.

## Brand Commitments

- Name: Olist Store.
- Interface copy is in English.
- The user asked for a dark, minimalist theme that does not feel simplistic, with micro-animations and a good feel, optimized for data visualization and administration.

## Evidence on Hand

Real data only: the Olist public dataset (CC BY-NC-SA 4.0), about 99k orders, 33k products and 3k sellers. No testimonials, customers or benchmarks exist and none may be invented.

## Product Principles

1. Numbers first: the operator's first glance answers "how is the business doing".
2. Trust through exactness: show the source and freshness, and never show a value that the API did not return.
3. Fast hands: catalog tasks complete in a few keystrokes, with clear conflict and error recovery.
4. Quiet by default, responsive on action: motion confirms what the operator did.

## Accessibility & Inclusion

WCAG AA contrast on the dark theme, visible keyboard focus, labelled controls, and charts that never rely on color alone.
