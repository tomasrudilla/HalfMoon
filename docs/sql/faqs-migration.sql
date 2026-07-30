-- HalfMoon — FAQs administrables (SEO / GEO)
-- Ejecutar en Neon SQL Editor

BEGIN;

CREATE TABLE IF NOT EXISTS site_faqs (
  id serial PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_faqs (question, answer, sort_order)
SELECT * FROM (VALUES
  (
    '¿HalfMoon hace indumentaria personalizada en Córdoba?',
    'Sí. Diseñamos y estampamos remeras, buzos y prendas a medida para particulares, marcas y equipos. Podés armar tu diseño en el personalizador online o pedirnos un presupuesto por WhatsApp.',
    1
  ),
  (
    '¿Trabajan venta minorista y mayorista?',
    'Atendemos ambos canales. Compra unitaria o por volumen para marcas, eventos, clubes y comercios. Los envíos llegan a todo el país.',
    2
  ),
  (
    '¿Cómo funciona el personalizador de prendas?',
    'Elegís el modelo y el color, subís tus logos o diseños, los ubicás sobre la prenda y guardás o pedís presupuesto. Te contactamos para confirmar talles, cantidades y tiempos de producción.',
    3
  ),
  (
    '¿Qué servicios ofrecen además del catálogo?',
    'Estampado, confección y proyectos a medida: desde una prenda personalizada hasta producciones para marcas. Mirá la sección de trabajos para ver casos reales.',
    4
  )
) AS v(question, answer, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM site_faqs LIMIT 1);

COMMIT;
