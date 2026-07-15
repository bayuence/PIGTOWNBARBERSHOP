CREATE TABLE "kasbon_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"kasbon_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"payment_type" text NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
