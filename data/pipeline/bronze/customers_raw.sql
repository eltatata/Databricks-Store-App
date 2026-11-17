CREATE OR REFRESH STREAMING TABLE bronze.customers_raw
COMMENT 'Raw rows of olist_customers_dataset.csv from the Olist Kaggle dataset. Source columns kept as STRING, plus ingestion metadata.'
AS SELECT
  *,
  _metadata.file_path AS source_file,
  _metadata.file_modification_time AS source_file_modified_at,
  current_timestamp() AS ingested_at
FROM STREAM read_files(
  '${olist_landing_path}/customers/',
  format => 'csv',
  header => true,
  multiLine => true,
  escape => '"',
  schema => 'customer_id STRING, customer_unique_id STRING, customer_zip_code_prefix STRING, customer_city STRING, customer_state STRING',
  rescuedDataColumn => '_rescued_data'
);
