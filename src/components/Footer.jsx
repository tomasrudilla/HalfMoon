import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';
import { buildWhatsAppUrl } from '../utils/whatsapp.js';
import './Footer.css';

const LOGO_URL =
  'https://d22fxaf9t8d39k.cloudfront.net/5009daf20579eb1b525efcc155225c5570c37dc556d994000e00fceb70568b86273842.jpg';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }
  const [submitting, setSubmitting] = useState(false);
  const { settings } = useSettings();
  const wppHref = buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_message);
  const supportEmail = settings.support_email || 'halfmooncba@gmail.com';

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409 || data.code === 'already_subscribed') {
        showToast('error', 'Este email ya está suscripto a HalfMoon.');
        return;
      }

      if (!res.ok) {
        showToast('error', data.error || 'No se pudo completar la suscripción.');
        return;
      }

      setEmail('');
      showToast('success', '¡Suscripción exitosa! Pronto vas a recibir nuestras novedades.');
    } catch {
      showToast('error', 'No se pudo completar la suscripción. Probá de nuevo.');
    } finally {
      setSubmitting(false);
    }
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
                disabled={submitting}
                autoComplete="email"
              />
              <button type="submit" disabled={submitting}>
                {submitting ? 'Enviando…' : 'Suscribirse'}
              </button>
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

      {toast && (
        <div className={`hm-toast-popup ${toast.type === 'error' ? 'hm-toast-error' : ''}`}>
          {toast.type === 'error' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </>
  );
}
