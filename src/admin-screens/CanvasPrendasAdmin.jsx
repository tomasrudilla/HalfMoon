import { useState, useEffect } from 'react';
import Modal from '../components/Modal.jsx';
import ImageUploadField from '../components/ImageUploadField.jsx';
import { CATEGORY_OPTIONS, SHIRT_BOUNDS, groupCanvasCatalog } from '../data/productMockups.js';
import './ContentAdmin.css';
import './CanvasPrendasAdmin.css';

const EMPTY_VARIANT = {
  color_id: '',
  color_label: '',
  color_hex: '#ffffff',
  image_front_url: '',
  image_back_url: '',
  is_active: true,
};

function slugColorId(label) {
  return String(label || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'color';
}

export default function CanvasPrendasAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | product | variant
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null); // { type: 'product'|'variant', ... }

  const [productForm, setProductForm] = useState({
    oldTitle: '',
    title: '',
    category: 'Remeras',
    sort_order: 0,
    is_active: true,
  });

  const [variantForm, setVariantForm] = useState({
    ...EMPTY_VARIANT,
    id: null,
    productTitle: '',
    category: 'Remeras',
    shirt_bounds: SHIRT_BOUNDS.Remeras,
    sort_order: 0,
  });

  const groups = groupCanvasCatalog(rows);

  const load = () => {
    setLoading(true);
    fetch('/api/canvas-catalog')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRows(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openNewProduct = () => {
    setProductForm({
      oldTitle: '',
      title: '',
      category: 'Remeras',
      sort_order: groups.length + 1,
      is_active: true,
    });
    setVariantForm({
      ...EMPTY_VARIANT,
      id: null,
      productTitle: '',
      category: 'Remeras',
      color_id: 'white',
      color_label: 'Blanco',
      color_hex: '#ffffff',
      shirt_bounds: { ...SHIRT_BOUNDS.Remeras },
      sort_order: groups.length + 1,
    });
    setView('product');
  };

  const openEditProduct = (group) => {
    const bounds = group.variants[0]?.shirt_bounds || SHIRT_BOUNDS[group.category] || SHIRT_BOUNDS.Remeras;
    setProductForm({
      oldTitle: group.title,
      title: group.title,
      category: group.category,
      sort_order: group.sort_order,
      is_active: group.is_active !== false,
      shirt_bounds: bounds,
    });
    setView('product');
  };

  const openNewVariant = (group) => {
    setVariantForm({
      ...EMPTY_VARIANT,
      id: null,
      productTitle: group.title,
      category: group.category,
      shirt_bounds: group.variants[0]?.shirt_bounds || SHIRT_BOUNDS[group.category] || SHIRT_BOUNDS.Remeras,
      sort_order: (group.variants.at(-1)?.sort_order || 0) + 1,
    });
    setView('variant');
  };

  const openEditVariant = (group, variant) => {
    setVariantForm({
      id: variant.id,
      productTitle: group.title,
      category: group.category,
      color_id: variant.color_id,
      color_label: variant.color_label,
      color_hex: variant.color_hex,
      image_front_url: variant.image_front_url,
      image_back_url: variant.image_back_url === variant.image_front_url ? '' : variant.image_back_url,
      shirt_bounds: variant.shirt_bounds,
      sort_order: variant.sort_order,
      is_active: variant.is_active !== false,
    });
    setView('variant');
  };

  const handleCategoryChange = (category) => {
    setProductForm((p) => ({
      ...p,
      category,
      shirt_bounds: SHIRT_BOUNDS[category] || SHIRT_BOUNDS.Remeras,
    }));
  };

  const saveProductMeta = async (e) => {
    e.preventDefault();
    if (!productForm.title.trim()) return;
    setSaving(true);
    try {
      if (!productForm.oldTitle) {
        // Nueva prenda: requiere el primer color (variantForm)
        if (!variantForm.color_label || !variantForm.image_front_url) {
          throw new Error('Completá el primer color y su imagen de frente.');
        }
        const colorId = variantForm.color_id || slugColorId(variantForm.color_label);
        const res = await fetch('/api/canvas-catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: productForm.title.trim(),
            category: productForm.category,
            color_id: colorId,
            color_label: variantForm.color_label.trim(),
            color_hex: variantForm.color_hex || '#ffffff',
            image_front_url: variantForm.image_front_url,
            image_back_url: variantForm.image_back_url || variantForm.image_front_url,
            shirt_bounds: productForm.shirt_bounds || SHIRT_BOUNDS[productForm.category],
            sort_order: Number(productForm.sort_order) || 0,
            is_active: productForm.is_active !== false,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'No se pudo crear la prenda');
        }
      } else {
        const res = await fetch('/api/canvas-catalog/group/meta', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldTitle: productForm.oldTitle,
            title: productForm.title.trim(),
            category: productForm.category,
            shirt_bounds: productForm.shirt_bounds || SHIRT_BOUNDS[productForm.category],
            sort_order: Number(productForm.sort_order) || 0,
            is_active: productForm.is_active !== false,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'No se pudo guardar');
        }
      }
      setView('list');
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveVariant = async (e) => {
    e.preventDefault();
    if (!variantForm.color_label.trim() || !variantForm.image_front_url) {
      alert('Color e imagen de frente son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      const colorId = variantForm.color_id || slugColorId(variantForm.color_label);
      const payload = {
        title: variantForm.productTitle,
        category: variantForm.category,
        color_id: colorId,
        color_label: variantForm.color_label.trim(),
        color_hex: variantForm.color_hex || '#ffffff',
        image_front_url: variantForm.image_front_url,
        image_back_url: variantForm.image_back_url || variantForm.image_front_url,
        shirt_bounds: variantForm.shirt_bounds,
        sort_order: Number(variantForm.sort_order) || 0,
        is_active: variantForm.is_active !== false,
      };

      const res = await fetch(
        variantForm.id ? `/api/canvas-catalog/${variantForm.id}` : '/api/canvas-catalog',
        {
          method: variantForm.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'No se pudo guardar el color');
      }
      setView('list');
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setSaving(true);
    try {
      let res;
      if (toDelete.type === 'product') {
        res = await fetch(`/api/canvas-catalog/group?title=${encodeURIComponent(toDelete.title)}`, {
          method: 'DELETE',
        });
      } else {
        res = await fetch(`/api/canvas-catalog/${toDelete.id}`, { method: 'DELETE' });
      }
      if (!res.ok) throw new Error('No se pudo eliminar');
      setToDelete(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (view === 'product') {
    const isNew = !productForm.oldTitle;
    return (
      <div className="content-admin-form canvas-prendas-form">
        <h3>{isNew ? 'Nueva prenda del personalizador' : 'Editar prenda'}</h3>
        <form onSubmit={saveProductMeta}>
          <div className="content-admin-fields">
            <div className="caf-group caf-full">
              <label>Nombre de la prenda</label>
              <input
                value={productForm.title}
                onChange={(e) => setProductForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ej: Bufanda, Remera + Estampado"
                required
              />
            </div>
            <div className="caf-group">
              <label>Categoría</label>
              <select
                value={productForm.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="caf-group">
              <label>Orden</label>
              <input
                type="number"
                value={productForm.sort_order}
                onChange={(e) => setProductForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
              />
            </div>
            <div className="caf-group">
              <label>Visible en personalizador</label>
              <select
                value={productForm.is_active === false ? 'false' : 'true'}
                onChange={(e) => setProductForm((p) => ({ ...p, is_active: e.target.value === 'true' }))}
              >
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>

            {isNew && (
              <>
                <div className="caf-full canvas-prendas-divider">
                  <strong>Primer color / variante</strong>
                  <p>Después podés sumar más colores desde la ficha de la prenda.</p>
                </div>
                <div className="caf-group">
                  <label>Nombre del color</label>
                  <input
                    value={variantForm.color_label}
                    onChange={(e) => setVariantForm((p) => ({
                      ...p,
                      color_label: e.target.value,
                      color_id: slugColorId(e.target.value),
                    }))}
                    placeholder="Ej: Rojo"
                    required
                  />
                </div>
                <div className="caf-group">
                  <label>Hex</label>
                  <input
                    type="color"
                    value={variantForm.color_hex || '#ffffff'}
                    onChange={(e) => setVariantForm((p) => ({ ...p, color_hex: e.target.value }))}
                  />
                </div>
                <div className="caf-group caf-full">
                  <ImageUploadField
                    label="Mockup frente"
                    value={variantForm.image_front_url}
                    onChange={(v) => setVariantForm((p) => ({ ...p, image_front_url: v }))}
                    required
                  />
                </div>
                <div className="caf-group caf-full">
                  <ImageUploadField
                    label="Mockup espalda (opcional)"
                    value={variantForm.image_back_url}
                    onChange={(v) => setVariantForm((p) => ({ ...p, image_back_url: v }))}
                  />
                </div>
              </>
            )}
          </div>
          <div className="content-admin-actions">
            <button type="button" className="btn-outline" onClick={() => setView('list')} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-dark" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (view === 'variant') {
    return (
      <div className="content-admin-form canvas-prendas-form">
        <h3>{variantForm.id ? 'Editar color' : 'Agregar color'} · {variantForm.productTitle}</h3>
        <form onSubmit={saveVariant}>
          <div className="content-admin-fields">
            <div className="caf-group">
              <label>Nombre del color</label>
              <input
                value={variantForm.color_label}
                onChange={(e) => setVariantForm((p) => ({
                  ...p,
                  color_label: e.target.value,
                  color_id: variantForm.id ? p.color_id : slugColorId(e.target.value),
                }))}
                required
              />
            </div>
            <div className="caf-group">
              <label>Hex</label>
              <input
                type="color"
                value={variantForm.color_hex || '#ffffff'}
                onChange={(e) => setVariantForm((p) => ({ ...p, color_hex: e.target.value }))}
              />
            </div>
            <div className="caf-group">
              <label>Orden</label>
              <input
                type="number"
                value={variantForm.sort_order}
                onChange={(e) => setVariantForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
              />
            </div>
            <div className="caf-group">
              <label>Activo</label>
              <select
                value={variantForm.is_active === false ? 'false' : 'true'}
                onChange={(e) => setVariantForm((p) => ({ ...p, is_active: e.target.value === 'true' }))}
              >
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="caf-group caf-full">
              <ImageUploadField
                label="Mockup frente"
                value={variantForm.image_front_url}
                onChange={(v) => setVariantForm((p) => ({ ...p, image_front_url: v }))}
                required
              />
            </div>
            <div className="caf-group caf-full">
              <ImageUploadField
                label="Mockup espalda (opcional)"
                value={variantForm.image_back_url}
                onChange={(v) => setVariantForm((p) => ({ ...p, image_back_url: v }))}
              />
            </div>
          </div>
          <div className="content-admin-actions">
            <button type="button" className="btn-outline" onClick={() => setView('list')} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-dark" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar color'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Prendas del personalizador</h2>
          <p>Tipos de prenda y variantes de color que ve el cliente al diseñar.</p>
        </div>
        <button type="button" className="btn-dark" onClick={openNewProduct}>+ Nueva prenda</button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 40 }}>Cargando...</p>
      ) : groups.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          Todavía no hay prendas. Creá la primera (ej. Remera, Buzo, Bufanda).
        </p>
      ) : (
        <div className="canvas-prendas-list">
          {groups.map((group) => (
            <article key={group.id} className="canvas-prenda-card">
              <div className="canvas-prenda-card-top">
                <div>
                  <h3>{group.title}</h3>
                  <p>{group.category} · {group.variants.length} color{group.variants.length === 1 ? '' : 'es'}</p>
                </div>
                <div className="canvas-prenda-card-actions">
                  <button type="button" className="btn-outline" onClick={() => openEditProduct(group)}>Editar</button>
                  <button type="button" className="btn-outline" onClick={() => openNewVariant(group)}>+ Color</button>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => setToDelete({ type: 'product', title: group.title })}
                  >
                    Borrar
                  </button>
                </div>
              </div>
              <div className="canvas-prenda-variants">
                {group.variants.map((v) => (
                  <div key={v.id} className="canvas-prenda-variant">
                    <img src={v.image_front_url} alt={`${group.title} ${v.color_label}`} />
                    <div className="canvas-prenda-variant-meta">
                      <span
                        className="canvas-prenda-swatch"
                        style={{
                          background: v.color_hex,
                          border: v.color_hex?.toLowerCase() === '#ffffff' ? '1px solid #cbd5e1' : 'none',
                        }}
                      />
                      <strong>{v.color_label}</strong>
                      {v.is_active === false && <em>Oculto</em>}
                    </div>
                    <div className="canvas-prenda-variant-actions">
                      <button type="button" className="btn-outline" onClick={() => openEditVariant(group, v)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => setToDelete({ type: 'variant', id: v.id, label: v.color_label })}
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        title={toDelete?.type === 'product' ? 'Eliminar prenda' : 'Eliminar color'}
      >
        <p style={{ textAlign: 'center', marginBottom: 24 }}>
          {toDelete?.type === 'product'
            ? `¿Eliminar “${toDelete.title}” y todos sus colores?`
            : `¿Eliminar el color “${toDelete?.label}”?`}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button type="button" className="btn-outline" onClick={() => setToDelete(null)}>Cancelar</button>
          <button type="button" className="btn-delete" onClick={confirmDelete} disabled={saving}>
            Eliminar
          </button>
        </div>
      </Modal>
    </>
  );
}
