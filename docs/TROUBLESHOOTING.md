# Troubleshooting

## Lakebase and app availability

| Symptom | Cause | Fix |
|---------|-------|-----|
| App shows `Crashed` right after "App started successfully"; logs show `Application failed to start` from `runMigrations`. The Lakebase UI shows `The endpoint has been disabled. Enable it using the API and retry.` | On Free Edition the Lakebase endpoint is **disabled** after a few days without activity (observed after 4–5 idle days). Scale-to-zero resumes a suspended endpoint, but never a disabled one. The app may also be `STOPPED` ("App compute was stopped due to workspace or account status"). | Follow `DEPLOYMENT.md`, restart after inactivity: re-enable the endpoint with `databricks postgres update-endpoint … spec.disabled`, then start the app. The data is kept. |
| The app URL shows "App not available" a day after a deploy | Free Edition stops apps 24 h after start or redeploy | `databricks apps start store-app --profile <profile>`, wait for `RUNNING` |
| First page load is slow after a pause | Lakebase compute resumes from idle suspension | Wait a few seconds and retry. The UI shows skeletons, then the data. |
| Dashboard or Products return `DB_UNAVAILABLE` | Lakebase endpoint resuming or disabled, or grants missing after recreating the app or synced tables | Retry; check the endpoint state; if it persists, run `bash scripts/app-grant-serving.sh` |
| `permission denied for table …` on `serving.*` | The app service principal has no `SELECT` on a recreated synced table | `bash scripts/app-grant-serving.sh` |
| Products list is empty on a new workspace | `app.products` has not been seeded | `POST /api/v1/admin/seed-products` with `{"confirm": true}` |
| The endpoint reports 1–1 CU while `serving/resources/lakebase.yml` asks for 0.5–2 CU | Observed on Free Edition; the workspace does not explain it | Nothing to do; the app works with it |

## App build and runtime

| Symptom | Cause | Fix |
|---------|-------|-----|
| `App did not respect SIGTERM timeout of 15 seconds` in the logs | The app ran through `pnpm run start`, so the signal never reached Node | `app/app.yaml` runs `node ./dist/server.js` directly with `NODE_ENV=production`; keep it that way |
| `databricks apps validate` fails on `no-double-type-assertion` | An `as unknown as` cast (often in generated shadcn or bklit files) | Replace it with a typed value or a type guard |
| The server build has no app modules on Windows | `appkitServerConfig()` treats `C:\…` paths as external | `tsdown.server.config.ts` overrides `external`; keep the override |
| `PoolConfig` type errors around Lakebase | `@types/pg` differs from the version AppKit uses | Keep `@types/pg` aligned with AppKit's |
| Drizzle transactions fail on `appkit.lakebase.pool` | That pool is a `pg.Pool` subset without transaction support | `database/client.ts` builds its own `pg.Pool` from `appkit.lakebase.getPgConfig()` |
| `pnpm install` stops asking to approve build scripts | pnpm 11 blocks dependency scripts by default | Approve only the scripts listed under `allowBuilds` in `pnpm-workspace.yaml` (`@scarf/scarf` stays denied) |
| `pnpm run build` skips AppKit typegen | pnpm 11 does not run `pre*` scripts by default | Keep `enable-pre-post-scripts=true` in `app/.npmrc` |
| A client test that imports `@databricks/appkit-ui/react` fails with `Cannot find module …echarts-for-react/esm/core` | Vitest loads AppKit UI with Node's strict ESM resolution | Keep `server.deps.inline: ['@databricks/appkit-ui']` in the client project of `app/vitest.config.ts` |
| AppKit logs `must be owner of table appkit_cache_entries` locally | The cache table belongs to the app service principal | Harmless in local development |

## UI components and charts

| Symptom | Cause | Fix |
|---------|-------|-----|
| `shadcn add @bklit/...` succeeds but no chart appears in `client/src` | The CLI resolves the aliases from `app/` and writes to `app/components` and `app/lib` | Copy the files into `client/src/components/charts` and delete the stray folders |
| The theme changes after `shadcn add` | The CLI appends a `.dark` block and `--color-*: var(----chart-*)` mappings to `index.css` | Remove the injected block; theme tokens live only in `client/src/index.css` |
| shadcn resolves `@/lib/utils` to an npm package called `cn` | The CLI misreads the alias | Rewrite imports to `@/lib/utils` and uninstall `cn` |
| Genie suggests a pie chart | `inferChartType` returns `pie` for small categorical results | The assistant maps pie and donut to a bklit bar chart; only allowlisted chart specs render |

