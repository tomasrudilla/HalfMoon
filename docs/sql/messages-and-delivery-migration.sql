-- HalfMoon — Plantillas de mensajes configurables + fecha real de entrega
-- Idempotente: se puede reejecutar sin romper nada.
-- Ejecutar en Neon SQL Editor

BEGIN;

-- Plantillas editables desde Configuración.
-- Placeholders disponibles: {cliente} {prenda} {cantidad} {total} {sena} {saldo} {negocio}
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS msg_design_saved text
    DEFAULT 'Hola {cliente}! Te adjuntamos el diseño que armaste en {prenda}. Guardalo y avisanos cuando quieras cotizarlo: te preparamos el presupuesto sin cargo.';

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS msg_quote_requested text
    DEFAULT 'Hola {cliente}! Recibimos tu pedido de presupuesto por {cantidad} x {prenda}. Te adjuntamos el diseño y te contactamos en hasta 3 días hábiles con el precio final.';

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS msg_quote_created text
    DEFAULT 'Hola {cliente}! Te pasamos el presupuesto por {cantidad} x {prenda}: total {total}. Para reservar la producción queda pendiente una seña de {sena}. Cualquier duda respondé este mail.';

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS msg_admin_new_design text
    DEFAULT 'Nuevo movimiento en el personalizador web. Revisalo en el panel de administración.';

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS msg_wpp_quote text
    DEFAULT '¡Hola HalfMoon! Armé un diseño en el personalizador y quiero pedir un presupuesto.';

-- Textos que ve el cliente en el personalizador (no son mails)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS msg_personalizer_save text
    DEFAULT 'Tu diseño está listo. Te descargamos el PNG y te lo enviamos por email.';

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS msg_personalizer_quote text
    DEFAULT 'Te contactamos en hasta 3 días hábiles con un presupuesto personalizado. No mostramos precio automático.';

-- Enviar mail al cliente por defecto cuando se genera un presupuesto
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS notify_quote_email boolean DEFAULT true;

-- Rellenar los defaults en la fila existente si quedó en NULL
UPDATE settings SET
  msg_design_saved = COALESCE(msg_design_saved, 'Hola {cliente}! Te adjuntamos el diseño que armaste en {prenda}. Guardalo y avisanos cuando quieras cotizarlo: te preparamos el presupuesto sin cargo.'),
  msg_quote_requested = COALESCE(msg_quote_requested, 'Hola {cliente}! Recibimos tu pedido de presupuesto por {cantidad} x {prenda}. Te adjuntamos el diseño y te contactamos en hasta 3 días hábiles con el precio final.'),
  msg_quote_created = COALESCE(msg_quote_created, 'Hola {cliente}! Te pasamos el presupuesto por {cantidad} x {prenda}: total {total}. Para reservar la producción queda pendiente una seña de {sena}. Cualquier duda respondé este mail.'),
  msg_admin_new_design = COALESCE(msg_admin_new_design, 'Nuevo movimiento en el personalizador web. Revisalo en el panel de administración.'),
  msg_wpp_quote = COALESCE(msg_wpp_quote, '¡Hola HalfMoon! Armé un diseño en el personalizador y quiero pedir un presupuesto.'),
  msg_personalizer_save = COALESCE(msg_personalizer_save, 'Tu diseño está listo. Te descargamos el PNG y te lo enviamos por email.'),
  msg_personalizer_quote = COALESCE(msg_personalizer_quote, 'Te contactamos en hasta 3 días hábiles con un presupuesto personalizado. No mostramos precio automático.'),
  notify_quote_email = COALESCE(notify_quote_email, true)
WHERE id = 1;

-- Fecha real de entrega: permite mostrar solo los entregados de hoy en el kanban
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivered_at timestamp;

CREATE INDEX IF NOT EXISTS orders_delivered_at_idx ON orders (delivered_at);

-- Los pedidos que ya estaban entregados quedan fechados con su creación
-- para que no aparezcan como entregados "de hoy".
UPDATE orders
SET delivered_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE status = 'Entregado' AND delivered_at IS NULL;

COMMENT ON COLUMN orders.delivered_at IS 'Momento en que el pedido pasó a Entregado';
COMMENT ON COLUMN settings.msg_quote_created IS 'Mail al cliente cuando se le genera un presupuesto con seña pendiente';

COMMIT;
