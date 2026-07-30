import { useState, useEffect } from 'react';
import { SITE_URL } from '../seo/siteConfig.js';
import './AboutFaqSection.css';

const FALLBACK_FAQS = [
  {
    question: '¿HalfMoon hace indumentaria personalizada en Córdoba?',
    answer:
      'Sí. Diseñamos y estampamos remeras, buzos y prendas a medida para particulares, marcas y equipos. Podés armar tu diseño en el personalizador online o pedirnos un presupuesto por WhatsApp.',
  },
  {
    question: '¿Trabajan venta minorista y mayorista?',
    answer:
      'Atendemos ambos canales. Compra unitaria o por volumen para marcas, eventos, clubes y comercios. Los envíos llegan a todo el país.',
  },
  {
    question: '¿Cómo funciona el personalizador de prendas?',
    answer:
      'Elegís el modelo y el color, subís tus logos o diseños, los ubicás sobre la prenda y guardás o pedís presupuesto. Te contactamos para confirmar talles, cantidades y tiempos de producción.',
  },
  {
    question: '¿Qué servicios ofrecen además del catálogo?',
    answer:
      'Estampado, confección y proyectos a medida: desde una prenda personalizada hasta producciones para marcas. Mirá la sección de trabajos para ver casos reales.',
  },
];

function upsertFaqJsonLd(faqs) {
  const id = 'seo-jsonld-faq';
  let el = document.getElementById(id);
  if (!faqs.length) {
    el?.remove();
    return;
  }
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/#faq`,
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export default function AboutFaqSection() {
  const [faqs, setFaqs] = useState(FALLBACK_FAQS);

  useEffect(() => {
    fetch('/api/faqs?public=1')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setFaqs(
            data.map((row) => ({
              question: row.question,
              answer: row.answer,
            }))
          );
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    upsertFaqJsonLd(faqs);
    return () => document.getElementById('seo-jsonld-faq')?.remove();
  }, [faqs]);

  return (
    <section id="nosotros" className="hm-section about-faq-section" aria-labelledby="about-heading">
      <div className="hm-section-header">
        <h2 id="about-heading" className="section-title section-title-dark">
          Indumentaria HalfMoon en Córdoba
        </h2>
        <p className="hm-section-sub">
          Marca de indumentaria y estampados personalizados desde Córdoba, Argentina
        </p>
      </div>

      <div className="about-faq-copy">
        <p>
          <strong>HalfMoon Indumentaria</strong> es una marca cordobesa de ropa y personalizados.
          Creamos remeras, buzos y prendas con identidad propia: estilo urbano, producción local
          y la posibilidad de diseñar tu gráfica online. Trabajamos minorista, mayorista y
          proyectos a medida para marcas, equipos y eventos en Córdoba y el resto del país.
        </p>
        <p>
          Nuestro personalizador te deja subir logos, ubicarlos sobre la prenda y pedir
          presupuesto sin fricción. Si buscás <em>remeras personalizadas en Córdoba</em>,
          estampados para tu marca o indumentaria mayorista, estamos para acompañarte de la idea
          a la entrega.
        </p>
      </div>

      <div className="about-faq-list">
        <h3 className="about-faq-list-title">Preguntas frecuentes</h3>
        {faqs.map((item) => (
          <details key={item.question} className="about-faq-item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
