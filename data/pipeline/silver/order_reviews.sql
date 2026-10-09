CREATE TEMPORARY VIEW order_reviews_validated AS
WITH typed AS (
  SELECT
    nullif(trim(review_id), '') AS review_id,
    nullif(trim(order_id), '') AS order_id,
    try_cast(review_score AS INT) AS review_score,
    nullif(trim(review_comment_title), '') AS review_comment_title,
    nullif(trim(review_comment_message), '') AS review_comment_message,
    try_cast(review_creation_date AS TIMESTAMP_NTZ) AS created_at,
    try_cast(review_answer_timestamp AS TIMESTAMP_NTZ) AS answered_at,
    source_file,
    source_file_modified_at,
    ingested_at
  FROM bronze.order_reviews_raw
),
deduplicated AS (
  SELECT *
  FROM typed
  QUALIFY row_number() OVER (PARTITION BY review_id, order_id ORDER BY answered_at DESC NULLS LAST, source_file_modified_at DESC, ingested_at DESC) = 1
)
SELECT
  reviews.*,
  CASE
    WHEN reviews.review_id IS NULL OR reviews.order_id IS NULL THEN 'missing_key'
    WHEN reviews.review_score IS NULL OR reviews.review_score NOT BETWEEN 1 AND 5 THEN 'invalid_review_score'
    WHEN orders.order_id IS NULL THEN 'orphan_order'
  END AS reject_reason
FROM deduplicated AS reviews
LEFT JOIN silver.orders AS orders ON reviews.order_id = orders.order_id;

CREATE OR REFRESH MATERIALIZED VIEW silver.order_reviews (
  CONSTRAINT primary_key_present EXPECT (review_id IS NOT NULL AND order_id IS NOT NULL) ON VIOLATION FAIL UPDATE
)
COMMENT 'Olist order reviews, one row per (review_id, order_id). An order can have more than one review.'
AS SELECT * EXCEPT (reject_reason)
FROM order_reviews_validated
WHERE reject_reason IS NULL;

CREATE OR REFRESH MATERIALIZED VIEW silver.order_reviews_quarantine
COMMENT 'Order reviews rejected by the silver rules, with the reject reason.'
AS SELECT *
FROM order_reviews_validated
WHERE reject_reason IS NOT NULL;
