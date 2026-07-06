import { useState, useEffect } from 'react';
import './Configuracion.css';

export default function Configuracion() {
  const [config, setConfig] = useState({
    business_name: '',
    support_email: '',
    whatsapp_number: '',
    whatsapp_message: '',
    notify_new_leads: true,
    notify_orders: true,
    catalog_visible: false,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) setConfig(data);
      })
      .catch(err => console.error(err));
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
      .then(res => res.json())
      .then(() => {
        setIsSaving(false);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      })
      .catch(err => {
        console.error(err);
        setIsSaving(false);
      });
  };

  const ToggleSwitch = ({ isOn, onToggle }) => (
    <button 
      type="button"
      className={`cfg-toggle ${isOn ? 'active' : ''}`} 
      onClick={onToggle}
    >
      <div className="cfg-toggle-thumb" />
    </button>
  );

  return (
    <div className="cfg-wrapper">
      <div className="cfg-header">
        <div>
          <h2>Configuración del Sistema ⚙️</h2>
          <p>Administrá las variables generales y preferencias de HalfMoon.</p>
        </div>
        <button 
          className="cfg-btn-save" 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="cfg-grid">
        {/* Columna Izquierda */}
        <div className="cfg-col">
          
          <div className="cfg-card">
            <div className="cfg-card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <h3>Perfil de la Marca</h3>
            </div>
            
            <div className="cfg-form-group">
              <label>Nombre del Negocio</label>
              <input 
                type="text" 
                value={config.business_name} 
                onChange={e => setConfig({ ...config, business_name: e.target.value })} 
                placeholder="Ej: HalfMoon Indumentaria"
              />
            </div>
            
            <div className="cfg-form-group">
              <label>Correo de Soporte</label>
              <input 
                type="email" 
                value={config.support_email} 
                onChange={e => setConfig({ ...config, support_email: e.target.value })} 
                placeholder="hola@halfmoon.com"
              />
            </div>
          </div>

          <div className="cfg-card">
            <div className="cfg-card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <h3>Preferencias y Alertas</h3>
            </div>
            
            <div className="cfg-switch-row">
              <div className="cfg-switch-info">
                <strong>Alertas de Nuevos Leads</strong>
                <span>Recibir notificaciones cuando alguien arme un diseño.</span>
              </div>
              <ToggleSwitch 
                isOn={config.notify_new_leads} 
                onToggle={() => setConfig({ ...config, notify_new_leads: !config.notify_new_leads })} 
              />
            </div>
            
            <div className="cfg-switch-divider"></div>
            
            <div className="cfg-switch-row">
              <div className="cfg-switch-info">
                <strong>Notificaciones de Producción</strong>
                <span>Avisos de cambios de estado en las órdenes.</span>
              </div>
              <ToggleSwitch 
                isOn={config.notify_orders} 
                onToggle={() => setConfig({ ...config, notify_orders: !config.notify_orders })} 
              />
            </div>
            
            <div className="cfg-switch-divider"></div>

            <div className="cfg-switch-row">
              <div className="cfg-switch-info">
                <strong>Catálogo con precios en la web</strong>
                <span>Mostrar /catalogo y link en el menú (oculto por defecto).</span>
              </div>
              <ToggleSwitch
                isOn={config.catalog_visible}
                onToggle={() => setConfig({ ...config, catalog_visible: !config.catalog_visible })}
              />
            </div>
          </div>

        </div>

        {/* Columna Derecha */}
        <div className="cfg-col">
          <div className="cfg-card cfg-card-wpp">
            <div className="cfg-card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.996 0C5.372 0 0 5.373 0 11.997c0 2.128.553 4.19 1.603 6.012L.15 24l6.14-1.613a11.916 11.916 0 005.706 1.455c6.623 0 11.996-5.373 11.996-11.997C23.992 5.373 18.62 0 11.996 0zm0 21.848a9.92 9.92 0 01-5.06-1.383l-.36-.214-3.76.988.997-3.666-.235-.373A9.917 9.917 0 011.998 12c0-5.516 4.484-10 10-10s10 4.484 10 10-4.484 10-10 10zm5.498-7.513c-.302-.15-1.785-.882-2.062-.983-.277-.101-.48-.152-.68.15-.202.302-.782.983-.958 1.185-.177.201-.354.226-.656.076-1.127-.563-2.185-1.3-2.998-2.263-.228-.27-.024-.418.127-.568.136-.135.302-.353.453-.529.151-.177.201-.303.302-.505.1-.202.05-.38-.025-.53-.076-.152-.68-1.644-.932-2.25-.246-.593-.497-.512-.68-.52-.176-.008-.38-.01-.58-.01-.201 0-.528.076-.804.378-.277.302-1.056 1.033-1.056 2.522 0 1.488 1.08 2.927 1.231 3.128.151.202 2.134 3.26 5.166 4.568 1.956.842 2.65.748 3.167.625.68-.163 1.785-.73 2.037-1.436.252-.705.252-1.31.177-1.437-.076-.126-.277-.202-.58-.353z"/></svg>
              <h3>Integración de WhatsApp</h3>
            </div>
            
            <div className="cfg-form-group">
              <label>Número de Recepción</label>
              <input 
                type="text" 
                value={config.whatsapp_number} 
                onChange={e => setConfig({ ...config, whatsapp_number: e.target.value })} 
                placeholder="Ej: 5493516668259"
              />
              <span className="cfg-helper-text">Incluí el código de país sin el símbolo "+".</span>
            </div>
            
            <div className="cfg-form-group">
              <label>Mensaje Automático Base</label>
              <textarea 
                rows="5" 
                value={config.whatsapp_message} 
                onChange={e => setConfig({ ...config, whatsapp_message: e.target.value })} 
                placeholder="¡Hola! Me gustaría hacer una consulta..."
              ></textarea>
              <span className="cfg-helper-text">Este mensaje se usará como base cuando los clientes hagan clic en los botones de contacto de la tienda.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notificación Toast */}
      {showToast && (
        <div className="cfg-toast">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Configuración actualizada correctamente.
        </div>
      )}
    </div>
  );
}