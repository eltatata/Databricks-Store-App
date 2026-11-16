# Deployment

This runbook rebuilds the whole POC from a clean clone on a Databricks Free Edition workspace. The order matters:
- the `serving/` bundle needs Gold tables to exist;
- the app needs Lakebase and the Genie space;
- the grants need the app's service principal.

Every script reads `.env` and passes `--profile $DATABRICKS_PROFILE` to the CLI.

## 1. Prerequisites

| Tool | Version used | Notes |
|------|--------------|-------|
| Databricks CLI | ≥ 1.20.0 | OAuth profile: `databricks auth login --host <workspace-url> --profile <profile>` |
| Node.js | ≥ 24 | Used by the app and by `platform/lakebase/run-sql.ts` |
| pnpm | 11 | `corepack enable` |
| Python | ≥ 3.10 with `uv` | Job helpers and their tests |
| Git Bash | any | Scripts are POSIX shell; on Windows run them from Git Bash |

The dataset is downloaded manually from Kaggle (`olistbr/brazilian-ecommerce`, CC BY-NC-SA 4.0) into `.local/olist/`. That folder is git-ignored (D17).

## 2. Configure

```bash
cp .env.example .env
```

| Variable | Meaning |
|----------|---------|
| `DATABRICKS_PROFILE` | CLI profile; never auto-selected |
| `CATALOG` | Unity Catalog catalog (`data_engineering`) |
| `WAREHOUSE_ID` | SQL warehouse for `CREATE CATALOG` and Genie (`databricks warehouses list`) |
| `LAKEBASE_PROJECT_ID`, `LAKEBASE_BRANCH_ID`, `LAKEBASE_DATABASE` | `store-app`, `production`, `databricks_postgres` |
| `GENIE_SPACE_ID` | Filled after step 6 |
| `APP_NAME` | `store-app` |
| `LOCAL_DATASET_DIR` | `.local/olist` |

## 3. Data platform

| Step | Command | Result |
|------|---------|--------|
| 3.1 Catalog | `bash scripts/catalog-create.sh` | `data_engineering` created by SQL. The DABs `catalogs` resource fails on Default Storage (D15). |
| 3.2 Schemas, volume, pipeline, job | `bash scripts/data-deploy.sh` | `store-data` bundle deployed |
| 3.3 Dataset | `bash scripts/dataset-upload.sh` | 8 CSVs in `/Volumes/data_engineering/bronze/landing/olist/<entity>/` |
| 3.4 Build Bronze → Silver → Gold | `bash scripts/data-run.sh` | `olist-refresh` job: pipeline update, then `reconcile_gold` (exact match against the CSV counts and Silver) |

## 4. Serving layer

| Step | Command | Result |
|------|---------|--------|
| 4.1 Lakebase, synced tables, Genie space, refresh job | `bash scripts/serving-deploy.sh` | `store-serving` bundle: project `store-app`, 7 synced tables sharing one pipeline, Genie space `Olist Store Analytics` |
| 4.2 First sync | `bash scripts/serving-run.sh` | `olist-serving-refresh`: `refresh_synced_tables`, then `reconcile_lakebase`. Run it again if a table stays `SYNCED_TABLE_OFFLINE` after creation (see Troubleshooting). |
| 4.3 Genie space id | `databricks genie list-spaces --profile <profile>` | Copy the id into `.env` (`GENIE_SPACE_ID`) and into `app/databricks.yml` (`genie_space_id`) |

## 5. App

| Step | Command | Result |
|------|---------|--------|
| 5.1 Install | `cd app && pnpm install` | |
| 5.2 Validate | `databricks apps validate --profile <profile>` | Typegen, ast-grep lint, typecheck, build and the vitest suite |
| 5.3 Deploy | `bash scripts/app-deploy.sh` (asks for confirmation; `--yes` skips it) | `databricks apps deploy` validates, deploys and starts the app. On start, the service principal applies the Drizzle migrations and owns schema `app`. |
| 5.4 Grants and indexes | `bash scripts/app-grant-serving.sh` | `serving` indexes plus `SELECT` for the app service principal. Needed once per app or synced-table creation. |
| 5.5 Seed the catalog | `POST /api/v1/admin/seed-products` with `{"confirm": true}` (Swagger at `/api/v1/docs`) | Copies `serving.dim_product` into `app.products` (32,951 rows). Run it once. |

