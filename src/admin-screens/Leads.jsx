// src/admin-screens/Leads.jsx
import { useState, useEffect, useMemo } from 'react';
import Modal from '../components/Modal.jsx';
import ProductPickFields from '../components/ProductPickFields.jsx';
import './Leads.css';

const EMPTY_FORM = { full_name: '', phone: '', email: '', origin: '', status: 'Prospecto' };
const STATUS_OPTIONS = ['Prospecto', 'Cliente', 'Contactado', 'Cerrado'];
const money = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `$${n.toLocaleString('es-AR')}` : '';
};

const initials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('');

const EMPTY_QUOTE = {
  product_source: 'canvas',
  product_type: '',
  color: '',
  catalog_item_id: null,
  description: '',
  quantity: 1,
  notes: '',
  deposit_amount: '',
  admin_price: '',
};


export default function Leads() {
  const [leadsList, setLeadsList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState('');

  // Nuevo contacto
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newForm, setNewForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  // Presupuesto desde un lead
  const [quoteLead, setQuoteLead] = useState(null);
  const [quoteForm, setQuoteForm] = useState(EMPTY_QUOTE);
  const [quoteSaving, setQuoteSaving] = useState(false);
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [emailReady, setEmailReady] = useState(false);
  const [quoteFeedback, setQuoteFeedback] = useState(null);

  useEffect(() => {
    fetch('/api/email/status')
      .then((r) => r.json())
      .then((d) => setEmailReady(!!d.configured))
      .catch(() => setEmailReady(false));
  }, []);

  const loadLeads = () => {
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setLeadsList(data); })
      .catch(err => console.error(err));
  };

  useEffect(() => { loadLeads(); }, []);

  const startEdit = (lead) => {
    setEditingId(lead.id);
    setEditForm({
      full_name: lead.full_name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      origin: lead.origin || '',
      status: lead.status || 'Prospecto',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  };

  const handleFieldChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = async (id) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar');

      setLeadsList(prev => prev.map(l => (l.id === id ? data : l)));
      cancelEdit();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const createLead = async () => {
    if (!newForm.full_name.trim()) { alert('El nombre es obligatorio.'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newForm.full_name,
          telefono: newForm.phone,
          email: newForm.email,
          origin: newForm.origin || 'Manual',
          status: newForm.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear el contacto');
      setNewModalOpen(false);
      setNewForm(EMPTY_FORM);
      loadLeads();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteLead = async (lead) => {
    if (!window.confirm(`¿Eliminar a ${lead.full_name}? Se borran sus presupuestos y diseños.`)) return;
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar');
      loadLeads();
    } catch (err) {
      alert(err.message);
    }
  };

  const openQuote = (lead) => {
    setQuoteLead(lead);
    setQuoteForm(EMPTY_QUOTE);
    setQuoteFeedback(null);
    setNotifyByEmail(!!lead.email);
  };

  const closeQuote = () => {
    setQuoteLead(null);
    setQuoteFeedback(null);
  };

  const createQuote = async () => {
    if (!quoteLead) return;
    if (!quoteForm.product_type?.trim() && !quoteForm.description?.trim()) {
      setQuoteFeedback({ type: 'error', text: 'Elegí un producto o cargá el detalle del trabajo.' });
      return;
    }
    setQuoteSaving(true);
    setQuoteFeedback(null);
    try {
      const wantsEmail = notifyByEmail && !!quoteLead.email && emailReady;
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: quoteLead.id,
          quantity: Number(quoteForm.quantity) || 1,
          product_type: quoteForm.product_type,
          color: quoteForm.color,
          notes: quoteForm.notes,
          description: quoteForm.description,
          product_source: quoteForm.product_source || 'custom',
          catalog_item_id: quoteForm.catalog_item_id || null,
          deposit_amount: quoteForm.deposit_amount === '' ? null : Number(quoteForm.deposit_amount),
          admin_price: quoteForm.admin_price === '' ? null : Number(quoteForm.admin_price),
          notify_email: wantsEmail,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo crear el presupuesto');

      const mailNote = !wantsEmail
        ? 'Sin aviso por mail.'
        : data.email?.sent
          ? `Mail enviado a ${quoteLead.email}.`
          : 'El presupuesto se guardó, pero el mail no salió (revisá el SMTP).';

      closeQuote();
      loadLeads();
      alert(`Presupuesto creado. ${mailNote}\nAl confirmar la seña en Presupuestos se genera el pedido.`);
    } catch (err) {
      setQuoteFeedback({ type: 'error', text: err.message });
    } finally {
      setQuoteSaving(false);
    }
  };

  const downloadClients = () => {
    const headers = ['ID', 'CONTACTO', 'TELEFONO', 'EMAIL', 'ESTADO', 'ORIGEN', 'FECHA_INGRESO'];
    const rows = leadsList.map(lead => [
      lead.id,
      lead.full_name,
      lead.phone,
      lead.email || '',
      lead.status || '',
      lead.origin || '',
      new Date(lead.created_at).toLocaleString('es-AR'),
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientes_halfmoon_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const canEmail = !!quoteLead?.email && emailReady;
  const balance = Math.max(
    (Number(quoteForm.admin_price) || 0) - (Number(quoteForm.deposit_amount) || 0),
    0
  );

  const term = search.trim().toLowerCase();
  const filtered = useMemo(() => (
    !term
      ? leadsList
      : leadsList.filter(l =>
          [l.full_name, l.phone, l.email, l.origin, l.status]
            .filter(Boolean)
            .some(f => String(f).toLowerCase().includes(term)))
  ), [leadsList, term]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Leads &amp; Prospectos</h2>
          <p>Directorio de contactos y clientes — consulta, presupuesto y producción.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-outline" onClick={downloadClients} disabled={!leadsList.length}>
            ↓ Descargar clientes
          </button>
          <button type="button" className="btn-dark" onClick={() => { setNewForm(EMPTY_FORM); setNewModalOpen(true); }}>
            + Nuevo contacto
          </button>
        </div>
      </div>

      <div className="table-container leads-table-wrap">
        <div className="table-header">
          <h3 style={{ textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>Directorio Completo</h3>
          <div className="leads-toolbar">
            <div className="leads-search">
              <span aria-hidden>🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar nombre, teléfono, email…"
              />
            </div>
            <span className="leads-count">{filtered.length} de {leadsList.length}</span>
          </div>
        </div>

        {leadsList.length === 0 ? (
          <p className="leads-empty">No hay contactos registrados todavía. Creá uno con “Nuevo contacto”.</p>
        ) : filtered.length === 0 ? (
          <p className="leads-empty">Ningún contacto coincide con “{search}”.</p>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th>CONTACTO</th>
                <th style={{ textAlign: 'center' }}>TELÉFONO</th>
                <th style={{ textAlign: 'center' }}>EMAIL</th>
                <th style={{ textAlign: 'center' }}>ESTADO</th>
                <th style={{ textAlign: 'center' }}>ORIGEN</th>
                <th style={{ textAlign: 'center' }}>FECHA INGRESO</th>
                <th style={{ textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const isEditing = editingId === lead.id;
                return (
                  <tr key={lead.id} className={isEditing ? 'leads-row-editing' : ''}>
                    <td>
                      {isEditing ? (
                        <input
                          className="leads-input"
                          value={editForm.full_name}
                          onChange={(e) => handleFieldChange('full_name', e.target.value)}
                        />
                      ) : (
                        <strong>{lead.full_name}</strong>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isEditing ? (
                        <input
                          className="leads-input"
                          value={editForm.phone}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                        />
                      ) : (
                        <span className="leads-muted">{lead.phone}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isEditing ? (
                        <input
                          className="leads-input"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                        />
                      ) : (
                        <span className="leads-muted">{lead.email || '—'}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isEditing ? (
                        <select className="leads-input" value={editForm.status}
                          onChange={(e) => handleFieldChange('status', e.target.value)}>
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className={`status-pill ${lead.status === 'Cliente' ? 'status-contactado' : 'status-nuevo'}`}>
                          {lead.status || 'Prospecto'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isEditing ? (
                        <input
                          className="leads-input"
                          value={editForm.origin}
                          onChange={(e) => handleFieldChange('origin', e.target.value)}
                        />
                      ) : (
                        lead.origin
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {new Date(lead.created_at).toLocaleString('es-AR')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isEditing ? (
                        <div className="leads-row-actions">
                          <button
                            type="button"
                            className="leads-btn-save"
                            onClick={() => saveEdit(lead.id)}
                            disabled={savingId === lead.id}
                          >
                            {savingId === lead.id ? '…' : 'Guardar'}
                          </button>
                          <button type="button" className="leads-btn-cancel" onClick={cancelEdit}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="leads-row-actions">
                          <button type="button" className="leads-btn-quote" onClick={() => openQuote(lead)}>
                            Presupuesto
                          </button>
                          <button type="button" className="leads-btn-edit" onClick={() => startEdit(lead)}>
                            Editar
                          </button>
                          <button type="button" className="leads-btn-del" onClick={() => deleteLead(lead)} title="Eliminar contacto">
                            ✕
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={newModalOpen} onClose={() => setNewModalOpen(false)} title="Nuevo contacto">
        <div className="leads-form">
          <div className="leads-form-group leads-form-group--full">
            <label>Nombre y apellido *</label>
            <input className="leads-input" value={newForm.full_name}
              onChange={(e) => setNewForm(p => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div className="leads-form-group">
            <label>WhatsApp / Teléfono</label>
            <input className="leads-input" value={newForm.phone}
              onChange={(e) => setNewForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="leads-form-group">
            <label>Email</label>
            <input className="leads-input" type="email" value={newForm.email}
              onChange={(e) => setNewForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="leads-form-group">
            <label>Estado</label>
            <select className="leads-input" value={newForm.status}
              onChange={(e) => setNewForm(p => ({ ...p, status: e.target.value }))}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="leads-form-group">
            <label>Origen</label>
            <input className="leads-input" value={newForm.origin} placeholder="Ej: Instagram, Referido…"
              onChange={(e) => setNewForm(p => ({ ...p, origin: e.target.value }))} />
          </div>
        </div>
        <div className="leads-modal-actions">
          <button type="button" className="btn-outline" onClick={() => setNewModalOpen(false)} disabled={creating}>Cancelar</button>
          <button type="button" className="btn-dark" onClick={createLead} disabled={creating}>
            {creating ? 'Creando…' : 'Crear contacto'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!quoteLead} onClose={closeQuote} title="">
        {quoteLead && (
          <div className="quote-modal">
            <header className="quote-modal-head">
              <span className="quote-modal-avatar">{initials(quoteLead.full_name)}</span>
              <div className="quote-modal-head-text">
                <span className="quote-modal-eyebrow">Nuevo presupuesto</span>
                <h3>{quoteLead.full_name}</h3>
                <p>
                  {quoteLead.phone || 'Sin teléfono'}
                  {quoteLead.email ? ` · ${quoteLead.email}` : ' · Sin email'}
                </p>
              </div>
            </header>

            <section className="quote-modal-block">
              <h4 className="quote-modal-block-title">Qué se cotiza</h4>
              <div className="leads-form">
                <ProductPickFields value={quoteForm} onChange={setQuoteForm} />
                <div className="leads-form-group leads-form-group--full">
                  <label>Notas</label>
                  <input className="leads-input" value={quoteForm.notes} placeholder="Talles, fechas, detalles…"
                    onChange={(e) => setQuoteForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
            </section>

            <section className="quote-modal-block">
              <h4 className="quote-modal-block-title">Números</h4>
              <div className="quote-modal-numbers">
                <div className="leads-form-group">
                  <label>Cantidad</label>
                  <input className="leads-input" type="number" min="1" value={quoteForm.quantity}
                    onChange={(e) => setQuoteForm(p => ({ ...p, quantity: e.target.value }))} />
                </div>
                <div className="leads-form-group">
                  <label>Precio total ($)</label>
                  <input className="leads-input" type="number" min="0" value={quoteForm.admin_price}
                    onChange={(e) => setQuoteForm(p => ({ ...p, admin_price: e.target.value }))} placeholder="Opcional ahora" />
                </div>
                <div className="leads-form-group">
                  <label>Seña ($)</label>
                  <input className="leads-input" type="number" min="0" value={quoteForm.deposit_amount}
                    onChange={(e) => setQuoteForm(p => ({ ...p, deposit_amount: e.target.value }))} placeholder="Opcional ahora" />
                </div>
              </div>

              <div className="quote-modal-summary">
                <div>
                  <span>Total</span>
                  <strong>{money(quoteForm.admin_price) || '—'}</strong>
                </div>
                <div>
                  <span>Seña</span>
                  <strong className="is-deposit">{money(quoteForm.deposit_amount) || '—'}</strong>
                </div>
                <div>
                  <span>Saldo</span>
                  <strong>{money(balance) || '—'}</strong>
                </div>
              </div>
            </section>

            <label className={`quote-modal-notify ${!canEmail ? 'is-disabled' : ''}`}>
              <input
                type="checkbox"
                checked={notifyByEmail && canEmail}
                disabled={!canEmail}
                onChange={(e) => setNotifyByEmail(e.target.checked)}
              />
              <span>
                <strong>Avisarle por mail al cliente</strong>
                <small>
                  {!quoteLead.email
                    ? 'Este contacto no tiene email cargado.'
                    : !emailReady
                      ? 'El servidor todavía no tiene SMTP configurado.'
                      : `Se le manda el detalle a ${quoteLead.email}${
                          Number(quoteForm.deposit_amount) > 0
                            ? ` avisando que queda pendiente una seña de ${money(quoteForm.deposit_amount)}`
                            : ''
                        }.`}
                </small>
              </span>
            </label>

            {quoteFeedback && (
              <p className={`quote-modal-feedback quote-modal-feedback--${quoteFeedback.type}`}>
                {quoteFeedback.text}
              </p>
            )}

            <div className="leads-modal-actions">
              <button type="button" className="btn-outline" onClick={closeQuote} disabled={quoteSaving}>Cancelar</button>
              <button type="button" className="btn-dark" onClick={createQuote} disabled={quoteSaving}>
                {quoteSaving ? 'Creando…' : 'Generar presupuesto'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
