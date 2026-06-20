// src/auth/Register.jsx
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    // Simulación de registro exitoso, mandamos a login
    alert('Solicitud enviada. Contacta al administrador principal.');
    navigate('/login');
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">H</div>
          HALFMOON
        </div>
        
        <h2 className="auth-title">Nuevo Administrador</h2>
        <p className="auth-subtitle">Crea un perfil para gestionar la plataforma</p>

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label>Nombre Completo</label>
            <input type="text" placeholder="Ej: Equipo Vexlarin" required />
          </div>

          <div className="form-group">
            <label>Email Corporativo</label>
            <input type="email" placeholder="nombre@halfmoon.com" required />
          </div>
          
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" placeholder="Crea una contraseña segura" required />
          </div>

          <button type="submit" className="btn-auth">Crear Cuenta</button>
        </form>

        <div className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login" className="auth-link">Iniciar sesión aquí</Link>
        </div>
      </div>
    </div>
  );
}