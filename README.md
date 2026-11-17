# Olist Store on Databricks

An end-to-end Databricks project on Free Edition that takes a real e-commerce dataset from raw CSVs to an operator app with an AI assistant:

- **Data:** the Olist public dataset goes through a Medallion pipeline (Bronze → Silver → Gold) in Unity Catalog, built with Lakeflow Spark Declarative Pipelines and reconciled by Lakeflow Jobs.
- **Serving:** Gold tables sync into Lakebase Postgres. A Genie space answers natural-language questions over the same Gold tables.
- **App:** `store-app` is one AppKit app (TypeScript, Express and React) with:
  - a KPI dashboard with a Brazil state map, and product CRUD, both read from Lakebase only;
  - one chat, the Assistant: a supervisor agent with Genie as its analytics sub-agent plus Lakebase tools, answering with figures, charts and maps; every change it proposes waits for human approval;
  - light and dark themes on shadcn/ui and bklit charts.

```text
CSV ─▶ UC Volume ─▶ Bronze ─▶ Silver ─▶ Gold ──┬─▶ Lakebase serving.* ─▶ Dashboard, Products ┐
                                               │   Lakebase app.products ◀─▶ CRUD, agent tools ├─ store-app
                                               └─▶ Genie space ─▶ ask_analytics (Assistant) ────┘
```

## Documentation

| Document | Content |
|----------|---------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Components, design principles, identity, platform constraints and known limitations |
| [`docs/DATASET.md`](docs/DATASET.md) | Source, license, files and caveats of the Olist dataset |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Bronze, Silver and Gold tables, orchestration, Lakebase `serving` and `app` schemas |
| [`docs/KPIS.md`](docs/KPIS.md) | KPI formulas, reconciliation rules and reference values |
| [`docs/AGENT.md`](docs/AGENT.md) | Genie space and benchmark, supervisor tools, human approval, routing notes and evals |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Rebuild from a clean clone, refresh data, restart after the auto-stop or Lakebase inactivity, local development, cost |
| [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) | Symptoms, causes and fixes |
| [`app/README.md`](app/README.md) | App structure, scripts and local development |
| [`CLAUDE.md`](CLAUDE.md) | Conventions and working rules for coding agents |

## Repository layout

| Folder | Content |
|--------|---------|
| `data/` | `store-data` bundle: schemas, landing volume, SDP pipeline (SQL), `olist-refresh` job with its Python tasks |
| `serving/` | `store-serving` bundle: Lakebase project, synced tables, Genie space, `olist-serving-refresh` job |
| `platform/` | What bundles cannot express: `CREATE CATALOG` SQL, and Lakebase grants and indexes applied through `lakebase/run-sql.ts` |
| `app/` | AppKit app. Server in `server/` (layered REST API, Drizzle, Zod, OpenAPI, agent and `store-tools` plugin), client in `client/` (React, shadcn/ui, bklit), tests in `tests/` |
| `scripts/` | Deployment entry points, run in the order given in `docs/DEPLOYMENT.md` |
| `.claude/skills/` | Agent skills for Databricks, frontend and backend work (see `CLAUDE.md`) |

## Prerequisites

- Databricks CLI ≥ 1.20.0 with an OAuth profile (`databricks auth login --host <workspace-url> --profile <profile>`)
- Node.js ≥ 24 and pnpm 11
- Python ≥ 3.10 with `uv`
- Git Bash on Windows
- The Olist CSVs downloaded manually into `.local/olist/` (git-ignored)

## Quick start

```bash
cp .env.example .env              # fill in the profile and warehouse id
bash scripts/catalog-create.sh
bash scripts/data-deploy.sh && bash scripts/dataset-upload.sh && bash scripts/data-run.sh
bash scripts/serving-deploy.sh && bash scripts/serving-run.sh
bash scripts/app-deploy.sh && bash scripts/app-grant-serving.sh
```

`docs/DEPLOYMENT.md` covers each step, the one-time product seed and verification.

## Tests

| Suite | Command |
|-------|---------|
| Server and client unit and component tests (vitest) | `cd app && pnpm test` |
| Full AppKit validation (typegen, lint, typecheck, build, tests) | `cd app && databricks apps validate --profile <profile>` |
| Smoke test, local or deployed (Playwright with the installed Chrome) | `cd app && pnpm test:smoke` |
| Agent evals against a running app | `cd app && npx appkit agent eval --url <app-url>` |
| Job task tests | `cd data && uv run pytest`, `cd serving && uv run pytest` |
| Gold and Lakebase reconciliation | `bash scripts/data-run.sh`, `bash scripts/serving-run.sh` |

## License

The Olist dataset is licensed CC BY-NC-SA 4.0 by Olist and is not included in this repository.
