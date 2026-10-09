CREATE TEMPORARY VIEW orders_validated AS
WITH typed AS (
  SELECT
    nullif(trim(order_id), '') AS order_id,
    nullif(trim(customer_id), '') AS customer_id,
    lower(trim(order_status)) AS order_status,
    try_cast(order_purchase_timestamp AS TIMESTAMP_NTZ) AS purchased_at,
    try_cast(order_approved_at AS TIMESTAMP_NTZ) AS approved_at,
    try_cast(order_delivered_carrier_date AS TIMESTAMP_NTZ) AS delivered_to_carrier_at,
    try_cast(order_delivered_customer_date AS TIMESTAMP_NTZ) AS delivered_to_customer_at,
    CAST(try_cast(order_estimated_delivery_date AS TIMESTAMP_NTZ) AS DATE) AS estimated_delivery_date,
    source_file,
    source_file_modified_at,
    ingested_at
  FROM bronze.orders_raw
),
deduplicated AS (
  SELECT *
  FROM typed
  QUALIFY row_number() OVER (PARTITION BY order_id ORDER BY source_file_modified_at DESC, ingested_at DESC) = 1
)
SELECT
  *,
  CASE
    WHEN order_id IS NULL THEN 'missing_order_id'
    WHEN customer_id IS NULL THEN 'missing_customer_id'
    WHEN purchased_at IS NULL THEN 'invalid_purchase_timestamp'
    WHEN order_status NOT IN ('created', 'approved', 'invoiced', 'processing', 'shipped', 'delivered', 'canceled', 'unavailable') THEN 'unknown_order_status'
  END AS reject_reason
FROM deduplicated;

CREATE OR REFRESH MATERIALIZED VIEW silver.orders (
  CONSTRAINT primary_key_present EXPECT (order_id IS NOT NULL) ON VIOLATION FAIL UPDATE
)
COMMENT 'Olist orders, one row per order_id. Timestamps are local Brazil time (America/Sao_Paulo) without time zone.'
TBLPROPERTIES ('delta.feature.timestampNtz' = 'supported')
AS SELECT * EXCEPT (reject_reason)
FROM orders_validated
WHERE reject_reason IS NULL;

CREATE OR REFRESH MATERIALIZED VIEW silver.orders_quarantine
COMMENT 'Orders rejected by the silver rules, with the reject reason.'
TBLPROPERTIES ('delta.feature.timestampNtz' = 'supported')
AS SELECT *
FROM orders_validated
WHERE reject_reason IS NOT NULL;
