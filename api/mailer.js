const PLACEHOLDER_RE = /\{(\w+)\}|<(\w+)>/g;

/** Metadatos fijos de cada plantilla (tokens y defaults de respaldo). */
export const EMAIL_TEMPLATE_DEFS = {
  newsletter_welcome: {
    category: 'newsletter',
    label: 'Bienvenida al newsletter',
    description: 'Se envía al suscribirse desde el footer.',
    tokens: ['nombre', 'negocio'],
    defaults: {
      subject: '¡Bienvenido/a a la familia {negocio}!',
      title: 'Suscripción confirmada',
      body: '¡Bienvenido/a {nombre} a la familia {negocio}!\n\nYa estás suscripto/a: te vamos a avisar cuando haya nuevos ingresos y promociones exclusivas.\n\nSi no te suscribiste vos, ignorá este mail.',
    },
  },
  newsletter_promo: {
    category: 'newsletter',
    label: 'Newsletter / promoción',
    description: 'Plantilla base para campañas a suscriptos.',
    tokens: ['nombre', 'negocio'],
    defaults: {
      subject: 'Novedades de {negocio}',
      title: 'Hay novedades para vos',
      body: 'Hola {nombre}!\n\nQueremos contarte las novedades de {negocio}.\n\nSeguinos y respondé este mail si querés saber más.',
    },
  },
  design_saved: {
    category: 'transactional',
    label: 'Guardó su diseño',
    description: 'Mail al guardar un diseño (PNG adjunto).',
    tokens: ['nombre', 'cliente', 'prenda', 'negocio'],
    defaults: {
      subject: 'Tu diseño {negocio} — {prenda}',
      title: 'Tu diseño está listo',
      body: 'Hola {nombre}! Te adjuntamos el diseño que armaste en {prenda}. Guardalo y avisanos cuando quieras cotizarlo.',
    },
  },
  quote_requested: {
    category: 'transactional',
    label: 'Pidió presupuesto (web)',
    description: 'Acuse de recibo desde el personalizador.',
    tokens: ['nombre', 'cliente', 'prenda', 'cantidad', 'negocio'],
    defaults: {
      subject: 'Recibimos tu pedido de presupuesto — {negocio}',
      title: 'Presupuesto en camino',
      body: 'Hola {nombre}! Recibimos tu pedido de presupuesto por {cantidad} x {prenda}. Te contactamos en hasta 3 días hábiles.',
    },
  },
  quote_created: {
    category: 'transactional',
    label: 'Presupuesto generado',
    description: 'Mail al crear/reenviar un presupuesto desde el admin.',
    tokens: ['nombre', 'cliente', 'prenda', 'cantidad', 'total', 'sena', 'saldo', 'negocio'],
    defaults: {
      subject: 'Tu presupuesto — {negocio}',
      title: 'Presupuesto listo',
      body: 'Hola {nombre}! Te pasamos el presupuesto por {cantidad} x {prenda}: total {total}. Para reservar la producción queda pendiente una seña de {sena}. Cualquier duda respondé este mail.',
    },
  },
  order_in_production: {
    category: 'transactional',
    label: 'Pedido en producción',
    description: 'Cuando el pedido pasa a En Producción.',
    tokens: ['nombre', 'cliente', 'pedido', 'prenda', 'cantidad', 'negocio'],
    defaults: {
      subject: 'Tu pedido {pedido} está en producción — {negocio}',
      title: 'En producción',
      body: 'Hola {nombre}! Tu pedido {pedido} ({cantidad} x {prenda}) ya está en producción. Te avisamos cuando esté listo.',
    },
  },
  order_ready: {
    category: 'transactional',
    label: 'Pedido listo',
    description: 'Cuando el pedido pasa a Listo.',
    tokens: ['nombre', 'cliente', 'pedido', 'prenda', 'cantidad', 'negocio'],
    defaults: {
      subject: 'Tu pedido {pedido} está listo — {negocio}',
      title: 'Pedido listo',
      body: 'Hola {nombre}! Tu pedido {pedido} ({cantidad} x {prenda}) ya está listo. Coordinamos la entrega o el retiro.',
    },
  },
  order_delivered: {
    category: 'transactional',
    label: 'Pedido entregado',
    description: 'Cuando el pedido pasa a Entregado.',
    tokens: ['nombre', 'cliente', 'pedido', 'prenda', 'cantidad', 'negocio'],
    defaults: {
      subject: 'Entregamos tu pedido {pedido} — {negocio}',
      title: 'Entrega confirmada',
      body: 'Hola {nombre}! Tu pedido {pedido} ya fue entregado. Gracias por confiar en {negocio}.',
    },
  },
  admin_new_design: {
    category: 'transactional',
    label: 'Aviso interno (nuevo diseño)',
    description: 'Encabezado del mail interno a HalfMoon.',
    tokens: ['nombre', 'cliente', 'prenda', 'cantidad', 'negocio'],
    defaults: {
      subject: 'Nuevo movimiento web — {nombre}',
      title: 'Nuevo movimiento en la web',
      body: 'Nuevo movimiento en el personalizador web. Revisalo en el panel de administración.',
    },
  },
};

/** Compat con código viejo que leía TEMPLATE_DEFAULTS.msg_* */
export const TEMPLATE_DEFAULTS = {
  msg_design_saved: EMAIL_TEMPLATE_DEFS.design_saved.defaults.body,
  msg_quote_requested: EMAIL_TEMPLATE_DEFS.quote_requested.defaults.body,
  msg_quote_created: EMAIL_TEMPLATE_DEFS.quote_created.defaults.body,
  msg_admin_new_design: EMAIL_TEMPLATE_DEFS.admin_new_design.defaults.body,
};

