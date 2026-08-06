import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import pg from 'pg';
import { registerContentRoutes } from './contentRoutes.js';
import { registerAuthRoutes, createApiGuard, readSession } from './auth.js';
import {
  loadSettings,
  sendTemplatedMail,
  renderTemplate,
  formatMoney,
  pngAttachment,
  isSmtpConfigured,
  EMAIL_TEMPLATE_DEFS,
  ORDER_STATUS_TEMPLATE,
  withNameAliases,
  wrapHtml,
} from './mailer.js';

dotenv.config();

const app = express();
app.use(cors()); 
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const { Pool } = pg;

// Conexión a Neon con configuración de seguridad optimizada
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Lo único que puede pedir alguien sin sesión: lo que consume la web pública.
// Las lecturas son las del catálogo y el contenido del sitio; las escrituras
// son las tres cosas que un visitante puede hacer desde el personalizador
// (dejar sus datos, guardar un diseño y pedir presupuesto).
const PUBLIC_ROUTES = [
  'GET /api/estado',
  'GET /api/settings',
  'GET /api/productos',
  'GET /api/faqs',
  'GET /api/servicios',
  'GET /api/trabajos',
  'GET /api/clientes',
  'GET /api/canvas-catalog',
  'POST /api/leads',
  'POST /api/newsletter',
  'POST /api/canvas-designs',
  'POST /api/quotes',
  'POST /api/send-design-email',
];

registerAuthRoutes(app, pool);
app.use(createApiGuard(PUBLIC_ROUTES));

// --- RUTAS DE LA API ---

// 1. Estado de conexión
app.get('/api/estado', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ estado: 'Conectado a Neon exitosamente 🚀' });
  } catch (error) {
    res.status(500).json({ error: 'Error de conexión: ' + error.message });
  }
});

