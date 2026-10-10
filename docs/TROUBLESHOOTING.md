# Troubleshooting

Every entry below was hit while building this POC. Background and evidence are in `docs/ENVIRONMENT_AUDIT.md`.

## App

| Symptom | Cause | Fix |
|---------|-------|-----|
| The app URL shows "App not available" a day after a deploy | Free Edition stops apps 24 h after start or redeploy | `databricks apps start store-app --profile <profile>`, wait for `RUNNING` |
| First page load is slow after a pause | Lakebase compute resumes after 300 s of inactivity | Wait a few seconds and retry. The UI shows skeletons, then the data. |
| `App did not respect SIGTERM timeout of 15 seconds` in the logs | The app ran through `pnpm run start`, so the signal never reached Node | `app/app.yaml` runs `node ./dist/server.js` directly; keep it that way |
| Dashboard or Products return `DB_UNAVAILABLE` | Lakebase endpoint resuming, or grants missing after recreating the app or synced tables | Retry; if it persists, run `bash scripts/app-grant-serving.sh` |
| `permission denied for table …` on `serving.*` | The app service principal has no `SELECT` on a recreated synced table | `bash scripts/app-grant-serving.sh` |
| Products list is empty on a new workspace | `app.products` has not been seeded | `POST /api/v1/admin/seed-products` with `{"confirm": true}` |
| `databricks apps validate` fails on `no-double-type-assertion` | An `as unknown as` cast (often in generated shadcn or bklit files) | Replace it with a typed value or a type guard |

## Agent and Assistant

| Symptom | Cause | Fix |
|---------|-------|-----|
| First chat turn fails with `Invalid JSON schema - the "pattern" keyword is not supported` | A tool schema uses Zod `.regex()` or `z.iso.date()` | Keep LLM-facing schemas in `server/schemas/agent-tools.schema.ts` free of patterns; validate inside the tool |
| Startup fails with `references 'plugin:store', but plugin 'store' is not registered` | Markdown agents only see plugins that implement `toolkit()`, or the plugin is missing from `createApp` | Keep `storeTools()` in `server.ts` and the `toolkit()` method in the plugin |
| Audit rows from the assistant show `unknown` as the actor | The tool ran without a caller scope (a hand-rolled `tool()`, or a local server without user headers) | Agent tools must live in the `store-tools` plugin. Locally, set `DEV_USER_EMAIL`. |
| The approval card says "Expired without a decision" | Nobody approved within `AGENT_APPROVAL_TIMEOUT_MS` (120 s) | Ask again; nothing was changed |
| `403` from `/api/agents/approve` | A different user than the one who opened the stream tried to decide | Only the stream owner can approve |
| `429` from `/api/agents/chat` | More than 5 open streams for the same user | Wait for the current answer, or reload the page |
| The assistant forgot the conversation | Threads live in memory and are lost on restart or redeploy | Start a new conversation; a persistent thread store is a stretch item |
| A code agent works locally but not after deploy | Code agents need their own build entry | This app uses a markdown agent (`agent.md`); keep it that way, or use `appkitServerConfig()` |
| Agent edits in `agent.md` are ignored locally | The agent is loaded at startup | Restart the server |

## Data platform

| Symptom | Cause | Fix |
|---------|-------|-----|
| `INVALID_STATE: Metastore storage root URL does not exist` when deploying a catalog with DABs | Default Storage does not support the catalogs API | Create it with `bash scripts/catalog-create.sh` (SQL `CREATE CATALOG`) |
| A synced table stays `SYNCED_TABLE_OFFLINE` after `serving-deploy.sh` | It was added while the shared pipeline's first update was starting | Run `bash scripts/serving-run.sh` again |
| `serving-deploy.sh` fails on synced tables or the Genie space | Gold does not exist yet | Run `data-deploy.sh`, `dataset-upload.sh` and `data-run.sh` first |
| `reconcile_gold` fails after uploading files | New CSVs changed the expected counts, or a file was uploaded twice under a new name | Compare with `docs/DATASET.md`; Auto Loader ingests each new file name once |
| Compute stops for the rest of the day | Free Edition fair-use quota reached | Wait for the reset; avoid schedules and full refreshes |

## Local tooling (Windows)

| Symptom | Cause | Fix |
|---------|-------|-----|
| `pnpm dev` fails with `'NODE_ENV' is not recognized` | `cmd` syntax | Run `npx tsx …` from Git Bash (see `DEPLOYMENT.md` §8) |
| Lakebase connection fails locally with an auth error | `PGUSER` is not set to your workspace email | Prefix the command with `PGUSER=<email>` |
| Vite logs "Canonicalized path was dropped" after replacing a file | Rolldown-Vite cached a stub module | Restart the dev server; delete `node_modules/.vite` if it persists |
| The server build has no app modules on Windows | `appkitServerConfig()` treats `C:\…` paths as external | `tsdown.server.config.ts` overrides `external`; keep the override |
| `pnpm install` stops asking to approve build scripts | pnpm 11 blocks dependency scripts by default | Approve only the scripts listed in `pnpm-workspace.yaml` |
| Restarting the dev server also stops other Node tools | `taskkill /IM node.exe` kills every Node process | Stop the process that owns port 8000: `netstat -ano \| grep :8000`, then `taskkill /PID <pid> /F` |
| `psql` is not available | Not installed by decision (D17) | Use `platform/lakebase/run-sql.ts`, which prints query results |
