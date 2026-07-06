import { useState, useEffect } from 'react';
import Modal from '../components/Modal.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { buildWhatsAppUrl } from '../utils/whatsapp.js';
import './Presupuestos.css';

const STATUS_OPTIONS = ['Pendiente', 'Contactado', 'Enviado', 'Cerrado'];

export default function Presupuestos() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'Pendiente', admin_price: '', admin_notes: '' });
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
      admin_price: q.admin_price || '',
      admin_notes: q.admin_notes || '',
    });
  };

  const saveQuote = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/quotes/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
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

  const contactWpp = (q) => {
    const price = editForm.admin_price || q.admin_price;
    const msg = price
      ? `Hola ${q.client_name}! Vi que pediste presupuesto por ${q.quantity} ${q.product_type || 'prendas'}. Te paso: $${price}. ¿Seguimos?`
      : `Hola ${q.client_name}! Vi que pediste presupuesto por ${q.quantity} ${q.product_type || 'prendas'}. ¿Seguimos con tu pedido?`;
    window.open(buildWhatsAppUrl(q.client_phone || settings.whatsapp_number, msg), '_blank');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Presupuestos</h2>
          <p>Solicitudes desde el personalizador — sin precio automático al cliente.</p>
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
                <th style={{ textAlign: 'center' }}>CANT.</th>
                <th style={{ textAlign: 'center' }}>ESTADO</th>
                <th style={{ textAlign: 'center' }}>FECHA</th>
                <th style={{ textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td><strong>{q.client_name}</strong><br /><span style={{ fontSize: 12, color: '#64748b' }}>{q.client_phone}</span></td>
                  <td>{q.product_type || q.product_title || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{q.quantity}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`quote-status quote-status--${q.status?.toLowerCase()}`}>{q.status}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{new Date(q.created_at).toLocaleDateString('es-AR')}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" className="btn-outline" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => openDetail(q)}>Gestionar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Presupuesto — ${selected?.client_name}`}>
        {selected && (
          <div className="quote-detail">
            <p><strong>Prenda:</strong> {selected.product_type} · Color: {selected.color || '—'}</p>
            <p><strong>Cantidad:</strong> {selected.quantity}</p>
            <p><strong>Notas del cliente:</strong> {selected.notes || '—'}</p>
            <div className="quote-form">
              <label>Estado</label>
              <select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <label>Precio que le vas a pasar ($)</label>
              <input type="number" value={editForm.admin_price} onChange={(e) => setEditForm((p) => ({ ...p, admin_price: e.target.value }))} placeholder="Ej: 45000" />
              <label>Notas internas</label>
              <textarea rows={2} value={editForm.admin_notes} onChange={(e) => setEditForm((p) => ({ ...p, admin_notes: e.target.value }))} />
            </div>
            <div className="quote-actions">
              <button type="button" className="btn-outline" onClick={() => contactWpp(selected)}>Contactar por WhatsApp</button>
              <button type="button" className="btn-dark" onClick={saveQuote} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
