CREATE OR REFRESH MATERIALIZED VIEW gold.sales_by_state_month (
  order_month DATE NOT NULL COMMENT 'First day of the purchase month',
  customer_state STRING NOT NULL COMMENT 'Two-letter Brazilian state (UF) of the customer, unknown when missing',
  orders BIGINT COMMENT 'Valid orders placed by customers of the state',
  customers BIGINT COMMENT 'Distinct customers of the state with a valid order in the month',
  gmv DECIMAL(18, 2) COMMENT 'Sum of item prices in BRL, excluding freight',
  freight DECIMAL(18, 2) COMMENT 'Sum of item freight in BRL',
  average_order_value DECIMAL(18, 2) COMMENT 'GMV divided by orders',
  late_delivery_rate DECIMAL(6, 4) COMMENT 'Late orders divided by delivered orders, null when none delivered'
)
COMMENT 'Monthly sales by customer state over valid orders. Currency BRL.'
AS SELECT
  order_month,
  customer_state,
  count(*) AS orders,
  count(DISTINCT customer_unique_id) AS customers,
  CAST(sum(gmv) AS DECIMAL(18, 2)) AS gmv,
  CAST(sum(freight) AS DECIMAL(18, 2)) AS freight,
  CAST(sum(gmv) / count(*) AS DECIMAL(18, 2)) AS average_order_value,
  CAST(count_if(is_delivered AND is_late_delivery) / nullif(count_if(is_delivered), 0) AS DECIMAL(6, 4)) AS late_delivery_rate
FROM gold.fact_orders
WHERE is_valid_sale
GROUP BY order_month, customer_state;
