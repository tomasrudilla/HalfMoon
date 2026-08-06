-- HalfMoon — Suscriptores del newsletter ("Unite a la familia HalfMoon")
-- Idempotente: se puede reejecutar sin romper nada.
-- Ejecutar en Neon SQL Editor

BEGIN;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id serial PRIMARY KEY,
  email varchar(255) NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Normalizamos a minúsculas en la app; el índice unique evita duplicados.
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_key
  ON newsletter_subscribers (lower(email));

COMMENT ON TABLE newsletter_subscribers IS
  'Emails suscriptos desde el footer (Unite a la familia HalfMoon)';

COMMIT;
