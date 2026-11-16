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

## Findings during Phase 6

| Item | Finding | Resolution |
|------|---------|------------|
| AppKit version | `databricks apps init` scaffolded AppKit 0.84.0, React 19, React Router 7, Tailwind 4, Zod 4.3.6. Runtime Express is 4.22 (types are v5). | Async controllers use `asyncHandler`; OpenAPI uses `@asteasolutions/zod-to-openapi` v8. |
| AppKit Lakebase pool | `appkit.lakebase.pool` is a `pg.Pool` subset that Drizzle cannot use for transactions. | Drizzle uses its own pool from `appkit.lakebase.getPgConfig()` (D14 amendment). |
| Server build on Windows | The `appkitServerConfig()` external filter treats Windows absolute paths (`C:\...`) as external, so `dist/server.js` did not contain the app modules. | `tsdown.server.config.ts` overrides `external` to recognise absolute paths. |
| Type versions | `@types/pg` must match AppKit's (8.15.6) or `PoolConfig` types clash. | Pinned. |
| pnpm build scripts | `@scarf/scarf` (swagger-ui telemetry) requests a build script. | Denied in `app/pnpm-workspace.yaml`. |
| Signal handling | AppKit owns `SIGTERM`/`SIGINT`, but the platform logged "App did not respect SIGTERM timeout of 15 seconds" while the app ran through `pnpm run start`; AppKit's shutdown log never appeared, so the signal was not reaching Node. | `app.yaml` now runs `node ./dist/server.js` directly with `NODE_ENV=production`. Confirmed in Phase 7: the redeploy logged `Graceful shutdown complete` and no timeout warning. |
| Grants on synced tables | Read grants for the app service principal survive a Snapshot refresh. | `scripts/app-grant-serving.sh` is a one-time step per app/synced-table creation. |
| Identity | The platform injects `x-forwarded-email`; audit rows record the real user. | Used by `request-context.middleware.ts`. |

## Findings during Phase 7

| Item | Finding | Resolution |
|------|---------|------------|
| shadcn CLI 4.21 | Needs `package.json` in the working directory and asks for a component library (Base UI, React Aria, Radix). With the repo layout it also resolved `@/lib/utils` to an npm package called `cn` and dropped bklit files in `app/components/`. | `components.json` moved to `app/` (css path `client/src/index.css`, root `tsconfig.json` carries the `@/*` path). Radix chosen. After each `add`, imports are rewritten to `@/lib/utils`, files moved into `client/src/components/`, and the `cn` package removed. |
| shadcn/bklit CSS injection | `add` appends a `.dark` block and `--color-*: var(----chart-*)` mappings (four dashes) to `index.css`, overriding the theme. | Removed by hand; the theme tokens live only in `client/src/index.css`. |
| `@databricks/appkit-ui` styles | Its `styles.css` ships its own Tailwind tokens and light defaults. | No longer imported. AppKit-UI is used only for `useGenieChat`, `transformGenieData` and `inferChartType`. shadcn and AppKit-UI coexist without conflicts. |
| `appkit lint` vs bklit | Three `as unknown as` casts in generated bklit files fail the `no-double-type-assertion` rule, so `databricks apps validate` failed. | Fixed in source (real `scaleTime`, `ScaleBand.step()`, explicit point object). `apps validate` passes. |
| TypeScript strictness vs bklit | `noImplicitReturns` flags two generated effects; `d3-shape`/`d3-array` lack types. | `return undefined` added; `@types/d3-*` installed. ESLint relaxes React Compiler rules for `components/ui` and `components/charts` only. |
| Genie `inferChartType` | Suggests `pie` for small categorical results. | Explore maps pie/donut to a bklit bar chart; only allowlisted bar/line specs render. |
| Local dev on Windows | `pnpm dev` fails (`NODE_ENV=` syntax in cmd); local Lakebase needs `PGUSER`. Rolldown-Vite can cache a stub module after a file is replaced ("Canonicalized path was dropped"). | Run `tsx` directly from Git Bash with `PGUSER=<email>`; restart the dev server after replacing files. AppKit's persistent cache logs an ownership error locally (table owned by the app service principal); harmless. |

