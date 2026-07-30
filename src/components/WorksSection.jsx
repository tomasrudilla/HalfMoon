import { useState, useEffect } from 'react';
import './WorksSection.css';

export default function WorksSection() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trabajos?public=1')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) setWorks([...data, ...data]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="trabajos" className="hm-section works-section">
      <div className="hm-section-header">
        <h2 className="section-title section-title-dark">NUESTROS TRABAJOS</h2>
        <p className="hm-section-sub">
          Proyectos reales de estampados e indumentaria para marcas y clientes
        </p>
      </div>

      {loading ? (
        <p className="works-loading">Cargando trabajos...</p>
      ) : works.length === 0 ? (
        <p className="works-loading">Próximamente más trabajos.</p>
      ) : (
        <div className="works-carousel-wrap">
          <div className="works-carousel-track">
            {works.map((item, i) => (
              <div key={`${item.id}-${i}`} className="works-carousel-item">
                <div className="works-card">
                  <img src={item.image_url} alt={item.title} loading="lazy" />
                  <div className="works-card-overlay">
                    <span className="works-card-cat">{item.category}</span>
                    <h3>{item.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
