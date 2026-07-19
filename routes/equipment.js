const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const { authenticateToken, requireAdmin } = require('./authUtils');

// Get all equipment (Any logged in user)
router.get('/', authenticateToken, async (req, res) => {
  const { q, category } = req.query;
  let sql = 'SELECT * FROM equipment WHERE 1=1';
  const params = [];

  if (q) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY id DESC';

  try {
    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('GET EQUIPMENT ERROR', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Add new equipment (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, category, quantity, description, image } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'ชื่อและประเภทอุปกรณ์ห้ามว่าง' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO equipment (name, category, quantity, description, image) VALUES (?, ?, ?, ?, ?)',
      [name, category, quantity || 0, description || '', image || '']
    );
    return res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('ADD EQUIPMENT ERROR', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Update equipment (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, category, quantity, description, image } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'ชื่อและประเภทอุปกรณ์ห้ามว่าง' });
  }

  try {
    let sql = 'UPDATE equipment SET name = ?, category = ?, quantity = ?, description = ?';
    const params = [name, category, quantity || 0, description || ''];

    if (image !== undefined && image !== null) {
      sql += ', image = ?';
      params.push(image);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await pool.query(sql, params);
    return res.json({ ok: true });
  } catch (err) {
    console.error('UPDATE EQUIPMENT ERROR', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Delete equipment (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM equipment WHERE id = ?', [id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error('DELETE EQUIPMENT ERROR', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;
