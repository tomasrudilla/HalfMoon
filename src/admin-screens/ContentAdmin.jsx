import { useState, useEffect } from 'react';
import Modal from '../components/Modal.jsx';
import ImageUploadField from '../components/ImageUploadField.jsx';
import './ContentAdmin.css';

export default function ContentAdmin({
  apiPath,
  title,
  subtitle,
  fields,
  emptyForm,
  renderCard,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/${apiPath}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setItems(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [apiPath]);

  const openCreate = () => { setForm(emptyForm); setView('form'); };
  const openEdit = (item) => { setForm({ ...emptyForm, ...item }); setView('form'); };

  const handleChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const isEdit = !!form.id;
    try {
      const res = await fetch(isEdit ? `/api/${apiPath}/${form.id}` : `/api/${apiPath}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setView('list');
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/${apiPath}/${toDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      setToDelete(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {view === 'list' && (
          <button type="button" className="btn-dark" onClick={openCreate}>+ Agregar</button>
        )}
      </div>

      {view === 'form' ? (
        <div className="content-admin-form">
          <h3>{form.id ? 'Editar' : 'Nuevo'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="content-admin-fields">
              {fields.map((field) => {
                if (field.type === 'image') {
                  return (
                    <div key={field.key} className="caf-group caf-full">
                      <ImageUploadField
                      key={field.key}
                      label={field.label}
                      value={form[field.key]}
                      onChange={(v) => handleChange(field.key, v)}
                      required={field.required}
                    />
                    </div>
                  );
                }
                if (field.type === 'textarea') {
                  return (
                    <div key={field.key} className="caf-group caf-full">
                      <label>{field.label}</label>
                      <textarea
                        rows={3}
                        value={form[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        required={field.required}
                      />
                    </div>
                  );
                }
                return (
                  <div key={field.key} className="caf-group">
                    <label>{field.label}</label>
                    <input
                      type={field.type || 'text'}
                      value={form[field.key] ?? ''}
                      onChange={(e) => handleChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                      required={field.required}
                    />
                  </div>
                );
              })}
              <div className="caf-group">
                <label>Activo en web</label>
                <select value={form.is_active === false ? 'false' : 'true'} onChange={(e) => handleChange('is_active', e.target.value === 'true')}>
                  <option value="true">Sí, visible</option>
                  <option value="false">Oculto</option>
                </select>
              </div>
            </div>
            <div className="content-admin-actions">
              <button type="button" className="btn-outline" onClick={() => setView('list')} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn-dark" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      ) : loading ? (
        <p style={{ textAlign: 'center', padding: 40 }}>Cargando...</p>
      ) : (
        <div className="content-admin-grid">
          {items.map((item) => (
            <div key={item.id} className="content-admin-card">
              {renderCard(item)}
              <div className="content-admin-card-actions">
                <button type="button" className="btn-outline" onClick={() => openEdit(item)}>Editar</button>
                <button type="button" className="btn-delete" onClick={() => setToDelete(item)}>Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!toDelete} onClose={() => setToDelete(null)} title="Eliminar">
        <p style={{ textAlign: 'center', marginBottom: 24 }}>¿Eliminar este ítem?</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button type="button" className="btn-outline" onClick={() => setToDelete(null)}>Cancelar</button>
          <button type="button" className="btn-delete" onClick={confirmDelete} disabled={saving}>Eliminar</button>
        </div>
      </Modal>
    </>
  );
}
