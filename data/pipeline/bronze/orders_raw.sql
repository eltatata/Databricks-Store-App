CREATE OR REFRESH STREAMING TABLE bronze.orders_raw
COMMENT 'Raw rows of olist_orders_dataset.csv from the Olist Kaggle dataset. Source columns kept as STRING, plus ingestion metadata.'
AS SELECT
  *,
  _metadata.file_path AS source_file,
  _metadata.file_modification_time AS source_file_modified_at,
  current_timestamp() AS ingested_at
FROM STREAM read_files(
  '${olist_landing_path}/orders/',
  format => 'csv',
  header => true,
  multiLine => true,
  escape => '"',
  schema => 'order_id STRING, customer_id STRING, order_status STRING, order_purchase_timestamp STRING, order_approved_at STRING, order_delivered_carrier_date STRING, order_delivered_customer_date STRING, order_estimated_delivery_date STRING',
  rescuedDataColumn => '_rescued_data'
);
