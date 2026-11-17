CREATE OR REFRESH MATERIALIZED VIEW gold.customer_activity_daily (
  order_date DATE NOT NULL COMMENT 'Purchase date',
  customer_unique_id STRING NOT NULL COMMENT 'Real customer identifier with at least one valid order on the date'
)
COMMENT 'One row per customer and purchase date with a valid order. Count distinct customer_unique_id over any date range to get exact distinct customers.'
AS SELECT DISTINCT
  order_date,
  customer_unique_id
FROM gold.fact_orders
WHERE is_valid_sale AND customer_unique_id IS NOT NULL;
