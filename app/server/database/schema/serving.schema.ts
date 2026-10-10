import { bigint, date, integer, numeric, pgSchema, text, boolean } from 'drizzle-orm/pg-core';

export const servingSchema = pgSchema('serving');

const money = (name: string) => numeric(name, { precision: 18, scale: 2, mode: 'number' });
const ratio = (name: string) => numeric(name, { precision: 6, scale: 4, mode: 'number' });
const score = (name: string) => numeric(name, { precision: 4, scale: 2, mode: 'number' });
const count = (name: string) => bigint(name, { mode: 'number' });

export const kpiDaily = servingSchema.table('kpi_daily', {
  orderDate: date('order_date', { mode: 'string' }).notNull(),
  orders: count('orders'),
  itemsSold: count('items_sold'),
  gmv: money('gmv'),
  freight: money('freight'),
  customers: count('customers'),
  averageOrderValue: money('average_order_value'),
  averageReviewScore: score('average_review_score'),
  reviewedOrders: count('reviewed_orders'),
  reviewScoreSum: count('review_score_sum'),
  deliveredOrders: count('delivered_orders'),
  lateOrders: count('late_orders'),
  lateDeliveryRate: ratio('late_delivery_rate'),
});

export const customerActivityDaily = servingSchema.table('customer_activity_daily', {
  orderDate: date('order_date', { mode: 'string' }).notNull(),
  customerUniqueId: text('customer_unique_id').notNull(),
});

export const salesByCategoryMonth = servingSchema.table('sales_by_category_month', {
  orderMonth: date('order_month', { mode: 'string' }).notNull(),
  categoryEn: text('category_en').notNull(),
  orders: count('orders'),
  unitsSold: count('units_sold'),
  gmv: money('gmv'),
  freight: money('freight'),
  averageItemPrice: numeric('average_item_price', { precision: 12, scale: 2, mode: 'number' }),
});

export const salesByStateMonth = servingSchema.table('sales_by_state_month', {
  orderMonth: date('order_month', { mode: 'string' }).notNull(),
  customerState: text('customer_state').notNull(),
  orders: count('orders'),
  customers: count('customers'),
  gmv: money('gmv'),
  freight: money('freight'),
  averageOrderValue: money('average_order_value'),
  lateDeliveryRate: ratio('late_delivery_rate'),
});

export const productPerformance = servingSchema.table('product_performance', {
  productId: text('product_id').notNull(),
  displayName: text('display_name'),
  categoryEn: text('category_en'),
  orders: count('orders'),
  unitsSold: count('units_sold'),
  gmv: money('gmv'),
  averagePrice: numeric('average_price', { precision: 12, scale: 2, mode: 'number' }),
  averageReviewScore: score('average_review_score'),
  firstSaleDate: date('first_sale_date', { mode: 'string' }),
  lastSaleDate: date('last_sale_date', { mode: 'string' }),
  gmvRank: integer('gmv_rank'),
});

export const sellerPerformance = servingSchema.table('seller_performance', {
  sellerId: text('seller_id').notNull(),
  sellerState: text('seller_state'),
  sellerCity: text('seller_city'),
  orders: count('orders'),
  unitsSold: count('units_sold'),
  gmv: money('gmv'),
  averageReviewScore: score('average_review_score'),
  deliveredOrders: count('delivered_orders'),
  lateOrders: count('late_orders'),
  lateDeliveryRate: ratio('late_delivery_rate'),
  gmvRank: integer('gmv_rank'),
});

export const dimProduct = servingSchema.table('dim_product', {
  productId: text('product_id').notNull(),
  displayName: text('display_name').notNull(),
  categoryEn: text('category_en').notNull(),
  categoryPt: text('category_pt'),
  isCategoryMissing: boolean('is_category_missing'),
  weightG: integer('weight_g'),
  lengthCm: integer('length_cm'),
  heightCm: integer('height_cm'),
  widthCm: integer('width_cm'),
  photosQuantity: integer('photos_quantity'),
  medianPriceBrl: numeric('median_price_brl', { precision: 12, scale: 2, mode: 'number' }),
});
