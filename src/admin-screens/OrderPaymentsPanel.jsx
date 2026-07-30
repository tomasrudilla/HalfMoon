import { useState, useEffect } from 'react';

const PAYMENT_TYPES = [
  { id: 'seña', label: 'Seña' },
  { id: 'cuota', label: 'Cuota' },
  { id: 'pago', label: 'Pago' },
  { id: 'saldo', label: 'Saldo / cierre' },
];

const EMPTY = {
  amount: '',
  payment_type: 'seña',
  installment_number: '',
  method: 'Transferencia',
  notes: '',
  paid_at: new Date().toISOString().slice(0, 10),
};

export default function OrderPaymentsPanel({ orderId, totalPrice, onTotalsChange }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = () => {
    if (!orderId) return;
    setLoading(true);
    fetch(`/api/orders/${orderId}/payments`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPayments(data);
          const paid = data.reduce((acc, p) => acc + Number(p.amount || 0), 0);
          onTotalsChange?.(paid);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [orderId]);

  const paidTotal = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const balance = Math.max(0, Number(totalPrice || 0) - paidTotal);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      alert('Ingresá un monto válido.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(form.amount),
          payment_type: form.payment_type,
          installment_number:
            form.payment_type === 'cuota' && form.installment_number
              ? Number(form.installment_number)
              : null,
          method: form.method || null,
          notes: form.notes || null,
          paid_at: form.paid_at || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'No se pudo registrar el pago');
      }
      setForm({ ...EMPTY, payment_type: form.payment_type === 'seña' ? 'pago' : form.payment_type });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este pago?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/payments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar');
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!orderId) return null;

  return (
    <div className="order-payments-panel">
      <div className="order-payments-summary">
        <div>
          <span>Total acordado</span>
          <strong>${Number(totalPrice || 0).toLocaleString('es-AR')}</strong>
        </div>
        <div>
          <span>Pagado</span>
          <strong className="paid">${paidTotal.toLocaleString('es-AR')}</strong>
        </div>
        <div>
          <span>Saldo</span>
          <strong className={balance > 0 ? 'balance' : 'paid'}>
            ${balance.toLocaleString('es-AR')}
          </strong>
        </div>
      </div>

      {loading ? (
        <p className="order-payments-hint">Cargando pagos…</p>
      ) : payments.length === 0 ? (
        <p className="order-payments-hint">Todavía no hay pagos registrados.</p>
      ) : (
        <ul className="order-payments-list">
          {payments.map((p) => (
            <li key={p.id}>
              <div>
                <strong>
                  {p.payment_type}
                  {p.installment_number ? ` #${p.installment_number}` : ''}
                </strong>
                <span>
                  {p.method || '—'} ·{' '}
                  {p.paid_at
                    ? new Date(p.paid_at).toLocaleDateString('es-AR')
                    : '—'}
                </span>
                {p.notes && <em>{p.notes}</em>}
              </div>
              <div className="order-payments-list-right">
                <strong>${Number(p.amount).toLocaleString('es-AR')}</strong>
                <button type="button" className="btn-delete" onClick={() => handleDelete(p.id)} disabled={saving}>
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="order-payments-form" onSubmit={handleAdd}>
        <div className="pedido-form-grid">
          <div className="pedido-form-group">
            <label>Tipo</label>
            <select
              value={form.payment_type}
              onChange={(e) => setForm((p) => ({ ...p, payment_type: e.target.value }))}
            >
              {PAYMENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="pedido-form-group">
            <label>Monto ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              required
            />
          </div>
          {form.payment_type === 'cuota' && (
            <div className="pedido-form-group">
              <label>Nº cuota</label>
              <input
                type="number"
                min="1"
                value={form.installment_number}
                onChange={(e) => setForm((p) => ({ ...p, installment_number: e.target.value }))}
                placeholder="1"
              />
            </div>
          )}
          <div className="pedido-form-group">
            <label>Medio</label>
            <input
              value={form.method}
              onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}
              placeholder="Transferencia, efectivo…"
            />
          </div>
          <div className="pedido-form-group">
            <label>Fecha</label>
            <input
              type="date"
              value={form.paid_at}
              onChange={(e) => setForm((p) => ({ ...p, paid_at: e.target.value }))}
            />
          </div>
          <div className="pedido-form-group pedido-form-group--full">
            <label>Nota</label>
            <input
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Opcional"
            />
          </div>
        </div>
        <button type="submit" className="btn-dark" disabled={saving} style={{ marginTop: 12 }}>
          {saving ? 'Guardando…' : '+ Registrar pago'}
        </button>
      </form>
    </div>
  );
}
