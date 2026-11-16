# Architecture

The target design and its rationale are in `IMPLEMENTATION_PLAN.md` (§0 decisions, §6.2 diagram). This document tracks the **as-built** state and is updated at the end of every block.

## As-built status

| Component | State |
|-----------|-------|
| Repository scaffolding | Created (Phase 0) |
| UC catalog, schemas, volume | Created: catalog `data_engineering` (SQL), schemas `bronze`/`silver`/`gold`/`serving` and volume `bronze.landing` (DAB) |
| SDP pipeline (Bronze → Silver → Gold) | Deployed and verified: `olist-medallion` (8 Bronze, 7 Silver + quarantine, 8 Gold) |
| Refresh jobs | Deployed and verified: `olist-refresh` (data) and `olist-serving-refresh` (refresh_synced_tables → reconcile_lakebase) |
| Lakebase project and synced tables | Deployed and verified: project `store-app` (PG 17), 7 synced tables in Postgres schema `serving` sharing one pipeline, 7 indexes, read grants for the app service principal |
| Genie space | Deployed and verified: `Olist Store Analytics`, 10/10 benchmark answers correct (see `AGENT.md`) |
| App (`store-app`) | Deployed and verified (backend): AppKit 0.84, `/api/v1` REST API (health, dashboard, products CRUD, admin seed), Swagger at `/api/v1/docs`, Drizzle migrations applied by the service principal, `app.products` seeded with 32,951 products. Frontend deployed (Phase 7); create, edit, version conflict, deactivate, reactivate and permanent delete verified from the deployed UI with audit rows |
| Frontend | React 19 + React Router 7 (lazy routes), TanStack Query, Zustand, shadcn/ui (Radix) and bklit charts (area, bar, axes, choropleth; refreshed from `bklit.com/r` on 2026-11-16). Pages: Dashboard (with the Brazil state map), Products (list, sheet form, detail), Assistant (`useAgentChat`, approval cards, allowlisted result views: KPI figures, product table, state map, Genie table/chart/map). The Explore page was removed (D19); `/explore` redirects to `/assistant`. Visual system in `app/DESIGN.md`: Olist brand, light theme, Plus Jakarta Sans (D18). Brazil states GeoJSON built by `app/scripts/build-brazil-states.ts` from Natural Earth (public domain) |
| Supervisor agent | Deployed and verified (Phase 8): markdown agent with Genie and 7 Lakebase tools (`get_sales_by_state` added in block G) from the `store-tools` plugin, approval for every mutation, 15/15 evals (2026-11-16, local). On the deployed app, an approved create and deactivate wrote audit rows with channel `agent` and the user's email; a denied update changed nothing (see `AGENT.md`, `FINAL_REPORT.md`) |

## Environment-driven choices

| Choice | Value | Source |
|--------|-------|--------|
| Catalog | `data_engineering` (new) | `ENVIRONMENT_AUDIT.md` |
| SQL warehouse | Serverless Starter Warehouse (2X-Small) | `ENVIRONMENT_AUDIT.md` |
| Agent model | `databricks-qwen3-next-80b-a3b-instruct`, fallback `databricks-llama-4-maverick` (D16) | `ENVIRONMENT_AUDIT.md` |
| Model binding | `serving_endpoint` resource (Unity Gateway not enforced) | `ENVIRONMENT_AUDIT.md` |
