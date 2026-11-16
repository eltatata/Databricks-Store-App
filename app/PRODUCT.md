# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A store operator at Olist, the Brazilian marketplace. They open the app at the start of the working day to read the business at a glance (sales, orders, customers, delivery performance) and spend the rest of the session maintaining the product catalog. They are fluent with admin tools and dashboards and expect them to be fast and predictable.

## Product Purpose

Olist Store is the operator's single place to read KPIs and manage products. Every number comes from the Gold layer of a Databricks medallion pipeline, synced into Lakebase Postgres, so the dashboard and the catalog read one governed source. Success means the operator trusts the numbers without cross-checking them, and can create, edit or deactivate a product in seconds.

## Positioning

The dashboard is not a BI embed: KPIs are precomputed in Gold and served from Postgres, so they match Genie and SQL exactly. The Assistant is the only chat: it reads KPIs, state sales and products from Lakebase, delegates analysis to Genie over the same Gold tables, answers with figures, charts and maps, and drafts catalog changes that run only after the operator approves them.

## Operating Context

- Desktop first, used during working hours. The app opens on the Dashboard; Products and the Assistant are secondary routes.
- Historical dataset: Olist orders from 2016-09 to 2018-10. A "data as of" freshness badge shows when Gold was last synced.
- Currency is Brazilian real (R$). States and categories come from the dataset as published (Portuguese category names translated to English slugs).
- No user roles: every signed-in workspace user has the same access. Identity comes from Databricks Apps.

## Capabilities and Constraints

- Dashboard: six KPIs (GMV, orders, AOV, distinct customers, average review score, late-delivery rate) for any date range, a sales trend by day or month, breakdowns by category, a Brazil state map (GMV, orders, average order value, freight) with a top-states ranking, plus top products, top sellers and freshness.
- Products: paginated, searchable and filterable list; create, edit (optimistic concurrency with a version number), soft delete, and permanent delete. Writes are audited with the operator's email.
- Assistant: a supervisor agent that answers KPI, state and product questions, routes analysis to Genie (results as a table, bklit chart or state map, with the SQL Genie ran), and proposes create, update or deactivate actions that wait for an approval card. Writes from the assistant are audited with the operator's email and the `agent` channel.
- KPIs are never recomputed in the browser.
- Built on Databricks Free Edition: one app, cold starts after the 24 h auto-stop are possible.

## Brand Commitments

- Name: Olist Store.
- Interface copy is in English.
- The look follows the Olist brand the dataset comes from (D18): light theme, Olist blue, navy ink and Plus Jakarta Sans, with micro-animations, optimized for data visualization and administration. It uses typeset text, not Olist logo artwork.

## Evidence on Hand

Real data only: the Olist public dataset (CC BY-NC-SA 4.0), about 99k orders, 33k products and 3k sellers. No testimonials, customers or benchmarks exist and none may be invented.

## Product Principles

1. Numbers first: the operator's first glance answers "how is the business doing".
2. Trust through exactness: show the source and freshness, and never show a value that the API did not return.
3. Fast hands: catalog tasks complete in a few keystrokes, with clear conflict and error recovery.
4. Quiet by default, responsive on action: motion confirms what the operator did.

## Accessibility & Inclusion

WCAG AA contrast on the light theme, visible keyboard focus, labelled controls, and charts that never rely on color alone (the state map has a numeric legend, tooltips and a ranking or table view).
