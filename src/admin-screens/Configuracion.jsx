// src/admin-screens/Configuracion.jsx
import { useState, useEffect } from 'react';

export default function Configuracion() {
  const [config, setConfig] = useState({
    business_name: '',
    support_email: '',
    whatsapp_number: '',
    whatsapp_message: '',
    notify_new_leads: true,
    notify_orders: true
  });

  useEffect(() => {
    fetch('http://localhost:3000/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) setConfig(data);
      })
      .catch(err => console.error(err));
  }, []);

  const handleSave = () => {
    fetch('http://localhost:3000/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
      .then(res => res.json())
      .then(() => alert('Configuración guardada en la base de datos.'))
      .catch(err => console.error(err));
  };

  const ToggleSwitch = ({ isOn, onToggle }) => (
    <div onClick={onToggle} style={{ width: '44px', height: '24px', borderRadius: '12px', backgroundColor: isOn ? '#10b981' : '#cbd5e1', position: 'relative', cursor: 'pointer' }}>
      <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', left: isOn ? '23px' : '3px', transition: 'left 0.2s' }} />
    </div>
  );

  return (
    <>
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <div>
          <h2 style={{ color: '#0f172a' }}>Configuración del Sistema ⚙️</h2>
          <p>Administra las variables generales almacenadas en tu tabla operacional.</p>
        </div>
        <div className="header-actions">
          <button className="btn-dark" style={{ background: '#10b981', color: 'white', border: 'none' }} onClick={handleSave}>
            Guardar Cambios
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="table-container" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '24px', color: '#0f172a' }}>Perfil de la Marca</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#000' }}>Nombre del Negocio</label>
              <input type="text" value={config.business_name} onChange={e => setConfig({ ...config, business_name: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#000' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#000' }}>Correo de Soporte</label>
              <input type="email" value={config.support_email} onChange={e => setConfig({ ...config, support_email: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#000' }} />
            </div>
          </div>

          <div className="table-container" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '24px', color: '#0f172a' }}>Preferencias</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: '#000' }}>Alertas de Nuevos Leads</strong>
              </div>
              <ToggleSwitch isOn={config.notify_new_leads} onToggle={() => setConfig({ ...config, notify_new_leads: !config.notify_new_leads })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: '#000' }}>Notificaciones de Producción</strong>
              </div>
              <ToggleSwitch isOn={config.notify_orders} onToggle={() => setConfig({ ...config, notify_orders: !config.notify_orders })} />
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="table-container" style={{ padding: '30px', borderTop: '4px solid #25D366' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '24px', color: '#0f172a' }}>Integración de WhatsApp</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#000' }}>Número de Recepción</label>
              <input type="text" value={config.whatsapp_number} onChange={e => setConfig({ ...config, whatsapp_number: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#000' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#000' }}>Mensaje Automático</label>
              <textarea rows="5" value={config.whatsapp_message} onChange={e => setConfig({ ...config, whatsapp_message: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#000', resize: 'vertical', lineHeight: '1.5' }}></textarea>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}