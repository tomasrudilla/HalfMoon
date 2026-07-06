// src/admin-screens/Pedidos.jsx
import { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal.jsx';
import './Pedidos.css';

const STATUS_OPTIONS = ['Pendiente', 'En Producción', 'Listo / Esperando', 'Listo', 'Entregado'];
const KANBAN_COLS = [
  { key: 'prospectos', label: 'Prospectos', color: '#8b5cf6' },
  { key: 'Pendiente', label: 'Pendiente', color: '#ef4444' },
  { key: 'En Producción', label: 'En Producción', color: '#f59e0b' },
  { key: 'Listo', label: 'Listo', color: '#10b981' },
];

const EMPTY_ORDER = {
  lead_id: '',
  design_id: '',
  quantity: 1,
  total_price: '',
  status: 'Pendiente',
  delivery_date: '',
};

const statusClass = (status) => {
  if (status === 'Pendiente') return 'status-nuevo';
  if (status === 'En Producción') return 'status-presupuesto';
  if (status === 'Entregado') return 'status-entregado';
  return 'status-listo';
};

export default function Pedidos() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ pendientes: 0, en_produccion: 0, listos: 0, ingresos: 0 });
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [form, setForm] = useState(EMPTY_ORDER);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const [kanban, setKanban] = useState({ prospectos: [], pedidos: [] });

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/orders/stats').then(r => r.json()),
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/kanban').then(r => r.json()).catch(() => ({ prospectos: [], pedidos: [] })),
    ])
      .then(([ordersData, statsData, leadsData, kanbanData]) => {
        if (Array.isArray(ordersData)) setOrders(ordersData);
        if (statsData && !statsData.error) setStats(statsData);
        if (Array.isArray(leadsData)) setLeads(leadsData);
        if (kanbanData) setKanban(kanbanData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingOrder(null);
    setForm(EMPTY_ORDER);
    setModalOpen(true);
  };

  const openEdit = (order) => {
    setEditingOrder(order);
    setForm({
      lead_id: order.lead_id || '',
      design_id: order.design_id || '',
      quantity: order.quantity || 1,
      total_price: order.total_price || '',
      status: order.status || 'Pendiente',
      delivery_date: order.delivery_date || '',
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.lead_id) {
      alert('Seleccioná un cliente (lead).');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      lead_id: Number(form.lead_id),
      design_id: form.design_id ? Number(form.design_id) : null,
      quantity: Number(form.quantity) || 1,
      total_price: Number(form.total_price) || 0,
    };

    try {
      const url = editingOrder ? `/api/orders/${editingOrder.id}` : '/api/orders';
      const method = editingOrder ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('No se pudo guardar el pedido');
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: order.lead_id,
          design_id: order.design_id,
          quantity: order.quantity,
          total_price: order.total_price,
          status: newStatus,
          delivery_date: order.delivery_date,
        }),
      });
      if (!res.ok) throw new Error('Error al actualizar estado');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const confirmDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar');
      setOrderToDelete(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const headers = ['ORDEN', 'CLIENTE', 'PRENDA', 'CANTIDAD', 'TOTAL', 'ENTREGA', 'ESTADO'];
    const rows = orders.map(o => [
      o.order_code, o.client_name, o.product_title || '-', o.quantity,
      o.total_price, o.delivery_date || '-', o.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = 'pedidos-halfmoon.csv';
    link.click();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Pedidos / Producción</h2>
          <p>Control de estado de los trabajos en taller y despachos.</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle" style={{ marginRight: 12 }}>
            <button type="button" className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>⊞ Kanban</button>
            <button type="button" className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>☰ Tabla</button>
          </div>
          <button type="button" className="btn-outline" onClick={exportCsv}>Descargar planilla</button>
          <button type="button" className="btn-dark" onClick={openCreate}>+ Nuevo pedido</button>
        </div>
      </div>

      <div className="stats-grid pedidos-stats">
        <div className="stat-card" style={{ borderTop: '4px solid #ef4444' }}>
          <h3>{stats.pendientes || 0}</h3>
          <p className="stat-label">Pendientes</p>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #f59e0b' }}>
          <h3>{stats.en_produccion || 0}</h3>
          <p className="stat-label">En producción</p>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #10b981' }}>
          <h3>{stats.listos || 0}</h3>
          <p className="stat-label">Listos para entregar</p>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #3b82f6' }}>
          <h3>${Number(stats.ingresos || 0).toLocaleString('es-AR')}</h3>
          <p className="stat-label">Ingresos en curso</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 style={{ textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>Cola de producción</h3>
        </div>

        {viewMode === 'kanban' ? (
          <div className="kanban-board">
            <div className="kanban-col">
              <h4 style={{ borderColor: '#8b5cf6' }}>Prospectos ({kanban.prospectos?.length || 0})</h4>
              {(kanban.prospectos || []).map((p) => (
                <div key={`p-${p.id}`} className="kanban-card">
                  <strong>{p.title}</strong>
                  <span>{p.phone}</span>
                </div>
              ))}
            </div>
            {['Pendiente', 'En Producción', 'Listo / Esperando', 'Listo'].map((col) => (
              <div key={col} className="kanban-col">
                <h4>{col} ({orders.filter((o) => o.status === col).length})</h4>
                {orders.filter((o) => o.status === col).map((order) => (
                  <div key={order.id} className="kanban-card" onClick={() => openEdit(order)} role="button" tabIndex={0}>
                    <strong>{order.order_code}</strong>
                    <span>{order.client_name}</span>
                    <span>{order.quantity} u.</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : loading ? (
          <p style={{ textAlign: 'center', padding: '30px' }}>Cargando pedidos...</p>
        ) : orders.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
            No hay pedidos cargados. Creá uno con el botón de arriba.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ORDEN</th>
                <th>CLIENTE</th>
                <th style={{ textAlign: 'center' }}>CANT.</th>
                <th style={{ textAlign: 'center' }}>ENTREGA</th>
                <th style={{ textAlign: 'center' }}>ESTADO</th>
                <th style={{ textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 'bold' }}>{order.order_code}</td>
                  <td>
                    <strong>{order.client_name || '—'}</strong>
                    <br />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{order.product_title || 'Sin prenda'}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{order.quantity} u.</td>
                  <td style={{ textAlign: 'center' }}>{order.delivery_date || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <select
                      className="pedido-status-select"
                      value={order.status}
                      onChange={(e) => handleStatusChange(order, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button type="button" className="btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => openEdit(order)}>Editar</button>
                      <button type="button" className="btn-delete" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setOrderToDelete(order)}>Borrar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingOrder ? 'Editar pedido' : 'Nuevo pedido'}>
        <div className="pedido-form-grid">
          <div className="pedido-form-group pedido-form-group--full">
            <label htmlFor="lead_id">Cliente (lead) *</label>
            <select id="lead_id" name="lead_id" value={form.lead_id} onChange={handleFormChange} required>
              <option value="">Seleccionar cliente...</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.full_name} — {l.phone}</option>
              ))}
            </select>
          </div>
          <div className="pedido-form-group">
            <label htmlFor="quantity">Cantidad</label>
            <input id="quantity" name="quantity" type="number" min="1" value={form.quantity} onChange={handleFormChange} />
          </div>
          <div className="pedido-form-group">
            <label htmlFor="total_price">Total ($)</label>
            <input id="total_price" name="total_price" type="number" min="0" step="0.01" value={form.total_price} onChange={handleFormChange} />
          </div>
          <div className="pedido-form-group">
            <label htmlFor="status">Estado</label>
            <select id="status" name="status" value={form.status} onChange={handleFormChange}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="pedido-form-group">
            <label htmlFor="delivery_date">Fecha entrega</label>
            <input id="delivery_date" name="delivery_date" value={form.delivery_date} onChange={handleFormChange} placeholder="Ej: Viernes 12" />
          </div>
        </div>
        <div className="pedido-modal-actions">
          <button type="button" className="btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button>
          <button type="button" className="btn-dark" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!orderToDelete} onClose={() => setOrderToDelete(null)} title="Eliminar pedido">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p>¿Eliminar el pedido <strong>{orderToDelete?.order_code}</strong>?</p>
          <div className="pedido-modal-actions" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn-outline" onClick={() => setOrderToDelete(null)} disabled={saving}>Cancelar</button>
            <button type="button" className="btn-delete" onClick={confirmDelete} disabled={saving}>
              {saving ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