## Findings during Phase 8

| Item | Finding | Resolution |
|------|---------|------------|
| Hand-rolled tool identity | `tool({ execute })` runs as the service principal and receives only its arguments. There is no request, caller context or user email, even after HITL approval. | Lakebase tools moved to a ToolProvider plugin (`server/plugins/store-tools`). Plugin tools run through `PluginContext.executeTool` in the user's caller scope, so `getCallerContext().principal.userEmail` is set. |
| Markdown agents and plugins | `plugin:<name>` in frontmatter resolves only plugins that implement `toolkit()`; `getAgentTools()` alone is enough for code agents but not for markdown ones (`plugin 'store' is not registered. Available: genie, lakebase`). | The plugin implements `toolkit()` with the same `prefix`/`only`/`except`/`rename` semantics as AppKit's internal helper. |
| JSON Schema on `databricks-qwen3-next-80b-a3b-instruct` | Tool parameters with `pattern` (from Zod `.regex()` or `z.iso.date()`) fail the first request: `Invalid JSON schema - the "pattern" keyword is not supported`. | LLM-facing schemas use plain strings and numbers. Tools re-validate with the REST Zod schemas and return field issues to the model. |
| Model behavior around approval | Without explicit instructions the model asked for confirmation in chat instead of calling the tool. After a denial it said the change was still pending. | The routing policy says the approval card is the confirmation and gives a fixed reply for `Tool execution denied`. |
| Model behavior with inactive products | On the deployed app the model claimed an inactive product had to be reactivated before a price change. It also missed inactive products because `search_products` returns active ones by default. When it did find one, it proposed reactivation in chat instead of calling `update_product`, or wrote "Let me search" and ended the turn. General rules did not fix it (0 to 2 of 6 runs). | Routing rule 4 is a step list with a worked example (search with `includeInactive`, `get_product`, `update_product` with only the asked fields), plus a rule against announcing tool calls. Verified on the deployed app: 5 of 5 denied runs and one approved change that kept the product inactive. Eval `update-searches-inactive` added. |
| Genie tool output | `olist.sendMessage` returns every Genie event (status updates, `message_result`, `query_result` with the statement). A three-row answer is about 6 KB. Some attachments (text, suggestions) have no `attachmentId`. | Size is acceptable. The client rebuilds the Genie table and chart from `query_result` with the Explore helpers and ignores attachments without a query. |
| Thread store | The default `InMemoryThreadStore` logs a dev-only warning; threads are lost on restart. | Accepted for the POC (single instance, conversations are short). Lakebase-backed store left as a stretch item. |
| Local tooling | Killing every `node.exe` to restart the dev server also stopped the Playwright MCP server. | Restart the dev server by port (`netstat` + `taskkill /PID`). UI checks used `playwright-core` with the installed Chrome from the session scratchpad. |

## Findings after delivery

| Item | Finding | Resolution |
|------|---------|------------|
| Lakebase endpoint disabled (2026-11-06) | The `primary` endpoint of `projects/store-app/branches/production` had `status.disabled: true` (last active 2026-10-15, disabled 2026-10-19). Lakebase cannot resume a disabled endpoint, so the Lakebase UI showed `The endpoint has been disabled. Enable it using the API and retry.` The app crashed at startup because `runMigrations` failed. The workspace did not show who disabled it; it matches about 4 days without activity on Free Edition. | Re-enabled with `databricks postgres update-endpoint projects/store-app/branches/production/endpoints/primary spec.disabled --json '{"spec":{"disabled":false}}'`, then `apps stop` + `apps start`. Verified: app `RUNNING`, `/api/v1/health` returns `database: up`, and products and categories come from Lakebase. Data was kept. |
| Lakebase endpoint disabled again (2026-11-16) | Same symptom: `primary` had `disabled: true` (last active 2026-11-11, about 5 days earlier) and the app was `STOPPED` ("App compute was stopped due to workspace or account status"). Confirms the pattern: on Free Edition the endpoint is disabled after a few days without activity. | Same fix: `update-endpoint … spec.disabled` to `false`, then `apps start` (it redeployed the last deployment). Verified: app `RUNNING`, endpoint `ACTIVE`, `/api/v1/health` returns `database: up`, and products come from Lakebase. |
| Lakebase autoscaling range | The endpoint reports 1–1 CU, while the docs say 0.5–2 CU. | Not changed. Recorded so the docs can be aligned if the user wants. |

