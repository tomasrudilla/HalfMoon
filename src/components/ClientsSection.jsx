import { useState, useEffect } from 'react';
import './ClientsSection.css';

export default function ClientsSection() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetch('/api/clientes?public=1')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setClients(data); })
      .catch(console.error);
  }, []);

  if (!clients.length) return null;

  return (
    <section id="clientes" className="hm-section clients-section">
      <div className="hm-section-header">
        <h2 className="section-title section-title-dark">NUESTROS CLIENTES</h2>
        <p className="hm-section-sub">Marcas y equipos que confían en HalfMoon</p>
      </div>
      <div className="clients-grid">
        {clients.map((client) => (
          <div key={client.id} className="client-logo-card" title={client.name}>
            <img src={client.logo_url} alt={client.name} loading="lazy" />
          </div>
        ))}
      </div>
    </section>
  );
}
