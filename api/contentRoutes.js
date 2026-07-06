// Generic CRUD routes for content tables
export function registerContentRoutes(app, pool, { path, table, fields, publicOnly = false }) {
  const activeClause = publicOnly ? ' WHERE is_active = true' : '';

  app.get(`/api/${path}`, async (req, res) => {
    try {
      const publicReq = req.query.public === '1' || publicOnly;
      const where = publicReq ? ' WHERE is_active = true' : '';
      const result = await pool.query(
        `SELECT * FROM ${table}${where} ORDER BY sort_order ASC, id ASC`
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(`/api/${path}`, async (req, res) => {
    try {
      const cols = fields.map((f) => f.key);
      const vals = fields.map((f) => req.body[f.key] ?? f.default ?? null);
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      const result = await pool.query(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        vals
      );
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put(`/api/${path}/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const sets = fields.map((f, i) => `${f.key} = $${i + 1}`).join(', ');
      const vals = [...fields.map((f) => req.body[f.key] ?? f.default ?? null), id];
      const result = await pool.query(
        `UPDATE ${table} SET ${sets} WHERE id = $${fields.length + 1} RETURNING *`,
        vals
      );
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete(`/api/${path}/:id`, async (req, res) => {
    try {
      await pool.query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