## Agent and Assistant

| Symptom | Cause | Fix |
|---------|-------|-----|
| First chat turn fails with `Invalid JSON schema - the "pattern" keyword is not supported` | A tool schema uses Zod `.regex()` or `z.iso.date()` | Keep LLM-facing schemas in `server/schemas/agent-tools.schema.ts` free of patterns; validate inside the tool |
| Startup fails with `references 'plugin:store', but plugin 'store' is not registered` | Markdown agents only see plugins that implement `toolkit()`, or the plugin is missing from `createApp` | Keep `storeTools()` in `server.ts` and the `toolkit()` method in the plugin |
| Audit rows from the assistant show `unknown` as the actor | The tool ran without a caller scope (a hand-rolled `tool()`, or a local server without user headers) | Agent tools must live in the `store-tools` plugin. Locally, set `DEV_USER_EMAIL`. |
| The assistant says an inactive product must be reactivated, or cannot find it | `search_products` returns only active products unless `includeInactive` is set | Keep routing rule 4 and its worked example in `agent.md`, and the `update-searches-inactive` eval |
| The approval card says "Expired without a decision" | Nobody approved within `AGENT_APPROVAL_TIMEOUT_MS` (120 s) | Ask again; nothing was changed |
| `403` from `/api/agents/approve` | A different user than the one who opened the stream tried to decide | Only the stream owner can approve |
| `429` from `/api/agents/chat` | More than 5 open streams for the same user | Wait for the current answer, or reload the page |
| The assistant forgot the conversation | Threads live in memory and are lost on restart or redeploy | Start a new conversation |
| A code agent works locally but not after deploy | Code agents need their own build entry | This app uses a markdown agent (`agent.md`); keep it that way |
| Agent edits in `agent.md` are ignored locally | The agent is loaded at startup | Restart the server |
| `databricks serving-endpoints query` ignores tools | The command drops the `tools` field | Test tool calling with `databricks api post /serving-endpoints/<name>/invocations` |

## Data platform

| Symptom | Cause | Fix |
|---------|-------|-----|
| `INVALID_STATE: Metastore storage root URL does not exist` when deploying a catalog with DABs | Default Storage does not support the catalogs API | Create it with `bash scripts/catalog-create.sh` (SQL `CREATE CATALOG`) |
| A synced table stays `SYNCED_TABLE_OFFLINE` after `serving-deploy.sh` | It was added while the shared pipeline's first update was starting | Run `bash scripts/serving-run.sh` again |
| `field "pipeline_id" not found` when planning the serving bundle | The shared pipeline id is under `status` | Reference `${resources.postgres_synced_tables.kpi_daily.status.pipeline_id}` |
| `serving-deploy.sh` fails on synced tables or the Genie space | Gold does not exist yet | Run `data-deploy.sh`, `dataset-upload.sh` and `data-run.sh` first |
| A Python job task aborts with SIGABRT when importing `psycopg` | `psycopg[binary]` cannot load libpq on the serverless runtime | Use `pg8000`, as `reconcile_lakebase` does |
| `reconcile_gold` fails after uploading files | New CSVs changed the expected counts, or a file was uploaded twice under a new name | Compare with `docs/DATASET.md`; Auto Loader ingests each new file name once |
| Compute stops for the rest of the day | Free Edition fair-use quota reached | Wait for the reset; avoid schedules and full refreshes |

## Local tooling (Windows)

| Symptom | Cause | Fix |
|---------|-------|-----|
| `databricks api …` returns `Not Found`, or the CLI cannot read a local file | Git Bash rewrites arguments that start with `/` into Windows paths | Scripts source `scripts/lib/common.sh`, which exports `MSYS_NO_PATHCONV=1` and resolves `REPO_ROOT` as `C:/…` |
| Lakebase connection fails locally with an auth error | `PGUSER` is not set to your workspace email | Set `PGUSER=<email>` in `app/.env` |
| The local server runs in production mode or rejects API calls | `NODE_ENV` is missing | Copy `app/.env.example` to `app/.env`; it sets `NODE_ENV=development` |
| Vite logs "Canonicalized path was dropped" after replacing a file | Rolldown-Vite cached a stub module | Restart the dev server; delete `node_modules/.vite` if it persists |
| Restarting the dev server also stops other Node tools | `taskkill /IM node.exe` kills every Node process | Stop the process that owns port 8000: `netstat -ano \| grep :8000`, then `taskkill /PID <pid> /F` |
| `psql` is not available | Not required | Use `platform/lakebase/run-sql.ts`, which prints query results |
