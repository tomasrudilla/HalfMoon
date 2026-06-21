// src/Admin.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

import Dashboard from './admin-screens/Dashboard.jsx';
import Leads from './admin-screens/Leads.jsx';
import Pedidos from './admin-screens/Pedidos.jsx';
import Catalogo from './admin-screens/Catalogo.jsx';
import Configuracion from './admin-screens/Configuracion.jsx';
import NuevoDiseno from './admin-screens/NuevoDiseno.jsx';

const SCREENS = {
  'dashboard': Dashboard,
  'leads': Leads,
  'pedidos': Pedidos,
  'catalogo': Catalogo,
  'configuracion': Configuracion,
  'nuevo-diseno': NuevoDiseno,
};

const MENU_CONFIG = [
  {
    section: 'Principal',
    items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'leads', icon: '👥', label: 'Leads & Clientes', badge: 12 },
    ]
  },
  {
    section: '', // <-- Título "Gestión" eliminado
    items: [
      { id: 'pedidos', icon: '📋', label: 'Pedidos / Producción' },
      { id: 'catalogo', icon: '🛍️', label: 'Catálogo & Precios' },
      { id: 'configuracion', icon: '⚙️', label: 'Configuración' },
    ]
  }
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const ActiveScreen = SCREENS[activeTab];

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
                  onClick={() => setActiveTab(item.id)}
                >
                  <span>{item.icon}</span> {item.label}
                  {item.badge && <span className="badge-count">{item.badge}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div style={{ marginTop: 'auto', padding: '24px' }}>
          <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ← Volver a la Web
          </Link>
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
              <div className="profile-avatar">HM</div>
              <div className="profile-info">
                <h4>Admin Halfmoon</h4>
                <p>Administrador</p>
              </div>
              <span style={{ color: '#64748b', fontSize: '12px' }}>▼</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <ActiveScreen setActiveTab={setActiveTab} />
        </div>
      </main>
    </div>
  );
}