CREATE OR REFRESH MATERIALIZED VIEW gold.fact_sales (
  order_id STRING COMMENT 'Olist order identifier',
  order_item_id INT COMMENT 'Sequential item number inside the order',
  product_id STRING COMMENT 'Product sold in this item',
  seller_id STRING COMMENT 'Seller that fulfilled this item',
  customer_unique_id STRING COMMENT 'Real customer identifier across orders',
  customer_state STRING COMMENT 'Two-letter Brazilian state (UF) of the customer, unknown when missing',
  customer_city STRING COMMENT 'Customer city in lowercase',
  seller_state STRING COMMENT 'Two-letter Brazilian state (UF) of the seller, unknown when missing',
  order_status STRING COMMENT 'Order status: created, approved, invoiced, processing, shipped, delivered, canceled, unavailable',
  is_valid_sale BOOLEAN COMMENT 'True when the order status is not canceled or unavailable. KPIs only count valid sales',
  purchased_at TIMESTAMP_NTZ COMMENT 'Purchase timestamp in local Brazil time',
  order_date DATE COMMENT 'Purchase date',
  order_month DATE COMMENT 'First day of the purchase month',
  delivered_to_customer_at TIMESTAMP_NTZ COMMENT 'Delivery timestamp to the customer, null when not delivered',
  estimated_delivery_date DATE COMMENT 'Delivery date promised to the customer',
  is_delivered BOOLEAN COMMENT 'True when the order status is delivered and a delivery timestamp exists',
  is_late_delivery BOOLEAN COMMENT 'True when delivered after the estimated delivery date, null when not delivered',
  category_en STRING COMMENT 'Product category in English, unknown when missing',
  price DECIMAL(12, 2) COMMENT 'Item price in BRL, excluding freight. Sum of price is GMV',
  freight_value DECIMAL(12, 2) COMMENT 'Item freight in BRL',
  review_score INT COMMENT 'Latest review score of the order (1 to 5), null when not reviewed'
)
COMMENT 'Sales fact at order item grain. Source for GMV, units and category/product/seller analysis. Currency BRL.'
AS
WITH latest_order_reviews AS (
  SELECT order_id, review_score
  FROM silver.order_reviews
  QUALIFY row_number() OVER (PARTITION BY order_id ORDER BY answered_at DESC NULLS LAST, created_at DESC NULLS LAST, review_id) = 1
)
SELECT
  items.order_id,
  items.order_item_id,
  items.product_id,
  items.seller_id,
  customers.customer_unique_id,
  coalesce(customers.state, 'unknown') AS customer_state,
  customers.city AS customer_city,
  coalesce(sellers.state, 'unknown') AS seller_state,
  orders.order_status,
  orders.order_status NOT IN ('canceled', 'unavailable') AS is_valid_sale,
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
  coalesce(products.category_en, 'unknown') AS category_en,
  items.price,
  items.freight_value,
  latest_order_reviews.review_score
FROM silver.order_items AS items
JOIN silver.orders AS orders ON items.order_id = orders.order_id
LEFT JOIN silver.customers AS customers ON orders.customer_id = customers.customer_id
LEFT JOIN silver.sellers AS sellers ON items.seller_id = sellers.seller_id
LEFT JOIN silver.products AS products ON items.product_id = products.product_id
LEFT JOIN latest_order_reviews ON items.order_id = latest_order_reviews.order_id;
