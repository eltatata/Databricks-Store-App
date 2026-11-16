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
| update-searches-inactive | update by name of an unknown product searches with `includeInactive`, no mutation | ✅ (added 2026-10-10) |

The result was 12/12, and 13/13 after the eval added on 2026-10-10.
- **No writes:** the server log shows no mutating tool executed. The sample product kept version 1, and no product named `Eval Approval Probe` exists.
- **Manual deny check:** a UI deny from a real browser session left no product and no audit row.

### Deployed verification (2026-10-10)

The run went through `/api/agents/chat` and `/api/agents/approve` on the deployed app as the signed-in user:
- **Create, approved:** created the test product, version 1.
- **Deactivate, approved:** the agent searched first, then deactivated it (version 2).
- **Price change on a catalog product, denied:** nothing changed.
- **Audit:** `create` and `deactivate` rows with channel `agent` and the user's email; no row for the denial.
- **Cleanup:** the test product was deleted afterwards.

One wrong premise came up in that run: the model claimed an inactive product must be reactivated before its price can change. The routing policy now says that inactive products are edited like active ones (commit `0247911`). 
### Second deployed verification (2026-10-10)

After a redeploy with commit `0247911`, the run used a new test product:
- **Create and deactivate, approved:** version 1, then version 2, inactive.
- **Price change while inactive, approved:** the agent sent only `listPriceBrl` (R$95.00) and left `isActive` alone; the product stayed inactive at version 3.
- **Price change on a catalog product, denied:** nothing changed (R$199.00, version 1).
- **Audit:** `create`, `deactivate` and `update` rows with channel `agent` and the user's email; then `delete` with channel `ui` from the cleanup through the REST API.

That run found two more gaps:
- **Inactive products not found:** `search_products` returns only active products by default. A plain "change the price of <name>" either found nothing (Spanish) or stopped after the model wrote "Let me search" without calling a tool (English, 2 of 2 runs).
- **Fix (local, not deployed):** the routing policy and the tool description now say to search with `includeInactive` when resolving a product to update, to retry with it before saying a product does not exist, and to call a tool instead of announcing it. Locally, both prompts then searched with `includeInactive` (English 3 of 3), and the new `update-searches-inactive` eval passes (13/13).

### Third deployed verification (2026-10-10)

The redeploy with the search fix (`13e2f79`) was checked with a new test product, created and deactivated with approval:
- **Search, fixed:** for a plain "change the price of <name>", the agent searched again with `includeInactive` and found the inactive product, in English and Spanish.
- **Edit, still wrong:** the agent then proposed to reactivate the product and asked in chat instead of calling `update_product`. Nothing was written.
- **Locally, same behavior:** 0 of 6 runs called `update_product`. Rewording the tool descriptions alone reached 2 of 6.
- **Fix (local, not deployed):** routing rule 4 is now a step list with a worked example (search with `includeInactive`, `get_product`, `update_product` with only the asked fields, whether the product is active or not). Result: 6 of 6, English and Spanish, with only `listPriceBrl` in `changes`.
- **Regressions (all denied):** reactivate sent `isActive: true`, rename sent only `displayName`, and a weight change on an active product sent only `weightG`. Evals 13/13.
- **Data:** every local call was denied. The test product kept version 2 and was then deleted through the REST API.

### Final deployed verification (2026-10-10)

After the redeploy with the worked-example fix (`77a2e8b`, `2b7b707`), the full cycle ran on the deployed app with a new test product:
- **Create and deactivate, approved:** version 1, then version 2, inactive.
- **Plain price change, denied 5 times** (3 in Spanish, 2 in English): every run found the inactive product and called `update_product` with only `listPriceBrl`; nothing was written.
- **Plain price change, approved:** `search_products` with `includeInactive`, then `get_product` and `update_product` with `{listPriceBrl: 95}`. The product stayed inactive (version 3).
- **Reactivate, approved:** `update_product` with `{isActive: true}` (version 4).
- **Audit:** `create`, `deactivate`, `update` and `update`, all with channel `agent` and the user's email. The denials left no rows. The catalog product used in the denial checks stayed at R$199.00, version 1.
- **Read routes and refusal:** H1 2018 average order value R$137.35 from `get_kpi_summary` (equal to Gold), top categories from `ask_analytics`, and permanent delete refused with an offer to deactivate.
- **Smoke and logs:** smoke test 5/5 against the deployed URL; no errors in the app logs.
- **Cleanup:** the test product was deleted through the REST API.

Run the evals again:

```bash
cd app
# add AGENT_APPROVAL_TIMEOUT_MS=15000 to app/.env, then:
pnpm run dev
npx appkit agent eval --url http://localhost:8000 --concurrency 3
```
