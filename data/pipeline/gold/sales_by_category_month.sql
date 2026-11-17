CREATE OR REFRESH MATERIALIZED VIEW gold.sales_by_category_month (
  order_month DATE NOT NULL COMMENT 'First day of the purchase month',
  category_en STRING NOT NULL COMMENT 'Product category in English, unknown when missing',
  orders BIGINT COMMENT 'Distinct valid orders containing the category. Not additive across categories',
  units_sold BIGINT COMMENT 'Items sold in the category',
  gmv DECIMAL(18, 2) COMMENT 'Sum of item prices in BRL, excluding freight',
  freight DECIMAL(18, 2) COMMENT 'Sum of item freight in BRL',
  average_item_price DECIMAL(12, 2) COMMENT 'GMV divided by units sold'
)
COMMENT 'Monthly sales by product category over valid orders. Currency BRL.'
AS SELECT
  order_month,
  category_en,
  count(DISTINCT order_id) AS orders,
  count(*) AS units_sold,
  CAST(sum(price) AS DECIMAL(18, 2)) AS gmv,
  CAST(sum(freight_value) AS DECIMAL(18, 2)) AS freight,
  CAST(sum(price) / count(*) AS DECIMAL(12, 2)) AS average_item_price
FROM gold.fact_sales
WHERE is_valid_sale
GROUP BY order_month, category_en;
