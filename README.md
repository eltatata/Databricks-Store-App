# Olist Store — Databricks POC

A learning proof of concept on Databricks Free Edition that takes a real e-commerce dataset from raw CSVs to an operator app with an AI assistant:

- **Data:** the Olist public dataset goes through a Medallion pipeline (Bronze → Silver → Gold) in Unity Catalog, built with Lakeflow Spark Declarative Pipelines.
- **Serving:** Gold tables sync into Lakebase Postgres. A Genie space answers natural-language questions over the same Gold tables.
- **App:** `store-app` is one AppKit app (TypeScript, Express and React) with:
  - a KPI dashboard and product CRUD, both read from Lakebase only;
  - Explore, which talks to Genie;
  - an Assistant, a supervisor agent with Genie and catalog tools; every change it proposes waits for human approval.

```text
CSV ─▶ UC Volume ─▶ Bronze ─▶ Silver ─▶ Gold ──┬─▶ Lakebase serving.* ─▶ Dashboard, Products ┐
                                               │   Lakebase app.products ◀─▶ CRUD, agent tools ├─ store-app
                                               └─▶ Genie space ─▶ Explore, ask_analytics ───────┘
```

## Documentation

| Document | Content |
|----------|---------|
| [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) | The contract: locked decisions D1–D17, phases and exit gates, with amendments recorded in place |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Rebuild from a clean clone, refresh data, restart after the 24 h auto-stop, local development, cost |
| [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) | Symptoms, causes and fixes found while building |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | As-built state of every component |
| [`docs/DATASET.md`](docs/DATASET.md), [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md), [`docs/KPIS.md`](docs/KPIS.md) | Dataset, Medallion model, KPI formulas and reconciliations |
| [`docs/AGENT.md`](docs/AGENT.md) | Genie benchmark, supervisor tools, human approval, agent evals |
| [`docs/ENVIRONMENT_AUDIT.md`](docs/ENVIRONMENT_AUDIT.md) | Free Edition findings per phase |
| [`docs/FINAL_REPORT.md`](docs/FINAL_REPORT.md) | Final report: resources, results, limitations, costs |
| [`app/DESIGN.md`](app/DESIGN.md), [`app/PRODUCT.md`](app/PRODUCT.md) | Visual system and product context of the app |
| [`CLAUDE.md`](CLAUDE.md) | Working rules for coding agents |

## Repository layout

| Folder | Content |
|--------|---------|
| `data/` | `store-data` bundle: schemas, landing volume, SDP pipeline (SQL), `olist-refresh` job with the `reconcile_gold` task (Python) |
| `serving/` | `store-serving` bundle: Lakebase project, synced tables, Genie space (`genie/olist-store.geniespace.json`), `olist-serving-refresh` job |
| `platform/` | What DABs cannot express: `CREATE CATALOG` SQL and Lakebase grants and indexes through `lakebase/run-sql.ts` |
| `app/` | AppKit app. Server: `server/` (layered MVC, Drizzle, Zod, OpenAPI, the agent and the store-tools plugin). Client: `client/` (React, shadcn/ui, bklit charts). Tests: `tests/`. |
| `scripts/` | Deployment steps, run in the order given in `docs/DEPLOYMENT.md` |

## Prerequisites

- Databricks CLI ≥ 1.20.0 with an OAuth profile (`databricks auth login --host <workspace-url> --profile <profile>`)
- Node.js ≥ 24 and pnpm 11
- Python ≥ 3.10 with `uv`
- Git Bash on Windows
- The Olist CSVs downloaded manually into `.local/olist/` (git-ignored)

## Quick start

```bash
cp .env.example .env              # fill in the profile, warehouse and ids
bash scripts/catalog-create.sh
bash scripts/data-deploy.sh && bash scripts/dataset-upload.sh && bash scripts/data-run.sh
bash scripts/serving-deploy.sh && bash scripts/serving-run.sh
bash scripts/app-deploy.sh && bash scripts/app-grant-serving.sh
```

`docs/DEPLOYMENT.md` covers each step, the one-time product seed and verification.

## Tests

| Suite | Command (in `app/`) |
|-------|---------------------|
| Server and client unit/component tests (vitest) | `pnpm test` |
| Full AppKit validation (typegen, lint, typecheck, build, tests) | `databricks apps validate --profile <profile>` |
| Smoke test, local or deployed (Playwright with the installed Chrome) | `pnpm test:smoke` |
| Agent evals against a running app | `npx appkit agent eval --url <app-url>` |
| Job helper tests | `cd data && uv run pytest`, `cd serving && uv run pytest` |

## License

The code is a learning project. The Olist dataset is licensed CC BY-NC-SA 4.0 by Olist and is not included in this repository.
