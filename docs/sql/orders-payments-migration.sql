-- HalfMoon — Pedidos ligados a presupuestos + plan de pagos / pagos parciales
-- Ejecutar en Neon SQL Editor

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS quote_id integer REFERENCES quotes(id) ON DELETE SET NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_mode varchar(50) DEFAULT 'negociable';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(10, 2);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS installments_count integer;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_notes text;

CREATE INDEX IF NOT EXISTS orders_quote_id_idx ON orders (quote_id);

CREATE TABLE IF NOT EXISTS order_payments (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  payment_type varchar(50) NOT NULL DEFAULT 'pago',
  installment_number integer,
  method varchar(100),
  notes text,
  paid_at timestamp DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS order_payments_order_id_idx ON order_payments (order_id);

COMMENT ON COLUMN orders.quote_id IS 'Presupuesto origen del pedido (si se convirtió)';
COMMENT ON COLUMN orders.payment_mode IS 'contado | seña_saldo | cuotas | negociable';
COMMENT ON COLUMN orders.deposit_amount IS 'Seña acordada en la negociación';
COMMENT ON COLUMN orders.installments_count IS 'Cantidad de cuotas acordadas (si aplica)';
COMMENT ON TABLE order_payments IS 'Pagos registrados (seña, cuotas, pagos parciales, saldo)';

COMMIT;
