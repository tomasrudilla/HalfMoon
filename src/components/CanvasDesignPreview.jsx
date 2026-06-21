import { parseCanvasDesign } from '../utils/parseCanvasDesign.js';
import CanvasMockupStage from './CanvasMockupStage.jsx';
import './CanvasDesignPreview.css';

export default function CanvasDesignPreview({
  customerComment,
  productTitle,
  bgColor = '#f1f5f9',
  variant = 'card',
}) {
  const parsed = parseCanvasDesign(customerComment);
  const { layers, previewUrl, color, view, productId } = parsed;
  const isLight = bgColor === '#ffffff' || bgColor === '#fff';
  const hasMockup = layers.length > 0;

  if (!hasMockup && !previewUrl) {
    return (
      <div
        className={`canvas-preview canvas-preview--empty canvas-preview--${variant}`}
        style={{ backgroundColor: bgColor }}
      >
        <span className="canvas-preview-empty-icon">🖼️</span>
        <span className="canvas-preview-empty-text">Sin imagen</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`canvas-preview canvas-preview--card ${isLight ? 'canvas-preview--bordered' : ''}`}>
        {hasMockup ? (
          <CanvasMockupStage
            layers={layers}
            productTitle={productTitle}
            productId={productId}
            colorId={color}
            view={view}
          />
        ) : (
          <img src={previewUrl} alt="Vista previa del diseño" className="canvas-preview-img" />
        )}
        {layers.length > 1 && (
          <span className="canvas-preview-badge">+{layers.length - 1}</span>
        )}
      </div>
    );
  }

  return (
    <div className="canvas-preview-detail">
      <p className="canvas-preview-mockup-label">Vista del diseño en prenda</p>
      <div className={`canvas-preview canvas-preview--modal ${isLight ? 'canvas-preview--bordered' : ''}`}>
        {hasMockup ? (
          <CanvasMockupStage
            layers={layers}
            productTitle={productTitle}
            productId={productId}
            colorId={color}
            view={view}
          />
        ) : (
          <img src={previewUrl} alt="Vista previa principal" className="canvas-preview-img" />
        )}
      </div>

      {layers.length > 0 && (
        <div className="canvas-preview-layers">
          <p className="canvas-preview-layers-title">Archivos del diseño · descargar</p>
          <div className="canvas-preview-layers-grid">
            {layers.map((layer) => (
              <div key={layer.index} className="canvas-preview-layer-item">
                <img src={layer.logoData} alt={layer.fileName} />
                <div className="canvas-preview-layer-meta">
                  <strong>{layer.fileName}</strong>
                  {layer.transform && (
                    <span>
                      Posición {Math.round(layer.transform.x)}%, {Math.round(layer.transform.y)}%
                      · Escala {Math.round(layer.transform.width)}%
                    </span>
                  )}
                </div>
                <a
                  href={layer.logoData}
                  download={layer.fileName}
                  className="canvas-layer-download"
                >
                  Descargar
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { parseCanvasDesign };
