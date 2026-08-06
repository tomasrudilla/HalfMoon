import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

import Dashboard from './admin-screens/Dashboard.jsx';
import Leads from './admin-screens/Leads.jsx';
import Suscriptos from './admin-screens/Suscriptos.jsx';
import PlantillasMails from './admin-screens/PlantillasMails.jsx';
import Pedidos from './admin-screens/Pedidos.jsx';
import Catalogo from './admin-screens/Catalogo.jsx';
import Configuracion from './admin-screens/Configuracion.jsx';
import NuevoDiseno from './admin-screens/NuevoDiseno.jsx';
import TrabajosAdmin from './admin-screens/TrabajosAdmin.jsx';
import ServiciosAdmin from './admin-screens/ServiciosAdmin.jsx';
import ClientesAdmin from './admin-screens/ClientesAdmin.jsx';
import FaqsAdmin from './admin-screens/FaqsAdmin.jsx';
import CanvasPrendasAdmin from './admin-screens/CanvasPrendasAdmin.jsx';
import Presupuestos from './admin-screens/Presupuestos.jsx';

const SCREENS = {
  'dashboard': Dashboard,
  'leads': Leads,
  'suscriptos': Suscriptos,
  'plantillas-mails': PlantillasMails,
  'pedidos': Pedidos,
  'presupuestos': Presupuestos,
  'trabajos': TrabajosAdmin,
  'servicios': ServiciosAdmin,
  'clientes': ClientesAdmin,
  'faqs': FaqsAdmin,
  'canvas-prendas': CanvasPrendasAdmin,
  'catalogo': Catalogo,
  'configuracion': Configuracion,
  'nuevo-diseno': NuevoDiseno,
};

const MENU_CONFIG = [
  {
    section: 'Principal',
    items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'leads', icon: '👥', label: 'Leads & Prospectos' },
      { id: 'suscriptos', icon: '✉️', label: 'Suscriptos' },
      { id: 'plantillas-mails', icon: '📨', label: 'Plantillas de mail' },
      { id: 'presupuestos', icon: '💰', label: 'Presupuestos' },
    ]
  },
  {
    section: 'Producción',
    items: [
      { id: 'pedidos', icon: '📋', label: 'Pedidos / Producción' },
    ]
  },
  {
    section: 'Contenido Web',
    items: [
      { id: 'servicios', icon: '🛠️', label: 'Nuestros Servicios' },
      { id: 'trabajos', icon: '🖼️', label: 'Nuestros Trabajos' },
      { id: 'clientes', icon: '🏢', label: 'Nuestros Clientes' },
      { id: 'faqs', icon: '❓', label: 'Preguntas frecuentes' },
      { id: 'canvas-prendas', icon: '👕', label: 'Prendas personalizador' },
      { id: 'catalogo', icon: '🛍️', label: 'Catálogo & Precios' },
    ]
  },
  {
    section: 'Configuración',
    items: [
      { id: 'configuracion', icon: '⚙️', label: 'Configuración' },
    ]
  }
];

const TAB_KEY = 'halfmoon:admin-tab';

// La pestaña abierta vive en sessionStorage para que un refresh no te devuelva
// siempre al Dashboard, pero cada pestaña del navegador arranque independiente.
const readTab = () => {
  try {
    const saved = window.sessionStorage.getItem(TAB_KEY);
    return saved && SCREENS[saved] ? saved : 'dashboard';
  } catch {
    return 'dashboard';
  }
};

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || 'HM';

export default function Admin({ admin, onLogout }) {
  const [activeTab, setActiveTab] = useState(readTab);
  const ActiveScreen = SCREENS[activeTab];

  const goToTab = (id) => {
    setActiveTab(id);
    try {
      window.sessionStorage.setItem(TAB_KEY, id);
    } catch {
      // Sin storage la navegación funciona igual, solo no se recuerda.
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-logo-icon">H</div>
          HALFMOON
        </div>

        {MENU_CONFIG.map((group, index) => (
          <div key={index}>
            {/* Solo muestra el título si existe (no está vacío) */}
            {group.section && <div className="sidebar-section-title">{group.section}</div>}
            <ul className="sidebar-menu">
              {group.items.map((item) => (
                <li 
                  key={item.id}
                  className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`} 
                  onClick={() => goToTab(item.id)}
                >
                  <span>{item.icon}</span> {item.label}
                  {/* Se renderiza solo si el item tiene una propiedad badge */}
                  {item.badge && <span className="badge-count">{item.badge}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-footer-link">
            ← Volver a la Web
          </Link>
          <button type="button" className="sidebar-logout" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="search-bar">
            <span>🔍</span>
            <input type="text" placeholder="Buscar cliente, diseño o pedido." />
          </div>
          <div className="topbar-right">
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <span>🔔</span>
              <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></span>
            </div>
            <div style={{ width: '1px', height: '30px', background: '#e2e8f0', margin: '0 10px' }}></div>
            <div className="profile-widget">
              <div className="profile-avatar">{initials(admin?.name)}</div>
              <div className="profile-info">
                <h4>{admin?.name || 'Admin Halfmoon'}</h4>
                <p>{admin?.email}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <ActiveScreen setActiveTab={goToTab} />
        </div>
      </main>
    </div>
  );
}