-- HalfMoon — Asegurar tabla de prendas del personalizador
-- Idempotente: crea si falta y siembra remera/buzo solo si está vacía

BEGIN;

CREATE TABLE IF NOT EXISTS canvas_catalog_items (
  id serial PRIMARY KEY,
  slug varchar(120) NOT NULL UNIQUE,
  title varchar(255) NOT NULL,
  category varchar(100) NOT NULL,
  color_id varchar(50) NOT NULL,
  color_label varchar(50) NOT NULL,
  color_hex varchar(20) DEFAULT '#ffffff',
  image_front_url text NOT NULL,
  image_back_url text,
  shirt_bounds jsonb DEFAULT '{"top":8,"left":14,"width":72,"height":82}'::jsonb,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO canvas_catalog_items (
  slug, title, category, color_id, color_label, color_hex,
  image_front_url, image_back_url, shirt_bounds, sort_order, is_active
)
SELECT * FROM (VALUES
  (
    'remera-blanca',
    'Remera + Estampado',
    'Remeras',
    'white',
    'Blanco',
    '#ffffff',
    '/mockups/remera-blanca.png',
    '/mockups/remera-blanca.png',
    '{"top":8,"left":14,"width":72,"height":82}'::jsonb,
    1,
    true
  ),
  (
    'remera-negra',
    'Remera + Estampado',
    'Remeras',
    'black',
    'Negro',
    '#1a1a1a',
    '/mockups/remera-negra.png',
    '/mockups/remera-negra.png',
    '{"top":8,"left":14,"width":72,"height":82}'::jsonb,
    2,
    true
  ),
  (
    'buzo-blanco',
    'Buzos & Canguros',
    'Buzos',
    'white',
    'Blanco',
    '#ffffff',
    '/mockups/buzo-blanco.png',
    '/mockups/buzo-blanco.png',
    '{"top":6,"left":12,"width":76,"height":86}'::jsonb,
    3,
    true
  ),
  (
    'buzo-negro',
    'Buzos & Canguros',
    'Buzos',
    'black',
    'Negro',
    '#1a1a1a',
    '/mockups/buzo-negro.png',
    '/mockups/buzo-negro.png',
    '{"top":6,"left":12,"width":76,"height":86}'::jsonb,
    4,
    true
  )
) AS v(
  slug, title, category, color_id, color_label, color_hex,
  image_front_url, image_back_url, shirt_bounds, sort_order, is_active
)
WHERE NOT EXISTS (SELECT 1 FROM canvas_catalog_items LIMIT 1);

COMMIT;