Check the deployment:

```bash
databricks apps get store-app --profile <profile> -o json   # app_status.state = RUNNING, url
databricks apps logs store-app --profile <profile>          # "API routes registered", "Agents (1)"
```

Then run the smoke test against the deployed URL. The OAuth token stays in the environment and is never printed:

```bash
cd app
SMOKE_BEARER_TOKEN=$(databricks auth token --profile <profile> -o json | python -c "import json,sys;print(json.load(sys.stdin)['access_token'])") \
SMOKE_BASE_URL=https://<app-url> pnpm test:smoke
```

## 6. Refreshing data later

1. Upload new CSVs to the landing volume (step 3.3). Auto Loader only picks up new files.
2. `bash scripts/data-run.sh`, then `bash scripts/serving-run.sh`.
3. `app.products` is never touched by the sync (D4). Products created or edited in the app stay as they are.

## 7. Restart after the 24 h auto-stop

Free Edition stops every app 24 h after it starts or is redeployed. The data and Lakebase are not affected.

```bash
databricks apps start store-app --profile <profile>
databricks apps get store-app --profile <profile> -o json   # wait for RUNNING
```

The first request after a start can take a few seconds while the Lakebase compute resumes from suspension. Agent threads live in memory and do not survive the restart.

## 8. Local development

```bash
cd app
cp .env.example .env   # first time only: fill in PGUSER, PGHOST, DATABRICKS_GENIE_SPACE_ID, DEV_USER_EMAIL
pnpm run dev
```

`app/.env` sets `NODE_ENV=development` and `PGUSER`, so `pnpm run dev` works the same in any shell on Windows, macOS and Linux. The app runs on http://localhost:8000.

Notes:
- **`NODE_ENV=development` is required.** Without it the server runs in production mode: it looks for a built `dist/` and rejects API calls that carry no user token. In production, `app/app.yaml` sets `NODE_ENV=production` and the deployed app does not read `.env`.
- **`PGUSER`** is your workspace email. Without it Lakebase rejects the connection.
- **Data:** local development connects to the production Lakebase branch with your identity. Do not create or edit products from a local session.
- **Agent:** approvals work the same as in the deployed app. Editing `server/agents/supervisor/agent.md` does not restart `pnpm run dev`; restart it to load new instructions.
- **Local cache warning:** at startup AppKit logs `must be owner of table appkit_cache_entries`. The table belongs to the app service principal; the local server still works.

| Check | Command |
|-------|---------|
| Unit and component tests | `pnpm test` |
| Smoke test (server running) | `pnpm test:smoke` |
| Agent evals (server running) | `AGENT_APPROVAL_TIMEOUT_MS=15000` in `app/.env`, then `npx appkit agent eval --url http://localhost:8000 --concurrency 3` |
| Rebuild the Brazil states GeoJSON | `pnpm run geo:brazil` (downloads Natural Earth 1:50m admin-1, writes `client/src/assets/geo/brazil-states.json`; only needed to change the geometry) |

Adding or updating a bklit chart: run `npx shadcn@latest add @bklit/<chart>` from `app/` (the registry is `bklit.com/r`). The CLI writes to `app/components` and `app/lib` and appends tokens to `index.css`. Copy the chart files into `client/src/components/charts`, delete the stray folders, keep only `--color-chart-*` mappings in `index.css` (no `.dark` block), map new `--chart-*` tokens to the Olist palette, and run `pnpm run lint:ast-grep` (no `as unknown as`).

## 9. Cost and cleanup

| Consumer | How to stop it |
|----------|----------------|
| App compute | `databricks apps stop store-app --profile <profile>` |
| Lakebase compute | Suspends after 300 s idle (0.5–2 CU autoscaling); the project stays |
| Pipelines and jobs | No schedules; they run only when triggered |
| SQL warehouse (Genie, catalog SQL) | Serverless Starter Warehouse, auto-stop after 10 min |

Removing resources (`bundle destroy`, deleting the app, dropping the catalog) is destructive and is left to the operator. Nothing in this repository deletes them.
