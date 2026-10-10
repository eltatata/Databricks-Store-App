# Final report

The structure follows `IMPLEMENTATION_PLAN.md` §11. Every number below was measured on 2026-10-10 against workspace `dbc-30d38ab3-5111` (profile `local-dev`), unless the row names an earlier phase.

## 1. Features, files and tests

| Area | What was built | Where |
|------|----------------|-------|
| Medallion pipeline | 8 Bronze streaming tables (Auto Loader), 7 Silver tables + 7 quarantine tables with expectations, 9 Gold materialized views | `data/pipeline/`, `data/resources/` |
| Orchestration | `olist-refresh` (pipeline → `reconcile_gold`), `olist-serving-refresh` (`refresh_synced_tables` → `reconcile_lakebase`) | `data/jobs/`, `serving/jobs/` |
| Lakebase | Project `store-app`, 7 synced tables in schema `serving` sharing one pipeline, writable schema `app` (products, audit log) owned by the app service principal | `serving/resources/`, `platform/lakebase/`, `app/server/database/` |
| Genie | Space `Olist Store Analytics` over 7 Gold tables, with instructions, synonyms and 10 benchmark questions | `serving/genie/olist-store.geniespace.json` |
| Backend | REST API `/api/v1`: health, dashboard (summary, trend, breakdowns, top products/sellers, freshness), products CRUD with optimistic concurrency and audit, admin seed. Swagger at `/api/v1/docs`. | `app/server/` |
| Frontend | Dashboard, Products (list, sheet form, detail), Explore (Genie), Assistant (agent with approval cards); dark "Elenco Sleeve" design system | `app/client/src/`, `app/DESIGN.md` |
| Agent | Supervisor markdown agent; `ask_analytics` (Genie); 6 Lakebase tools in the `store-tools` plugin; approval for every mutation; 12 evals | `app/server/agents/supervisor/`, `app/server/plugins/store-tools/` |

| Test suite | Command | Result (2026-10-10) |
|------------|---------|---------------------|
| Server unit tests (vitest) | `cd app && pnpm test` | 59 passed |
| Client component tests (vitest + Testing Library) | same run | 38 passed |
| AppKit validation | `databricks apps validate --profile local-dev` | typegen, ast-grep, typecheck, build, tests: all passed |
| Smoke test (Playwright), local | `pnpm test:smoke` | 5/5 passed |
| Smoke test, deployed app | `SMOKE_BASE_URL=<app-url> SMOKE_BEARER_TOKEN=… pnpm test:smoke` | 5/5 passed |
| Agent evals | `npx appkit agent eval --url http://localhost:8000` | 12/12 passed (2026-10-09) |
| Data job helpers (pytest) | `cd data && uv run pytest` | 15 passed |
| Serving job helpers (pytest) | `cd serving && uv run pytest` | 4 passed |
| Gold reconciliation | `bash scripts/data-run.sh` | 38/38 checks passed |
| Lakebase reconciliation | `bash scripts/serving-run.sh` | 12/12 checks passed |

## 2. Databricks resources

| Resource | Name / id | State |
|----------|-----------|-------|
| Catalog | `data_engineering` (schemas `bronze`, `silver`, `gold`, `serving`; volume `bronze.landing`) | Active |
| Pipeline | `olist-medallion` (`df2f6852-3564-4c1b-b8d9-c41f44dc2be9`), serverless | Idle between runs |
| Jobs | `olist-refresh` (160645848957883), `olist-serving-refresh` (589845525371467) | Manual trigger, no schedule |
| Lakebase project | `store-app`, PG 17, branch `production`, 0.5–2 CU, suspends after 300 s idle | Active |
| Synced tables | 7 tables in `data_engineering.serving` / Postgres `serving`, one shared pipeline | Online, Snapshot mode |
| Genie space | `Olist Store Analytics` (`01f1c43f76fc1b69b5abaaba83365398`) on Serverless Starter Warehouse | Active |
| App | `store-app`, service principal `6994efca-9844-4973-a470-adf10181105f`, resources: Lakebase `postgres`, `genie-space` (CAN_RUN), `agents-serving-endpoint` (CAN_QUERY) | RUNNING |
| Model endpoint | `databricks-qwen3-next-80b-a3b-instruct` (pay-per-token Foundation Model API) | Reused, not created |

