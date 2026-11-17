CREATE TEMPORARY VIEW order_items_validated AS
WITH typed AS (
  SELECT
    nullif(trim(order_id), '') AS order_id,
    try_cast(order_item_id AS INT) AS order_item_id,
    nullif(trim(product_id), '') AS product_id,
    nullif(trim(seller_id), '') AS seller_id,
    try_cast(shipping_limit_date AS TIMESTAMP_NTZ) AS shipping_limit_at,
    try_cast(price AS DECIMAL(12, 2)) AS price,
    try_cast(freight_value AS DECIMAL(12, 2)) AS freight_value,
    source_file,
    source_file_modified_at,
    ingested_at
  FROM bronze.order_items_raw
),
deduplicated AS (
  SELECT *
  FROM typed
  QUALIFY row_number() OVER (PARTITION BY order_id, order_item_id ORDER BY source_file_modified_at DESC, ingested_at DESC) = 1
)
SELECT
  items.*,
  CASE
    WHEN items.order_id IS NULL OR items.order_item_id IS NULL THEN 'missing_key'
    WHEN items.product_id IS NULL THEN 'missing_product_id'
    WHEN items.seller_id IS NULL THEN 'missing_seller_id'
    WHEN items.price IS NULL OR items.price <= 0 THEN 'invalid_price'
    WHEN items.freight_value IS NULL OR items.freight_value < 0 THEN 'invalid_freight_value'
    WHEN orders.order_id IS NULL THEN 'orphan_order'
  END AS reject_reason
FROM deduplicated AS items
LEFT JOIN silver.orders AS orders ON items.order_id = orders.order_id;

CREATE OR REFRESH MATERIALIZED VIEW silver.order_items (
  CONSTRAINT primary_key_present EXPECT (order_id IS NOT NULL AND order_item_id IS NOT NULL) ON VIOLATION FAIL UPDATE
)
COMMENT 'Olist order items, one row per (order_id, order_item_id). Prices in BRL.'
TBLPROPERTIES ('delta.feature.timestampNtz' = 'supported')
AS SELECT * EXCEPT (reject_reason)
FROM order_items_validated
WHERE reject_reason IS NULL;

CREATE OR REFRESH MATERIALIZED VIEW silver.order_items_quarantine
COMMENT 'Order items rejected by the silver rules, with the reject reason.'
TBLPROPERTIES ('delta.feature.timestampNtz' = 'supported')
AS SELECT *
FROM order_items_validated
WHERE reject_reason IS NOT NULL;
