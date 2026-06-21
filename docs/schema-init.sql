-- HalfMoon — Script de inicialización para Neon (PostgreSQL)
-- Documentación: docs/database-neon.md

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "admins" (
  "id" serial PRIMARY KEY,
  "full_name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL CONSTRAINT "admins_email_key" UNIQUE,
  "password_hash" varchar(255) NOT NULL,
  "role" varchar(50) DEFAULT 'admin',
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "leads" (
  "id" serial PRIMARY KEY,
  "full_name" varchar(255) NOT NULL,
  "phone" varchar(50) NOT NULL,
  "email" varchar(255),
  "origin" varchar(100) DEFAULT 'Canvas Web',
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "canvas_designs" (
  "id" serial PRIMARY KEY,
  "lead_id" integer,
  "product" varchar(255) NOT NULL,
  "bg_color" varchar(50) DEFAULT '#f1f5f9',
  "customer_comment" text,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "catalog_items" (
  "id" serial PRIMARY KEY,
  "title" varchar(255) NOT NULL,
  "category" varchar(100),
  "stock" varchar(50),
  "price" varchar(50),
  "description" text,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "orders" (
  "id" serial PRIMARY KEY,
  "order_code" varchar(50) NOT NULL CONSTRAINT "orders_order_code_key" UNIQUE,
  "lead_id" integer,
  "design_id" integer,
  "quantity" integer DEFAULT 1 NOT NULL,
  "total_price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
  "status" varchar(50) DEFAULT 'Pendiente',
  "delivery_date" varchar(100),
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "settings" (
  "id" serial PRIMARY KEY,
  "business_name" varchar(255) DEFAULT 'HalfMoon Indumentaria' NOT NULL,
  "support_email" varchar(255) DEFAULT 'hola@halfmoon.com',
  "whatsapp_number" varchar(50) DEFAULT '91143218765',
  "whatsapp_message" text DEFAULT '¡Hola equipo de HalfMoon! Acabo de armar este diseño en la web y me gustaría pedir un presupuesto.',
  "notify_new_leads" boolean DEFAULT true,
  "notify_orders" boolean DEFAULT true,
  "logo_url" text,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "admins_email_key" ON "admins" ("email");
CREATE UNIQUE INDEX "admins_pkey" ON "admins" ("id");
CREATE UNIQUE INDEX "canvas_designs_pkey" ON "canvas_designs" ("id");
CREATE UNIQUE INDEX "catalog_items_pkey" ON "catalog_items" ("id");
CREATE UNIQUE INDEX "leads_pkey" ON "leads" ("id");
CREATE UNIQUE INDEX "orders_order_code_key" ON "orders" ("order_code");
CREATE UNIQUE INDEX "orders_pkey" ON "orders" ("id");
CREATE UNIQUE INDEX "settings_pkey" ON "settings" ("id");

ALTER TABLE "canvas_designs"
  ADD CONSTRAINT "canvas_designs_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "leads"("id");

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_design_id_fkey"
  FOREIGN KEY ("design_id") REFERENCES "canvas_designs"("id") ON DELETE SET NULL;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT;

INSERT INTO "admins" ("id", "full_name", "email", "password_hash", "role", "created_at") VALUES
(1, 'Admin HalfMoon', 'halfmoon@admin.com', '1234', 'superadmin', '2026-06-09 01:16:19.488372');

INSERT INTO "catalog_items" ("id", "title", "category", "stock", "price", "description", "created_at") VALUES
(1, 'REMERA + ESTAMPADO', 'Remeras', 'Alto', '$12.500', 'Prendas premium de excelente caída, listas con tu logo o diseño.', '2026-06-09 00:45:04.423213'),
(2, 'BUZOS & CANGUROS', 'Buzos', 'Medio (15)', '$35.000', 'Frisa invisible de primera calidad para el invierno.', '2026-06-09 00:45:04.423213'),
(3, 'REMERA + ESTAMPADO', 'Remeras', 'Alto', '$12.500', 'Prendas premium de excelente caída, listas con tu logo o diseño.', '2026-06-09 00:54:11.631958'),
(4, 'BUZOS & CANGUROS', 'Buzos', 'Medio (15)', '$35.000', 'Frisa invisible de primera calidad para el invierno.', '2026-06-09 00:54:11.631958');

INSERT INTO "settings" ("id", "business_name", "support_email", "whatsapp_number", "whatsapp_message", "notify_new_leads", "notify_orders", "logo_url", "updated_at") VALUES
(1, 'HalfMoon Indumentaria', 'hola@halfmoon.com', '91143218765', '¡Hola equipo de HalfMoon! Acabo de armar este diseño en la web y me gustaría pedir un presupuesto.', true, true, NULL, '2026-06-09 00:54:11.455184');

SELECT setval('admins_id_seq', (SELECT MAX(id) FROM "admins"));
SELECT setval('catalog_items_id_seq', (SELECT MAX(id) FROM "catalog_items"));
SELECT setval('settings_id_seq', (SELECT MAX(id) FROM "settings"));
