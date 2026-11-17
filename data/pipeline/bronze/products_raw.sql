CREATE OR REFRESH STREAMING TABLE bronze.products_raw
COMMENT 'Raw rows of olist_products_dataset.csv from the Olist Kaggle dataset. Source columns kept as STRING, plus ingestion metadata.'
AS SELECT
  *,
  _metadata.file_path AS source_file,
  _metadata.file_modification_time AS source_file_modified_at,
  current_timestamp() AS ingested_at
FROM STREAM read_files(
  '${olist_landing_path}/products/',
  format => 'csv',
  header => true,
  multiLine => true,
  escape => '"',
  schema => 'product_id STRING, product_category_name STRING, product_name_lenght STRING, product_description_lenght STRING, product_photos_qty STRING, product_weight_g STRING, product_length_cm STRING, product_height_cm STRING, product_width_cm STRING',
  rescuedDataColumn => '_rescued_data'
);
