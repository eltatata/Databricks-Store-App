CREATE OR REFRESH MATERIALIZED VIEW silver.category_translations
COMMENT 'Portuguese to English product category names, one row per Portuguese category.'
AS SELECT
  lower(trim(product_category_name)) AS category_pt,
  lower(trim(product_category_name_english)) AS category_en
FROM bronze.category_translations_raw
WHERE nullif(trim(product_category_name), '') IS NOT NULL
QUALIFY row_number() OVER (PARTITION BY lower(trim(product_category_name)) ORDER BY source_file_modified_at DESC, ingested_at DESC) = 1;

CREATE TEMPORARY VIEW products_validated AS
WITH typed AS (
  SELECT
    nullif(trim(product_id), '') AS product_id,
    lower(nullif(trim(product_category_name), '')) AS category_pt,
    try_cast(product_name_lenght AS INT) AS name_length,
    try_cast(product_description_lenght AS INT) AS description_length,
    try_cast(product_photos_qty AS INT) AS photos_quantity,
    try_cast(product_weight_g AS INT) AS weight_g,
    try_cast(product_length_cm AS INT) AS length_cm,
    try_cast(product_height_cm AS INT) AS height_cm,
    try_cast(product_width_cm AS INT) AS width_cm,
    source_file,
    source_file_modified_at,
    ingested_at
  FROM bronze.products_raw
),
deduplicated AS (
  SELECT *
  FROM typed
  QUALIFY row_number() OVER (PARTITION BY product_id ORDER BY source_file_modified_at DESC, ingested_at DESC) = 1
)
SELECT
  products.product_id,
  products.category_pt,
  coalesce(translations.category_en, products.category_pt, 'unknown') AS category_en,
  products.category_pt IS NULL AS is_category_missing,
  products.category_pt IS NOT NULL AND translations.category_en IS NULL AS is_category_untranslated,
  products.name_length,
  products.description_length,
  products.photos_quantity,
  products.weight_g,
  products.length_cm,
  products.height_cm,
  products.width_cm,
  products.source_file,
  products.source_file_modified_at,
  products.ingested_at,
  CASE
    WHEN products.product_id IS NULL THEN 'missing_product_id'
    WHEN products.weight_g < 0 OR products.length_cm < 0 OR products.height_cm < 0 OR products.width_cm < 0 THEN 'negative_dimension'
  END AS reject_reason
FROM deduplicated AS products
LEFT JOIN silver.category_translations AS translations ON products.category_pt = translations.category_pt;

CREATE OR REFRESH MATERIALIZED VIEW silver.products (
  CONSTRAINT passes_product_rules EXPECT (reject_reason IS NULL) ON VIOLATION DROP ROW
)
COMMENT 'Olist products, one row per product_id. category_en falls back to the Portuguese name when untranslated and to unknown when missing.'
AS SELECT * EXCEPT (reject_reason)
FROM products_validated;

CREATE OR REFRESH MATERIALIZED VIEW silver.products_quarantine
COMMENT 'Products rejected by the silver rules, with the reject reason.'
AS SELECT *
FROM products_validated
WHERE reject_reason IS NOT NULL;
