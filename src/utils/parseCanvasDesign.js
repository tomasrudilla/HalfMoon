/**
 * Parsea customer_comment de canvas_designs.
 * Soporta formatos legacy, doble-encoding del servidor, y multi-layer.
 */
export function parseCanvasDesign(customerComment) {
  if (!customerComment) {
    return { comment: 'Sin comentarios', layers: [], previewUrl: null };
  }

  let data = customerComment;

  for (let i = 0; i < 3; i++) {
    if (typeof data !== 'string') break;
    try {
      data = JSON.parse(data);
    } catch {
      return { comment: customerComment, layers: [], previewUrl: null };
    }
  }

  if (typeof data !== 'object' || data === null) {
    return { comment: String(customerComment), layers: [], previewUrl: null };
  }

  // Servidor antiguo: { comment: "{...json payload...}", logoData: "base64..." }
  if (typeof data.comment === 'string' && data.comment.trim().startsWith('{')) {
    try {
      const inner = JSON.parse(data.comment);
      data = {
        ...inner,
        logoData: data.logoData || inner.logoData,
      };
    } catch {
      /* usar data tal cual */
    }
  }

  const layers = [];

  if (Array.isArray(data.layers)) {
    data.layers.forEach((layer, i) => {
      if (!layer?.logoData) return;
      layers.push({
        index: layer.index ?? i + 1,
        fileName: layer.fileName || `Imagen ${i + 1}`,
        logoData: layer.logoData,
        transform: layer.transform || {},
      });
    });
  } else if (data.logoData) {
    layers.push({
      index: 1,
      fileName: 'Logo',
      logoData: data.logoData,
      transform: data.transform || {},
    });
  }

  let commentText = '';
  if (typeof data.comment === 'string' && !data.comment.trim().startsWith('{')) {
    commentText = data.comment;
  }

  return {
    comment: commentText || (layers.length ? `${layers.length} imagen${layers.length > 1 ? 'es' : ''} subida${layers.length > 1 ? 's' : ''}` : 'Sin comentarios'),
    layers,
    previewUrl: layers[0]?.logoData || null,
    view: data.view,
    color: data.color,
    productId: data.productId,
  };
}
