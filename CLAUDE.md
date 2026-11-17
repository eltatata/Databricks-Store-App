# CLAUDE.md

Olist Store: a Medallion data platform on Databricks (Unity Catalog, Lakeflow pipelines and jobs), a Lakebase serving layer, a Genie space, and one AppKit app (`app/`) with a dashboard, product CRUD and a supervisor agent. Start with `README.md`. `docs/ARCHITECTURE.md` explains why things are built the way they are.

## Working rules

- Reply to the user in Spanish. Code, docs, commits and agent instructions are in English.
- Inspect before acting: read the relevant docs, code and skill first, and run read-only commands (`-h`, `list`, `get`) before anything that changes a workspace.
- Never report something as done unless it was verified. Say which level was reached: implemented, tested locally, deployed, or verified on the deployed app.
- A finding that contradicts `docs/ARCHITECTURE.md`, or a Free Edition limit, stops the work: explain it and propose a change instead of working around it silently. Record lasting findings in `docs/TROUBLESHOOTING.md`.
- Keep the docs in step with the code: when behavior, commands or structure change, update the matching file in `docs/`, `README.md` or `app/README.md` in the same change.

## Approval gates

The session may run with permissions bypassed. These still need the user's explicit approval first:
- any deploy (`scripts/*-deploy.sh`, `databricks apps deploy`, `databricks bundle deploy`);
- deleting or overwriting a workspace resource, schema, table, volume, Lakebase project or branch, app, job or pipeline;
- a pipeline full refresh;
- creating resources with unclear cost, or changing workspace settings or permissions.

## Databricks CLI

- Never pick a profile on your own. The user confirms it, and every command passes `--profile` (the scripts read `DATABRICKS_PROFILE` from `.env`).
- Verify every command with `-h` and the current docs, never from memory.
- On Windows run the scripts from Git Bash. `scripts/lib/common.sh` disables Git Bash path conversion for the CLI.

## Skills

Load the matching skill from `.claude/skills/` before working in an area, and follow it together with the official docs.

| Area | Skills |
|------|--------|
| CLI, auth, profiles, bundles | `databricks-core`, `databricks-dabs` |
| Pipeline (`data/pipeline/`) | `databricks-pipelines` |
| Jobs (`data/jobs/`, `serving/jobs/`) | `databricks-jobs` |
| Lakebase (`serving/`, `platform/lakebase/`, `app/server/database/`) | `databricks-lakebase` |
| Genie space (`serving/genie/`) | `databricks-genie-agents` |
| App, plugins, agent (`app/`) | `databricks-apps`; AppKit API with `npx @databricks/appkit docs <section>` |
| Server code | `nodejs-backend-patterns`, `typescript-advanced-types` |
| React code | `vercel-react-best-practices`, `vercel-composition-patterns` |
| UI and visual work | `frontend-design`, `impeccable`, `ui-ux-pro-max`, `web-design-guidelines`, `design-taste-frontend` |
| Commits | `commit` |

## Code style

Applies to TypeScript, SQL, Python and bash.

- Simple and readable first. Small single-purpose functions, early returns, clear module boundaries, one responsibility per file.
- No comments in code: no inline, block, JSDoc or docstring comments, no TODOs, no commented-out code. If code needs a comment, rename or extract until it does not. Exceptions: Unity Catalog `COMMENT` clauses (Genie reads them), and prose files such as `*.md` and `agent.md`.
- Names carry the meaning: verb + noun for functions, `is`/`has`/`can`/`should` for booleans, plural collections, `UPPER_SNAKE_CASE` constants, `PascalCase` types, domain words (`gmv`, `averageOrderValue`, `lateDeliveryRate`), no abbreviations beyond `id`, `url` and `db`.
- No magic numbers or strings (use named constants), no nested ternaries, no dead code, no unused exports or dependencies.
- Explicit types at module boundaries. No `any`, and no `as unknown as` (`appkit lint` blocks it).
- Prefer the platform and library feature that already exists over custom code. Check the official docs and the skills before adding a dependency or a helper.
- File names: kebab-case for scripts, YAML and JSON; snake_case for SQL and Python; `<feature>.<layer>.ts` on the server; PascalCase for React components.
- `client/src/components/ui` (shadcn) and `client/src/components/charts` (bklit) are copied from their registries. Keep only the files the app imports, strip the comments the registry ships, and otherwise change them only to fix lint or types.

## Backend (`app/server/`)