## Findings during block G (2026-11-16)

| Item | Finding | Resolution |
|------|---------|------------|
| bklit registry | `ui.bklit.com/r/*` now redirects to `bklit.com/r/*`. The registry publishes `choropleth-chart` (GeoJSON `FeatureCollection`, `getFeatureColor`, tooltip, click-to-zoom, markers). | `app/components.json` points to `bklit.com/r`. The map is viable without new data (D20). |
| bklit version drift | The choropleth needs the current shared chart files (new tooltip panel, `useChartPortalContainer`); the installed files were from Phase 7. The current bklit drops `@visx/*` for `d3-scale`/`d3-geo`. | Reinstalled area, bar, axes, tooltip and choropleth together, removed `@visx/*`, re-applied the project patches (full-width bar labels, no `as unknown as` for `appkit lint`, explicit effect returns for `noImplicitReturns`) and relaxed four lint rules for vendored chart code only. Dashboard charts re-checked in the browser. |
| shadcn CLI output path | `shadcn add @bklit/...` from `app/` writes to `app/components` and `app/lib`, not `client/src`. | Copy the generated files into `client/src/components/charts`, then delete the stray folders. |
| Brazil geometry | Natural Earth 1:50m admin-1 (public domain) has the 27 Brazilian states with `postal` = UF, matching `customer_state`. | `app/scripts/build-brazil-states.ts` (`pnpm run geo:brazil`) writes `client/src/assets/geo/brazil-states.json` (about 100 KB, 3-decimal coordinates). |
| State late-delivery rate | `serving.sales_by_state_month` stores a monthly rate without its delivered-orders denominator, so it cannot be summed across months exactly. | Not mapped from Lakebase. Late delivery by state goes to Genie, whose result renders as a map. |
| Client tests and AppKit UI | Importing `@databricks/appkit-ui/react` at runtime in Vitest failed on an extensionless `echarts-for-react` import. | `server.deps.inline: ['@databricks/appkit-ui']` in the client test project. |
| Local dev cache | Locally, AppKit's persistent cache migration logs `must be owner of table appkit_cache_entries` (the table belongs to the app service principal). | Harmless in local dev: the server starts and serves requests. |

## Not yet verified (deferred to the phase that needs them)

| Item | Phase |
|------|-------|
| Genie Conversation API from the app (scope `genie`, on behalf of user or as the app's service principal) | 6 |

## Plan change proposals

P1, P2 and P3 were approved by the user on 2026-10-09 and recorded in the plan as D15, D16 and D17. For P3, the user downloaded the dataset manually, installed `uv`, and declined `psql` and `shellcheck`.

- **P1 — Manage more resources with DABs.** Move the catalog, the Genie space, the Lakebase project and the synced tables from `platform/` scripts into the `data/` bundle (`catalogs`, `genie_spaces`, `postgres_projects`, `postgres_synced_tables`).
  - Benefits: fewer scripts and one `bundle deploy`.
  - `existing_pipeline_id` lets all synced tables share one pipeline, which removes the "1 active pipeline" risk in §5.3.
  - Risk: the Lakebase resources are `[Beta]`. Fallback: the CLI scripts described in the plan.
  - `platform/` would keep only what DABs cannot express: `serving` grants and indexes (SQL) and the Genie benchmarks.
- **P2 — Agent model.** Fix `databricks-qwen3-next-80b-a3b-instruct` as the primary model and `databricks-llama-4-maverick` as the fallback, configurable through `AGENT_SERVING_ENDPOINT`. Re-validate inside the AppKit `agents()` plugin in Phase 8.
- **P3 — Local prerequisites.** Before Phase 1, the user installs (or approves installing) the `kaggle` CLI and credentials, the `psql` client, `uv`, `ruff` and `shellcheck`. Alternatives: download the dataset manually, and run the Lakebase SQL with a small TS script using `pg` plus `databricks postgres generate-database-credential` instead of `psql`.
