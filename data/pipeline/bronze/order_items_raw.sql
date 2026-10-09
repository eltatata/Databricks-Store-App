CREATE OR REFRESH STREAMING TABLE bronze.order_items_raw
COMMENT 'Raw rows of olist_order_items_dataset.csv from the Olist Kaggle dataset. Source columns kept as STRING, plus ingestion metadata.'
AS SELECT
  *,
  _metadata.file_path AS source_file,
  _metadata.file_modification_time AS source_file_modified_at,
  current_timestamp() AS ingested_at
FROM STREAM read_files(
  '${olist_landing_path}/order_items/',
  format => 'csv',
  header => true,
  multiLine => true,
  escape => '"',
  schema => 'order_id STRING, order_item_id STRING, product_id STRING, seller_id STRING, shipping_limit_date STRING, price STRING, freight_value STRING',
  rescuedDataColumn => '_rescued_data'
);
