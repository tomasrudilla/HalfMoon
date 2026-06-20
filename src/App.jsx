// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Admin from "./Admin.jsx"; 
import Login from "./auth/Login.jsx";
import Register from "./auth/Register.jsx"; 
import Modal from "./components/Modal.jsx"; 
import './App.css';

// --- COMPONENTE DE LA LANDING PAGE ---
function LandingPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  
  // Estados para los datos reales de la Base de Datos
  const [catalogoBD, setCatalogoBD] = useState([]);
  const [formData, setFormData] = useState({ nombre: '', telefono: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Traer el catálogo apenas carga la página desde tu API
  useEffect(() => {
    fetch('http://localhost:3000/api/catalogo')
      .then(res => res.json())
      .then(data => setCatalogoBD(data))
      .catch(err => console.error("Error cargando catálogo:", err));
  }, []);

  // Manejar el envío real del formulario a Neon
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsLeadModalOpen(false); 
        setIsCustomizerOpen(true); // Se abre el simulador recién cuando la BD confirma
      }
    } catch (error) {
      console.error("Error guardando lead:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si el personalizador está abierto, mostramos esta pantalla
  if (isCustomizerOpen) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#000', color: '#fff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Personalizador HalfMoon 🎨</h2>
          <button onClick={() => setIsCustomizerOpen(false)} style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer' }}>
            Cerrar Simulador
          </button>
        </header>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <h1 style={{ color: '#0f172a' }}>Simulador en construcción 🚧</h1>
          <p style={{ color: '#64748b' }}>El Lead se guardó en la base de datos de Neon exitosamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-wrapper">
      {/* Barra superior negra */}
      <div className="announcement-bar">ES LA PERCHA, NO LA PILCHA</div>
      
      {/* Navegación Blanc/Negro */}
      <nav className="navbar">
        <div className="nav-container">
          <a href="#" className="logo-link">
            <img src="https://d22fxaf9t8d39k.cloudfront.net/5009daf20579eb1b525efcc155225c5570c37dc556d994000e00fceb70568b86273842.jpg" alt="HalfMoon Logo" className="logo-img" />
          </a>
          <ul className="nav-links">
            <li><a href="#inicio">Inicio</a></li>
            <li><a href="#servicios">Catálogo</a></li>
            <li><a href="#personalizar">Personalizar</a></li>
          </ul>
          <a href="/login" className="btn-black" style={{ textDecoration: 'none' }}>Acceso Admin</a>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section id="inicio" className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">TU MARCA,<br /><span className="text-gray">TU DISEÑO.</span></h1>
            <p className="hero-text">Especialistas en indumentaria personalizada. Venta minorista y mayorista.</p>
            <div className="hero-actions">
              <button onClick={() => setIsLeadModalOpen(true)} className="btn-black btn-icon">
                <span className="icon-palette">🎨</span> Armar mi prenda
              </button>
              <button className="btn-outline">Presupuesto Mayorista</button>
            </div>
          </div>
          <div className="hero-watermark">HALFMOON</div>
        </section>

        {/* --- MAPEO DEL CATÁLOGO REAL DESDE NEON --- */}
        <section id="servicios" className="services-section">
          <h2 className="section-title">NUESTRO CATÁLOGO</h2>
          <p className="section-subtitle">Soluciones de estampado e indumentaria para marcas, empresas y egresados.</p>
          <div className="services-grid">
            {catalogoBD.length === 0 ? (
              <p>Cargando prendas desde la base de datos...</p>
            ) : (
              catalogoBD.map((item) => (
                <div key={item.id} className="service-card">
                  <div className="check-icon">✓</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <p style={{ fontWeight: 'bold', marginTop: '10px', color: '#10b981' }}>{item.price}</p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Sección Personalizador Oscura */}
        <section id="personalizar" className="customizer-section">
          <div className="customizer-container">
            <div className="customizer-content">
              <h2>VER CÓMO QUEDA TU<br/>DISEÑO NUNCA FUE TAN<br/>FÁCIL.</h2>
              <p>Elegí la prenda, subí tu logo, ajustalo donde más te guste y envianos el diseño terminado directo por WhatsApp.</p>
              <ul className="customizer-steps">
                <li><span className="step-number">1</span> Subí tu imagen (PNG o JPG)</li>
                <li><span className="step-number">2</span> Elegí el tamaño y la ubicación</li>
                <li><span className="step-number">3</span> ¡Enviá tu pedido por WhatsApp!</li>
              </ul>
              <button onClick={() => setIsLeadModalOpen(true)} className="btn-white">IR AL PERSONALIZADOR WEB &gt;</button>
            </div>
            <div className="customizer-visual">
              <div className="visual-mockup"><div className="upload-box"><span className="upload-icon">↑</span>SUBIR LOGO</div></div>
              <div className="visual-caption">SIMULADOR INTERACTIVO</div>
            </div>
          </div>
        </section>

        {/* Sección Galería */}
        <section className="gallery-section">
          <h2 className="section-title">ESTILO HALFMOON</h2>
          <div className="gallery-grid">
            <div className="gallery-item bg-gray"></div>
            <div className="gallery-item bg-dark"></div>
            <div className="gallery-item bg-red"></div>
            <div className="gallery-item bg-black"></div>
          </div>
        </section>
      </main>

      {/* --- MODAL CAPTURA DE LEADS (FORMULARIO REAL) --- */}
      <Modal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} title="¡Empezá a diseñar!">
        <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', marginBottom: '20px' }}>Dejanos tus datos para guardar tu diseño y que podamos contactarte si necesitas presupuesto.</p>
        
        <form onSubmit={handleLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#000' }}>Nombre o Marca *</label>
            <input 
              type="text" 
              placeholder="Ej: Marca de Ropa"
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', color: '#000' }}
              value={formData.nombre} 
              onChange={e => setFormData({...formData, nombre: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#000' }}>WhatsApp *</label>
            <input 
              type="tel" 
              placeholder="+54 9 11..." 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', color: '#000' }}
              value={formData.telefono} 
              onChange={e => setFormData({...formData, telefono: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#000' }}>Email (Opcional)</label>
            <input 
              type="email" 
              placeholder="hola@correo.com" 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', color: '#000' }}
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '12px', background: isSubmitting ? '#475569' : '#000', color: '#fff', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
            {isSubmitting ? 'Guardando...' : 'Ir al Simulador →'}
          </button>
        </form>
      </Modal>

      {/* Footer Negro */}
      <footer className="footer-dark">
        <div className="footer-container">
          <div className="footer-column brand-col">
            <img src="https://d22fxaf9t8d39k.cloudfront.net/5009daf20579eb1b525efcc155225c5570c37dc556d994000e00fceb70568b86273842.jpg" alt="HalfMoon" className="footer-logo-img" />
            <p>Es la percha, no la pilcha. Indumentaria y personalizados de alta calidad.</p>
          </div>
          <div className="footer-column">
            <h4>REDES SOCIALES</h4>
            <p>📷 @halfmoon.indumentaria</p>
          </div>
          <div className="footer-column">
            <h4>CONTACTO</h4>
            <p>✉️ halfmooncba@gmail.com</p>
            <p className="small-text">Envíos a todo el país. Retiro en puntos de venta.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL CON PROTECCIÓN DE RUTAS ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={isAuthenticated ? <Admin /> : <Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}