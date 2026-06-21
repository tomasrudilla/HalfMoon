import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

export default function Login({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Validación real contra la BD iría acá
    setIsAuthenticated(true); 
    navigate('/admin'); 
  };

  return (
    <div className="auth-split-layout">
      {/* Lado Izquierdo: Formulario */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          <Link to="/" className="auth-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volver a la tienda
          </Link>

          <div className="auth-header">
            <h2>Acceso al Panel</h2>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <label>Email de Administrador</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input type="email" placeholder="admin@halfmoon.com" required />
              </div>
            </div>
            
            <div className="input-group">
              <div className="label-row">
                <label>Contraseña</label>
                <a href="#" className="forgot-pass">¿Olvidaste tu clave?</a>
              </div>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input type="password" placeholder="••••••••" required />
              </div>
            </div>

            <label className="remember-me">
              <input type="checkbox" />
              <span>Mantener mi sesión iniciada</span>
            </label>

            <button type="submit" className="btn-login">
              Ingresar al Sistema
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>

          <div className="auth-footer">
            <p>¿No tenés acceso administrativo?</p>
            <Link to="/register">Solicitar permisos</Link>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Visual Branding */}
      <div className="auth-visual-side">
        <div className="auth-visual-content">
          <div className="visual-badge">HalfMoon</div>
          <h3>Control total sobre tu marca.</h3>
          <p>Gestioná ventas, actualizá el catálogo y revisá los diseños personalizados de tus clientes desde un solo lugar.</p>
          
          <div className="glass-card-mockup">
            <div className="mockup-header">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <div className="mockup-body">
              <div className="mockup-line w-75"></div>
              <div className="mockup-line w-50"></div>
              <div className="mockup-line w-100 mt-4"></div>
              <div className="mockup-line w-80"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}