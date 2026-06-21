import { Link } from 'react-router-dom';
import './Footer.css';

const LOGO_URL =
  'https://d22fxaf9t8d39k.cloudfront.net/5009daf20579eb1b525efcc155225c5570c37dc556d994000e00fceb70568b86273842.jpg';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-cta">
        <div className="footer-cta-inner">
          <div className="footer-cta-text">
            <span className="footer-cta-eyebrow">Personalizá tu estilo</span>
            <h3>¿Listo para armar tu prenda?</h3>
          </div>
          <Link to="/#personalizar" className="footer-cta-btn">
            Ir al personalizador
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="footer-main">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <Link to="/" className="footer-logo-link">
                <img src={LOGO_URL} alt="HalfMoon" className="footer-logo" />
              </Link>
              <p className="footer-tagline">Es la percha, no la pilcha.</p>
              <p className="footer-desc">
                Indumentaria y personalizados de alta calidad. Remeras, buzos y diseños exclusivos desde Córdoba.
              </p>
            </div>

            <div className="footer-links-group">
              <div className="footer-col">
                <h4>Tienda</h4>
                <ul>
                  <li><Link to="/">Inicio</Link></li>
                  <li><Link to="/catalogo">Catálogo</Link></li>
                  <li><Link to="/#personalizar">Personalizar</Link></li>
                </ul>
              </div>

              <div className="footer-col">
                <h4>Contacto</h4>
                <ul>
                  <li>
                    <a href="mailto:halfmooncba@gmail.com">halfmooncba@gmail.com</a>
                  </li>
                  <li>
                    <a href="https://wa.me/5493516668259" target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                  </li>
                  <li><span>Envíos a todo el país</span></li>
                </ul>
              </div>

              <div className="footer-col">
                <h4>Redes</h4>
                <a
                  href="https://instagram.com/halfmoon.indumentaria"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-ig-link"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  @halfmoon.indumentaria
                </a>
              </div>
            </div>
          </div>

          <div className="footer-divider" />

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} HalfMoon Indumentaria</p>
            <p className="footer-motto">TU MARCA · TU ESTILO</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
