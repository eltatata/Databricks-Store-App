CREATE OR REFRESH MATERIALIZED VIEW gold.seller_performance (
  seller_id STRING NOT NULL COMMENT 'Olist seller identifier',
  seller_state STRING COMMENT 'Two-letter Brazilian state (UF) of the seller, unknown when missing',
  seller_city STRING COMMENT 'Seller city in lowercase',
  orders BIGINT COMMENT 'Distinct valid orders with at least one item from the seller',
  units_sold BIGINT COMMENT 'Items sold by the seller',
  gmv DECIMAL(18, 2) COMMENT 'Sum of item prices in BRL, excluding freight',
  average_review_score DECIMAL(4, 2) COMMENT 'Average latest review score of the orders containing the seller',
  delivered_orders BIGINT COMMENT 'Orders already delivered',
  late_orders BIGINT COMMENT 'Delivered orders that arrived after the estimated date',
  late_delivery_rate DECIMAL(6, 4) COMMENT 'Late orders divided by delivered orders, null when none delivered',
  gmv_rank INT COMMENT 'Rank by GMV across all sellers, 1 is the highest'
)
COMMENT 'Lifetime performance per seller over valid orders. Currency BRL.'
AS
WITH seller_orders AS (
  SELECT
    seller_id,
    order_id,
    any_value(review_score) AS review_score,
    any_value(is_delivered) AS is_delivered,
    any_value(is_late_delivery) AS is_late_delivery,
    count(*) AS units,
    sum(price) AS gmv
  FROM gold.fact_sales
  WHERE is_valid_sale
  GROUP BY seller_id, order_id
),
seller_totals AS (
  SELECT
    seller_id,
    count(*) AS orders,
    sum(units) AS units_sold,
    sum(gmv) AS gmv,
    avg(review_score) AS average_review_score,
    count_if(is_delivered) AS delivered_orders,
    count_if(is_delivered AND is_late_delivery) AS late_orders
  FROM seller_orders
  GROUP BY seller_id
)
SELECT
  seller_totals.seller_id,
  coalesce(sellers.state, 'unknown') AS seller_state,
  sellers.city AS seller_city,
  seller_totals.orders,
  seller_totals.units_sold,
  CAST(seller_totals.gmv AS DECIMAL(18, 2)) AS gmv,
  CAST(seller_totals.average_review_score AS DECIMAL(4, 2)) AS average_review_score,
  seller_totals.delivered_orders,
  seller_totals.late_orders,
  CAST(seller_totals.late_orders / nullif(seller_totals.delivered_orders, 0) AS DECIMAL(6, 4)) AS late_delivery_rate,
  CAST(rank() OVER (ORDER BY seller_totals.gmv DESC) AS INT) AS gmv_rank
FROM seller_totals
LEFT JOIN silver.sellers AS sellers ON seller_totals.seller_id = sellers.seller_id;
