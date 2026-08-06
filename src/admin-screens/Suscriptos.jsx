import { useEffect, useMemo, useState } from 'react';
import './Leads.css';
import './Suscriptos.css';

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('es-AR');
  } catch {
    return String(value);
  }
};

export default function Suscriptos() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    fetch('/api/newsletter')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setList(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const term = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      !term
        ? list
        : list.filter((row) => String(row.email || '').toLowerCase().includes(term)),
    [list, term]
  );

  const remove = async (id, email) => {
    if (!window.confirm(`¿Sacar a ${email} de la lista de suscriptos?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/newsletter/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar');
      setList((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const downloadCsv = () => {
    const headers = ['ID', 'EMAIL', 'FECHA_SUSCRIPCION'];
    const rows = list.map((row) => [
      row.id,
      row.email,
      formatDate(row.created_at),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `suscriptos_halfmoon_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Suscriptos</h2>
          <p>Emails del newsletter “Unite a la familia HalfMoon”.</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-outline"
            onClick={downloadCsv}
            disabled={!list.length}
          >
            ↓ Descargar lista
          </button>
        </div>
      </div>

      <div className="table-container leads-table-wrap">
        <div className="table-header">
          <h3 style={{ textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>
            Lista de suscriptos
          </h3>
          <div className="leads-toolbar">
            <div className="leads-search">
              <span aria-hidden>🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar email…"
              />
            </div>
            <span className="leads-count">
              {filtered.length} de {list.length}
            </span>
          </div>
        </div>

        {loading ? (
          <p className="leads-empty">Cargando suscriptos…</p>
        ) : list.length === 0 ? (
          <p className="leads-empty">
            Todavía no hay suscriptos. Aparecen acá cuando alguien se anota desde el footer.
          </p>
        ) : filtered.length === 0 ? (
          <p className="leads-empty">Ningún email coincide con “{search}”.</p>
        ) : (
          <table className="leads-table suscriptos-table">
            <thead>
              <tr>
                <th>EMAIL</th>
                <th style={{ textAlign: 'center' }}>FECHA</th>
                <th style={{ textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <a className="suscriptos-email" href={`mailto:${row.email}`}>
                      {row.email}
                    </a>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="leads-muted">{formatDate(row.created_at)}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="suscriptos-btn-delete"
                      onClick={() => remove(row.id, row.email)}
                      disabled={deletingId === row.id}
                    >
                      {deletingId === row.id ? '…' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
