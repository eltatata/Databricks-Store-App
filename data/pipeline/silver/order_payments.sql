CREATE TEMPORARY VIEW order_payments_validated AS
WITH typed AS (
  SELECT
    nullif(trim(order_id), '') AS order_id,
    try_cast(payment_sequential AS INT) AS payment_sequential,
    lower(trim(payment_type)) AS payment_type,
    try_cast(payment_installments AS INT) AS payment_installments,
    try_cast(payment_value AS DECIMAL(12, 2)) AS payment_value,
    source_file,
    source_file_modified_at,
    ingested_at
  FROM bronze.order_payments_raw
),
deduplicated AS (
  SELECT *
  FROM typed
  QUALIFY row_number() OVER (PARTITION BY order_id, payment_sequential ORDER BY source_file_modified_at DESC, ingested_at DESC) = 1
)
SELECT
  payments.*,
  CASE
    WHEN payments.order_id IS NULL OR payments.payment_sequential IS NULL THEN 'missing_key'
    WHEN payments.payment_value IS NULL OR payments.payment_value < 0 THEN 'invalid_payment_value'
    WHEN orders.order_id IS NULL THEN 'orphan_order'
  END AS reject_reason
FROM deduplicated AS payments
LEFT JOIN silver.orders AS orders ON payments.order_id = orders.order_id;

CREATE OR REFRESH MATERIALIZED VIEW silver.order_payments (
  CONSTRAINT passes_payment_rules EXPECT (reject_reason IS NULL) ON VIOLATION DROP ROW
)
COMMENT 'Olist order payments, one row per (order_id, payment_sequential). Values in BRL.'
AS SELECT * EXCEPT (reject_reason)
FROM order_payments_validated;

CREATE OR REFRESH MATERIALIZED VIEW silver.order_payments_quarantine
COMMENT 'Order payments rejected by the silver rules, with the reject reason.'
AS SELECT *
FROM order_payments_validated
WHERE reject_reason IS NOT NULL;
