CREATE INDEX IF NOT EXISTS dim_product_category_idx ON serving.dim_product (category_en);
CREATE INDEX IF NOT EXISTS dim_product_display_name_idx ON serving.dim_product (lower(display_name));
CREATE INDEX IF NOT EXISTS product_performance_gmv_rank_idx ON serving.product_performance (gmv_rank);
CREATE INDEX IF NOT EXISTS product_performance_category_idx ON serving.product_performance (category_en);
CREATE INDEX IF NOT EXISTS seller_performance_gmv_rank_idx ON serving.seller_performance (gmv_rank);
CREATE INDEX IF NOT EXISTS sales_by_category_month_category_idx ON serving.sales_by_category_month (category_en, order_month);
CREATE INDEX IF NOT EXISTS sales_by_state_month_state_idx ON serving.sales_by_state_month (customer_state, order_month);
