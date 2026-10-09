CREATE OR REFRESH STREAMING TABLE bronze.order_reviews_raw
COMMENT 'Raw rows of olist_order_reviews_dataset.csv from the Olist Kaggle dataset. Source columns kept as STRING, plus ingestion metadata.'
AS SELECT
  *,
  _metadata.file_path AS source_file,
  _metadata.file_modification_time AS source_file_modified_at,
  current_timestamp() AS ingested_at
FROM STREAM read_files(
  '${olist_landing_path}/order_reviews/',
  format => 'csv',
  header => true,
  multiLine => true,
  escape => '"',
  schema => 'review_id STRING, order_id STRING, review_score STRING, review_comment_title STRING, review_comment_message STRING, review_creation_date STRING, review_answer_timestamp STRING',
  rescuedDataColumn => '_rescued_data'
);
