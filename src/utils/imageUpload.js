export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export async function readImageFile(file, maxMb = 2) {
  if (!file) return null;
  if (!file.type.startsWith('image/')) throw new Error('Solo se permiten imágenes.');
  if (file.size > maxMb * 1024 * 1024) throw new Error(`La imagen no puede superar ${maxMb} MB.`);
  return fileToDataUrl(file);
}