export const ORDER_STATUS_TEMPLATE = {
  'En Producción': 'order_in_production',
  Listo: 'order_ready',
  Entregado: 'order_delivered',
};

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Reemplaza {token} o <token>; sin valor queda vacío. */
export function renderTemplate(template, vars = {}) {
  if (!template) return '';
  return String(template).replace(PLACEHOLDER_RE, (_match, brace, angle) => {
    const key = brace || angle;
    const value = vars[key];
    return value == null || value === '' ? '' : String(value);
  });
}

/** Une aliases nombre/cliente para que ambas variables funcionen. */
export function withNameAliases(vars = {}) {
  const nombre = vars.nombre || vars.cliente || '';
  const cliente = vars.cliente || vars.nombre || '';
  return { ...vars, nombre, cliente };
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

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convierte cuerpo plano + [texto](url) a HTML de párrafos. */
function bodyToHtml(body) {
  const withLinks = escapeHtml(body).replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" style="color:#059669;text-decoration:underline;" target="_blank" rel="noopener">$1</a>'
  );

  return withLinks
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => `<p style="margin:0 0 14px;line-height:1.6;color:#334155;">${line}</p>`)
    .join('');
}

/** Envuelve el contenido en el HTML de marca (header / imagen / CTA / footer). */
export function wrapHtml({
  businessName,
  title,
  body,
  footer,
  imageUrl,
  ctaUrl,
  ctaLabel,
}) {
  const paragraphs = bodyToHtml(body);
  const safeTitle = escapeHtml(title);
  const safeBrand = escapeHtml(businessName);
  const safeFooter = escapeHtml(
    footer || `${businessName} · Indumentaria y estampados · Córdoba, Argentina`
  );

  const imageBlock =
    imageUrl && /^https?:\/\//i.test(imageUrl)
      ? `<div style="margin:0 0 20px;">
          <img src="${escapeHtml(imageUrl)}" alt="" style="display:block;width:100%;max-width:504px;height:auto;border-radius:8px;" />
        </div>`
      : '';

  const ctaBlock =
    ctaUrl && ctaLabel && /^https?:\/\//i.test(ctaUrl)
      ? `<div style="margin:8px 0 4px;">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:8px;" target="_blank" rel="noopener">${escapeHtml(ctaLabel)}</a>
        </div>`
      : '';

  return `<!DOCTYPE html><html lang="es"><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0f172a;padding:20px 28px;">
      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.04em;">${safeBrand}</span>
    </div>
    <div style="padding:28px;">
      ${title ? `<h1 style="margin:0 0 16px;font-size:19px;color:#0f172a;">${safeTitle}</h1>` : ''}
      ${imageBlock}
      ${paragraphs}
      ${ctaBlock}
    </div>
    <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <span style="font-size:12px;color:#64748b;">${safeFooter}</span>
    </div>
  </div>
</body></html>`;
}

/**
 * Envía un mail. Nunca lanza: devuelve { sent, skipped, error }.
 */
export async function sendMail({
  settings = {},
  to,
  subject,
  body,
  title,
  imageUrl,
  ctaUrl,
  ctaLabel,
  attachments = [],
}) {
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
      html: wrapHtml({
        businessName,
        title,
        body,
        imageUrl,
        ctaUrl,
        ctaLabel,
      }),
      attachments,
    });
    return { sent: true, skipped: false };
  } catch (error) {
    console.error('[email] fallo enviando a', to, error.message);
    return { sent: false, skipped: false, error: error.message };
  }
}

export async function loadEmailTemplate(pool, slug) {
  const def = EMAIL_TEMPLATE_DEFS[slug];
  try {
    const result = await pool.query('SELECT * FROM email_templates WHERE slug = $1', [slug]);
    const row = result.rows[0];
    if (row) {
      return {
        ...row,
        tokens: def?.tokens || [],
        label: row.label || def?.label || slug,
        description: row.description || def?.description || '',
      };
    }
  } catch (error) {
    console.warn('[email] no se pudo leer plantilla', slug, error.message);
  }

  if (!def) return null;
  return {
    slug,
    category: def.category,
    label: def.label,
    description: def.description,
    subject: def.defaults.subject,
    title: def.defaults.title,
    body: def.defaults.body,
    image_url: null,
    cta_url: null,
    cta_label: null,
    enabled: true,
    tokens: def.tokens,
  };
}

/**
 * Carga la plantilla, renderiza variables y manda el mail.
 * Si la plantilla está deshabilitada, saltea el envío.
 */
export async function sendTemplatedMail({
  pool,
  slug,
  to,
  vars = {},
  settings,
  attachments = [],
  extraBodyLines = [],
}) {
  const tpl = await loadEmailTemplate(pool, slug);
  if (!tpl) return { sent: false, skipped: true, reason: 'plantilla-inexistente' };
  if (tpl.enabled === false) return { sent: false, skipped: true, reason: 'plantilla-deshabilitada' };

  const cfg = settings || (await loadSettings(pool));
  const merged = withNameAliases({
    negocio: cfg.business_name || 'HalfMoon',
    ...vars,
  });

  let body = renderTemplate(tpl.body, merged);
  if (extraBodyLines.length) {
    body = [body, '', ...extraBodyLines.filter(Boolean)].join('\n');
  }

  return sendMail({
    settings: cfg,
    to,
    subject: renderTemplate(tpl.subject, merged),
    title: renderTemplate(tpl.title, merged),
    body,
    imageUrl: tpl.image_url || undefined,
    ctaUrl: tpl.cta_url || undefined,
    ctaLabel: tpl.cta_label || undefined,
    attachments,
  });
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
