import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
app.use(cors()); 
app.use(express.json({ limit: '10mb' }));

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- TUS RUTAS (Todo igual, desde /api/estado hasta /api/settings) ---
// [Pegá aquí todo el contenido que tenías en tu server.js, desde el app.get('/api/estado')... hasta el app.post('/api/settings')]

// --- CAMBIO CRUCIAL PARA VERCEL ---
// Borrá la línea: app.listen(PORT, ...);
// Y agregá esto al final del archivo:

export default app;