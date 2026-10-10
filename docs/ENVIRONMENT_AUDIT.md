# Environment audit

Phase 0 read-only discovery. Verified on **2026-10-09** with Databricks CLI **v1.20.0** and profile `local-dev`. No workspace resource was created, changed or deleted.

Status legend: ✅ confirmed · ⚠️ available with caveats · ❌ not available · ❔ not yet verified

## Workspace

| Item | Status | Finding |
|------|--------|---------|
| Identity | ✅ | Current user is in the `admins` group. Cloud AWS, metastore region `us-east-2`. |
| Unity Catalog | ✅ | Metastore active. Existing catalogs: `workspace`, `dbacademy`, `emissions`, `dataeng`, plus `system` and `samples`. |
| `CREATE CATALOG` | ✅ | The user has already created managed catalogs (`dbacademy`, `emissions`, `dataeng`), so `data_engineering` can be created. The `workspace` fallback is not needed. |
| SQL warehouse | ✅ | One warehouse, `Serverless Starter Warehouse`, 2X-Small, serverless, auto-stop 10 min. The ID goes in `.env` (`WAREHOUSE_ID`). |
| Lakeflow pipelines | ⚠️ | One existing, unrelated pipeline (`bronze to silver to gold pipeline`) is `IDLE`. Only *active* pipelines count against the Free Edition limit. It is left untouched. |
| Lakeflow jobs | ✅ | Two existing, unrelated jobs. Left untouched. |
| Apps | ✅ | 0 of 3 apps used. |
| Lakebase | ✅ | 0 projects. A new `store-app` project will be created in Phase 4, after user approval. |
| Genie | ✅ | 3 existing spaces on the same warehouse, so Genie creation works on this workspace. |

## Model serving (agent backend)

| Endpoint | Tool calling | Streaming + routing test | Notes |
|----------|--------------|--------------------------|-------|
| `databricks-qwen3-next-80b-a3b-instruct` | ✅ | ✅ (`ask_analytics`) | Plain string content. **Recommended primary.** |
| `databricks-llama-4-maverick` | ✅ | ✅ | Plain string content, fastest. **Recommended fallback.** |
| `databricks-meta-llama-3-3-70b-instruct` | ✅ | ✅ | Plain string content. |
| `databricks-gpt-oss-120b` | ✅ | ✅ | Reasoning model: `content` can arrive as a list of reasoning blocks, which may need adapter handling in AppKit. |
| `databricks-qwen35-122b-a10b` | ✅ | ✅ | Same list-shaped content as gpt-oss. |
| `databricks-deepseek-v4-flash-0731` | ❌ | — | Endpoint deprecated (HTTP 400). |
| Claude / GPT (proprietary) | ❌ | — | No endpoint listed on this Free Edition workspace. |

- Test method: a direct `POST /serving-endpoints/<name>/invocations` with two function tools (`deactivate_product`, `ask_analytics`). A mutation prompt and an analytics prompt each selected the correct tool on every model.
- `databricks serving-endpoints query` drops the `tools` field (`unknown field: tools`). Do not use it to test tool calling. (`databricks api post` also failed in Phase 0, but only because of Git Bash path conversion; see Phase 1 findings.)
- **Unity Gateway is not enforced.** Direct invocation of the built-in `databricks-*` endpoints works, so the app binds the model as a `serving_endpoint` resource with `CAN_QUERY` (plan §7.1).

## Declarative Automation Bundles

The CLI v1.20.0 bundle schema supports more resource types than the skills and the plan assumed:

| Resource | In schema | Flag |
|----------|-----------|------|
| `catalogs`, `schemas`, `volumes` | ✅ | GA |
| `genie_spaces` (`serialized_space` or `file_path`, `warehouse_id`) | ✅ | — |
| `postgres_projects`, `postgres_databases`, `postgres_branches`, `postgres_endpoints`, `postgres_roles` | ✅ | `[Beta]` |
| `postgres_synced_tables` (incl. `existing_pipeline_id`, `scheduling_policy`, `primary_key_columns`) | ✅ | `[Beta]` |
| `synced_database_tables` | ✅ | Legacy. Do not use (plan §5.3). |

See plan change proposal P1 below.

## AppKit manifest (`databricks apps manifest`)

| Plugin | Resource key | Required fields |
|--------|--------------|-----------------|
| `server` | — | Mandatory for the template |
| `lakebase` | `postgres` | `project`, `branch`, `database`, `host`, `databaseName`, `endpointPath`, `port`, `sslmode` |
| `genie` | `genie-space` | `id`, `name` |
| `agents` | `agents-serving-endpoint` (optional) | `name` |
| `agents` | `agents-mlflow-experiment`, `agents-skills` (optional) | `experimentId`, `path` |

Scaffolding rules to apply:
- Template (must): treat `apps init` output as starter code to adapt; keep secrets only in `app.yaml`, `databricks.yml` or `.env`.
- Template (never): guess resources when several or none are available; embed secrets in the client bundle.
- Template (should): ask the user when the right resource for a plugin is unclear.
- `lakebase` (should): after init, run the ORM migrations before the first request and verify connectivity.
- `genie` (must): after init, configure the plugin's `spaces` map (alias → space ID).

## Local tooling

