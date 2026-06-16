CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"branch_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"shift_type" text NOT NULL,
	"check_in_time" timestamp NOT NULL,
	"check_out_time" timestamp,
	"check_in_photo" text,
	"check_out_photo" text,
	"break_start_time" timestamp,
	"break_end_time" timestamp,
	"break_duration" integer DEFAULT 0,
	"total_hours" numeric(5, 2) DEFAULT '0',
	"status" text DEFAULT 'checked_in' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" varchar(20),
	"status" text DEFAULT 'active' NOT NULL,
	"manager_id" integer,
	"operating_hours" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" varchar(20),
	"email" text,
	"address" text,
	"total_visits" integer DEFAULT 0,
	"total_spent" numeric(12, 2) DEFAULT '0',
	"loyalty_points" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_id" uuid NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text NOT NULL,
	"receipt_url" text,
	"requested_by" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	"rejection_notes" text,
	"expense_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kasbon" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"remaining_amount" numeric(12, 2) NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"request_date" timestamp DEFAULT now() NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	"rejection_reason" text,
	"installment_amount" numeric(12, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"points" integer NOT NULL,
	"reason" text NOT NULL,
	"given_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"avatar" text,
	"bio" text,
	"date_of_birth" timestamp,
	"emergency_contact" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "receipt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"header_text" text,
	"footer_text" text,
	"logo_url" text,
	"logo_height" integer DEFAULT 40,
	"branch_id" uuid,
	"paper_size" varchar(10) DEFAULT '80mm',
	"paper_width" integer DEFAULT 80,
	"font_size" varchar(10) DEFAULT 'medium',
	"show_logo" boolean DEFAULT false,
	"show_address" boolean DEFAULT true,
	"show_phone" boolean DEFAULT true,
	"show_date" boolean DEFAULT true,
	"show_barber" boolean DEFAULT true,
	"show_cashier" boolean DEFAULT true,
	"show_customer" boolean DEFAULT true,
	"is_active" boolean DEFAULT false,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(12, 2) NOT NULL,
	"duration" integer,
	"aktif" boolean DEFAULT true NOT NULL,
	"category_id" integer,
	"commission_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"type" text DEFAULT 'service' NOT NULL,
	"stock" integer DEFAULT 0,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" integer NOT NULL,
	"service_id" integer NOT NULL,
	"barber_id" integer,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"commission_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"commission_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"commission_status" text DEFAULT 'credited' NOT NULL,
	"service_name" text NOT NULL,
	"service_type" text NOT NULL,
	"service_category" text,
	"barber_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_number" varchar(50) NOT NULL,
	"branch_id" uuid NOT NULL,
	"cashier_id" integer NOT NULL,
	"customer_name" text,
	"customer_phone" varchar(20),
	"subtotal" numeric(12, 2) NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"payment_amount" numeric(12, 2) NOT NULL,
	"change_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"cashier_name" text NOT NULL,
	"branch_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_transaction_number_unique" UNIQUE("transaction_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"pin" varchar(6),
	"role" text NOT NULL,
	"name" text NOT NULL,
	"phone" varchar(20),
	"address" text,
	"position" text,
	"branch_id" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
