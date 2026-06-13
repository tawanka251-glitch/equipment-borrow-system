const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const { authenticateToken, requireAdmin } = require('./authUtils');

// 1. Borrow Equipment (Authenticated Users)
router.post('/', authenticateToken, async (req, res) => {
  const { studentId, borrowerName, equipmentId, quantity, returnDate } = req.body;
  const qty = parseInt(quantity, 10) || 1;

  if (!equipmentId || qty < 1 || !returnDate) {
    return res.status(400).json({ error: 'กรุณาระบุอุปกรณ์ จำนวน และวันส่งคืนให้ครบถ้วน' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Fetch equipment stock
    const [eqRows] = await connection.query(
      'SELECT name, quantity, category FROM equipment WHERE id = ? FOR UPDATE',
      [equipmentId]
    );

    if (eqRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'ไม่พบอุปกรณ์นี้ในระบบ' });
    }

    const eq = eqRows[0];
    if (eq.quantity < qty) {
      await connection.rollback();
      return res.status(400).json({ error: `อุปกรณ์ไม่เพียงพอ คงเหลือ ${eq.quantity} ชิ้น` });
    }

    // Determine borrower and user variables based on roles
    let finalUserId = null;
    let finalBorrowerName = borrowerName;
    let finalStudentId = studentId;

    if (req.user.role === 'admin') {
      // Admin manual recording (can borrow for anyone with offline info)
      finalUserId = null; // offline user
      finalBorrowerName = borrowerName || 'แอดมินทำรายการ';
      finalStudentId = studentId || 'OFFLINE';
    } else {
      // Normal user: must borrow for themselves
      finalUserId = req.user.id;
      finalBorrowerName = req.user.name;
      
      // Look up student email/id from users table
      const [uRows] = await connection.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
      finalStudentId = uRows.length > 0 ? uRows[0].email : req.user.name;
    }

    // Deduct stock
    await connection.query(
      'UPDATE equipment SET quantity = quantity - ? WHERE id = ?',
      [qty, equipmentId]
    );

    // Insert history
    await connection.query(
      'INSERT INTO borrow_history (user_id, equipment_id, quantity, borrower_name, student_id, return_due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [finalUserId, equipmentId, qty, finalBorrowerName, finalStudentId, returnDate, 'borrowed']
    );

    await connection.commit();
    return res.json({ ok: true });
  } catch (err) {
    await connection.rollback();
    console.error('BORROW ERROR', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  } finally {
    connection.release();
  }
});

// 2. Return Equipment (Authenticated Users)
router.post('/return/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Fetch borrow record
    const [records] = await connection.query(
      'SELECT id, user_id, equipment_id, quantity, status FROM borrow_history WHERE id = ? FOR UPDATE',
      [id]
    );

    if (records.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'ไม่พบรายการยืมนี้ในระบบ' });
    }

    const record = records[0];
    if (record.status === 'returned') {
      await connection.rollback();
      return res.status(400).json({ error: 'รายการนี้ทำคืนไปแล้ว' });
    }

    // Authorization: Standard user can only return their OWN borrowings
    if (req.user.role !== 'admin' && record.user_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ทำรายการคืนสำหรับอุปกรณ์ของผู้อื่น' });
    }

    // Increment stock
    if (record.equipment_id) {
      await connection.query(
        'UPDATE equipment SET quantity = quantity + ? WHERE id = ?',
        [record.quantity, record.equipment_id]
      );
    }

    // Update history record
    await connection.query(
      'UPDATE borrow_history SET status = \'returned\', returned_at = NOW() WHERE id = ?',
      [id]
    );

    await connection.commit();
    return res.json({ ok: true });
  } catch (err) {
    await connection.rollback();
    console.error('RETURN ERROR', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  } finally {
    connection.release();
  }
});

// 3. User Active Borrows (Token-secured)
router.get('/my-active', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT h.*, e.name as equipmentName, e.category 
       FROM borrow_history h 
       LEFT JOIN equipment e ON h.equipment_id = e.id 
       WHERE h.user_id = ? AND h.status = 'borrowed' 
       ORDER BY h.borrowed_at DESC`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('GET MY ACTIVE ERROR', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// 4. User Borrow History (Token-secured)
router.get('/my-history', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT h.*, e.name as equipmentName, e.category 
       FROM borrow_history h 
       LEFT JOIN equipment e ON h.equipment_id = e.id 
       WHERE h.user_id = ? AND h.status = 'returned' 
       ORDER BY h.returned_at DESC`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('GET MY HISTORY ERROR', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// 5. Admin Active Borrows (Admin Only)
router.get('/all-active', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT h.*, e.name as equipmentName, e.category 
       FROM borrow_history h 
       LEFT JOIN equipment e ON h.equipment_id = e.id 
       WHERE h.status = 'borrowed' 
       ORDER BY h.borrowed_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('GET ALL ACTIVE ERROR', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// 6. Admin All History (Admin Only)
router.get('/all-history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT h.*, e.name as equipmentName, e.category 
       FROM borrow_history h 
       LEFT JOIN equipment e ON h.equipment_id = e.id 
       ORDER BY h.id DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('GET ALL HISTORY ERROR', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// 7. Dashboard Stats (Admin Only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 1. Total equipment in stock (available)
    const [availRows] = await pool.query('SELECT SUM(quantity) as total FROM equipment');
    const available = parseInt(availRows[0].total, 10) || 0;

    // 2. Currently borrowed
    const [borrowedRows] = await pool.query(
      'SELECT SUM(quantity) as total FROM borrow_history WHERE status = \'borrowed\''
    );
    const borrowed = parseInt(borrowedRows[0].total, 10) || 0;

    // Total = available + borrowed
    const totalEquipment = available + borrowed;

    // 3. Due back today
    const [dueRows] = await pool.query(
      'SELECT COUNT(*) as count FROM borrow_history WHERE status = \'borrowed\' AND DATE(return_due_date) = CURDATE()'
    );
    const dueToday = dueRows[0].count;

    return res.json({
      total: totalEquipment,
      borrowed: borrowed,
      available: available,
      dueToday: dueToday
    });
  } catch (err) {
    console.error('GET STATS ERROR', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;
