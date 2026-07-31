const PLACEHOLDER_RE = /\{(\w+)\}/g;

export const TEMPLATE_DEFAULTS = {
  msg_design_saved:
    'Hola {cliente}! Te adjuntamos el diseño que armaste en {prenda}. Guardalo y avisanos cuando quieras cotizarlo.',
  msg_quote_requested:
    'Hola {cliente}! Recibimos tu pedido de presupuesto por {cantidad} x {prenda}. Te contactamos en hasta 3 días hábiles.',
  msg_quote_created:
    'Hola {cliente}! Te pasamos el presupuesto por {cantidad} x {prenda}: total {total}. Queda pendiente una seña de {sena}.',
  msg_admin_new_design: 'Nuevo movimiento en el personalizador web.',
};

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Reemplaza {placeholders} por sus valores; los que no tienen dato quedan vacíos. */
export function renderTemplate(template, vars = {}) {
  if (!template) return '';
  return template.replace(PLACEHOLDER_RE, (match, key) => {
    const value = vars[key];
    return value == null || value === '' ? '' : String(value);
  });
}

export function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return '';
  return `$${n.toLocaleString('es-AR')}`;
}

let cachedTransporter = null;

async function getTransporter() {
  if (!isSmtpConfigured()) return null;
  if (cachedTransporter) return cachedTransporter;
  const { default: nodemailer } = await import('nodemailer');
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cachedTransporter;
}

export async function loadSettings(pool) {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    return result.rows[0] || {};
  } catch {
    return {};
  }
}

/** Envuelve el texto plano en un HTML sobrio con la identidad de la marca. */
function wrapHtml({ businessName, title, body, footer }) {
  const paragraphs = String(body || '')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => `<p style="margin:0 0 14px;line-height:1.6;color:#334155;">${line}</p>`)
    .join('');

  return `<!DOCTYPE html><html lang="es"><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0f172a;padding:20px 28px;">
      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.04em;">${businessName}</span>
    </div>
    <div style="padding:28px;">
      ${title ? `<h1 style="margin:0 0 16px;font-size:19px;color:#0f172a;">${title}</h1>` : ''}
      ${paragraphs}
    </div>
    <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <span style="font-size:12px;color:#64748b;">${footer || `${businessName} · Indumentaria y estampados · Córdoba, Argentina`}</span>
    </div>
  </div>
</body></html>`;
}

/**
 * Envía un mail. Nunca lanza: devuelve { sent, skipped, error } para que el
 * flujo de negocio siga aunque el SMTP esté caído o sin configurar.
 */
export async function sendMail({ settings = {}, to, subject, body, title, attachments = [] }) {
  if (!to) return { sent: false, skipped: true, reason: 'sin-destinatario' };

  const transporter = await getTransporter();
  if (!transporter) {
    console.warn('[email] SMTP no configurado — se omite el envío a', to);
    return { sent: false, skipped: true, reason: 'smtp-no-configurado' };
  }

  const businessName = settings.business_name || 'HalfMoon';
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await transporter.sendMail({
      from: `"${businessName}" <${from}>`,
      to,
      replyTo: settings.support_email || undefined,
      subject,
      text: body,
      html: wrapHtml({ businessName, title, body }),
      attachments,
    });
    return { sent: true, skipped: false };
  } catch (error) {
    console.error('[email] fallo enviando a', to, error.message);
    return { sent: false, skipped: false, error: error.message };
  }
}

/** Adjunto PNG a partir de un data URL del canvas. */
export function pngAttachment(pngBase64, filename = 'halfmoon-diseno.png') {
  if (!pngBase64) return null;
  return {
    filename,
    content: pngBase64.replace(/^data:image\/png;base64,/, ''),
    encoding: 'base64',
  };
}