// 2. Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const leads = await pool.query('SELECT COUNT(*) FROM leads');
    const designs = await pool.query('SELECT COUNT(*) FROM canvas_designs');
    const orders = await pool.query("SELECT COUNT(*) FROM orders WHERE status != 'Entregado'");
    const revenue = await pool.query("SELECT SUM(total_price) FROM orders WHERE status IN ('Listo', 'En Producción')");
    let quotesPending = { count: 0 };
    try {
      quotesPending = (await pool.query("SELECT COUNT(*) FROM quotes WHERE status = 'Pendiente'")).rows[0];
    } catch { /* tabla puede no existir aún */ }

    res.json({
      leadsTotales: leads.rows[0].count,
      disenosTotales: designs.rows[0].count,
      pedidosPendientes: orders.rows[0].count,
      ingresosProyectados: revenue.rows[0].sum || 0,
      presupuestosPendientes: quotesPending.count || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Leads (GET, POST & PUT)
app.get('/api/leads', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM leads';
    const params = [];
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/leads', async (req, res) => {
  const { nombre, telefono, email, status, origin } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO leads (full_name, phone, email, origin, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [nombre, telefono, email, origin || 'Canvas Web', status || 'Prospecto']
    );
    res.json({ success: true, leadId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Newsletter — Unite a la familia HalfMoon (footer)
app.post('/api/newsletter', async (req, res) => {
  const raw = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const email = raw.toLowerCase();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!emailOk) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM newsletter_subscribers WHERE lower(email) = $1 LIMIT 1',
      [email]
    );
    if (existing.rowCount > 0) {
      return res.status(409).json({
        error: 'Este email ya está suscripto',
        code: 'already_subscribed',
      });
    }

    const inserted = await pool.query(
      'INSERT INTO newsletter_subscribers (email) VALUES ($1) RETURNING id, email, created_at',
      [email]
    );

    const settings = await loadSettings(pool);
    const emailResult = await sendTemplatedMail({
      pool,
      slug: 'newsletter_welcome',
      to: email,
      settings,
      vars: { nombre: email.split('@')[0] || '' },
    });

    res.json({
      success: true,
      subscriber: inserted.rows[0],
      email: emailResult,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Este email ya está suscripto',
        code: 'already_subscribed',
      });
    }
    console.error('[newsletter]', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/newsletter', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, created_at FROM newsletter_subscribers ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/newsletter/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM newsletter_subscribers WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Suscriptor no encontrado' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, email, origin, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE leads SET full_name = $1, phone = $2, email = $3, origin = $4, status = COALESCE($5, status) WHERE id = $6 RETURNING *',
      [full_name, phone, email, origin, status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const hasOrders = await client.query('SELECT 1 FROM orders WHERE lead_id = $1 LIMIT 1', [id]);
    if (hasOrders.rowCount > 0) {
      return res.status(409).json({ error: 'Tiene pedidos asociados. Borrá primero el pedido.' });
    }
    await client.query('BEGIN');
    await client.query('DELETE FROM quotes WHERE lead_id = $1', [id]);
    await client.query('DELETE FROM canvas_designs WHERE lead_id = $1', [id]);
    await client.query('DELETE FROM leads WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// 4. Canvas Designs (GET, POST & DELETE)
app.get('/api/canvas-designs', async (req, res) => {
  try {
    // origin distingue el diseño que sólo se guardó del que vino con pedido
    // de presupuesto (el personalizador crea un design en ambos casos).
    const query = `
      SELECT d.*, d.product AS product_title, l.full_name as creator,
             l.phone AS creator_phone, l.email AS creator_email,
             q.id AS quote_id, q.status AS quote_status,
             q.quantity AS quote_quantity, q.admin_price AS quote_price,
             CASE WHEN q.id IS NULL THEN 'save' ELSE 'quote' END AS origin
      FROM canvas_designs d
      INNER JOIN leads l ON d.lead_id = l.id
      LEFT JOIN quotes q ON q.design_id = d.id
      ORDER BY d.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/canvas-designs', async (req, res) => {
  const { leadId, product, bgColor, customerComment, logoData } = req.body;
  try {
    let comment = customerComment || null;
    if (!comment && logoData) {
      comment = JSON.stringify({ comment: '', logoData });
    }
    const result = await pool.query(
      `INSERT INTO canvas_designs (lead_id, product, bg_color, customer_comment)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [leadId, product || 'Remera + Estampado', bgColor || '#f1f5f9', comment]
    );
    res.json({ success: true, designId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/canvas-designs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM canvas_designs WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Settings (GET & POST)
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', async (req, res) => {
  const {
    business_name, support_email, whatsapp_number, whatsapp_message,
    notify_new_leads, notify_orders, catalog_visible,
    msg_design_saved, msg_quote_requested, msg_quote_created,
    msg_admin_new_design, msg_wpp_quote, notify_quote_email,
    msg_personalizer_save, msg_personalizer_quote,
  } = req.body;
  try {
    await pool.query(
      `UPDATE settings SET 
        business_name = $1, support_email = $2, whatsapp_number = $3, 
        whatsapp_message = $4, notify_new_leads = $5, notify_orders = $6,
        catalog_visible = COALESCE($7, catalog_visible),
        msg_design_saved = COALESCE($8, msg_design_saved),
        msg_quote_requested = COALESCE($9, msg_quote_requested),
        msg_quote_created = COALESCE($10, msg_quote_created),
        msg_admin_new_design = COALESCE($11, msg_admin_new_design),
        msg_wpp_quote = COALESCE($12, msg_wpp_quote),
        notify_quote_email = COALESCE($13, notify_quote_email),
        msg_personalizer_save = COALESCE($14, msg_personalizer_save),
        msg_personalizer_quote = COALESCE($15, msg_personalizer_quote)
       WHERE id = 1`,
      [
        business_name, support_email, whatsapp_number, whatsapp_message,
        notify_new_leads, notify_orders, catalog_visible,
        msg_design_saved ?? null, msg_quote_requested ?? null, msg_quote_created ?? null,
        msg_admin_new_design ?? null, msg_wpp_quote ?? null,
        typeof notify_quote_email === 'boolean' ? notify_quote_email : null,
        msg_personalizer_save ?? null, msg_personalizer_quote ?? null,
      ]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** Indica si el servidor puede mandar mails (para avisar en el panel). */
app.get('/api/email/status', (req, res) => {
  res.json({ configured: isSmtpConfigured() });
});

// Plantillas de mail (newsletter + operativos)
app.get('/api/email-templates', async (req, res) => {
  try {
    const { category } = req.query;
    let rows = [];
    try {
      const result = await pool.query(
        `SELECT * FROM email_templates
         ${category ? 'WHERE category = $1' : ''}
         ORDER BY category ASC, label ASC`,
        category ? [category] : []
      );
      rows = result.rows;
    } catch {
      rows = [];
    }

    const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r]));
    const list = Object.entries(EMAIL_TEMPLATE_DEFS).map(([slug, def]) => {
      const row = bySlug[slug];
      if (category && def.category !== category) return null;
      return {
        slug,
        category: def.category,
        label: row?.label || def.label,
        description: row?.description || def.description,
        subject: row?.subject ?? def.defaults.subject,
        title: row?.title ?? def.defaults.title,
        body: row?.body ?? def.defaults.body,
        image_url: row?.image_url || '',
        cta_url: row?.cta_url || '',
        cta_label: row?.cta_label || '',
        enabled: row ? row.enabled !== false : true,
        tokens: def.tokens,
        updated_at: row?.updated_at || null,
      };
    }).filter(Boolean);

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/email-templates/:slug', async (req, res) => {
  const { slug } = req.params;
  const def = EMAIL_TEMPLATE_DEFS[slug];
  if (!def) return res.status(404).json({ error: 'Plantilla desconocida' });

  const {
    subject,
    title,
    body,
    image_url,
    cta_url,
    cta_label,
    enabled,
    label,
    description,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO email_templates
         (slug, category, label, description, subject, title, body, image_url, cta_url, cta_label, enabled, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,CURRENT_TIMESTAMP)
       ON CONFLICT (slug) DO UPDATE SET
         label = EXCLUDED.label,
         description = EXCLUDED.description,
         subject = EXCLUDED.subject,
         title = EXCLUDED.title,
         body = EXCLUDED.body,
         image_url = EXCLUDED.image_url,
         cta_url = EXCLUDED.cta_url,
         cta_label = EXCLUDED.cta_label,
         enabled = EXCLUDED.enabled,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        slug,
        def.category,
        label || def.label,
        description || def.description,
        subject ?? def.defaults.subject,
        title ?? def.defaults.title,
        body ?? def.defaults.body,
        image_url || null,
        cta_url || null,
        cta_label || null,
        typeof enabled === 'boolean' ? enabled : true,
      ]
    );

    res.json({
      ...result.rows[0],
      tokens: def.tokens,
      image_url: result.rows[0].image_url || '',
      cta_url: result.rows[0].cta_url || '',
      cta_label: result.rows[0].cta_label || '',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/email-templates/:slug/preview', async (req, res) => {
  const { slug } = req.params;
  const def = EMAIL_TEMPLATE_DEFS[slug];
  if (!def) return res.status(404).json({ error: 'Plantilla desconocida' });

  try {
    const settings = await loadSettings(pool);
    const businessName = settings.business_name || 'HalfMoon';
    const sample = withNameAliases({
      nombre: 'Santiago',
      cliente: 'Santiago',
      prenda: 'Remeras',
      cantidad: 10,
      total: '$150.000',
      sena: '$50.000',
      saldo: '$100.000',
      pedido: 'ORD-001',
      negocio: businessName,
      ...(req.body?.vars || {}),
    });

    const subject = renderTemplate(req.body?.subject ?? def.defaults.subject, sample);
    const title = renderTemplate(req.body?.title ?? def.defaults.title, sample);
    const body = renderTemplate(req.body?.body ?? def.defaults.body, sample);

    res.json({
      subject,
      title,
      body,
      html: wrapHtml({
        businessName,
        title,
        body,
        imageUrl: req.body?.image_url || undefined,
        ctaUrl: req.body?.cta_url || undefined,
        ctaLabel: req.body?.cta_label || undefined,
      }),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Catálogo de Productos (GET, POST, PUT, DELETE)
app.get('/api/productos', async (req, res) => {
  try {
    // Sin sesión sólo se ven los productos publicados, aunque no manden ?public=1.
    const publicOnly = req.query.public === '1' || !readSession(req);
    const query = publicOnly
      ? 'SELECT * FROM catalog_items WHERE is_active IS NOT FALSE ORDER BY id DESC'
      : 'SELECT * FROM catalog_items ORDER BY id DESC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/productos', async (req, res) => {
  const { title, category, stock, price, promo_price, description, image_1, image_2, image_3, image_4 } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO catalog_items (title, category, stock, price, promo_price, description, image_1, image_2, image_3, image_4) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [title, category, stock, price, promo_price, description, image_1, image_2, image_3, image_4]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  const { title, category, stock, price, promo_price, description, image_1, image_2, image_3, image_4 } = req.body;
  try {
    const result = await pool.query(
      `UPDATE catalog_items SET 
        title = $1, category = $2, stock = $3, price = $4, promo_price = $5, 
        description = $6, image_1 = $7, image_2 = $8, image_3 = $9, image_4 = $10 
       WHERE id = $11 RETURNING *`,
      [title, category, stock, price, promo_price, description, image_1, image_2, image_3, image_4, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM catalog_items WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Pedidos / Producción (GET, POST, PUT, DELETE)
app.get('/api/orders/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH pay AS (
        SELECT order_id, COALESCE(SUM(amount), 0) AS paid_total
        FROM order_payments
        GROUP BY order_id
      ),
      order_stats AS (
        SELECT
          COUNT(*) FILTER (WHERE o.status = 'Pendiente') AS pendientes,
          COUNT(*) FILTER (WHERE o.status = 'En Producción') AS en_produccion,
          COUNT(*) FILTER (WHERE o.status IN ('Listo', 'Listo / Esperando')) AS listos,
          COUNT(*) FILTER (WHERE o.status = 'Entregado') AS entregados,
          COUNT(*) FILTER (WHERE o.status != 'Entregado') AS activos,
          COUNT(*) AS total_pedidos,
          COALESCE(SUM(o.total_price) FILTER (WHERE o.status != 'Entregado'), 0) AS pipeline_total,
          COALESCE(SUM(o.total_price) FILTER (WHERE o.status = 'Entregado'), 0) AS ingresos_entregados,
          COALESCE(SUM(COALESCE(p.paid_total, 0)), 0) AS cobrado_total,
          COALESCE(SUM(GREATEST(o.total_price - COALESCE(p.paid_total, 0), 0))
            FILTER (WHERE o.status != 'Entregado'), 0) AS saldo_activo,
          COALESCE(SUM(COALESCE(p.paid_total, 0)) FILTER (WHERE o.status != 'Entregado'), 0) AS cobrado_activos
        FROM orders o
        LEFT JOIN pay p ON p.order_id = o.id
      ),
      quote_stats AS (
        SELECT
          COUNT(*) FILTER (
            WHERE status NOT IN ('Cerrado', 'Aprobado') AND COALESCE(deposit_paid, false) = false
          ) AS presupuestos_abiertos,
          COUNT(*) FILTER (
            WHERE deposit_amount IS NOT NULL AND deposit_amount > 0 AND COALESCE(deposit_paid, false) = false
              AND status NOT IN ('Cerrado')
          ) AS senas_pendientes,
          COALESCE(SUM(deposit_amount) FILTER (WHERE deposit_paid = true), 0) AS senas_cobradas
        FROM quotes
      )
      SELECT order_stats.*, quote_stats.*
      FROM order_stats, quote_stats
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*,
             l.full_name AS client_name,
             l.phone AS client_phone,
             l.email AS client_email,
             d.product AS product_title,
             q.status AS quote_status,
             q.admin_price AS quote_price,
             COALESCE(pay.paid_total, 0) AS paid_total,
             -- "Hoy" se calcula en hora de Córdoba: si no, una entrega cargada
             -- de noche caería en el día siguiente por el desfase con UTC.
             (o.status = 'Entregado'
              AND (o.delivered_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Cordoba')::date
                  = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Cordoba')::date
             ) AS delivered_today
      FROM orders o
      LEFT JOIN leads l ON o.lead_id = l.id
      LEFT JOIN canvas_designs d ON o.design_id = d.id
      LEFT JOIN quotes q ON o.quote_id = q.id
      LEFT JOIN (
        SELECT order_id, SUM(amount) AS paid_total
        FROM order_payments
        GROUP BY order_id
      ) pay ON pay.order_id = o.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function nextOrderCode(client) {
  const db = client || pool;
  const result = await db.query(`
    SELECT COALESCE(MAX(
      CASE WHEN order_code ~ '^ORD-[0-9]+$'
      THEN CAST(SUBSTRING(order_code FROM 5) AS INTEGER) ELSE 0 END
    ), 0) + 1 AS next_num FROM orders
  `);
  return `ORD-${String(result.rows[0].next_num).padStart(3, '0')}`;
}

app.post('/api/orders', async (req, res) => {
  const {
    lead_id,
    design_id,
    quote_id,
    quantity,
    total_price,
    status,
    delivery_date,
    payment_mode,
    deposit_amount,
    installments_count,
    payment_notes,
    description,
    product_type,
    color,
  } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderCode = await nextOrderCode(client);
    const result = await client.query(
      `INSERT INTO orders (
         order_code, lead_id, design_id, quote_id, quantity, total_price, status, delivery_date,
         payment_mode, deposit_amount, installments_count, payment_notes,
         description, product_type, color
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        orderCode,
        lead_id || null,
        design_id || null,
        quote_id || null,
        quantity || 1,
        total_price || 0,
        status || 'Pendiente',
        delivery_date || null,
        payment_mode || 'negociable',
        deposit_amount != null && deposit_amount !== '' ? Number(deposit_amount) : null,
        installments_count != null && installments_count !== '' ? Number(installments_count) : null,
        payment_notes || null,
        description || null,
        product_type || null,
        color || null,
      ]
    );
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const {
    lead_id,
    design_id,
    quote_id,
    quantity,
    total_price,
    status,
    delivery_date,
    payment_mode,
    deposit_amount,
    installments_count,
    payment_notes,
    description,
    product_type,
    color,
  } = req.body;
  try {
    const prevRes = await pool.query(
      `SELECT o.status, o.order_code, o.quantity, o.product_type,
              l.full_name AS client_name, l.email AS client_email
       FROM orders o
       LEFT JOIN leads l ON o.lead_id = l.id
       WHERE o.id = $1`,
      [id]
    );
    const previous = prevRes.rows[0];

    const result = await pool.query(
      `UPDATE orders SET
         lead_id = $1,
         design_id = $2,
         quote_id = $3,
         quantity = $4,
         total_price = $5,
         status = $6,
         delivery_date = $7,
         payment_mode = $8,
         deposit_amount = $9,
         installments_count = $10,
         payment_notes = $11,
         description = $12,
         product_type = $13,
         color = $14,
         -- $16 repite el estado como texto: Postgres no puede inferir el tipo
         -- de $6 si se usa a la vez como valor de columna y en una comparación.
         delivered_at = CASE
           WHEN $16 = 'Entregado' AND delivered_at IS NULL THEN CURRENT_TIMESTAMP
           WHEN $16 <> 'Entregado' THEN NULL
           ELSE delivered_at
         END
       WHERE id = $15 RETURNING *`,
      [
        lead_id || null,
        design_id || null,
        quote_id || null,
        quantity || 1,
        total_price || 0,
        status || 'Pendiente',
        delivery_date || null,
        payment_mode || 'negociable',
        deposit_amount != null && deposit_amount !== '' ? Number(deposit_amount) : null,
        installments_count != null && installments_count !== '' ? Number(installments_count) : null,
        payment_notes || null,
        description || null,
        product_type || null,
        color || null,
        id,
        String(status || 'Pendiente'),
      ]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });

    const order = result.rows[0];
    const newStatus = String(status || 'Pendiente');
    const statusSlug = ORDER_STATUS_TEMPLATE[newStatus];
    if (
      statusSlug &&
      previous &&
      previous.status !== newStatus &&
      previous.client_email
    ) {
      const settings = await loadSettings(pool);
      if (settings.notify_orders !== false) {
        sendTemplatedMail({
          pool,
          slug: statusSlug,
          to: previous.client_email,
          settings,
          vars: {
            nombre: previous.client_name || '',
            cliente: previous.client_name || '',
            pedido: order.order_code || previous.order_code || '',
            prenda: order.product_type || previous.product_type || 'prendas',
            cantidad: order.quantity || previous.quantity || 1,
          },
        }).catch((err) => console.error('[email] order status', err.message));
      }
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/:id/payments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM order_payments WHERE order_id = $1 ORDER BY paid_at ASC, id ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/:id/payments', async (req, res) => {
  try {
    const { amount, payment_type, installment_number, method, notes, paid_at } = req.body;
    if (amount == null || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }
    const result = await pool.query(
      `INSERT INTO order_payments
        (order_id, amount, payment_type, installment_number, method, notes, paid_at)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::timestamp, CURRENT_TIMESTAMP))
       RETURNING *`,
      [
        req.params.id,
        Number(amount),
        payment_type || 'pago',
        installment_number || null,
        method || null,
        notes || null,
        paid_at || null,
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/orders/:id/payments/:paymentId', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM order_payments WHERE id = $1 AND order_id = $2`,
      [req.params.paymentId, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Envío de diseño por email (personalizador)
// Manda dos mails: el diseño en PNG al cliente y el aviso interno a HalfMoon
// con los datos de quién lo armó. Nunca bloquea el guardado del diseño.
app.post('/api/send-design-email', async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    productTitle,
    colorLabel,
    quantity,
    notes,
    pngBase64,
    mode = 'save',
  } = req.body;

  try {
    const settings = await loadSettings(pool);
    const businessEmail = settings.support_email || process.env.SMTP_FROM || process.env.SMTP_USER;
    const isQuote = mode === 'quote';

    const attachment = pngAttachment(
      pngBase64,
      `halfmoon-${(customerName || 'diseno').toLowerCase().replace(/\s+/g, '-')}.png`
    );
    const attachments = attachment ? [attachment] : [];

    const vars = {
      nombre: customerName || '',
      cliente: customerName || '',
      prenda: productTitle || 'prenda personalizada',
      cantidad: quantity || 1,
    };

    const customerResult = await sendTemplatedMail({
      pool,
      slug: isQuote ? 'quote_requested' : 'design_saved',
      to: customerEmail,
      settings,
      vars,
      attachments,
    });

    const adminResult =
      businessEmail && businessEmail !== customerEmail
        ? await sendTemplatedMail({
            pool,
            slug: 'admin_new_design',
            to: businessEmail,
            settings,
            vars,
            attachments,
            extraBodyLines: [
              `Tipo: ${isQuote ? 'Pidió presupuesto' : 'Guardó el diseño'}`,
              `Cliente: ${customerName || '—'}`,
              `Email: ${customerEmail || '—'}`,
              `WhatsApp: ${customerPhone || '—'}`,
              `Prenda: ${productTitle || '—'}${colorLabel ? ` · ${colorLabel}` : ''}`,
              isQuote ? `Cantidad: ${quantity || 1}` : null,
              notes ? `Notas: ${notes}` : null,
            ],
          })
        : { sent: false, skipped: true, reason: 'sin-destinatario' };

    res.json({
      success: true,
      customerEmail: customerResult,
      adminEmail: adminResult,
      emailSkipped: customerResult.skipped && adminResult.skipped,
    });
  } catch (error) {
    console.error('[email]', error);
    res.status(500).json({ error: 'No se pudo enviar el email: ' + error.message });
  }
});

// 9. Contenido web: trabajos, servicios, clientes
registerContentRoutes(app, pool, {
  path: 'trabajos',
  table: 'portfolio_works',
  fields: [
    { key: 'title' }, { key: 'category' }, { key: 'image_url' },
    { key: 'sort_order', default: 0 }, { key: 'is_active', default: true },
  ],
});

registerContentRoutes(app, pool, {
  path: 'servicios',
  table: 'site_services',
  fields: [
    { key: 'title' }, { key: 'description' }, { key: 'image_url' },
    { key: 'sort_order', default: 0 }, { key: 'is_active', default: true },
  ],
});

registerContentRoutes(app, pool, {
  path: 'clientes',
  table: 'client_brands',
  fields: [
    { key: 'name' }, { key: 'logo_url' },
    { key: 'sort_order', default: 0 }, { key: 'is_active', default: true },
  ],
});

registerContentRoutes(app, pool, {
  path: 'faqs',
  table: 'site_faqs',
  fields: [
    { key: 'question' }, { key: 'answer' },
    { key: 'sort_order', default: 0 }, { key: 'is_active', default: true },
  ],
});

// 10. Presupuestos
app.get('/api/quotes/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
          WHERE status NOT IN ('Cerrado', 'Aprobado') AND COALESCE(deposit_paid, false) = false
        ) AS abiertos,
        COUNT(*) FILTER (
          WHERE deposit_amount IS NOT NULL AND deposit_amount > 0
            AND COALESCE(deposit_paid, false) = false
            AND status NOT IN ('Cerrado')
        ) AS senas_pendientes_count,
        COALESCE(SUM(deposit_amount) FILTER (
          WHERE deposit_amount IS NOT NULL AND deposit_amount > 0
            AND COALESCE(deposit_paid, false) = false
            AND status NOT IN ('Cerrado')
        ), 0) AS senas_pendientes_monto,
        COUNT(*) FILTER (WHERE deposit_paid = true) AS senas_pagadas_count,
        COALESCE(SUM(deposit_amount) FILTER (WHERE deposit_paid = true), 0) AS senas_cobradas,
        COALESCE(SUM(admin_price) FILTER (WHERE admin_price IS NOT NULL AND status NOT IN ('Cerrado')), 0) AS total_cotizado,
        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM orders o WHERE o.quote_id = quotes.id)) AS convertidos,
        COUNT(*) FILTER (
          WHERE deposit_paid = true
            AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.quote_id = quotes.id)
        ) AS senas_sin_pedido
      FROM quotes
    `);
    const row = result.rows[0];
    const abiertos = Number(row.abiertos) || 0;
    const convertidos = Number(row.convertidos) || 0;
    const base = abiertos + convertidos;
    res.json({
      ...row,
      conversion_rate: base > 0 ? Math.round((convertidos / base) * 100) : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/quotes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT q.*, l.full_name AS client_name, l.phone AS client_phone, l.email AS client_email,
             d.product AS product_title, d.customer_comment,
             o.id AS order_id, o.order_code
      FROM quotes q
      LEFT JOIN leads l ON q.lead_id = l.id
      LEFT JOIN canvas_designs d ON q.design_id = d.id
      LEFT JOIN orders o ON o.quote_id = q.id
      ORDER BY q.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Arma y envía el mail de "te generamos un presupuesto" al cliente.
 * Devuelve el resultado del envío sin lanzar excepciones.
 */
async function notifyQuoteByEmail(quoteId) {
  const quoteRes = await pool.query(
    `SELECT q.*, l.full_name AS client_name, l.email AS client_email,
            d.product AS design_product
     FROM quotes q
     LEFT JOIN leads l ON q.lead_id = l.id
     LEFT JOIN canvas_designs d ON q.design_id = d.id
     WHERE q.id = $1`,
    [quoteId]
  );
  const quote = quoteRes.rows[0];
  if (!quote) return { sent: false, skipped: true, reason: 'presupuesto-inexistente' };
  if (!quote.client_email) return { sent: false, skipped: true, reason: 'cliente-sin-email' };

  const settings = await loadSettings(pool);
  const total = Number(quote.admin_price) || 0;
  const deposit = Number(quote.deposit_amount) || 0;

  return sendTemplatedMail({
    pool,
    slug: 'quote_created',
    to: quote.client_email,
    settings,
    vars: {
      nombre: quote.client_name || '',
      cliente: quote.client_name || '',
      prenda: quote.product_type || quote.design_product || 'prendas',
      cantidad: quote.quantity || 1,
      total: formatMoney(total) || 'a confirmar',
      sena: formatMoney(deposit) || 'a confirmar',
      saldo: formatMoney(Math.max(total - deposit, 0)),
    },
  });
}

/** Reenvía el mail del presupuesto cuando el admin lo pide desde el panel. */
app.post('/api/quotes/:id/notify', async (req, res) => {
  try {
    const result = await notifyQuoteByEmail(req.params.id);
    if (result.error) return res.status(502).json({ error: result.error });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/quotes', async (req, res) => {
  const {
    lead_id,
    design_id,
    quantity,
    product_type,
    color,
    notes,
    description,
    deposit_amount,
    product_source,
    catalog_item_id,
    admin_price,
    notify_email,
  } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO quotes (
         lead_id, design_id, quantity, product_type, color, notes, description,
         deposit_amount, product_source, catalog_item_id, admin_price, status
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Pendiente') RETURNING *`,
      [
        lead_id,
        design_id || null,
        quantity || 1,
        product_type || null,
        color || null,
        notes || null,
        description || null,
        deposit_amount != null && deposit_amount !== '' ? Number(deposit_amount) : null,
        product_source || (design_id ? 'web' : 'custom'),
        catalog_item_id || null,
        admin_price != null && admin_price !== '' ? Number(admin_price) : null,
      ]
    );
    const quote = result.rows[0];

    let emailResult = null;
    if (notify_email) {
      emailResult = await notifyQuoteByEmail(quote.id);
    }
    res.json({ ...quote, email: emailResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/quotes/:id', async (req, res) => {
  const { id } = req.params;
  const {
    status,
    admin_price,
    admin_notes,
    quantity,
    notes,
    description,
    deposit_amount,
    deposit_paid,
    product_type,
    color,
    product_source,
    catalog_item_id,
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE quotes SET
         status = COALESCE($1, status),
         admin_price = COALESCE($2, admin_price),
         admin_notes = COALESCE($3, admin_notes),
         quantity = COALESCE($4, quantity),
         notes = COALESCE($5, notes),
         description = COALESCE($6, description),
         deposit_amount = COALESCE($7, deposit_amount),
         deposit_paid = COALESCE($8, deposit_paid),
         product_type = COALESCE($9, product_type),
         color = COALESCE($10, color),
         product_source = COALESCE($11, product_source),
         catalog_item_id = COALESCE($12, catalog_item_id),
         deposit_paid_at = CASE
           WHEN $8 = true AND deposit_paid IS DISTINCT FROM true THEN CURRENT_TIMESTAMP
           WHEN $8 = false THEN NULL
           ELSE deposit_paid_at
         END
       WHERE id = $13 RETURNING *`,
      [
        status ?? null,
        admin_price !== undefined && admin_price !== '' ? Number(admin_price) : null,
        admin_notes !== undefined ? admin_notes : null,
        quantity ?? null,
        notes !== undefined ? notes : null,
        description !== undefined ? description : null,
        deposit_amount !== undefined && deposit_amount !== '' ? Number(deposit_amount) : null,
        typeof deposit_paid === 'boolean' ? deposit_paid : null,
        product_type !== undefined ? product_type : null,
        color !== undefined ? color : null,
        product_source !== undefined ? product_source : null,
        catalog_item_id !== undefined ? catalog_item_id : null,
        id,
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** Confirma seña pagada y crea el pedido de producción */
app.post('/api/quotes/:id/confirm-deposit', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const quoteRes = await client.query(
      `SELECT q.*, d.product AS design_product
       FROM quotes q
       LEFT JOIN canvas_designs d ON q.design_id = d.id
       WHERE q.id = $1
       FOR UPDATE OF q`,
      [id]
    );
    const quote = quoteRes.rows[0];
    if (!quote) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    const existingOrder = await client.query(
      `SELECT id, order_code FROM orders WHERE quote_id = $1 LIMIT 1`,
      [id]
    );
    if (existingOrder.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Ya existe el pedido ${existingOrder.rows[0].order_code} para este presupuesto`,
        order: existingOrder.rows[0],
      });
    }

    const deposit = Number(req.body.deposit_amount ?? quote.deposit_amount);
    if (!deposit || deposit <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Definí el monto de seña antes de confirmar' });
    }

    const totalPrice = Number(req.body.total_price ?? quote.admin_price) || deposit;
    const productType = quote.product_type || quote.design_product || 'Prenda';
    const description =
      quote.description ||
      [quote.quantity || 1, productType, quote.color].filter(Boolean).join(' · ') +
        (quote.notes ? `. ${quote.notes}` : '');

    const codeRes = await client.query(`
      SELECT COALESCE(MAX(
        CASE WHEN order_code ~ '^ORD-[0-9]+$'
        THEN CAST(SUBSTRING(order_code FROM 5) AS INTEGER) ELSE 0 END
      ), 0) + 1 AS next_num FROM orders
    `);
    const orderCode = `ORD-${String(codeRes.rows[0].next_num).padStart(3, '0')}`;

    const orderRes = await client.query(
      `INSERT INTO orders (
         order_code, lead_id, design_id, quote_id, quantity, total_price, status,
         payment_mode, deposit_amount, description, product_type, color
       ) VALUES ($1,$2,$3,$4,$5,$6,'Pendiente','seña_saldo',$7,$8,$9,$10)
       RETURNING *`,
      [
        orderCode,
        quote.lead_id,
        quote.design_id,
        quote.id,
        quote.quantity || 1,
        totalPrice,
        deposit,
        description,
        productType,
        quote.color || null,
      ]
    );
    const order = orderRes.rows[0];

    await client.query(
      `INSERT INTO order_payments (order_id, amount, payment_type, method, notes)
       VALUES ($1,$2,'seña',$3,$4)`,
      [
        order.id,
        deposit,
        req.body.method || 'Transferencia',
        req.body.notes || 'Seña confirmada desde presupuesto',
      ]
    );

    const updatedQuote = await client.query(
      `UPDATE quotes SET
         deposit_amount = $1,
         deposit_paid = true,
         deposit_paid_at = CURRENT_TIMESTAMP,
         status = 'Aprobado',
         admin_price = COALESCE($2, admin_price)
       WHERE id = $3 RETURNING *`,
      [deposit, totalPrice || null, id]
    );

    // Si el lead seguía como Prospecto, pasarlo a Cliente
    if (quote.lead_id) {
      await client.query(
        `UPDATE leads SET status = 'Cliente'
         WHERE id = $1 AND (status IS NULL OR status = 'Prospecto')`,
        [quote.lead_id]
      );
    }

    await client.query('COMMIT');
    res.json({ quote: updatedQuote.rows[0], order });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.delete('/api/quotes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM quotes WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10b. Prendas del personalizador (canvas_catalog_items)
function slugifyCanvas(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'prenda';
}

async function uniqueCanvasSlug(base) {
  let slug = base;
  let n = 2;
  while (true) {
    const exists = await pool.query('SELECT 1 FROM canvas_catalog_items WHERE slug = $1', [slug]);
    if (!exists.rows.length) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

app.get('/api/canvas-catalog', async (req, res) => {
  try {
    const publicReq = req.query.public === '1';
    const where = publicReq ? ' WHERE is_active = true' : '';
    const result = await pool.query(
      `SELECT * FROM canvas_catalog_items${where} ORDER BY sort_order ASC, title ASC, id ASC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/canvas-catalog', async (req, res) => {
  try {
    const {
      title,
      category,
      color_id,
      color_label,
      color_hex = '#ffffff',
      image_front_url,
      image_back_url = null,
      shirt_bounds = { top: 8, left: 14, width: 72, height: 82 },
      sort_order = 0,
      is_active = true,
    } = req.body;

    if (!title || !category || !color_id || !color_label || !image_front_url) {
      return res.status(400).json({
        error: 'Faltan campos: title, category, color_id, color_label, image_front_url',
      });
    }

    const slug = await uniqueCanvasSlug(
      `${slugifyCanvas(title)}-${slugifyCanvas(color_id || color_label)}`
    );

    const result = await pool.query(
      `INSERT INTO canvas_catalog_items
        (slug, title, category, color_id, color_label, color_hex,
         image_front_url, image_back_url, shirt_bounds, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)
       RETURNING *`,
      [
        slug,
        title,
        category,
        color_id,
        color_label,
        color_hex,
        image_front_url,
        image_back_url || image_front_url,
        JSON.stringify(shirt_bounds),
        sort_order,
        is_active !== false,
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** Actualiza título/categoría/bounds de todas las variantes de una prenda */
app.put('/api/canvas-catalog/group/meta', async (req, res) => {
  try {
    const { oldTitle, title, category, shirt_bounds, sort_order, is_active } = req.body;
    if (!oldTitle) return res.status(400).json({ error: 'oldTitle requerido' });

    const result = await pool.query(
      `UPDATE canvas_catalog_items SET
        title = COALESCE($1, title),
        category = COALESCE($2, category),
        shirt_bounds = COALESCE($3::jsonb, shirt_bounds),
        sort_order = COALESCE($4, sort_order),
        is_active = COALESCE($5, is_active)
       WHERE title = $6
       RETURNING *`,
      [
        title ?? null,
        category ?? null,
        shirt_bounds ? JSON.stringify(shirt_bounds) : null,
        sort_order ?? null,
        typeof is_active === 'boolean' ? is_active : null,
        oldTitle,
      ]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/canvas-catalog/group', async (req, res) => {
  try {
    const title = req.query.title;
    if (!title) return res.status(400).json({ error: 'title requerido' });
    await pool.query('DELETE FROM canvas_catalog_items WHERE title = $1', [title]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/canvas-catalog/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      color_id,
      color_label,
      color_hex,
      image_front_url,
      image_back_url,
      shirt_bounds,
      sort_order,
      is_active,
    } = req.body;

    const result = await pool.query(
      `UPDATE canvas_catalog_items SET
        title = COALESCE($1, title),
        category = COALESCE($2, category),
        color_id = COALESCE($3, color_id),
        color_label = COALESCE($4, color_label),
        color_hex = COALESCE($5, color_hex),
        image_front_url = COALESCE($6, image_front_url),
        image_back_url = COALESCE($7, image_back_url),
        shirt_bounds = COALESCE($8::jsonb, shirt_bounds),
        sort_order = COALESCE($9, sort_order),
        is_active = COALESCE($10, is_active)
       WHERE id = $11
       RETURNING *`,
      [
        title ?? null,
        category ?? null,
        color_id ?? null,
        color_label ?? null,
        color_hex ?? null,
        image_front_url ?? null,
        image_back_url ?? null,
        shirt_bounds ? JSON.stringify(shirt_bounds) : null,
        sort_order ?? null,
        typeof is_active === 'boolean' ? is_active : null,
        id,
      ]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/canvas-catalog/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM canvas_catalog_items WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Kanban: prospectos + pedidos unificados
app.get('/api/kanban', async (req, res) => {
  try {
    const prospects = await pool.query(`
      SELECT l.id, l.full_name AS title, l.phone, l.email, l.origin, l.status, l.created_at,
             'prospecto' AS type, NULL AS order_code, NULL AS quantity
      FROM leads l
      WHERE COALESCE(l.status, 'Prospecto') IN ('Prospecto', 'Cliente')
        AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.lead_id = l.id)
        AND NOT EXISTS (SELECT 1 FROM quotes q WHERE q.lead_id = l.id AND q.status != 'Cerrado')
      ORDER BY l.created_at DESC
    `);
    const orders = await pool.query(`
      SELECT o.id, l.full_name AS title, l.phone, l.email, o.status, o.created_at,
             'pedido' AS type, o.order_code, o.quantity
      FROM orders o
      LEFT JOIN leads l ON o.lead_id = l.id
      ORDER BY o.created_at DESC
    `);
    res.json({ prospectos: prospects.rows, pedidos: orders.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta comodín para manejo de errores
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en la API' });
});

export default app;