const MOCKUP_BASE = '/mockups';

export const PRODUCT_COLORS = [
  { id: 'white', label: 'Blanco', hex: '#ffffff' },
  { id: 'black', label: 'Negro', hex: '#1a1a1a' },
];

/** Zona draggable sobre la prenda (porcentaje del canvas) */
export const SHIRT_BOUNDS = {
  Remeras: { top: 8, left: 14, width: 72, height: 82 },
  Buzos: { top: 6, left: 12, width: 76, height: 86 },
  Abrigos: { top: 8, left: 14, width: 72, height: 82 },
  Accesorios: { top: 10, left: 16, width: 68, height: 80 },
};

export const CATEGORY_OPTIONS = Object.keys(SHIRT_BOUNDS);

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

function parseBounds(bounds, category) {
  if (bounds && typeof bounds === 'object') return bounds;
  if (typeof bounds === 'string') {
    try {
      return JSON.parse(bounds);
    } catch {
      /* ignore */
    }
  }
  return SHIRT_BOUNDS[category] || SHIRT_BOUNDS.Remeras;
}

export function slugifyProductKey(title) {
  return String(title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'prenda';
}

/** Agrupa filas planas de canvas_catalog_items en productos con variantes de color */
export function groupCanvasCatalog(rows = []) {
  const map = new Map();
  for (const row of rows) {
    const key = row.title;
    if (!map.has(key)) {
      map.set(key, {
        id: `canvas-${slugifyProductKey(row.title)}`,
        title: row.title,
        category: row.category,
        description: 'Prenda en blanco para personalizar',
        variants: [],
        sort_order: row.sort_order ?? 0,
        is_active: row.is_active !== false,
      });
    }
    const group = map.get(key);
    group.variants.push({
      id: row.id,
      color_id: row.color_id,
      color_label: row.color_label,
      color_hex: row.color_hex || '#ffffff',
      image_front_url: row.image_front_url,
      image_back_url: row.image_back_url || row.image_front_url,
      shirt_bounds: parseBounds(row.shirt_bounds, row.category),
      slug: row.slug,
      is_active: row.is_active !== false,
      sort_order: row.sort_order ?? 0,
    });
    group.sort_order = Math.min(group.sort_order, row.sort_order ?? 0);
    if (row.is_active === false) group.is_active = false;
  }

  for (const group of map.values()) {
    group.variants.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  }

  return [...map.values()].sort((a, b) => a.sort_order - b.sort_order);
}

export function getMockupForProduct(product, colorId = 'white') {
  if (!product) return DEFAULT_MOCKUP;

  if (product.variants?.length) {
    const variant =
      product.variants.find((v) => v.color_id === colorId) || product.variants[0];
    return {
      front: variant.image_front_url,
      back: variant.image_back_url || variant.image_front_url,
      shirtBounds:
        variant.shirt_bounds ||
        SHIRT_BOUNDS[product.category] ||
        SHIRT_BOUNDS.Remeras,
    };
  }

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
  if (product?.variants?.length) {
    return product.variants.map((v) => ({
      id: v.color_id,
      label: v.color_label,
      hex: v.color_hex || '#ffffff',
    }));
  }
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

export function resolveDesignProduct(productTitle, productId, catalogProducts = []) {
  if (catalogProducts.length) {
    const byId = catalogProducts.find((p) => p.id === productId);
    if (byId) return byId;
    const byTitle = catalogProducts.find(
      (p) => p.title?.toLowerCase() === String(productTitle || '').toLowerCase()
    );
    if (byTitle) return byTitle;
  }

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
