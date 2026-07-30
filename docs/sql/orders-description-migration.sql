-- HalfMoon — Detalle de qué incluye el pedido
BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS product_type varchar(255);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS color varchar(100);

COMMENT ON COLUMN orders.description IS 'Detalle del pedido: ej. 10 remeras blancas con logo personalizado';
COMMENT ON COLUMN orders.product_type IS 'Tipo de prenda (Remera, Buzo, etc.)';
COMMENT ON COLUMN orders.color IS 'Color de la prenda';

COMMIT;