Not part of this project: the workspace also contains resources that existed before Phase 0 (`New Job 2026-08-21…`, `bronze_to_silver_to_gold_job`, `bronze to silver to gold pipeline`, Genie space `User Signup and Referral Analysis`). They were not modified.

## 3. Data

**Source:** [Olist Brazilian E-Commerce Public Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce), CC BY-NC-SA 4.0. It holds 8 CSVs. The geolocation file is not ingested.

| Entity | Bronze | Silver | Quarantine |
|--------|--------|--------|------------|
| orders | 99,441 | 99,441 | 0 |
| order_items | 112,650 | 112,650 | 0 |
| order_payments | 103,886 | 103,886 | 0 |
| order_reviews | 99,224 | 99,224 | 0 |
| customers | 99,441 | 99,441 | 0 |
| sellers | 3,095 | 3,095 | 0 |
| products | 32,951 | 32,951 | 0 |
| category_translations | 71 | 71 | — |

| Gold table | Rows | Lakebase `serving` | Reconciliation |
|------------|------|--------------------|----------------|
| fact_sales | 112,650 | not synced | Σ price of valid sales = Silver GMV R$13,494,400.74 |
| fact_orders | 99,441 | not synced | 98,199 valid orders |
| kpi_daily | 614 | 614 | Σ GMV R$13,494,400.74 in Gold and Lakebase |
| dim_product | 32,951 | 32,951 | = Silver products |
| sales_by_category_month | 1,282 | 1,282 | Σ GMV matches |
| sales_by_state_month | 558 | 558 | Σ GMV matches |
| product_performance | 32,729 | 32,729 | Σ GMV matches |
| seller_performance | 3,053 | 3,053 | Σ GMV matches |
| customer_activity_daily | 97,269 | 97,269 | 94,983 distinct valid customers |

Idempotency was checked on 2026-10-10:
- **What ran:** both jobs again, with no new files.
- **Unity Catalog:** the Bronze and Gold counts are identical before and after.
- **Lakebase:** the `serving` counts and Σ GMV are identical.
- **`app.products`:** 32,951 rows, the same Σ list price (R$4,739,722.11) and the same `max(updated_at)`, so the sync never touches app data (D4).

**Freshness:** the dashboard badge reads "Data through Sep 3, 2018", the last valid order date.

## 4. App

| Item | Value |
|------|-------|
| URL | https://store-app-7474654237354266.aws.databricksapps.com |
| Deployment | 2026-10-10, `databricks apps deploy`; startup log shows `Agents (1)` and `API routes registered`. The SIGTERM fix was confirmed in Phase 7 (`Graceful shutdown complete`). |
| Health | `GET /api/v1/health` → database `up` (smoke test) |
| Identity | Platform headers only (`x-forwarded-email`, user token); no roles (D6) |

## 5. AI

| Item | Value |
|------|-------|
| Model | `databricks-qwen3-next-80b-a3b-instruct`, temperature 0.1, at most 12 steps, 20 tool calls per run |
| Genie benchmark | 10/10 questions answered correctly (Phase 5, `docs/AGENT.md`) |
| Genie through the agent | Top categories by GMV for 2017 and 2018 match hand-written SQL on `gold.sales_by_category_month` exactly |
| Lakebase tools through the agent | H1 2018: GMV R$5,614,133.04, 40,876 orders, AOV R$137.35, equal to `gold.kpi_daily` |
| Tools | `ask_analytics`, `get_kpi_summary`, `search_products`, `get_product` (read); `create_product` (write), `update_product` (update), `deactivate_product` (destructive) |
| HITL | Every write/update/destructive call waits for an approval card from the user who opened the stream; no decision in 120 s auto-denies |
| Evals | 12/12: routing (Genie vs Lakebase), clarification, approval on each mutation, refusal of permanent delete and out-of-scope requests |

Deployed approval run on 2026-10-10. Each step went through `/api/agents/chat` and `/api/agents/approve` as the signed-in user:

| Step | Outcome |
|------|---------|
| "Create a product called Agent Smoke Lamp …", approved | Product created (version 1); audit `create`, channel `agent`, the user's email |
| "Deactivate the product Agent Smoke Lamp", approved | The agent searched, then deactivated it (version 2); audit `deactivate`, channel `agent` |
| Price change on a catalog product, denied | Price, version and status unchanged; no audit row |
| Cleanup | Test product deleted permanently through the REST API (audit `delete`, channel `ui`); 0 rows left |

E2E acceptance (§9):

| # | Check | Result |
|---|-------|--------|
| 1 | Upload CSVs, run the job, all tasks succeed | ✅ CSVs uploaded in Phase 1; `olist-refresh` succeeded again on 2026-10-10 |
| 2 | Gold and Lakebase reconciliations pass | ✅ 38/38 and 12/12 |
| 3 | Dashboard loads with the freshness badge | ✅ Deployed smoke test |
| 4 | Product CRUD from the UI, audit checked | ✅ Phase 7, deployed UI: create, edit, version conflict, deactivate, reactivate, delete; 7 audit rows |
| 5 | Explore answers a question that matches SQL | ✅ Genie benchmark, plus the category ranking above |
| 6 | Assistant: create → approve → row exists; deny → no row | ✅ Deployed run above; deny also verified from the local UI |
| 7 | Assistant: deactivate → approval → soft delete | ✅ Deployed run above |
| 8 | Job re-run: no duplicate growth, `app.products` untouched | ✅ Counts identical |
| 9 | Smoke test and `databricks apps validate` pass | ✅ |

## 6. Identity, secrets and known limitations

Identity and secrets:
- **Service principal:** the app service principal owns schema `app`, reads `serving`, and calls the model.
- **User scope:** Genie calls and the store tools run in the requesting user's scope (`user_api_scopes: [genie]`), so assistant writes are audited with the real user.
- **Secrets:** no secret lives in the repository. Lakebase uses OAuth credentials that AppKit refreshes, and the CLI uses OAuth profiles. `.env` files are git-ignored.

Known limitations:
- **Roles:** none by design (D6). Every user who can open the app can do everything, including approving the assistant's changes in their own session.
- **Threads:** agent conversations live in memory and are lost on restart or redeploy.
- **Model behavior:** the model can still pick a wrong premise; on 2026-10-10 it claimed an inactive product had to be reactivated before a price change. The routing policy was corrected in commit `0247911`. That fix ships with the next deploy and must be checked on the deployed app with a test product.
- **Write-back:** app edits to products do not flow back to Gold (D4); write-back is a stretch goal.
- **Product names:** they are synthetic, because the dataset has no product names.

## 7. Blocked items and Free Edition limits

| Limit | Impact | Handling |
|-------|--------|----------|
| DABs `catalogs` fails on Default Storage | Catalog cannot be bundle-managed | SQL `CREATE CATALOG` script (D15) |
| Apps auto-stop 24 h after start | App unavailable the next day | Restart runbook in `DEPLOYMENT.md` §7 |
| 3 apps per account | One monolith app | No separate MCP or frontend app (D7) |
| One active pipeline at a time | Synced tables could need several pipelines | All 7 synced tables share one pipeline |
| Synced tables added during a pipeline start stay offline | First sync incomplete | Run the serving refresh job again |
| Serving endpoint rejects JSON Schema `pattern` | Agent tool schemas cannot carry regexes | Plain LLM schemas plus Zod validation inside each tool |
| Supervisor API end of life, no Agent Bricks Supervisor on Free Edition | No managed supervisor | AppKit `agents()` with a serving endpoint (D2) |

## 8. Costs and cleanup

| Consumer | Notes | How to stop it |
|----------|-------|----------------|
| App compute | Runs until the 24 h auto-stop | `databricks apps stop store-app --profile local-dev` |
| Lakebase | 0.5–2 CU, suspends after 300 s idle | Idle suspension; the project and data stay |
| Pipeline and jobs | Serverless; on demand only | Not scheduled |
| SQL warehouse | Serverless Starter, used by Genie and SQL scripts | Auto-stop after 10 min |
| Model endpoint | Pay per token, called only by the Assistant | Stops with the app |

Nothing was deleted except the test products created during verification. `bundle destroy`, app deletion and dropping the catalog are left to the operator.