| Tool | Status | Needed for |
|------|--------|-----------|
| git 2.51, Node 24.14, npm 11.11, pnpm 11.0, Python 3.13 | ✅ | Repo, app, job tests |
| Databricks CLI 1.20.0 | ✅ | Everything |
| `kaggle` CLI and credentials | ❌ | Not needed: the user downloaded the 9 CSVs manually into `.local/olist/` (D17). |
| `psql` | ❌ | Declined. Replaced by `platform/lakebase/run-sql.ts` (D17). |
| `uv` 0.12.24 | ✅ | Installed by the user. `ruff` runs through it. |
| `shellcheck` | ❌ | Declined (D17). |
| git `init.defaultBranch` | ❔ | Not set. The repo is initialized with `main`. |

## Findings during Phase 1

| Item | Finding | Resolution |
|------|---------|------------|
| Catalog creation via DABs | `databricks bundle deploy` fails creating `catalogs.data_engineering`: `INVALID_STATE: Metastore storage root URL does not exist. Default Storage is enabled in your account`. | SQL `CREATE CATALOG` works on the Serverless Starter Warehouse. The catalog moved to `platform/workspace/catalog.sql` + `scripts/catalog-create.sh` (D15 amendment). |
| Git Bash path conversion | Git Bash rewrites arguments that start with `/` (e.g. `/api/2.0/...`) into Windows paths, so `databricks api` returned `Not Found`. The Phase 0 `Not Found` on `/serving-endpoints/.../invocations` had the same cause. | `scripts/lib/common.sh` exports `MSYS_NO_PATHCONV=1` and resolves `REPO_ROOT` in `C:/...` form so the Windows CLI can read local files. |

## Findings during Phases 4–5

| Item | Finding | Resolution |
|------|---------|------------|
| Lakebase via DABs (Beta) | `postgres_projects` and `postgres_synced_tables` work on Free Edition. Project `store-app` created with PG 17, 0.5–2 CU, 300 s suspend. | Kept as bundle resources in `serving/`. |
| Shared sync pipeline reference | `${resources.postgres_synced_tables.<key>.pipeline_id}` fails at plan time (`field "pipeline_id" not found`). | Use `${resources.postgres_synced_tables.kpi_daily.status.pipeline_id}`. All 6 tables share pipeline `6d06052e…`. |
| Bin-packed tables after creation | Tables added to the shared pipeline while its first update was starting stayed `SYNCED_TABLE_OFFLINE`. | The next pipeline update (the `olist-serving-refresh` job) brought all 6 tables online. `serving-run.sh` is part of the bootstrap order. |
| `psycopg[binary]` on serverless | Importing it aborts the Python process (SIGABRT in libpq loading) on the serverless job runtime. | `reconcile_lakebase` uses the pure-Python `pg8000` driver. |
| Custom indexes on synced tables | Indexes created by the owner survive a Snapshot refresh (7/7 present after a full refresh). | `serving-indexes.sql` only needs to be applied once per table creation. |
| pnpm 11 build scripts | `pnpm install` fails until dependency build scripts are approved (`esbuild` for `tsx`). | `platform/lakebase/pnpm-workspace.yaml` sets `allowBuilds.esbuild: true`. |
| Genie on Free Edition | `genie_spaces` bundle resource and the Conversation API both work. | Space `Olist Store Analytics` deployed from `serving/genie/olist-store.geniespace.json`. |

## Not yet verified (deferred to the phase that needs them)

| Item | Phase |
|------|-------|
| Genie Conversation API from the app (scope `genie`, on behalf of user or as the app's service principal) | 6 |
| Allowed `user_api_scopes` for apps | 6 |
| AppKit internals: Express version, Zod version, `server.extend` ordering, SIGTERM handling, build paths | 6 |
| shadcn + bklit coexisting with `@databricks/appkit-ui` | 7 |
| AppKit `agents()`: Genie toolkit name, approval config for all mutating tools, handling of list-shaped content | 8 |

## Plan change proposals

P1, P2 and P3 were approved by the user on 2026-10-09 and recorded in the plan as D15, D16 and D17. For P3, the user downloaded the dataset manually, installed `uv`, and declined `psql` and `shellcheck`.

- **P1 — Manage more resources with DABs.** Move the catalog, the Genie space, the Lakebase project and the synced tables from `platform/` scripts into the `data/` bundle (`catalogs`, `genie_spaces`, `postgres_projects`, `postgres_synced_tables`).
  - Benefits: fewer scripts and one `bundle deploy`.
  - `existing_pipeline_id` lets all synced tables share one pipeline, which removes the "1 active pipeline" risk in §5.3.
  - Risk: the Lakebase resources are `[Beta]`. Fallback: the CLI scripts described in the plan.
  - `platform/` would keep only what DABs cannot express: `serving` grants and indexes (SQL) and the Genie benchmarks.
- **P2 — Agent model.** Fix `databricks-qwen3-next-80b-a3b-instruct` as the primary model and `databricks-llama-4-maverick` as the fallback, configurable through `AGENT_SERVING_ENDPOINT`. Re-validate inside the AppKit `agents()` plugin in Phase 8.
- **P3 — Local prerequisites.** Before Phase 1, the user installs (or approves installing) the `kaggle` CLI and credentials, the `psql` client, `uv`, `ruff` and `shellcheck`. Alternatives: download the dataset manually, and run the Lakebase SQL with a small TS script using `pg` plus `databricks postgres generate-database-credential` instead of `psql`.
