import { sql } from 'drizzle-orm';
import {
  bigserial,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { AUDIT_CHANNELS, PRODUCT_SOURCES } from '../../config/constants';

export const appSchema = pgSchema('app');

export const products = appSchema.table(
  'products',
  {
    productId: text('product_id').primaryKey(),
    displayName: text('display_name').notNull(),
    categoryEn: text('category_en').notNull(),
    weightG: integer('weight_g'),
    lengthCm: integer('length_cm'),
    heightCm: integer('height_cm'),
    widthCm: integer('width_cm'),
    listPriceBrl: numeric('list_price_brl', { precision: 12, scale: 2, mode: 'number' }),
    isActive: boolean('is_active').notNull().default(true),
    source: text('source', { enum: PRODUCT_SOURCES }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    version: integer('version').notNull().default(1),
  },
  (table) => [
    check('products_display_name_length', sql`length(${table.displayName}) BETWEEN 1 AND 200`),
    check('products_category_present', sql`length(${table.categoryEn}) BETWEEN 1 AND 100`),
    check('products_weight_non_negative', sql`${table.weightG} >= 0`),
    check('products_length_non_negative', sql`${table.lengthCm} >= 0`),
    check('products_height_non_negative', sql`${table.heightCm} >= 0`),
    check('products_width_non_negative', sql`${table.widthCm} >= 0`),
    check('products_price_non_negative', sql`${table.listPriceBrl} >= 0`),
    check('products_source_valid', sql`${table.source} IN ('olist_seed', 'app')`),
    check('products_version_positive', sql`${table.version} >= 1`),
    index('products_category_idx').on(table.categoryEn),
    index('products_is_active_idx').on(table.isActive),
    index('products_display_name_lower_idx').on(sql`lower(${table.displayName})`),
  ]
);

export const auditLog = appSchema.table(
  'audit_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    actorEmail: text('actor_email').notNull(),
    channel: text('channel', { enum: AUDIT_CHANNELS }).notNull(),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id').notNull(),
    before: jsonb('before'),
    after: jsonb('after'),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    check('audit_log_channel_valid', sql`${table.channel} IN ('ui', 'agent')`),
    index('audit_log_entity_idx').on(table.entity, table.entityId, table.occurredAt),
  ]
);
