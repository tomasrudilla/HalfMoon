-- HalfMoon — Seña en presupuestos + origen de producto
BEGIN;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(10, 2);

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS deposit_paid boolean DEFAULT false;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS deposit_paid_at timestamp;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS product_source varchar(50) DEFAULT 'custom';

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS catalog_item_id integer;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN quotes.deposit_amount IS 'Seña que se le pasa al cliente';
COMMENT ON COLUMN quotes.deposit_paid IS 'true cuando la seña está confirmada (pasa a pedido)';
COMMENT ON COLUMN quotes.product_source IS 'catalog | canvas | custom | web';
COMMENT ON COLUMN quotes.description IS 'Detalle del trabajo cotizado';

COMMIT;
