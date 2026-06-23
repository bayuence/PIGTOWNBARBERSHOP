ALTER TABLE "services" ADD COLUMN "cost_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD COLUMN "cost_price" numeric(12, 2) DEFAULT '0' NOT NULL;