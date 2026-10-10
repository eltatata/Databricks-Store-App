CREATE SCHEMA "app";
--> statement-breakpoint
CREATE TABLE "app"."audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_email" text NOT NULL,
	"channel" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_log_channel_valid" CHECK ("app"."audit_log"."channel" IN ('ui', 'agent'))
);
--> statement-breakpoint
CREATE TABLE "app"."products" (
	"product_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"category_en" text NOT NULL,
	"weight_g" integer,
	"length_cm" integer,
	"height_cm" integer,
	"width_cm" integer,
	"list_price_brl" numeric(12, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "products_display_name_length" CHECK (length("app"."products"."display_name") BETWEEN 1 AND 200),
	CONSTRAINT "products_category_present" CHECK (length("app"."products"."category_en") BETWEEN 1 AND 100),
	CONSTRAINT "products_weight_non_negative" CHECK ("app"."products"."weight_g" >= 0),
	CONSTRAINT "products_length_non_negative" CHECK ("app"."products"."length_cm" >= 0),
	CONSTRAINT "products_height_non_negative" CHECK ("app"."products"."height_cm" >= 0),
	CONSTRAINT "products_width_non_negative" CHECK ("app"."products"."width_cm" >= 0),
	CONSTRAINT "products_price_non_negative" CHECK ("app"."products"."list_price_brl" >= 0),
	CONSTRAINT "products_source_valid" CHECK ("app"."products"."source" IN ('olist_seed', 'app')),
	CONSTRAINT "products_version_positive" CHECK ("app"."products"."version" >= 1)
);
--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "app"."audit_log" USING btree ("entity","entity_id","occurred_at");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "app"."products" USING btree ("category_en");--> statement-breakpoint
CREATE INDEX "products_is_active_idx" ON "app"."products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "products_display_name_lower_idx" ON "app"."products" USING btree (lower("display_name"));