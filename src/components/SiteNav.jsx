import { useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';
import { buildWhatsAppUrl } from '../utils/whatsapp.js';
import './SiteNav.css';

const LOGO_URL =
  'https://d22fxaf9t8d39k.cloudfront.net/5009daf20579eb1b525efcc155225c5570c37dc556d994000e00fceb70568b86273842.jpg';

export default function SiteNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const clickCount = useRef(0);
  const clickTimer = useRef(null);

  const personalizarTo = location.pathname === '/' ? '#personalizar' : '/#personalizar';
  const wppHref = buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_message);

  const handleLogoClick = (e) => {
    clickCount.current += 1;
    clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, 400);

    if (clickCount.current >= 2) {
      e.preventDefault();
      clickCount.current = 0;
      navigate('/login');
    }
  };

  return (
    <>
      <div className="announcement-bar">ES LA PERCHA, NO LA PILCHA</div>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo-link" onClick={handleLogoClick} aria-label="HalfMoon inicio">
            <img src={LOGO_URL} alt="HalfMoon Logo" className="logo-img" />
          </Link>
          <ul className="nav-links">
            <li>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                Inicio
              </Link>
            </li>
            <li>
              <a href={location.pathname === '/' ? '#servicios' : '/#servicios'}>Servicios</a>
            </li>
            <li>
              <a href={location.pathname === '/' ? '#trabajos' : '/#trabajos'}>Trabajos</a>
            </li>
            {settings.catalog_visible && (
              <li>
                <Link to="/catalogo" className={location.pathname.startsWith('/catalogo') ? 'active' : ''}>
                  Catálogo
                </Link>
              </li>
            )}
            <li>
              <a href={personalizarTo}>Personalizar</a>
            </li>
          </ul>
          <a
            href={wppHref}
            target="_blank"
            rel="noreferrer"
            className="nav-wpp-btn"
            aria-label="WhatsApp"
          >
            WhatsApp
          </a>
        </div>
      </nav>
    </>
  );
}
