# store-app

The Olist Store operator app: a KPI dashboard, product CRUD and an AI assistant, built with [AppKit](https://developers.databricks.com/docs/appkit/v0/) as one Databricks App.

| Plugin               | Use                                                                     |
| -------------------- | ----------------------------------------------------------------------- |
| `server`             | Express server, static client, Vite dev mode                            |
| `lakebase`           | Postgres access (OAuth refreshed by AppKit) for `serving.*` and `app.*` |
| `genie`              | Genie space toolkit used by the agent as `ask_analytics`                |
| `agents`             | Supervisor agent, SSE chat and human approval                           |
| `storeTools` (local) | Lakebase tools for the agent, run in the user's scope                   |

## Structure

```text
server/
  server.ts            createApp: plugins, migrations, /api/v1 router
  config/              env validation and constants
  routes/              RouteDefinition lists (Express and OpenAPI built from them)
  middlewares/         validation, request context, logging, errors, not found
  controllers/         HTTP in, envelope out
  services/            business rules, transactions, audit
  database/            Drizzle client, schema (app + serving), queries, migrations
  schemas/             Zod: REST contract, OpenAPI metadata, agent tool arguments
  interfaces/          non-validated types
  docs/openapi.ts      OpenAPI document served at /api/v1/docs
  plugins/store-tools/ agent tools plugin
  agents/supervisor/   agent.md (tools + routing policy) and evals
  utils/               errors, responses, pagination, logger, SQL helpers
client/src/
  pages/               thin route pages
  components/<feature> dashboard, products, assistant, layout, common
  components/ui        shadcn/ui (vendored)
  components/charts    bklit charts (vendored)
  hooks/<feature>      TanStack Query hooks and feature logic
  services/            backend calls through api/http.ts
  states/              Zustand stores
  configs/ types/ utils/ lib/ api/
tests/
  server/ client/      vitest
  smoke.spec.ts        Playwright smoke test
scripts/               build-brazil-states.ts (GeoJSON generator)
```

## Local development

```bash
cp .env.example .env   # fill in PGUSER (your workspace email), PGHOST, DATABRICKS_GENIE_SPACE_ID, DEV_USER_EMAIL
pnpm install
pnpm run dev           # http://localhost:8000
```

Local development connects to the deployed Lakebase branch with your own identity. Restart the server after editing `server/agents/supervisor/agent.md`. More notes in `docs/DEPLOYMENT.md`, local development.

## Scripts

| Command                                        | Purpose                                                                                |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm run dev`                                 | Server with watch mode and the Vite client                                             |
| `pnpm run build`                               | Typegen, server bundle (`dist/server.js`) and client (`client/dist`)                   |
| `pnpm run typecheck`                           | `tsc` for server and client                                                            |
| `pnpm run lint`, `pnpm run lint:ast-grep`      | ESLint and AppKit's ast-grep rules                                                     |
| `pnpm run format`, `pnpm run format:fix`       | Prettier                                                                               |
| `pnpm test`                                    | Server and client unit and component tests                                             |
| `pnpm test:smoke`                              | Playwright smoke test (`SMOKE_BASE_URL` and `SMOKE_BEARER_TOKEN` for the deployed app) |
| `pnpm run db:generate`                         | Generate a Drizzle migration from `server/database/schema/app.schema.ts`               |
| `pnpm run geo:brazil`                          | Rebuild `client/src/assets/geo/brazil-states.json` from Natural Earth                  |
| `databricks apps validate --profile <profile>` | Everything the platform checks before a deploy                                         |

## Deploy

```bash
bash ../scripts/app-deploy.sh
```

The app's service principal applies the migrations at startup and owns schema `app`. Never run `drizzle-kit push` or `drizzle-kit migrate` against Lakebase from a local machine.
