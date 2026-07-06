import { useState, useRef, useCallback, useEffect } from 'react';
import {
  getMockupForProduct,
  getAvailableColors,
  getProductThumbnail,
  BLANK_PRODUCTS,
  createLayer,
  clampDesign,
  PRODUCT_COLORS,
} from '../data/productMockups.js';
import './ProductDesigner.css';

const ACCEPTED_EXT = '.png,.jpg,.jpeg,.webp';
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_LAYERS = 8;

export default function ProductDesigner({ onFinalizeDesign, onRequestQuote }) {
  const products = BLANK_PRODUCTS;
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  const [selectedColor, setSelectedColor] = useState(PRODUCT_COLORS[0]);
  const [view, setView] = useState('front');
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const fileRef = useRef(null);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  const availableColors = getAvailableColors(selectedProduct);
  const mockup = getMockupForProduct(selectedProduct, selectedColor.id);
  const shirtBounds = mockup.shirtBounds;
  const mockupSrc = mockup.front;
  const hasBackView = mockup.back && mockup.back !== mockup.front;

  useEffect(() => {
    if (availableColors.length && !availableColors.find((c) => c.id === selectedColor.id)) {
      setSelectedColor(availableColors[0]);
    }
  }, [selectedProduct, availableColors, selectedColor.id]);

  const updateLayer = (id, patch) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? clampDesign({ ...l, ...patch }, shirtBounds) : l))
    );
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Formato no válido. Usá PNG, JPG, JPEG o WEBP.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('La imagen no puede superar 8 MB.');
      return;
    }
    if (layers.length >= MAX_LAYERS) {
      setUploadError(`Máximo ${MAX_LAYERS} imágenes por diseño.`);
      return;
    }
    setUploadError('');
    const layer = createLayer(file, layers.length);
    setLayers((prev) => [...prev, layer]);
    setSelectedLayerId(layer.id);
    if (fileRef.current) fileRef.current.value = '';
  };

  const getStageRect = useCallback(() => stageRef.current?.getBoundingClientRect(), []);

  const onPointerDown = (e, layerId, type, handle = 'se') => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedLayerId(layerId);
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const stageRect = getStageRect();
    if (!stageRect) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startDesign = { x: layer.x, y: layer.y, width: layer.width };

    if (type === 'drag') {
      dragRef.current = { layerId, startX, startY, startDesign, stageRect };
    } else {
      resizeRef.current = { layerId, startX, startY, startDesign, stageRect, handle };
    }

    const handleSigns = { se: [1, 1], nw: [-1, -1], ne: [1, -1], sw: [-1, 1] };

    const onMove = (ev) => {
      if (dragRef.current) {
        const { layerId: lid, startX: sx, startY: sy, startDesign: sd, stageRect: sr } = dragRef.current;
        const dx = ((ev.clientX - sx) / sr.width) * 100;
        const dy = ((ev.clientY - sy) / sr.height) * 100;
        updateLayer(lid, { x: sd.x + dx, y: sd.y + dy });
      }
      if (resizeRef.current) {
        const { layerId: lid, startX: sx, startY: sy, startDesign: sd, stageRect: sr, handle: h } = resizeRef.current;
        const dx = ((ev.clientX - sx) / sr.width) * 100;
        const dy = ((ev.clientY - sy) / sr.height) * 100;
        const [signX, signY] = handleSigns[h] || [1, 1];
        const dw = (dx * signX + dy * signY) / 2;
        updateLayer(lid, { width: sd.width + dw });
      }
    };

    const onUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const rotateLayer = (delta) => {
    if (!selectedLayerId) return;
    const layer = layers.find((l) => l.id === selectedLayerId);
    if (layer) updateLayer(selectedLayerId, { rotation: layer.rotation + delta });
  };

  const flipLayer = () => {
    if (!selectedLayerId) return;
    const layer = layers.find((l) => l.id === selectedLayerId);
    if (layer) updateLayer(selectedLayerId, { scaleX: layer.scaleX * -1 });
  };

  const removeLayer = (id) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const handleQuote = () => {
    if (!layers.length) {
      setUploadError('Subí al menos una imagen antes de pedir presupuesto.');
      return;
    }
    onRequestQuote?.({
      layers,
      product: selectedProduct,
      color: selectedColor,
      view,
      mockupSrc,
    });
  };

  const handleFinalize = () => {
    if (!layers.length) {
      setUploadError('Subí al menos una imagen antes de guardar.');
      return;
    }
    onFinalizeDesign({
      layers,
      product: selectedProduct,
      color: selectedColor,
      view,
      mockupSrc,
    });
  };

  return (
    <div className="product-designer">
      <div className="designer-workspace">
        <div className="view-thumbs">
          <button type="button" className="view-thumb active">
            <img src={mockup.front} alt="Frente" />
            <span>FRENTE</span>
          </button>
          {hasBackView && (
            <button type="button" className={`view-thumb ${view === 'back' ? 'active' : ''}`} onClick={() => setView('back')}>
              <img src={mockup.back} alt="Espalda" />
              <span>ESPALDA</span>
            </button>
          )}
        </div>

        <div className="designer-canvas-wrap">
          <div className="designer-stage" ref={stageRef} onClick={() => setSelectedLayerId(null)}>
            <img src={mockupSrc} alt={selectedProduct.title} className="mockup-image" draggable={false} />

            {!layers.length && (
              <button type="button" className="stage-upload-btn" onClick={() => fileRef.current?.click()}>
                <span className="stage-upload-icon">↑</span>
                Insertá tu diseño / logo
              </button>
            )}

            {layers.map((layer) => (
              <div
                key={layer.id}
                className={`design-layer ${selectedLayerId === layer.id ? 'selected' : ''}`}
                style={{
                  left: `${layer.x}%`,
                  top: `${layer.y}%`,
                  width: `${layer.width}%`,
                  zIndex: selectedLayerId === layer.id ? 20 : 10,
                  transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scaleX(${layer.scaleX})`,
                }}
                onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                onPointerDown={(e) => onPointerDown(e, layer.id, 'drag')}
              >
                <img src={layer.url} alt="Capa de diseño" draggable={false} />
                {selectedLayerId === layer.id && (
                  <>
                    <span className="resize-handle nw" onPointerDown={(e) => onPointerDown(e, layer.id, 'resize', 'nw')} />
                    <span className="resize-handle ne" onPointerDown={(e) => onPointerDown(e, layer.id, 'resize', 'ne')} />
                    <span className="resize-handle sw" onPointerDown={(e) => onPointerDown(e, layer.id, 'resize', 'sw')} />
                    <span className="resize-handle se" onPointerDown={(e) => onPointerDown(e, layer.id, 'resize', 'se')} />
                  </>
                )}
              </div>
            ))}

            {layers.length > 0 && (
              <div className="designer-toolbar">
                <button type="button" title="Agregar imagen" onClick={() => fileRef.current?.click()}>+</button>
                <button type="button" title="Rotar izquierda" onClick={() => rotateLayer(-15)} disabled={!selectedLayerId}>↺</button>
                <button type="button" title="Rotar derecha" onClick={() => rotateLayer(15)} disabled={!selectedLayerId}>↻</button>
                <button type="button" title="Espejar" onClick={flipLayer} disabled={!selectedLayerId}>⇄</button>
                <button type="button" title="Eliminar capa" onClick={() => selectedLayerId && removeLayer(selectedLayerId)} className="danger" disabled={!selectedLayerId}>✕</button>
              </div>
            )}
          </div>

          <p className="canvas-hint">
            {layers.length
              ? `${layers.length} imagen${layers.length > 1 ? 'es' : ''} · Tocá + para agregar más`
              : 'Arrastrá el logo por toda la prenda · Usá las esquinas para agrandar'}
          </p>
        </div>
      </div>

      <aside className="designer-sidebar">
        <div className="sidebar-hero">
          <span className="sidebar-hero-badge">Personalizador</span>
          <h3>Diseñá tu prenda</h3>
          <p>Podés agregar varias imágenes</p>
        </div>

        <div className="sidebar-card">
          <p className="sidebar-card-title">Prenda base</p>
          <div className="product-pills">
            {products.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`product-pill ${selectedProduct.id === item.id ? 'active' : ''}`}
                onClick={() => { setSelectedProduct(item); setView('front'); }}
              >
                <img src={getProductThumbnail(item, selectedColor.id)} alt="" />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-card">
          <p className="sidebar-card-title">Color · <em>{selectedColor.label}</em></p>
          <div className="color-swatches">
            {availableColors.map((color) => (
              <button key={color.id} type="button" className={`color-option ${selectedColor.id === color.id ? 'active' : ''}`} onClick={() => setSelectedColor(color)}>
                <span className="color-dot" style={{ background: color.hex, border: color.id === 'white' ? '1px solid #cbd5e1' : 'none' }} />
                <span className="color-name">{color.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-card">
          <p className="sidebar-card-title">Imágenes · {layers.length}/{MAX_LAYERS}</p>
          <p className="upload-specs">PNG · JPG · WEBP · máx. 8 MB c/u</p>

          <input ref={fileRef} type="file" accept={ACCEPTED_EXT} hidden onChange={(e) => handleFile(e.target.files[0])} />

          {layers.length > 0 && (
            <ul className="layer-list">
              {layers.map((layer, i) => (
                <li key={layer.id}>
                  <button
                    type="button"
                    className={`layer-list-item ${selectedLayerId === layer.id ? 'active' : ''}`}
                    onClick={() => setSelectedLayerId(layer.id)}
                  >
                    <img src={layer.url} alt="" />
                    <span>Imagen {i + 1}</span>
                    <span className="layer-remove" onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}>✕</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button type="button" className="sidebar-add-btn" onClick={() => fileRef.current?.click()}>
            + Agregar imagen
          </button>
          {uploadError && <p className="sidebar-error">{uploadError}</p>}
        </div>

        <button type="button" className="sidebar-save-btn" onClick={handleFinalize}>
          Guardar diseño →
        </button>
        {onRequestQuote && (
          <button type="button" className="sidebar-quote-btn" onClick={handleQuote}>
            Pedir presupuesto
          </button>
        )}
      </aside>
    </div>
  );
}
