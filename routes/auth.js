const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('./authUtils');

// Register user (for testing / initial user creation)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'User exists' });
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hash, 'user']);
    return res.json({ ok: true });
  } catch (err) {
    console.error('REGISTER ERROR', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const [rows] = await pool.query('SELECT id, name, email, password, role FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Generate token containing id and role
    const token = generateToken({ id: user.id, name: user.name, role: user.role });

    return res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (err) {
    console.error('LOGIN ERROR', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Demo login token generator
router.post('/demo', (req, res) => {
  const { role } = req.body;
  const payload = role === 'admin' 
    ? { id: 1, name: 'ผู้ดูแลระบบ (Demo Admin)', role: 'admin' }
    : { id: 2, name: 'สมชาย นักศึกษาทดสอบ (Demo)', role: 'user' };
  const token = generateToken(payload);
  return res.json({ token, user: payload });
});

module.exports = router;
