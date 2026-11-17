CREATE OR REFRESH MATERIALIZED VIEW gold.kpi_daily (
  order_date DATE NOT NULL COMMENT 'Purchase date',
  orders BIGINT COMMENT 'Valid orders placed on the date',
  items_sold BIGINT COMMENT 'Items in valid orders',
  gmv DECIMAL(18, 2) COMMENT 'Gross merchandise value in BRL: sum of item prices of valid orders, excluding freight',
  freight DECIMAL(18, 2) COMMENT 'Freight in BRL of valid orders',
  customers BIGINT COMMENT 'Distinct customers (customer_unique_id) with a valid order on the date. Not additive across dates',
  average_order_value DECIMAL(18, 2) COMMENT 'GMV divided by orders',
  average_review_score DECIMAL(4, 2) COMMENT 'Average latest review score of valid orders placed on the date',
  reviewed_orders BIGINT COMMENT 'Valid orders with a review. Additive; use with review_score_sum to average over any period',
  review_score_sum BIGINT COMMENT 'Sum of the latest review scores of valid orders. Additive',
  delivered_orders BIGINT COMMENT 'Valid orders already delivered',
  late_orders BIGINT COMMENT 'Delivered orders that arrived after the estimated date',
  late_delivery_rate DECIMAL(6, 4) COMMENT 'Late orders divided by delivered orders, null when none delivered'
)
COMMENT 'Daily KPIs by purchase date over valid orders (status not canceled or unavailable, at least one item). Currency BRL.'
AS SELECT
  order_date,
  count(*) AS orders,
  sum(items_count) AS items_sold,
  CAST(sum(gmv) AS DECIMAL(18, 2)) AS gmv,
  CAST(sum(freight) AS DECIMAL(18, 2)) AS freight,
  count(DISTINCT customer_unique_id) AS customers,
  CAST(sum(gmv) / count(*) AS DECIMAL(18, 2)) AS average_order_value,
  CAST(avg(review_score) AS DECIMAL(4, 2)) AS average_review_score,
  count(review_score) AS reviewed_orders,
  CAST(sum(review_score) AS BIGINT) AS review_score_sum,
  count_if(is_delivered) AS delivered_orders,
  count_if(is_delivered AND is_late_delivery) AS late_orders,
  CAST(count_if(is_delivered AND is_late_delivery) / nullif(count_if(is_delivered), 0) AS DECIMAL(6, 4)) AS late_delivery_rate
FROM gold.fact_orders
WHERE is_valid_sale
GROUP BY order_date;
