const crypto = require('crypto');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'tsu-borrow-secret-key-12345';

// Generate lightweight signed token (JWT style)
function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

// Verify token signature and decode payload
function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (signature !== expectedSignature) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch (e) {
    return null;
  }
}

// Express Middleware: Authenticate Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'โทเค็นไม่ถูกต้องหรือหมดอายุ' });
  }

  req.user = payload; // Attach user info (id, role, name)
  next();
}

// Express Middleware: Require Admin role
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่มีสิทธิ์ทำรายการนี้' });
  }
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  requireAdmin
};
