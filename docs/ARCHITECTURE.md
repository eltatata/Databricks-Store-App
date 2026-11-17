# Architecture

```text
Kaggle CSVs ─► UC Volume ─► SDP pipeline: Bronze ─► Silver ─► Gold   (Unity Catalog)
                                                          │
                                  synced tables (Snapshot) │            Genie space
                                                          ▼                 ▲
                  Lakebase: serving.* (read-only)   app.* (owned by the app)│
                                  ▲                        ▲                │
┌───────────────────────── Databricks App "store-app" (AppKit) ────────────┼──────────┐
│ /api/v1/*   routes → middlewares → controllers → services → queries      │          │
│   dashboard ─► serving.*          products ─► app.products + app.audit_log│          │
│ /api/v1/docs  Swagger UI (OpenAPI generated from Zod)                    │          │
│ agents()  /api/agents/*  ─► supervisor agent                             │          │
│   tools: ask_analytics (Genie) ──────────────────────────────────────────┘          │
│          get_kpi_summary · get_sales_by_state · search/get_product (read)           │
│          create/update/deactivate_product (approval required)                       │
│ React client: Dashboard · Products · Assistant (shadcn/ui + bklit charts)            │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

## Components

| Component | What it is | Source |
|-----------|-----------|--------|
| Catalog | `data_engineering` with schemas `bronze`, `silver`, `gold`, `serving` and volume `bronze.landing` | `platform/workspace/catalog.sql`, `data/resources/` |
| Pipeline | `olist-medallion`, one serverless Lakeflow Spark Declarative Pipeline in SQL: 8 Bronze streaming tables, 7 Silver tables plus quarantine, 9 Gold materialized views | `data/pipeline/` |
| Jobs | `olist-refresh` (ingest check → pipeline → `reconcile_gold`) and `olist-serving-refresh` (`refresh_synced_tables` → `reconcile_lakebase`), manual trigger | `data/`, `serving/` |
| Lakebase | Project `store-app` (Postgres 17, branch `production`), 7 synced tables in schema `serving` sharing one sync pipeline, plus the app-owned schema `app` | `serving/resources/lakebase.yml`, `platform/lakebase/`, `app/server/database/` |
| Genie space | `Olist Store Analytics` over the Gold tables, with KPI instructions, synonyms, example SQL and benchmarks | `serving/genie/olist-store.geniespace.json` |
| App | `store-app`: AppKit (Express + React) with the `server`, `lakebase`, `genie` and `agents` plugins and the local `store-tools` plugin | `app/` |
| Agent | Supervisor markdown agent with Genie as its analytics sub-agent and Lakebase tools; every mutation waits for human approval | `app/server/agents/supervisor/`, `app/server/plugins/store-tools/` |

Details: data layers in [`DATA_MODEL.md`](DATA_MODEL.md), KPI formulas in [`KPIS.md`](KPIS.md), agent and Genie in [`AGENT.md`](AGENT.md).

## Design principles

| Principle | Consequence |
|-----------|-------------|
| One app | Server, client, agent and tools ship as one AppKit app. Free Edition allows 3 apps per account, and a second app (separate frontend or an MCP server) adds nothing here. |
| The app reads only Lakebase | Dashboard and CRUD read `serving.*` and `app.*`. The only path to Unity Catalog is Genie, which queries Gold through its SQL warehouse. The app has no `analytics` plugin and no warehouse reads. |
| Lakebase owns operational products | `app.products` is seeded once from `serving.dim_product`, then managed by the app. App edits do not flow back to Gold, and the data sync never touches `app.*`. |
| One supervisor agent | AppKit `agents()` with a Foundation Model serving endpoint. Genie is a sub-agent (`ask_analytics`); the other tools call the same services as the REST API. No custom router, LangGraph or MCP server. |
| One chat | The Assistant page is the only chat. Genie answers render inside it as allowlisted views (table, bklit chart, state map). `/explore` redirects to `/assistant`. |
| Human approval for every mutation | `create_product`, `update_product` and `deactivate_product` wait for an approval card. Permanent delete is not available to the agent, and there is no SQL tool. |
| No roles | Any user with `CAN_USE` on the app can do everything. Identity (`x-forwarded-email`) is used for audit rows and approval ownership only. |
| Declarative first | Resource specs live in `.yml`, `.json` and `.sql` files. The scripts in `scripts/` only apply them, and every script is idempotent. |
| Three bundles, deployed in order | `data/` → run the data job → `serving/` → `app/`. Each bundle depends on what the previous one built. They are not merged into a root bundle. |

## Identity and secrets

- **Service principal:** the app's service principal runs the Drizzle migrations, so it owns schema `app`. It reads `serving` through explicit grants and calls the model endpoint.
- **User scope:** Genie calls and the `store-tools` plugin run in the requesting user's scope (`user_api_scopes: [genie]`), so audit rows written by the agent carry the real user's email with `channel = 'agent'`.
- **Secrets:** none in the repository. Lakebase uses OAuth credentials that AppKit refreshes, the CLI uses OAuth profiles, and `.env` files are git-ignored. Nothing secret reaches the React bundle.

## Platform constraints

These Free Edition and product behaviors shaped the design. Symptoms and fixes for each are in [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md).

| Constraint | Design response |
|------------|-----------------|
| The DABs `catalogs` resource fails on Default Storage (`INVALID_STATE: Metastore storage root URL does not exist`) | The catalog is created with SQL by `scripts/catalog-create.sh`. Everything else is bundle-managed. |
| Synced tables and the Genie space need their Gold sources to exist | They live in a separate `serving/` bundle, deployed after the data job has built Gold. |
| Few active pipelines on Free Edition | All 7 synced tables share one sync pipeline (`existing_pipeline_id`). |
| Lakebase compute suspends after idle time, and the endpoint is **disabled** after a few days without activity | Idle suspension resumes on the next request. A disabled endpoint must be re-enabled through the API before the app can start (see `DEPLOYMENT.md`, restart after inactivity). |
| Apps stop 24 h after start or redeploy | Restart runbook in `DEPLOYMENT.md`. Agent threads live in memory and are lost on restart. |
| No proprietary models on the workspace; the serving endpoint rejects the JSON Schema `pattern` keyword | The agent uses `databricks-qwen3-next-80b-a3b-instruct` (fallback `databricks-llama-4-maverick`). LLM-facing tool schemas use plain types, and each tool re-validates with the REST Zod schemas. |
| A hand-rolled AppKit `tool()` runs as the service principal with no user identity | Lakebase tools live in the `store-tools` ToolProvider plugin, which runs in the caller's scope. |
| `appkit.lakebase.pool` cannot run Drizzle transactions | Drizzle uses its own `pg.Pool` built from `appkit.lakebase.getPgConfig()`, which keeps AppKit's OAuth token refresh. |
| `psycopg[binary]` aborts on the serverless job runtime | `reconcile_lakebase` uses the pure-Python `pg8000` driver. |
| Agent Bricks Supervisor is not available on Free Edition, and the Supervisor API reached end of life on 2026-09-30 | The supervisor runs inside the app with AppKit `agents()`. |

## Known limitations

- **Roles:** none by design. Any user of the app can approve the assistant's changes in their own session.
- **Threads:** agent conversations live in AppKit's in-memory thread store.
- **Write-back:** product edits stay in Lakebase and never reach Gold.
- **Product names:** synthetic (category plus an id prefix), because the dataset has none.
- **Late delivery by state:** `serving.sales_by_state_month` stores a monthly rate without its denominator, so it cannot be summed across months. Questions about it go to Genie.
- **Model behavior:** the model can still misread new kinds of requests. The routing policy and the evals are the regression net (see `AGENT.md`).
