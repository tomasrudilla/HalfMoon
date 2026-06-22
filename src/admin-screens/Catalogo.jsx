// src/admin-screens/Catalogo.jsx
import { useState, useEffect, useRef } from 'react';
import Modal from '../components/Modal.jsx';
import './Catalogo.css';

const EMPTY_FORM = {
  title: '', category: '', stock: '', price: '', promo_price: '', description: '',
  image_1: '', image_2: '', image_3: '', image_4: ''
};

const IMAGE_FIELDS = [
  { key: 'image_1', label: 'Foto principal *', required: true },
  { key: 'image_2', label: 'Foto 2' },
  { key: 'image_3', label: 'Foto 3' },
  { key: 'image_4', label: 'Foto 4' },
];

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function ImageSlot({ fieldKey, label, value, required, onChange, onClear }) {
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no puede superar 2 MB.');
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    onChange(fieldKey, dataUrl);
  };

  return (
    <div
      className={`catalog-image-slot ${value ? 'has-image' : ''}`}
      onClick={() => !value && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <>
          <img src={value} alt={label} />
          <button
            type="button"
            className="catalog-image-remove"
            onClick={(e) => { e.stopPropagation(); onClear(fieldKey); }}
            aria-label="Quitar imagen"
          >
            ×
          </button>
        </>
      ) : (
        <>
          <span style={{ fontSize: '1.5rem' }}>📷</span>
          <span className="catalog-image-slot-label">{label}{required ? ' *' : ''}</span>
          <span className="catalog-image-slot-label">Clic para subir</span>
        </>
      )}
    </div>
  );
}

export default function Catalogo() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const loadData = () => {
    setLoading(true);
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setItems(data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const setImageField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  const clearImageField = (key) => setFormData(prev => ({ ...prev, [key]: '' }));

  const openCreateForm = () => {
    setFormData(EMPTY_FORM);
    setView('form');
  };

  const openEditForm = (item) => {
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
      image_4: item.image_4 || '',
    });
    setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_1) {
      alert('La foto principal es obligatoria.');
      return;
    }
    setSaving(true);
    const isEditing = !!formData.id;
    const url = isEditing ? `/api/productos/${formData.id}` : '/api/productos';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
      <div className="page-header catalog-page-header">
        <div>
          <h2>Catálogo & Precios</h2>
          <p>Administrá productos con fotos, precios y descripciones que se ven en la web.</p>
        </div>
        {view === 'list' && (
          <div className="header-actions">
            <button type="button" className="btn-dark" onClick={openCreateForm}>+ Nuevo Producto</button>
          </div>
        )}
      </div>

      {view === 'form' ? (
        <div className="catalog-form-panel">
          <h3>{formData.id ? 'Editar producto' : 'Nuevo producto'}</h3>

          <form onSubmit={handleSubmit}>
            <div className="catalog-form-grid">
              <div className="catalog-form-group">
                <label htmlFor="title">Título</label>
                <input required id="title" name="title" value={formData.title} onChange={handleInputChange} />
              </div>
              <div className="catalog-form-group">
                <label htmlFor="category">Categoría</label>
                <input required id="category" name="category" value={formData.category} onChange={handleInputChange} placeholder="Remeras, Buzos..." />
              </div>
              <div className="catalog-form-group">
                <label htmlFor="stock">Stock</label>
                <input id="stock" name="stock" value={formData.stock} onChange={handleInputChange} placeholder="Alto, Medio (15)..." />
              </div>
              <div className="catalog-form-group">
                <label htmlFor="price">Precio base</label>
                <input required id="price" name="price" value={formData.price} onChange={handleInputChange} placeholder="$20.000,00" />
              </div>
              <div className="catalog-form-group">
                <label htmlFor="promo_price">Precio oferta</label>
                <input id="promo_price" name="promo_price" value={formData.promo_price} onChange={handleInputChange} placeholder="Opcional" />
              </div>
              <div className="catalog-form-group catalog-form-group--full">
                <label htmlFor="description">Descripción</label>
                <textarea required id="description" name="description" rows="3" value={formData.description} onChange={handleInputChange} />
              </div>

              <div className="catalog-images-section">
                <h4>Imágenes del producto</h4>
                <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: '#64748b' }}>
                  Subí fotos desde tu computadora (PNG, JPG o WEBP · máx. 2 MB c/u). También podés pegar una URL abajo.
                </p>
                <div className="catalog-images-grid">
                  {IMAGE_FIELDS.map(({ key, label, required }) => (
                    <ImageSlot
                      key={key}
                      fieldKey={key}
                      label={label}
                      value={formData[key]}
                      required={required}
                      onChange={setImageField}
                      onClear={clearImageField}
                    />
                  ))}
                </div>
                <div className="catalog-url-fallback">
                  <label htmlFor="image_1_url">O pegá URL de foto principal</label>
                  <input
                    id="image_1_url"
                    name="image_1"
                    value={formData.image_1?.startsWith('data:') ? '' : formData.image_1}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="catalog-form-actions">
              <button type="button" className="btn-outline" onClick={() => setView('list')} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn-dark" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar producto'}
              </button>
            </div>
          </form>
        </div>
      ) : loading ? (
        <p style={{ textAlign: 'center', padding: '40px' }}>Cargando catálogo...</p>
      ) : items.length === 0 ? (
        <div className="catalog-empty">
          <p>No hay productos todavía.</p>
          <button type="button" className="btn-dark" style={{ marginTop: '16px' }} onClick={openCreateForm}>
            + Crear el primero
          </button>
        </div>
      ) : (
        <div className="catalog-grid">
          {items.map((item) => {
            const hasOffer = item.promo_price && item.promo_price !== item.price;
            return (
              <article key={item.id} className="catalog-product-card">
                <div className="catalog-product-thumb">
                  {hasOffer && <span className="catalog-product-badge">Oferta</span>}
                  {item.image_1 && <img src={item.image_1} alt={item.title} />}
                </div>
                <div className="catalog-product-body">
                  <span className="catalog-product-cat">{item.category}</span>
                  <h4>{item.title}</h4>
                  <div className="catalog-product-prices">
                    {hasOffer && <span className="catalog-price-old">{item.price}</span>}
                    <span className="catalog-price-main">{hasOffer ? item.promo_price : item.price}</span>
                  </div>
                </div>
                <div className="catalog-product-actions">
                  <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => openEditForm(item)}>Editar</button>
                  <button type="button" className="btn-delete" onClick={() => setItemToDelete(item)}>Borrar</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Eliminar producto">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: '16px', color: '#334155', marginBottom: '30px' }}>
            ¿Eliminar <strong>{itemToDelete?.title}</strong>? No se puede deshacer.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button type="button" className="btn-outline" onClick={() => setItemToDelete(null)} disabled={saving}>Cancelar</button>
            <button type="button" className="btn-delete" onClick={confirmDelete} disabled={saving}>
              {saving ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
