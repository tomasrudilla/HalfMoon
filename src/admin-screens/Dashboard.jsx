// src/admin-screens/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal.jsx';
import CanvasDesignPreview, { parseCanvasDesign } from '../components/CanvasDesignPreview.jsx';
import './Dashboard.css';

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({ leadsTotales: 0, disenosTotales: 0, pedidosPendientes: 0, ingresosProyectados: 0 });
  const [designs, setDesigns] = useState([]);
  const [viewMode, setViewMode] = useState('cards');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = useCallback(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => { if (!data.error) setStats(data); })
      .catch(err => console.error(err));

    fetch('/api/canvas-designs')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setDesigns(data); })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openDetail = (design) => {
    setSelected(design);
    setIsModalOpen(true);
  };

  const handleDelete = async (design) => {
    const name = design.creator || 'este diseño';
    if (!window.confirm(`¿Eliminar el diseño de ${name}? Esta acción no se puede deshacer.`)) return;

    setDeletingId(design.id);
    try {
      const res = await fetch(`/api/leads/${design.lead_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar');

      setDesigns(prev => prev.filter(d => d.id !== design.id));
      if (selected?.id === design.id) {
        setIsModalOpen(false);
        setSelected(null);
      }
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const exportToExcel = () => {
    const headers = ['ID', 'CLIENTE', 'PRENDA', 'FECHA'];
    const csvContent = 'data:text/csv;charset=utf-8,'
      + headers.join(',') + '\n'
      + designs.map(row => `${row.id},${row.creator},${row.product_title || 'Ninguna'},${row.created_at}`).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'Reporte_Dashboard.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedParsed = selected ? parseCanvasDesign(selected.customer_comment) : null;

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Hola, Equipo Halfmoon 👋</h2>
          <p>Resumen automatizado con la actividad en tiempo real de tu base de datos.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-outline" onClick={exportToExcel}>Exportar Reporte</button>
          <button type="button" className="btn-dark" onClick={() => setActiveTab('nuevo-diseno')}>+ Nuevo Diseño Manual</button>
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

      <div className="table-container dashboard-designs-section">
        <div className="table-header dashboard-designs-header">
          <div>
            <h3 style={{ textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>Diseños recientes</h3>
          </div>
          <div className="dashboard-header-actions">
            <div className="view-toggle">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                ☰ Lista
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
              >
                ⊞ Cards
              </button>
            </div>
            <span className="link-green" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('leads')}>
              Ver todos los leads →
            </span>
          </div>
        </div>

        {designs.length === 0 && (
          <p className="dashboard-empty">Todavía no hay diseños guardados.</p>
        )}

        {viewMode === 'cards' && designs.length > 0 && (
          <div className="dashboard-cards-grid">
            {designs.map((design) => (
              <div key={design.id} className="dashboard-design-card">
                <CanvasDesignPreview
                  customerComment={design.customer_comment}
                  productTitle={design.product_title}
                  bgColor={design.bg_color || '#f1f5f9'}
                  variant="card"
                />
                <div className="dashboard-design-card-body">
                  <p className="dashboard-design-label">Diseño de:</p>
                  <h4>{design.creator}</h4>
                  <p className="dashboard-design-product">{design.product_title}</p>
                </div>
                <div className="dashboard-design-card-actions">
                  <button type="button" className="btn-outline" onClick={() => openDetail(design)}>
                    Ver Detalles completos
                  </button>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => handleDelete(design)}
                    disabled={deletingId === design.id}
                  >
                    {deletingId === design.id ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'list' && designs.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th style={{ textAlign: 'center' }}>CLIENTE</th>
                <th style={{ textAlign: 'center' }}>PRENDA</th>
                <th style={{ textAlign: 'center' }}>FECHA</th>
                <th style={{ textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {designs.map((row) => (
                <tr key={row.id}>
                  <td>#{row.id}</td>
                  <td style={{ textAlign: 'center' }}>
                    <strong>{row.creator}</strong>
                  </td>
                  <td style={{ textAlign: 'center' }}>{row.product_title || 'Sin prenda'}</td>
                  <td style={{ textAlign: 'center' }}>{new Date(row.created_at).toLocaleDateString('es-AR')}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="dashboard-row-actions">
                      <button type="button" className="btn-icon-action" onClick={() => openDetail(row)} title="Ver detalle">
                        👁
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action btn-icon-delete"
                        onClick={() => handleDelete(row)}
                        disabled={deletingId === row.id}
                        title="Eliminar"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Diseño de ${selected?.creator}`}>
        {selected && selectedParsed && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#64748b', marginBottom: '15px' }}>
              Prenda base: <strong>{selected.product_title}</strong>
              {selectedParsed.color && <> · Color: <strong>{selectedParsed.color}</strong></>}
            </p>

            <CanvasDesignPreview
              customerComment={selected.customer_comment}
              productTitle={selected.product_title}
              bgColor={selected.bg_color || '#f1f5f9'}
              variant="modal"
            />

            <div style={{ textAlign: 'left', background: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#000', marginTop: '16px' }}>
              <strong>Resumen del diseño:</strong>
              <p style={{ margin: '8px 0 0 0', color: '#334155' }}>{selectedParsed.comment}</p>
            </div>

            <button
              type="button"
              className="btn-delete btn-delete-modal"
              onClick={() => handleDelete(selected)}
              disabled={deletingId === selected.id}
            >
              {deletingId === selected.id ? 'Eliminando…' : 'Eliminar este diseño'}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
