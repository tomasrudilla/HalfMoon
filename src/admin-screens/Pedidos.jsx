// src/admin-screens/Pedidos.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '../components/Modal.jsx';
import OrderPaymentsPanel from './OrderPaymentsPanel.jsx';
import ProductPickFields from '../components/ProductPickFields.jsx';
import './Pedidos.css';

const STATUS_OPTIONS = ['Pendiente', 'En Producción', 'Listo / Esperando', 'Listo', 'Entregado'];

const KANBAN_COLS = [
  { key: 'prospectos', label: 'Prospectos/Clientes', color: '#8b5cf6', statuses: null },
  { key: 'Pendiente', label: 'Pendiente', color: '#ef4444', statuses: ['Pendiente'] },
  { key: 'En Producción', label: 'En Producción', color: '#f59e0b', statuses: ['En Producción'] },
  { key: 'Listo', label: 'Listo / Esperando', color: '#10b981', statuses: ['Listo', 'Listo / Esperando'] },
  { key: 'Entregado', label: 'Entregado', color: '#3b82f6', statuses: ['Entregado'] },
];

// La producción avanza paso a paso: no se puede saltear etapas.
// Se permite retroceder un solo casillero para corregir un error de arrastre.
const FLOW = ['Pendiente', 'En Producción', 'Listo', 'Entregado'];

const flowIndex = (status) => {
  if (status === 'Listo / Esperando') return FLOW.indexOf('Listo');
  return FLOW.indexOf(status);
};

const isAdjacentStep = (fromStatus, toKey) => {
  const from = flowIndex(fromStatus);
  const to = FLOW.indexOf(toKey);
  if (from < 0 || to < 0) return false;
  return Math.abs(to - from) === 1;
};

/**
 * Estados a los que un pedido puede pasar desde donde está hoy: la etapa
 * actual (Listo y Listo / Esperando cuentan como la misma) o una contigua.
 */
const allowedNextStatuses = (status) => {
  const current = flowIndex(status);
  if (current < 0) return STATUS_OPTIONS;
  return STATUS_OPTIONS.filter((option) => {
    const target = flowIndex(option);
    return target >= 0 && Math.abs(target - current) <= 1;
  });
};

