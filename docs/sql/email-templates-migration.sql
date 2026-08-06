-- HalfMoon — Plantillas de email editables (newsletter + operativos)
-- Idempotente. Ejecutar en Neon SQL Editor.

BEGIN;

CREATE TABLE IF NOT EXISTS email_templates (
  slug varchar(80) PRIMARY KEY,
  category varchar(40) NOT NULL DEFAULT 'transactional',
  label varchar(255) NOT NULL,
  description text,
  subject text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  image_url text,
  cta_url text,
  cta_label text,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS email_templates_category_idx
  ON email_templates (category);

COMMENT ON TABLE email_templates IS
  'Plantillas HTML/texto de mails (newsletter y operativos) editables desde el admin';

-- Seed: no pisa ediciones existentes (ON CONFLICT DO NOTHING)
INSERT INTO email_templates (slug, category, label, description, subject, title, body, enabled)
VALUES
(
  'newsletter_welcome',
  'newsletter',
  'Bienvenida al newsletter',
  'Se envía al suscribirse desde el footer “Unite a la familia HalfMoon”.',
  '¡Bienvenido/a a la familia {negocio}!',
  'Suscripción confirmada',
  E'¡Bienvenido/a {nombre} a la familia {negocio}!\n\nYa estás suscripto/a: te vamos a avisar cuando haya nuevos ingresos y promociones exclusivas.\n\nSi no te suscribiste vos, ignorá este mail.',
  true
),
(
  'newsletter_promo',
  'newsletter',
  'Newsletter / promoción',
  'Plantilla base para campañas a la lista de suscriptos (envío manual a futuro).',
  'Novedades de {negocio}',
  'Hay novedades para vos',
  E'Hola {nombre}!\n\nQueremos contarte las novedades de {negocio}.\n\nSeguinos y respondé este mail si querés saber más.',
  true
),
(
  'design_saved',
  'transactional',
  'Guardó su diseño',
  'Mail al cliente cuando guarda un diseño en el personalizador (con PNG adjunto).',
  'Tu diseño {negocio} — {prenda}',
  'Tu diseño está listo',
  E'Hola {nombre}! Te adjuntamos el diseño que armaste en {prenda}. Guardalo y avisanos cuando quieras cotizarlo: te preparamos el presupuesto sin cargo.',
  true
),
(
  'quote_requested',
  'transactional',
  'Pidió presupuesto (web)',
  'Acuse de recibo cuando el cliente pide presupuesto desde el personalizador.',
  'Recibimos tu pedido de presupuesto — {negocio}',
  'Presupuesto en camino',
  E'Hola {nombre}! Recibimos tu pedido de presupuesto por {cantidad} x {prenda}. Te adjuntamos el diseño y te contactamos en hasta 3 días hábiles con el precio final.',
  true
),
(
  'quote_created',
  'transactional',
  'Presupuesto generado',
  'Se envía al crear o reenviar un presupuesto desde el admin (con seña pendiente).',
  'Tu presupuesto — {negocio}',
  'Presupuesto listo',
  E'Hola {nombre}! Te pasamos el presupuesto por {cantidad} x {prenda}: total {total}. Para reservar la producción queda pendiente una seña de {sena}. Cualquier duda respondé este mail.',
  true
),
(
  'order_in_production',
  'transactional',
  'Pedido en producción',
  'Aviso al cliente cuando el pedido pasa a “En Producción” (si las notificaciones de producción están activas).',
  'Tu pedido {pedido} está en producción — {negocio}',
  'En producción',
  E'Hola {nombre}! Tu pedido {pedido} ({cantidad} x {prenda}) ya está en producción. Te avisamos cuando esté listo.',
  true
),
(
  'order_ready',
  'transactional',
  'Pedido listo',
  'Aviso cuando el pedido pasa a “Listo”.',
  'Tu pedido {pedido} está listo — {negocio}',
  'Pedido listo',
  E'Hola {nombre}! Tu pedido {pedido} ({cantidad} x {prenda}) ya está listo. Coordinamos la entrega o el retiro.',
  true
),
(
  'order_delivered',
  'transactional',
  'Pedido entregado',
  'Confirmación cuando el pedido pasa a “Entregado”.',
  'Entregamos tu pedido {pedido} — {negocio}',
  'Entrega confirmada',
  E'Hola {nombre}! Tu pedido {pedido} ya fue entregado. Gracias por confiar en {negocio}.',
  true
),
(
  'admin_new_design',
  'transactional',
  'Aviso interno (nuevo diseño)',
  'Encabezado del mail interno a HalfMoon cuando alguien usa el personalizador.',
  'Nuevo movimiento web — {nombre}',
  'Nuevo movimiento en la web',
  E'Nuevo movimiento en el personalizador web. Revisalo en el panel de administración.',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Traer textos ya personalizados desde settings (si existen)
UPDATE email_templates t
SET
  body = COALESCE(NULLIF(s.msg_design_saved, ''), t.body),
  updated_at = CURRENT_TIMESTAMP
FROM settings s
WHERE s.id = 1 AND t.slug = 'design_saved' AND s.msg_design_saved IS NOT NULL AND s.msg_design_saved <> '';

UPDATE email_templates t
SET
  body = COALESCE(NULLIF(s.msg_quote_requested, ''), t.body),
  updated_at = CURRENT_TIMESTAMP
FROM settings s
WHERE s.id = 1 AND t.slug = 'quote_requested' AND s.msg_quote_requested IS NOT NULL AND s.msg_quote_requested <> '';

UPDATE email_templates t
SET
  body = COALESCE(NULLIF(s.msg_quote_created, ''), t.body),
  updated_at = CURRENT_TIMESTAMP
FROM settings s
WHERE s.id = 1 AND t.slug = 'quote_created' AND s.msg_quote_created IS NOT NULL AND s.msg_quote_created <> '';

UPDATE email_templates t
SET
  body = COALESCE(NULLIF(s.msg_admin_new_design, ''), t.body),
  updated_at = CURRENT_TIMESTAMP
FROM settings s
WHERE s.id = 1 AND t.slug = 'admin_new_design' AND s.msg_admin_new_design IS NOT NULL AND s.msg_admin_new_design <> '';

COMMIT;
