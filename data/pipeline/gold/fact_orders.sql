CREATE OR REFRESH MATERIALIZED VIEW gold.fact_orders (
  order_id STRING COMMENT 'Olist order identifier',
  customer_unique_id STRING COMMENT 'Real customer identifier across orders',
  customer_state STRING COMMENT 'Two-letter Brazilian state (UF) of the customer, unknown when missing',
  customer_city STRING COMMENT 'Customer city in lowercase',
  order_status STRING COMMENT 'Order status: created, approved, invoiced, processing, shipped, delivered, canceled, unavailable',
  is_valid_sale BOOLEAN COMMENT 'True when the status is not canceled or unavailable and the order has at least one item. KPIs only count valid sales',
  purchased_at TIMESTAMP_NTZ COMMENT 'Purchase timestamp in local Brazil time',
  order_date DATE COMMENT 'Purchase date',
  order_month DATE COMMENT 'First day of the purchase month',
  delivered_to_customer_at TIMESTAMP_NTZ COMMENT 'Delivery timestamp to the customer, null when not delivered',
  estimated_delivery_date DATE COMMENT 'Delivery date promised to the customer',
  is_delivered BOOLEAN COMMENT 'True when the order status is delivered and a delivery timestamp exists',
  is_late_delivery BOOLEAN COMMENT 'True when delivered after the estimated delivery date, null when not delivered',
  delivery_days INT COMMENT 'Days from purchase to delivery, null when not delivered',
  items_count INT COMMENT 'Number of items in the order',
  sellers_count INT COMMENT 'Number of distinct sellers in the order',
  gmv DECIMAL(18, 2) COMMENT 'Sum of item prices in BRL, excluding freight',
  freight DECIMAL(18, 2) COMMENT 'Sum of item freight in BRL',
  payment_total DECIMAL(18, 2) COMMENT 'Sum of payments in BRL (price plus freight, may include interest)',
  primary_payment_type STRING COMMENT 'Payment type with the highest value in the order',
  max_payment_installments INT COMMENT 'Highest number of installments used in the order',
  review_score INT COMMENT 'Latest review score of the order (1 to 5), null when not reviewed'
)
COMMENT 'Orders fact at order grain. Source for order counts, AOV, customers, delivery performance and reviews. Currency BRL.'
AS
WITH item_totals AS (
  SELECT
    order_id,
    count(*) AS items_count,
    count(DISTINCT seller_id) AS sellers_count,
    sum(price) AS gmv,
    sum(freight_value) AS freight
  FROM silver.order_items
  GROUP BY order_id
),
payment_totals AS (
  SELECT
    order_id,
    sum(payment_value) AS payment_total,
    max_by(payment_type, payment_value) AS primary_payment_type,
    max(payment_installments) AS max_payment_installments
  FROM silver.order_payments
  GROUP BY order_id
),
latest_order_reviews AS (
  SELECT order_id, review_score
  FROM silver.order_reviews
  QUALIFY row_number() OVER (PARTITION BY order_id ORDER BY answered_at DESC NULLS LAST, created_at DESC NULLS LAST, review_id) = 1
)
SELECT
  orders.order_id,
  customers.customer_unique_id,
  coalesce(customers.state, 'unknown') AS customer_state,
  customers.city AS customer_city,
  orders.order_status,
  orders.order_status NOT IN ('canceled', 'unavailable') AND coalesce(item_totals.items_count, 0) > 0 AS is_valid_sale,
  orders.purchased_at,
  CAST(orders.purchased_at AS DATE) AS order_date,
  trunc(CAST(orders.purchased_at AS DATE), 'MM') AS order_month,
  orders.delivered_to_customer_at,
  orders.estimated_delivery_date,
  orders.order_status = 'delivered' AND orders.delivered_to_customer_at IS NOT NULL AS is_delivered,
  CASE
    WHEN orders.delivered_to_customer_at IS NULL THEN NULL
    ELSE CAST(orders.delivered_to_customer_at AS DATE) > orders.estimated_delivery_date
  END AS is_late_delivery,
  CAST(datediff(CAST(orders.delivered_to_customer_at AS DATE), CAST(orders.purchased_at AS DATE)) AS INT) AS delivery_days,
  CAST(coalesce(item_totals.items_count, 0) AS INT) AS items_count,
  CAST(coalesce(item_totals.sellers_count, 0) AS INT) AS sellers_count,
  CAST(coalesce(item_totals.gmv, 0) AS DECIMAL(18, 2)) AS gmv,
  CAST(coalesce(item_totals.freight, 0) AS DECIMAL(18, 2)) AS freight,
  CAST(payment_totals.payment_total AS DECIMAL(18, 2)) AS payment_total,
  payment_totals.primary_payment_type,
  payment_totals.max_payment_installments,
  latest_order_reviews.review_score
FROM silver.orders AS orders
LEFT JOIN silver.customers AS customers ON orders.customer_id = customers.customer_id
LEFT JOIN item_totals ON orders.order_id = item_totals.order_id
LEFT JOIN payment_totals ON orders.order_id = payment_totals.order_id
LEFT JOIN latest_order_reviews ON orders.order_id = latest_order_reviews.order_id;
