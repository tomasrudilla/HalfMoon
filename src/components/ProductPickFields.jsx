import { useEffect, useMemo, useState } from 'react';
import { groupCanvasCatalog } from '../data/productMockups.js';
import './ProductPickFields.css';

/**
 * Selector de prenda desde Catálogo tienda, Personalizador o texto libre.
 */
export default function ProductPickFields({
  value,
  onChange,
  showColor = true,
  showDescription = true,
  locked = false,
  lockedHint = '',
}) {
  const [catalog, setCatalog] = useState([]);
  const [canvasGroups, setCanvasGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const source = value.product_source || 'custom';

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/productos').then((r) => r.json()).catch(() => []),
      fetch('/api/canvas-catalog').then((r) => r.json()).catch(() => []),
    ]).then(([products, canvasRows]) => {
      if (cancelled) return;
      setCatalog(Array.isArray(products) ? products.filter((p) => p.is_active !== false) : []);
      setCanvasGroups(groupCanvasCatalog(Array.isArray(canvasRows) ? canvasRows : []));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const canvasColors = useMemo(() => {
    const group = canvasGroups.find((g) => g.title === value.product_type);
    return group?.variants || [];
  }, [canvasGroups, value.product_type]);

  const patch = (partial) => onChange({ ...value, ...partial });

  const onSourceChange = (product_source) => {
    patch({
      product_source,
      product_type: '',
      color: '',
      catalog_item_id: null,
    });
  };

  const onCatalogPick = (id) => {
    const item = catalog.find((p) => String(p.id) === String(id));
    if (!item) {
      patch({ catalog_item_id: null, product_type: '' });
      return;
    }
    patch({
      catalog_item_id: item.id,
      product_type: item.title,
      color: value.color || '',
      description:
        value.description ||
        item.description ||
        `${item.title}${item.category ? ` (${item.category})` : ''}`,
    });
  };

  const onCanvasPick = (title) => {
    const group = canvasGroups.find((g) => g.title === title);
    if (!group) {
      patch({ product_type: title, color: '' });
      return;
    }
    const first = group.variants[0];
    patch({
      catalog_item_id: null,
      product_type: group.title,
      color: first?.color_label || '',
      description:
        value.description ||
        `${group.title}${first ? ` · ${first.color_label}` : ''} (personalizador)`,
    });
  };

  const onCanvasColor = (colorLabel) => {
    patch({
      color: colorLabel,
      description: value.description?.trim()
        ? value.description
        : `${value.product_type} · ${colorLabel} (personalizador)`,
    });
  };

  if (locked) {
    return (
      <div className="product-pick product-pick--locked">
        {lockedHint && <p className="product-pick-hint">{lockedHint}</p>}
        <div className="pedido-form-grid">
          <div className="pedido-form-group">
            <label>Prenda</label>
            <input value={value.product_type || '—'} readOnly />
          </div>
          {showColor && (
            <div className="pedido-form-group">
              <label>Color</label>
              <input value={value.color || '—'} readOnly />
            </div>
          )}
          {showDescription && (
            <div className="pedido-form-group pedido-form-group--full">
              <label>Detalle</label>
              <textarea
                rows={3}
                value={value.description || ''}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Agregá talles, logos, notas de producción…"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="product-pick">
      {loading && <p className="product-pick-hint">Cargando catálogo…</p>}
      <div className="pedido-form-grid">
        <div className="pedido-form-group pedido-form-group--full">
          <label>Origen del producto</label>
          <select value={source} onChange={(e) => onSourceChange(e.target.value)}>
            <option value="canvas">Prenda del personalizador</option>
            <option value="catalog">Producto del catálogo</option>
            <option value="custom">Otro / a medida</option>
          </select>
        </div>

        {source === 'catalog' && (
          <div className="pedido-form-group pedido-form-group--full">
            <label>Producto catálogo</label>
            <select
              value={value.catalog_item_id || ''}
              onChange={(e) => onCatalogPick(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {catalog.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}{p.category ? ` · ${p.category}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {source === 'canvas' && (
          <>
            <div className="pedido-form-group">
              <label>Prenda personalizador</label>
              <select
                value={value.product_type || ''}
                onChange={(e) => onCanvasPick(e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {canvasGroups.map((g) => (
                  <option key={g.id} value={g.title}>{g.title}</option>
                ))}
              </select>
            </div>
            {showColor && (
              <div className="pedido-form-group">
                <label>Color</label>
                <select
                  value={value.color || ''}
                  onChange={(e) => onCanvasColor(e.target.value)}
                  disabled={!canvasColors.length}
                >
                  <option value="">Seleccionar…</option>
                  {canvasColors.map((v) => (
                    <option key={v.id} value={v.color_label}>{v.color_label}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {source === 'custom' && (
          <>
            <div className="pedido-form-group">
              <label>Tipo de prenda</label>
              <input
                value={value.product_type || ''}
                onChange={(e) => patch({ product_type: e.target.value })}
                placeholder="Ej: Remeras oversize"
              />
            </div>
            {showColor && (
              <div className="pedido-form-group">
                <label>Color</label>
                <input
                  value={value.color || ''}
                  onChange={(e) => patch({ color: e.target.value })}
                  placeholder="Ej: Blancas"
                />
              </div>
            )}
          </>
        )}

        {showDescription && (
          <div className="pedido-form-group pedido-form-group--full">
            <label>Detalle del trabajo</label>
            <textarea
              rows={3}
              value={value.description || ''}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Ej: 10 remeras blancas con logo personalizado en pecho y espalda · talles S–XL"
            />
          </div>
        )}
      </div>
    </div>
  );
}
