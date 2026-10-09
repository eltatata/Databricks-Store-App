#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

require_var CATALOG
require_var LOCAL_DATASET_DIR

declare -A ENTITY_BY_FILE=(
  [olist_orders_dataset.csv]=orders
  [olist_order_items_dataset.csv]=order_items
  [olist_order_payments_dataset.csv]=order_payments
  [olist_order_reviews_dataset.csv]=order_reviews
  [olist_customers_dataset.csv]=customers
  [olist_sellers_dataset.csv]=sellers
  [olist_products_dataset.csv]=products
  [product_category_name_translation.csv]=category_translations
)

local_dataset_dir="$REPO_ROOT/$LOCAL_DATASET_DIR"
landing_path="dbfs:/Volumes/$CATALOG/bronze/landing/olist"

for file_name in "${!ENTITY_BY_FILE[@]}"; do
  [[ -s "$local_dataset_dir/$file_name" ]] || fail "Missing or empty $local_dataset_dir/$file_name"
done

for file_name in "${!ENTITY_BY_FILE[@]}"; do
  entity="${ENTITY_BY_FILE[$file_name]}"
  info "Uploading $file_name to $landing_path/$entity/"
  dbx fs mkdir "$landing_path/$entity"
  dbx fs cp "$local_dataset_dir/$file_name" "$landing_path/$entity/$file_name" --overwrite
done

info "Uploaded ${#ENTITY_BY_FILE[@]} files to $landing_path"
