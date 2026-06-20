// src/admin-screens/NuevoDiseno.jsx
export default function NuevoDiseno({ setActiveTab }) {
  return (
    <>
      <div className="page-header">
        <div>
          <h2>Laboratorio: Nuevo Diseño Manual 🧪</h2>
          <p>Área de pruebas interna para crear y probar mockups.</p>
        </div>
        <div className="header-actions">
          {/* Botón para volver al dashboard */}
          <button className="btn-outline" onClick={() => setActiveTab('dashboard')}>
            ← Volver al inicio
          </button>
        </div>
      </div>
      
      <div className="table-container" style={{ padding: '40px', minHeight: '400px' }}>
        <div style={{ display: 'flex', gap: '30px' }}>
          
          {/* Zona del simulador visual */}
          <div style={{ flex: '1', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1' }}>
            <p style={{ color: '#64748b' }}>Simulador de Prenda</p>
          </div>

          {/* Controles de prueba */}
          <div style={{ width: '300px' }}>
            <h3 style={{ marginBottom: '20px' }}>Controles de Testeo</h3>
            
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>Subir Logo Prueba</label>
            <input type="file" style={{ marginBottom: '20px', width: '100%' }} />

            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>Color de Prenda</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
              <div style={{ width: '30px', height: '30px', background: '#000', borderRadius: '50%', cursor: 'pointer', border: '2px solid #cbd5e1' }}></div>
              <div style={{ width: '30px', height: '30px', background: '#fff', borderRadius: '50%', cursor: 'pointer', border: '2px solid #cbd5e1' }}></div>
              <div style={{ width: '30px', height: '30px', background: '#ef4444', borderRadius: '50%', cursor: 'pointer', border: '2px solid #cbd5e1' }}></div>
            </div>

            <button className="btn-dark" style={{ width: '100%' }}>Generar Mockup Final</button>
          </div>
        </div>
      </div>
    </>
  );
}