// src/admin-screens/Catalogo.jsx
import { useState, useEffect } from 'react';
import Modal from '../components/Modal.jsx'; // Usamos el Modal para confirmaciones

const EMPTY_FORM = {
  title: '', category: '', stock: '', price: '', promo_price: '', description: '',
  image_1: '', image_2: '', image_3: '', image_4: ''
};

export default function Catalogo() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el CRUD
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const loadData = () => {
    setLoading(true);
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setItems(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  // Manejo del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateForm = () => {
    setFormData(EMPTY_FORM);
    setView('form');
  };

  const openEditForm = (item) => {
    // Rellenamos los vacíos con string vacío para evitar warnings en los inputs
    setFormData({
      id: item.id,
      title: item.title || '',
      category: item.category || '',
      stock: item.stock || '',
      price: item.price || '',
      promo_price: item.promo_price || '',
      description: item.description || '',
      image_1: item.image_1 || '',
      image_2: item.image_2 || '',
      image_3: item.image_3 || '',
      image_4: item.image_4 || ''
    });
    setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const isEditing = !!formData.id;
    const url = isEditing ? `/api/productos/${formData.id}` : '/api/productos';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Error al guardar el producto');
      
      setView('list');
      loadData();
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Manejo del Borrado
  const confirmDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/productos/${itemToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Catálogo & Precios</h2>
          <p>Administración directa de los productos mapeados automáticamente en la Landing pública.</p>
        </div>
        {view === 'list' && (
          <div className="header-actions">
            <button className="btn-dark" onClick={openCreateForm}>+ Nuevo Producto</button>
          </div>
        )}
      </div>

      {view === 'form' ? (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, marginBottom: '24px' }}>
            {formData.id ? 'Editar Producto' : 'Crear Nuevo Producto'}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Título del Producto *</label>
                <input required name="title" value={formData.title} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Categoría *</label>
                <input required name="category" value={formData.category} onChange={handleInputChange} placeholder="Ej: Remeras, Buzos" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Stock/Nivel</label>
                <input name="stock" value={formData.stock} onChange={handleInputChange} placeholder="Ej: Alto, Bajo (5)" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Precio Base *</label>
                <input required name="price" value={formData.price} onChange={handleInputChange} placeholder="Ej: $20.000,00" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Precio Oferta (Opcional)</label>
                <input name="promo_price" value={formData.promo_price} onChange={handleInputChange} placeholder="Ej: $18.000,00" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Descripción *</label>
              <textarea required name="description" value={formData.description} onChange={handleInputChange} rows="3" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'inherit' }} />
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>Imágenes (URLs)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Foto Principal (Obligatoria)</label>
                  <input required name="image_1" value={formData.image_1} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Foto 2</label>
                  <input name="image_2" value={formData.image_2} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Foto 3</label>
                  <input name="image_3" value={formData.image_3} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Foto 4</label>
                  <input name="image_4" value={formData.image_4} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" className="btn-outline" onClick={() => setView('list')} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn-dark" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* VISTA DE LISTA/TABLA */
        <>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px' }}>Cargando catálogo...</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ARTÍCULO</th>
                    <th style={{ textAlign: 'center' }}>CATEGORÍA</th>
                    <th style={{ textAlign: 'center' }}>STOCK</th>
                    <th style={{ textAlign: 'center' }}>PRECIO</th>
                    <th style={{ textAlign: 'center' }}>OFERTA</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No hay productos en el catálogo.</td></tr>
                  )}
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={item.image_1} alt={item.title} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}/>
                          <div>
                            <strong>{item.title}</strong><br/>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              {item.description?.length > 40 ? item.description.substring(0, 40) + '...' : item.description}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.category}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.stock || '-'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#94a3b8' }}>{item.price}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#000' }}>{item.promo_price || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button type="button" className="btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => openEditForm(item)}>
                            Editar
                          </button>
                          <button type="button" className="btn-delete" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setItemToDelete(item)}>
                            Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* POP-UP CONFIRMACIÓN DE BORRADO DE PRODUCTO */}
      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Eliminar Producto">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: '16px', color: '#334155', marginBottom: '30px' }}>
            ¿Estás seguro que querés eliminar <strong>{itemToDelete?.title}</strong> del catálogo?<br/>
            Esta acción no se puede deshacer.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="btn-outline" onClick={() => setItemToDelete(null)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn-delete" onClick={confirmDelete} disabled={saving}>
              {saving ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}