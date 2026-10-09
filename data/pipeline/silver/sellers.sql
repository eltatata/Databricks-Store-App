CREATE TEMPORARY VIEW sellers_validated AS
WITH typed AS (
  SELECT
    nullif(trim(seller_id), '') AS seller_id,
    lpad(trim(seller_zip_code_prefix), 5, '0') AS zip_code_prefix,
    lower(trim(seller_city)) AS city,
    upper(trim(seller_state)) AS state,
    source_file,
    source_file_modified_at,
    ingested_at
  FROM bronze.sellers_raw
),
deduplicated AS (
  SELECT *
  FROM typed
  QUALIFY row_number() OVER (PARTITION BY seller_id ORDER BY source_file_modified_at DESC, ingested_at DESC) = 1
)
SELECT
  *,
  CASE
    WHEN seller_id IS NULL THEN 'missing_seller_id'
    WHEN state IS NULL OR length(state) <> 2 THEN 'invalid_state'
  END AS reject_reason
FROM deduplicated;

CREATE OR REFRESH MATERIALIZED VIEW silver.sellers (
  CONSTRAINT passes_seller_rules EXPECT (reject_reason IS NULL) ON VIOLATION DROP ROW
)
COMMENT 'Olist sellers, one row per seller_id.'
AS SELECT * EXCEPT (reject_reason)
FROM sellers_validated;

CREATE OR REFRESH MATERIALIZED VIEW silver.sellers_quarantine
COMMENT 'Sellers rejected by the silver rules, with the reject reason.'
AS SELECT *
FROM sellers_validated
WHERE reject_reason IS NOT NULL;
