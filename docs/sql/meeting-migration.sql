-- HalfMoon — Migración reunión Jul 2026
-- Ejecutar en Neon SQL Editor después de schema-init.sql

BEGIN;

-- Leads: estado CRM (Prospecto, Cliente, etc.)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS status varchar(50) DEFAULT 'Prospecto';

-- Catálogo tienda: ocultar en web pública sin borrar código
ALTER TABLE catalog_items
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS catalog_visible boolean DEFAULT false;

-- Nuestros trabajos (portfolio)
CREATE TABLE IF NOT EXISTS portfolio_works (
  id serial PRIMARY KEY,
  title varchar(255) NOT NULL,
  category varchar(100),
  image_url text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Nuestros servicios
CREATE TABLE IF NOT EXISTS site_services (
  id serial PRIMARY KEY,
  title varchar(255) NOT NULL,
  description text,
  image_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Nuestros clientes (logos)
CREATE TABLE IF NOT EXISTS client_brands (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  logo_url text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Presupuestos solicitados desde el personalizador
CREATE TABLE IF NOT EXISTS quotes (
  id serial PRIMARY KEY,
  lead_id integer REFERENCES leads(id) ON DELETE SET NULL,
  design_id integer REFERENCES canvas_designs(id) ON DELETE SET NULL,
  quantity integer DEFAULT 1,
  product_type varchar(255),
  color varchar(100),
  notes text,
  status varchar(50) DEFAULT 'Pendiente',
  admin_price numeric(10, 2),
  admin_notes text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_services (title, description, image_url, sort_order)
SELECT * FROM (VALUES
  ('Estampado', 'Estampamos tu diseño en prendas que ya tenés o que nos traés.', '/gallery/estilo-1.png', 1),
  ('Estampado + Confección', 'Fabricamos la prenda y aplicamos tu diseño. Todo en un solo pedido.', '/gallery/estilo-3.png', 2),
  ('Confección', 'Confección de prendas a medida para tu marca o equipo.', '/gallery/estilo-5.png', 3)
) AS v(title, description, image_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM site_services LIMIT 1);

INSERT INTO portfolio_works (title, category, image_url, sort_order)
SELECT * FROM (VALUES
  ('Jorge el Astronauta', 'Remeras', '/gallery/estilo-1.png', 1),
  ('Kratos', 'Remeras', '/gallery/estilo-2.png', 2),
  ('Ghost White', 'Remeras', '/gallery/estilo-3.png', 3),
  ('Lobo Suelto', 'Remeras', '/gallery/estilo-4.png', 4),
  ('Eagle Moon', 'Remeras', '/gallery/estilo-5.png', 5),
  ('Estilo HalfMoon', 'Buzos', '/gallery/estilo-6.png', 6)
) AS v(title, category, image_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM portfolio_works LIMIT 1);

COMMIT;
