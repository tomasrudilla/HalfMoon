// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
app.use(cors()); 
app.use(express.json());

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 1. ESTADO DE CONEXIÓN
app.get('/api/estado', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT NOW()');
    res.json({ estado: 'Conectado a Neon exitosamente 🚀' });
  } catch (error) {
    res.status(500).json({ error: 'Error de conexión' });
  }
});

// 2. DASHBOARD: ESTADÍSTICAS REALES (Mapea los contadores dinámicamente)
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const leadsCount = await pool.query('SELECT COUNT(*) FROM leads');
    const designsCount = await pool.query('SELECT COUNT(*) FROM canvas_designs');
    const pendingOrders = await pool.query("SELECT COUNT(*) FROM orders WHERE status != 'Entregado'");
    const totalRevenue = await pool.query("SELECT SUM(total_price) FROM orders WHERE status = 'Listo' OR status = 'En Producción'");

    res.json({
      leadsTotales: leadsCount.rows[0].count,
      disenosTotales: designsCount.rows[0].count,
      pedidosPendientes: pendingOrders.rows[0].count,
      ingresosProyectados: totalRevenue.rows[0].sum || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. DASHBOARD: ÚLTIMOS LEADS (Combina la info del lead con su prenda elegida)
app.get('/api/dashboard/recent-leads', async (req, res) => {
  try {
    const query = `
      SELECT l.id, l.full_name, l.origin, l.created_at, d.product_title, d.bg_color, d.id as design_id
      FROM leads l
      LEFT JOIN canvas_designs d ON l.id = d.lead_id
      ORDER BY l.created_at DESC LIMIT 5
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. BASE DE DATOS DE CLIENTES / LEADS
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

// 5. DISEÑOS CANVAS (Trae los diseños con el nombre de quien lo hizo)
app.get('/api/canvas-designs', async (req, res) => {
  try {
    const query = `
      SELECT d.*, l.full_name as creator 
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

// 6. PEDIDOS Y PRODUCCIÓN
app.get('/api/orders', async (req, res) => {
  try {
    const query = `
      SELECT o.*, l.full_name, d.product_title
      FROM orders o
      INNER JOIN leads l ON o.lead_id = l.id
      LEFT JOIN canvas_designs d ON o.design_id = d.id
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. CATÁLOGO & PRECIOS
app.get('/api/catalogo', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM catalog_items ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. CONFIGURACIÓN DEL SISTEMA
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

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor Backend corriendo en http://localhost:${PORT}`));