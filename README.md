# Olist Store — Databricks POC

Learning proof of concept on Databricks Free Edition:
- an Olist e-commerce dataset processed through a Medallion pipeline in Unity Catalog;
- Gold data served from Lakebase;
- an AppKit app with KPI dashboards, product CRUD, and a supervisor agent that uses a Genie Agent and CRUD tools.

- Implementation contract: [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)
- Working rules for coding agents: [`CLAUDE.md`](CLAUDE.md)
- Environment findings: [`docs/ENVIRONMENT_AUDIT.md`](docs/ENVIRONMENT_AUDIT.md)

## Prerequisites
- Databricks CLI ≥ 1.20.0, authenticated with OAuth (`databricks auth login --host <workspace-url> --profile <profile>`)
- Node.js ≥ 24 and pnpm
- Python ≥ 3.10 with `uv`
- `psql` client, `kaggle` CLI (or a manual dataset download), `shellcheck`

## Setup
1. `cp .env.example .env` and fill in the values.
2. Run the steps in `scripts/` in the order described in `docs/DEPLOYMENT.md`. That document is written as the phases are implemented.
