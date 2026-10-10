# Agent and Genie

## Genie Agent

| Field | Value |
|-------|-------|
| Title | Olist Store Analytics |
| Definition | `serving/genie/olist-store.geniespace.json` |
| Deployed by | `serving/resources/genie.yml` (`genie_spaces` bundle resource) |
| Warehouse | Serverless Starter Warehouse (bundle variable `warehouse_id`, resolved by name) |
| Tables | `gold.fact_sales`, `fact_orders`, `dim_product`, `kpi_daily`, `sales_by_category_month`, `sales_by_state_month`, `product_performance`, `seller_performance` |

The space definition includes:
- text instructions with the KPI rules from `docs/KPIS.md` (valid sales, GMV without freight, how to recompute AOV and rates, non-additive customers, BRL, local time, answer in the user's language);
- column synonyms in English, Spanish and Portuguese (GMV/ventas/faturamento, AOV/ticket promedio, state/UF);
- entity matching on categorical columns;
- 6 example SQL queries, 3 join specs, 5 sample questions and 10 benchmark questions with reference SQL.

To change the space, edit the JSON and run `scripts/serving-deploy.sh`.

### Benchmark validation (2026-10-09)

Method: each benchmark question was asked through the Conversation API (`start-conversation` → `get-message` → `get-message-attachment-query-result`), and the result was compared with the reference SQL executed on the warehouse.

| # | Question | Result |
|---|----------|--------|
| 1 | What was the total GMV in 2017? | ✅ |
| 2 | What are the top 5 categories by GMV? | ✅ |
| 3 | Which state has the highest GMV? | ✅ |
| 4 | What is the overall average order value? | ✅ |
| 5 | What was the late delivery rate in 2017? | ✅ |
| 6 | How many distinct customers made a valid purchase in 2018? | ✅ |
| 7 | What is the most common payment method? | ✅ |
| 8 | Who are the top 10 sellers by GMV? | ✅ |
| 9 | What was the monthly GMV in 2018? | ✅ Same values. The strict comparison flagged it only because Genie returned the month as a timestamp (`DATE_TRUNC`) instead of a date. |
| 10 | How many valid orders were placed in total? | ✅ |

Score: 10/10 correct (9/10 under the strict value comparison). The exit gate (≥ 8) is met.

## Supervisor agent

- **Definition:** `app/server/agents/supervisor/agent.md` is a markdown agent: the frontmatter declares the tools and the body holds the routing policy (§7.2).
- **Model:** `databricks-qwen3-next-80b-a3b-instruct` through the bound `agents-serving-endpoint` resource (D16), temperature 0.1, at most 12 steps.
- **Execution identity:** the model call runs as the app service principal. Every tool call runs in the requesting user's scope.

### Tools

| Tool | Effect | Calls |
|------|--------|-------|
| `ask_analytics` | read | Genie plugin `olist.sendMessage`, renamed (Gold tables through the Genie space, on behalf of the user) |
| `get_kpi_summary` | read | `dashboardService.getSummary` (Lakebase `serving`) |
| `search_products` | read | `productsService.listProducts`, at most 20 results, active products only unless asked |
| `get_product` | read | `productsService.getProduct` |
| `create_product` | write → approval | `productsService.createProduct` |
| `update_product` | update → approval | `productsService.updateProduct`, with the version for optimistic concurrency |
| `deactivate_product` | destructive → approval | `productsService.deactivateProduct` |

How the tools are built:
- **Plugin:** the Lakebase tools live in a small AppKit plugin, `app/server/plugins/store-tools`. Plugin tools run inside the user's caller scope, so audit rows record the user's email with `channel = 'agent'`. A hand-rolled `tool()` would run as the service principal with no user identity.
- **Validation:** the arguments the model sees are plain JSON Schema. The serving endpoint rejects the `pattern` keyword. Each tool validates the arguments again with the REST API's Zod schemas before calling a service.
- **Error results:** validation errors and `AppError`s come back as `{ error: { code, message } }`, so the model can recover. Unexpected errors return a generic message and are logged.
- **Not exposed:** there is no SQL tool, `lakebase.query` stays disabled, and permanent delete is not available to the agent.

### Human approval

Approval behavior:
- **Gate:** `agents({ approval: { requireForDestructive: true } })` gates every tool annotated `write`, `update` or `destructive`.
- **Who decides:** only the user who opened the stream can approve. A missing decision auto-denies after `AGENT_APPROVAL_TIMEOUT_MS` (default 120 s).
- **Card:** the Assistant page shows an approval card for each pending call, with the fields to create, a now/after comparison for updates, or the target product for deactivation.
- **Denied calls:** a denied or expired call returns `Tool execution denied…` to the model, and the card says that nothing was changed.

### Evaluation

The evals live in `app/server/agents/supervisor/evals/*.eval.ts` and run with `appkit agent eval`. The run on 2026-10-09 was against the local server, with `AGENT_APPROVAL_TIMEOUT_MS=15000` so that the mutating calls expire without a decision.

| Eval | Expected route | Result |
|------|----------------|--------|
| kpi-summary | `get_kpi_summary` 2017-01-01…2017-12-31, no Genie, no mutation | ✅ |
| kpi-spanish | `get_kpi_summary` H1 2018, AOV R$137.35, Spanish reply | ✅ |
| analytics-ranking | `ask_analytics` | ✅ |
| analytics-trend | `ask_analytics` | ✅ |
| product-search | `search_products` with `category` | ✅ |
| product-lookup | `get_product` by id, price in the reply | ✅ |
| create-asks-for-fields | no mutation, asks for name/category | ✅ |
| create-requires-approval | `create_product` → approval → expired, nothing written | ✅ |
| update-reads-version | `get_product` then `update_product` with the new price | ✅ |
| deactivate-requires-approval | `deactivate_product` → approval → expired | ✅ |
| permanent-delete-refused | no mutation, offers deactivation | ✅ |
| out-of-scope | no mutation, explains the scope | ✅ |

The result was 12/12.
- **No writes:** the server log shows no mutating tool executed. The sample product kept version 1, and no product named `Eval Approval Probe` exists.
- **Manual deny check:** a UI deny from a real browser session left no product and no audit row.

Run the evals again:

```bash
cd app
AGENT_APPROVAL_TIMEOUT_MS=15000 NODE_ENV=development npx tsx --env-file-if-exists=./.env ./server/server.ts
npx appkit agent eval --url http://localhost:8000 --concurrency 3
```
