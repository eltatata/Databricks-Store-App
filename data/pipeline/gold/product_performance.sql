CREATE OR REFRESH MATERIALIZED VIEW gold.product_performance (
  product_id STRING NOT NULL COMMENT 'Olist product identifier',
  display_name STRING COMMENT 'Synthetic display label from dim_product',
  category_en STRING COMMENT 'Product category in English, unknown when missing',
  orders BIGINT COMMENT 'Distinct valid orders containing the product',
  units_sold BIGINT COMMENT 'Items sold',
  gmv DECIMAL(18, 2) COMMENT 'Sum of item prices in BRL, excluding freight',
  average_price DECIMAL(12, 2) COMMENT 'GMV divided by units sold',
  average_review_score DECIMAL(4, 2) COMMENT 'Average latest review score of the orders containing the product',
  first_sale_date DATE COMMENT 'First purchase date of the product',
  last_sale_date DATE COMMENT 'Last purchase date of the product',
  gmv_rank INT COMMENT 'Rank by GMV across all products, 1 is the highest'
)
COMMENT 'Lifetime performance per product over valid orders. Currency BRL.'
AS
WITH product_orders AS (
  SELECT
    product_id,
    order_id,
    any_value(review_score) AS review_score,
    count(*) AS units,
    sum(price) AS gmv,
    min(order_date) AS order_date
  FROM gold.fact_sales
  WHERE is_valid_sale
  GROUP BY product_id, order_id
),
product_totals AS (
  SELECT
    product_id,
    count(*) AS orders,
    sum(units) AS units_sold,
    sum(gmv) AS gmv,
    avg(review_score) AS average_review_score,
    min(order_date) AS first_sale_date,
    max(order_date) AS last_sale_date
  FROM product_orders
  GROUP BY product_id
)
SELECT
  product_totals.product_id,
  dim_product.display_name,
  dim_product.category_en,
  product_totals.orders,
  product_totals.units_sold,
  CAST(product_totals.gmv AS DECIMAL(18, 2)) AS gmv,
  CAST(product_totals.gmv / product_totals.units_sold AS DECIMAL(12, 2)) AS average_price,
  CAST(product_totals.average_review_score AS DECIMAL(4, 2)) AS average_review_score,
  product_totals.first_sale_date,
  product_totals.last_sale_date,
  CAST(rank() OVER (ORDER BY product_totals.gmv DESC) AS INT) AS gmv_rank
FROM product_totals
LEFT JOIN gold.dim_product AS dim_product ON product_totals.product_id = dim_product.product_id;
