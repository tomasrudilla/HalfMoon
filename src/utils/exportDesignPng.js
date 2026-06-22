export async function exportDesignToPng({ mockupSrc, layers, width = 900, height = 900 }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo cargar una imagen del diseño'));
      img.src = src;
    });

  const mockup = await loadImage(mockupSrc);
  ctx.drawImage(mockup, 0, 0, width, height);

  for (const layer of layers) {
    const img = await loadImage(layer.url);
    const cx = (layer.x / 100) * width;
    const cy = (layer.y / 100) * height;
    const layerW = (layer.width / 100) * width;
    const aspect = img.height / img.width || 1;
    const layerH = layerW * aspect;
    const rotation = ((layer.rotation || 0) * Math.PI) / 180;
    const scaleX = layer.scaleX ?? 1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.scale(scaleX, 1);
    ctx.drawImage(img, -layerW / 2, -layerH / 2, layerW, layerH);
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl, filename = 'halfmoon-diseno.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
