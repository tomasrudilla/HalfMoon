import { useState, useEffect, useRef } from 'react';
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

/** Revela el bloque con un fade-up la primera vez que entra en pantalla. */
function useRevealOnScroll() {
  const ref = useRef(null);
  // Sin IntersectionObserver mostramos todo de entrada, sin animación.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

export default function AboutFaqSection() {
  const [faqs, setFaqs] = useState(FALLBACK_FAQS);
  const [openIndex, setOpenIndex] = useState(0);
  const [sectionRef, isVisible] = useRevealOnScroll();

  const toggle = (index) => setOpenIndex((prev) => (prev === index ? -1 : index));

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
    <section
      id="nosotros"
      ref={sectionRef}
      className={`hm-section about-faq-section ${isVisible ? 'is-visible' : ''}`}
      aria-labelledby="about-heading"
    >
      <div className="about-faq-header">
        <span className="about-faq-eyebrow">Sobre nosotros</span>
        <h2 id="about-heading" className="about-faq-title">
          Marca de indumentaria y estampados personalizados desde Córdoba, Argentina
        </h2>
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

        {faqs.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={item.question}
              className={`about-faq-item ${isOpen ? 'is-open' : ''}`}
              style={{ '--faq-delay': `${index * 70}ms` }}
            >
              <button
                type="button"
                className="about-faq-question"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
                onClick={() => toggle(index)}
              >
                <span>{item.question}</span>
                <span className="about-faq-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </span>
              </button>
              <div
                id={`faq-answer-${index}`}
                className="about-faq-answer"
                role="region"
              >
                <div className="about-faq-answer-inner">
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
