CREATE OR REFRESH STREAMING TABLE bronze.sellers_raw
COMMENT 'Raw rows of olist_sellers_dataset.csv from the Olist Kaggle dataset. Source columns kept as STRING, plus ingestion metadata.'
AS SELECT
  *,
  _metadata.file_path AS source_file,
  _metadata.file_modification_time AS source_file_modified_at,
  current_timestamp() AS ingested_at
FROM STREAM read_files(
  '${olist_landing_path}/sellers/',
  format => 'csv',
  header => true,
  multiLine => true,
  escape => '"',
  schema => 'seller_id STRING, seller_zip_code_prefix STRING, seller_city STRING, seller_state STRING',
  rescuedDataColumn => '_rescued_data'
);
