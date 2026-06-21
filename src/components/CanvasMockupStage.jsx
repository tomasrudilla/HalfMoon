import { getMockupForProduct, resolveDesignProduct } from '../data/productMockups.js';

export default function CanvasMockupStage({
  layers,
  productTitle,
  productId,
  colorId = 'white',
  view = 'front',
  className = '',
}) {
  const product = resolveDesignProduct(productTitle, productId);
  const mockup = getMockupForProduct(product, colorId || 'white');
  const mockupSrc = view === 'back' && mockup.back ? mockup.back : mockup.front;

  return (
    <div className={`canvas-mockup-stage ${className}`.trim()}>
      <img src={mockupSrc} alt={product.title} className="canvas-mockup-garment" draggable={false} />
      {layers.map((layer) => {
        const t = layer.transform || {};
        return (
          <div
            key={layer.index}
            className="canvas-mockup-layer"
            style={{
              left: `${t.x ?? 50}%`,
              top: `${t.y ?? 42}%`,
              width: `${t.width ?? 38}%`,
              zIndex: layer.index,
              transform: `translate(-50%, -50%) rotate(${t.rotation ?? 0}deg) scaleX(${t.scaleX ?? 1})`,
            }}
          >
            <img src={layer.logoData} alt={layer.fileName} draggable={false} />
          </div>
        );
      })}
    </div>
  );
}
