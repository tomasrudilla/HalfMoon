// src/admin-screens/Dashboard.jsx
import { useState, useEffect } from 'react';
import Modal from '../components/Modal.jsx';

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({ leadsTotales: 0, disenosTotales: 0, pedidosPendientes: 0, ingresosProyectados: 0 });
  const [recentLeads, setRecentLeads] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);

  useEffect(() => {
    // Cargar Contadores
    fetch('http://localhost:3000/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));

    // Cargar Tabla Recientes
    fetch('http://localhost:3000/api/dashboard/recent-leads')
      .then(res => res.json())
      .then(data => setRecentLeads(data))
      .catch(err => console.error(err));
  }, []);

  const handleViewDesign = (leadName, productTitle, comment, bgColor) => {
    setSelectedDesign({
      clientName: leadName,
      product: productTitle || 'Sin prenda asignada',
      visualDescription: comment || 'El usuario no ingresó aclaraciones adicionales.',
      bgColor: bgColor || '#f1f5f9'
    });
    setIsModalOpen(true);
  };

  const exportToExcel = () => {
    const headers = ['ID LEAD', 'CLIENTE', 'ORIGEN', 'PRENDA', 'FECHA'];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + recentLeads.map(row => `${row.id},${row.full_name},${row.origin},${row.product_title || 'Ninguna'},${row.created_at}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Reporte_Dashboard.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Hola, Equipo Halfmoon 👋</h2>
          <p>Resumen automatizado con la actividad en tiempo real de tu base de datos.</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={exportToExcel}>Exportar Reporte</button>
          <button className="btn-dark" onClick={() => setActiveTab('nuevo-diseno')}>+ Nuevo Diseño Manual</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3 className="stat-value">{stats.leadsTotales}</h3>
          <p className="stat-label">Leads Totales (Web/WhatsApp)</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-value">{stats.disenosTotales}</h3>
          <p className="stat-label">Diseños Creados</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-value">{stats.pedidosPendientes}</h3>
          <p className="stat-label">Pedidos Activos en Taller</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-value">${Number(stats.ingresosProyectados).toLocaleString('es-AR')}</h3>
          <p className="stat-label">Volumen en Producción</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div>
            <h3 style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Últimos Leads (Canvas)</h3>
          </div>
          <span className="link-green" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('leads')}>
            Ver todos los leads →
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ verticalAlign: 'middle' }}>ID LEAD</th>
              <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>CLIENTE</th>
              <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>PRENDA</th>
              <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>FECHA</th>
              <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {recentLeads.map((row) => (
              <tr key={row.id}>
                <td style={{ verticalAlign: 'middle' }}>#{row.id}</td>
                <td style={{ verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <strong>{row.full_name}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{row.origin}</span>
                  </div>
                </td>
                <td style={{ verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span>{row.product_title || 'Ninguna (Solo Paseo)'}</span>
                  </div>
                </td>
                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>{new Date(row.created_at).toLocaleDateString()}</td>
                <td 
                  style={{ textAlign: 'center', verticalAlign: 'middle', cursor: 'pointer', fontSize: '18px' }} 
                  onClick={() => handleViewDesign(row.full_name, row.product_title, row.customer_comment, row.bg_color)}
                >
                  👁️
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Diseño de ${selectedDesign?.clientName}`}>
        {selectedDesign && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#64748b', marginBottom: '15px' }}>Prenda seleccionada: <strong>{selectedDesign.product}</strong></p>
            <div style={{ width: '100%', height: '250px', backgroundColor: selectedDesign.bgColor, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', border: selectedDesign.bgColor === '#fff' ? '1px dashed #cbd5e1' : 'none' }}>
              <span style={{ fontSize: '40px' }}>👕</span>
            </div>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#000', textAlign: 'left' }}>
              <strong>Detalles del Canvas:</strong>
              <p style={{ margin: '5px 0 0 0', fontStyle: 'italic' }}>"{selectedDesign.visualDescription}"</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}