# Base de datos HalfMoon — Neon (PostgreSQL)

Script de inicialización para levantar el esquema, relaciones, datos de prueba y sincronización de secuencias en [Neon](https://neon.tech).

## Cómo ejecutarlo

1. Entrá al [Neon Console](https://console.neon.tech) y abrí tu proyecto.
2. Andá a **SQL Editor**.
3. Copiá y ejecutá el bloque completo de abajo (o el archivo `docs/schema-init.sql`).
4. Verificá que `DATABASE_URL` en `.env` apunte a la misma base (copiá `.env.example` → `.env`).

5. **Migración catálogo (recomendado):** ejecutá también [`sql/catalog-and-canvas-migration.sql`](sql/catalog-and-canvas-migration.sql) para cargar los 12 productos del home y la tabla `canvas_catalog_items`.

> **Orden de ejecución:** schema → índices → foreign keys → inserts → `setval` → migración catálogo.

---

## 1. Schema y tablas

```sql
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
```

### Tablas

| Tabla | Descripción |
|---|---|
| `admins` | Usuarios del panel de administración |
| `leads` | Contactos capturados desde la web o WhatsApp |
| `canvas_designs` | Diseños del personalizador, vinculados a un lead |
| `catalog_items` | Catálogo de productos visible en la landing y el admin |
| `orders` | Pedidos / producción |
| `settings` | Configuración general del negocio (fila única, `id = 1`) |

---

## 2. Índices

```sql
CREATE UNIQUE INDEX "admins_email_key" ON "admins" ("email");
CREATE UNIQUE INDEX "admins_pkey" ON "admins" ("id");
CREATE UNIQUE INDEX "canvas_designs_pkey" ON "canvas_designs" ("id");
CREATE UNIQUE INDEX "catalog_items_pkey" ON "catalog_items" ("id");
CREATE UNIQUE INDEX "leads_pkey" ON "leads" ("id");
CREATE UNIQUE INDEX "orders_order_code_key" ON "orders" ("order_code");
CREATE UNIQUE INDEX "orders_pkey" ON "orders" ("id");
CREATE UNIQUE INDEX "settings_pkey" ON "settings" ("id");
```

---

## 3. Foreign keys

```sql
ALTER TABLE "canvas_designs"
  ADD CONSTRAINT "canvas_designs_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "leads"("id");

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_design_id_fkey"
  FOREIGN KEY ("design_id") REFERENCES "canvas_designs"("id") ON DELETE SET NULL;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT;
```

### Relaciones

```
leads ──< canvas_designs
leads ──< orders >── canvas_designs (opcional)
```

---

## 4. Datos iniciales (seed)

```sql
-- admins
INSERT INTO "admins" ("id", "full_name", "email", "password_hash", "role", "created_at") VALUES
(1, 'Admin HalfMoon', 'halfmoon@admin.com', '1234', 'superadmin', '2026-06-09 01:16:19.488372');

-- catalog_items
INSERT INTO "catalog_items" ("id", "title", "category", "stock", "price", "description", "created_at") VALUES
(1, 'REMERA + ESTAMPADO', 'Remeras', 'Alto', '$12.500', 'Prendas premium de excelente caída, listas con tu logo o diseño.', '2026-06-09 00:45:04.423213'),
(2, 'BUZOS & CANGUROS', 'Buzos', 'Medio (15)', '$35.000', 'Frisa invisible de primera calidad para el invierno.', '2026-06-09 00:45:04.423213'),
(3, 'REMERA + ESTAMPADO', 'Remeras', 'Alto', '$12.500', 'Prendas premium de excelente caída, listas con tu logo o diseño.', '2026-06-09 00:54:11.631958'),
(4, 'BUZOS & CANGUROS', 'Buzos', 'Medio (15)', '$35.000', 'Frisa invisible de primera calidad para el invierno.', '2026-06-09 00:54:11.631958');

-- settings
INSERT INTO "settings" ("id", "business_name", "support_email", "whatsapp_number", "whatsapp_message", "notify_new_leads", "notify_orders", "logo_url", "updated_at") VALUES
(1, 'HalfMoon Indumentaria', 'hola@halfmoon.com', '91143218765', '¡Hola equipo de HalfMoon! Acabo de armar este diseño en la web y me gustaría pedir un presupuesto.', true, true, NULL, '2026-06-09 00:54:11.455184');
```

### Credenciales de prueba

| Campo | Valor |
|---|---|
| Email | `halfmoon@admin.com` |
| Password (hash en DB) | `1234` |

> El hash está en texto plano solo para desarrollo. Antes de producción, reemplazar por bcrypt u otro algoritmo seguro.

---

## 5. Sincronizar secuencias

Evita errores de `duplicate key` al insertar nuevos registros después del seed con IDs fijos.

```sql
SELECT setval('admins_id_seq', (SELECT MAX(id) FROM "admins"));
SELECT setval('catalog_items_id_seq', (SELECT MAX(id) FROM "catalog_items"));
SELECT setval('settings_id_seq', (SELECT MAX(id) FROM "settings"));
```

---

## Notas para el backend

- La columna de prenda en `canvas_designs` se llama **`product`** (no `product_title`). En `server.js` se expone como alias `product_title` en las queries.
- El endpoint `/api/settings` espera una fila con `id = 1`.
- Conexión desde Node: `DATABASE_URL` en `.env` con SSL (`rejectUnauthorized: false` para Neon).

### Imágenes de productos (opcional)

Las fotos del canvas pueden vivir en `public/mockups/` (como ahora) **sin tocar la base**. Si querés gestionarlas desde el admin, agregá columnas al catálogo:

```sql
ALTER TABLE "catalog_items"
  ADD COLUMN IF NOT EXISTS "image_url" text,
  ADD COLUMN IF NOT EXISTS "image_back_url" text,
  ADD COLUMN IF NOT EXISTS "color" varchar(50) DEFAULT 'white';
```

El frontend ya soporta `image_url` e `image_back_url` si vienen en `/api/catalogo`.

---

## Reset completo (solo desarrollo)

```sql
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "canvas_designs" CASCADE;
DROP TABLE IF EXISTS "leads" CASCADE;
DROP TABLE IF EXISTS "catalog_items" CASCADE;
DROP TABLE IF EXISTS "admins" CASCADE;
DROP TABLE IF EXISTS "settings" CASCADE;
```

Luego volvé a ejecutar las secciones 1–5.
