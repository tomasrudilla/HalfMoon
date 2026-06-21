const MOCKUP_BASE = '/mockups';

export const PRODUCT_COLORS = [
  { id: 'white', label: 'Blanco', hex: '#ffffff' },
  { id: 'black', label: 'Negro', hex: '#1a1a1a' },
];

/** Zona draggable sobre la prenda (porcentaje del canvas) */
const SHIRT_BOUNDS = {
  Remeras: { top: 8, left: 14, width: 72, height: 82 },
  Buzos: { top: 6, left: 12, width: 76, height: 86 },
  Abrigos: { top: 8, left: 14, width: 72, height: 82 },
  Accesorios: { top: 10, left: 16, width: 68, height: 80 },
};

const PRODUCT_MOCKUPS = {
  'Remeras-white': {
    front: `${MOCKUP_BASE}/remera-blanca.png`,
    back: `${MOCKUP_BASE}/remera-blanca.png`,
    shirtBounds: SHIRT_BOUNDS.Remeras,
  },
  'Remeras-black': {
    front: `${MOCKUP_BASE}/remera-negra.png`,
    back: `${MOCKUP_BASE}/remera-negra.png`,
    shirtBounds: SHIRT_BOUNDS.Remeras,
  },
  'Buzos-white': {
    front: `${MOCKUP_BASE}/buzo-blanco.png`,
    back: `${MOCKUP_BASE}/buzo-blanco.png`,
    shirtBounds: SHIRT_BOUNDS.Buzos,
  },
  'Buzos-black': {
    front: `${MOCKUP_BASE}/buzo-negro.png`,
    back: `${MOCKUP_BASE}/buzo-negro.png`,
    shirtBounds: SHIRT_BOUNDS.Buzos,
  },
};

const DEFAULT_MOCKUP = PRODUCT_MOCKUPS['Remeras-white'];

export function getMockupForProduct(product, colorId = 'white') {
  if (!product) return DEFAULT_MOCKUP;

  if (product.image_url) {
    return {
      front: product.image_url,
      back: product.image_back_url || product.image_url,
      shirtBounds: SHIRT_BOUNDS[product.category] || SHIRT_BOUNDS.Remeras,
    };
  }

  const key = `${product.category}-${colorId}`;
  return PRODUCT_MOCKUPS[key] || DEFAULT_MOCKUP;
}

export function getAvailableColors(product) {
  if (!product) return PRODUCT_COLORS;
  return PRODUCT_COLORS.filter((color) => {
    const key = `${product.category}-${color.id}`;
    return PRODUCT_MOCKUPS[key] || product.image_url;
  });
}

export function getProductThumbnail(product, colorId = 'white') {
  return getMockupForProduct(product, colorId).front;
}

export function dedupeCatalog(catalog) {
  const seen = new Set();
  return catalog.filter((item) => {
    const key = `${item.title}-${item.category}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const BLANK_PRODUCTS = [
  { id: 'blank-remera', title: 'Remera + Estampado', category: 'Remeras', description: 'Prenda en blanco para personalizar' },
  { id: 'blank-buzo', title: 'Buzos & Canguros', category: 'Buzos', description: 'Prenda en blanco para personalizar' },
];

export function resolveDesignProduct(productTitle, productId) {
  if (productId === 'blank-buzo') return BLANK_PRODUCTS[1];
  if (productId === 'blank-remera') return BLANK_PRODUCTS[0];

  const title = (productTitle || '').toLowerCase();
  if (title.includes('buzo') || title.includes('canguro') || title.includes('hoodie')) {
    return BLANK_PRODUCTS[1];
  }
  return BLANK_PRODUCTS[0];
}

export function createLayer(file, index = 0) {
  const offset = index * 6;
  return {
    id: crypto.randomUUID(),
    url: URL.createObjectURL(file),
    file,
    x: 50 + offset,
    y: 42 + offset,
    width: Math.max(20, 38 - index * 4),
    rotation: 0,
    scaleX: 1,
  };
}

export function clampDesign(d, bounds) {
  const half = d.width / 2;
  const minX = bounds.left + half * 0.35;
  const maxX = bounds.left + bounds.width - half * 0.35;
  const minY = bounds.top + 4;
  const maxY = bounds.top + bounds.height - 4;

  return {
    ...d,
    x: Math.min(maxX, Math.max(minX, d.x)),
    y: Math.min(maxY, Math.max(minY, d.y)),
    width: Math.min(80, Math.max(10, d.width)),
  };
}

export const HERO_BANNER_URL =
  'https://d22fxaf9t8d39k.cloudfront.net/4610590790c0fa083df8981c10420ab2aade6d1281caffd913626207c4aa416a273842.png';
