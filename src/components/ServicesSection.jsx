import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import { buildWhatsAppUrl } from '../utils/whatsapp.js';
import './ServicesSection.css';

export default function ServicesSection() {
  const [services, setServices] = useState([]);
  const { settings } = useSettings();

  useEffect(() => {
    fetch('/api/servicios?public=1')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setServices(data); })
      .catch(console.error);
  }, []);

  if (!services.length) return null;

  return (
    <section id="servicios" className="hm-section services-section">
      <div className="hm-section-header">
        <h2 className="section-title section-title-dark">NUESTROS SERVICIOS</h2>
        <p className="hm-section-sub">Estampado, confección y todo en uno para tu marca</p>
      </div>
      <div className="services-grid">
        {services.map((svc) => (
          <article key={svc.id} className="service-card">
            <div className="service-card-image">
              {svc.image_url && <img src={svc.image_url} alt={svc.title} loading="lazy" />}
            </div>
            <div className="service-card-body">
              <h3>{svc.title}</h3>
              <p>{svc.description}</p>
              <a
                href={buildWhatsAppUrl(settings.whatsapp_number, `Hola! Quiero consultar por: ${svc.title}`)}
                target="_blank"
                rel="noreferrer"
                className="service-card-btn"
              >
                Consultar →
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
