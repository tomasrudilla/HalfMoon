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

// 3. Leads (GET & POST)
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

// 4. Canvas Designs (GET & POST)
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

// Ruta comodín para manejo de errores
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en la API' });
});

export default app;