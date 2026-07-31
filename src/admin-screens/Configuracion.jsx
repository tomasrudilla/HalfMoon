import { useState, useEffect, useRef } from 'react';
import './Configuracion.css';

/** Plantillas editables, agrupadas por el momento en que se disparan. */
const MESSAGE_FIELDS = [
  {
    key: 'msg_personalizer_save',
    group: 'En la web',
    label: 'Personalizador · al guardar el diseño',
    help: 'Texto que ve el cliente en el pop-up antes de dejar sus datos.',
    tokens: [],
  },
  {
    key: 'msg_personalizer_quote',
    group: 'En la web',
    label: 'Personalizador · al pedir presupuesto',
    help: 'Texto del pop-up cuando el cliente pide cotización desde el personalizador.',
    tokens: [],
  },
  {
    key: 'msg_wpp_quote',
    group: 'En la web',
    label: 'WhatsApp · botón de presupuesto',
    help: 'Mensaje con el que se abre WhatsApp desde el botón de presupuesto.',
    tokens: [],
  },
  {
    key: 'msg_design_saved',
    group: 'Mails al cliente',
    label: 'Guardó su diseño',
    help: 'Se manda con el PNG adjunto cuando alguien guarda un diseño.',
    tokens: ['cliente', 'prenda', 'negocio'],
  },
  {
    key: 'msg_quote_requested',
    group: 'Mails al cliente',
    label: 'Pidió presupuesto desde el personalizador',
    help: 'Acuse de recibo automático, también con el diseño adjunto.',
    tokens: ['cliente', 'prenda', 'cantidad', 'negocio'],
  },
  {
    key: 'msg_quote_created',
    group: 'Mails al cliente',
    label: 'Le generaste un presupuesto',
    help: 'Se envía desde Leads o Producción al crear el presupuesto, avisando la seña pendiente.',
    tokens: ['cliente', 'prenda', 'cantidad', 'total', 'sena', 'saldo', 'negocio'],
  },
  {
    key: 'msg_admin_new_design',
    group: 'Mail interno',
    label: 'Aviso a HalfMoon',
    help: 'Encabezado del mail que les llega a ustedes con los datos de quien usó el personalizador.',
    tokens: ['cliente', 'prenda', 'cantidad'],
  },
];

const GROUPS = ['En la web', 'Mails al cliente', 'Mail interno'];

function ToggleSwitch({ isOn, onToggle }) {
  return (
    <button
      type="button"
      className={`cfg-toggle ${isOn ? 'active' : ''}`}
      onClick={onToggle}
    >
      <div className="cfg-toggle-thumb" />
    </button>
  );
}

function MessageField({ field, value, onChange }) {
  const ref = useRef(null);

  const insertToken = (token) => {
    const el = ref.current;
    const text = value || '';
    const at = el?.selectionStart ?? text.length;
    const next = `${text.slice(0, at)}{${token}}${text.slice(at)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = at + token.length + 2;
      el?.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="cfg-msg-field">
      <label htmlFor={`msg-${field.key}`}>{field.label}</label>
      <textarea
        id={`msg-${field.key}`}
        ref={ref}
        rows="3"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="cfg-msg-foot">
        <span className="cfg-helper-text">{field.help}</span>
        {field.tokens.length > 0 && (
          <div className="cfg-msg-tokens">
            {field.tokens.map((token) => (
              <button
                key={token}
                type="button"
                className="cfg-token"
                onClick={() => insertToken(token)}
                title={`Insertar {${token}}`}
              >
                {`{${token}}`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Configuracion() {
  const [config, setConfig] = useState({
    business_name: '',
    support_email: '',
    whatsapp_number: '',
    whatsapp_message: '',
    notify_new_leads: true,
    notify_orders: true,
    catalog_visible: false,
    notify_quote_email: true,
    msg_personalizer_save: '',
    msg_personalizer_quote: '',
    msg_wpp_quote: '',
    msg_design_saved: '',
    msg_quote_requested: '',
    msg_quote_created: '',
    msg_admin_new_design: '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [emailReady, setEmailReady] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) setConfig(prev => ({ ...prev, ...data }));
      })
      .catch(err => console.error(err));

    fetch('/api/email/status')
      .then(res => res.json())
      .then(data => setEmailReady(!!data.configured))
      .catch(() => setEmailReady(false));
  }, []);

  const setField = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

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

            <div className="cfg-switch-divider"></div>

            <div className="cfg-switch-row">
              <div className="cfg-switch-info">
                <strong>Avisar por mail al crear un presupuesto</strong>
                <span>Deja tildada la opción cuando generás un presupuesto desde Leads o Producción.</span>
              </div>
              <ToggleSwitch
                isOn={config.notify_quote_email}
                onToggle={() => setConfig({ ...config, notify_quote_email: !config.notify_quote_email })}
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

      <div className="cfg-card cfg-card-messages">
        <div className="cfg-card-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v12H5.17L4 17.17z"></path><path d="M8 9h8"></path><path d="M8 12h5"></path></svg>
          <h3>Mensajes automáticos</h3>
        </div>

        <p className="cfg-msg-intro">
          Editá el texto de cada caso. Lo que va entre llaves se reemplaza solo con los datos
          reales del cliente; tocá una etiqueta para insertarla donde tenés el cursor.
        </p>

        {!emailReady && (
          <p className="cfg-msg-warning">
            El servidor todavía no tiene SMTP configurado, así que los mails no van a salir.
            Cargá las variables SMTP_* en el archivo <code>.env</code> para activarlos.
          </p>
        )}

        {GROUPS.map((group) => (
          <div key={group} className="cfg-msg-group">
            <h4 className="cfg-msg-group-title">{group}</h4>
            {MESSAGE_FIELDS.filter((f) => f.group === group).map((field) => (
              <MessageField
                key={field.key}
                field={field}
                value={config[field.key]}
                onChange={(value) => setField(field.key, value)}
              />
            ))}
          </div>
        ))}
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