const isDeliveredToday = (order) => {
  if (order.status !== 'Entregado') return false;
  if (order.delivered_today != null) return !!order.delivered_today;
  if (!order.delivered_at) return false;
  const d = new Date(order.delivered_at);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const PAYMENT_MODES = [
  { id: 'negociable', label: 'A negociar' },
  { id: 'contado', label: 'Contado' },
  { id: 'seña_saldo', label: 'Seña + saldo' },
  { id: 'cuotas', label: 'Cuotas' },
];

const EMPTY_ORDER = {
  lead_id: '',
  design_id: '',
  quote_id: '',
  quantity: 1,
  total_price: '',
  status: 'Pendiente',
  delivery_date: '',
  payment_mode: 'negociable',
  deposit_amount: '',
  installments_count: '',
  payment_notes: '',
  description: '',
  product_type: '',
  color: '',
  product_source: 'canvas',
  catalog_item_id: null,
};

const EMPTY_LEAD = { full_name: '', phone: '', email: '', origin: '', status: 'Prospecto' };

const QUOTE_STATUS_OPTIONS = ['Pendiente', 'Contactado', 'Enviado', 'Aprobado', 'Cerrado'];

const statusClass = (status) => {
  if (status === 'Pendiente') return 'status-pendiente';
  if (status === 'En Producción') return 'status-produccion';
  if (status === 'Entregado') return 'status-entregado';
  return 'status-listo';
};

const paymentModeLabel = (mode) =>
  PAYMENT_MODES.find((m) => m.id === mode)?.label || mode || 'A negociar';

function buildOrderDescription({ quantity, product_type, color, notes, product_title }) {
  const parts = [];
  const qty = quantity || 1;
  const prenda = product_type || product_title || 'prendas';
  parts.push(`${qty} ${prenda}`);
  if (color) parts.push(color);
  let text = parts.join(' · ');
  if (notes) text += `. ${notes}`;
  return text;
}

export default function Pedidos() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    pendientes: 0,
    en_produccion: 0,
    listos: 0,
    entregados: 0,
    activos: 0,
    pipeline_total: 0,
    ingresos_entregados: 0,
    cobrado_total: 0,
    cobrado_activos: 0,
    saldo_activo: 0,
    presupuestos_abiertos: 0,
    senas_pendientes: 0,
    senas_cobradas: 0,
  });
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [form, setForm] = useState(EMPTY_ORDER);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const [kanban, setKanban] = useState({ prospectos: [], pedidos: [] });
  const [quotes, setQuotes] = useState([]);

  // Lead (prospecto) edit modal
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [leadForm, setLeadForm] = useState(EMPTY_LEAD);

  // Presupuesto (quote) modal
  const [quoteModal, setQuoteModal] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ status: 'Pendiente', admin_price: '', admin_notes: '', deposit_amount: '' });

  // Drag & drop + filtros
  const [dragged, setDragged] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [hideDelivered, setHideDelivered] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [flash, setFlash] = useState('');

  useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => setFlash(''), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/orders/stats').then(r => r.json()),
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/kanban').then(r => r.json()).catch(() => ({ prospectos: [], pedidos: [] })),
      fetch('/api/quotes').then(r => r.json()).catch(() => []),
    ])
      .then(([ordersData, statsData, leadsData, kanbanData, quotesData]) => {
        if (Array.isArray(ordersData)) setOrders(ordersData);
        if (statsData && !statsData.error) setStats(statsData);
        if (Array.isArray(leadsData)) setLeads(leadsData);
        if (kanbanData) setKanban(kanbanData);
        if (Array.isArray(quotesData)) setQuotes(quotesData);
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
      quote_id: order.quote_id || '',
      quantity: order.quantity || 1,
      total_price: order.total_price || '',
      status: order.status || 'Pendiente',
      delivery_date: order.delivery_date || '',
      payment_mode: order.payment_mode || 'negociable',
      deposit_amount: order.deposit_amount ?? '',
      installments_count: order.installments_count ?? '',
      payment_notes: order.payment_notes || '',
      description: order.description || '',
      product_type: order.product_type || '',
      color: order.color || '',
      product_source: order.product_source || (order.design_id ? 'web' : 'custom'),
      catalog_item_id: order.catalog_item_id || null,
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
    if (!form.description?.trim() && !form.product_type?.trim()) {
      alert('Elegí un producto (catálogo / personalizador) o cargá el detalle del pedido.');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      lead_id: Number(form.lead_id),
      design_id: form.design_id ? Number(form.design_id) : null,
      quote_id: form.quote_id ? Number(form.quote_id) : null,
      quantity: Number(form.quantity) || 1,
      total_price: Number(form.total_price) || 0,
      payment_mode: form.payment_mode || 'negociable',
      deposit_amount: form.deposit_amount === '' ? null : Number(form.deposit_amount),
      installments_count: form.installments_count === '' ? null : Number(form.installments_count),
      payment_notes: form.payment_notes || null,
      description: form.description || null,
      product_type: form.product_type || null,
      color: form.color || null,
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

  const deleteLead = async () => {
    if (!editingLead) return;
    if (!window.confirm(`¿Eliminar el prospecto ${editingLead.title || editingLead.full_name}? Se borran sus presupuestos y diseños.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${editingLead.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar');
      setLeadModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---- Presupuestos (quotes) ----
  const openQuote = (q) => {
    setQuoteModal(q);
    setQuoteForm({
      status: q.status || 'Pendiente',
      admin_price: q.admin_price ?? '',
      admin_notes: q.admin_notes || '',
      deposit_amount: q.deposit_amount ?? '',
      quantity: q.quantity || 1,
      notes: q.notes || '',
      description: q.description || '',
      product_type: q.product_type || q.product_title || '',
      color: q.color || '',
      product_source: q.product_source || (q.design_id ? 'web' : 'custom'),
      catalog_item_id: q.catalog_item_id || null,
    });
  };

  const saveQuote = async () => {
    if (!quoteModal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/quotes/${quoteModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quoteForm,
          admin_price: quoteForm.admin_price === '' ? null : Number(quoteForm.admin_price),
          deposit_amount: quoteForm.deposit_amount === '' ? null : Number(quoteForm.deposit_amount),
          quantity: Number(quoteForm.quantity) || 1,
        }),
      });
      if (!res.ok) throw new Error('No se pudo guardar el presupuesto');
      setQuoteModal(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmQuoteDeposit = async () => {
    if (!quoteModal) return;
    if (!quoteForm.deposit_amount || Number(quoteForm.deposit_amount) <= 0) {
      alert('Ingresá la seña que le pasaste al cliente.');
      return;
    }
    if (!quoteForm.admin_price || Number(quoteForm.admin_price) <= 0) {
      alert('Ingresá el precio total acordado.');
      return;
    }
    if (!window.confirm(`¿Confirmar seña de $${Number(quoteForm.deposit_amount).toLocaleString('es-AR')} y crear el pedido?`)) {
      return;
    }
    setSaving(true);
    try {
      await fetch(`/api/quotes/${quoteModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quoteForm,
          admin_price: Number(quoteForm.admin_price),
          deposit_amount: Number(quoteForm.deposit_amount),
          quantity: Number(quoteForm.quantity) || 1,
        }),
      });
      const res = await fetch(`/api/quotes/${quoteModal.id}/confirm-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deposit_amount: Number(quoteForm.deposit_amount),
          total_price: Number(quoteForm.admin_price),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo confirmar la seña');
      alert(`Pedido ${data.order?.order_code} creado.`);
      setQuoteModal(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  /** Manda (o remanda) el mail del presupuesto al cliente. */
  const notifyQuote = async (q) => {
    const target = q || quoteModal;
    if (!target) return;
    setSaving(true);
    try {
      // Guardar primero para que el mail lleve precio y seña actualizados
      await fetch(`/api/quotes/${target.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quoteForm,
          admin_price: quoteForm.admin_price === '' ? null : Number(quoteForm.admin_price),
          deposit_amount: quoteForm.deposit_amount === '' ? null : Number(quoteForm.deposit_amount),
          quantity: Number(quoteForm.quantity) || 1,
        }),
      });
      const res = await fetch(`/api/quotes/${target.id}/notify`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar el mail');
      if (data.sent) {
        setFlash(`Mail enviado a ${target.client_email || 'el cliente'}.`);
      } else {
        setFlash(
          data.reason === 'cliente-sin-email'
            ? 'El cliente no tiene email cargado.'
            : 'No se envió el mail: revisá la configuración SMTP.'
        );
      }
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteQuote = async (q) => {
    const target = q || quoteModal;
    if (!target) return;
    if (!window.confirm(`¿Eliminar el presupuesto de ${target.client_name}?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/quotes/${target.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar el presupuesto');
      setQuoteModal(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const convertQuoteToOrder = async (q, status) => {
    // Preferir flujo seña → pedido
    if (!q.deposit_amount || Number(q.deposit_amount) <= 0) {
      openQuote(q);
      alert('Definí la seña en el presupuesto y confirmala para crear el pedido.');
      return;
    }
    if (!q.admin_price || Number(q.admin_price) <= 0) {
      openQuote(q);
      alert('Definí el precio total antes de pasar a producción.');
      return;
    }
    try {
      const res = await fetch(`/api/quotes/${q.id}/confirm-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deposit_amount: Number(q.deposit_amount),
          total_price: Number(q.admin_price),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo crear el pedido');
      // Si lo arrastraron a otra columna, actualizar estado
      if (status && status !== 'Pendiente' && data.order?.id) {
        await fetch(`/api/orders/${data.order.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: data.order.lead_id,
            design_id: data.order.design_id,
            quote_id: data.order.quote_id,
            quantity: data.order.quantity,
            total_price: data.order.total_price,
            status,
            delivery_date: data.order.delivery_date,
            payment_mode: data.order.payment_mode,
            deposit_amount: data.order.deposit_amount,
            description: data.order.description,
            product_type: data.order.product_type,
            color: data.order.color,
          }),
        });
      }
      setQuoteModal(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteOrder = async (order) => {
    const target = order || editingOrder;
    if (!target) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${target.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar');
      setModalOpen(false);
      setOrderToDelete(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
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
          quote_id: order.quote_id,
          quantity: order.quantity,
          total_price: order.total_price,
          status: newStatus,
          delivery_date: order.delivery_date,
          payment_mode: order.payment_mode,
          deposit_amount: order.deposit_amount,
          installments_count: order.installments_count,
          payment_notes: order.payment_notes,
          description: order.description,
          product_type: order.product_type,
          color: order.color,
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

  /** Reglas de arrastre: todo entra por Pendiente y avanza de a un paso. */
  const canDropOn = (drag, col) => {
    if (!drag || col.key === 'prospectos') return false;
    if (drag.type === 'prospecto' || drag.type === 'quote') return col.key === 'Pendiente';
    if (col.statuses.includes(drag.data.status)) return false;
    return isAdjacentStep(drag.data.status, col.key);
  };

  const handleDrop = (col) => {
    if (!dragged) return;
    const { type, data } = dragged;
    handleDragEnd();

    if (!canDropOn({ type, data }, col)) {
      if (type === 'pedido' && col.key !== 'prospectos' && !col.statuses.includes(data.status)) {
        setFlash(`La producción avanza de a un paso: ${data.status} no puede saltar a ${col.label}.`);
      }
      return;
    }

    if (type === 'prospecto') {
      createOrderFromProspect(data, col.statuses[0]);
      return;
    }
    if (type === 'quote') {
      convertQuoteToOrder(data, col.statuses[0]);
      return;
    }
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

  const showType = (t) => typeFilter === 'all' || typeFilter === t;

  const prospectos = useMemo(() => {
    if (!showType('prospecto')) return [];
    return (kanban.prospectos || []).filter(p => matchesSearch([p.title, p.phone, p.email]));
  }, [kanban.prospectos, typeFilter, term]);

  const activeQuotes = useMemo(() => {
    if (!showType('quote')) return [];
    const linked = new Set(orders.map((o) => o.quote_id).filter(Boolean));
    return quotes.filter((q) =>
      !linked.has(q.id) &&
      !q.deposit_paid &&
      !q.order_id &&
      q.status !== 'Cerrado' &&
      q.status !== 'Aprobado' &&
      matchesSearch([q.client_name, q.client_phone, q.product_type, q.product_title, q.description]));
  }, [quotes, orders, typeFilter, term]);

  const ordersByCol = useMemo(() => {
    const map = {};
    KANBAN_COLS.forEach(col => {
      if (!col.statuses) return;
      map[col.key] = !showType('pedido')
        ? []
        : orders.filter(o =>
            col.statuses.includes(o.status) &&
            // La columna de entregados muestra sólo el día de hoy;
            // el resto vive en el historial.
            (col.key !== 'Entregado' || isDeliveredToday(o)) &&
            matchesSearch([o.order_code, o.client_name, o.client_phone, o.product_title, o.description, o.product_type, o.color]));
    });
    return map;
  }, [orders, typeFilter, term]);

  const deliveredHistory = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'Entregado')
        .sort((a, b) => new Date(b.delivered_at || b.created_at) - new Date(a.delivered_at || a.created_at)),
    [orders]
  );

  const visibleCols = KANBAN_COLS.filter(c => !(hideDelivered && c.key === 'Entregado'));

  const colSum = (list) => list.reduce((acc, o) => acc + Number(o.total_price || 0), 0);
  const hasFilters = term || typeFilter !== 'all' || hideDelivered;

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Pedidos / Producción</h2>
          <p>Pipeline activo, cobranzas y presupuestos pendientes de seña.</p>
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

      <div className="stats-grid pedidos-stats analytics-grid">
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
        <div className="stat-card" style={{ borderTop: '4px solid #6366f1' }}>
          <h3>${Number(stats.pipeline_total || 0).toLocaleString('es-AR')}</h3>
          <p className="stat-label">Pipeline activo ($)</p>
          <span className="stat-sub">{stats.activos || 0} pedidos abiertos</span>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #059669' }}>
          <h3>${Number(stats.cobrado_activos || 0).toLocaleString('es-AR')}</h3>
          <p className="stat-label">Cobrado en curso</p>
          <span className="stat-sub">Señas/pagos de pedidos activos</span>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #b45309' }}>
          <h3>${Number(stats.saldo_activo || 0).toLocaleString('es-AR')}</h3>
          <p className="stat-label">Saldo por cobrar</p>
          <span className="stat-sub">Activos − ya pagado</span>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #0ea5e9' }}>
          <h3>{stats.presupuestos_abiertos || 0}</h3>
          <p className="stat-label">Presupuestos abiertos</p>
          <span className="stat-sub">{stats.senas_pendientes || 0} con seña pendiente</span>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #3b82f6' }}>
          <h3>${Number(stats.ingresos_entregados || 0).toLocaleString('es-AR')}</h3>
          <p className="stat-label">Entregados (histórico)</p>
          <span className="stat-sub">{stats.entregados || 0} pedidos · cobrado total ${Number(stats.cobrado_total || 0).toLocaleString('es-AR')}</span>
        </div>
      </div>

      {flash && <div className="kanban-flash">{flash}</div>}

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
                <option value="prospecto">Solo prospectos/clientes</option>
                <option value="quote">Solo presupuestos</option>
                <option value="pedido">Solo pedidos</option>
              </select>
              <label className="kanban-toggle">
                <input type="checkbox" checked={hideDelivered} onChange={(e) => setHideDelivered(e.target.checked)} />
                Ocultar entregados
              </label>
              {hasFilters && (
                <button type="button" className="kanban-clear" onClick={() => { setSearch(''); setTypeFilter('all'); setHideDelivered(false); }}>
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>

        {viewMode === 'kanban' ? (
          <div className="kanban-board">
            {visibleCols.map((col) => {
              const isProspects = col.key === 'prospectos';
              const isPending = col.key === 'Pendiente';
              const orderCards = isProspects ? [] : (ordersByCol[col.key] || []);
              const quoteCards = isPending ? activeQuotes : [];
              const cards = isProspects ? prospectos : orderCards;
              const cardCount = cards.length + quoteCards.length;
              const canDrop = canDropOn(dragged, col);
              const isBlocked = !!dragged && !canDrop && !isProspects
                && !col.statuses?.includes(dragged.data?.status);
              return (
                <div
                  key={col.key}
                  className={`kanban-col ${dragOverCol === col.key && canDrop ? 'drag-over' : ''} ${isBlocked ? 'drag-blocked' : ''}`}
                  onDragOver={(e) => { if (canDrop) { e.preventDefault(); setDragOverCol(col.key); } }}
                  onDragLeave={() => setDragOverCol(prev => (prev === col.key ? null : prev))}
                  onDrop={(e) => { e.preventDefault(); handleDrop(col); }}
                >
                  <h4 style={{ borderColor: col.color }}>
                    <span className="kanban-dot" style={{ background: col.color }} />
                    {col.label} <span className="kanban-count">{cardCount}</span>
                  </h4>

                  {col.key === 'Entregado' && (
                    <div className="kanban-col-note">
                      <span>Solo entregas de hoy</span>
                      <button type="button" className="kanban-history-btn" onClick={() => setHistoryOpen(true)}>
                        Ver historial ({deliveredHistory.length})
                      </button>
                    </div>
                  )}

                  {cardCount === 0 && (
                    <p className="kanban-empty">
                      {canDrop
                        ? 'Soltá acá'
                        : isBlocked
                          ? 'Paso no permitido'
                          : col.key === 'Entregado'
                            ? 'Nada entregado hoy'
                            : 'Sin tarjetas'}
                    </p>
                  )}

                  {quoteCards.map((q) => (
                    <div
                      key={`q-${q.id}`}
                      className={`kanban-card kanban-card--quote ${dragged?.type === 'quote' && dragged.data.id === q.id ? 'dragging' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart('quote', q)}
                      onDragEnd={handleDragEnd}
                      onClick={() => openQuote(q)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="kanban-card-top">
                        <strong>{q.client_name || 'Sin nombre'}</strong>
                        <span className="kanban-tag kanban-tag--quote">Presupuesto</span>
                      </div>
                      <span>{q.description || q.product_type || q.product_title || 'Prenda'} · {q.quantity} u.</span>
                      {q.client_phone && <span>📱 {q.client_phone}</span>}
                      <div className="kanban-card-foot">
                        <span className="kanban-email">
                          {q.deposit_amount != null
                            ? `Seña $${Number(q.deposit_amount).toLocaleString('es-AR')}`
                            : q.status}
                        </span>
                        {Number(q.admin_price) > 0 && <span className="kanban-price">${Number(q.admin_price).toLocaleString('es-AR')}</span>}
                      </div>
                    </div>
                  ))}

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
                            <span className={`kanban-tag ${p.status === 'Cliente' ? 'kanban-tag--cliente' : 'kanban-tag--prospect'}`}>
                              {p.status === 'Cliente' ? 'Cliente' : 'Prospecto'}
                            </span>
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
                          {(order.description || order.product_type || order.product_title) && (
                            <span className="kanban-email">
                              {order.description ||
                                [order.product_type || order.product_title, order.color].filter(Boolean).join(' · ')}
                            </span>
                          )}
                          {order.quote_status && (
                            <span className="kanban-tag kanban-tag--quote-status">
                              Presup. {order.quote_status}
                            </span>
                          )}
                          <div className="kanban-card-foot">
                            {order.delivery_date && <span>🗓 {order.delivery_date}</span>}
                            {Number(order.total_price) > 0 && (
                              <span className="kanban-price">
                                ${Number(order.paid_total || 0).toLocaleString('es-AR')}
                                {' / '}
                                ${Number(order.total_price).toLocaleString('es-AR')}
                              </span>
                            )}
                          </div>
                          {Number(order.total_price) > 0 && (
                            <div className="kanban-pay-bar" title={paymentModeLabel(order.payment_mode)}>
                              <div
                                className="kanban-pay-bar-fill"
                                style={{
                                  width: `${Math.min(100, (Number(order.paid_total || 0) / Number(order.total_price)) * 100)}%`,
                                }}
                              />
                            </div>
                          )}
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
                <th style={{ textAlign: 'center' }}>PAGO</th>
                <th style={{ textAlign: 'center' }}>ENTREGA</th>
                <th style={{ textAlign: 'center' }}>ESTADO</th>
                <th style={{ textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 'bold' }}>
                    {order.order_code}
                    {order.quote_status && (
                      <div style={{ fontSize: 11, color: '#0369a1', marginTop: 2 }}>Presup. {order.quote_status}</div>
                    )}
                  </td>
                  <td>
                    <strong>{order.client_name || '—'}</strong>
                    <br />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {order.description || order.product_type || order.product_title || 'Sin detalle'}
                      {order.color && !order.description ? ` · ${order.color}` : ''}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{order.quantity} u.</td>
                  <td style={{ textAlign: 'center', fontSize: 12 }}>
                    ${Number(order.paid_total || 0).toLocaleString('es-AR')}
                    <span style={{ color: '#94a3b8' }}> / ${Number(order.total_price || 0).toLocaleString('es-AR')}</span>
                    <div style={{ color: '#64748b' }}>{paymentModeLabel(order.payment_mode)}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{order.delivery_date || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <select
                      className="pedido-status-select"
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order, e.target.value)}
                      title="La producción avanza de a un paso"
                    >
                      {allowedNextStatuses(order.status).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {order.status === 'Entregado' && order.delivered_at && (
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                        {new Date(order.delivered_at).toLocaleDateString('es-AR')}
                      </div>
                    )}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingOrder ? '' : 'Nuevo pedido'}>
        {editingOrder && (
          <header className="order-modal-head">
            <div className="order-modal-head-top">
              <div>
                <span className="order-modal-eyebrow">Pedido</span>
                <h3>{editingOrder.order_code}</h3>
                <p>
                  {editingOrder.client_name || 'Sin cliente'}
                  {editingOrder.client_phone ? ` · ${editingOrder.client_phone}` : ''}
                </p>
              </div>
              <span className={`order-modal-status ${statusClass(editingOrder.status)}`}>
                {editingOrder.status}
              </span>
            </div>

            <ol className="order-modal-steps">
              {FLOW.map((step, i) => {
                const current = flowIndex(editingOrder.status);
                return (
                  <li
                    key={step}
                    className={i < current ? 'is-done' : i === current ? 'is-current' : ''}
                  >
                    <span className="order-modal-step-dot">{i < current ? '✓' : i + 1}</span>
                    {step}
                  </li>
                );
              })}
            </ol>

            <div className="order-modal-metrics">
              <div>
                <span>Total</span>
                <strong>${Number(editingOrder.total_price || 0).toLocaleString('es-AR')}</strong>
              </div>
              <div>
                <span>Cobrado</span>
                <strong className="is-paid">${Number(editingOrder.paid_total || 0).toLocaleString('es-AR')}</strong>
              </div>
              <div>
                <span>Saldo</span>
                <strong className="is-due">
                  ${Math.max(Number(editingOrder.total_price || 0) - Number(editingOrder.paid_total || 0), 0).toLocaleString('es-AR')}
                </strong>
              </div>
              <div>
                <span>Forma de pago</span>
                <strong className="is-mode">{paymentModeLabel(editingOrder.payment_mode)}</strong>
              </div>
            </div>

            {Number(editingOrder.total_price) > 0 && (
              <div className="order-modal-bar">
                <div
                  className="order-modal-bar-fill"
                  style={{
                    width: `${Math.min(100, (Number(editingOrder.paid_total || 0) / Number(editingOrder.total_price)) * 100)}%`,
                  }}
                />
              </div>
            )}

            {editingOrder.delivered_at && (
              <p className="order-modal-delivered">
                Entregado el {new Date(editingOrder.delivered_at).toLocaleString('es-AR')}
              </p>
            )}
          </header>
        )}

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
          {editingOrder?.quote_status && (
            <div className="pedido-form-group pedido-form-group--full">
              <label>Estado del presupuesto vinculado</label>
              <div className="pedido-quote-badge">
                <span className="kanban-tag kanban-tag--quote-status">{editingOrder.quote_status}</span>
                {editingOrder.quote_id && (
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => {
                      const q = quotes.find((x) => x.id === editingOrder.quote_id);
                      if (q) { setModalOpen(false); openQuote(q); }
                    }}
                  >
                    Ver presupuesto
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="pedido-form-group">
            <label htmlFor="quantity">Cantidad</label>
            <input id="quantity" name="quantity" type="number" min="1" value={form.quantity} onChange={handleFormChange} />
          </div>
          <div className="pedido-form-group">
            <label htmlFor="total_price">Total acordado ($)</label>
            <input id="total_price" name="total_price" type="number" min="0" step="0.01" value={form.total_price} onChange={handleFormChange} />
          </div>
          <div className="pedido-form-group pedido-form-group--full">
            <ProductPickFields
              value={form}
              onChange={(next) => setForm((p) => ({ ...p, ...next }))}
            />
          </div>
          <div className="pedido-form-group">
            <label htmlFor="status">Estado producción</label>
            <select id="status" name="status" value={form.status} onChange={handleFormChange}>
              {(editingOrder ? allowedNextStatuses(editingOrder.status) : STATUS_OPTIONS).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {editingOrder && (
              <span className="pedido-form-hint">La producción avanza de a un paso por vez.</span>
            )}
          </div>
          <div className="pedido-form-group">
            <label htmlFor="delivery_date">Fecha entrega</label>
            <input id="delivery_date" name="delivery_date" value={form.delivery_date} onChange={handleFormChange} placeholder="Ej: Viernes 12" />
          </div>
          <div className="pedido-form-group">
            <label htmlFor="payment_mode">Forma de pago</label>
            <select id="payment_mode" name="payment_mode" value={form.payment_mode} onChange={handleFormChange}>
              {PAYMENT_MODES.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="pedido-form-group">
            <label htmlFor="deposit_amount">Seña acordada ($)</label>
            <input
              id="deposit_amount"
              name="deposit_amount"
              type="number"
              min="0"
              step="0.01"
              value={form.deposit_amount}
              onChange={handleFormChange}
              placeholder="Opcional"
            />
          </div>
          {(form.payment_mode === 'cuotas' || form.installments_count) && (
            <div className="pedido-form-group">
              <label htmlFor="installments_count">Cuotas acordadas</label>
              <input
                id="installments_count"
                name="installments_count"
                type="number"
                min="1"
                value={form.installments_count}
                onChange={handleFormChange}
                placeholder="Ej: 3"
              />
            </div>
          )}
          <div className="pedido-form-group pedido-form-group--full">
            <label htmlFor="payment_notes">Notas de negociación / pago</label>
            <input
              id="payment_notes"
              name="payment_notes"
              value={form.payment_notes}
              onChange={handleFormChange}
              placeholder="Ej: 50% seña, resto contra entrega"
            />
          </div>
        </div>

        {editingOrder && (
          <div className="pedido-payments-block">
            <h4>Pagos registrados</h4>
            <OrderPaymentsPanel
              orderId={editingOrder.id}
              totalPrice={form.total_price || editingOrder.total_price}
              onTotalsChange={() => {}}
            />
          </div>
        )}

        <div className="pedido-modal-actions" style={{ justifyContent: editingOrder ? 'space-between' : 'flex-end' }}>
          {editingOrder && (
            <button
              type="button"
              className="btn-delete"
              onClick={() => { if (window.confirm(`¿Eliminar el pedido ${editingOrder.order_code}?`)) deleteOrder(editingOrder); }}
              disabled={saving}
            >
              Eliminar
            </button>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button>
            <button type="button" className="btn-dark" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
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
        <div className="pedido-modal-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-outline" onClick={convertProspectToOrder} disabled={saving}>Convertir en pedido →</button>
            <button type="button" className="btn-delete" onClick={deleteLead} disabled={saving}>Eliminar</button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-outline" onClick={() => setLeadModalOpen(false)} disabled={saving}>Cancelar</button>
            <button type="button" className="btn-dark" onClick={handleLeadSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!quoteModal} onClose={() => setQuoteModal(null)} title={`Presupuesto — ${quoteModal?.client_name || ''}`}>
        {quoteModal && (
          <>
            <div className="quote-summary">
              <p><strong>Notas del cliente:</strong> {quoteModal.notes || '—'}</p>
              {(quoteModal.design_id || quoteModal.product_source === 'web') && (
                <p><strong>Origen:</strong> Personalizador web</p>
              )}
            </div>
            <ProductPickFields
              locked={!!(quoteModal.design_id || quoteModal.product_source === 'web')}
              lockedHint="Producto del personalizador. Completá detalle si hace falta."
              value={quoteForm}
              onChange={setQuoteForm}
            />
            <div className="pedido-form-grid">
              <div className="pedido-form-group">
                <label htmlFor="q_qty">Cantidad</label>
                <input id="q_qty" type="number" min="1" value={quoteForm.quantity} onChange={(e) => setQuoteForm(p => ({ ...p, quantity: e.target.value }))} />
              </div>
              <div className="pedido-form-group">
                <label htmlFor="q_status">Estado</label>
                <select id="q_status" value={quoteForm.status} onChange={(e) => setQuoteForm(p => ({ ...p, status: e.target.value }))}>
                  {QUOTE_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="pedido-form-group">
                <label htmlFor="q_price">Precio total ($)</label>
                <input id="q_price" type="number" min="0" value={quoteForm.admin_price} onChange={(e) => setQuoteForm(p => ({ ...p, admin_price: e.target.value }))} placeholder="Ej: 45000" />
              </div>
              <div className="pedido-form-group">
                <label htmlFor="q_deposit">Seña a pasar ($)</label>
                <input id="q_deposit" type="number" min="0" value={quoteForm.deposit_amount} onChange={(e) => setQuoteForm(p => ({ ...p, deposit_amount: e.target.value }))} placeholder="Ej: 15000" />
              </div>
              <div className="pedido-form-group pedido-form-group--full">
                <label htmlFor="q_notes">Notas internas</label>
                <input id="q_notes" value={quoteForm.admin_notes} onChange={(e) => setQuoteForm(p => ({ ...p, admin_notes: e.target.value }))} />
              </div>
            </div>
            <div className="pedido-modal-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="btn-dark" onClick={confirmQuoteDeposit} disabled={saving}>
                  {quoteModal.deposit_paid && !quoteModal.order_id
                    ? 'Generar pedido faltante →'
                    : 'Confirmar seña pagada → Pedido'}
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => notifyQuote()}
                  disabled={saving || !quoteModal.client_email}
                  title={quoteModal.client_email
                    ? `Enviar el presupuesto a ${quoteModal.client_email}`
                    : 'El cliente no tiene email cargado'}
                >
                  ✉ Enviar por mail
                </button>
                <button type="button" className="btn-delete" onClick={() => deleteQuote()} disabled={saving}>Eliminar</button>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn-outline" onClick={() => setQuoteModal(null)} disabled={saving}>Cerrar</button>
                <button type="button" className="btn-dark" onClick={saveQuote} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title="Historial de entregados">
        {deliveredHistory.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
            Todavía no hay pedidos entregados.
          </p>
        ) : (
          <div className="delivered-history">
            <p className="delivered-history-sub">
              {deliveredHistory.length} pedidos entregados · ${deliveredHistory
                .reduce((acc, o) => acc + Number(o.total_price || 0), 0)
                .toLocaleString('es-AR')} facturados
            </p>
            <ul className="delivered-history-list">
              {deliveredHistory.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    className="delivered-history-item"
                    onClick={() => { setHistoryOpen(false); openEdit(o); }}
                  >
                    <span className="delivered-history-code">{o.order_code}</span>
                    <span className="delivered-history-main">
                      <strong>{o.client_name || 'Sin cliente'}</strong>
                      <small>{o.description || o.product_type || o.product_title || 'Sin detalle'}</small>
                    </span>
                    <span className="delivered-history-meta">
                      <strong>${Number(o.total_price || 0).toLocaleString('es-AR')}</strong>
                      <small>
                        {o.delivered_at
                          ? new Date(o.delivered_at).toLocaleDateString('es-AR')
                          : 'Sin fecha'}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
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
