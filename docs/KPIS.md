# KPI definitions

Every KPI is computed in Gold (`data/pipeline/gold/`) and only displayed by the app and Genie. Shared rules:

- **Currency:** BRL. No currency conversion.
- **Time:** purchase timestamp (`order_purchase_timestamp`) in local Brazil time, no time zone conversion. Daily and monthly KPIs are bucketed by purchase date.
- **Valid order:** status not `canceled` or `unavailable`, **and** at least one item. All sales KPIs count valid orders only.
- **Review score of an order:** the latest review by `review_answer_timestamp`.
- **Null handling:** orders without a review are excluded from review averages. Undelivered orders are excluded from delivery rates.

| KPI | Formula | Gold source | Notes |
|-----|---------|-------------|-------|
| GMV | Σ item `price` over valid orders | `kpi_daily.gmv`, `sales_by_*.gmv`, `*_performance.gmv` | Excludes freight. |
| Freight | Σ item `freight_value` over valid orders | `kpi_daily.freight` | Reported separately from GMV. |
| Orders | count of valid orders | `kpi_daily.orders` | In `sales_by_category_month` it counts orders containing the category, so it is not additive across categories. |
| Items sold | count of items in valid orders | `kpi_daily.items_sold` | |
| Average order value (AOV) | GMV / Orders | `kpi_daily.average_order_value` | Recompute from GMV and Orders when aggregating over a period; never average the daily AOVs. |
| Customers | count distinct `customer_unique_id` with a valid order | `kpi_daily.customers`, `sales_by_state_month.customers` | Not additive across days or months. |
| Average review score | mean of the latest review score per valid order | `kpi_daily.average_review_score` | Scale 1 to 5. |
| Late delivery rate | delivered valid orders with delivery date > estimated date / delivered valid orders | `kpi_daily.late_delivery_rate` | Recompute from `late_orders` / `delivered_orders` when aggregating. |
| Delivery days | delivery date − purchase date | `fact_orders.delivery_days` | Delivered orders only. |

## Reconciliation
`data/jobs/reconcile_gold.py` fails the job unless:
- Bronze row counts equal the CSV record counts in `docs/DATASET.md`;
- GMV in `kpi_daily`, `sales_by_category_month`, `sales_by_state_month`, `product_performance`, `seller_performance` and `fact_sales` equals Σ price of valid items computed directly from Silver;
- orders and items in `kpi_daily` equal the Silver counts;
- every Gold table has unique, non-null primary keys;
- dimension joins lose nothing: `dim_product` has as many rows as `silver.products`, and the `unknown` categories and states in Gold equal the real gaps in Silver.

## Reference values (dataset as downloaded on 2026-10-09)

| KPI | Value |
|-----|-------|
| Valid orders | 98,199 |
| GMV | R$ 13,494,400.74 |
| Freight | R$ 2,241,126.29 |
| AOV | R$ 137.42 |
| Items sold | 112,101 |
| Distinct customers | 94,983 |
| Average review score | 4.12 |
| Late delivery rate | 6.77% |
| Purchase date range | 2016-09-04 to 2018-09-03 |
