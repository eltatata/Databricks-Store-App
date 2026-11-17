# Dataset

| Field | Value |
|-------|-------|
| Title | Brazilian E-Commerce Public Dataset by Olist |
| URL | https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce |
| Author | Olist and 3 collaborators |
| License | CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/), confirmed on the Kaggle page on 2026-10-09 |
| Download | Manual, from the Kaggle page |
| Local path | `.local/olist/` (gitignored, never committed) |
| Landing path | `/Volumes/data_engineering/bronze/landing/olist/<entity>/` |
| Upload | `scripts/dataset-upload.sh` |

The license is non-commercial and share-alike. This project is non-commercial and does not redistribute the raw files.

## Files

| File | Landing entity | Records | Notes |
|------|----------------|---------|-------|
| `olist_orders_dataset.csv` | `orders` | 99,441 | |
| `olist_order_items_dataset.csv` | `order_items` | 112,650 | |
| `olist_order_payments_dataset.csv` | `order_payments` | 103,886 | |
| `olist_order_reviews_dataset.csv` | `order_reviews` | 99,224 | Review comments contain line breaks: 104,719 physical lines. Read with `multiLine`. |
| `olist_customers_dataset.csv` | `customers` | 99,441 | One `customer_id` per order; `customer_unique_id` identifies the person. |
| `olist_sellers_dataset.csv` | `sellers` | 3,095 | |
| `olist_products_dataset.csv` | `products` | 32,951 | Typo columns `product_name_lenght`, `product_description_lenght`. No product names. |
| `product_category_name_translation.csv` | `category_translations` | 71 | UTF-8 BOM in the header; read with an explicit schema. |
| `olist_geolocation_dataset.csv` | not ingested | 1,000,163 | Skipped in v1 (not needed by any KPI). |

Record counts are CSV records (multiline-aware), not physical lines. They are the expected Bronze row counts checked by `data/jobs/reconcile_gold.py`.

## Caveats
- Currency is BRL. Orders span 2016-09 to 2018-10.
- Timestamps have no time zone. They are treated as local Brazil time (`America/Sao_Paulo`) and stored as `TIMESTAMP_NTZ`.
- Some products have no category, and two Portuguese categories have no English translation.
- Review text is free Portuguese text. Company names in reviews were replaced by the source with Game of Thrones house names. Review text does not reach Gold.
- Product display names in the app are synthetic (category plus a product id prefix).
