CREATE TEMPORARY VIEW customers_validated AS
WITH typed AS (
  SELECT
    nullif(trim(customer_id), '') AS customer_id,
    nullif(trim(customer_unique_id), '') AS customer_unique_id,
    lpad(trim(customer_zip_code_prefix), 5, '0') AS zip_code_prefix,
    lower(trim(customer_city)) AS city,
    upper(trim(customer_state)) AS state,
    source_file,
    source_file_modified_at,
    ingested_at
  FROM bronze.customers_raw
),
deduplicated AS (
  SELECT *
  FROM typed
  QUALIFY row_number() OVER (PARTITION BY customer_id ORDER BY source_file_modified_at DESC, ingested_at DESC) = 1
)
SELECT
  *,
  CASE
    WHEN customer_id IS NULL THEN 'missing_customer_id'
    WHEN customer_unique_id IS NULL THEN 'missing_customer_unique_id'
    WHEN state IS NULL OR length(state) <> 2 THEN 'invalid_state'
  END AS reject_reason
FROM deduplicated;

CREATE OR REFRESH MATERIALIZED VIEW silver.customers (
  CONSTRAINT primary_key_present EXPECT (customer_id IS NOT NULL) ON VIOLATION FAIL UPDATE
)
COMMENT 'Olist customers, one row per customer_id (one per order). customer_unique_id identifies the real person across orders.'
AS SELECT * EXCEPT (reject_reason)
FROM customers_validated
WHERE reject_reason IS NULL;

CREATE OR REFRESH MATERIALIZED VIEW silver.customers_quarantine
COMMENT 'Customers rejected by the silver rules, with the reject reason.'
AS SELECT *
FROM customers_validated
WHERE reject_reason IS NOT NULL;
