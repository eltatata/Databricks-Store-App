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

Not built yet (Phase 8). The design is in `IMPLEMENTATION_PLAN.md` §7.