- Flow: `route → middlewares → controller → service → queries`. Each layer calls only the next one. Controllers never touch SQL; services never touch `req` or `res`.
- Functional modules: plain exported functions, no classes, no DI containers or ports and adapters. The only class is `AppError`, created through the factories in `utils/errors.ts`.
- Routes are `RouteDefinition` lists in `routes/*.routes.ts`; Express registration and the OpenAPI document are built from the same list, and a test checks coverage.
- Zod schemas in `schemas/` are the single source for validation, inferred types and OpenAPI. Body schemas are strict. `config/env.ts` validates environment variables at boot.
- Errors: `try/catch` only in `database/client.ts` (`runQuery`, `withTransaction`), the health check and agent tools. Controllers run inside `asyncHandler`; the global error middleware builds the error envelope. Success is `{ data, meta? }`, error is `{ error: { code, message, details?, requestId } }`.
- Drizzle: `app.schema.ts` is the only migration input; `serving.schema.ts` is read-only and never written. Migrations are generated with `pnpm run db:generate` and applied at startup by the app's service principal. Never run `drizzle-kit push` or `migrate` against Lakebase.
- Products use optimistic concurrency (`version`) and soft delete (`is_active`); every mutation writes `app.audit_log` with the actor and channel.

## Frontend (`app/client/src/`)

- Data flows one way: page → feature hook → service → `api/http.ts`. Components never call `fetch` or services directly.
- Pages are thin. Feature components live in `components/<feature>/`, shared ones in `components/common/`.
- TanStack Query for server data, Zustand for global client state. No React Context for global state, no Redux.
- shadcn/ui is the component library and bklit is used for every chart. Add charts with `npx shadcn@latest add @bklit/<chart>` (steps in `docs/DEPLOYMENT.md`).
- Colors come only from the tokens in `client/src/index.css` through semantic utilities (`bg-background`, `text-ink-2`, `var(--chart-*)`). No literal colors in components. Light and dark themes follow the shadcn dark-mode pattern, with the theme stored in `useUiStore`.
- Every data view handles loading (skeleton), empty, error (with retry) and success. Mutations show a toast and invalidate their query keys.
- KPIs are never recomputed in the browser. Agent output renders only through allowlisted components; no `dangerouslySetInnerHTML` and no model-generated HTML, JSX or SQL.
- Accessible by default: labels, keyboard focus, visible focus rings, and meaning that never relies on color alone.

## Agent (`app/server/agents/supervisor/`, `app/server/plugins/store-tools/`)

- The supervisor is a markdown agent: `agent.md` holds the tools and the routing policy. Read `docs/AGENT.md` before changing it.
- Lakebase tools live in the `store-tools` plugin so they run in the user's scope, and they call the same services as the REST API.
- LLM-facing argument schemas use plain types (the endpoint rejects `pattern`); each tool re-validates with the REST Zod schemas.
- Every mutating tool requires human approval. No SQL tool, no `lakebase.query`, no permanent delete from the agent.
- A change in routing or tool behavior comes with an eval in `evals/`, and all evals must pass.

## Data platform (`data/`, `serving/`, `platform/`, `scripts/`)

- Three bundles deployed in order: `data/` → run the data job → `serving/` → `app/`. Do not merge them.
- Declarative first: resources live in `.yml`, `.json` and `.sql`; scripts only apply them, are idempotent (`set -euo pipefail`, create or update) and never delete.
- The pipeline is SQL; job tasks are small Python modules with pytest tests (`uv run pytest`). Gold columns keep their `COMMENT`s.
- Reconciliation is the acceptance check for data changes: `reconcile_gold` and `reconcile_lakebase` must pass.

## Run and verify

| Task | Command |
|------|---------|
| Run the app locally | `cd app && cp .env.example .env` (first time), then `pnpm run dev` → http://localhost:8000 |
| Unit and component tests | `cd app && pnpm test` |
| Typecheck, lint, ast-grep, format | `pnpm run typecheck`, `pnpm run lint`, `pnpm run lint:ast-grep`, `pnpm run format` |
| Full platform validation | `cd app && databricks apps validate --profile <profile>` |
| Smoke test (server running) | `cd app && pnpm test:smoke` |
| Agent evals (server running, short approval timeout) | `cd app && npx appkit agent eval --url http://localhost:8000 --concurrency 3` |
| Job task tests | `cd data && uv run pytest`, `cd serving && uv run pytest` |

Local development uses the deployed Lakebase branch with your own identity: do not create or edit products from a local session unless the user asks. A change is finished when the checks for the layers it touches pass.

## Commits

Use the `commit` skill: granular commits, one logical step each, Conventional Commits (`feat:`, `fix:`, `refactor:`, `style:`, `chore:`, `docs:`, `test:`) in lowercase English, and never a `Co-Authored-By` line. Commit only when the user asks.

## Official documentation

- Free Edition limits: https://docs.databricks.com/aws/en/getting-started/free-edition-limitations
- Databricks Apps: https://docs.databricks.com/aws/en/dev-tools/databricks-apps/ · AppKit: https://github.com/databricks/appkit
- Lakebase: https://docs.databricks.com/aws/en/oltp/ · synced tables: https://docs.databricks.com/aws/en/oltp/projects/sync-tables
- Bundles: https://docs.databricks.com/aws/en/dev-tools/bundles/ · Jobs: https://docs.databricks.com/jobs
- Genie: https://docs.databricks.com/aws/en/genie/
- shadcn/ui: https://ui.shadcn.com · bklit: https://ui.bklit.com
- Zod to OpenAPI: https://github.com/asteasolutions/zod-to-openapi
