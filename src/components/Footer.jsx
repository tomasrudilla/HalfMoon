import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';
import { buildWhatsAppUrl } from '../utils/whatsapp.js';
import './Footer.css';

const LOGO_URL =
  'https://d22fxaf9t8d39k.cloudfront.net/5009daf20579eb1b525efcc155225c5570c37dc556d994000e00fceb70568b86273842.jpg';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [showToast, setShowToast] = useState(false);
  const { settings } = useSettings();
  const wppHref = buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_message);
  const supportEmail = settings.support_email || 'halfmooncba@gmail.com';

  const handleSubscribe = (e) => {
    e.preventDefault(); // Evita que la página recargue al mandar el formulario
    if (!email) return;

    // Mostrar el popup
    setShowToast(true);
    // Limpiar el campo
    setEmail('');

    // Ocultar el popup automáticamente a los 3.5 segundos
    setTimeout(() => {
      setShowToast(false);
    }, 3500);
  };

  return (
    <>
      <footer className="hm-footer">
        {/* Sección Superior: Newsletter */}
        <div className="hm-footer-top">
          <div className="hm-footer-top-inner">
            <div className="hm-newsletter-text">
              <h3>UNITE A LA FAMILIA HALFMOON</h3>
              <p>Recibí novedades sobre nuevos ingresos y promociones exclusivas.</p>
            </div>
            <form className="hm-newsletter-form" onSubmit={handleSubscribe}>
              <input 
                type="email" 
                placeholder="Ingresá tu email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">Suscribirse</button>
            </form>
          </div>
        </div>

        {/* Sección Principal: Organización Flexbox */}
        <div className="hm-footer-main">
          
          {/* Bloque Izquierdo: Marca */}
          <div className="hm-col-brand">
            <Link to="/" className="hm-logo-link">
              <img src={LOGO_URL} alt="HalfMoon" className="hm-footer-logo" />
            </Link>
            <p className="hm-tagline">ES LA PERCHA, NO LA PILCHA.</p>
            <p className="hm-desc">
              {settings.business_name || 'HalfMoon'} — indumentaria premium y personalizados exclusivos desde Córdoba para todo el país.
            </p>
          </div>

          {/* Bloque Derecho: Contenedor de Links */}
          <div className="hm-links-wrapper">
            <div className="hm-col">
              <h4>Tienda</h4>
              <ul className="hm-link-list">
                <li><Link to="/">Inicio</Link></li>
                <li><a href="/#servicios">Servicios</a></li>
                <li><a href="/#trabajos">Trabajos</a></li>
                {settings.catalog_visible && <li><Link to="/catalogo">Catálogo</Link></li>}
                <li><Link to="/#personalizar">Personalizador</Link></li>
                <li><a href="/#nosotros">Nosotros</a></li>
              </ul>
            </div>

            <div className="hm-col">
              <h4>Atención al Cliente</h4>
              <ul className="hm-link-list">
                <li><a href={wppHref} target="_blank" rel="noreferrer">Ventas Mayoristas</a></li>
                <li><a href={wppHref} target="_blank" rel="noreferrer">Envíos y Devoluciones</a></li>
                <li><a href={`mailto:${supportEmail}`}>Contacto</a></li>
              </ul>
            </div>

            <div className="hm-col">
              <h4>Social</h4>
              <ul className="hm-link-list">
                <li>
                  <a href="https://instagram.com/halfmoon.indumentaria" target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Sección Inferior: Copyright */}
        <div className="hm-footer-bottom">
          <p>© {new Date().getFullYear()} HalfMoon Indumentaria. Todos los derechos reservados.</p>
          <p className="hm-agency-credit">Desarrollado por <strong>Santiago Sala y Tomas Rudilla</strong></p>
        </div>
      </footer>

      {/* Pop up de suscripción exitosa */}
      {showToast && (
        <div className="hm-toast-popup">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          ¡Suscripción exitosa! Pronto vas a recibir nuestras novedades.
        </div>
      )}
    </>
  );
}