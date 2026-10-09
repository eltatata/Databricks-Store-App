CREATE OR REFRESH STREAMING TABLE bronze.order_payments_raw
COMMENT 'Raw rows of olist_order_payments_dataset.csv from the Olist Kaggle dataset. Source columns kept as STRING, plus ingestion metadata.'
AS SELECT
  *,
  _metadata.file_path AS source_file,
  _metadata.file_modification_time AS source_file_modified_at,
  current_timestamp() AS ingested_at
FROM STREAM read_files(
  '${olist_landing_path}/order_payments/',
  format => 'csv',
  header => true,
  multiLine => true,
  escape => '"',
  schema => 'order_id STRING, payment_sequential STRING, payment_type STRING, payment_installments STRING, payment_value STRING',
  rescuedDataColumn => '_rescued_data'
);
