import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    alert('Solicitud enviada. Contactá al administrador principal.');
    navigate('/login');
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
            <h2>Nuevo Administrador</h2>
            <p>Creá un perfil para sumarte a la gestión operativa de la plataforma.</p>
          </div>

          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <label>Nombre Completo</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input type="text" placeholder="Ej: Equipo HalfMoon" required />
              </div>
            </div>

            <div className="input-group">
              <label>Email Corporativo</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input type="email" placeholder="nombre@halfmoon.com" required />
              </div>
            </div>
            
            <div className="input-group">
              <label>Contraseña</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input type="password" placeholder="Creá una contraseña segura" required />
              </div>
            </div>

            <button type="submit" className="btn-login">
              Crear Cuenta
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.1 0-2 .9-2 2v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </button>
          </form>

          <div className="auth-footer">
            <p>¿Ya tenés una cuenta?</p>
            <Link to="/login">Iniciar sesión aquí</Link>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Visual Branding */}
      <div className="auth-visual-side">
        <div className="auth-visual-content">
          <div className="visual-badge">Equipo HalfMoon</div>
          <h3>Sumate a la gestión operativa.</h3>
          <p>Ayudá a mantener el catálogo actualizado, revisá pedidos entrantes y brindá el mejor soporte a la comunidad.</p>
          
          <div className="glass-card-mockup" style={{ transform: 'rotate(2deg)' }}>
            <div className="mockup-header">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <div className="mockup-body">
              <div className="mockup-line w-50"></div>
              <div className="mockup-line w-100"></div>
              <div className="mockup-line w-100 mt-4"></div>
              <div className="mockup-line w-80"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}