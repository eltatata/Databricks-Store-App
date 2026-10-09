# Data model

One Lakeflow Spark Declarative Pipeline (`olist-medallion`, SQL, serverless) builds every layer in catalog `data_engineering`. Source: `data/pipeline/{bronze,silver,gold}/`.

## Bronze — streaming tables (Auto Loader)

`bronze.<entity>_raw` for `orders`, `order_items`, `order_payments`, `order_reviews`, `customers`, `sellers`, `products`, `category_translations`.

- Read with `STREAM read_files` from `/Volumes/data_engineering/bronze/landing/olist/<entity>/`, using CSV with header, `multiLine` and an explicit all-STRING schema.
- Added columns: `source_file`, `source_file_modified_at`, `ingested_at`, `_rescued_data`.
- No business fixes. Auto Loader checkpoints make re-runs idempotent: a file already ingested is not read again.

## Silver — materialized views

Each entity has a private validated view (typed, trimmed, deduplicated, with a `reject_reason`). From it come `silver.<entity>`, which drops rejected rows through an expectation so the drops appear in data quality metrics, and `silver.<entity>_quarantine`, which keeps the rejected rows with their reason.

| Table | Key | Deduplication | Reject reasons |
|-------|-----|---------------|----------------|
| `orders` | `order_id` | latest file | `missing_order_id`, `missing_customer_id`, `invalid_purchase_timestamp`, `unknown_order_status` |
| `order_items` | `order_id`, `order_item_id` | latest file | `missing_key`, `missing_product_id`, `missing_seller_id`, `invalid_price`, `invalid_freight_value`, `orphan_order` |
| `order_payments` | `order_id`, `payment_sequential` | latest file | `missing_key`, `invalid_payment_value`, `orphan_order` |
| `order_reviews` | `review_id`, `order_id` | latest answer, then latest file | `missing_key`, `invalid_review_score`, `orphan_order` |
| `customers` | `customer_id` | latest file | `missing_customer_id`, `missing_customer_unique_id`, `invalid_state` |
| `sellers` | `seller_id` | latest file | `missing_seller_id`, `invalid_state` |
| `products` | `product_id` | latest file | `missing_product_id`, `negative_dimension` |
| `category_translations` | `category_pt` | latest file | rows without a Portuguese name are skipped |

Main source → Silver mappings:
- Timestamps are cast to `TIMESTAMP_NTZ`; `order_estimated_delivery_date` becomes a `DATE`.
- Prices and payments are cast to `DECIMAL(12,2)`.
- Status and payment type are lowercased. States are uppercased. Zip prefixes are left-padded to 5 digits.
- `product_*_lenght` becomes `name_length` / `description_length`.
- `category_en` = translation, else the Portuguese name, else `unknown`, with the flags `is_category_missing` and `is_category_untranslated`.

## Gold — materialized views

| Table | Grain / key | Built from | Synced to Lakebase | Genie |
|-------|-------------|------------|--------------------|-------|
| `fact_sales` | `order_id`, `order_item_id` | Silver items + orders + customers + sellers + products + latest review | No | ✅ |
| `fact_orders` | `order_id` | Silver orders + item, payment and review aggregates | No | ✅ |
| `dim_product` | `product_id` | Silver products + median valid item price | ✅ | ✅ |
| `kpi_daily` | `order_date` | `fact_orders` (valid) | ✅ | ✅ |
| `sales_by_category_month` | `order_month`, `category_en` | `fact_sales` (valid) | ✅ | ✅ |
| `sales_by_state_month` | `order_month`, `customer_state` | `fact_orders` (valid) | ✅ | ✅ |
| `product_performance` | `product_id` | `fact_sales` (valid) + `dim_product` | ✅ | ✅ |
| `seller_performance` | `seller_id` | `fact_sales` (valid) + Silver sellers | ✅ | ✅ |

Gold columns carry `COMMENT`s with business meaning. KPI formulas are in `docs/KPIS.md`.

## Orchestration
Job `olist-refresh` (`data/resources/olist-refresh.job.yml`, manual trigger): `ingest_check` → `run_pipeline` → `reconcile_gold`. Phase 4 adds the Lakebase sync refresh and reconciliation tasks.
