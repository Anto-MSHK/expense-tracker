CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sum" numeric(12, 2) NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
