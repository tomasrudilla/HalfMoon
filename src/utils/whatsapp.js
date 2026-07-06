const DEFAULT_SETTINGS = {
  business_name: 'HalfMoon Indumentaria',
  support_email: 'halfmooncba@gmail.com',
  whatsapp_number: '5493516668259',
  whatsapp_message: '¡Hola! Quiero consultar por presupuesto.',
  catalog_visible: false,
};

export function buildWhatsAppUrl(number, message) {
  const clean = String(number || '').replace(/\D/g, '');
  if (!clean) return 'https://wa.me/';
  const text = encodeURIComponent(message || DEFAULT_SETTINGS.whatsapp_message);
  return `https://wa.me/${clean}?text=${text}`;
}

export { DEFAULT_SETTINGS };
