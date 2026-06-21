-- HalfMoon — Catálogo tienda + Catálogo canvas (personalizador)
-- Ejecutar en Neon SQL Editor (o psql) sobre la base del proyecto.
-- Orden: 1) ALTER  2) limpiar seed viejo  3) INSERT tienda  4) CREATE canvas  5) INSERT canvas  6) setval

BEGIN;

-- =============================================================================
-- 1. AMPLIAR catalog_items (productos de la tienda / home)
-- =============================================================================

ALTER TABLE catalog_items
  ADD COLUMN IF NOT EXISTS slug varchar(120),
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS price_original varchar(50),
  ADD COLUMN IF NOT EXISTS offer varchar(50),
  ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS catalog_items_slug_unique
  ON catalog_items (slug);

-- Opcional: sacar duplicados viejos del seed inicial (Remera + Estampado x2, etc.)
DELETE FROM catalog_items
WHERE slug IS NULL
  AND title IN ('REMERA + ESTAMPADO', 'BUZOS & CANGUROS');

-- =============================================================================
-- 2. INSERT — 12 productos del home (Empretienda / storeProducts.js)
-- =============================================================================

INSERT INTO catalog_items (
  slug, title, category, stock, price, price_original, offer,
  description, image_url, photos, is_active
) VALUES
(
  'remera-combinada-regular',
  'Remera Combinada Regular',
  'Remeras',
  'Disponible',
  '$19.500',
  '$23.000',
  '15% OFF',
  'Remera regular con diseño combinado exclusivo HalfMoon. Corte clásico, ideal para el día a día con estilo propio.',
  'https://d22fxaf9t8d39k.cloudfront.net/c8e0a652acabcd327b085d1e2bb200e64d5c269a13e5fc26e43aef096a2f6bcb273842.jpg',
  '["https://d22fxaf9t8d39k.cloudfront.net/c8e0a652acabcd327b085d1e2bb200e64d5c269a13e5fc26e43aef096a2f6bcb273842.jpg"]'::jsonb,
  true
),
(
  'remera-espiral',
  'Remera Espiral',
  'Remeras',
  'Disponible',
  '$19.500',
  '$23.000',
  '15% OFF',
  'Remera con gráfica espiral en estilo HalfMoon. Estampa bold que destaca en cualquier look urbano.',
  'https://d22fxaf9t8d39k.cloudfront.net/6903d72422775930fc6cb940401eb2162d3a962a886e0cd226490c78ab098d32273842.jpg',
  '["https://d22fxaf9t8d39k.cloudfront.net/6903d72422775930fc6cb940401eb2162d3a962a886e0cd226490c78ab098d32273842.jpg"]'::jsonb,
  true
),
(
  'remera-halfmoon-azul',
  'Remera Halfmoon AZUL',
  'Remeras',
  'Disponible',
  '$19.500',
  '$23.000',
  '15% OFF',
  'Remera azul con logo HalfMoon. Color vibrante y tela cómoda para uso diario.',
  'https://d22fxaf9t8d39k.cloudfront.net/5d642c9c664d966ae86af10b7609123caee678291f79f7ef9bd1a0287beb087c273842.jpg',
  '["https://d22fxaf9t8d39k.cloudfront.net/5d642c9c664d966ae86af10b7609123caee678291f79f7ef9bd1a0287beb087c273842.jpg"]'::jsonb,
  true
),
(
  'remera-halfmoon-roja',
  'Remera Halfmoon ROJA',
  'Remeras',
  'Disponible',
  '$19.500',
  '$23.000',
  '15% OFF',
  'Remera roja con identidad HalfMoon. Un clásico de la marca con presencia y actitud.',
  'https://d22fxaf9t8d39k.cloudfront.net/787129237e0fc07d9124526c498ec8eb2b2947ed870929c3c73795833d6d2485273842.jpg',
  '["https://d22fxaf9t8d39k.cloudfront.net/787129237e0fc07d9124526c498ec8eb2b2947ed870929c3c73795833d6d2485273842.jpg"]'::jsonb,
  true
),
(
  'remeron-moon-white',
  'REMERON MOON WHITE - OVERSIZE',
  'Remeras',
  'Disponible',
  '$18.500',
  '$20.000',
  '7% OFF',
  'Remerón oversize blanco con diseño Moon. Caída amplia y estilo relajado, perfecto para streetwear.',
  'https://d22fxaf9t8d39k.cloudfront.net/8a96b29dc72f7d179326547a1d18634be67419c742ea28c8b8be85ff766cb92a273842.png',
  '["https://d22fxaf9t8d39k.cloudfront.net/8a96b29dc72f7d179326547a1d18634be67419c742ea28c8b8be85ff766cb92a273842.png"]'::jsonb,
  true
),
(
  'remeron-moon-black',
  'REMERON MOON BLACK - OVERSIZE',
  'Remeras',
  'Disponible',
  '$18.500',
  '$20.000',
  '7% OFF',
  'Remerón oversize negro con gráfica Moon. Versátil, cómodo y con la estética HalfMoon.',
  'https://d22fxaf9t8d39k.cloudfront.net/ba5846054d5e15bbd0f41caf164397bc563acdd5f24489bc168c6f4c92eb8dd9273842.png',
  '["https://d22fxaf9t8d39k.cloudfront.net/ba5846054d5e15bbd0f41caf164397bc563acdd5f24489bc168c6f4c92eb8dd9273842.png"]'::jsonb,
  true
),
(
  'eagle-moon',
  'EAGLE MOON',
  'Remeras',
  'Disponible',
  '$18.000',
  '$20.000',
  '10% OFF',
  'Remera Eagle Moon con ilustración exclusiva. Diseño potente que representa la esencia de la marca.',
  'https://d22fxaf9t8d39k.cloudfront.net/65b1d656beacf11d7165b4faed5595e52a0dd192262afbb95930dec77d4aea6e273842.png',
  '["https://d22fxaf9t8d39k.cloudfront.net/65b1d656beacf11d7165b4faed5595e52a0dd192262afbb95930dec77d4aea6e273842.png"]'::jsonb,
  true
),
(
  'lobo-suelto',
  'LOBO SUELTO',
  'Remeras',
  'Disponible',
  '$18.000',
  '$20.000',
  '10% OFF',
  'Remera Lobo Suelto con estampa artística HalfMoon. Para quienes buscan un diseño con carácter.',
  'https://d22fxaf9t8d39k.cloudfront.net/be980b1ca24d28af00d138029fbb5708cbd879fc6efc3d9ef5c6371a3efe13c7273842.png',
  '["https://d22fxaf9t8d39k.cloudfront.net/be980b1ca24d28af00d138029fbb5708cbd879fc6efc3d9ef5c6371a3efe13c7273842.png"]'::jsonb,
  true
),
(
  'ghost-white',
  'GHOST WHITE',
  'Remeras',
  'Disponible',
  '$18.000',
  '$20.000',
  '10% OFF',
  'Remera Ghost White con gráfica minimalista. Fondo claro y diseño misterioso de la colección HalfMoon.',
  'https://d22fxaf9t8d39k.cloudfront.net/54eacb15c98308c879fecd390d73befb9183637cc52c60396fadb0be324d9989273842.png',
  '["https://d22fxaf9t8d39k.cloudfront.net/54eacb15c98308c879fecd390d73befb9183637cc52c60396fadb0be324d9989273842.png"]'::jsonb,
  true
),
(
  'kratos',
  'KRATOS',
  'Remeras',
  'Disponible',
  '$18.000',
  '$20.000',
  '10% OFF',
  'Remera Kratos con diseño inspirado en la fuerza y el estilo HalfMoon. Estampa de alto impacto visual.',
  'https://d22fxaf9t8d39k.cloudfront.net/4f65cb1ed27a35c148d3d28cd6965eeef186b2d0e64e016b0fd331b914138186273842.png',
  '["https://d22fxaf9t8d39k.cloudfront.net/4f65cb1ed27a35c148d3d28cd6965eeef186b2d0e64e016b0fd331b914138186273842.png"]'::jsonb,
  true
),
(
  'buzo-tranqui-grey',
  'BUZO TRANQUI - GREY/BLACK',
  'Buzos',
  'Disponible',
  '$20.000',
  NULL,
  NULL,
  'Buzo Tranqui en combinación grey/black. Abrigo cómodo con estilo relajado, ideal para temporadas frescas.',
  'https://d22fxaf9t8d39k.cloudfront.net/c45f96886c8b896dd64c22f863596b8cc7d461450cf3eb31b81595f21671d278273842.png',
  '["https://d22fxaf9t8d39k.cloudfront.net/c45f96886c8b896dd64c22f863596b8cc7d461450cf3eb31b81595f21671d278273842.png"]'::jsonb,
  true
),
(
  'buzo-tranqui-black',
  'BUZO TRANQUI - BLACK/GREY',
  'Buzos',
  'Disponible',
  '$20.000',
  NULL,
  NULL,
  'Buzo Tranqui en combinación black/grey. Versión alternativa del clásico abrigo HalfMoon.',
  'https://d22fxaf9t8d39k.cloudfront.net/80aeb67116b52b145b46e59a8de303acf9458e645e0659efa1fdf777419f33fc273842.png',
  '["https://d22fxaf9t8d39k.cloudfront.net/80aeb67116b52b145b46e59a8de303acf9458e645e0659efa1fdf777419f33fc273842.png"]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  stock = EXCLUDED.stock,
  price = EXCLUDED.price,
  price_original = EXCLUDED.price_original,
  offer = EXCLUDED.offer,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  photos = EXCLUDED.photos,
  is_active = EXCLUDED.is_active;

-- Necesitás UNIQUE en slug para ON CONFLICT (incluido arriba como catalog_items_slug_unique).

-- =============================================================================
-- 3. NUEVA TABLA — Catálogo canvas (mockups del personalizador)
-- =============================================================================

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

COMMENT ON TABLE canvas_catalog_items IS 'Prendas base del personalizador (frente/dorso) donde el cliente carga logos.';
COMMENT ON COLUMN canvas_catalog_items.shirt_bounds IS 'Zona draggable en % del canvas: top, left, width, height';

-- =============================================================================
-- 4. INSERT — Mockups actuales del personalizador
-- =============================================================================

INSERT INTO canvas_catalog_items (
  slug, title, category, color_id, color_label, color_hex,
  image_front_url, image_back_url, shirt_bounds, sort_order, is_active
) VALUES
(
  'remera-blanca',
  'Remera + Estampado',
  'Remeras',
  'white',
  'Blanco',
  '#ffffff',
  '/mockups/remera-blanca.png',
  '/mockups/remera-back.svg',
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
  '/mockups/remera-back.svg',
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
  '/mockups/buzo-back.svg',
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
  '/mockups/buzo-back.svg',
  '{"top":6,"left":12,"width":76,"height":86}'::jsonb,
  4,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  color_id = EXCLUDED.color_id,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  image_front_url = EXCLUDED.image_front_url,
  image_back_url = EXCLUDED.image_back_url,
  shirt_bounds = EXCLUDED.shirt_bounds,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- =============================================================================
-- 5. Sincronizar secuencias
-- =============================================================================

SELECT setval('catalog_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM catalog_items));
SELECT setval('canvas_catalog_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM canvas_catalog_items));

COMMIT;

-- =============================================================================
-- Verificación rápida
-- =============================================================================
-- SELECT slug, title, price, image_url FROM catalog_items WHERE is_active = true ORDER BY id;
-- SELECT slug, title, color_label, image_front_url, image_back_url FROM canvas_catalog_items ORDER BY sort_order;
