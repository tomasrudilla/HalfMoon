// src/admin-screens/Pedidos.jsx
export default function Pedidos() {
  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Pedidos / Producción</h2>
          <p>Control de estado de los trabajos en taller y despachos.</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline">Descargar Planilla Taller</button>
          <button className="btn-dark">+ Nuevo Pedido</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ borderTop: '4px solid #ef4444' }}>
          <h3>12</h3>
          <p className="stat-label">Pendientes (Esperando taller)</p>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #f59e0b' }}>
          <h3>8</h3>
          <p className="stat-label">En Producción (Estampando)</p>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #10b981' }}>
          <h3>5</h3>
          <p className="stat-label">Listos para entregar</p>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #3b82f6' }}>
          <h3>$450.000</h3>
          <p className="stat-label">Ingresos proyectados (Mes)</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div>
            <h3 style={{textTransform: 'uppercase', fontWeight: 'bold'}}>Cola de Producción Activa</h3>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ verticalAlign: 'middle' }}>ORDEN</th>
              <th style={{ verticalAlign: 'middle' }}>CLIENTE</th>
              <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>CANTIDAD</th>
              <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>FECHA ENTREGA</th>
              <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>ESTADO TALLER</th>
              <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'middle', fontWeight: 'bold' }}>ORD-001</td>
              <td style={{ verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong>Club Atlético Sur</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Remeras Deportivas</span>
                </div>
              </td>
              <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>25 u.</td>
              <td style={{ verticalAlign: 'middle', textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>Mañana</td>
              <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                <span className="status-pill status-presupuesto">En Producción</span>
              </td>
              <td style={{ verticalAlign: 'middle', textAlign: 'center' }}><button className="btn-outline">Editar</button></td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'middle', fontWeight: 'bold' }}>ORD-002</td>
              <td style={{ verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong>Sofía Lencina</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Buzos Canguro</span>
                </div>
              </td>
              <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>1 u.</td>
              <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>Viernes 12</td>
              <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                <span className="status-pill status-nuevo">Pendiente</span>
              </td>
              <td style={{ verticalAlign: 'middle', textAlign: 'center' }}><button className="btn-outline">Editar</button></td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'middle', fontWeight: 'bold' }}>ORD-003</td>
              <td style={{ verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong>Lucas P.</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Remera Negra</span>
                </div>
              </td>
              <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>1 u.</td>
              <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>Lunes 15</td>
              <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                <span className="status-pill" style={{background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac'}}>Listo / Esperando</span>
              </td>
              <td style={{ verticalAlign: 'middle', textAlign: 'center' }}><button className="btn-outline">Editar</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}