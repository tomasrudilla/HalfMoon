import { useState, useEffect } from 'react';
import Modal from '../components/Modal.jsx';
import ProductPickFields from '../components/ProductPickFields.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { buildWhatsAppUrl } from '../utils/whatsapp.js';
import './Presupuestos.css';

const STATUS_OPTIONS = ['Pendiente', 'Contactado', 'Enviado', 'Aprobado', 'Cerrado'];

export default function Presupuestos() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const { settings } = useSettings();

  const load = () => {
    setLoading(true);
    fetch('/api/quotes')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setQuotes(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openDetail = (q) => {
    setSelected(q);
    setEditForm({
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

  const fromWeb = !!(selected?.design_id || selected?.product_source === 'web');

  const saveQuote = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/quotes/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          admin_price: editForm.admin_price === '' ? null : Number(editForm.admin_price),
          deposit_amount: editForm.deposit_amount === '' ? null : Number(editForm.deposit_amount),
          quantity: Number(editForm.quantity) || 1,
        }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setSelected(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeposit = async () => {
    if (!selected) return;
    if (!editForm.deposit_amount || Number(editForm.deposit_amount) <= 0) {
      alert('Ingresá el monto de seña que le pasaste al cliente.');
      return;
    }
    if (!editForm.admin_price || Number(editForm.admin_price) <= 0) {
      alert('Ingresá el precio total acordado antes de confirmar la seña.');
      return;
    }
    if (!window.confirm(
      `¿Confirmar seña de $${Number(editForm.deposit_amount).toLocaleString('es-AR')} pagada?\nSe crea el pedido de producción automáticamente.`
    )) return;

    setSaving(true);
    try {
      // Guardar precio/seña primero
      await fetch(`/api/quotes/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          admin_price: Number(editForm.admin_price),
          deposit_amount: Number(editForm.deposit_amount),
          quantity: Number(editForm.quantity) || 1,
        }),
      });

      const res = await fetch(`/api/quotes/${selected.id}/confirm-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deposit_amount: Number(editForm.deposit_amount),
          total_price: Number(editForm.admin_price),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo confirmar la seña');
      alert(`Seña confirmada. Pedido ${data.order?.order_code} creado en producción.`);
      setSelected(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const contactWpp = (q) => {
    const price = editForm.admin_price || q.admin_price;
    const deposit = editForm.deposit_amount || q.deposit_amount;
    const prenda = editForm.product_type || q.product_type || q.product_title || 'prendas';
    let msg = `Hola ${q.client_name}! Sobre tu presupuesto de ${q.quantity || 1} ${prenda}`;
    if (price) msg += `: total $${Number(price).toLocaleString('es-AR')}`;
    if (deposit) msg += `. Seña: $${Number(deposit).toLocaleString('es-AR')}`;
    msg += '. ¿Seguimos?';
    window.open(buildWhatsAppUrl(q.client_phone || settings.whatsapp_number, msg), '_blank');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Presupuestos</h2>
          <p>Acá se define precio, seña y producto. Al confirmar la seña se crea el pedido.</p>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 40 }}>Cargando...</p>
      ) : quotes.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No hay presupuestos todavía.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>CLIENTE</th>
                <th>PRENDA</th>
                <th style={{ textAlign: 'center' }}>TOTAL</th>
                <th style={{ textAlign: 'center' }}>SEÑA</th>
                <th style={{ textAlign: 'center' }}>ESTADO</th>
                <th style={{ textAlign: 'center' }}>PEDIDO</th>
                <th style={{ textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td>
                    <strong>{q.client_name}</strong>
                    <br />
                    <span style={{ fontSize: 12, color: '#64748b' }}>{q.client_phone}</span>
                  </td>
                  <td>
                    {q.description || q.product_type || q.product_title || '—'}
                    {q.color ? <span style={{ color: '#64748b' }}> · {q.color}</span> : null}
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {q.design_id || q.product_source === 'web'
                        ? 'Desde personalizador'
                        : q.product_source === 'catalog'
                          ? 'Desde catálogo'
                          : 'Manual'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {q.admin_price != null ? `$${Number(q.admin_price).toLocaleString('es-AR')}` : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {q.deposit_amount != null ? (
                      <>
                        ${Number(q.deposit_amount).toLocaleString('es-AR')}
                        <div style={{ fontSize: 11, color: q.deposit_paid ? '#059669' : '#b45309' }}>
                          {q.deposit_paid ? 'Pagada' : 'Pendiente'}
                        </div>
                      </>
                    ) : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`quote-status quote-status--${(q.status || '').toLowerCase()}`}>
                      {q.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: 12 }}>
                    {q.order_code || '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ fontSize: 12, padding: '4px 10px' }}
                      onClick={() => openDetail(q)}
                    >
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Presupuesto — ${selected?.client_name || ''}`}>
        {selected && (
          <div className="quote-detail">
            {selected.order_code && (
              <p className="quote-linked-order">
                Ya convertido en pedido <strong>{selected.order_code}</strong>
              </p>
            )}
            <p><strong>Cantidad:</strong> {editForm.quantity} u. · <strong>Notas cliente:</strong> {selected.notes || '—'}</p>

            <ProductPickFields
              locked={fromWeb}
              lockedHint={fromWeb ? 'Producto armado en el personalizador web. Podés completar el detalle.' : ''}
              value={editForm}
              onChange={setEditForm}
            />

            <div className="quote-form">
              <label>Cantidad</label>
              <input
                type="number"
                min="1"
                value={editForm.quantity}
                onChange={(e) => setEditForm((p) => ({ ...p, quantity: e.target.value }))}
              />
              <label>Precio total acordado ($)</label>
              <input
                type="number"
                min="0"
                value={editForm.admin_price}
                onChange={(e) => setEditForm((p) => ({ ...p, admin_price: e.target.value }))}
                placeholder="Ej: 45000"
              />
              <label>Seña que le pasás ($)</label>
              <input
                type="number"
                min="0"
                value={editForm.deposit_amount}
                onChange={(e) => setEditForm((p) => ({ ...p, deposit_amount: e.target.value }))}
                placeholder="Ej: 15000"
              />
              <label>Estado CRM</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <label>Notas internas</label>
              <textarea
                rows={2}
                value={editForm.admin_notes}
                onChange={(e) => setEditForm((p) => ({ ...p, admin_notes: e.target.value }))}
              />
            </div>

            <div className="quote-actions">
              <button type="button" className="btn-outline" onClick={() => contactWpp(selected)} disabled={saving}>
                WhatsApp
              </button>
              <button type="button" className="btn-outline" onClick={saveQuote} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              {!selected.order_id && !selected.deposit_paid && (
                <button type="button" className="btn-dark" onClick={confirmDeposit} disabled={saving}>
                  Confirmar seña pagada → Pedido
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
