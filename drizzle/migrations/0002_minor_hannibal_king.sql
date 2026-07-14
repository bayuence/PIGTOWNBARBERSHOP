ALTER TABLE "kasbon" ALTER COLUMN "remaining_amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "kasbon" ADD COLUMN "paid_amount" numeric(12, 2) DEFAULT '0';