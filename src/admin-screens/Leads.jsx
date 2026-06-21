// src/admin-screens/Leads.jsx
import { useState, useEffect } from 'react';
import './Leads.css';

const EMPTY_FORM = { full_name: '', phone: '', email: '', origin: '' };

export default function Leads() {
  const [leadsList, setLeadsList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [savingId, setSavingId] = useState(null);

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

  const downloadClients = () => {
    const headers = ['ID', 'CONTACTO', 'TELEFONO', 'EMAIL', 'ORIGEN', 'FECHA_INGRESO'];
    const rows = leadsList.map(lead => [
      lead.id,
      lead.full_name,
      lead.phone,
      lead.email || '',
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

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Base de Datos de Clientes</h2>
          <p>Contactos consolidados de la web y registros comerciales.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-outline" onClick={downloadClients} disabled={!leadsList.length}>
            ↓ Descargar clientes
          </button>
        </div>
      </div>

      <div className="table-container leads-table-wrap">
        <div className="table-header">
          <h3 style={{ textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>Directorio Completo</h3>
          <span className="leads-count">{leadsList.length} contacto{leadsList.length !== 1 ? 's' : ''}</span>
        </div>

        {leadsList.length === 0 ? (
          <p className="leads-empty">No hay clientes registrados todavía.</p>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th>CONTACTO</th>
                <th style={{ textAlign: 'center' }}>TELÉFONO</th>
                <th style={{ textAlign: 'center' }}>EMAIL</th>
                <th style={{ textAlign: 'center' }}>ORIGEN</th>
                <th style={{ textAlign: 'center' }}>FECHA INGRESO</th>
                <th style={{ textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {leadsList.map((lead) => {
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
                        <button type="button" className="leads-btn-edit" onClick={() => startEdit(lead)}>
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
