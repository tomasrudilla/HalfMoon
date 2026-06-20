// src/auth/Login.jsx
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

export default function Login({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Acá iría tu validación real contra la base de datos
    setIsAuthenticated(true); // Simulamos el login exitoso
    navigate('/admin'); // Redirigimos al panel
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">H</div>
          HALFMOON
        </div>
        
        <h2 className="auth-title">Bienvenido de nuevo</h2>
        <p className="auth-subtitle">Ingresa tus credenciales para acceder al panel</p>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Corporativo</label>
            <input type="email" placeholder="admin@halfmoon.com" required />
          </div>
          
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" placeholder="••••••••" required />
          </div>

          <button type="submit" className="btn-auth">Ingresar al Sistema</button>
        </form>

        <div className="auth-footer">
          ¿No tienes cuenta de administrador? <Link to="/register" className="auth-link">Solicitar acceso</Link>
        </div>
      </div>
    </div>
  );
}