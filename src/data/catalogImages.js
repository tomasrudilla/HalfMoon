/** Imágenes del catálogo para preview y lightbox */
export const GALLERY_IMAGES = [
  '/gallery/estilo-1.png',
  '/gallery/estilo-2.png',
  '/gallery/estilo-3.png',
  '/gallery/estilo-4.png',
  '/gallery/estilo-5.png',
  '/gallery/estilo-6.png',
];

const CATALOG_PHOTOS = {
  'REMERA + ESTAMPADO': [
    '/mockups/remera-blanca.png',
    '/mockups/remera-negra.png',
    '/gallery/estilo-6.png',
    '/gallery/estilo-1.png',
  ],
  'BUZOS & CANGUROS': [
    '/mockups/buzo-blanco.png',
    '/mockups/buzo-negro.png',
    '/gallery/estilo-5.png',
    '/gallery/estilo-3.png',
  ],
};

export function getCatalogPhotos(item) {
  if (item?.image_url) {
    const extras = item.image_gallery ? JSON.parse(item.image_gallery) : [];
    return [item.image_url, ...extras];
  }
  const key = item?.title?.toUpperCase();
  return CATALOG_PHOTOS[key] || CATALOG_PHOTOS['REMERA + ESTAMPADO'];
}
