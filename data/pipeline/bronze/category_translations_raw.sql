CREATE OR REFRESH STREAMING TABLE bronze.category_translations_raw
COMMENT 'Raw rows of product_category_name_translation.csv from the Olist Kaggle dataset. Source columns kept as STRING, plus ingestion metadata.'
AS SELECT
  *,
  _metadata.file_path AS source_file,
  _metadata.file_modification_time AS source_file_modified_at,
  current_timestamp() AS ingested_at
FROM STREAM read_files(
  '${olist_landing_path}/category_translations/',
  format => 'csv',
  header => true,
  multiLine => true,
  escape => '"',
  schema => 'product_category_name STRING, product_category_name_english STRING',
  rescuedDataColumn => '_rescued_data'
);
