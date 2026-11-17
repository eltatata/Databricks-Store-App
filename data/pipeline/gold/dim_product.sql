CREATE OR REFRESH MATERIALIZED VIEW gold.dim_product (
  product_id STRING NOT NULL COMMENT 'Olist product identifier',
  display_name STRING NOT NULL COMMENT 'Synthetic display label (category plus the first 8 characters of product_id). Olist does not publish product names',
  category_en STRING NOT NULL COMMENT 'Product category in English, unknown when missing',
  category_pt STRING COMMENT 'Original Portuguese category name',
  is_category_missing BOOLEAN COMMENT 'True when the source has no category',
  weight_g INT COMMENT 'Product weight in grams',
  length_cm INT COMMENT 'Product length in centimeters',
  height_cm INT COMMENT 'Product height in centimeters',
  width_cm INT COMMENT 'Product width in centimeters',
  photos_quantity INT COMMENT 'Number of product photos in the listing',
  median_price_brl DECIMAL(12, 2) COMMENT 'Median item price in BRL across valid sales, null when never sold'
)
COMMENT 'Curated product catalog. Seeds the writable app.products table in Lakebase.'
AS
WITH valid_item_prices AS (
  SELECT items.product_id, median(items.price) AS median_price
  FROM silver.order_items AS items
  JOIN silver.orders AS orders ON items.order_id = orders.order_id
  WHERE orders.order_status NOT IN ('canceled', 'unavailable')
  GROUP BY items.product_id
)
SELECT
  products.product_id,
  concat(initcap(replace(products.category_en, '_', ' ')), ' #', substr(products.product_id, 1, 8)) AS display_name,
  products.category_en,
  products.category_pt,
  products.is_category_missing,
  products.weight_g,
  products.length_cm,
  products.height_cm,
  products.width_cm,
  products.photos_quantity,
  CAST(valid_item_prices.median_price AS DECIMAL(12, 2)) AS median_price_brl
FROM silver.products AS products
LEFT JOIN valid_item_prices ON products.product_id = valid_item_prices.product_id;
