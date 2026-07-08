// src/admin-screens/Pedidos.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '../components/Modal.jsx';
import './Pedidos.css';

const STATUS_OPTIONS = ['Pendiente', 'En Producción', 'Listo / Esperando', 'Listo', 'Entregado'];

const KANBAN_COLS = [
  { key: 'prospectos', label: 'Prospectos', color: '#8b5cf6', statuses: null },
  { key: 'Pendiente', label: 'Pendiente', color: '#ef4444', statuses: ['Pendiente'] },
  { key: 'En Producción', label: 'En Producción', color: '#f59e0b', statuses: ['En Producción'] },
  { key: 'Listo', label: 'Listo / Esperando', color: '#10b981', statuses: ['Listo', 'Listo / Esperando'] },
  { key: 'Entregado', label: 'Entregado', color: '#3b82f6', statuses: ['Entregado'] },
];

const EMPTY_ORDER = {
  lead_id: '',
  design_id: '',
  quantity: 1,
  total_price: '',
  status: 'Pendiente',
  delivery_date: '',
};

const EMPTY_LEAD = { full_name: '', phone: '', email: '', origin: '', status: 'Prospecto' };

const statusClass = (status) => {
  if (status === 'Pendiente') return 'status-pendiente';
  if (status === 'En Producción') return 'status-produccion';
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

  // Lead (prospecto) edit modal
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [leadForm, setLeadForm] = useState(EMPTY_LEAD);

  // Drag & drop + filtros
  const [dragged, setDragged] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

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

  const openLeadEdit = (lead) => {
    setEditingLead(lead);
    setLeadForm({
      full_name: lead.title || lead.full_name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      origin: lead.origin || 'Canvas Web',
      status: lead.status || 'Prospecto',
    });
    setLeadModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLeadChange = (e) => {
    const { name, value } = e.target;
    setLeadForm(prev => ({ ...prev, [name]: value }));
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

  const handleLeadSave = async () => {
    if (!leadForm.full_name) {
      alert('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadForm),
      });
      if (!res.ok) throw new Error('No se pudo guardar el prospecto');
      setLeadModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const convertProspectToOrder = () => {
    if (!editingLead) return;
    setLeadModalOpen(false);
    setEditingOrder(null);
    setForm({ ...EMPTY_ORDER, lead_id: String(editingLead.id) });
    setModalOpen(true);
  };

  const updateOrderStatus = async (order, newStatus) => {
    // Optimista: refleja el cambio al instante
    setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, status: newStatus } : o)));
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
      loadData();
    }
  };

  const createOrderFromProspect = async (lead, status) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          design_id: null,
          quantity: lead.quantity || 1,
          total_price: 0,
          status,
          delivery_date: null,
        }),
      });
      if (!res.ok) throw new Error('No se pudo convertir el prospecto en pedido');
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

  // ---- Drag & drop ----
  const handleDragStart = (type, data) => setDragged({ type, data });
  const handleDragEnd = () => { setDragged(null); setDragOverCol(null); };

  const handleDrop = (col) => {
    if (!dragged) return;
    const { type, data } = dragged;
    handleDragEnd();

    if (type === 'prospecto') {
      if (col.key === 'prospectos') return; // ya está ahí
      createOrderFromProspect(data, col.statuses[0]);
      return;
    }
    // pedido
    if (col.key === 'prospectos') return; // no revertimos pedidos a prospecto (evita borrado accidental)
    if (col.statuses.includes(data.status)) return; // misma columna
    updateOrderStatus(data, col.statuses[0]);
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

  // ---- Filtros ----
  const term = search.trim().toLowerCase();
  const matchesSearch = (fields) =>
    !term || fields.filter(Boolean).some(f => String(f).toLowerCase().includes(term));

  const prospectos = useMemo(() => {
    if (typeFilter === 'pedido') return [];
    return (kanban.prospectos || []).filter(p => matchesSearch([p.title, p.phone, p.email]));
  }, [kanban.prospectos, typeFilter, term]);

  const ordersByCol = useMemo(() => {
    const map = {};
    KANBAN_COLS.forEach(col => {
      if (!col.statuses) return;
      map[col.key] = typeFilter === 'prospecto'
        ? []
        : orders.filter(o =>
            col.statuses.includes(o.status) &&
            matchesSearch([o.order_code, o.client_name, o.client_phone, o.product_title]));
    });
    return map;
  }, [orders, typeFilter, term]);

  const colSum = (list) => list.reduce((acc, o) => acc + Number(o.total_price || 0), 0);
  const hasFilters = term || typeFilter !== 'all';

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Pedidos / Producción</h2>
          <p>Seguimiento de prospectos, clientes y estado de cada trabajo.</p>
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
        <div className="table-header kanban-toolbar">
          <h3 style={{ textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>Cola de producción</h3>
          {viewMode === 'kanban' && (
            <div className="kanban-filters">
              <div className="kanban-search">
                <span aria-hidden>🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente, teléfono, orden…"
                />
              </div>
              <select className="kanban-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">Todos</option>
                <option value="prospecto">Solo prospectos</option>
                <option value="pedido">Solo pedidos</option>
              </select>
              {hasFilters && (
                <button type="button" className="kanban-clear" onClick={() => { setSearch(''); setTypeFilter('all'); }}>
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>

        {viewMode === 'kanban' ? (
          <div className="kanban-board">
            {KANBAN_COLS.map((col) => {
              const isProspects = col.key === 'prospectos';
              const cards = isProspects ? prospectos : (ordersByCol[col.key] || []);
              const canDrop = dragged && (
                (dragged.type === 'prospecto' && !isProspects) ||
                (dragged.type === 'pedido' && !isProspects && !col.statuses.includes(dragged.data.status))
              );
              return (
                <div
                  key={col.key}
                  className={`kanban-col ${dragOverCol === col.key && canDrop ? 'drag-over' : ''}`}
                  onDragOver={(e) => { if (canDrop) { e.preventDefault(); setDragOverCol(col.key); } }}
                  onDragLeave={() => setDragOverCol(prev => (prev === col.key ? null : prev))}
                  onDrop={(e) => { e.preventDefault(); handleDrop(col); }}
                >
                  <h4 style={{ borderColor: col.color }}>
                    <span className="kanban-dot" style={{ background: col.color }} />
                    {col.label} <span className="kanban-count">{cards.length}</span>
                  </h4>

                  {cards.length === 0 && (
                    <p className="kanban-empty">{canDrop ? 'Soltá acá' : 'Sin tarjetas'}</p>
                  )}

                  {isProspects
                    ? cards.map((p) => (
                        <div
                          key={`p-${p.id}`}
                          className={`kanban-card kanban-card--prospect ${dragged?.type === 'prospecto' && dragged.data.id === p.id ? 'dragging' : ''}`}
                          draggable
                          onDragStart={() => handleDragStart('prospecto', p)}
                          onDragEnd={handleDragEnd}
                          onClick={() => openLeadEdit(p)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="kanban-card-top">
                            <strong>{p.title || 'Sin nombre'}</strong>
                            <span className="kanban-tag kanban-tag--prospect">Prospecto</span>
                          </div>
                          {p.phone && <span>📱 {p.phone}</span>}
                          {p.email && <span className="kanban-email">✉️ {p.email}</span>}
                        </div>
                      ))
                    : cards.map((order) => (
                        <div
                          key={order.id}
                          className={`kanban-card ${dragged?.type === 'pedido' && dragged.data.id === order.id ? 'dragging' : ''}`}
                          draggable
                          onDragStart={() => handleDragStart('pedido', order)}
                          onDragEnd={handleDragEnd}
                          onClick={() => openEdit(order)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="kanban-card-top">
                            <strong>{order.order_code}</strong>
                            <span className={`kanban-tag ${statusClass(order.status)}`}>{order.quantity} u.</span>
                          </div>
                          <span>{order.client_name || 'Sin cliente'}</span>
                          {order.product_title && <span className="kanban-email">{order.product_title}</span>}
                          <div className="kanban-card-foot">
                            {order.delivery_date && <span>🗓 {order.delivery_date}</span>}
                            {Number(order.total_price) > 0 && <span className="kanban-price">${Number(order.total_price).toLocaleString('es-AR')}</span>}
                          </div>
                        </div>
                      ))}

                  {!isProspects && colSum(cards) > 0 && (
                    <div className="kanban-col-total">Total: ${colSum(cards).toLocaleString('es-AR')}</div>
                  )}
                </div>
              );
            })}
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
                      onChange={(e) => updateOrderStatus(order, e.target.value)}
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

      <Modal isOpen={leadModalOpen} onClose={() => setLeadModalOpen(false)} title="Editar prospecto">
        <div className="pedido-form-grid">
          <div className="pedido-form-group pedido-form-group--full">
            <label htmlFor="lead_full_name">Nombre y apellido *</label>
            <input id="lead_full_name" name="full_name" value={leadForm.full_name} onChange={handleLeadChange} />
          </div>
          <div className="pedido-form-group">
            <label htmlFor="lead_phone">WhatsApp</label>
            <input id="lead_phone" name="phone" value={leadForm.phone} onChange={handleLeadChange} />
          </div>
          <div className="pedido-form-group">
            <label htmlFor="lead_email">Email</label>
            <input id="lead_email" name="email" value={leadForm.email} onChange={handleLeadChange} />
          </div>
          <div className="pedido-form-group">
            <label htmlFor="lead_origin">Origen</label>
            <input id="lead_origin" name="origin" value={leadForm.origin} onChange={handleLeadChange} />
          </div>
          <div className="pedido-form-group">
            <label htmlFor="lead_status">Estado</label>
            <select id="lead_status" name="status" value={leadForm.status} onChange={handleLeadChange}>
              <option value="Prospecto">Prospecto</option>
              <option value="Cliente">Cliente</option>
              <option value="Descartado">Descartado</option>
            </select>
          </div>
        </div>
        <div className="pedido-modal-actions" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="btn-outline" onClick={convertProspectToOrder} disabled={saving}>Convertir en pedido →</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-outline" onClick={() => setLeadModalOpen(false)} disabled={saving}>Cancelar</button>
            <button type="button" className="btn-dark" onClick={handleLeadSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
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
