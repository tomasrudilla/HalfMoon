import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
app.use(cors()); 
app.use(express.json({ limit: '10mb' }));

const { Pool } = pg;

// Conexión a Neon con configuración de seguridad optimizada
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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

    res.json({
      leadsTotales: leads.rows[0].count,
      disenosTotales: designs.rows[0].count,
      pedidosPendientes: orders.rows[0].count,
      ingresosProyectados: revenue.rows[0].sum || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Leads (GET, POST & PUT)
app.get('/api/leads', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/leads', async (req, res) => {
  const { nombre, telefono, email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO leads (full_name, phone, email, origin) VALUES ($1, $2, $3, $4) RETURNING id',
      [nombre, telefono, email, 'Canvas Web']
    );
    res.json({ success: true, leadId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, email, origin } = req.body;
  try {
    const result = await pool.query(
      'UPDATE leads SET full_name = $1, phone = $2, email = $3, origin = $4 WHERE id = $5 RETURNING *',
      [full_name, phone, email, origin, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Canvas Designs (GET, POST & DELETE)
app.get('/api/canvas-designs', async (req, res) => {
  try {
    const query = `
      SELECT d.*, d.product AS product_title, l.full_name as creator 
      FROM canvas_designs d
      INNER JOIN leads l ON d.lead_id = l.id
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
  const { business_name, support_email, whatsapp_number, whatsapp_message, notify_new_leads, notify_orders } = req.body;
  try {
    await pool.query(
      `UPDATE settings SET 
        business_name = $1, support_email = $2, whatsapp_number = $3, 
        whatsapp_message = $4, notify_new_leads = $5, notify_orders = $6 
       WHERE id = 1`,
      [business_name, support_email, whatsapp_number, whatsapp_message, notify_new_leads, notify_orders]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Catálogo de Productos (GET, POST, PUT, DELETE)
app.get('/api/productos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM catalog_items ORDER BY id DESC');
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
      SELECT
        COUNT(*) FILTER (WHERE status = 'Pendiente') AS pendientes,
        COUNT(*) FILTER (WHERE status = 'En Producción') AS en_produccion,
        COUNT(*) FILTER (WHERE status IN ('Listo', 'Listo / Esperando')) AS listos,
        COALESCE(SUM(total_price) FILTER (WHERE status IN ('Listo', 'En Producción', 'Pendiente')), 0) AS ingresos
      FROM orders
      WHERE status != 'Entregado'
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, l.full_name AS client_name, l.phone AS client_phone,
             d.product AS product_title
      FROM orders o
      LEFT JOIN leads l ON o.lead_id = l.id
      LEFT JOIN canvas_designs d ON o.design_id = d.id
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
  const { lead_id, design_id, quantity, total_price, status, delivery_date } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderCode = await nextOrderCode(client);
    const result = await client.query(
      `INSERT INTO orders (order_code, lead_id, design_id, quantity, total_price, status, delivery_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [orderCode, lead_id || null, design_id || null, quantity || 1, total_price || 0, status || 'Pendiente', delivery_date || null]
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
  const { lead_id, design_id, quantity, total_price, status, delivery_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE orders SET lead_id = $1, design_id = $2, quantity = $3, total_price = $4,
       status = $5, delivery_date = $6 WHERE id = $7 RETURNING *`,
      [lead_id, design_id || null, quantity, total_price, status, delivery_date, id]
    );
    res.json(result.rows[0]);
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

// 8. Envío de diseño por email (personalizador)
app.post('/api/send-design-email', async (req, res) => {
  const { customerName, customerEmail, productTitle, pngBase64 } = req.body;
  if (!customerEmail || !pngBase64) {
    return res.status(400).json({ error: 'Faltan email o imagen del diseño' });
  }

  try {
    const settingsRes = await pool.query('SELECT * FROM settings WHERE id = 1');
    const settings = settingsRes.rows[0] || {};
    const businessEmail = settings.support_email || process.env.SMTP_FROM;
    const businessName = settings.business_name || 'HalfMoon';

    const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    if (!smtpConfigured) {
      console.warn('[email] SMTP no configurado — diseño guardado sin envío de mail');
      return res.json({ success: true, emailSkipped: true });
    }

    const { default: nodemailer } = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const base64Data = pngBase64.replace(/^data:image\/png;base64,/, '');
    const attachment = { filename: 'halfmoon-diseno.png', content: base64Data, encoding: 'base64' };
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
      from: `"${businessName}" <${from}>`,
      to: customerEmail,
      subject: `Tu diseño HalfMoon — ${productTitle || 'Personalizado'}`,
      text: `Hola ${customerName || ''},\n\nRecibimos tu diseño en ${productTitle || 'prenda personalizada'}. Te contactamos pronto.\n\n— ${businessName}`,
      attachments: [attachment],
    });

    if (businessEmail && businessEmail !== customerEmail) {
      await transporter.sendMail({
        from: `"${businessName}" <${from}>`,
        to: businessEmail,
        subject: `Nuevo diseño web — ${customerName || customerEmail}`,
        text: `Cliente: ${customerName}\nEmail: ${customerEmail}\nPrenda: ${productTitle}\n\nDiseño adjunto en PNG.`,
        attachments: [attachment],
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[email]', error);
    res.status(500).json({ error: 'No se pudo enviar el email: ' + error.message });
  }
});

// Ruta comodín para manejo de errores
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en la API' });
});

export default app;